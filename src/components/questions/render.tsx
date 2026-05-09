"use client";
import type { QuestionPayload, AnswerPayload } from "@/lib/llm/question-schemas";
import { FreeText } from "./free-text";
import { ChooseOne } from "./choose-one";
import { ThisOrThat } from "./this-or-that";
import { TrueFalse } from "./true-false";
import { Slider } from "./slider";
import { MultiSelect } from "./multi-select";
import { Rank } from "./rank";
import { NumberInput } from "./number";

export function RenderQuestion({ q, onSubmit }: { q: QuestionPayload; onSubmit: (a: AnswerPayload) => void }) {
  switch (q.type) {
    case "free_text":     return <FreeText prompt={q.prompt} onSubmit={(v) => onSubmit({ type: "free_text", value: v })} />;
    case "choose_one":    return <ChooseOne prompt={q.prompt} options={q.options} onSubmit={(v) => onSubmit({ type: "choose_one", value: v })} />;
    case "this_or_that":  return <ThisOrThat prompt={q.prompt} a={q.a} b={q.b} onSubmit={(v) => onSubmit({ type: "this_or_that", value: v })} />;
    case "true_false":    return <TrueFalse statement={q.statement} onSubmit={(v) => onSubmit({ type: "true_false", value: v })} />;
    case "slider":        return <Slider prompt={q.prompt} min={q.min} max={q.max} min_label={q.min_label} max_label={q.max_label} onSubmit={(v) => onSubmit({ type: "slider", value: v })} />;
    case "multi_select":  return <MultiSelect prompt={q.prompt} options={q.options} onSubmit={(v) => onSubmit({ type: "multi_select", value: v })} />;
    case "rank":          return <Rank prompt={q.prompt} items={q.items} onSubmit={(v) => onSubmit({ type: "rank", value: v })} />;
    case "number":        return <NumberInput prompt={q.prompt} unit={q.unit} min={q.min} max={q.max} onSubmit={(v) => onSubmit({ type: "number", value: v })} />;
  }
}
