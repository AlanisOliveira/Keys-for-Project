"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { normalizeCpf } from "@/lib/auth";
import { isCpfValid } from "@/lib/validators";

export function LoginForm() {
  const router = useRouter();
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function formatCpf(value: string) {
    const digits = normalizeCpf(value).slice(0, 11);
    return digits
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const normalizedCpf = normalizeCpf(cpf);

    if (!isCpfValid(normalizedCpf)) {
      setError("Digite um CPF valido com 11 numeros.");
      return;
    }

    if (!password.trim()) {
      setError("Digite sua senha.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf: normalizedCpf, password }),
      });

      const data = await response.json();

      if (!data.ok) {
        setError(data.error ?? "CPF ou senha invalidos.");
        return;
      }

      router.push("/projects");
      router.refresh();
    } catch {
      setError("Nao foi possivel entrar agora.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-foreground">CPF</span>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="username"
          value={cpf}
          onChange={(event) => setCpf(formatCpf(event.target.value))}
          placeholder="000.000.000-00"
          className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition focus:border-slate-400"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-foreground">Senha</span>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Digite sua senha"
          className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition focus:border-slate-400"
        />
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-brand-ink px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
