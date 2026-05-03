import { NextResponse } from "next/server";
import { z } from "zod";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { projects, profiles } from "@/lib/db/schema";
import { sessionOptions } from "@/lib/session";
import type { SessionData } from "@/lib/session";

const updateProjectSchema = z.object({
  name: z.string().min(1),
  client_name: z.string().optional().default(""),
  description: z.string().optional().default(""),
  color: z.string().min(1).default("#48C7F5"),
});

async function requireAdmin() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  if (!session.userId) return null;
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, session.userId),
    columns: { role: true },
  });
  if (profile?.role !== "admin") return null;
  return session.userId;
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const adminId = await requireAdmin();
    if (!adminId) {
      return NextResponse.json({ ok: false, error: "Nao autorizado." }, { status: 401 });
    }

    const body = updateProjectSchema.parse(await request.json());

    const existing = await db.query.projects.findFirst({
      where: eq(projects.id, params.id),
      columns: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Projeto nao encontrado." }, { status: 404 });
    }

    await db
      .update(projects)
      .set({
        name: body.name,
        client_name: body.client_name || null,
        description: body.description || null,
        color: body.color,
        updated_at: new Date().toISOString(),
      })
      .where(eq(projects.id, params.id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "Nao foi possivel atualizar o projeto." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const adminId = await requireAdmin();
    if (!adminId) {
      return NextResponse.json({ ok: false, error: "Nao autorizado." }, { status: 401 });
    }

    const existing = await db.query.projects.findFirst({
      where: eq(projects.id, params.id),
      columns: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Projeto nao encontrado." }, { status: 404 });
    }

    await db.delete(projects).where(eq(projects.id, params.id));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Nao foi possivel excluir o projeto." }, { status: 500 });
  }
}
