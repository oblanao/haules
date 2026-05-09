export interface Citations {
  fields: string[];
  observation_ids: string[];
}

const RE = /```citations\s*([\s\S]*?)```\s*$/;

export function extractCitations(raw: string): { visible: string; citations: Citations | null } {
  const m = raw.match(RE);
  if (!m) return { visible: raw, citations: null };

  const visible = raw.slice(0, m.index).trimEnd();

  try {
    const parsed = JSON.parse(m[1].trim());
    if (!parsed || !Array.isArray(parsed.fields) || !Array.isArray(parsed.observation_ids)) {
      return { visible, citations: null };
    }
    return { visible, citations: { fields: parsed.fields.map(String), observation_ids: parsed.observation_ids.map(String) } };
  } catch {
    return { visible, citations: null };
  }
}
