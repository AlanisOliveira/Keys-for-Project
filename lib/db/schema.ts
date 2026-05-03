import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  cpf: text("cpf").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  role: text("role").notNull().default("admin"),
  created_at: text("created_at").default(sql`(datetime('now'))`),
});

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  client_name: text("client_name"),
  description: text("description"),
  color: text("color").notNull().default("#48C7F5"),
  project_key_hash: text("project_key_hash").notNull(),
  created_by: text("created_by").references(() => profiles.id),
  created_at: text("created_at").default(sql`(datetime('now'))`),
  updated_at: text("updated_at").default(sql`(datetime('now'))`),
});

export const credentials = sqliteTable("credentials", {
  id: text("id").primaryKey(),
  project_id: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  label: text("label").notNull(),
  preview: text("preview").notNull(),
  environment: text("environment"),
  expires_at: text("expires_at"),
  encrypted_data: text("encrypted_data", { mode: "json" }).notNull(),
  created_at: text("created_at").default(sql`(datetime('now'))`),
  updated_at: text("updated_at").default(sql`(datetime('now'))`),
});

export const cards = sqliteTable("cards", {
  id: text("id").primaryKey(),
  project_id: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  nickname: text("nickname").notNull(),
  brand: text("brand"),
  last_four: text("last_four").notNull(),
  cardholder_name: text("cardholder_name"),
  expiry_month: text("expiry_month"),
  expiry_year: text("expiry_year"),
  bank: text("bank"),
  card_type: text("card_type"),
  environment: text("environment"),
  notes: text("notes"),
  encrypted_number: text("encrypted_number", { mode: "json" }).notNull(),
  encrypted_cvv: text("encrypted_cvv", { mode: "json" }).notNull(),
  created_at: text("created_at").default(sql`(datetime('now'))`),
  updated_at: text("updated_at").default(sql`(datetime('now'))`),
});

