# Haules — Design Spec

**Date:** 2026-05-09
**Owner:** bogdan@chesscoders.com
**Status:** Approved (pending user review of this written spec)

## 1. Product summary

Haules is an LLM-powered, form-based travel personalization app. A traveler signs in, answers a stream of questions chosen on-the-fly by an LLM, and over time builds an evolving profile of their travel preferences. They can ask the LLM open questions ("where should I go in October?") at any time and get answers tailored to that profile.

The product is **not** an itinerary generator as its primary deliverable. The deliverable is the profile + the ability to ask anything against it. Itineraries fall out of the Ask tab as a special case of "ask anything".

### Primary user
Anyone who travels often enough to want better answers than generic search. Multi-user from day one. Email + password authentication.

### Success criteria
1. After ~20 questions, the Ask tab returns answers a stranger couldn't have written.
2. The traveler can read their profile and recognize themselves in it.
3. A wrong fact in the profile can be fixed by the traveler in under 10 seconds.
4. End-to-end question round-trip (submit → next question on screen) feels fast — target p95 < 4s.

## 2. UX shape

Three tabs behind a single auth gate.

### Tab A — Build profile (the core loop)
- One question card centered on screen.
- Card renders one of 8 question widgets (see §4).
- Submit answer → card animates out → "thinking…" indicator → next question card animates in.
- Soft category label above the question ("about you", "food", "logistics", etc.) provides orientation.
- "Skip this" link below every question. A skip is recorded with `{skipped: true}` and the LLM treats it as a soft signal (avoid repeating, infer sensitivity or low importance).
- After every ~5 answered questions, a small toast: "5 new things added to your profile" with a link to Tab C.
- When the LLM judges its coverage as "good", it (a) starts asking weirder/more hypothetical questions and (b) occasionally surfaces a one-line nudge: *"I feel like I know your travel style pretty well — try the Ask tab anytime."* The user is never forced to stop. The loop is open-ended.

### Tab B — Ask anything
- Plain chat surface. Single thread per session by default; user can start a new thread from a sidebar.
- Streamed responses (Server-Sent Events).
- Every assistant message has a small "what made you say that?" toggle that expands a brief citations block: which structured fields and which observation notes the LLM drew on. This is the trust mechanic.
- No question-widgets here — pure chat.

### Tab C — My profile
- Two columns.
  - **Left — structured fields:** each editable inline. Fields listed in §3.
  - **Right — observations:** chronological list of LLM-curated notes. Each note has a delete (×).
- Footer: "Reset entire profile" (with confirmation modal) — drops all structured fields and observations but keeps the user account, sessions, and chat history.

### Auth surface (v1)
`/register`, `/login`, `/logout`. Nothing else — no password reset, no email verification, no OAuth. These are explicitly deferred until there is concrete user pain.

## 3. Data model (Postgres, Drizzle ORM)

```
users
  id              uuid PK
  email           citext unique
  password_hash   text          -- argon2id
  created_at      timestamptz

sessions
  id              uuid PK         -- session token (sent as httpOnly cookie)
  user_id         uuid FK users
  expires_at      timestamptz
  created_at      timestamptz

profiles                          -- one per user; row inserted at registration
  user_id              uuid PK FK users
  party_composition    text         -- "solo" | "couple" | "family-young" | "family-teen" | "friends"
  budget_per_day_usd   int
  max_flight_hours     int
  mobility             text         -- "high" | "moderate" | "low"
  climate_preference   text         -- "tropical" | "temperate" | "cold" | "any"
  dietary              text[]       -- ["vegetarian", "no-pork", ...]
  hard_blockers        text[]       -- ["no overnight flights", "no cruises"]
  food_adventurousness smallint     -- 0..5
  pace                 text         -- "slow" | "moderate" | "packed"
  preferred_seasons    text[]       -- ["shoulder", "winter"]
  coverage_signals     int          -- count of "coverage_good" tool calls; drives the soft nudge
  updated_at           timestamptz

observations                      -- LLM-curated open notes
  id              uuid PK
  user_id         uuid FK users
  note            text            -- "Loves coastal towns; indifferent to museums."
  category        text            -- "preference" | "memory" | "constraint" | "trivia"
  created_at      timestamptz

interactions                      -- every Q&A turn in the build-profile loop, append-only audit
  id               uuid PK
  user_id          uuid FK users
  question_text    text
  question_type    text            -- one of the 8
  question_payload jsonb           -- e.g. options for choose-one, min/max for slider
  answer_payload   jsonb           -- what the user submitted (or {skipped:true})
  asked_at         timestamptz
  answered_at      timestamptz

chat_threads                      -- Ask-anything tab
  id              uuid PK
  user_id         uuid FK users
  title           text            -- LLM-generated short title
  created_at      timestamptz

chat_messages
  id              uuid PK
  thread_id       uuid FK chat_threads
  role            text            -- "user" | "assistant"
  content         text
  citations       jsonb           -- assistant only: structured fields + observation IDs cited
  created_at      timestamptz
```

Indexes on `user_id` on every user-owned table; `(thread_id, created_at)` on `chat_messages`; `(user_id, created_at)` on `interactions`.

`interactions` is append-only. If the LLM updates the profile based on an answer, we update the `profiles` row and/or insert/delete an `observations` row. The original answer always remains in `interactions` as the audit trail, so a wrong profile mutation is reversible by re-reading the source.

## 4. Question type taxonomy

Eight types. Each has a strict JSON schema the LLM must conform to in its `ask_next_question` tool call.

| # | Type           | Payload (LLM emits)                          | UI widget                  |
|---|----------------|----------------------------------------------|----------------------------|
| 1 | free_text      | `{prompt}`                                   | Textarea, submit button    |
| 2 | choose_one     | `{prompt, options: string[3..6]}`            | Pill list, single select   |
| 3 | this_or_that   | `{prompt, a:{label,subtitle}, b:{label,subtitle}}` | Two big cards side by side |
| 4 | true_false     | `{statement}`                                | Two buttons (True / False) |
| 5 | slider         | `{prompt, min, max, min_label, max_label}`   | Range slider with anchor labels |
| 6 | multi_select   | `{prompt, options: string[3..10]}`           | Toggleable pill grid       |
| 7 | rank           | `{prompt, items: string[3..6]}`              | Drag-reorderable list      |
| 8 | number         | `{prompt, unit, min?, max?}`                 | Number input               |

Server-side validation rejects malformed question payloads and asks the LLM to retry once before falling back to a free_text question.

## 5. LLM orchestration

### 5.1 Build-profile loop (Claude Haiku 4.5)

Two LLM calls per turn.

**Call 1 — `ask_next_question` (before showing the next card):**
- System prompt (cached): role description, the 8 question type schemas, instruction to avoid near-duplicates of recent questions, instruction to occasionally probe weak coverage areas, instruction to escalate weirdness when `coverage_signals >= 3`.
- User content: current full profile (structured fields + observations as bullet list) + last ~10 interactions in compact form `{type, q, a}`.
- Output: forced tool call with a discriminated-union JSON schema — one variant per question type, each with its required fields.

**Call 2 — `update_profile` (after the user submits an answer):**
- Tools available to the model:
  - `set_structured_field(field, value)` — only listed fields, validated server-side against the field's enum/range
  - `add_observation(note, category)`
  - `delete_observation(id)` — for corrections triggered by a contradictory answer
  - `note_signal(kind)` — currently just `coverage_good`; bumps `profiles.coverage_signals` and gates the soft nudge

Both calls use **prompt caching** on the system prompt + profile envelope so the marginal cost per turn stays low.

### 5.2 Ask anything (Claude Sonnet 4.6, streamed)

- System prompt: "You are Haules, a thoughtful travel concierge. The user's profile is below. Cite which fields/observations you're drawing on in a structured `citations` field at the end of your response."
- Profile injected into context (same renderer as the build loop).
- Last ~20 messages of the active thread.
- Streamed to the client via SSE.
- The model is instructed to emit citations as a fenced JSON block at the end of its response: ```` ```citations\n{"fields":["budget_per_day_usd","climate_preference"],"observation_ids":["..."]}\n``` ````. After streaming completes, a server-side parser strips the block from the visible content, validates the JSON, and stores it on the `chat_messages.citations` row. Malformed or missing citations are stored as `null` (UI hides the toggle in that case).

### 5.3 Cost ballpark

~$0.005 per question turn (input cached) and ~$0.02 per chat exchange. A heavy day for a single user is well under $1.

## 6. Architecture

Single Next.js 15 app (App Router), TypeScript everywhere.

- **DB:** Postgres deployed as a separate Coolify service on the same LXC, connected to the app via the internal Docker network. Drizzle ORM + drizzle-kit for migrations.
- **UI:** Tailwind v4 + shadcn/ui base components.
- **Auth:** `iron-session` for httpOnly cookie sessions; argon2id for password hashing (`@node-rs/argon2`).
- **LLM:** Anthropic SDK server-side only. API key in env, never shipped to the client.
- **Streaming:** Native Web Streams + SSE for the Ask tab.
- **Build/deploy:** Single repo deployed to Coolify with `build_pack=nixpacks` (Next.js standalone output enabled in `next.config.ts`). If nixpacks fails on the first deploy attempt, fall back to a minimal multi-stage `Dockerfile` and switch to `build_pack=dockerfile`. Postgres is a separate Coolify "service" (not a build).

### Folder shape

```
src/
  app/
    (marketing)/page.tsx          -- landing → login redirect
    register/page.tsx
    login/page.tsx
    app/
      layout.tsx                  -- nav, auth gate
      build/page.tsx              -- Tab A
      ask/page.tsx                -- Tab B
      profile/page.tsx            -- Tab C
    api/
      auth/[...]/route.ts
      build/next-question/route.ts
      build/answer/route.ts
      ask/[threadId]/route.ts     -- POST: streams SSE
      profile/route.ts            -- GET/PATCH/DELETE
  lib/
    db/                           -- drizzle schema, client
    llm/
      build-loop.ts               -- the two Haiku calls
      ask.ts                      -- the Sonnet call
      schemas.ts                  -- question-type JSON schemas
      profile-render.ts           -- profile → prompt envelope
    auth/
      argon.ts, session.ts
  components/
    questions/                    -- one file per question type widget
    chat/
    profile/
    ui/
```

### Environment variables

- `DATABASE_URL` — Coolify-injected
- `ANTHROPIC_API_KEY`
- `SESSION_SECRET` — 32+ random bytes, set in Coolify env panel
- `RATE_LIMIT_QUESTIONS_PER_DAY` (default 200)
- `RATE_LIMIT_CHAT_MESSAGES_PER_DAY` (default 100)

Nothing secret in the repo. `.gitignore` includes `.env*`, `.superpowers/`, `node_modules/`, `.next/`.

## 7. API surface (server-internal, app-only)

| Method | Path                                  | Purpose                                                          |
|--------|---------------------------------------|------------------------------------------------------------------|
| POST   | `/api/auth/register`                  | Create user; auto-login                                          |
| POST   | `/api/auth/login`                     | Issue session cookie                                             |
| POST   | `/api/auth/logout`                    | Destroy session                                                  |
| GET    | `/api/build/next-question`            | Returns next question payload (one of 8 types) and the new `interaction_id` |
| POST   | `/api/build/answer`                   | Body: `{interaction_id, answer}`; returns `{ok:true}` and triggers async profile update |
| GET    | `/api/threads`                        | List the user's chat threads (id, title, last message timestamp) |
| POST   | `/api/threads`                        | Create a new empty thread; returns `{id, title:null}`            |
| GET    | `/api/threads/:threadId/messages`     | Return all messages in a thread (for hydration on tab open)      |
| POST   | `/api/ask/:threadId`                  | Body: `{message}`; SSE stream of assistant tokens + citations    |
| GET    | `/api/profile`                        | Returns `{structured, observations[]}`                           |
| PATCH  | `/api/profile`                        | Body: partial structured fields; updates `profiles`              |
| DELETE | `/api/profile/observations/:id`       | Remove a single observation                                      |
| DELETE | `/api/profile`                        | Reset profile (structured + observations)                        |

All routes except `/api/auth/{register,login}` require a valid session cookie.

## 8. Out of scope for v1

- Password reset / email verification / OAuth
- Itinerary generation as a structured artifact (Ask tab can produce day-by-day text on request — that's enough for v1)
- Image-based question types (option pictures)
- Maps / geocoding
- Multi-traveler shared profiles ("plan a trip with my partner")
- Trip history / past trips data model
- Mobile-native app (web-only, mobile-responsive design only)
- Public sharing of profiles
- Admin/analytics surface

## 9. Risks and mitigations

| Risk                                                | Mitigation                                                                                                                                                   |
|-----------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| LLM repeats similar questions across turns          | Pass last ~10 question texts and instruct to avoid near-duplicates. If it persists in practice, add a server-side cosine-similarity check on `question_text`. |
| Bad structured-field extraction (LLM writes wrong field) | Every `set_structured_field` is logged via the source `interactions` row. User can revert from the profile page.                                            |
| Streaming costs / runaway prompts                   | Per-user daily cap (env-configurable, generous default). Polite refusal past the cap. Truncate chat history at 20 messages per request.                       |
| Coolify Postgres durability                         | Nightly `pg_dump` from the Postgres service to the host filesystem via Coolify scheduled task. Documented in ops setup, not part of v1 application code.     |
| Question-payload schema drift between LLM output and UI | Strict server-side validation per question type before returning to client; on validation failure, retry the LLM call once, fall back to a `free_text` question on second failure. |

## 10. Definition of done for v1

1. New user can register, log in, log out.
2. Build tab renders all 8 question types correctly and submits answers.
3. Profile updates after each answer (verifiable on the profile page).
4. Profile page allows inline edits to structured fields and per-row deletes of observations.
5. Reset profile works and is confirmed before destructive action.
6. Ask tab streams Sonnet 4.6 responses with citations expandable on every assistant message.
7. Daily caps enforced; over-cap requests refused politely.
8. Deployed to Coolify with Postgres co-located, accessible at the LAN URL, with `.env` driven config.
9. README documents env vars, deploy procedure, and the `pg_dump` backup setup.
