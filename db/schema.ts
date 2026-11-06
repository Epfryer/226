import { pgTable, text, serial, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
});

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
  attempts: integer("attempts").notNull().default(0),
  errorCode: text("error_code"),
  tracking: jsonb("tracking"),
  nextAttemptAt: timestamp("next_attempt_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});