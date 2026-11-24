import { z } from "zod";
import { mealPlanSchema } from "@/lib/planner/schema";
import { userSettingsSchema } from "@/lib/settings/settings";
import { shoppingListSchema } from "@/lib/shopping/schema";
import { decodeDocument, type DocumentOptions } from "./local-document";

/**
 * Export / import of everything saved on this device, as one JSON file.
 * Import runs each document through the same schema and migrations as a
 * normal read, so a file can never put invalid data into storage.
 */
export const BACKUP_FORMAT = "protein-plate-backup";
export const BACKUP_VERSION = 1;
export const BACKUP_MAX_BYTES = 2_000_000;

const documentOptions: Record<"settings" | "plan" | "shopping", { schema: z.ZodType; options: DocumentOptions }> = {
  settings: { schema: userSettingsSchema, options: { version: 1 } },
  plan: { schema: mealPlanSchema, options: { version: 1 } },
  shopping: { schema: shoppingListSchema, options: { version: 1 } },
};

export type BackupDocuments = {
  settings: z.infer<typeof userSettingsSchema> | null;
  plan: z.infer<typeof mealPlanSchema> | null;
  shopping: z.infer<typeof shoppingListSchema> | null;
};

export type Backup = {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  documents: BackupDocuments;
};

export function buildBackup(documents: BackupDocuments, now: Date = new Date()): Backup {
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: now.toISOString(), documents };
}

export function backupFileName(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `protein-plate-data-${y}-${m}-${d}.json`;
}

export type BackupError = "tooLarge" | "notJson" | "notBackup" | "newer" | "damaged";

export function parseBackup(text: string): { ok: true; documents: BackupDocuments } | { ok: false; error: BackupError } {
  if (text.length > BACKUP_MAX_BYTES) return { ok: false, error: "tooLarge" };
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "notJson" };
  }
  const envelope = z
    .object({ format: z.literal(BACKUP_FORMAT), version: z.number().int().positive(), documents: z.record(z.string(), z.unknown()) })
    .safeParse(data);
  if (!envelope.success) return { ok: false, error: "notBackup" };
  if (envelope.data.version > BACKUP_VERSION) return { ok: false, error: "newer" };

  const documents: BackupDocuments = { settings: null, plan: null, shopping: null };
  for (const key of ["settings", "plan", "shopping"] as const) {
    const raw = envelope.data.documents[key];
    if (raw === null || raw === undefined) continue;
    const { schema, options } = documentOptions[key];
    const state = decodeDocument(JSON.stringify(raw), schema, options);
    if (state.status === "invalid") return { ok: false, error: state.reason === "newer" ? "newer" : "damaged" };
    if (state.status === "ready") (documents as Record<string, unknown>)[key] = state.value;
  }
  return { ok: true, documents };
}
