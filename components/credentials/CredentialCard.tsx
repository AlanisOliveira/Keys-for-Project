"use client";

import { Copy, Eye, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import type { CredentialRecord, PublicCredential } from "@/lib/types";

interface CredentialCardProps {
  credential: CredentialRecord | PublicCredential;
  onReveal?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

export function CredentialCard({ credential, onReveal, onCopy, onDelete, onEdit }: CredentialCardProps) {
  return (
    <Panel className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{credential.label}</h3>
          <p className="text-sm uppercase tracking-[0.16em] text-slate-500">{credential.type.replaceAll("_", " ")}</p>
        </div>
        {credential.environment ? <Badge>{credential.environment}</Badge> : null}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 font-mono text-sm text-cyan-200">
        {credential.preview ?? "•••"}
      </div>
      <div className="flex flex-wrap gap-3 text-sm">
        <button onClick={onReveal} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-slate-700">
          <Eye className="h-4 w-4" />
          Revelar
        </button>
        <button onClick={onCopy} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-slate-700">
          <Copy className="h-4 w-4" />
          Copiar
        </button>
        {onEdit ? (
          <button onClick={onEdit} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-slate-700">
            <Pencil className="h-4 w-4" />
            Editar
          </button>
        ) : null}
        {onDelete ? (
          <button onClick={onDelete} className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-red-700">
            <Trash2 className="h-4 w-4" />
            Apagar
          </button>
        ) : null}
      </div>
    </Panel>
  );
}
