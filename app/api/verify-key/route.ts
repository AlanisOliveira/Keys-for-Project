import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { isProjectKeyValid } from "@/lib/validators";

const bodySchema = z.object({
  projectId: z.string().min(1),
  projectKey: z.string().length(6),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());

    if (!isProjectKeyValid(body.projectKey)) {
      return NextResponse.json({ ok: false, error: "Formato de Project Key invalido." }, { status: 400 });
    }

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, body.projectId),
      columns: { project_key_hash: true },
    });

    if (!project?.project_key_hash) {
      return NextResponse.json({ ok: false, error: "Projeto nao encontrado." }, { status: 404 });
    }

    const matches = await bcrypt.compare(body.projectKey, project.project_key_hash);

    return NextResponse.json({ ok: matches });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "Erro interno inesperado." }, { status: 500 });
  }
}
