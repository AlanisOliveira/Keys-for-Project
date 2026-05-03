import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";

import { db } from "@/lib/db";
import { projects, credentials, cards } from "@/lib/db/schema";
import { isProjectKeyValid, validateLuhn } from "@/lib/validators";

const encryptedPayloadSchema = z.object({
  iv: z.string().min(1),
  salt: z.string().min(1),
  ciphertext: z.string().min(1),
});

const credentialTypeEnum = z.enum(["password", "web_login", "totp", "api_token", "api_keypair", "certificate", "webhook", "env_var", "ftp", "database", "oauth", "smtp"]);
const cardBrandEnum = z.enum(["visa", "mastercard", "amex", "elo", "hipercard", "other"]);
const cardTypeEnum = z.enum(["credit", "debit", "prepaid", "virtual"]);

const createCredentialSchema = z.object({
  itemType: z.literal("credential"),
  projectId: z.string().min(1),
  projectKey: z.string().length(6),
  payload: z.object({
    type: credentialTypeEnum,
    label: z.string().min(1),
    preview: z.string().min(1),
    environment: z.enum(["production", "staging", "development", "test"]).nullable().optional(),
    expires_at: z.string().nullable().optional(),
    encrypted_data: encryptedPayloadSchema,
  }),
});

const createCardSchema = z.object({
  itemType: z.literal("card"),
  projectId: z.string().min(1),
  projectKey: z.string().length(6),
  payload: z.object({
    nickname: z.string().min(1),
    brand: cardBrandEnum.nullable().optional(),
    last_four: z.string().min(4).max(4),
    cardholder_name: z.string().nullable().optional(),
    expiry_month: z.string().nullable().optional(),
    expiry_year: z.string().nullable().optional(),
    bank: z.string().nullable().optional(),
    card_type: cardTypeEnum.nullable().optional(),
    environment: z.enum(["production", "test"]).nullable().optional(),
    notes: z.string().nullable().optional(),
    encrypted_number: encryptedPayloadSchema,
    encrypted_cvv: encryptedPayloadSchema,
  }),
});

const updateCredentialSchema = z.object({
  itemType: z.literal("credential"),
  projectId: z.string().min(1),
  projectKey: z.string().length(6),
  itemId: z.string().min(1),
  payload: z.object({
    type: credentialTypeEnum,
    label: z.string().min(1),
    preview: z.string().min(1),
    environment: z.enum(["production", "staging", "development", "test"]).nullable().optional(),
    expires_at: z.string().nullable().optional(),
    encrypted_data: encryptedPayloadSchema,
  }),
});

const updateCardSchema = z.object({
  itemType: z.literal("card"),
  projectId: z.string().min(1),
  projectKey: z.string().length(6),
  itemId: z.string().min(1),
  payload: z.object({
    nickname: z.string().min(1),
    brand: cardBrandEnum.nullable().optional(),
    last_four: z.string().min(4).max(4),
    cardholder_name: z.string().nullable().optional(),
    expiry_month: z.string().nullable().optional(),
    expiry_year: z.string().nullable().optional(),
    bank: z.string().nullable().optional(),
    card_type: cardTypeEnum.nullable().optional(),
    environment: z.enum(["production", "test"]).nullable().optional(),
    notes: z.string().nullable().optional(),
    encrypted_number: encryptedPayloadSchema,
    encrypted_cvv: encryptedPayloadSchema,
  }),
});

const requestSchema = z.discriminatedUnion("itemType", [createCredentialSchema, createCardSchema]);
const updateRequestSchema = z.discriminatedUnion("itemType", [updateCredentialSchema, updateCardSchema]);
const deleteSchema = z.object({
  projectId: z.string().min(1),
  projectKey: z.string().length(6),
  itemType: z.enum(["credential", "card"]),
  itemId: z.string().min(1),
});

async function validateProjectKey(projectId: string, projectKey: string) {
  if (!isProjectKeyValid(projectKey)) {
    return { error: NextResponse.json({ ok: false, error: "Project Key invalida." }, { status: 400 }) };
  }

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: { project_key_hash: true },
  });

  if (!project?.project_key_hash) {
    return { error: NextResponse.json({ ok: false, error: "Projeto nao encontrado." }, { status: 404 }) };
  }

  const matches = await bcrypt.compare(projectKey, project.project_key_hash);
  if (!matches) {
    return { error: NextResponse.json({ ok: false, error: "Project Key incorreta." }, { status: 401 }) };
  }

  return { ok: true };
}

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const validated = await validateProjectKey(body.projectId, body.projectKey);

    if ("error" in validated) {
      return validated.error;
    }

    if (body.itemType === "credential") {
      const id = crypto.randomUUID();

      await db.insert(credentials).values({
        id,
        project_id: body.projectId,
        type: body.payload.type,
        label: body.payload.label,
        preview: body.payload.preview,
        environment: body.payload.environment ?? null,
        expires_at: body.payload.expires_at ?? null,
        encrypted_data: body.payload.encrypted_data,
      });

      const row = await db.query.credentials.findFirst({
        where: eq(credentials.id, id),
        columns: { id: true, project_id: true, type: true, label: true, preview: true, environment: true, expires_at: true, created_at: true, updated_at: true },
      });

      return NextResponse.json({ ok: true, itemType: "credential", item: row });
    }

    validateLuhn(body.payload.last_four.padStart(12, "0"));

    const id = crypto.randomUUID();

    await db.insert(cards).values({
      id,
      project_id: body.projectId,
      nickname: body.payload.nickname,
      brand: body.payload.brand ?? null,
      last_four: body.payload.last_four,
      cardholder_name: body.payload.cardholder_name ?? null,
      expiry_month: body.payload.expiry_month ?? null,
      expiry_year: body.payload.expiry_year ?? null,
      bank: body.payload.bank ?? null,
      card_type: body.payload.card_type ?? null,
      environment: body.payload.environment ?? null,
      notes: body.payload.notes ?? null,
      encrypted_number: body.payload.encrypted_number,
      encrypted_cvv: body.payload.encrypted_cvv,
    });

    const row = await db.query.cards.findFirst({
      where: eq(cards.id, id),
      columns: { id: true, project_id: true, nickname: true, brand: true, last_four: true, cardholder_name: true, expiry_month: true, expiry_year: true, bank: true, card_type: true, environment: true, notes: true, created_at: true, updated_at: true },
    });

    return NextResponse.json({ ok: true, itemType: "card", item: row });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "Nao foi possivel criar o item." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = updateRequestSchema.parse(await request.json());
    const validated = await validateProjectKey(body.projectId, body.projectKey);

    if ("error" in validated) {
      return validated.error;
    }

    if (body.itemType === "credential") {
      const existing = await db.query.credentials.findFirst({
        where: and(eq(credentials.id, body.itemId), eq(credentials.project_id, body.projectId)),
        columns: { id: true },
      });

      if (!existing) {
        return NextResponse.json({ ok: false, error: "Credencial nao encontrada." }, { status: 404 });
      }

      await db
        .update(credentials)
        .set({
          type: body.payload.type,
          label: body.payload.label,
          preview: body.payload.preview,
          environment: body.payload.environment ?? null,
          expires_at: body.payload.expires_at ?? null,
          encrypted_data: body.payload.encrypted_data,
          updated_at: new Date().toISOString(),
        })
        .where(and(eq(credentials.id, body.itemId), eq(credentials.project_id, body.projectId)));

      const row = await db.query.credentials.findFirst({
        where: eq(credentials.id, body.itemId),
        columns: { id: true, project_id: true, type: true, label: true, preview: true, environment: true, expires_at: true, created_at: true, updated_at: true },
      });

      return NextResponse.json({ ok: true, itemType: "credential", item: row });
    }

    const existing = await db.query.cards.findFirst({
      where: and(eq(cards.id, body.itemId), eq(cards.project_id, body.projectId)),
      columns: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Cartao nao encontrado." }, { status: 404 });
    }

    await db
      .update(cards)
      .set({
        nickname: body.payload.nickname,
        brand: body.payload.brand ?? null,
        last_four: body.payload.last_four,
        cardholder_name: body.payload.cardholder_name ?? null,
        expiry_month: body.payload.expiry_month ?? null,
        expiry_year: body.payload.expiry_year ?? null,
        bank: body.payload.bank ?? null,
        card_type: body.payload.card_type ?? null,
        environment: body.payload.environment ?? null,
        notes: body.payload.notes ?? null,
        encrypted_number: body.payload.encrypted_number,
        encrypted_cvv: body.payload.encrypted_cvv,
        updated_at: new Date().toISOString(),
      })
      .where(and(eq(cards.id, body.itemId), eq(cards.project_id, body.projectId)));

    const row = await db.query.cards.findFirst({
      where: eq(cards.id, body.itemId),
      columns: { id: true, project_id: true, nickname: true, brand: true, last_four: true, cardholder_name: true, expiry_month: true, expiry_year: true, bank: true, card_type: true, environment: true, notes: true, created_at: true, updated_at: true },
    });

    return NextResponse.json({ ok: true, itemType: "card", item: row });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "Nao foi possivel atualizar o item." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = deleteSchema.parse(await request.json());
    const validated = await validateProjectKey(body.projectId, body.projectKey);

    if ("error" in validated) {
      return validated.error;
    }

    if (body.itemType === "credential") {
      const existing = await db.query.credentials.findFirst({
        where: and(eq(credentials.id, body.itemId), eq(credentials.project_id, body.projectId)),
        columns: { id: true },
      });

      if (!existing) {
        return NextResponse.json({ ok: false, error: "Credencial nao encontrada." }, { status: 404 });
      }

      await db.delete(credentials).where(and(eq(credentials.id, body.itemId), eq(credentials.project_id, body.projectId)));

      return NextResponse.json({ ok: true, itemType: "credential", id: body.itemId });
    }

    const existing = await db.query.cards.findFirst({
      where: and(eq(cards.id, body.itemId), eq(cards.project_id, body.projectId)),
      columns: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Cartao nao encontrado." }, { status: 404 });
    }

    await db.delete(cards).where(and(eq(cards.id, body.itemId), eq(cards.project_id, body.projectId)));

    return NextResponse.json({ ok: true, itemType: "card", id: body.itemId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "Nao foi possivel apagar o item." }, { status: 500 });
  }
}
