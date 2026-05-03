import { cache } from "react";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";

import { sessionOptions } from "@/lib/session";
import type { SessionData } from "@/lib/session";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import type { AppRole, Profile } from "@/lib/types";

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  if (!session.userId) {
    return null;
  }

  const row = await db.query.profiles.findFirst({
    where: eq(profiles.id, session.userId),
    columns: { id: true, role: true, cpf: true, created_at: true },
  });

  if (!row) return null;

  return {
    id: row.id,
    role: row.role as AppRole,
    cpf: row.cpf,
    created_at: row.created_at ?? new Date().toISOString(),
  };
});

export const getCurrentRole = cache(async (): Promise<AppRole | null> => {
  const profile = await getCurrentProfile();
  return profile?.role ?? null;
});
