import { describe, it, expect, vi, beforeEach } from "vitest";
import { setupTestDb } from "../../support/db";
import { db, schema } from "@/lib/db/client";

setupTestDb();

vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class MockAnthropic {
      messages = {
        create: vi.fn(),
      };
      constructor() {}
    },
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

async function makeUser() {
  const [u] = await db.insert(schema.users).values({ email: "x@x", passwordHash: "x" }).returning();
  await db.insert(schema.profiles).values({ userId: u.id });
  return u.id;
}

describe("askNextQuestion", () => {
  it("returns a parsed question payload from a tool_use response", async () => {
    const create = vi.fn().mockResolvedValue({
      stop_reason: "tool_use",
      content: [{ type: "tool_use", name: "ask_next_question", input: { type: "free_text", prompt: "Best memory?" } }],
    });
    vi.doMock("@/lib/llm/anthropic", () => ({
      anthropic: () => ({ messages: { create } }),
      MODELS: { question: "claude-haiku-4-5", ask: "claude-sonnet-4-6" },
      withRetry: <T>(fn: () => Promise<T>) => fn(),
    }));

    const { askNextQuestion } = await import("@/lib/llm/build-loop");
    const uid = await makeUser();
    const q = await askNextQuestion(uid);
    expect(q).toEqual({ type: "free_text", prompt: "Best memory?" });
    expect(create).toHaveBeenCalled();
  });

  it("retries once on a malformed payload before returning valid result", async () => {
    const create = vi.fn()
      .mockResolvedValueOnce({ stop_reason: "tool_use", content: [{ type: "tool_use", name: "ask_next_question", input: { type: "bogus" } }] })
      .mockResolvedValueOnce({ stop_reason: "tool_use", content: [{ type: "tool_use", name: "ask_next_question", input: { type: "true_false", statement: "I love nature" } }] });
    vi.doMock("@/lib/llm/anthropic", () => ({
      anthropic: () => ({ messages: { create } }),
      MODELS: { question: "claude-haiku-4-5", ask: "claude-sonnet-4-6" },
      withRetry: <T>(fn: () => Promise<T>) => fn(),
    }));
    const { askNextQuestion } = await import("@/lib/llm/build-loop");
    const uid = await makeUser();
    const q = await askNextQuestion(uid);
    expect(q.type).toBe("true_false");
    expect(create).toHaveBeenCalledTimes(2);
  });
});

describe("updateProfile", () => {
  it("applies set_structured_field and add_observation tool calls", async () => {
    const create = vi.fn().mockResolvedValue({
      stop_reason: "tool_use",
      content: [
        { type: "tool_use", name: "set_structured_field", input: { field: "partyComposition", value: "couple" } },
        { type: "tool_use", name: "add_observation", input: { note: "Loves coastal towns.", category: "preference" } },
        { type: "tool_use", name: "note_signal", input: { kind: "coverage_good" } },
      ],
    });
    vi.doMock("@/lib/llm/anthropic", () => ({
      anthropic: () => ({ messages: { create } }),
      MODELS: { question: "claude-haiku-4-5", ask: "claude-sonnet-4-6" },
      withRetry: <T>(fn: () => Promise<T>) => fn(),
    }));
    const { updateProfile } = await import("@/lib/llm/build-loop");
    const uid = await makeUser();
    await updateProfile(uid, { questionText: "?", questionType: "true_false", questionPayload: { type: "true_false", statement: "?" }, answerPayload: { type: "true_false", value: true } });
    const [p] = await db.select().from(schema.profiles).where((await import("drizzle-orm")).eq(schema.profiles.userId, uid));
    expect(p.partyComposition).toBe("couple");
    expect(p.coverageSignals).toBe(1);
    const obs = await db.select().from(schema.observations).where((await import("drizzle-orm")).eq(schema.observations.userId, uid));
    expect(obs).toHaveLength(1);
    expect(obs[0].note).toBe("Loves coastal towns.");
  });
});
