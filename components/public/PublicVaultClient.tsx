"use client";

import { useEffect, useMemo, useState } from "react";

import { CreditCardDisplay } from "@/components/cards/CreditCardDisplay";
import { CredentialCard } from "@/components/credentials/CredentialCard";
import { Panel } from "@/components/ui/Panel";
import { createPreview, decrypt, decryptJson, encrypt, encryptJson, maskCardNumber } from "@/lib/crypto";
import type { CardType, CredentialType, PublicCard, PublicCredential, PublicProject } from "@/lib/types";
import { useClipboard } from "@/hooks/useClipboard";
import { detectCardBrand, isProjectKeyValid, validateLuhn } from "@/lib/validators";

type FieldDef = { label: string; sensitiveFields: string[]; optionalSensitiveFields?: string[]; publicFields: string[] };

const credentialFields: Record<CredentialType, FieldDef> = {
  web_login: { label: "Acesso Web", sensitiveFields: ["login", "password"], optionalSensitiveFields: ["totp_secret", "recovery_codes"], publicFields: ["url", "notes"] },
  totp: { label: "2FA / TOTP", sensitiveFields: ["totp_secret"], optionalSensitiveFields: ["recovery_codes"], publicFields: ["url", "login", "method"] },
  password: { label: "Senha", sensitiveFields: ["login", "password"], publicFields: ["url", "notes"] },
  api_token: { label: "Token de API", sensitiveFields: ["token"], publicFields: ["service", "environment", "expires_at"] },
  api_keypair: { label: "API Key + Secret", sensitiveFields: ["public_key", "secret_key"], publicFields: ["service", "environment"] },
  certificate: { label: "Certificado / SSH", sensitiveFields: ["fingerprint", "passphrase"], publicFields: ["name", "expires_at"] },
  webhook: { label: "Webhook Secret", sensitiveFields: ["secret"], publicFields: ["url", "events"] },
  env_var: { label: "Variavel de Ambiente", sensitiveFields: ["value"], publicFields: ["name", "file"] },
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

type PendingItem =
  | { itemType: "credential"; itemId: string; action: "reveal" | "copy" }
  | { itemType: "card"; itemId: string; action: "reveal" | "copy" }
  | null;

type CreateMode = "credential" | "card" | null;
type DeleteTarget = { itemType: "credential" | "card"; itemId: string; label: string } | null;
type EditTarget =
  | { mode: "credential"; item: PublicCredential; decrypted: Record<string, string> }
  | { mode: "card"; item: PublicCard; decryptedNumber: string; decryptedCvv: string }
  | null;

interface PublicVaultClientProps {
  project: PublicProject;
  credentials: PublicCredential[];
  cards: PublicCard[];
}

export function PublicVaultClient({ project, credentials, cards }: PublicVaultClientProps) {
  const { copy } = useClipboard();
  const [credentialItems, setCredentialItems] = useState(credentials);
  const [cardItems, setCardItems] = useState(cards);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [vaultKey, setVaultKey] = useState("");
  const [vaultKeyInput, setVaultKeyInput] = useState("");
  const [vaultKeyError, setVaultKeyError] = useState<string | null>(null);
  const [vaultKeyLoading, setVaultKeyLoading] = useState(false);
  const [pendingItem, setPendingItem] = useState<PendingItem>(null);
  const [projectKey, setProjectKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [revealedContent, setRevealedContent] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createMode, setCreateMode] = useState<CreateMode>(null);
  const [createType, setCreateType] = useState<CredentialType>("api_token");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const [editType, setEditType] = useState<CredentialType>("api_token");
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editFetchLoading, setEditFetchLoading] = useState(false);
  const [cardBrand, setCardBrand] = useState("other");
  const [maskedNumber, setMaskedNumber] = useState("•••• •••• •••• 0000");
  const [editCardBrand, setEditCardBrand] = useState("other");
  const [editMaskedNumber, setEditMaskedNumber] = useState("•••• •••• •••• 0000");
  const storageKey = `vault-key:${project.id}`;

  const title = useMemo(() => {
    if (!pendingItem) return "";
    return pendingItem.action === "copy" ? "Confirmar para copiar" : "Revelar informacoes";
  }, [pendingItem]);

  useEffect(() => {
    setCredentialItems(credentials);
  }, [credentials]);

  useEffect(() => {
    setCardItems(cards);
  }, [cards]);

  useEffect(() => {
    const savedKey = window.sessionStorage.getItem(storageKey);
    if (!savedKey || vaultUnlocked || vaultKeyLoading) return;
    const restoredKey = savedKey;
    let active = true;

    async function restoreVaultAccess() {
      setVaultKeyLoading(true);
      try {
        const response = await fetch("/api/verify-key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: project.id, projectKey: restoredKey }),
        });
        const data = await response.json();
        if (!active || !response.ok || !data.ok) {
          window.sessionStorage.removeItem(storageKey);
          return;
        }
        setVaultUnlocked(true);
        setVaultKey(restoredKey);
        setProjectKey(restoredKey);
      } finally {
        if (active) setVaultKeyLoading(false);
      }
    }

    void restoreVaultAccess();
    return () => { active = false; };
  }, [project.id, storageKey, vaultKeyLoading, vaultUnlocked]);

  function openAccess(itemType: "credential" | "card", itemId: string, action: "reveal" | "copy") {
    setPendingItem({ itemType, itemId, action });
    setProjectKey(vaultKey);
    setError(null);
    setRevealedContent(null);
    setSuccessMessage(null);
  }

  function closeAccess() {
    setPendingItem(null);
    setProjectKey("");
    setError(null);
    setLoading(false);
    setRevealedContent(null);
    setSuccessMessage(null);
  }

  function openCreate(mode: Exclude<CreateMode, null>) {
    setCreateMode(mode);
    setCreateError(null);
    setCreateSuccess(null);
    setCreateLoading(false);
  }

  function closeCreate() {
    setCreateMode(null);
    setCreateError(null);
    setCreateLoading(false);
  }

  function openDelete(itemType: "credential" | "card", itemId: string, label: string) {
    setDeleteTarget({ itemType, itemId, label });
    setDeleteError(null);
    setDeleteLoading(false);
  }

  function closeDelete() {
    setDeleteTarget(null);
    setDeleteError(null);
    setDeleteLoading(false);
  }

  async function openEdit(itemType: "credential" | "card", itemId: string) {
    setEditError(null);
    setEditFetchLoading(true);

    try {
      const response = await fetch("/api/public-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, itemType, itemId, action: "reveal", projectKey: vaultKey }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        setEditError("Nao foi possivel carregar o item para edicao.");
        return;
      }

      if (itemType === "credential") {
        const credential = credentialItems.find((c) => c.id === itemId)!;
        const decrypted = await decryptJson<Record<string, string>>(data.item.encrypted_data, vaultKey);
        setEditType(credential.type);
        setEditTarget({ mode: "credential", item: credential, decrypted });
      } else {
        const card = cardItems.find((c) => c.id === itemId)!;
        const decryptedNumber = await decrypt(data.item.encrypted_number, vaultKey);
        const decryptedCvv = await decrypt(data.item.encrypted_cvv, vaultKey);
        const digits = decryptedNumber.replace(/\D/g, "");
        setEditCardBrand(detectCardBrand(digits));
        setEditMaskedNumber(maskCardNumber(digits.slice(-4).padStart(4, "0")));
        setEditTarget({ mode: "card", item: card, decryptedNumber, decryptedCvv });
      }
    } catch {
      setEditError("Nao foi possivel carregar o item para edicao.");
    } finally {
      setEditFetchLoading(false);
    }
  }

  function closeEdit() {
    setEditTarget(null);
    setEditError(null);
    setEditLoading(false);
    setEditFetchLoading(false);
  }

  async function handleVaultUnlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setVaultKeyError(null);

    if (!isProjectKeyValid(vaultKeyInput)) {
      setVaultKeyError("Digite a senha do projeto com 6 digitos.");
      return;
    }

    setVaultKeyLoading(true);

    try {
      const response = await fetch("/api/verify-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, projectKey: vaultKeyInput }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        setVaultKeyError("Senha do projeto incorreta.");
        return;
      }

      setVaultUnlocked(true);
      setVaultKey(vaultKeyInput);
      setProjectKey(vaultKeyInput);
      window.sessionStorage.setItem(storageKey, vaultKeyInput);
      setVaultKeyInput("");
    } catch {
      setVaultKeyError("Nao foi possivel validar a senha agora.");
    } finally {
      setVaultKeyLoading(false);
    }
  }

  async function handleAccessSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pendingItem) return;

    setError(null);
    setSuccessMessage(null);

    if (!isProjectKeyValid(projectKey)) {
      setError("Digite a senha do projeto com 6 digitos.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/public-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          itemType: pendingItem.itemType,
          itemId: pendingItem.itemId,
          action: pendingItem.action,
          projectKey,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(typeof data.error === "string" ? data.error : "Nao foi possivel validar a senha do projeto.");
        return;
      }

      if (pendingItem.itemType === "credential") {
        const decrypted = await decryptJson<Record<string, string>>(data.item.encrypted_data, projectKey);
        const formatted = JSON.stringify(decrypted, null, 2);

        if (pendingItem.action === "copy") {
          await copy(formatted);
          setSuccessMessage("Conteudo copiado com sucesso.");
          closeAccess();
          return;
        }

        setRevealedContent(formatted);
        return;
      }

      const number = await decrypt(data.item.encrypted_number, projectKey);
      const cvv = await decrypt(data.item.encrypted_cvv, projectKey);
      const formatted = JSON.stringify({ numero: number, cvv, ultimos_digitos: data.item.last_four, bandeira: data.item.brand }, null, 2);

      if (pendingItem.action === "copy") {
        await copy(formatted);
        setSuccessMessage("Conteudo copiado com sucesso.");
        closeAccess();
        return;
      }

      setRevealedContent(formatted);
    } catch {
      setError("Nao foi possivel processar a solicitacao agora.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCredentialSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const label = String(formData.get("label") ?? "").trim();

    setCreateError(null);
    setCreateSuccess(null);

    if (!label) { setCreateError("Digite um nome para a credencial."); return; }
    if (!isProjectKeyValid(vaultKey)) { setCreateError("Vault nao desbloqueado."); return; }

    setCreateLoading(true);

    try {
      const fields = credentialFields[createType];
      const sensitiveData = Object.fromEntries(fields.sensitiveFields.map((field) => [field, String(formData.get(field) ?? "")]));
      for (const field of fields.optionalSensitiveFields ?? []) {
        const value = String(formData.get(field) ?? "").trim();
        if (value) sensitiveData[field] = value;
      }
      const publicData = Object.fromEntries(fields.publicFields.map((field) => [field, String(formData.get(field) ?? "")]));
      const encrypted = await encryptJson(sensitiveData, vaultKey);

      const response = await fetch("/api/public-vault-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType: "credential",
          projectId: project.id,
          projectKey: vaultKey,
          payload: {
            type: createType,
            label,
            preview: createPreview(Object.values(sensitiveData)[0] ?? ""),
            environment: (publicData.environment || null) as "production" | "staging" | "development" | "test" | null,
            expires_at: publicData.expires_at || null,
            encrypted_data: encrypted,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        setCreateError(typeof data.error === "string" ? data.error : "Nao foi possivel criar a credencial.");
        return;
      }

      setCredentialItems((current) => [data.item as PublicCredential, ...current]);
      setCreateSuccess("Credencial criada com sucesso.");
      closeCreate();
    } catch {
      setCreateError("Nao foi possivel criar a credencial agora.");
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleCreateCardSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const number = String(formData.get("number") ?? "");
    const cvv = String(formData.get("cvv") ?? "");
    const nickname = String(formData.get("nickname") ?? "").trim();

    setCreateError(null);
    setCreateSuccess(null);

    if (!nickname) { setCreateError("Digite um apelido para o cartao."); return; }
    if (!validateLuhn(number)) { setCreateError("Numero de cartao invalido."); return; }
    if (!isProjectKeyValid(vaultKey)) { setCreateError("Vault nao desbloqueado."); return; }

    setCreateLoading(true);

    try {
      const cleanedNumber = number.replace(/\D/g, "");
      const encryptedNumber = await encrypt(cleanedNumber, vaultKey);
      const encryptedCvv = await encrypt(cvv, vaultKey);

      const response = await fetch("/api/public-vault-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType: "card",
          projectId: project.id,
          projectKey: vaultKey,
          payload: {
            nickname,
            brand: detectCardBrand(cleanedNumber),
            last_four: cleanedNumber.slice(-4),
            cardholder_name: String(formData.get("cardholder_name") ?? "") || null,
            expiry_month: String(formData.get("expiry_month") ?? "") || null,
            expiry_year: String(formData.get("expiry_year") ?? "") || null,
            bank: String(formData.get("bank") ?? "") || null,
            card_type: (String(formData.get("card_type") ?? "") || null) as CardType | null,
            environment: (String(formData.get("environment") ?? "") || null) as "production" | "test" | null,
            notes: String(formData.get("notes") ?? "") || null,
            encrypted_number: encryptedNumber,
            encrypted_cvv: encryptedCvv,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        setCreateError(typeof data.error === "string" ? data.error : "Nao foi possivel criar o cartao.");
        return;
      }

      setCardItems((current) => [data.item as PublicCard, ...current]);
      setCreateSuccess("Cartao criado com sucesso.");
      closeCreate();
    } catch {
      setCreateError("Nao foi possivel criar o cartao agora.");
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleEditCredentialSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editTarget || editTarget.mode !== "credential") return;

    const formData = new FormData(event.currentTarget);
    const label = String(formData.get("label") ?? "").trim();

    setEditError(null);
    if (!label) { setEditError("Digite um nome para a credencial."); return; }

    setEditLoading(true);

    try {
      const fields = credentialFields[editType];
      const sensitiveData = Object.fromEntries(fields.sensitiveFields.map((field) => [field, String(formData.get(field) ?? "")]));
      for (const field of fields.optionalSensitiveFields ?? []) {
        const value = String(formData.get(field) ?? "").trim();
        if (value) sensitiveData[field] = value;
      }
      const publicData = Object.fromEntries(fields.publicFields.map((field) => [field, String(formData.get(field) ?? "")]));
      const encrypted = await encryptJson(sensitiveData, vaultKey);

      const response = await fetch("/api/public-vault-items", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType: "credential",
          projectId: project.id,
          projectKey: vaultKey,
          itemId: editTarget.item.id,
          payload: {
            type: editType,
            label,
            preview: createPreview(Object.values(sensitiveData)[0] ?? ""),
            environment: (publicData.environment || null) as "production" | "staging" | "development" | "test" | null,
            expires_at: publicData.expires_at || null,
            encrypted_data: encrypted,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        setEditError(typeof data.error === "string" ? data.error : "Nao foi possivel atualizar a credencial.");
        return;
      }

      setCredentialItems((current) => current.map((c) => c.id === editTarget.item.id ? (data.item as PublicCredential) : c));
      setCreateSuccess("Credencial atualizada com sucesso.");
      closeEdit();
    } catch {
      setEditError("Nao foi possivel atualizar a credencial agora.");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleEditCardSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editTarget || editTarget.mode !== "card") return;

    const formData = new FormData(event.currentTarget);
    const number = String(formData.get("number") ?? "");
    const cvv = String(formData.get("cvv") ?? "");
    const nickname = String(formData.get("nickname") ?? "").trim();

    setEditError(null);
    if (!nickname) { setEditError("Digite um apelido para o cartao."); return; }
    if (!validateLuhn(number)) { setEditError("Numero de cartao invalido."); return; }

    setEditLoading(true);

    try {
      const cleanedNumber = number.replace(/\D/g, "");
      const encryptedNumber = await encrypt(cleanedNumber, vaultKey);
      const encryptedCvv = await encrypt(cvv, vaultKey);

      const response = await fetch("/api/public-vault-items", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType: "card",
          projectId: project.id,
          projectKey: vaultKey,
          itemId: editTarget.item.id,
          payload: {
            nickname,
            brand: detectCardBrand(cleanedNumber),
            last_four: cleanedNumber.slice(-4),
            cardholder_name: String(formData.get("cardholder_name") ?? "") || null,
            expiry_month: String(formData.get("expiry_month") ?? "") || null,
            expiry_year: String(formData.get("expiry_year") ?? "") || null,
            bank: String(formData.get("bank") ?? "") || null,
            card_type: (String(formData.get("card_type") ?? "") || null) as CardType | null,
            environment: (String(formData.get("environment") ?? "") || null) as "production" | "test" | null,
            notes: String(formData.get("notes") ?? "") || null,
            encrypted_number: encryptedNumber,
            encrypted_cvv: encryptedCvv,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        setEditError(typeof data.error === "string" ? data.error : "Nao foi possivel atualizar o cartao.");
        return;
      }

      setCardItems((current) => current.map((c) => c.id === editTarget.item.id ? (data.item as PublicCard) : c));
      setCreateSuccess("Cartao atualizado com sucesso.");
      closeEdit();
    } catch {
      setEditError("Nao foi possivel atualizar o cartao agora.");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDeleteSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!deleteTarget) return;

    setDeleteError(null);
    setCreateSuccess(null);
    setDeleteLoading(true);

    try {
      const response = await fetch("/api/public-vault-items", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, projectKey: vaultKey, itemType: deleteTarget.itemType, itemId: deleteTarget.itemId }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        setDeleteError(typeof data.error === "string" ? data.error : "Nao foi possivel apagar o item.");
        return;
      }

      if (deleteTarget.itemType === "credential") {
        setCredentialItems((current) => current.filter((item) => item.id !== deleteTarget.itemId));
        setCreateSuccess("Credencial apagada com sucesso.");
      } else {
        setCardItems((current) => current.filter((item) => item.id !== deleteTarget.itemId));
        setCreateSuccess("Cartao apagado com sucesso.");
      }

      closeDelete();
    } catch {
      setDeleteError("Nao foi possivel apagar o item agora.");
    } finally {
      setDeleteLoading(false);
    }
  }

  function handleCardNumberInput(rawValue: string) {
    const digits = rawValue.replace(/\D/g, "");
    setCardBrand(detectCardBrand(digits));
    setMaskedNumber(maskCardNumber(digits.slice(-4).padStart(4, "0")));
  }

  function handleEditCardNumberInput(rawValue: string) {
    const digits = rawValue.replace(/\D/g, "");
    setEditCardBrand(detectCardBrand(digits));
    setEditMaskedNumber(maskCardNumber(digits.slice(-4).padStart(4, "0")));
  }

  const createFields = credentialFields[createType];
  const editFields = credentialFields[editType];
  const getFieldAutoComplete = (field: string) => {
    if (field === "password") return "new-password";
    if (field === "login" || field === "username") return "off";
    return "off";
  };

  const inputClass = "rounded-2xl border border-border bg-background px-4 py-3";

  return (
    <>
      {!vaultUnlocked ? (
        <Panel className="mx-auto mt-8 max-w-xl">
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Acesso protegido</div>
          <h2 className="mt-2 text-3xl font-semibold text-brand-ink">Digite a senha do vault</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Este vault so libera visualizacao e criacao de itens depois da validacao da senha do projeto.
          </p>
          <form onSubmit={handleVaultUnlock} className="mt-6">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-foreground">Senha do projeto</span>
              <input
                type="password"
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
                value={vaultKeyInput}
                onChange={(event) => setVaultKeyInput(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition focus:border-slate-400"
              />
            </label>
            {vaultKeyError ? <p className="mt-3 text-sm text-red-600">{vaultKeyError}</p> : null}
            <div className="mt-5">
              <button type="submit" disabled={vaultKeyLoading} className="rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">
                {vaultKeyLoading ? "Entrando..." : "Entrar no vault"}
              </button>
            </div>
          </form>
        </Panel>
      ) : null}

      {vaultUnlocked && createSuccess ? (
        <Panel className="mt-8 border-emerald-200 bg-emerald-50">
          <p className="text-sm font-medium text-emerald-800">{createSuccess}</p>
        </Panel>
      ) : null}

      {editFetchLoading ? (
        <Panel className="mt-8 border-slate-200">
          <p className="text-sm text-slate-600">Carregando dados para edicao...</p>
        </Panel>
      ) : null}

      {editError && !editTarget ? (
        <Panel className="mt-8 border-red-200 bg-red-50">
          <p className="text-sm text-red-700">{editError}</p>
        </Panel>
      ) : null}

      {vaultUnlocked ? (
        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-slate-950">Credenciais</h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">{credentialItems.length} itens</span>
                <button type="button" onClick={() => openCreate("credential")} className="rounded-full bg-brand-ink px-4 py-2 text-sm font-semibold text-white">
                  Adicionar
                </button>
              </div>
            </div>
            <div className="grid gap-6">
              {credentialItems.length === 0 ? (
                <Panel><p className="text-sm text-slate-600">Nenhuma credencial disponivel neste projeto ainda.</p></Panel>
              ) : null}
              {credentialItems.map((credential) => (
                <CredentialCard
                  key={credential.id}
                  credential={credential}
                  onReveal={() => openAccess("credential", credential.id, "reveal")}
                  onCopy={() => openAccess("credential", credential.id, "copy")}
                  onEdit={() => openEdit("credential", credential.id)}
                  onDelete={() => openDelete("credential", credential.id, credential.label)}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-slate-950">Cartoes</h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">{cardItems.length} itens</span>
                <button type="button" onClick={() => openCreate("card")} className="rounded-full bg-brand-ink px-4 py-2 text-sm font-semibold text-white">
                  Adicionar
                </button>
              </div>
            </div>
            <div className="grid gap-6">
              {cardItems.length === 0 ? (
                <Panel><p className="text-sm text-slate-600">Nenhum cartao disponivel neste projeto ainda.</p></Panel>
              ) : null}
              {cardItems.map((card) => (
                <CreditCardDisplay
                  key={card.id}
                  card={card}
                  onReveal={() => openAccess("card", card.id, "reveal")}
                  onCopy={() => openAccess("card", card.id, "copy")}
                  onEdit={() => openEdit("card", card.id)}
                  onDelete={() => openDelete("card", card.id, card.nickname)}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Reveal / Copy modal */}
      {pendingItem && vaultUnlocked ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Senha do projeto</div>
                <h3 className="mt-2 text-2xl font-semibold text-brand-ink">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">Confirme a acao para {pendingItem.action === "copy" ? "copiar" : "visualizar"} o conteudo completo.</p>
              </div>
              <button type="button" onClick={closeAccess} className="text-sm text-slate-500">Fechar</button>
            </div>
            <form onSubmit={handleAccessSubmit} className="mt-6">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">Senha do projeto</span>
                <input
                  type="password"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={6}
                  value={projectKey}
                  onChange={(event) => setProjectKey(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition focus:border-slate-400"
                />
              </label>
              {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
              {successMessage ? <p className="mt-3 text-sm text-emerald-700">{successMessage}</p> : null}
              <div className="mt-5 flex gap-3">
                <button type="submit" disabled={loading} className="rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">
                  {loading ? "Validando..." : pendingItem.action === "copy" ? "Confirmar e copiar" : "Revelar"}
                </button>
                <button type="button" onClick={closeAccess} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Cancelar</button>
              </div>
            </form>
            {revealedContent ? (
              <pre className="mt-6 overflow-x-auto rounded-2xl border border-border bg-slate-950 p-4 text-xs text-cyan-200">{revealedContent}</pre>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Create modal */}
      {createMode ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Vault do projeto</div>
                <h3 className="mt-2 text-2xl font-semibold text-brand-ink">{createMode === "credential" ? "Adicionar credencial" : "Adicionar cartao"}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">Os dados sensiveis sao criptografados no navegador antes do envio.</p>
              </div>
              <button type="button" onClick={closeCreate} className="text-sm text-slate-500">Fechar</button>
            </div>

            {createMode === "credential" ? (
              <form onSubmit={handleCreateCredentialSubmit} autoComplete="off" className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-foreground">Tipo</span>
                  <select value={createType} onChange={(e) => setCreateType(e.target.value as CredentialType)} className={inputClass}>
                    {Object.entries(credentialFields).map(([key, def]) => <option key={key} value={key}>{def.label}</option>)}
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-foreground">Label visivel</span>
                  <input name="label" required placeholder={fieldPlaceholders[createType]?.label ?? "Ex.: Credencial principal"} className={inputClass} />
                </label>
                {createFields.publicFields.map((field) => (
                  <label key={field} className="grid gap-2">
                    <span className="text-sm font-medium capitalize text-foreground">{field.replaceAll("_", " ")}</span>
                    <input name={field} autoComplete={getFieldAutoComplete(field)} placeholder={fieldPlaceholders[createType]?.[field] ?? ""} className={inputClass} />
                  </label>
                ))}
                {createFields.sensitiveFields.map((field) => (
                  <label key={field} className="grid gap-2">
                    <span className="text-sm font-medium capitalize text-foreground">{field.replaceAll("_", " ")}</span>
                    <input name={field} required autoComplete={getFieldAutoComplete(field)} placeholder={fieldPlaceholders[createType]?.[field] ?? ""} className={inputClass} />
                  </label>
                ))}
                {(createFields.optionalSensitiveFields ?? []).map((field) => (
                  <label key={field} className="grid gap-2">
                    <span className="text-sm font-medium capitalize text-foreground">{field.replaceAll("_", " ")} <span className="text-xs font-normal text-slate-400">(opcional)</span></span>
                    <input name={field} autoComplete={getFieldAutoComplete(field)} placeholder={fieldPlaceholders[createType]?.[field] ?? ""} className={inputClass} />
                  </label>
                ))}
                {createError ? <p className="md:col-span-2 text-sm text-red-600">{createError}</p> : null}
                <div className="md:col-span-2 flex gap-3">
                  <button type="submit" disabled={createLoading} className="rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-70">{createLoading ? "Criando..." : "Criar credencial"}</button>
                  <button type="button" onClick={closeCreate} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Cancelar</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCreateCardSubmit} autoComplete="off" className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="grid gap-2"><span className="text-sm font-medium text-foreground">Apelido</span><input name="nickname" required autoComplete="off" className={inputClass} /></label>
                <label className="grid gap-2"><span className="text-sm font-medium text-foreground">Ambiente</span><select name="environment" className={inputClass}><option value="test">Teste</option><option value="production">Producao</option></select></label>
                <label className="grid gap-2 md:col-span-2"><span className="text-sm font-medium text-foreground">Numero do cartao</span><input name="number" required autoComplete="off" placeholder="4242 4242 4242 4242" className={inputClass} onChange={(e) => handleCardNumberInput(e.target.value)} /></label>
                <label className="grid gap-2"><span className="text-sm font-medium text-foreground">Nome no cartao</span><input name="cardholder_name" autoComplete="off" className={inputClass} /></label>
                <label className="grid gap-2"><span className="text-sm font-medium text-foreground">Banco</span><input name="bank" autoComplete="off" className={inputClass} /></label>
                <label className="grid gap-2"><span className="text-sm font-medium text-foreground">MM</span><input name="expiry_month" autoComplete="cc-exp-month" maxLength={2} className={inputClass} /></label>
                <label className="grid gap-2"><span className="text-sm font-medium text-foreground">AA</span><input name="expiry_year" autoComplete="cc-exp-year" maxLength={2} className={inputClass} /></label>
                <label className="grid gap-2"><span className="text-sm font-medium text-foreground">CVV</span><input name="cvv" required autoComplete="cc-csc" maxLength={4} className={inputClass} /></label>
                <label className="grid gap-2"><span className="text-sm font-medium text-foreground">Tipo</span><select name="card_type" className={inputClass}><option value="credit">Credito</option><option value="debit">Debito</option><option value="prepaid">Pre-pago</option><option value="virtual">Virtual</option></select></label>
                <label className="grid gap-2 md:col-span-2"><span className="text-sm font-medium text-foreground">Observacoes</span><textarea name="notes" rows={3} className={inputClass} /></label>
                <div className="md:col-span-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-medium text-amber-800">{cardBrand}</span>
                  <span className="font-mono">{maskedNumber}</span>
                </div>
                {createError ? <p className="md:col-span-2 text-sm text-red-600">{createError}</p> : null}
                <div className="md:col-span-2 flex gap-3">
                  <button type="submit" disabled={createLoading} className="rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-70">{createLoading ? "Criando..." : "Criar cartao"}</button>
                  <button type="button" onClick={closeCreate} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Cancelar</button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}

      {/* Edit modal */}
      {editTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Edicao</div>
                <h3 className="mt-2 text-2xl font-semibold text-brand-ink">{editTarget.mode === "credential" ? "Editar credencial" : "Editar cartao"}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">Os dados sensiveis serao re-criptografados com a senha do vault atual.</p>
              </div>
              <button type="button" onClick={closeEdit} className="text-sm text-slate-500">Fechar</button>
            </div>

            {editTarget.mode === "credential" ? (
              <form onSubmit={handleEditCredentialSubmit} autoComplete="off" className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-foreground">Tipo</span>
                  <select value={editType} onChange={(e) => setEditType(e.target.value as CredentialType)} className={inputClass}>
                    {Object.entries(credentialFields).map(([key, def]) => <option key={key} value={key}>{def.label}</option>)}
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-foreground">Label visivel</span>
                  <input name="label" required defaultValue={editTarget.item.label} className={inputClass} />
                </label>
                {editFields.publicFields.map((field) => (
                  <label key={field} className="grid gap-2">
                    <span className="text-sm font-medium capitalize text-foreground">{field.replaceAll("_", " ")}</span>
                    <input name={field} autoComplete={getFieldAutoComplete(field)} defaultValue={editTarget.decrypted[field] ?? ""} className={inputClass} />
                  </label>
                ))}
                {editFields.sensitiveFields.map((field) => (
                  <label key={field} className="grid gap-2">
                    <span className="text-sm font-medium capitalize text-foreground">{field.replaceAll("_", " ")}</span>
                    <input name={field} required autoComplete={getFieldAutoComplete(field)} defaultValue={editTarget.decrypted[field] ?? ""} className={inputClass} />
                  </label>
                ))}
                {(editFields.optionalSensitiveFields ?? []).map((field) => (
                  <label key={field} className="grid gap-2">
                    <span className="text-sm font-medium capitalize text-foreground">{field.replaceAll("_", " ")} <span className="text-xs font-normal text-slate-400">(opcional)</span></span>
                    <input name={field} autoComplete={getFieldAutoComplete(field)} defaultValue={editTarget.decrypted[field] ?? ""} className={inputClass} />
                  </label>
                ))}
                {editError ? <p className="md:col-span-2 text-sm text-red-600">{editError}</p> : null}
                <div className="md:col-span-2 flex gap-3">
                  <button type="submit" disabled={editLoading} className="rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-70">{editLoading ? "Salvando..." : "Salvar alteracoes"}</button>
                  <button type="button" onClick={closeEdit} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Cancelar</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleEditCardSubmit} autoComplete="off" className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="grid gap-2"><span className="text-sm font-medium text-foreground">Apelido</span><input name="nickname" required defaultValue={editTarget.item.nickname} className={inputClass} /></label>
                <label className="grid gap-2"><span className="text-sm font-medium text-foreground">Ambiente</span>
                  <select name="environment" defaultValue={editTarget.item.environment ?? "test"} className={inputClass}>
                    <option value="test">Teste</option><option value="production">Producao</option>
                  </select>
                </label>
                <label className="grid gap-2 md:col-span-2"><span className="text-sm font-medium text-foreground">Numero do cartao</span><input name="number" required autoComplete="off" defaultValue={editTarget.decryptedNumber} className={inputClass} onChange={(e) => handleEditCardNumberInput(e.target.value)} /></label>
                <label className="grid gap-2"><span className="text-sm font-medium text-foreground">Nome no cartao</span><input name="cardholder_name" defaultValue={editTarget.item.cardholder_name ?? ""} className={inputClass} /></label>
                <label className="grid gap-2"><span className="text-sm font-medium text-foreground">Banco</span><input name="bank" defaultValue={editTarget.item.bank ?? ""} className={inputClass} /></label>
                <label className="grid gap-2"><span className="text-sm font-medium text-foreground">MM</span><input name="expiry_month" maxLength={2} defaultValue={editTarget.item.expiry_month ?? ""} className={inputClass} /></label>
                <label className="grid gap-2"><span className="text-sm font-medium text-foreground">AA</span><input name="expiry_year" maxLength={2} defaultValue={editTarget.item.expiry_year ?? ""} className={inputClass} /></label>
                <label className="grid gap-2"><span className="text-sm font-medium text-foreground">CVV</span><input name="cvv" required maxLength={4} defaultValue={editTarget.decryptedCvv} className={inputClass} /></label>
                <label className="grid gap-2"><span className="text-sm font-medium text-foreground">Tipo</span>
                  <select name="card_type" defaultValue={editTarget.item.card_type ?? "credit"} className={inputClass}>
                    <option value="credit">Credito</option><option value="debit">Debito</option><option value="prepaid">Pre-pago</option><option value="virtual">Virtual</option>
                  </select>
                </label>
                <label className="grid gap-2 md:col-span-2"><span className="text-sm font-medium text-foreground">Observacoes</span><textarea name="notes" rows={3} defaultValue={editTarget.item.notes ?? ""} className={inputClass} /></label>
                <div className="md:col-span-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-medium text-amber-800">{editCardBrand}</span>
                  <span className="font-mono">{editMaskedNumber}</span>
                </div>
                {editError ? <p className="md:col-span-2 text-sm text-red-600">{editError}</p> : null}
                <div className="md:col-span-2 flex gap-3">
                  <button type="submit" disabled={editLoading} className="rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-70">{editLoading ? "Salvando..." : "Salvar alteracoes"}</button>
                  <button type="button" onClick={closeEdit} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Cancelar</button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}

      {/* Delete modal */}
      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Confirmacao</div>
            <h3 className="mt-2 text-2xl font-semibold text-brand-ink">Apagar item do vault</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Isso vai remover <strong>{deleteTarget.label}</strong> deste projeto. A senha do vault atual sera usada para autorizar a exclusao.
            </p>
            {deleteError ? <p className="mt-4 text-sm text-red-600">{deleteError}</p> : null}
            <form onSubmit={handleDeleteSubmit} className="mt-6 flex gap-3">
              <button type="submit" disabled={deleteLoading} className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-70">
                {deleteLoading ? "Apagando..." : "Apagar"}
              </button>
              <button type="button" onClick={closeDelete} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Cancelar</button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
