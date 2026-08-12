import { env } from "cloudflare:workers";

const statements = [
  `CREATE TABLE IF NOT EXISTS practice_sessions (id TEXT PRIMARY KEY, token TEXT NOT NULL UNIQUE, email TEXT NOT NULL, expires_at INTEGER NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS bank_customers (id TEXT NOT NULL, session_id TEXT NOT NULL, first_name TEXT NOT NULL, middle_name TEXT NOT NULL, last_name TEXT NOT NULL, suffix TEXT NOT NULL, short_name TEXT NOT NULL, maiden_name TEXT NOT NULL, date_of_birth TEXT NOT NULL, is_minor_customer INTEGER NOT NULL, gender TEXT NOT NULL, birth_country TEXT NOT NULL, nationality TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY (session_id, id))`,
  `CREATE TABLE IF NOT EXISTS bank_accounts (id TEXT NOT NULL, session_id TEXT NOT NULL, customer_id TEXT NOT NULL, account_type TEXT NOT NULL, nickname TEXT NOT NULL, currency TEXT NOT NULL, balance REAL NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY (session_id, id))`,
  `CREATE TABLE IF NOT EXISTS bank_transactions (id TEXT NOT NULL, session_id TEXT NOT NULL, account_id TEXT NOT NULL, type TEXT NOT NULL, amount REAL NOT NULL, currency TEXT NOT NULL, reference TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY (session_id, id))`,
  `CREATE INDEX IF NOT EXISTS idx_customers_session ON bank_customers (session_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_accounts_session_customer ON bank_accounts (session_id, customer_id)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_session_account ON bank_transactions (session_id, account_id, created_at DESC)`,
];

let initialized = false;
export async function db() {
  const database = env.DB as D1Database;
  if (!initialized) { await database.batch(statements.map((sql) => database.prepare(sql))); initialized = true; }
  return database;
}
export function id(prefix: string) { return `${prefix}-${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`; }
export function customerFromRow(row: Record<string, unknown>) { return { id: row.id, firstName: row.first_name, middleName: row.middle_name, lastName: row.last_name, suffix: row.suffix, shortName: row.short_name, maidenName: row.maiden_name, dateOfBirth: row.date_of_birth, isMinorCustomer: Boolean(row.is_minor_customer), gender: row.gender, birthCountry: row.birth_country, nationality: row.nationality, status: row.status, createdAt: row.created_at }; }
export function accountFromRow(row: Record<string, unknown>) { return { id: row.id, customerId: row.customer_id, accountType: row.account_type, nickname: row.nickname, currency: row.currency, balance: row.balance, status: row.status, createdAt: row.created_at }; }
export function transactionFromRow(row: Record<string, unknown>) { return { id: row.id, type: row.type, amount: row.amount, currency: row.currency, reference: row.reference, createdAt: row.created_at }; }
