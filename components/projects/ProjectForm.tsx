"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Panel } from "@/components/ui/Panel";
import { isProjectKeyValid } from "@/lib/validators";

export function ProjectForm() {
  const router = useRouter();
  const [result, setResult] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    const payload = {
      name: String(formData.get("name") ?? ""),
      client_name: String(formData.get("client_name") ?? ""),
      description: String(formData.get("description") ?? ""),
      color: String(formData.get("color") ?? "#48C7F5"),
      projectKey: String(formData.get("projectKey") ?? ""),
    };

    if (!isProjectKeyValid(payload.projectKey)) {
      setResult("A Project Key precisa ter 6 dígitos.");
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setResult(typeof data.error === "string" ? data.error : "Não foi possível criar o projeto.");
        return;
      }

      setResult("Projeto criado com sucesso.");
      router.push(`/projects/${data.projectId}`);
      router.refresh();
    } catch {
      setResult("Não foi possível criar o projeto agora.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Panel>
      <form action={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Nome do projeto</span>
          <input name="name" required className="rounded-2xl border border-border bg-background px-4 py-3" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Cliente</span>
          <input name="client_name" className="rounded-2xl border border-border bg-background px-4 py-3" />
        </label>
        <label className="grid gap-2 md:col-span-2">
          <span className="text-sm font-medium text-foreground">Descrição</span>
          <textarea name="description" rows={4} className="rounded-2xl border border-border bg-background px-4 py-3" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Cor</span>
          <input name="color" type="color" defaultValue="#48C7F5" className="h-12 rounded-2xl border border-border bg-background px-2 py-2" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Project Key</span>
          <input
            name="projectKey"
            type="password"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            required
            className="rounded-2xl border border-border bg-background px-4 py-3"
            placeholder="123456"
          />
        </label>
        <div className="md:col-span-2">
          <button
            disabled={isSubmitting}
            className="rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Criando projeto..." : "Criar projeto"}
          </button>
        </div>
      </form>
      {result ? <p className="mt-4 text-sm text-mutedForeground">{result}</p> : null}
    </Panel>
  );
}
