import { describe, it, expect } from "vitest";
import { QuestionPayloadSchema, AnswerPayloadSchema } from "@/lib/llm/question-schemas";

describe("question schemas", () => {
  it("accepts each of the 8 valid types", () => {
    expect(QuestionPayloadSchema.safeParse({ type: "free_text", prompt: "Best memory?" }).success).toBe(true);
    expect(QuestionPayloadSchema.safeParse({ type: "choose_one", prompt: "Pick", options: ["A","B","C"] }).success).toBe(true);
    expect(QuestionPayloadSchema.safeParse({ type: "this_or_that", prompt: "?", a: { label: "A", subtitle: "" }, b: { label: "B", subtitle: "" } }).success).toBe(true);
    expect(QuestionPayloadSchema.safeParse({ type: "true_false", statement: "I love nature" }).success).toBe(true);
    expect(QuestionPayloadSchema.safeParse({ type: "slider", prompt: "How much?", min: 0, max: 5, min_label: "low", max_label: "high" }).success).toBe(true);
    expect(QuestionPayloadSchema.safeParse({ type: "multi_select", prompt: "Pick all", options: ["A","B","C"] }).success).toBe(true);
    expect(QuestionPayloadSchema.safeParse({ type: "rank", prompt: "Order", items: ["A","B","C"] }).success).toBe(true);
    expect(QuestionPayloadSchema.safeParse({ type: "number", prompt: "Budget?", unit: "USD" }).success).toBe(true);
  });

  it("rejects choose_one with too few or too many options", () => {
    expect(QuestionPayloadSchema.safeParse({ type: "choose_one", prompt: "?", options: ["A","B"] }).success).toBe(false);
    expect(QuestionPayloadSchema.safeParse({ type: "choose_one", prompt: "?", options: ["A","B","C","D","E","F","G"] }).success).toBe(false);
  });

  it("validates answers per type", () => {
    expect(AnswerPayloadSchema.safeParse({ type: "free_text", value: "x" }).success).toBe(true);
    expect(AnswerPayloadSchema.safeParse({ type: "true_false", value: true }).success).toBe(true);
    expect(AnswerPayloadSchema.safeParse({ type: "slider", value: 3 }).success).toBe(true);
    expect(AnswerPayloadSchema.safeParse({ type: "rank", value: ["A","B","C"] }).success).toBe(true);
    expect(AnswerPayloadSchema.safeParse({ skipped: true }).success).toBe(true);
  });
});
