"use client";

import { useState } from "react";

import { Panel } from "@/components/ui/Panel";
import { createPreview, encryptJson } from "@/lib/crypto";
import type { CredentialType } from "@/lib/types";
import { isProjectKeyValid } from "@/lib/validators";

type FieldDef = { label: string; sensitiveFields: string[]; optionalSensitiveFields?: string[]; publicFields: string[] };

const credentialFields: Record<CredentialType, FieldDef> = {
  web_login: { label: "Acesso Web", sensitiveFields: ["login", "password"], optionalSensitiveFields: ["totp_secret", "recovery_codes"], publicFields: ["url", "notes"] },
  totp: { label: "2FA / TOTP", sensitiveFields: ["totp_secret"], optionalSensitiveFields: ["recovery_codes"], publicFields: ["url", "login", "method"] },
  password: { label: "Senha", sensitiveFields: ["login", "password"], publicFields: ["url", "notes"] },
  api_token: { label: "Token de API", sensitiveFields: ["token"], publicFields: ["service", "environment", "expires_at"] },
  api_keypair: { label: "API Key + Secret", sensitiveFields: ["public_key", "secret_key"], publicFields: ["service", "environment"] },
  certificate: { label: "Certificado / SSH", sensitiveFields: ["fingerprint", "passphrase"], publicFields: ["name", "expires_at"] },
  webhook: { label: "Webhook Secret", sensitiveFields: ["secret"], publicFields: ["url", "events"] },
  env_var: { label: "Variável de Ambiente", sensitiveFields: ["value"], publicFields: ["name", "file"] },
  ftp: { label: "FTP / SFTP", sensitiveFields: ["username", "password"], publicFields: ["host", "port", "root_dir"] },
  database: { label: "Banco de Dados", sensitiveFields: ["username", "password", "connection_string"], publicFields: ["host", "port", "database_name"] },
  oauth: { label: "OAuth / JWT", sensitiveFields: ["client_id", "client_secret"], publicFields: ["redirect_uri", "scopes"] },
  smtp: { label: "SMTP / E-mail", sensitiveFields: ["username", "password"], publicFields: ["host", "port", "tls"] },
};

const fieldPlaceholders: Partial<Record<CredentialType, Partial<Record<string, string>>>> = {
  web_login: {
    label: "Ex.: Painel do cliente Acme",
    url: "Ex.: https://app.acme.com",
    login: "Ex.: admin@acme.com",
    password: "Ex.: senha de acesso",
    totp_secret: "Ex.: JBSWY3DPEHPK3PXP (opcional)",
    recovery_codes: "Ex.: 12345-67890 (opcional)",
    notes: "Ex.: acesso principal do cliente",
  },
  totp: {
    label: "Ex.: 2FA do painel Acme",
    url: "Ex.: https://app.acme.com",
    login: "Ex.: admin@acme.com",
    totp_secret: "Ex.: JBSWY3DPEHPK3PXP",
    recovery_codes: "Ex.: 12345-67890 (opcional)",
    method: "Ex.: Google Authenticator",
  },
  password: {
    label: "Ex.: Login do Gmail",
    url: "Ex.: https://mail.google.com",
    notes: "Ex.: conta principal do financeiro",
    login: "Ex.: financeiro@empresa.com",
    password: "Ex.: senha forte da conta",
  },
};

export function CredentialForm() {
  const [type, setType] = useState<CredentialType>("api_token");
  const [output, setOutput] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    const projectKey = String(formData.get("projectKey") ?? "");
    const label = String(formData.get("label") ?? "");

    if (!isProjectKeyValid(projectKey)) {
      setOutput("A Project Key precisa ter 6 dígitos para criptografar os campos sensíveis.");
      return;
    }

    const fields = credentialFields[type];
    const sensitiveData = Object.fromEntries(fields.sensitiveFields.map((field) => [field, String(formData.get(field) ?? "")]));
    for (const field of fields.optionalSensitiveFields ?? []) {
      const value = String(formData.get(field) ?? "").trim();
      if (value) sensitiveData[field] = value;
    }
    const publicData = Object.fromEntries(fields.publicFields.map((field) => [field, String(formData.get(field) ?? "")]));
    const encrypted = await encryptJson(sensitiveData, projectKey);

    setOutput(
      JSON.stringify(
        {
          type,
          label,
          preview: createPreview(Object.values(sensitiveData)[0] ?? ""),
          publicData,
          encrypted_data: encrypted,
        },
        null,
        2,
      ),
    );
  }

  const fields = credentialFields[type];
  const getFieldAutoComplete = (field: string) => {
    if (field === "password") return "new-password";
    if (field === "login" || field === "username") return "off";
    return "off";
  };

  return (
    <Panel>
      <form action={handleSubmit} autoComplete="off" className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Tipo</span>
          <select value={type} onChange={(event) => setType(event.target.value as CredentialType)} className="rounded-2xl border border-border bg-background px-4 py-3">
            {Object.entries(credentialFields).map(([key, definition]) => (
              <option key={key} value={key}>
                {definition.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Label visível</span>
          <input
            name="label"
            required
            placeholder={fieldPlaceholders[type]?.label ?? "Ex.: Credencial principal"}
            className="rounded-2xl border border-border bg-background px-4 py-3"
          />
          <span className="text-xs text-mutedForeground">Este nome aparece no card da credencial dentro do vault.</span>
        </label>

        {fields.publicFields.map((field) => (
          <label key={field} className="grid gap-2">
            <span className="text-sm font-medium capitalize text-foreground">{field.replaceAll("_", " ")}</span>
            <input
              name={field}
              autoComplete={getFieldAutoComplete(field)}
              placeholder={fieldPlaceholders[type]?.[field] ?? ""}
              className="rounded-2xl border border-border bg-background px-4 py-3"
            />
          </label>
        ))}

        {fields.sensitiveFields.map((field) => (
          <label key={field} className="grid gap-2">
            <span className="text-sm font-medium capitalize text-foreground">{field.replaceAll("_", " ")}</span>
            <input
              name={field}
              required
              autoComplete={getFieldAutoComplete(field)}
              placeholder={fieldPlaceholders[type]?.[field] ?? ""}
              className="rounded-2xl border border-border bg-background px-4 py-3"
            />
          </label>
        ))}

        {(fields.optionalSensitiveFields ?? []).map((field) => (
          <label key={field} className="grid gap-2">
            <span className="text-sm font-medium capitalize text-foreground">
              {field.replaceAll("_", " ")}{" "}
              <span className="text-xs font-normal text-slate-400">(opcional)</span>
            </span>
            <input
              name={field}
              autoComplete={getFieldAutoComplete(field)}
              placeholder={fieldPlaceholders[type]?.[field] ?? ""}
              className="rounded-2xl border border-border bg-background px-4 py-3"
            />
          </label>
        ))}

        <label className="grid gap-2 md:col-span-2">
          <span className="text-sm font-medium text-foreground">Project Key</span>
          <input
            name="projectKey"
            type="password"
            autoComplete="one-time-code"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            required
            className="rounded-2xl border border-border bg-background px-4 py-3"
            placeholder="123456"
          />
        </label>

        <div className="md:col-span-2">
          <button className="rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-white">
            Gerar payload criptografado
          </button>
        </div>
      </form>

      {output ? (
        <pre className="mt-6 overflow-x-auto rounded-2xl border border-border bg-slate-950 p-4 text-xs text-cyan-200">{output}</pre>
      ) : null}
    </Panel>
  );
}
