export interface RenderInput {
  structured: {
    partyComposition: string | null;
    budgetPerDayUsd: number | null;
    maxFlightHours: number | null;
    mobility: string | null;
    climatePreference: string | null;
    dietary: string[] | null;
    hardBlockers: string[] | null;
    foodAdventurousness: number | null;
    pace: string | null;
    preferredSeasons: string[] | null;
    coverageSignals: number;
  };
  observations: { id: string; note: string; category: string }[];
}

export function renderProfile(p: RenderInput): string {
  const fields: [string, unknown][] = [
    ["party_composition", p.structured.partyComposition],
    ["budget_per_day_usd", p.structured.budgetPerDayUsd],
    ["max_flight_hours", p.structured.maxFlightHours],
    ["mobility", p.structured.mobility],
    ["climate_preference", p.structured.climatePreference],
    ["dietary", p.structured.dietary],
    ["hard_blockers", p.structured.hardBlockers],
    ["food_adventurousness", p.structured.foodAdventurousness],
    ["pace", p.structured.pace],
    ["preferred_seasons", p.structured.preferredSeasons],
  ];
  const setFields = fields.filter(([, v]) => v !== null && !(Array.isArray(v) && v.length === 0));

  const structuredBlock = setFields.length === 0
    ? "(no structured fields known yet)"
    : setFields.map(([k, v]) => {
        if (Array.isArray(v)) return `- ${k}: [${v.join(", ")}]`;
        return `- ${k}: ${v}`;
      }).join("\n");

  const obsBlock = p.observations.length === 0
    ? "(no observations yet)"
    : p.observations.map((o) => `- (${o.id}) [${o.category}] ${o.note}`).join("\n");

  return [
    "## Traveler profile",
    "",
    "### Structured fields",
    structuredBlock,
    "",
    "### Observations (id, category, note)",
    obsBlock,
    "",
    `### Coverage signals so far: ${p.structured.coverageSignals}`,
  ].join("\n");
}
