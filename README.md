# BolDukaan

**Speak your shop into existence.** Voice-to-website storefronts for small Indian
retail shops — a shop owner describes their shop out loud (Hindi / Punjabi /
English) and gets a live, shareable storefront page in under two minutes.

## How it works

```
[mic] → Web Speech API (browser STT) → transcript
      → Gemini 2.5 Flash (/api/structure) → validated storefront JSON
      → one reusable renderer (live preview + public /s/[slug] page)
```

- **The wedge is the onboarding, not the CRUD.** Voice → storefront is the product.
- The LLM never sees audio; transcription happens in the browser first.
- Model output is schema-validated (Zod) server-side; missing facts become
  `null` — never hallucinated.

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind v4 + CSS Modules, themed to `DESIGN.md` tokens only |
| Database | Neon Postgres (`@neondatabase/serverless`, raw parameterized SQL) |
| STT | Web Speech API behind one interface (`lib/stt.ts`) — Whisper-ready |
| LLM | Google Gemini 2.5 Flash (`@google/genai`), structured output |
| Auth | Auth.js / NextAuth v5, Google provider, JWT sessions |
| Billing | Razorpay subscriptions, signature-verified webhook |

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in values (see below)
npm run db:init              # creates tables in your Neon database
npm run dev                  # http://localhost:3000
```

| Env var | Needed for | Where to get it |
|---|---|---|
| `DATABASE_URL` | persistence (M1+) | https://neon.tech — free project |
| `GEMINI_API_KEY` | voice structuring (M0+) | https://aistudio.google.com/apikey — free |
| `AUTH_SECRET` | sessions (M2+) | `npx auth secret` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google sign-in (M2+) | Google Cloud Console → OAuth client; redirect URI `http://localhost:3000/api/auth/callback/google` |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_PLAN_ID` / `RAZORPAY_WEBHOOK_SECRET` | billing (M3+) | https://dashboard.razorpay.com — test mode |

Every feature degrades gracefully when its keys are missing (voice preview works
with only `GEMINI_API_KEY`; publish needs `DATABASE_URL`; sign-in and billing
stay hidden/disabled until configured).

Use Chrome or Edge for voice input (Web Speech API); other browsers get a typed
fallback automatically.

## Security model (zero-trust)

- Tenant identity (`owner_user_id`) is derived from the server session only —
  never from the client. Every owner query carries `WHERE owner_user_id = …`.
- Anonymous publishes are owned via a random edit token; edits require the
  matching `(slug, token)` pair.
- The Razorpay webhook (HMAC-verified, timing-safe) is the sole writer of
  billing status — the client never tells the server "I paid."
- All SQL is parameterized; all model output is Zod-validated before render;
  the LLM endpoint is rate-limited per IP.

## Milestones

- **M0** — voice → storefront proof (hold-to-speak, live mic visualizer, structuring)
- **M1** — persistence + public SEO pages + WhatsApp share
- **M2** — auth, owner dashboard, multi-tenant scoping
- **M3** — Razorpay billing, free/pro gating (branding, storefront limits, themes)
- **M4** — theme picker, QR codes, page-view analytics

## Deploy (Vercel)

Import the repo, add the env vars above (production values), deploy. Then point
a Razorpay webhook at `https://<your-domain>/api/razorpay/webhook` and add
`https://<your-domain>/api/auth/callback/google` as a second OAuth redirect URI.
