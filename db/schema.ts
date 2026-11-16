import { pgTable, text, serial, integer, timestamp, jsonb, boolean, uniqueIndex, index, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  role: text("role").notNull().default("visitor"),
  authVersion: integer("auth_version").notNull().default(1),
}, table => [
  uniqueIndex("users_username_normalized_unique").on(sql`lower(btrim(${table.username}))`),
  check("users_auth_role_check", sql`${table.role} IN ('visitor','owner')`),
]);

export const authSessions = pgTable("auth_sessions", {
  sid: text("sid").primaryKey(),
  data: jsonb("data").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
}, table => [index("auth_sessions_expiry").on(table.expiresAt)]);
export const authRateLimits = pgTable("auth_rate_limits", {
  key: text("key").primaryKey(),
  window: integer("window_id").notNull(),
  count: integer("count").notNull(),
});

// Application job checkpoints only; mirrored Stripe objects remain Stripe-owned.
export const shopSyncProgress = pgTable("shop_sync_progress", {
  accountKey: text("account_key").notNull(),
  objectType: text("object_type").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull(),
}, table => [
  uniqueIndex("shop_sync_progress_account_object_idx").on(table.accountKey, table.objectType),
]);

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  year: integer("year"),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

export const insertProjectSchema = createInsertSchema(projects);
export const selectProjectSchema = createSelectSchema(projects);
export type InsertProject = typeof projects.$inferInsert;
export type SelectProject = typeof projects.$inferSelect;

// App-owned checkout snapshots and fulfillment state, not a parallel Stripe catalog.
export const shopOrders = pgTable("shop_orders", {
  id: text("id").primaryKey(),
  ownerHash: text("owner_hash").notNull(),
  recipient: jsonb("recipient").notNull(),
  items: jsonb("items").notNull(),
  shippingRates: jsonb("shipping_rates").notNull(),
  subtotal: integer("subtotal").notNull(),
  shippingId: text("shipping_id"),
  shippingAmount: integer("shipping_amount"),
  expectedAmount: integer("expected_amount"),
  stripeSessionId: text("stripe_session_id").unique(),
  printfulOrderId: text("printful_order_id").unique(),
  status: text("status").notNull().default("quote"),
  paid: boolean("paid").notNull().default(false),
  testMode: boolean("test_mode").notNull().default(true),
  marketingConsentRecorded: boolean("marketing_consent_recorded").notNull().default(false),
  attempts: integer("attempts").notNull().default(0),
  errorCode: text("error_code"),
  tracking: jsonb("tracking"),
  nextAttemptAt: timestamp("next_attempt_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, table => [
  // id is a trailing key because this Drizzle version has no INCLUDE support.
  index("shop_orders_reconciliation_due_idx")
    .on(table.nextAttemptAt, table.createdAt, table.id)
    .where(sql`${table.stripeSessionId} IS NOT NULL AND ${table.status} IN ('awaiting_payment','paid','processing','needs_attention','fulfilled') AND ${table.attempts} < 8`),
]);

export const shopSubscribers = pgTable("shop_subscribers", {
  email: text("email").primaryKey(),
  consentText: text("consent_text").notNull(),
  consentedAt: timestamp("consented_at", { withTimezone: true }).notNull().defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
  unsubscribeToken: text("unsubscribe_token").notNull().unique(),
});

export const shopReceipts = pgTable("shop_receipts", {
  orderId: text("order_id").primaryKey().references(() => shopOrders.id, { onDelete: "cascade" }),
  data: jsonb("data").notNull(),
  statusTokenHash: text("status_token_hash").unique(),
  status: text("status").notNull().default("pending"),
  attempts: integer("attempts").notNull().default(0),
  nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
});