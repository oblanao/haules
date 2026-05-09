import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  integer,
  smallint,
  timestamp,
  jsonb,
  customType,
  primaryKey,
} from "drizzle-orm/pg-core";

const citext = customType<{ data: string }>({
  dataType() {
    return "citext";
  },
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: citext("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const profiles = pgTable("profiles", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  partyComposition: text("party_composition"),
  budgetPerDayUsd: integer("budget_per_day_usd"),
  maxFlightHours: integer("max_flight_hours"),
  mobility: text("mobility"),
  climatePreference: text("climate_preference"),
  dietary: text("dietary").array(),
  hardBlockers: text("hard_blockers").array(),
  foodAdventurousness: smallint("food_adventurousness"),
  pace: text("pace"),
  preferredSeasons: text("preferred_seasons").array(),
  coverageSignals: integer("coverage_signals").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const observations = pgTable("observations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  note: text("note").notNull(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const interactions = pgTable("interactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull(),
  questionPayload: jsonb("question_payload").notNull(),
  answerPayload: jsonb("answer_payload"),
  askedAt: timestamp("asked_at", { withTimezone: true }).notNull().defaultNow(),
  answeredAt: timestamp("answered_at", { withTimezone: true }),
});

export const chatThreads = pgTable("chat_threads", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  threadId: uuid("thread_id").notNull().references(() => chatThreads.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  citations: jsonb("citations"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ratelimitCounters = pgTable(
  "ratelimit_counters",
  {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    bucket: text("bucket").notNull(), // "questions" | "chat"
    day: text("day").notNull(), // YYYY-MM-DD UTC
    count: integer("count").notNull().default(0),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.bucket, t.day] }),
  }),
);
