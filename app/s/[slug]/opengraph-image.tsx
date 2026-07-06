import { ImageResponse } from "next/og";
import { getPublicShopBySlug } from "@/lib/shops";

// Rich preview card shown when a shop link is shared (WhatsApp, social, etc.).
// The file-convention name makes Next add the og:image/twitter:image tags for
// /s/[slug] automatically — no metadata wiring needed.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Shop on BolDukaan";

const PAPER = "#F4F3EF";
const PETROL = "#0C3B38";
const MARIGOLD = "#F59E1B";

type Params = { params: Promise<{ slug: string }> };

export default async function Image({ params }: Params) {
  const { slug } = await params;
  const shop = await getPublicShopBySlug(slug).catch(() => null);
  const sf = shop?.storefront;
  const name = sf?.name ?? "This shop";
  const category = sf?.category ?? "";
  const address = sf?.address ?? "";
  const products = (sf?.products ?? [])
    .map((p) => p.name)
    .filter(Boolean)
    .slice(0, 3)
    .join("  ·  ");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: PETROL,
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* marigold accent bar */}
        <div style={{ display: "flex", width: 120, height: 12, background: MARIGOLD, borderRadius: 999 }} />

        <div style={{ display: "flex", flexDirection: "column" }}>
          {category ? (
            <div
              style={{
                display: "flex",
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: "rgba(244,243,239,0.65)",
                marginBottom: 18,
              }}
            >
              {category}
            </div>
          ) : null}
          <div style={{ display: "flex", fontSize: 84, fontWeight: 800, color: PAPER, lineHeight: 1.05 }}>
            {name}
          </div>
          {products ? (
            <div style={{ display: "flex", fontSize: 34, color: "rgba(244,243,239,0.8)", marginTop: 26 }}>
              {products}
            </div>
          ) : null}
          {address ? (
            <div style={{ display: "flex", fontSize: 30, color: "rgba(244,243,239,0.6)", marginTop: 16 }}>
              {address}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", alignItems: "center", fontSize: 34, fontWeight: 800 }}>
          <span style={{ color: PAPER }}>Bol</span>
          <span style={{ color: MARIGOLD }}>Dukaan</span>
          <span style={{ color: PAPER, fontSize: 18, alignSelf: "flex-start", marginLeft: 3 }}>
            ™
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
