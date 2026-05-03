"use client";

import { Copy, Eye, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import { maskCardNumber } from "@/lib/crypto";
import type { CardRecord, PublicCard } from "@/lib/types";

interface CreditCardDisplayProps {
  card: CardRecord | PublicCard;
  onReveal?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

export function CreditCardDisplay({ card, onReveal, onCopy, onDelete, onEdit }: CreditCardDisplayProps) {
  return (
    <Panel className="overflow-hidden bg-gradient-to-br from-brand-ink via-slate-900 to-slate-700 text-white">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-[0.2em] text-white/60">VaultManager</div>
        <Badge tone={card.environment === "production" ? "danger" : "warning"}>{card.environment ?? "test"}</Badge>
      </div>
      <div className="mt-12 text-2xl tracking-[0.24em]">{maskCardNumber(card.last_four)}</div>
      <div className="mt-8 flex items-end justify-between gap-6">
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-white/50">Portador</div>
          <div className="mt-1 text-sm font-medium">{card.cardholder_name ?? "N/A"}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-white/50">Validade</div>
          <div className="mt-1 text-sm font-medium">
            {card.expiry_month ?? "MM"}/{card.expiry_year ?? "AA"}
          </div>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <button onClick={onReveal} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-white/85">
          <Eye className="h-4 w-4" />
          Revelar
        </button>
        <button onClick={onCopy} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-white/85">
          <Copy className="h-4 w-4" />
          Copiar
        </button>
        {onEdit ? (
          <button onClick={onEdit} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-white/85">
            <Pencil className="h-4 w-4" />
            Editar
          </button>
        ) : null}
        {onDelete ? (
          <button onClick={onDelete} className="inline-flex items-center gap-2 rounded-full border border-red-300/40 px-4 py-2 text-red-100">
            <Trash2 className="h-4 w-4" />
            Apagar
          </button>
        ) : null}
      </div>
    </Panel>
  );
}
