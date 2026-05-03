"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Panel } from "@/components/ui/Panel";
import type { Project } from "@/lib/types";

interface ProjectActionsProps {
  project: Project;
}

export function ProjectActions({ project }: ProjectActionsProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "edit" | "delete">("idle");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(formData.get("name") ?? "").trim(),
          client_name: String(formData.get("client_name") ?? "").trim(),
          description: String(formData.get("description") ?? "").trim(),
          color: String(formData.get("color") ?? "#48C7F5"),
        }),
      });

      const data = await response.json();
      if (!data.ok) {
        setError(typeof data.error === "string" ? data.error : "Nao foi possivel atualizar.");
        return;
      }

      setMode("idle");
      router.refresh();
    } catch {
      setError("Nao foi possivel atualizar o projeto agora.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      const data = await response.json();

      if (!data.ok) {
        setError(typeof data.error === "string" ? data.error : "Nao foi possivel excluir.");
        return;
      }

      router.push("/projects");
      router.refresh();
    } catch {
      setError("Nao foi possivel excluir o projeto agora.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => { setMode("edit"); setError(null); }}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Editar projeto
        </button>
        <button
          type="button"
          onClick={() => { setMode("delete"); setError(null); }}
          className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Excluir projeto
        </button>
      </div>

      {mode === "edit" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Projeto</div>
                <h3 className="mt-2 text-2xl font-semibold text-brand-ink">Editar projeto</h3>
              </div>
              <button type="button" onClick={() => setMode("idle")} className="text-sm text-slate-500">Fechar</button>
            </div>
            <form onSubmit={handleEdit} className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">Nome</span>
                <input
                  name="name"
                  required
                  defaultValue={project.name}
                  className="rounded-2xl border border-border bg-background px-4 py-3"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">Cliente</span>
                <input
                  name="client_name"
                  defaultValue={project.client_name ?? ""}
                  className="rounded-2xl border border-border bg-background px-4 py-3"
                />
              </label>
              <label className="grid gap-2 md:col-span-2">
                <span className="text-sm font-medium text-foreground">Descricao</span>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={project.description ?? ""}
                  className="rounded-2xl border border-border bg-background px-4 py-3"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">Cor</span>
                <input
                  name="color"
                  type="color"
                  defaultValue={project.color}
                  className="h-12 rounded-2xl border border-border bg-background px-2 py-2"
                />
              </label>
              {error ? <p className="md:col-span-2 text-sm text-red-600">{error}</p> : null}
              <div className="md:col-span-2 flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
                >
                  {loading ? "Salvando..." : "Salvar alteracoes"}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("idle")}
                  className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {mode === "delete" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Confirmacao</div>
            <h3 className="mt-2 text-2xl font-semibold text-brand-ink">Excluir projeto</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Isso vai remover <strong>{project.name}</strong> e todas as credenciais e cartoes vinculados. Essa acao nao pode ser desfeita.
            </p>
            {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={handleDelete}
                className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
              >
                {loading ? "Excluindo..." : "Excluir permanentemente"}
              </button>
              <button
                type="button"
                onClick={() => setMode("idle")}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
