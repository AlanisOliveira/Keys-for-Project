"use client";

import Link from "next/link";
import { Copy, ExternalLink } from "lucide-react";
import { useState } from "react";

import { Panel } from "@/components/ui/Panel";

interface PublicProjectLinkCardProps {
  publicUrl: string;
}

export function PublicProjectLinkCard({ publicUrl }: PublicProjectLinkCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Panel className="mt-8 border-slate-200 bg-slate-50/90">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Acesso do cliente</div>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Link publico do projeto</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Envie este link para o cliente. Ele nao precisa criar conta. Ao abrir, vai visualizar os itens mascarados e usar apenas a senha do projeto para revelar ou copiar informacoes sensiveis.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
          >
            <Copy className="h-4 w-4" />
            {copied ? "Link copiado" : "Copiar link"}
          </button>
          <Link
            href={publicUrl}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-ink px-4 py-3 text-sm font-semibold text-white"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir como cliente
          </Link>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm text-slate-700 break-all">{publicUrl}</div>
    </Panel>
  );
}
