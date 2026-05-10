# Haules — Product Brief

> A travel personalisation assistant that learns who you are by asking smarter questions, then answers your travel questions like it's known you for years.

**Prepared by:** Bogdan (product owner)
**Prepared for:** Agency partner
**Date:** May 2026
**Project status:** Greenfield. Looking for an agency to design and build the v1 web app.

---

## 1. The one-paragraph pitch

Haules is a web app that turns the slow, messy work of "getting to know a traveller" into a delightful series of bite-sized visual questions. As the traveller answers, the assistant — powered by a modern AI model — quietly builds a rich preference profile in the background. Whenever the traveller wants ("where should I go in October?", "plan me 5 days in Lisbon"), they switch to a chat tab and get answers that feel personally tailored, not generic. The profile keeps growing, the answers keep getting sharper.

Think: the friend who always knows the perfect restaurant for you, but for travel — and they only had to ask you a few interesting questions to learn how.

---

## 2. Why this exists (motivation)

Today, travellers asking AI for trip help get bland, generic answers because the AI knows nothing about them. So they either:

- **Spell it all out every time** ("I'm vegetarian, hate cruises, prefer shoulder-season, love coastal towns, max 8-hour flights, budget around €150/day…") — exhausting, and they always forget to mention something important.
- **Or they take the generic answer** and waste time filtering it down to what actually fits.

There are travel agents who learn you over time, but they cost a lot, you can only reach them in business hours, and they're a bottleneck. There are travel apps with quizzes, but the quizzes are short, one-shot, and produce a static "traveller type" label like "Adventurer" or "Foodie" — which is useless because nobody is just one of those.

**The opportunity:** a tool that learns you continuously, like a great human travel agent, but available 24/7 and grounded in real preferences (not personality buckets). The AI does the listening; the questions feel like a conversation, not a survey.

---

## 3. The core idea, in one sentence

> **Build the profile by asking, then use the profile to answer.**

Two surfaces sitting on top of one continuously-growing preference profile.

---

## 4. Who's it for

### Primary persona: "Bogdan-style" experienced traveller

- 30–50, takes 4–10 trips per year (mix of work, family, leisure)
- Already comfortable using ChatGPT-style tools but frustrated that they don't remember anything
- Has strong, specific preferences (food, climate, pace, budget) developed over years of travel
- Time-poor; values being "understood" without having to repeat themselves
- Will pay a small monthly fee for genuinely better answers

### Secondary persona: the planner-for-a-group

- Plans trips for partner / family / friends
- Wants the assistant to remember not just *their* preferences but the group's compromises ("we love beaches but Mom hates heat")
- Defers to the assistant for restaurants, day-trips, micro-decisions

(v1 scope is the primary persona. Group profiles are a v2 idea.)

---

## 5. The product, screen by screen

Haules has **three tabs** behind a simple email-and-password account.

### Tab A — "Build" (the heart of the product)

A single big card in the middle of the screen. The card shows **one question at a time**, picked by the AI based on what it's already learned about the traveller. The traveller answers, the card animates out, a "thinking…" beat passes, the next question card appears.

There's a tiny "skip this question" link below every card. Skipping is fine — the AI takes that as a soft signal ("either sensitive or unimportant to me") and moves to a different topic.

After every five answered questions, a small toast appears: *"5 new things added to your profile — peek at them on the Profile tab"*.

The questions never run out. This is not a 20-question wizard with a final score. It's an open loop the traveller can dip into for 90 seconds whenever they're bored. After the AI feels like it has good coverage, it starts asking weirder, more interesting questions instead of basics, and gently nudges: *"I feel like I know your travel style pretty well now — try the Ask tab anytime."*

#### The 8 question types — this is the visual signature of the product

The AI doesn't just send text questions. It picks **the right shape** for what it's trying to learn. There are 8 shapes:

| # | Shape | Looks like | Example question |
|---|-------|-----------|------------------|
| 1 | **Free text** | A textarea + "Submit" | *"What's your best memory from a vacation?"* |
| 2 | **Choose one** | 3–6 pills, single-select | *"Which of these beaches looks prettiest? 7 Mile Beach / Railay Beach / Mamaia / Ibiza"* |
| 3 | **This or That** | Two big cards side-by-side with a "VS" between | *"For a 7-night trip: Guatemala or Las Vegas?"* |
| 4 | **True / False** | A statement + a green True button + a red False button | *"I love nature."* |
| 5 | **Slider** | A 0-to-5 (or 0-to-10) slider with a label at each end | *"How much does food matter on a trip? 0 = couldn't care less, 5 = it's the main reason I travel"* |
| 6 | **Multi-select** | A grid of pills, tap to toggle, "Submit" when done | *"Which of these have you done and enjoyed? Hiking, Scuba, Cooking class, Bungee, Wine tasting, Surfing…"* |
| 7 | **Rank** | A list the traveller drags (or arrows) into order | *"Rank by how much you'd enjoy each: Beach + cocktails / Hiking a famous trail / Wandering old towns / Trying every restaurant on a list"* |
| 8 | **Number** | A single number input with a unit label | *"What's your typical daily budget on a trip? (USD)"* |

The agency should design these as **delightful, polished components** — they ARE the product. The AI generates the question and the options; the UI just renders the right shape. Animation between cards should feel friendly, not corporate.

### Tab B — "Ask"

A clean chat surface — like ChatGPT or Claude. The traveller types anything: *"Where should I go in October if I want sun without the European tourist crowds?"* or *"Plan a 4-day Lisbon trip for me and my partner, we land at noon Friday and leave Tuesday morning."*

Responses **stream in** word-by-word (do not make the user wait for a full reply).

The killer feature here is a small **"What made you say that?"** toggle on every response from the assistant. When the traveller clicks it, a little box expands underneath the response showing exactly which pieces of their profile the AI relied on (e.g. *"based on: budget_per_day = €150, climate_preference = warm, hard_blocker: 'no overnight flights', plus your observation about loving coastal towns."*).

This is the **trust mechanic.** The AI is making personal recommendations; the user needs to be able to verify that the recommendations are actually grounded in *their* profile, not made-up.

The traveller can run multiple chat threads (left sidebar lists past conversations). Each thread keeps its own history. Threads are auto-titled from the first question.

### Tab C — "Profile"

Two columns showing what Haules has learned.

**Left column — Structured fields:** A list of preference fields, each editable inline. Things like:
- Who do you usually travel with? (solo / couple / family with young kids / family with teens / friends)
- What's your daily budget?
- Maximum tolerable flight length?
- Mobility (high / moderate / low — affects how walkable a city should be)
- Climate preference
- Dietary needs / restrictions
- Hard blockers (a free-text list: things you absolutely won't do — "no cruises", "no overnight flights", etc.)
- How adventurous about food? (slider 0–5)
- Pace preference (slow / moderate / packed)

**Right column — Observations:** A scrollable list of free-form notes the AI has written about the traveller, in chronological order. Examples:
- *"Loves coastal towns more than mountain towns."*
- *"Best memory was eating bún chả in Hanoi at a tiny place with no English menu."*
- *"Indifferent to museums. Will go for one famous one but won't seek them out."*
- *"Has a 4-year-old; trips need to accommodate naptime and short walking distances."*

Each observation has a small "×" to delete. The traveller can also reset the entire profile from a button at the bottom (with a confirmation step — destructive).

This page is **the trust layer for the whole product.** Travellers should look at it and think *"yep, that's me."* If they see something wrong, they can fix it in 5 seconds. Nothing happens behind the user's back.

---

## 6. The vibe & brand direction

### Tone

- **Warm but not cute.** The assistant is a thoughtful concierge, not a chatbot mascot. No emoji-heavy responses, no "Hey there, traveller! 🌴".
- **Curious.** Questions should feel like a clever friend asking, not a form to fill out.
- **Honest.** When the AI doesn't know something, it says so. When it makes a recommendation, it shows its reasoning.

### Visual direction

- **Dark mode is the default and primary mode.** A travel-y, "evening light" feel — warm dark surfaces, soft accents, generous whitespace. Not a Bootstrap-y grey-on-grey.
- **One question at a time** centered on screen. The card is the hero. No sidebars cluttering the build experience.
- **Movement.** Cards should slide and fade between questions. The "thinking…" beat should feel intentional, not laggy. Streaming chat responses should have a subtle cursor/indicator.
- **Typography.** A modern, slightly bookish typeface for the question prompts. Bold but not aggressive.

### Naming and copy

- App name: **Haules** (working name — happy to revisit if you have a stronger one).
- Microcopy throughout should reinforce the "thoughtful friend" vibe: *"Take your time"*, *"Skip if it doesn't fit"*, *"Nice — 5 new things added"*.
- Avoid the word "questionnaire" or "survey". This is a **conversation**.

### Inspirations (mood, not ripoffs)

- The card-stack delight of Tinder's profile cards (without the dating connotation).
- The clean two-column layouts of Linear / Notion for the profile page.
- The reassuring streaming responses of Claude / ChatGPT, but wrapped in a more curated UI.
- The "shape per question" approach used by Typeform, but ours is **AI-driven** rather than designer-authored.

---

## 7. Functional requirements (must-have for v1)

### Account & sign-in
- Anyone can register with email + password.
- Standard log in / log out. Password ≥ 12 characters.
- A user's profile, observations, chat threads, and answer history are private to them.
- We do **not** need: password reset email, email verification, social login (Google/Apple), or magic links — these can come in v2 once there's pain.

### Build tab (the question loop)
- The AI picks the next question on every turn, based on what's in the profile + the last ~10 questions asked, so it doesn't repeat.
- The AI picks the right question shape from the 8 above for each question.
- "Skip this" is always available; skipped questions are recorded so the AI doesn't keep re-asking the same thing.
- After ~5 answered questions, surface the "5 new things added" toast.
- The loop is open-ended; the AI signals "I know you well now" gently after enough answers, but never blocks the user from continuing.

### Ask tab (the chat)
- Free-form chat with streaming responses.
- The AI's answers are grounded in the user's profile (which is automatically given to it as context).
- Every assistant response carries a "what made you say that?" toggle exposing which profile fields and observations were referenced.
- Multiple threads per user, listed in a sidebar, each auto-titled from the first question.
- Past threads persist — user can re-open any conversation and continue.

### Profile tab
- Both columns load instantly with the user's current data.
- Structured fields are editable inline; saving a change happens automatically (no "Save" button).
- Observations have a single-click delete (with subtle confirmation feedback, no modal).
- A "Reset entire profile" button at the bottom, with a confirmation step.

### Behind the scenes (briefly, for the agency)
- The AI provider is configurable — we want to be able to swap models easily. We're using OpenRouter currently, which lets us pick any of dozens of models with a single account.
- The system has guardrails to prevent runaway costs: a per-user daily limit on questions and chat messages, with a polite refusal past the cap.

### What's intentionally **out of scope** for v1
These are tempting to add but explicitly NOT in v1 — call them out if you think any are essential and we can discuss:

- Bookings / payments / actually purchasing a trip
- Real-time flight or hotel data integration
- Maps, geocoding, or "show me on a map"
- Image-based questions (e.g. "which photo do you prefer?")
- Group / shared profiles
- Mobile-native iOS / Android apps (web-only, but mobile-responsive)
- Public sharing of profiles or trips
- Email digests, push notifications
- Admin dashboard, analytics for us

---

## 8. Non-functional requirements

### Performance
- Question round-trip (submit answer → next question on screen) should feel snappy. Target: under 4 seconds at the 95th percentile.
- Chat responses should start streaming within 2 seconds of sending.
- The Profile page should feel instant.

### Reliability
- Saved answers should never be lost, even if the AI call fails. Show a polite "couldn't save your answer, try again" rather than a silent loss.
- If the AI provider is down, the app should still let the user log in, browse their profile, and read past chats.

### Security & privacy
- Passwords stored hashed (modern algorithm, not MD5 / SHA1).
- Sessions held in HTTP-only cookies.
- One user can never see another user's profile, observations, threads, or messages.
- We do **not** collect analytics in v1 — no third-party trackers, no Mixpanel, no GA. (We can add privacy-respecting analytics later if needed.)
- Profile data can be exported and deleted on request (manual process via support is fine for v1; no need for self-serve export).

### Accessibility
- Keyboard navigation throughout (no mouse-required actions).
- Visible focus states.
- Sufficient colour contrast in dark mode.
- Each question shape works with assistive tech (screen readers should be able to announce the question and the available answer options).

### Devices & browsers
- Desktop-first design (most usage will be a 10-minute coffee-break habit, so phone usage matters too — but desktop sets the tone).
- Last 2 years of Chrome, Safari, Firefox, Edge.
- Fully responsive. The card-based layout should work as well on a phone as on a 27" monitor.

---

## 9. User stories (so we're aligned on the experience)

### Story 1 — First session
> *Maria signs up, lands on the Build tab. The first question is a "this or that": "For a 7-night trip, where would you rather go: Iceland in February or Thailand in February?" She picks Thailand. Card slides out. Next question appears: a slider asking how much food matters on a trip. She drags it to 5. Next is a free-text: "Tell me about a meal you remember from a trip." She writes a paragraph about her grandmother's pierogis in Krakow. After question 5, a toast: "5 new things added to your profile." She's curious, clicks through to the Profile tab. Sees: 'climate_preference: warm', 'food_adventurousness: 5', and an observation: "Has a meaningful family connection to Polish food / Krakow." She smiles. Goes back to Build, answers a few more, then closes the tab. She's been on the site for 4 minutes.*

### Story 2 — A few weeks later
> *Maria comes back. She has a long weekend in October free. Switches straight to the Ask tab. Types: "Where should I go for a long weekend in October? I'm flying from Bucharest." Within 2 seconds the response starts streaming: a 4-paragraph answer that opens with "Given your love of warm climates, your high food adventurousness, and the fact that you flagged 'no overnight flights' in your profile, here are three options worth considering…" — each option includes a one-liner on why she'd specifically like it. She clicks "what made you say that?" and sees the citations: 'climate_preference: warm', 'food_adventurousness: 5', 'hard_blocker: no overnight flights', plus the observation about Krakow being meaningful. She's sold. The recommendation is for Lisbon.*

### Story 3 — A correction
> *Three months in, Maria notices that an observation says "Loves wine bars." She doesn't drink anymore. She clicks the × on that observation, and on the next chat she asks a follow-up question — and the next response no longer mentions wine bars. The fix took her 3 seconds.*

---

## 10. Success criteria for v1

If we hit these, v1 is a success:

1. **A new user can complete a full first session in under 5 minutes** (sign up → answer 5–10 questions → see their profile populated → ask one question and get a tailored answer).
2. **Answers feel personal.** A user reading an Ask response should think *"this is for me"*, not *"this is generic"*. We'll know this from qualitative feedback in early-user interviews.
3. **The "what made you say that?" toggle gets clicked.** Even if just once per session — it means trust is being established.
4. **A wrong fact in the profile can be fixed in under 10 seconds**, end-to-end.
5. **Daily-active retention.** Some non-trivial portion of users come back the next day to answer more questions or ask more things, without us having to nag them.

---

## 11. Constraints, preferences, and the working setup

### Tech preferences (not mandates — agency picks final stack)

- A modern web framework that supports server-side rendering (we're not building a CMS — we want fast first paint and good SEO on the marketing pages).
- A managed AI gateway (we use OpenRouter today) that lets us swap underlying models without code changes.
- A real database (not a JSON file). PostgreSQL is preferred but the agency can recommend.
- Mobile-responsive, but no native iOS / Android app in v1.

### Hosting

- We run a small homelab and would like the option to self-host (we currently use Coolify on a Proxmox host). The agency's stack should be containerisable (Docker) and shouldn't require any vendor lock-in (no Vercel-only features, no AWS-only services). If you're more comfortable on a managed cloud, that's fine — talk to us about portability.

### Budget guardrails

- AI calls cost money per question and per chat reply. The agency should design with cost in mind: avoid sending unnecessarily large prompts, cache where possible, and respect the per-user daily limits we've defined above.
- We expect daily AI cost per active user to stay under €0.20 in v1 with the smaller, cheaper models.

### Code & licensing

- The code we pay for is ours (work-for-hire, full IP transfer on final invoice).
- Repo lives in our GitHub org.
- We expect documentation: README, deployment guide, a one-page "how to swap the AI model" doc.

---

## 12. What we'd like the agency to deliver

### Phase 0 — Discovery (1 week)
- Confirm understanding of this brief.
- Push back on anything that doesn't make sense.
- Propose an approach (architecture diagram, stack choices, hosting plan).
- A flat fixed quote for Phase 1 + Phase 2.

### Phase 1 — Design (2–3 weeks)
- Mid-fidelity wireframes for all three tabs and the auth screens.
- Hi-fidelity designs in Figma for the same.
- Component library / design system covering the 8 question types, the chat surface, and the profile editor.
- Brand polish: logo lockup, colour tokens, type scale, motion guidelines.
- Two design reviews with us along the way.

### Phase 2 — Build (4–6 weeks)
- Build the v1 features in this brief.
- Unit + integration tests for the AI question loop, the auth flow, and the profile API.
- A staging environment we can use during the build.
- A clean handover: code in our GitHub, docs, deployment guide.

### Phase 3 — Launch & support (1 week + retainer)
- Help us deploy to our infrastructure (or a managed cloud if we agree on that).
- 30 days of post-launch support: bugfixes, small tweaks, onboarding of our first batch of users.
- Optional retainer for v2 features.

---

## 13. Open questions for the agency

We don't have answers to these and would value your input:

1. **Question shape #9?** Are there question shapes we're missing that would meaningfully expand what the AI can ask? (Image-pair? Map pin? Date range? Audio?)
2. **Onboarding sequence.** Should the very first session have a scripted opener (a few hand-crafted questions to establish the basics) before handing over to the AI? Or do we trust the AI from question 1?
3. **The "I know you well enough" moment.** How should the assistant signal this? A modest one-line nudge feels right — but should there be a small celebratory moment too?
4. **Mobile experience.** How aggressively should we invest in mobile-specific interactions (swipe between cards, haptic feedback)?
5. **Trust copy.** What's the right way to talk about the AI's reasoning without overpromising? "Based on your profile" feels too cold, "I think you'd love this because…" feels too anthropomorphised.
6. **Privacy framing.** How do we credibly tell users their travel preferences won't be sold or analysed for ads, in a way they actually believe?
7. **The pricing model.** Free with a soft cap? Subscription? Pay-per-trip? (Not your problem to solve, but if you have strong opinions from similar projects, we'd love to hear them.)

---

## 14. Closing note

This is a product where the **personality of the questions** and the **trust of the answers** matter more than any single feature. We don't need a Swiss Army knife. We need one thing done so well that travellers recommend it to friends.

If you read this brief and your reaction is *"OK, but what about a timeline view? What about a budget tracker? What about a packing list generator?"* — please push back on us, but know that our default answer is **no, not in v1**.

If you read this brief and your reaction is *"the question types are the magic — let's make them sing"* — we'll work well together.

Looking forward to your proposal.

— Bogdan
