import { randomUUID } from "node:crypto";
import { cache } from "react";
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

/** Serialise a JSON-typed field for a JSONB column (null → SQL NULL). */
function jsonb(value: unknown): string | null {
  return value == null ? null : JSON.stringify(value);
}

/** Map a joined DB row back into the app's Storefront shape. */
function rowToStorefront(row: Record<string, unknown>): Storefront {
  const products = Array.isArray(row.products)
    ? (row.products as Product[])
    : [];
  const images = Array.isArray(row.images) ? (row.images as string[]) : [];
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
    images,
    language: (row.language as string) ?? null,
  };
  // Re-validate on the way out too — DB data is trusted, but this keeps the
  // public renderer safe if a row was ever written by another path.
  const parsed = storefrontSchema.safeParse(candidate);
  return parsed.success ? parsed.data : { ...candidate, products, images };
}

/** Create a new shop + storefront (status 'active'). Returns slug + edit token. */
export interface LatLng {
  lat: number;
  lng: number;
}

export async function publishNewStorefront(input: {
  storefront: Storefront;
  transcript: string | null;
  ownerUserId?: string | null;
  location?: LatLng | null;
}): Promise<PublishResult> {
  const sql = getSql();
  const id = randomUUID();
  const slug = makeSlug(input.storefront.name);
  const token = editToken();
  const sf = input.storefront;
  const owner = input.ownerUserId ?? null;
  const lat = input.location?.lat ?? null;
  const lng = input.location?.lng ?? null;

  await sql.transaction([
    sql`INSERT INTO shops (id, slug, edit_token, status, category, owner_user_id, lat, lng)
        VALUES (${id}, ${slug}, ${token}, 'active', ${sf.category}, ${owner}, ${lat}, ${lng})`,
    sql`INSERT INTO storefronts
          (shop_id, name, tagline, about, phone, whatsapp, address, hours, products, images, language, raw_transcript)
        VALUES
          (${id}, ${sf.name}, ${sf.tagline}, ${sf.about}, ${sf.phone}, ${sf.whatsapp}, ${sf.address},
           ${jsonb(sf.hours)}::jsonb, ${jsonb(sf.products)}::jsonb, ${jsonb(sf.images)}::jsonb, ${sf.language}, ${input.transcript})`,
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
  location?: LatLng | null;
}): Promise<boolean> {
  const sql = getSql();
  const rows = await sql`
    SELECT id FROM shops WHERE slug = ${input.slug} AND edit_token = ${input.token} LIMIT 1`;
  if (rows.length === 0) return false;

  const shopId = rows[0].id as string;
  const sf = input.storefront;
  const lat = input.location?.lat ?? null;
  const lng = input.location?.lng ?? null;

  await sql.transaction([
    sql`UPDATE shops SET category = ${sf.category},
          lat = COALESCE(${lat}, lat), lng = COALESCE(${lng}, lng),
          updated_at = now() WHERE id = ${shopId}`,
    sql`UPDATE storefronts SET
          name = ${sf.name}, tagline = ${sf.tagline}, about = ${sf.about},
          phone = ${sf.phone}, whatsapp = ${sf.whatsapp}, address = ${sf.address},
          hours = ${jsonb(sf.hours)}::jsonb, products = ${jsonb(sf.products)}::jsonb,
          images = ${jsonb(sf.images)}::jsonb,
          language = ${sf.language},
          raw_transcript = COALESCE(${input.transcript}, raw_transcript)
        WHERE shop_id = ${shopId}`,
  ]);

  return true;
}

export interface PublicShop {
  storefront: Storefront;
  ownerUserId: string | null;
  theme: string;
  /** Owner has an active Pro subscription (drives branding removal). */
  ownerIsPro: boolean;
  /** Owner stepped out — show closed regardless of scheduled hours. */
  manuallyClosed: boolean;
}

/**
 * Public read: only active storefronts, only display fields (no secrets).
 * - Wrapped in React cache() so generateMetadata + the page body share ONE
 *   query per request instead of two.
 * - The owner's plan is folded in via LEFT JOIN — no second round-trip.
 */
export const getPublicShopBySlug = cache(
  async (slug: string): Promise<PublicShop | null> => {
    const sql = getSql();
    const rows = await sql`
      SELECT s.owner_user_id, s.category, s.manually_closed,
             f.name, f.tagline, f.about, f.phone, f.whatsapp, f.address,
             f.hours, f.products, f.images, f.language, f.theme,
             (sub.plan = 'pro' AND sub.status = 'active') AS owner_is_pro
      FROM shops s
      JOIN storefronts f ON f.shop_id = s.id
      LEFT JOIN subscriptions sub ON sub.owner_user_id = s.owner_user_id
      WHERE s.slug = ${slug} AND s.status = 'active'
      LIMIT 1`;
    if (rows.length === 0) return null;
    return {
      storefront: rowToStorefront(rows[0]),
      ownerUserId: (rows[0].owner_user_id as string) ?? null,
      theme: (rows[0].theme as string) ?? "classic",
      ownerIsPro: Boolean(rows[0].owner_is_pro),
      manuallyClosed: Boolean(rows[0].manually_closed),
    };
  },
);

/* ---------------------------------------------------------------------------
 * M2 — owner-scoped access. Every query below filters by owner_user_id, which
 * the caller MUST derive from the server session (never from the client).
 * ------------------------------------------------------------------------- */

export interface ShopSummary {
  slug: string;
  name: string | null;
  status: string;
  category: string | null;
  theme: string;
  views: number;
  manuallyClosed: boolean;
  updatedAt: string;
}

export async function listShopsByOwner(
  ownerUserId: string,
): Promise<ShopSummary[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT s.slug, s.status, s.category, s.views, s.manually_closed, s.updated_at,
           f.name, f.theme
    FROM shops s
    JOIN storefronts f ON f.shop_id = s.id
    WHERE s.owner_user_id = ${ownerUserId}
    ORDER BY s.updated_at DESC`;
  return rows.map((r) => ({
    slug: r.slug as string,
    name: (r.name as string) ?? null,
    status: r.status as string,
    category: (r.category as string) ?? null,
    theme: (r.theme as string) ?? "classic",
    views: Number(r.views ?? 0),
    manuallyClosed: Boolean(r.manually_closed),
    updatedAt: String(r.updated_at),
  }));
}

/** All active shop slugs (+ last-modified) for the sitemap. */
export async function listActiveShopSlugs(): Promise<
  { slug: string; updatedAt: string }[]
> {
  const sql = getSql();
  const rows = await sql`
    SELECT slug, updated_at FROM shops WHERE status = 'active'
    ORDER BY updated_at DESC LIMIT 5000`;
  return rows.map((r) => ({
    slug: r.slug as string,
    updatedAt: String(r.updated_at),
  }));
}

/** Increment the public view counter (best-effort; only for active shops). */
export async function recordView(slug: string): Promise<void> {
  const sql = getSql();
  await sql`UPDATE shops SET views = views + 1 WHERE slug = ${slug} AND status = 'active'`;
}

/** Set a storefront theme (owner-scoped). Returns false if not owned. */
export async function setShopTheme(input: {
  slug: string;
  ownerUserId: string;
  theme: string;
}): Promise<boolean> {
  const sql = getSql();
  const rows = await sql`
    UPDATE storefronts f
    SET theme = ${input.theme}
    FROM shops s
    WHERE f.shop_id = s.id AND s.slug = ${input.slug} AND s.owner_user_id = ${input.ownerUserId}
    RETURNING s.slug`;
  return rows.length > 0;
}

export async function getShopForOwner(
  slug: string,
  ownerUserId: string,
): Promise<{ storefront: Storefront; status: string } | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT s.category, s.status,
           f.name, f.tagline, f.about, f.phone, f.whatsapp, f.address,
           f.hours, f.products, f.images, f.language
    FROM shops s
    JOIN storefronts f ON f.shop_id = s.id
    WHERE s.slug = ${slug} AND s.owner_user_id = ${ownerUserId}
    LIMIT 1`;
  if (rows.length === 0) return null;
  return { storefront: rowToStorefront(rows[0]), status: rows[0].status as string };
}

export async function updateStorefrontByOwner(input: {
  slug: string;
  ownerUserId: string;
  storefront: Storefront;
  transcript: string | null;
  location?: LatLng | null;
}): Promise<boolean> {
  const sql = getSql();
  const rows = await sql`
    SELECT id FROM shops WHERE slug = ${input.slug} AND owner_user_id = ${input.ownerUserId} LIMIT 1`;
  if (rows.length === 0) return false;

  const shopId = rows[0].id as string;
  const sf = input.storefront;
  const lat = input.location?.lat ?? null;
  const lng = input.location?.lng ?? null;
  await sql.transaction([
    sql`UPDATE shops SET category = ${sf.category},
          lat = COALESCE(${lat}, lat), lng = COALESCE(${lng}, lng),
          updated_at = now() WHERE id = ${shopId}`,
    sql`UPDATE storefronts SET
          name = ${sf.name}, tagline = ${sf.tagline}, about = ${sf.about},
          phone = ${sf.phone}, whatsapp = ${sf.whatsapp}, address = ${sf.address},
          hours = ${jsonb(sf.hours)}::jsonb, products = ${jsonb(sf.products)}::jsonb,
          images = ${jsonb(sf.images)}::jsonb,
          language = ${sf.language},
          raw_transcript = COALESCE(${input.transcript}, raw_transcript)
        WHERE shop_id = ${shopId}`,
  ]);
  return true;
}

/**
 * Owner override: mark the shop closed right now (stepped out / away) or
 * reopen it. While set, the public page shows closed regardless of hours.
 */
export async function setManuallyClosed(input: {
  slug: string;
  ownerUserId: string;
  closed: boolean;
}): Promise<boolean> {
  const sql = getSql();
  const rows = await sql`
    UPDATE shops SET manually_closed = ${input.closed}, updated_at = now()
    WHERE slug = ${input.slug} AND owner_user_id = ${input.ownerUserId}
    RETURNING slug`;
  return rows.length > 0;
}

/** Toggle publish state. Returns false if the owner doesn't own that slug. */
export async function setShopStatus(input: {
  slug: string;
  ownerUserId: string;
  status: "active" | "unpublished";
}): Promise<boolean> {
  const sql = getSql();
  const rows = await sql`
    UPDATE shops SET status = ${input.status}, updated_at = now()
    WHERE slug = ${input.slug} AND owner_user_id = ${input.ownerUserId}
    RETURNING slug`;
  return rows.length > 0;
}

export async function deleteShopByOwner(
  slug: string,
  ownerUserId: string,
): Promise<boolean> {
  const sql = getSql();
  const rows = await sql`
    DELETE FROM shops
    WHERE slug = ${slug} AND owner_user_id = ${ownerUserId}
    RETURNING slug`;
  return rows.length > 0;
}

/** Claim an as-yet-unowned shop using its edit token (links M1 shops to M2 login). */
export async function claimShopByToken(input: {
  slug: string;
  token: string;
  ownerUserId: string;
}): Promise<boolean> {
  const sql = getSql();
  const rows = await sql`
    UPDATE shops SET owner_user_id = ${input.ownerUserId}, updated_at = now()
    WHERE slug = ${input.slug} AND edit_token = ${input.token} AND owner_user_id IS NULL
    RETURNING slug`;
  return rows.length > 0;
}

/* ---------------------------------------------------------------------------
 * Nearby discovery — visitor location in, active shops sorted by distance out.
 * ------------------------------------------------------------------------- */

export interface NearbyShop {
  slug: string;
  name: string | null;
  category: string | null;
  address: string | null;
  phone: string | null;
  language: string | null;
  hours: Storefront["hours"];
  products: string[];
  manuallyClosed: boolean;
  distanceKm: number;
}

/** Record a visitor's report about a shop (for Grievance Officer review). */
export async function recordShopReport(input: {
  slug: string;
  reason: string;
}): Promise<void> {
  const sql = getSql();
  await sql`INSERT INTO shop_reports (slug, reason) VALUES (${input.slug}, ${input.reason})`;
}

/**
 * Record a "which shop do you want here?" request from a consumer who searched
 * and found nothing — the ground team's demand/target list. Location optional.
 */
export async function recordShopRequest(input: {
  query: string;
  lat?: number | null;
  lng?: number | null;
}): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO shop_requests (query, lat, lng)
    VALUES (${input.query}, ${input.lat ?? null}, ${input.lng ?? null})`;
}

/** Great-circle distance in km between two lat/lng points. */
function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Active, located shops within `radiusKm` of (lat,lng), nearest first.
 * A cheap bounding-box filter runs in SQL (index-assisted); exact Haversine
 * distance is computed on the small result set in JS.
 */
export async function findNearbyShops(input: {
  lat: number;
  lng: number;
  radiusKm: number;
  limit?: number;
}): Promise<NearbyShop[]> {
  const sql = getSql();
  const { lat, lng, radiusKm } = input;
  const limit = input.limit ?? 50;

  // Degrees of lat/lng that cover the radius (lng shrinks toward the poles).
  const dLat = radiusKm / 111;
  const dLng = radiusKm / (111 * Math.max(Math.cos((lat * Math.PI) / 180), 0.01));

  const rows = await sql`
    SELECT s.slug, s.category, s.lat, s.lng, s.manually_closed,
           f.name, f.address, f.phone, f.hours, f.language, f.products
    FROM shops s
    JOIN storefronts f ON f.shop_id = s.id
    WHERE s.status = 'active'
      AND s.lat IS NOT NULL AND s.lng IS NOT NULL
      AND s.lat BETWEEN ${lat - dLat} AND ${lat + dLat}
      AND s.lng BETWEEN ${lng - dLng} AND ${lng + dLng}
    LIMIT 500`;

  return rows
    .map((r) => ({
      slug: r.slug as string,
      name: (r.name as string) ?? null,
      category: (r.category as string) ?? null,
      address: (r.address as string) ?? null,
      phone: (r.phone as string) ?? null,
      language: (r.language as string) ?? null,
      hours: (r.hours as Storefront["hours"]) ?? null,
      products: Array.isArray(r.products)
        ? (r.products as { name?: string }[])
            .map((p) => p.name)
            .filter((n): n is string => Boolean(n))
        : [],
      manuallyClosed: Boolean(r.manually_closed),
      distanceKm: haversineKm(lat, lng, Number(r.lat), Number(r.lng)),
    }))
    .filter((s) => s.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}
