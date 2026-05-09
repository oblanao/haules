import { describe, it, expect } from "vitest";
import { extractCitations } from "@/lib/llm/citations";

describe("extractCitations", () => {
  it("returns null when no fenced citations block exists", () => {
    expect(extractCitations("Just a regular response.")).toEqual({ visible: "Just a regular response.", citations: null });
  });

  it("strips a trailing fenced citations block and parses it", () => {
    const raw = "Here is your answer.\n\n```citations\n{\"fields\":[\"budget_per_day_usd\"],\"observation_ids\":[\"abc\"]}\n```";
    const out = extractCitations(raw);
    expect(out.visible.trim()).toBe("Here is your answer.");
    expect(out.citations).toEqual({ fields: ["budget_per_day_usd"], observation_ids: ["abc"] });
  });

  it("returns null citations on malformed JSON", () => {
    const raw = "answer\n```citations\nnot json\n```";
    const out = extractCitations(raw);
    expect(out.citations).toBeNull();
    expect(out.visible.trim()).toBe("answer");
  });
});
