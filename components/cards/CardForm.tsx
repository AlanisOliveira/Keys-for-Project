"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import { encrypt, maskCardNumber } from "@/lib/crypto";
import { detectCardBrand, isProjectKeyValid, validateLuhn } from "@/lib/validators";

export function CardForm() {
  const [output, setOutput] = useState<string | null>(null);
  const [brand, setBrand] = useState("other");
  const [maskedNumber, setMaskedNumber] = useState("•••• •••• •••• 0000");

  async function handleSubmit(formData: FormData) {
    const number = String(formData.get("number") ?? "");
    const cvv = String(formData.get("cvv") ?? "");
    const projectKey = String(formData.get("projectKey") ?? "");

    if (!validateLuhn(number)) {
      setOutput("Número de cartão inválido pelo algoritmo de Luhn.");
      return;
    }

    if (!isProjectKeyValid(projectKey)) {
      setOutput("A Project Key precisa ter 6 dígitos.");
      return;
    }

    const encryptedNumber = await encrypt(number.replace(/\s/g, ""), projectKey);
    const encryptedCvv = await encrypt(cvv, projectKey);

    setOutput(
      JSON.stringify(
        {
          nickname: String(formData.get("nickname") ?? ""),
          brand: detectCardBrand(number),
          last_four: number.replace(/\D/g, "").slice(-4),
          cardholder_name: String(formData.get("cardholder_name") ?? ""),
          expiry_month: String(formData.get("expiry_month") ?? ""),
          expiry_year: String(formData.get("expiry_year") ?? ""),
          bank: String(formData.get("bank") ?? ""),
          card_type: String(formData.get("card_type") ?? ""),
          environment: String(formData.get("environment") ?? ""),
          notes: String(formData.get("notes") ?? ""),
          encrypted_number: encryptedNumber,
          encrypted_cvv: encryptedCvv,
        },
        null,
        2,
      ),
    );
  }

  function handleNumberInput(rawValue: string) {
    const digits = rawValue.replace(/\D/g, "");
    setBrand(detectCardBrand(digits));
    setMaskedNumber(maskCardNumber(digits.slice(-4).padStart(4, "0")));
  }

  return (
    <Panel>
      <form action={handleSubmit} autoComplete="off" className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Apelido</span>
          <input name="nickname" required className="rounded-2xl border border-border bg-background px-4 py-3" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Ambiente</span>
          <select name="environment" className="rounded-2xl border border-border bg-background px-4 py-3">
            <option value="test">Teste</option>
            <option value="production">Produção</option>
          </select>
        </label>
        <label className="grid gap-2 md:col-span-2">
          <span className="text-sm font-medium text-foreground">Número do cartão</span>
          <input
            name="number"
            required
            autoComplete="off"
            placeholder="4242 4242 4242 4242"
            className="rounded-2xl border border-border bg-background px-4 py-3"
            onChange={(event) => handleNumberInput(event.target.value)}
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Nome no cartão</span>
          <input name="cardholder_name" autoComplete="off" className="rounded-2xl border border-border bg-background px-4 py-3" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Banco</span>
          <input name="bank" autoComplete="off" className="rounded-2xl border border-border bg-background px-4 py-3" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">MM</span>
          <input name="expiry_month" autoComplete="cc-exp-month" maxLength={2} className="rounded-2xl border border-border bg-background px-4 py-3" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">AA</span>
          <input name="expiry_year" autoComplete="cc-exp-year" maxLength={2} className="rounded-2xl border border-border bg-background px-4 py-3" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">CVV</span>
          <input name="cvv" required autoComplete="cc-csc" maxLength={4} className="rounded-2xl border border-border bg-background px-4 py-3" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Tipo</span>
          <select name="card_type" className="rounded-2xl border border-border bg-background px-4 py-3">
            <option value="credit">Crédito</option>
            <option value="debit">Débito</option>
            <option value="prepaid">Pré-pago</option>
            <option value="virtual">Virtual</option>
          </select>
        </label>
        <label className="grid gap-2 md:col-span-2">
          <span className="text-sm font-medium text-foreground">Observações</span>
          <textarea name="notes" rows={3} className="rounded-2xl border border-border bg-background px-4 py-3" />
        </label>
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

        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <Badge tone={brand === "other" ? "default" : "warning"}>{brand}</Badge>
          <span className="font-mono text-sm text-mutedForeground">{maskedNumber}</span>
        </div>

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
