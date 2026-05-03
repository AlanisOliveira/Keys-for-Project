import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { mkdirSync } from "fs";
import { dirname, join } from "path";
import { randomUUID } from "crypto";

const DB_PATH = process.env.DB_PATH ?? join(process.cwd(), "data", "vault.db");
mkdirSync(dirname(DB_PATH), { recursive: true });
const ADMIN_CPF = process.env.ADMIN_CPF;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_CPF || !ADMIN_PASSWORD) {
  console.error("ADMIN_CPF and ADMIN_PASSWORD env vars are required.");
  process.exit(1);
}

const cpf = ADMIN_CPF.replace(/\D/g, "");
if (!/^\d{11}$/.test(cpf)) {
  console.error("ADMIN_CPF must be 11 digits.");
  process.exit(1);
}

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    cpf TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    client_name TEXT,
    description TEXT,
    color TEXT NOT NULL DEFAULT '#48C7F5',
    project_key_hash TEXT NOT NULL,
    created_by TEXT REFERENCES profiles(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS credentials (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    label TEXT NOT NULL,
    preview TEXT NOT NULL,
    environment TEXT,
    expires_at TEXT,
    encrypted_data TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    nickname TEXT NOT NULL,
    brand TEXT,
    last_four TEXT NOT NULL,
    cardholder_name TEXT,
    expiry_month TEXT,
    expiry_year TEXT,
    bank TEXT,
    card_type TEXT,
    environment TEXT,
    notes TEXT,
    encrypted_number TEXT NOT NULL,
    encrypted_cvv TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS access_logs (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    credential_id TEXT,
    card_id TEXT,
    action TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

const existing = db.prepare("SELECT id FROM profiles WHERE cpf = ?").get(cpf);
if (existing) {
  console.log("Admin profile already exists. Skipping.");
  process.exit(0);
}

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD!, 12);
  const id = randomUUID();

  db.prepare("INSERT INTO profiles (id, cpf, password_hash, role) VALUES (?, ?, ?, 'admin')").run(id, cpf, passwordHash);

  console.log(`Admin created: CPF=${cpf}, ID=${id}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
