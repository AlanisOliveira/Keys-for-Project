import Link from "next/link";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { PublicProjectLinkCard } from "@/components/projects/PublicProjectLinkCard";
import { ProjectActions } from "@/components/projects/ProjectActions";
import { Panel } from "@/components/ui/Panel";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import type { Project } from "@/lib/types";

interface ProjectPageProps {
  params: {
    id: string;
  };
}

export default async function ProjectOverviewPage({ params }: ProjectPageProps) {
  const requestHeaders = headers();
  const forwardedProto = requestHeaders.get("x-forwarded-proto");
  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const host = requestHeaders.get("host");
  const origin =
    forwardedProto && forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : host
        ? `${process.env.NODE_ENV === "production" ? "https" : "http"}://${host}`
        : process.env.NEXT_PUBLIC_APP_URL ?? "";

  const row = await db.query.projects.findFirst({
    where: eq(projects.id, params.id),
    columns: { id: true, name: true, client_name: true, description: true, color: true, created_by: true, created_at: true, updated_at: true },
  });

  const publicUrl = `${origin}/vault/${params.id}`;

  if (!row) {
    return (
      <main>
        <p className="text-sm text-slate-600">Projeto nao encontrado.</p>
      </main>
    );
  }

  const project: Project = {
    id: row.id,
    name: row.name,
    client_name: row.client_name ?? null,
    description: row.description ?? null,
    color: row.color,
    created_by: row.created_by ?? null,
    created_at: row.created_at ?? "",
    updated_at: row.updated_at ?? "",
  };

  return (
    <main>
      <header className="border-b border-slate-200 pb-6">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Projeto</div>
        <h1 className="mt-2 text-4xl font-semibold text-brand-ink">{project.name}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          {project.description ?? "Aqui voce concentra o que e essencial para o dia a dia do projeto."}
        </p>
        <ProjectActions project={project} />
      </header>

      <PublicProjectLinkCard publicUrl={publicUrl} />

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <Panel>
          <h2 className="text-xl font-semibold text-slate-950">Credenciais</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Acesse logins, chaves e informacoes tecnicas com visual protegido e consulta rapida.</p>
          <div className="mt-6 flex gap-4 text-sm font-semibold">
            <Link href={`/projects/${params.id}/credentials`} className="text-brand-ink underline-offset-4 hover:underline">Abrir modulo</Link>
            <Link href={`/projects/${params.id}/credentials/new`} className="text-slate-500 underline-offset-4 hover:underline">Criar credencial</Link>
          </div>
        </Panel>
        <Panel>
          <h2 className="text-xl font-semibold text-slate-950">Cartoes</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Mantenha cartoes de teste e producao organizados para uso pratico.</p>
          <div className="mt-6 flex gap-4 text-sm font-semibold">
            <Link href={`/projects/${params.id}/cards`} className="text-brand-ink underline-offset-4 hover:underline">Abrir modulo</Link>
            <Link href={`/projects/${params.id}/cards/new`} className="text-slate-500 underline-offset-4 hover:underline">Criar cartao</Link>
          </div>
        </Panel>
      </section>
    </main>
  );
}
