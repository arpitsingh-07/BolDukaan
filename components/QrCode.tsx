"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** Renders a QR for a URL (client-side; the URL is only known in the browser). */
export function QrCode({
  url,
  downloadName = "storefront-qr",
  size = 168,
}: {
  url: string;
  downloadName?: string;
  size?: number;
}) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, {
      width: size,
      margin: 1,
      color: { dark: "#15201E", light: "#ffffff" },
    })
      .then(setSrc)
      .catch(() => setSrc(""));
  }, [url, size]);

  if (!src) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Storefront QR code" width={size} height={size} />
      <a href={src} download={`${downloadName}.png`} style={{ fontSize: 13, fontWeight: 600, color: "var(--petrol)" }}>
        Download QR
      </a>
    </div>
  );
}
