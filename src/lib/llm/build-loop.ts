import { eq, desc, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { openrouter, modelForQuestion, withRetry } from "./openrouter";
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
  type: "function" as const,
  function: {
    name: "ask_next_question",
    description: "Ask the traveler exactly one question.",
    parameters: {
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
  },
};

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

function normalizeQuestion(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function isDuplicate(candidate: string, recents: { q: string }[]): boolean {
  const c = normalizeQuestion(candidate);
  if (c.length === 0) return false;
  return recents.some((r) => {
    const n = normalizeQuestion(r.q);
    return n === c || n.includes(c) || c.includes(n);
  });
}

const FALLBACK_QUESTIONS: QuestionPayload[] = [
  { type: "this_or_that", prompt: "Pick the trip that excites you more:", a: { label: "Two weeks roadtripping the Scottish Highlands", subtitle: "Castles, lochs, slow drives, single malts." }, b: { label: "Two weeks island-hopping in the Philippines", subtitle: "Boats, snorkeling, beach huts, fresh fish." } },
  { type: "slider", prompt: "How much planning vs. spontaneity feels right on a trip?", min: 0, max: 5, min_label: "fully spontaneous", max_label: "every hour planned" },
  { type: "free_text", prompt: "Describe the best meal you've ever had on a trip — where, what, who with." },
  { type: "multi_select", prompt: "Which of these would make you say 'this trip was a win'?", options: ["A view I won't forget", "A new skill learned", "Deep rest", "A great story to tell", "Made a new friend", "Tried something scary"] },
  { type: "true_false", statement: "I'd rather see one place deeply than three places superficially." },
];

export async function askNextQuestion(userId: string): Promise<QuestionPayload> {
  const profile = await loadProfileForRender(userId);
  const recents = await recentInteractions(userId);

  function buildUserBlock(extraInstruction: string): string {
    return [
      renderProfile(profile),
      "",
      "## Recent questions you have already asked this traveler",
      recents.length === 0 ? "(none yet)" : recents.map((r, i) => {
        const skipped = typeof r.a === "object" && r.a !== null && "skipped" in (r.a as Record<string, unknown>);
        const summary = skipped ? "(skipped — sensitive or low interest; do NOT re-ask this topic)" : JSON.stringify(r.a);
        return `${i + 1}. [${r.t}] ${r.q} → ${summary}`;
      }).join("\n"),
      "",
      "## HARD RULES (read carefully)",
      "1. The next question MUST be substantively different in topic AND wording from EVERY question listed above.",
      "2. Do NOT paraphrase, narrow, or broaden any previous question. Pick a new topic.",
      "3. If a previous question was skipped, do NOT revisit that topic for several turns.",
      "4. Vary the question_type across turns — don't pick the same type twice in a row.",
      extraInstruction,
      "",
      "Now call ask_next_question.",
    ].join("\n");
  }

  let userBlock = buildUserBlock("");

  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await withRetry(() => openrouter().chat.completions.create({
      model: modelForQuestion(),
      max_tokens: 600,
      temperature: 0.8,
      tools: [ASK_NEXT_TOOL],
      tool_choice: { type: "function", function: { name: "ask_next_question" } },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userBlock },
      ],
    }));
    console.error("[askNextQuestion attempt=" + attempt + "] raw response:",
      JSON.stringify({
        finish_reason: res.choices[0]?.finish_reason,
        message_content: res.choices[0]?.message?.content,
        tool_calls: res.choices[0]?.message?.tool_calls,
      }));
    const toolCall = res.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.type !== "function" || toolCall.function.name !== "ask_next_question") {
      console.error("[askNextQuestion] no usable tool_call, will retry/fallback");
      continue;
    }
    let input: unknown;
    try {
      input = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } catch (e) {
      console.error("[askNextQuestion] JSON.parse failed:", (e as Error).message, "arguments:", toolCall.function.arguments);
      continue;
    }
    const parsed = QuestionPayloadSchema.safeParse(input);
    if (!parsed.success) {
      console.error("[askNextQuestion] zod validation failed:", JSON.stringify(parsed.error.issues), "input:", JSON.stringify(input));
      continue;
    }

    const candidateText = "prompt" in parsed.data ? parsed.data.prompt : parsed.data.statement;
    if (isDuplicate(candidateText, recents)) {
      console.error("[askNextQuestion] duplicate detected:", candidateText);
      userBlock = buildUserBlock(`5. Your previous attempt was: "${candidateText}". That is a duplicate / paraphrase of a question already in the list. Pick a COMPLETELY different topic.`);
      continue;
    }
    return parsed.data;
  }

  console.error("[askNextQuestion] all 3 attempts failed, using hardcoded fallback");
  const used = new Set(recents.map((r) => normalizeQuestion(r.q)));
  return FALLBACK_QUESTIONS.find((q) => !used.has(normalizeQuestion("prompt" in q ? q.prompt : q.statement))) ?? FALLBACK_QUESTIONS[0];
}

const STRUCTURED_KEYS = ["partyComposition","budgetPerDayUsd","maxFlightHours","mobility","climatePreference","dietary","hardBlockers","foodAdventurousness","pace","preferredSeasons"] as const;

const UPDATE_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "set_structured_field",
      description: "Set one structured profile field. Use only the listed fields.",
      parameters: {
        type: "object",
        properties: { field: { type: "string", enum: STRUCTURED_KEYS as unknown as string[] }, value: {} },
        required: ["field","value"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "add_observation",
      description: "Add a free-form note about the traveler.",
      parameters: { type: "object", properties: { note: { type: "string" }, category: { type: "string", enum: ["preference","memory","constraint","trivia"] } }, required: ["note","category"] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "delete_observation",
      description: "Delete an existing observation by id (use only when the new answer contradicts an old observation).",
      parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "note_signal",
      description: "Record an internal signal.",
      parameters: { type: "object", properties: { kind: { type: "string", enum: ["coverage_good"] } }, required: ["kind"] },
    },
  },
];

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

  const res = await withRetry(() => openrouter().chat.completions.create({
    model: modelForQuestion(),
    max_tokens: 600,
    tools: UPDATE_TOOLS,
    messages: [
      { role: "system", content: "Update the traveler's profile based on the latest Q&A. Use only the provided tools." },
      { role: "user", content: userBlock },
    ],
  }));

  for (const toolCall of res.choices[0]?.message?.tool_calls ?? []) {
    if (toolCall.type !== "function") continue;
    let input: unknown;
    try { input = JSON.parse(toolCall.function.arguments); } catch { continue; }
    const name = toolCall.function.name;
    if (name === "set_structured_field") {
      const inp = input as { field: string; value: unknown };
      if (!STRUCTURED_KEYS.includes(inp.field as typeof STRUCTURED_KEYS[number])) continue;
      await db.update(schema.profiles).set({ [inp.field]: inp.value as never, updatedAt: new Date() }).where(eq(schema.profiles.userId, userId));
    } else if (name === "add_observation") {
      const inp = input as { note: string; category: string };
      await db.insert(schema.observations).values({ userId, note: inp.note, category: inp.category });
    } else if (name === "delete_observation") {
      const inp = input as { id: string };
      await db.delete(schema.observations).where(eq(schema.observations.id, inp.id));
    } else if (name === "note_signal") {
      await db.update(schema.profiles).set({ coverageSignals: sql`${schema.profiles.coverageSignals} + 1` }).where(eq(schema.profiles.userId, userId));
    }
  }
}
