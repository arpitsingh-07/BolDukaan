import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import {
  storefrontSchema,
  emptyStorefront,
  type Storefront,
} from "@/lib/storefront";

export const runtime = "nodejs";

// Runtime structuring model — Gemini Flash: fast, cheap, on the free tier, and
// strong with Hindi/Punjabi. Swap to "gemini-2.0-flash" / "gemini-1.5-flash"
// here if your key's free tier prefers a different model.
const MODEL = "gemini-2.5-flash";

const SYSTEM_PROMPT = `You convert a shop owner's spoken description into a structured storefront object.

The speech may be in Hindi, Punjabi, or English (often code-mixed, e.g. Hinglish), and may be transcribed imperfectly. Extract what the owner said into the schema.

Rules:
- Use null for any field the owner did not mention. NEVER invent a name, phone number, address, or hours that were not stated. Null over guess.
- category: infer a short lowercase label (e.g. "kirana", "salon", "cafe", "boutique", "repair", "general store") from what is sold/described.
- hours: normalise to 24-hour "HH:MM" per day (mon..sun). "subah 9 baje se raat 9 baje tak" => open "09:00", close "21:00". If the owner gives a single daily window with no day distinction, apply it to all seven days. A day that is closed is null. If hours are not mentioned at all, hours is null.
- products: split a run-on list ("atta daal chawal") into separate items. Each product has a name; price/note are null unless stated. Keep product names in the language the owner used.
- phone / whatsapp: digits only or the local format spoken; if one number is given and called a WhatsApp number, set whatsapp; otherwise set phone. Do not fabricate.
- tagline: if the owner gave one, use it; otherwise write a short, warm one-line tagline (max ~7 words) in the SAME language as the description. Never English if the owner spoke Hindi/Punjabi.
- about: a 1-2 sentence description only if there is enough real detail; else null.
- language: the dominant input language as "hi", "pa", or "en".

Output only the JSON object — no markdown, no commentary.`;

// Gemini response schema — keep in sync with `storefrontSchema` in lib/storefront.ts.
// (If they drift, Zod validation below catches it and we fall back.)
const dayHoursSchema = {
  type: Type.OBJECT,
  nullable: true,
  properties: {
    open: { type: Type.STRING, nullable: true },
    close: { type: Type.STRING, nullable: true },
  },
};

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, nullable: true },
    tagline: { type: Type.STRING, nullable: true },
    about: { type: Type.STRING, nullable: true },
    category: { type: Type.STRING, nullable: true },
    phone: { type: Type.STRING, nullable: true },
    whatsapp: { type: Type.STRING, nullable: true },
    address: { type: Type.STRING, nullable: true },
    hours: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        mon: dayHoursSchema,
        tue: dayHoursSchema,
        wed: dayHoursSchema,
        thu: dayHoursSchema,
        fri: dayHoursSchema,
        sat: dayHoursSchema,
        sun: dayHoursSchema,
      },
    },
    products: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          price: { type: Type.STRING, nullable: true },
          note: { type: Type.STRING, nullable: true },
        },
        required: ["name"],
        propertyOrdering: ["name", "price", "note"],
      },
    },
    language: { type: Type.STRING, nullable: true },
  },
  propertyOrdering: [
    "name",
    "tagline",
    "about",
    "category",
    "phone",
    "whatsapp",
    "address",
    "hours",
    "products",
    "language",
  ],
};

interface StructureRequest {
  transcript?: unknown;
  category?: unknown;
  existing?: unknown;
}

function buildUserContent(
  transcript: string,
  category: string | null,
  existing: Storefront | null,
): string {
  const parts: string[] = [];
  if (category) {
    parts.push(`Shop category hint from the owner: ${category}.`);
  }
  if (existing) {
    parts.push(
      "The owner already has this storefront. Merge the new description into it — keep existing fields unless the new description corrects or adds to them. Return the FULL updated object, never dropping fields:",
      "```json",
      JSON.stringify(existing, null, 2),
      "```",
    );
  }
  parts.push(
    existing
      ? "New spoken description to merge:"
      : "Spoken description of the shop:",
    transcript,
  );
  return parts.join("\n");
}

async function structureOnce(
  ai: GoogleGenAI,
  userContent: string,
  stricter: boolean,
): Promise<Storefront | null> {
  const system = stricter
    ? `${SYSTEM_PROMPT}\n\nReturn a single valid JSON object that matches the schema exactly. Use null for anything not clearly stated.`
    : SYSTEM_PROMPT;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: userContent,
    config: {
      systemInstruction: system,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.2,
    },
  });

  const raw = response.text;
  if (!raw) return null;

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }

  // Server-side schema validation — never trust raw model output (PRD §9.5).
  const parsed = storefrontSchema.safeParse(json);
  return parsed.success ? parsed.data : null;
}

function isRateLimit(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  const message = (err as { message?: string })?.message ?? "";
  return status === 429 || /429|RESOURCE_EXHAUSTED|quota/i.test(message);
}

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      {
        error:
          "Server is missing GEMINI_API_KEY. Add your Google AI Studio key to .env.local to enable structuring.",
      },
      { status: 503 },
    );
  }

  let body: StructureRequest;
  try {
    body = (await request.json()) as StructureRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const transcript =
    typeof body.transcript === "string" ? body.transcript.trim() : "";
  if (transcript.length < 2) {
    return NextResponse.json(
      { error: "No transcript provided. Speak or type a description first." },
      { status: 400 },
    );
  }

  const category =
    typeof body.category === "string" && body.category.trim()
      ? body.category.trim()
      : null;

  // Validate any client-supplied existing object against the schema before reuse.
  let existing: Storefront | null = null;
  if (body.existing && typeof body.existing === "object") {
    const parsed = storefrontSchema.safeParse(body.existing);
    if (parsed.success) existing = parsed.data;
  }

  const userContent = buildUserContent(transcript, category, existing);
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // responseSchema already constrains the shape; the retry covers transient
  // model/parse failures, then we fall back to a partial object (PRD §6.2).
  try {
    const result =
      (await structureOnce(ai, userContent, false)) ??
      (await structureOnce(ai, userContent, true));

    if (result) {
      return NextResponse.json({ storefront: result, transcript });
    }
  } catch (err) {
    if (isRateLimit(err)) {
      return NextResponse.json(
        { error: "Too many requests right now. Try again in a moment." },
        { status: 429 },
      );
    }
    console.error("[/api/structure] structuring failed:", err);
  }

  // Partial fallback: keep the transcript so the owner can edit by hand.
  return NextResponse.json(
    {
      storefront: { ...emptyStorefront(), about: transcript },
      transcript,
      partial: true,
    },
    { status: 200 },
  );
}
