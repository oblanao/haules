import { describe, it, expect } from "vitest";
import { renderProfile } from "@/lib/llm/profile-render";

describe("renderProfile", () => {
  it("renders an empty profile cleanly", () => {
    const out = renderProfile({
      structured: { partyComposition: null, budgetPerDayUsd: null, maxFlightHours: null,
        mobility: null, climatePreference: null, dietary: null, hardBlockers: null,
        foodAdventurousness: null, pace: null, preferredSeasons: null, coverageSignals: 0 },
      observations: [],
    });
    expect(out).toContain("(no structured fields known yet)");
    expect(out).toContain("(no observations yet)");
  });

  it("includes set fields and observations", () => {
    const out = renderProfile({
      structured: {
        partyComposition: "couple", budgetPerDayUsd: 200, maxFlightHours: 8,
        mobility: "high", climatePreference: "tropical", dietary: ["no-pork"],
        hardBlockers: ["no cruises"], foodAdventurousness: 4, pace: "slow",
        preferredSeasons: ["shoulder"], coverageSignals: 1,
      },
      observations: [
        { id: "o1", note: "Loves coastal towns.", category: "preference" },
        { id: "o2", note: "Best memory: Hanoi street food.", category: "memory" },
      ],
    });
    expect(out).toMatch(/party_composition: couple/);
    expect(out).toMatch(/budget_per_day_usd: 200/);
    expect(out).toMatch(/dietary: \[no-pork\]/);
    expect(out).toMatch(/Loves coastal towns/);
    expect(out).toMatch(/\bo1\b/);
  });
});
