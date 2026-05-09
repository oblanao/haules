import { z } from "zod";

const FreeText = z.object({ type: z.literal("free_text"), prompt: z.string().min(1).max(300) });
const ChooseOne = z.object({ type: z.literal("choose_one"), prompt: z.string().min(1).max(300),
  options: z.array(z.string().min(1).max(120)).min(3).max(6) });
const ThisOrThat = z.object({ type: z.literal("this_or_that"), prompt: z.string().min(1).max(300),
  a: z.object({ label: z.string().min(1).max(80), subtitle: z.string().max(160) }),
  b: z.object({ label: z.string().min(1).max(80), subtitle: z.string().max(160) }) });
const TrueFalse = z.object({ type: z.literal("true_false"), statement: z.string().min(1).max(300) });
const Slider = z.object({ type: z.literal("slider"), prompt: z.string().min(1).max(300),
  min: z.number().int(), max: z.number().int(),
  min_label: z.string().max(80), max_label: z.string().max(80) }).refine((s) => s.max > s.min, { message: "max must be > min" });
const MultiSelect = z.object({ type: z.literal("multi_select"), prompt: z.string().min(1).max(300),
  options: z.array(z.string().min(1).max(80)).min(3).max(10) });
const Rank = z.object({ type: z.literal("rank"), prompt: z.string().min(1).max(300),
  items: z.array(z.string().min(1).max(80)).min(3).max(6) });
const Number_ = z.object({ type: z.literal("number"), prompt: z.string().min(1).max(300),
  unit: z.string().max(20), min: z.number().optional(), max: z.number().optional() });

export const QuestionPayloadSchema = z.discriminatedUnion("type",
  [FreeText, ChooseOne, ThisOrThat, TrueFalse, Slider, MultiSelect, Rank, Number_]);
export type QuestionPayload = z.infer<typeof QuestionPayloadSchema>;
export const QUESTION_TYPES = ["free_text","choose_one","this_or_that","true_false","slider","multi_select","rank","number"] as const;

const Answers = z.discriminatedUnion("type", [
  z.object({ type: z.literal("free_text"), value: z.string().min(1).max(2000) }),
  z.object({ type: z.literal("choose_one"), value: z.string().min(1) }),
  z.object({ type: z.literal("this_or_that"), value: z.enum(["a","b"]) }),
  z.object({ type: z.literal("true_false"), value: z.boolean() }),
  z.object({ type: z.literal("slider"), value: z.number() }),
  z.object({ type: z.literal("multi_select"), value: z.array(z.string()).min(0) }),
  z.object({ type: z.literal("rank"), value: z.array(z.string()).min(2) }),
  z.object({ type: z.literal("number"), value: z.number() }),
]);
const Skipped = z.object({ skipped: z.literal(true) });
export const AnswerPayloadSchema = z.union([Answers, Skipped]);
export type AnswerPayload = z.infer<typeof AnswerPayloadSchema>;
