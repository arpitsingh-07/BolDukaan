"use client";

import { useState } from "react";
import QRCode from "qrcode";
import type { Storefront } from "@/lib/storefront";
import { PIN_PATH_24 } from "./PinIcon";
import styles from "./poster-button.module.css";

/**
 * Renders the published shop as a printable A-format poster on a canvas —
 * shop name signboard, products, address, and a big "scan to visit" QR.
 * PNG downloads directly; "print" opens the poster in a new window where the
 * browser's print dialog can save it as a PDF. No server, no new deps.
 */

const W = 1080;
const H = 1600;

// DESIGN.md tokens (canvas can't read CSS variables from a stylesheet).
const PAPER = "#F4F3EF";
const INK = "#15201E";
const PETROL = "#0C3B38";
const MARIGOLD = "#F59E1B";
const MUTED = "#7C8482";

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** The next/font families are hashed — resolve the real stacks from the DOM. */
function fontStacks(): { display: string; body: string } {
  const root = getComputedStyle(document.documentElement);
  const display =
    root.getPropertyValue("--font-display-stack").trim() || "sans-serif";
  const body = root.getPropertyValue("--font-body-stack").trim() || "sans-serif";
  return { display, body };
}

async function drawPoster(
  storefront: Storefront,
  url: string,
  scanLabel: string,
): Promise<HTMLCanvasElement> {
  await document.fonts.ready;

  const qrSrc = await QRCode.toDataURL(url, {
    width: 400,
    margin: 1,
    color: { dark: INK, light: "#ffffff" },
  });
  const qrImg = new Image();
  await new Promise<void>((resolve, reject) => {
    qrImg.onload = () => resolve();
    qrImg.onerror = () => reject(new Error("QR image failed"));
    qrImg.src = qrSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  const { display, body } = fontStacks();

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";

  // ---- measure the petrol header before drawing it ----
  ctx.font = `800 84px ${display}`;
  const nameLines = wrapText(ctx, storefront.name ?? "My shop", 920).slice(0, 2);
  const subtitle = storefront.tagline ?? storefront.category ?? "";
  ctx.font = `500 34px ${body}`;
  const subLines = subtitle ? wrapText(ctx, subtitle, 880).slice(0, 2) : [];
  const headerH =
    150 + nameLines.length * 96 + (subLines.length > 0 ? 26 + subLines.length * 48 : 0) + 70;

  // ---- petrol signboard header ----
  ctx.fillStyle = PETROL;
  ctx.fillRect(0, 0, W, headerH);

  // two-tone wordmark, like the logo: "Bol" paper, "Dukaan" marigold
  ctx.font = `800 40px ${display}`;
  const bolW = ctx.measureText("Bol").width;
  const dukaanW = ctx.measureText("Dukaan").width;
  ctx.textAlign = "left";
  const wmX = (W - bolW - dukaanW) / 2;
  ctx.fillStyle = PAPER;
  ctx.fillText("Bol", wmX, 100);
  ctx.fillStyle = MARIGOLD;
  ctx.fillText("Dukaan", wmX + bolW, 100);
  ctx.textAlign = "center";

  ctx.fillStyle = PAPER;
  ctx.font = `800 84px ${display}`;
  let y = 150 + 76;
  for (const line of nameLines) {
    ctx.fillText(line, W / 2, y, 960);
    y += 96;
  }
  if (subLines.length > 0) {
    ctx.fillStyle = "rgba(244, 243, 239, 0.72)";
    ctx.font = `500 34px ${body}`;
    y += 26;
    for (const line of subLines) {
      ctx.fillText(line, W / 2, y, 920);
      y += 48;
    }
  }
  // marigold accent bar bridging header and body
  ctx.fillStyle = MARIGOLD;
  ctx.fillRect(W / 2 - 70, headerH - 4, 140, 8);

  // ---- QR block is anchored to the bottom; body content must stop above it ----
  const qrBox = 500;
  const qrBoxY = H - 660;
  const contentLimit = qrBoxY - 90;

  // ---- products ----
  y = headerH + 100;
  ctx.fillStyle = INK;
  ctx.font = `600 38px ${body}`;
  for (const product of storefront.products.slice(0, 4)) {
    if (y > contentLimit) break;
    ctx.fillText(`✓  ${product.name}`, W / 2, y, 900);
    y += 62;
  }

  // ---- address (map-pin glyph drawn as a path, centered with line one) ----
  if (storefront.address) {
    ctx.fillStyle = MUTED;
    ctx.font = `500 30px ${body}`;
    y += storefront.products.length > 0 ? 18 : 0;
    const addrLines = wrapText(ctx, storefront.address, 820).slice(0, 2);
    const pin = new Path2D(PIN_PATH_24);
    const pinSize = 30;
    for (let i = 0; i < addrLines.length; i++) {
      if (y > contentLimit) break;
      if (i === 0) {
        const lineW = ctx.measureText(addrLines[i]).width;
        const startX = (W - (pinSize + 8 + lineW)) / 2;
        ctx.save();
        ctx.translate(startX, y - 25);
        ctx.scale(pinSize / 24, pinSize / 24);
        ctx.fill(pin);
        ctx.restore();
        ctx.textAlign = "left";
        ctx.fillText(addrLines[i], startX + pinSize + 8, y, 880);
        ctx.textAlign = "center";
      } else {
        ctx.fillText(addrLines[i], W / 2, y, 880);
      }
      y += 46;
    }
  }

  // ---- QR block ----
  ctx.fillStyle = MUTED;
  ctx.font = `700 27px ${body}`;
  ctx.fillText(scanLabel.toUpperCase(), W / 2, qrBoxY - 30);

  ctx.fillStyle = "#ffffff";
  const boxX = (W - qrBox) / 2;
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(boxX, qrBoxY, qrBox, qrBox, 24);
    ctx.fill();
  } else {
    ctx.fillRect(boxX, qrBoxY, qrBox, qrBox);
  }
  ctx.drawImage(qrImg, (W - 400) / 2, qrBoxY + 50, 400, 400);

  ctx.fillStyle = PETROL;
  ctx.font = `600 30px ${body}`;
  ctx.fillText(url.replace(/^https?:\/\//, ""), W / 2, qrBoxY + qrBox + 62, 960);

  ctx.fillStyle = MUTED;
  ctx.font = `500 24px ${body}`;
  ctx.fillText("BolDukaan", W / 2, H - 44);

  return canvas;
}

export function PosterButtons({
  storefront,
  url,
  scanLabel,
  downloadLabel,
  printLabel,
}: {
  storefront: Storefront;
  url: string;
  scanLabel: string;
  downloadLabel: string;
  printLabel: string;
}) {
  const [busy, setBusy] = useState(false);

  const fileName =
    (storefront.name ?? "shop").toLowerCase().replace(/[^a-z0-9]+/g, "-") ||
    "shop";

  const download = async () => {
    setBusy(true);
    try {
      const canvas = await drawPoster(storefront, url, scanLabel);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${fileName}-poster.png`;
        a.click();
        URL.revokeObjectURL(a.href);
      }, "image/png");
    } catch {
      /* canvas/QR failure — nothing to download */
    } finally {
      setBusy(false);
    }
  };

  const print = async () => {
    setBusy(true);
    try {
      const canvas = await drawPoster(storefront, url, scanLabel);
      const dataUrl = canvas.toDataURL("image/png");
      const win = window.open("", "_blank");
      if (!win) return;
      win.document.write(
        `<!doctype html><html><head><title>${fileName}-poster</title>` +
          `<style>@page{margin:0}body{margin:0}img{width:100%;display:block}</style>` +
          `</head><body><img src="${dataUrl}" onload="window.print()"></body></html>`,
      );
      win.document.close();
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.row}>
      <button type="button" className={styles.btn} onClick={download} disabled={busy}>
        {downloadLabel}
      </button>
      <button type="button" className={styles.btn} onClick={print} disabled={busy}>
        {printLabel}
      </button>
    </div>
  );
}
