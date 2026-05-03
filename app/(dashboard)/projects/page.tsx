import Link from "next/link";
import { desc } from "drizzle-orm";

import { ProjectCard } from "@/components/projects/ProjectCard";
import { getCurrentRole } from "@/lib/profile";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import type { Project } from "@/lib/types";

export default async function ProjectsPage() {
  const role = await getCurrentRole();

  const rows = await db.query.projects.findMany({
    columns: { id: true, name: true, client_name: true, description: true, color: true, created_by: true, created_at: true, updated_at: true },
    orderBy: [desc(projects.created_at)],
  });

  const projectList: Project[] = rows.map((r) => ({
    ...r,
    client_name: r.client_name ?? null,
    description: r.description ?? null,
    created_by: r.created_by ?? null,
    created_at: r.created_at ?? "",
    updated_at: r.updated_at ?? "",
  }));

  return (
    <main>
      <header className="flex flex-col gap-3 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Projetos</div>
          <h1 className="mt-2 text-4xl font-semibold text-brand-ink">Cofres por cliente e ambiente</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Organize cada projeto em um espaco proprio para consultar credenciais, cartoes e acessos com rapidez.
          </p>
        </div>
        {role === "admin" ? (
          <Link href="/projects/new" className="rounded-full bg-brand-ink px-5 py-3 text-sm font-semibold text-white">
            Criar projeto
          </Link>
        ) : null}
      </header>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        {projectList.length === 0 ? (
          <p className="text-sm text-slate-600">Nenhum projeto cadastrado ainda.</p>
        ) : null}
        {projectList.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </section>
    </main>
  );
}
