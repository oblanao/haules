process.env.DATABASE_URL ??= "postgres://haules:haules@localhost:5433/haules_test";
process.env.ANTHROPIC_API_KEY ??= "sk-ant-test-key";
process.env.SESSION_SECRET ??= "0".repeat(32);
(process.env as Record<string, string>).NODE_ENV = "test";
