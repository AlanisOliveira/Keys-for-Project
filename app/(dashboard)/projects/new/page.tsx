import { redirect } from "next/navigation";

import { ProjectForm } from "@/components/projects/ProjectForm";
import { getCurrentRole } from "@/lib/profile";

export default async function NewProjectPage() {
  const role = await getCurrentRole();

  if (role !== "admin") {
    redirect("/projects");
  }

  return (
    <main>
      <header className="border-b border-border pb-6">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-mutedForeground">Novo projeto</div>
        <h1 className="mt-2 text-4xl font-semibold text-brand-ink">Criar cofre</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-mutedForeground">
          Defina as informações principais do projeto para deixar tudo pronto desde o início, com acesso organizado para você e seu cliente.
        </p>
      </header>
      <section className="mt-8">
        <ProjectForm />
      </section>
    </main>
  );
}
