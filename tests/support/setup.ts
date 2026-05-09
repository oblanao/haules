process.env.DATABASE_URL ??= "postgres://haules:haules@localhost:5433/haules_test";
process.env.OPENROUTER_API_KEY ??= "sk-or-test-key";
process.env.OPENROUTER_MODEL_QUESTION ??= "test/model-question";
process.env.OPENROUTER_MODEL_ASK ??= "test/model-ask";
process.env.SESSION_SECRET ??= "0".repeat(32);
(process.env as Record<string, string>).NODE_ENV = "test";
