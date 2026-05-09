import { db, schema } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { renderProfile } from "@/lib/llm/profile-render";
import { buildSystemBlock, ensureThreadOwned, loadAskContext, streamAsk } from "@/lib/llm/ask";
import { extractCitations } from "@/lib/llm/citations";
import { enforceLimit } from "@/lib/ratelimit";
import { eq } from "drizzle-orm";
import { z } from "zod";

const Body = z.object({ message: z.string().min(1).max(4000) });

export async function POST(req: Request, ctx: { params: Promise<{ threadId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  const { threadId } = await ctx.params;
  if (!(await ensureThreadOwned(user.id, threadId))) return new Response("not found", { status: 404 });

  const limit = await enforceLimit(user.id, "chat");
  if (!limit.ok) return new Response(JSON.stringify({ error: "rate_limited", message: limit.message }), { status: 429 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new Response("bad input", { status: 400 });

  await db.insert(schema.chatMessages).values({ threadId, role: "user", content: parsed.data.message });

  const ctxData = await loadAskContext(user.id, threadId);
  const profileText = renderProfile(ctxData.profile);
  const sys = buildSystemBlock(profileText);
  const history = ctxData.messages.filter((m) => m.role === "user" || m.role === "assistant").map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
  // user message we just inserted is now last in DB; exclude here since we pass it explicitly
  const stream = streamAsk(sys, history.slice(0, -1), parsed.data.message);

  // If thread has no title, set one based on first user message (truncate).
  if (history.length === 0) {
    const title = parsed.data.message.slice(0, 60);
    await db.update(schema.chatThreads).set({ title }).where(eq(schema.chatThreads.id, threadId));
  }

  const encoder = new TextEncoder();
  let assembled = "";

  const body = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            assembled += event.delta.text;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: event.delta.text })}\n\n`));
          }
        }
        const { visible, citations } = extractCitations(assembled);
        await db.insert(schema.chatMessages).values({ threadId, role: "assistant", content: visible, citations });
        controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({ citations })}\n\n`));
      } catch (e) {
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: (e as Error).message })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      "connection": "keep-alive",
    },
  });
}
