# Haules

LLM-powered, form-based travel personalization. Multi-user. Profile builds turn-by-turn from an LLM question loop via OpenRouter. Ask tab streams responses via OpenRouter.

## Local development

Requires Node 22+, Docker (for local Postgres).

```bash
npm install
docker run -d --name haules-pg -p 5433:5432 \
  -e POSTGRES_USER=haules -e POSTGRES_PASSWORD=haules -e POSTGRES_DB=haules \
  postgres:16
cp .env.example .env
# fill OPENROUTER_API_KEY and a 32+ char SESSION_SECRET
# set OPENROUTER_MODEL_QUESTION and OPENROUTER_MODEL_ASK to any OpenRouter model string
# (e.g. anthropic/claude-haiku-4.5, openai/gpt-4o-mini, google/gemini-flash-2.5)
# see https://openrouter.ai/models for all available model strings
npm run db:migrate
npm run dev
```

(The container is on host port 5433 because Windows machines often have a native Postgres on 5432. Adjust `DATABASE_URL` if you want 5432 and have nothing on it.)

Visit http://localhost:3000.

## Tests

The test harness uses the same Postgres container, in a `haules_test` database. Recreate the test DB if it doesn't exist:

```bash
docker exec haules-pg psql -U haules -c "CREATE DATABASE haules_test;"
npm test
```

## Deployment (Coolify)

1. Push to a GitHub repo Coolify can read.
2. In Coolify, create:
   - **Postgres service** named `haules-db`. Note its internal `DATABASE_URL` (Coolify gives one in the env panel).
   - **Application** of type `public repository`. Set `build_pack=nixpacks`. Set port to `3000`.
3. In the application's env panel:
   - `DATABASE_URL` → from the Postgres service
   - `OPENROUTER_API_KEY` → your OpenRouter key (get one at https://openrouter.ai)
   - `OPENROUTER_MODEL_QUESTION` → OpenRouter model string for the build loop (e.g. `anthropic/claude-haiku-4.5`)
   - `OPENROUTER_MODEL_ASK` → OpenRouter model string for the Ask tab (e.g. `anthropic/claude-sonnet-4.6`)
   - `SESSION_SECRET` → 32+ random chars
4. Deploy. After the first deploy succeeds, run `npm run db:migrate` once via Coolify's "execute command" or shell into the LXC and run from `/app`.
5. Add a Coolify scheduled task on the Postgres service: `pg_dump -U haules haules > /var/lib/coolify/backups/haules-$(date +\%F).sql` daily.

If nixpacks fails to build the Next.js standalone output, switch the app's `build_pack` to `dockerfile` — a minimal `Dockerfile` is included.

## Project structure

See `docs/superpowers/specs/2026-05-09-haules-design.md` for the design and `docs/superpowers/plans/2026-05-09-haules.md` for the implementation plan.
