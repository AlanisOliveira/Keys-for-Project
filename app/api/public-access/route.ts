import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";

import { db } from "@/lib/db";
import { projects, credentials, cards } from "@/lib/db/schema";
import { isProjectKeyValid } from "@/lib/validators";

const requestSchema = z.object({
  projectId: z.string().min(1),
  itemType: z.enum(["credential", "card"]),
  itemId: z.string().min(1),
  action: z.enum(["reveal", "copy"]),
  projectKey: z.string().length(6),
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());

    if (!isProjectKeyValid(body.projectKey)) {
      return NextResponse.json({ ok: false, error: "Project Key invalida." }, { status: 400 });
    }

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, body.projectId),
      columns: { project_key_hash: true },
    });

    if (!project?.project_key_hash) {
      return NextResponse.json({ ok: false, error: "Projeto nao encontrado." }, { status: 404 });
    }

    const matches = await bcrypt.compare(body.projectKey, project.project_key_hash);
    if (!matches) {
      return NextResponse.json({ ok: false, error: "Project Key incorreta." }, { status: 401 });
    }

    if (body.itemType === "credential") {
      const credential = await db.query.credentials.findFirst({
        where: and(eq(credentials.id, body.itemId), eq(credentials.project_id, body.projectId)),
        columns: { id: true, label: true, type: true, encrypted_data: true },
      });

      if (!credential) {
        return NextResponse.json({ ok: false, error: "Credencial nao encontrada." }, { status: 404 });
      }

      return NextResponse.json({ ok: true, itemType: "credential", item: credential });
    }

    const card = await db.query.cards.findFirst({
      where: and(eq(cards.id, body.itemId), eq(cards.project_id, body.projectId)),
      columns: { id: true, nickname: true, brand: true, last_four: true, encrypted_number: true, encrypted_cvv: true },
    });

    if (!card) {
      return NextResponse.json({ ok: false, error: "Cartao nao encontrado." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, itemType: "card", item: card });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "Nao foi possivel validar o acesso." }, { status: 500 });
  }
}
