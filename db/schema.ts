import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const feedback = sqliteTable("feedback", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  createdAt: text("created_at").notNull(),
  createdBy: text("created_by").notNull(),
  email: text("email").notNull(),
  type: text("type").notNull(),
  category: text("category").notNull(),
  priority: text("priority").notNull(),
  details: text("details").notNull(),
  status: text("status").notNull().default("Open"),
});

export const practiceSessions = sqliteTable("practice_sessions", { id: text("id").primaryKey(), token: text("token").notNull().unique(), email: text("email").notNull(), expiresAt: integer("expires_at").notNull(), createdAt: text("created_at").notNull() });
export const bankCustomers = sqliteTable("bank_customers", { id: text("id").notNull(), sessionId: text("session_id").notNull(), firstName: text("first_name").notNull(), lastName: text("last_name").notNull(), createdAt: text("created_at").notNull() });
export const bankAccounts = sqliteTable("bank_accounts", { id: text("id").notNull(), sessionId: text("session_id").notNull(), customerId: text("customer_id").notNull(), balance: integer("balance").notNull(), createdAt: text("created_at").notNull() });
export const bankTransactions = sqliteTable("bank_transactions", { id: text("id").notNull(), sessionId: text("session_id").notNull(), accountId: text("account_id").notNull(), amount: integer("amount").notNull(), createdAt: text("created_at").notNull() });
