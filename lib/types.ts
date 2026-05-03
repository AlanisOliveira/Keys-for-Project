export type AppRole = "admin" | "client";

export type CredentialType =
  | "password"
  | "web_login"
  | "totp"
  | "api_token"
  | "api_keypair"
  | "certificate"
  | "webhook"
  | "env_var"
  | "ftp"
  | "database"
  | "oauth"
  | "smtp";

export type AppEnvironment = "production" | "staging" | "development" | "test";
export type CardBrand = "visa" | "mastercard" | "amex" | "elo" | "hipercard" | "other";
export type CardType = "credit" | "debit" | "prepaid" | "virtual";

export interface EncryptedPayload {
  iv: string;
  salt: string;
  ciphertext: string;
}

export interface Profile {
  id: string;
  role: AppRole;
  cpf: string;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  client_name: string | null;
  description: string | null;
  color: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CredentialRecord {
  id: string;
  project_id: string;
  type: CredentialType;
  label: string;
  preview: string | null;
  encrypted_data: EncryptedPayload;
  tags: string[] | null;
  environment: AppEnvironment | null;
  expires_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CardRecord {
  id: string;
  project_id: string;
  nickname: string;
  brand: CardBrand | null;
  last_four: string;
  cardholder_name: string | null;
  expiry_month: string | null;
  expiry_year: string | null;
  bank: string | null;
  card_type: CardType | null;
  environment: "production" | "test" | null;
  encrypted_number: EncryptedPayload;
  encrypted_cvv: EncryptedPayload;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicProject {
  id: string;
  name: string;
  client_name: string | null;
  description: string | null;
  color: string;
}

export interface PublicCredential {
  id: string;
  project_id: string;
  type: CredentialType;
  label: string;
  preview: string | null;
  environment: AppEnvironment | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicCard {
  id: string;
  project_id: string;
  nickname: string;
  brand: CardBrand | null;
  last_four: string;
  cardholder_name: string | null;
  expiry_month: string | null;
  expiry_year: string | null;
  bank: string | null;
  card_type: CardType | null;
  environment: "production" | "test" | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
