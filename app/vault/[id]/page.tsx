import Link from "next/link";
import { eq, desc } from "drizzle-orm";

import { PublicVaultClient } from "@/components/public/PublicVaultClient";
import { Panel } from "@/components/ui/Panel";
import { db } from "@/lib/db";
import { projects, credentials, cards } from "@/lib/db/schema";
import type { PublicCard, PublicCredential, PublicProject } from "@/lib/types";

export const dynamic = "force-dynamic";

interface PublicVaultPageProps {
  params: {
    id: string;
  };
}

export default async function PublicVaultPage({ params }: PublicVaultPageProps) {
  const [project, credentialRows, cardRows] = await Promise.all([
    db.query.projects.findFirst({
      where: eq(projects.id, params.id),
      columns: { id: true, name: true, client_name: true, description: true, color: true },
    }),
    db.query.credentials.findMany({
      where: eq(credentials.project_id, params.id),
      columns: { id: true, project_id: true, type: true, label: true, preview: true, environment: true, expires_at: true, created_at: true, updated_at: true },
      orderBy: [desc(credentials.created_at)],
    }),
    db.query.cards.findMany({
      where: eq(cards.project_id, params.id),
      columns: { id: true, project_id: true, nickname: true, brand: true, last_four: true, cardholder_name: true, expiry_month: true, expiry_year: true, bank: true, card_type: true, environment: true, notes: true, created_at: true, updated_at: true },
      orderBy: [desc(cards.created_at)],
    }),
  ]);

  if (!project) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-12">
        <Panel className="max-w-xl text-center">
          <h1 className="text-3xl font-semibold text-brand-ink">Projeto nao encontrado</h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Verifique se o link esta correto. Se precisar, solicite um novo acesso para quem gerencia este projeto.
          </p>
        </Panel>
      </main>
    );
  }

  const typedProject = project as PublicProject;
  const typedCredentials = credentialRows as PublicCredential[];
  const typedCards = cardRows as PublicCard[];

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <header className="border-b border-slate-200 pb-6">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Acesso do projeto</div>
        <h1 className="mt-2 text-4xl font-semibold text-brand-ink">{typedProject.name}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Aqui voce pode consultar as informacoes do seu projeto de forma organizada. Os dados aparecem protegidos e, quando necessario, a senha do projeto sera solicitada para revelar o conteudo completo.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
          {typedProject.client_name ? <span>Cliente: {typedProject.client_name}</span> : null}
          {typedProject.description ? <span>{typedProject.description}</span> : null}
        </div>
      </header>

      <PublicVaultClient project={typedProject} credentials={typedCredentials} cards={typedCards} />

      <footer className="mt-10">
        <Link href="/" className="text-sm font-medium text-slate-500 underline-offset-4 hover:underline">
          Voltar para a pagina inicial
        </Link>
      </footer>
    </main>
  );
}
