import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { projects, profiles } from "@/lib/db/schema";
import { sessionOptions } from "@/lib/session";
import type { SessionData } from "@/lib/session";
import { isProjectKeyValid } from "@/lib/validators";

const createProjectSchema = z.object({
  name: z.string().min(1, "Nome do projeto e obrigatorio."),
  client_name: z.string().optional().default(""),
  description: z.string().optional().default(""),
  color: z.string().min(1).default("#48C7F5"),
  projectKey: z.string().length(6, "A Project Key precisa ter 6 digitos."),
});

export async function POST(request: Request) {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);

    if (!session.userId) {
      return NextResponse.json({ ok: false, error: "Sessao expirada. Entre novamente." }, { status: 401 });
    }

    const body = createProjectSchema.parse(await request.json());

    if (!isProjectKeyValid(body.projectKey)) {
      return NextResponse.json({ ok: false, error: "A Project Key precisa ter 6 digitos." }, { status: 400 });
    }

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, session.userId),
      columns: { role: true },
    });

    if (profile?.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Apenas administradores podem criar projetos." }, { status: 403 });
    }

    const projectKeyHash = await bcrypt.hash(body.projectKey, 12);
    const id = crypto.randomUUID();

    await db.insert(projects).values({
      id,
      name: body.name,
      client_name: body.client_name || null,
      description: body.description || null,
      color: body.color,
      project_key_hash: projectKeyHash,
      created_by: session.userId,
    });

    return NextResponse.json({ ok: true, projectId: id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "Nao foi possivel criar o projeto." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);

    if (!session.userId) {
      return NextResponse.json({ ok: false, error: "Nao autorizado." }, { status: 401 });
    }

    const rows = await db.query.projects.findMany({
      columns: { id: true, name: true, client_name: true, description: true, color: true, created_by: true, created_at: true, updated_at: true },
      orderBy: (p, { desc }) => [desc(p.created_at)],
    });

    return NextResponse.json({ ok: true, projects: rows });
  } catch {
    return NextResponse.json({ ok: false, error: "Nao foi possivel carregar os projetos." }, { status: 500 });
  }
}
