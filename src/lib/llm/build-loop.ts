import type Anthropic from "@anthropic-ai/sdk";
import { eq, desc, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { anthropic, MODELS, withRetry } from "./anthropic";
import { renderProfile } from "./profile-render";
import { QuestionPayloadSchema, type QuestionPayload, type AnswerPayload } from "./question-schemas";

const SYSTEM_PROMPT = `You are Haules, a thoughtful travel concierge interviewing a traveler to build their preference profile.

Your job each turn is to call the ask_next_question tool with ONE question. Pick the most useful next question based on:
- Gaps in their structured profile (party composition, budget, mobility, climate, dietary, pace, etc.)
- Threads worth pulling on from their observations
- Variety: do not repeat any question similar to one of the recent questions
- When coverage_signals >= 3, prefer weirder/hypothetical questions over basics

Choose the question type that fits the question:
- free_text for narrative / open replies
- choose_one for 3-6 mutually exclusive concrete options
- this_or_that for binary visual comparisons (use it!)
- true_false for sharp belief statements
- slider for graded preferences (0-5 or 0-10)
- multi_select for "pick all that apply"
- rank for prioritization
- number for precise inputs (budget, hours, etc.)

Always respond with ONE tool call. Never reply in plain text.`;

const ASK_NEXT_TOOL = {
  name: "ask_next_question",
  description: "Ask the traveler exactly one question.",
  input_schema: {
    type: "object",
    oneOf: [
      { properties: { type: { const: "free_text" }, prompt: { type: "string" } }, required: ["type","prompt"] },
      { properties: { type: { const: "choose_one" }, prompt: { type: "string" }, options: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 6 } }, required: ["type","prompt","options"] },
      { properties: { type: { const: "this_or_that" }, prompt: { type: "string" },
        a: { type: "object", properties: { label: { type: "string" }, subtitle: { type: "string" } }, required: ["label","subtitle"] },
        b: { type: "object", properties: { label: { type: "string" }, subtitle: { type: "string" } }, required: ["label","subtitle"] } },
        required: ["type","prompt","a","b"] },
      { properties: { type: { const: "true_false" }, statement: { type: "string" } }, required: ["type","statement"] },
      { properties: { type: { const: "slider" }, prompt: { type: "string" }, min: { type: "integer" }, max: { type: "integer" }, min_label: { type: "string" }, max_label: { type: "string" } }, required: ["type","prompt","min","max","min_label","max_label"] },
      { properties: { type: { const: "multi_select" }, prompt: { type: "string" }, options: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 10 } }, required: ["type","prompt","options"] },
      { properties: { type: { const: "rank" }, prompt: { type: "string" }, items: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 6 } }, required: ["type","prompt","items"] },
      { properties: { type: { const: "number" }, prompt: { type: "string" }, unit: { type: "string" }, min: { type: "number" }, max: { type: "number" } }, required: ["type","prompt","unit"] },
    ],
  },
} as const;

async function loadProfileForRender(userId: string) {
  const [structured] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, userId));
  const observations = await db.select({ id: schema.observations.id, note: schema.observations.note, category: schema.observations.category })
    .from(schema.observations).where(eq(schema.observations.userId, userId)).orderBy(desc(schema.observations.createdAt));
  return { structured, observations };
}

async function recentInteractions(userId: string, n = 10) {
  return db.select({ q: schema.interactions.questionText, t: schema.interactions.questionType, a: schema.interactions.answerPayload })
    .from(schema.interactions).where(eq(schema.interactions.userId, userId))
    .orderBy(desc(schema.interactions.askedAt)).limit(n);
}

export async function askNextQuestion(userId: string): Promise<QuestionPayload> {
  const profile = await loadProfileForRender(userId);
  const recents = await recentInteractions(userId);
  const userBlock = [
    renderProfile(profile),
    "",
    "## Recent questions (avoid duplicates / near-duplicates)",
    recents.length === 0 ? "(none yet)" : recents.map((r, i) => `${i + 1}. [${r.t}] ${r.q} → ${JSON.stringify(r.a)}`).join("\n"),
    "",
    "Now call ask_next_question with the single best next question.",
  ].join("\n");

  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await withRetry(() => anthropic().messages.create({
      model: MODELS.question,
      max_tokens: 600,
      tools: [ASK_NEXT_TOOL] as unknown as Anthropic.Messages.Tool[],
      tool_choice: { type: "tool", name: "ask_next_question" },
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userBlock }],
    }));
    const block = res.content.find((c: { type: string; name?: string }) => c.type === "tool_use" && c.name === "ask_next_question");
    if (!block || block.type !== "tool_use") continue;
    const parsed = QuestionPayloadSchema.safeParse((block as { input: unknown }).input);
    if (parsed.success) return parsed.data;
  }
  return { type: "free_text", prompt: "What's the most surprising thing you've ever done on a trip?" };
}

const STRUCTURED_KEYS = ["partyComposition","budgetPerDayUsd","maxFlightHours","mobility","climatePreference","dietary","hardBlockers","foodAdventurousness","pace","preferredSeasons"] as const;

const UPDATE_TOOLS = [
  {
    name: "set_structured_field",
    description: "Set one structured profile field. Use only the listed fields.",
    input_schema: {
      type: "object",
      properties: { field: { type: "string", enum: STRUCTURED_KEYS as unknown as string[] }, value: {} },
      required: ["field","value"],
    },
  },
  {
    name: "add_observation",
    description: "Add a free-form note about the traveler.",
    input_schema: { type: "object", properties: { note: { type: "string" }, category: { type: "string", enum: ["preference","memory","constraint","trivia"] } }, required: ["note","category"] },
  },
  {
    name: "delete_observation",
    description: "Delete an existing observation by id (use only when the new answer contradicts an old observation).",
    input_schema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "note_signal",
    description: "Record an internal signal.",
    input_schema: { type: "object", properties: { kind: { type: "string", enum: ["coverage_good"] } }, required: ["kind"] },
  },
] as const;

export interface UpdateContext {
  questionText: string;
  questionType: string;
  questionPayload: unknown;
  answerPayload: AnswerPayload;
}

export async function updateProfile(userId: string, ctx: UpdateContext): Promise<void> {
  const profile = await loadProfileForRender(userId);
  const userBlock = [
    renderProfile(profile),
    "",
    "## Latest Q&A",
    `Question (${ctx.questionType}): ${ctx.questionText}`,
    `Question payload: ${JSON.stringify(ctx.questionPayload)}`,
    `Answer: ${JSON.stringify(ctx.answerPayload)}`,
    "",
    "Apply 0..N tool calls to update the profile based on this answer. If you've gathered enough breadth, also call note_signal with coverage_good.",
  ].join("\n");

  const res = await withRetry(() => anthropic().messages.create({
    model: MODELS.question,
    max_tokens: 600,
    tools: UPDATE_TOOLS as unknown as Anthropic.Messages.Tool[],
    system: [{ type: "text", text: "Update the traveler's profile based on the latest Q&A. Use only the provided tools.", cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: userBlock }],
  }));

  for (const block of res.content) {
    if (block.type !== "tool_use") continue;
    if (block.name === "set_structured_field") {
      const input = block.input as { field: string; value: unknown };
      if (!STRUCTURED_KEYS.includes(input.field as typeof STRUCTURED_KEYS[number])) continue;
      await db.update(schema.profiles).set({ [input.field]: input.value as never, updatedAt: new Date() }).where(eq(schema.profiles.userId, userId));
    } else if (block.name === "add_observation") {
      const input = block.input as { note: string; category: string };
      await db.insert(schema.observations).values({ userId, note: input.note, category: input.category });
    } else if (block.name === "delete_observation") {
      const input = block.input as { id: string };
      await db.delete(schema.observations).where(eq(schema.observations.id, input.id));
    } else if (block.name === "note_signal") {
      await db.update(schema.profiles).set({ coverageSignals: sql`${schema.profiles.coverageSignals} + 1` }).where(eq(schema.profiles.userId, userId));
    }
  }
}
