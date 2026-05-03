import Link from "next/link";

import { Panel } from "@/components/ui/Panel";
import type { Project } from "@/lib/types";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Panel className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="h-4 w-4 rounded-full" style={{ backgroundColor: project.color }} />
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{project.name}</h3>
          <p className="text-sm text-slate-500">{project.client_name ?? "Sem cliente vinculado"}</p>
        </div>
      </div>
      <p className="text-sm leading-6 text-slate-600">{project.description ?? "Projeto pronto para receber credenciais e cartões."}</p>
      <div className="mt-auto flex flex-wrap gap-3 text-sm font-semibold">
        <Link href={`/projects/${project.id}`} className="text-brand-ink underline-offset-4 hover:underline">
          Abrir projeto
        </Link>
        <Link href={`/projects/${project.id}/credentials/new`} className="text-slate-500 underline-offset-4 hover:underline">
          Nova credencial
        </Link>
      </div>
    </Panel>
  );
}
