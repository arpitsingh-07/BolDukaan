import { randomUUID } from "node:crypto";
import { getSql } from "./db";
import { makeSlug, editToken } from "./slug";
import {
  storefrontSchema,
  type Storefront,
  type Product,
} from "./storefront";

export interface PublishResult {
  slug: string;
  editToken: string;
}

/** Serialise a JSON-typed field for a JSONB column (null stays SQL/JSON null). */
function jsonb(value: unknown): string {
  return JSON.stringify(value ?? null);
}

/** Map a joined DB row back into the app's Storefront shape. */
function rowToStorefront(row: Record<string, unknown>): Storefront {
  const products = Array.isArray(row.products)
    ? (row.products as Product[])
    : [];
  const candidate = {
    name: (row.name as string) ?? null,
    tagline: (row.tagline as string) ?? null,
    about: (row.about as string) ?? null,
    category: (row.category as string) ?? null,
    phone: (row.phone as string) ?? null,
    whatsapp: (row.whatsapp as string) ?? null,
    address: (row.address as string) ?? null,
    hours: (row.hours as Storefront["hours"]) ?? null,
    products,
    language: (row.language as string) ?? null,
  };
  // Re-validate on the way out too — DB data is trusted, but this keeps the
  // public renderer safe if a row was ever written by another path.
  const parsed = storefrontSchema.safeParse(candidate);
  return parsed.success ? parsed.data : { ...candidate, products };
}

/** Create a new shop + storefront (status 'active'). Returns slug + edit token. */
export async function publishNewStorefront(input: {
  storefront: Storefront;
  transcript: string | null;
}): Promise<PublishResult> {
  const sql = getSql();
  const id = randomUUID();
  const slug = makeSlug(input.storefront.name);
  const token = editToken();
  const sf = input.storefront;

  await sql.transaction([
    sql`INSERT INTO shops (id, slug, edit_token, status, category)
        VALUES (${id}, ${slug}, ${token}, 'active', ${sf.category})`,
    sql`INSERT INTO storefronts
          (shop_id, name, tagline, about, phone, whatsapp, address, hours, products, language, raw_transcript)
        VALUES
          (${id}, ${sf.name}, ${sf.tagline}, ${sf.about}, ${sf.phone}, ${sf.whatsapp}, ${sf.address},
           ${jsonb(sf.hours)}::jsonb, ${jsonb(sf.products)}::jsonb, ${sf.language}, ${input.transcript})`,
  ]);

  return { slug, editToken: token };
}

/**
 * Update an existing storefront — only if the caller presents the matching
 * edit token for that slug. Returns false when the (slug, token) pair is wrong
 * (the login-less ownership check). Never trusts a client-supplied shop id.
 */
export async function updateStorefrontByToken(input: {
  slug: string;
  token: string;
  storefront: Storefront;
  transcript: string | null;
}): Promise<boolean> {
  const sql = getSql();
  const rows = await sql`
    SELECT id FROM shops WHERE slug = ${input.slug} AND edit_token = ${input.token} LIMIT 1`;
  if (rows.length === 0) return false;

  const shopId = rows[0].id as string;
  const sf = input.storefront;

  await sql.transaction([
    sql`UPDATE shops SET category = ${sf.category}, updated_at = now() WHERE id = ${shopId}`,
    sql`UPDATE storefronts SET
          name = ${sf.name}, tagline = ${sf.tagline}, about = ${sf.about},
          phone = ${sf.phone}, whatsapp = ${sf.whatsapp}, address = ${sf.address},
          hours = ${jsonb(sf.hours)}::jsonb, products = ${jsonb(sf.products)}::jsonb,
          language = ${sf.language},
          raw_transcript = COALESCE(${input.transcript}, raw_transcript)
        WHERE shop_id = ${shopId}`,
  ]);

  return true;
}

/** Public read: only active storefronts, only display fields (no secrets). */
export async function getActiveStorefrontBySlug(
  slug: string,
): Promise<Storefront | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT s.category,
           f.name, f.tagline, f.about, f.phone, f.whatsapp, f.address,
           f.hours, f.products, f.language
    FROM shops s
    JOIN storefronts f ON f.shop_id = s.id
    WHERE s.slug = ${slug} AND s.status = 'active'
    LIMIT 1`;
  if (rows.length === 0) return null;
  return rowToStorefront(rows[0]);
}
