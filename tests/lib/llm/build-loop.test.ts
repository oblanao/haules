import { describe, it, expect, vi, beforeEach } from "vitest";
import { setupTestDb } from "../../support/db";
import { db, schema } from "@/lib/db/client";

setupTestDb();

vi.mock("openai", () => {
  return {
    default: class MockOpenAI {
      chat = {
        completions: {
          create: vi.fn(),
        },
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
      choices: [{ message: { tool_calls: [{ id: "x", type: "function", function: { name: "ask_next_question", arguments: '{"type":"free_text","prompt":"Best memory?"}' } }] } }],
    });
    vi.doMock("@/lib/llm/openrouter", () => ({
      openrouter: () => ({ chat: { completions: { create } } }),
      modelForQuestion: () => "test/model-question",
      modelForAsk: () => "test/model-ask",
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
      .mockResolvedValueOnce({ choices: [{ message: { tool_calls: [{ id: "x", type: "function", function: { name: "ask_next_question", arguments: '{"type":"bogus"}' } }] } }] })
      .mockResolvedValueOnce({ choices: [{ message: { tool_calls: [{ id: "y", type: "function", function: { name: "ask_next_question", arguments: '{"type":"true_false","statement":"I love nature"}' } }] } }] });
    vi.doMock("@/lib/llm/openrouter", () => ({
      openrouter: () => ({ chat: { completions: { create } } }),
      modelForQuestion: () => "test/model-question",
      modelForAsk: () => "test/model-ask",
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
      choices: [{ message: { tool_calls: [
        { id: "a", type: "function", function: { name: "set_structured_field", arguments: '{"field":"partyComposition","value":"couple"}' } },
        { id: "b", type: "function", function: { name: "add_observation", arguments: '{"note":"Loves coastal towns.","category":"preference"}' } },
        { id: "c", type: "function", function: { name: "note_signal", arguments: '{"kind":"coverage_good"}' } },
      ] } }],
    });
    vi.doMock("@/lib/llm/openrouter", () => ({
      openrouter: () => ({ chat: { completions: { create } } }),
      modelForQuestion: () => "test/model-question",
      modelForAsk: () => "test/model-ask",
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
