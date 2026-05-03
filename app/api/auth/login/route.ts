import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { sessionOptions } from "@/lib/session";
import type { SessionData } from "@/lib/session";
import { normalizeCpf } from "@/lib/auth";
import { isCpfValid } from "@/lib/validators";

const loginSchema = z.object({
  cpf: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await request.json());
    const normalizedCpf = normalizeCpf(body.cpf);

    if (!isCpfValid(normalizedCpf)) {
      return NextResponse.json({ ok: false, error: "CPF invalido." }, { status: 400 });
    }

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.cpf, normalizedCpf),
    });

    if (!profile) {
      return NextResponse.json({ ok: false, error: "CPF ou senha invalidos." }, { status: 401 });
    }

    const matches = await bcrypt.compare(body.password, profile.password_hash);

    if (!matches) {
      return NextResponse.json({ ok: false, error: "CPF ou senha invalidos." }, { status: 401 });
    }

    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    session.userId = profile.id;
    session.role = profile.role;
    await session.save();

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "Nao foi possivel entrar." }, { status: 500 });
  }
}
