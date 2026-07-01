# BolDukaan
Voice-to-website storefronts for small Indian retail shops. A shop owner speaks a
description (Hindi/Punjabi/English) and gets a live, hosted storefront page.

## Stack
- Next.js (App Router) + TypeScript
- Postgres (Neon)
- Auth.js (NextAuth) — added in M2, not before
- Google Gemini API (gemini-2.5-flash) for runtime structuring (free tier; chosen over Anthropic for cost)
- Web Speech API for STT (swap to Whisper later — keep STT behind one interface)

## Core architecture
- Pipeline: mic audio -> speech-to-text -> Claude structures text into storefront JSON -> render.
  Claude does NOT accept audio; transcription is always a separate prior step.
- One reusable storefront component renders both the live preview and the public page.
- Multi-tenant: every shop row scoped by owner_user_id.

## Data model
- shops(id, owner_user_id, slug, status, category, timestamps)
- storefronts(shop_id, name, tagline, about, phone, whatsapp, address, hours JSONB,
  products JSONB, images JSONB, theme, raw_transcript)
- subscriptions(id, owner_user_id, provider, provider_sub_id, plan, status, current_period_end)

## Design (do not violate)
- All UI MUST follow DESIGN.md. Use shadcn/ui primitives re-themed to DESIGN.md tokens.
  Never use default Tailwind colors, default fonts, or gradients.
- Marigold is the voice-action signal color only — never a generic accent.
- The hero/voice screen is the signature; spend the motion budget there.

## Security rules (do not violate)
- Validate the session on every mutating request.
- Derive tenant identity (owner_user_id) from the server-side session ONLY.
  Never accept shop_id or owner_user_id from the client for write operations.
- Every owner query includes WHERE owner_user_id = <session user>.
- Verify Razorpay webhook signatures before trusting billing events.
- Validate LLM JSON against the schema; never render unvalidated model output.
- Secrets live in host env vars (or .env.local locally), never in the repo. The app's
  GEMINI_API_KEY is a server-only runtime secret — never expose it to the browser.

## Build discipline
- Build one milestone (M0..M4) at a time; do not scaffold future milestones early.
- After each change, run the dev server and confirm it works before moving on.
- Commit at each milestone gate.

## Do NOT
- Do not add auth before M2 or billing before M3.
- Do not add e-commerce/cart — this is a brochure storefront.
- Do not let Claude (the model) hallucinate missing shop fields; output null instead.
