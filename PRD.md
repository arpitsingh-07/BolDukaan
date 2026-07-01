# BolDukaan — Product Requirements Document
### Voice-to-website storefronts for small retail shops

**Build tool:** Claude Code (included in Claude Pro) · building locally on Windows
**Deploy target:** Vercel free + Neon free Postgres (recommended) or Replit free (demo)
**Working codename:** BolDukaan (*bol* = speak, *dukaan* = shop — rename freely)
**Owner:** Ranger · **Version:** 2.0 (Claude Code edition) · **Status:** Draft for build

---

## 0. Build model (read this first)

You build with **Claude Code**, the terminal agent included in your Claude Pro plan, running on your own machine. Deployment is a **separate, decoupled step** — Claude Code writes and tests the app locally, pushes to GitHub, and a host (Vercel or Replit) serves it.

### The two-keys rule

| Context | Key needed? | Billing |
|---|---|---|
| **Claude Code (build time)** — the agent writing your app | **NO key in your shell** | Your Pro subscription |
| **BolDukaan app (run time)** — the deployed app structuring voice transcripts | **YES, as a deployment secret** | Pay-per-token API (cheap) |

- **Local dev shell:** make sure `ANTHROPIC_API_KEY` is **NOT set**. On Windows PowerShell: `Remove-Item Env:\ANTHROPIC_API_KEY`.
- **Deployed app / local app runtime:** the app calls Claude at runtime. That needs `ANTHROPIC_API_KEY` stored as a deployment secret (Vercel env vars / Replit Secrets) or `.env.local` for local app testing. A structuring call is ~1–2k tokens.

### Pro usage limits
Claude Code on Pro shares your chat usage pool, with session limits plus weekly caps. Build one milestone, test, stop. Don't marathon.

---

## 1. Summary

Small retail shop owners (kirana stores, boutiques, salons, repair shops, cafés) want a basic online presence but cannot use Wix/Shopify/Webflow. **The wedge is not the storefront. It is the onboarding.** BolDukaan lets a shop owner *describe their shop out loud* — in Hindi, Punjabi, or English — and converts that natural speech into a live, hosted storefront page in under two minutes.

**One-liner:** "Speak your shop into existence."

---

## 2. Goals and non-goals

### Goals (v1)
- Create a published storefront from a single voice description, zero typing for a usable first draft.
- Each storefront publicly accessible at a clean URL, SEO-indexable.
- Owners can log in, edit, manage subscription.
- Multi-tenant: strict per-shop isolation, zero-trust on every request.
- Monthly subscription billing via Razorpay (INR), free tier as funnel.

### Non-goals (v1)
- E-commerce / cart / online payments to the shop (brochure storefront, not a store).
- Native mobile apps (responsive web only).
- Custom domains until a supporting host (deferred; Vercel free includes one).
- Multi-user / staff accounts per shop.
- AI image generation for products.
- Voice support beyond Hindi / Punjabi / English.

---

## 3. Target user

| Attribute | Detail |
|---|---|
| Who | Owner-operator of a single small retail shop, tier-2/tier-3 India |
| Tech comfort | Low. Uses WhatsApp fluently; never built a website |
| Device | Mid-range Android phone, mobile data |
| Language | Speaks Hindi/Punjabi; limited written English |
| Motivation | Be findable, share a link on WhatsApp status, look legitimate |

**Primary JTBD:** "Make me a shareable page about my shop without making me type or think about layout."

---

## 4. Milestone plan (gated)

Each milestone is a hard gate. Build, test locally, commit, then decide whether to continue.

### M0 — Voice → storefront proof (THE gate)
- Single page. Big "Hold to speak" button.
- Owner speaks a free-form description.
- Audio transcribed, then Claude extracts a structured storefront object (name, category, hours, address, phone, products, tagline).
- The page immediately renders a clean storefront preview.
- **Exit gate:** A non-technical person can speak once and get a storefront ~80% correct without editing. If this fails, the thesis is wrong — stop. Build nothing else until M0 passes.

### M1 — Persistence + public pages
- Save the storefront object to Postgres.
- Generate a unique slug; serve a public page at `/s/[slug]` (server-rendered, SEO meta tags).
- "Share on WhatsApp" button.
- No login yet — temporary edit token in the URL.

### M2 — Auth + owner dashboard (multi-tenant)
- Login via Auth.js (NextAuth) with Google + email, sessions on Postgres.
- Claim flow: logged-in user owns their shop(s); `owner_user_id` is set.
- Dashboard: list shops, edit (form fields + re-record by voice), preview, publish/unpublish.
- Enforce zero-trust scoping.

### M3 — Billing
- Razorpay subscription (one paid plan + free tier).
- Free: 1 storefront, branding, basic theme. Paid: multiple storefronts, remove branding, premium themes, voice-edit.
- Webhook-driven status; gate features on `active`.

### M4 — Polish
- Custom domains, theme picker, basic analytics (page views), QR code.

---

## 5. Core flows

### 5.1 Voice onboarding (the money flow)
1. Land on home → tap **Hold to speak** (or tap a category first to prime the model).
2. Browser records audio while held.
3. On release: audio → speech-to-text → transcript.
4. Transcript + category hint → Claude → structured storefront JSON.
5. Storefront renders instantly as a live preview.
6. Tap any field to fix, or tap **"Add more"** and speak again (merged into existing object).
7. **Publish** → (M2+) requires login → assigns slug → live.

### 5.2 Edit by voice (paid, M3)
Owner speaks a change; Claude applies a *diff*; owner confirms before save.

### 5.3 Public visitor
Visits `/s/[slug]`. Server-rendered: name, tagline, hours (open/closed-now), address (map link), products, call/WhatsApp.

---

## 6. The voice-to-storefront pipeline (core IP)

**Hard constraint:** Claude accepts text, images, PDFs — **not raw audio**. Transcription is a separate step *before* Claude.

```
[Browser mic] ──audio──▶ [Speech-to-Text] ──transcript──▶ [Claude structurer] ──JSON──▶ [Renderer]
```

### 6.1 Speech-to-text
- **M0–M1 (free):** Browser Web Speech API (`SpeechRecognition`) — `hi-IN`, `pa-IN`, `en-IN`.
- **Production:** OpenAI Whisper API. Keep STT behind one interface so swapping is a one-file change.

### 6.2 Claude structurer
- Model: `claude-sonnet-4-6`.
- System prompt: output **only** valid JSON matching the schema — no prose, no fences. Infer category, normalize hours, split product run-on into a list, generate a tagline if none given. Leave fields `null` rather than hallucinating.
- Validate returned JSON server-side; on parse failure, retry once with a stricter reminder, then fall back to a partial object.
- For "add more / edit": pass existing object + new transcript; return the full updated object (merge, don't drop fields).

### 6.3 Renderer
- One themeable storefront component renders both the live preview (M0) and the public page (M1+).

---

## 7. Data model (Postgres)

```sql
CREATE TABLE shops (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id TEXT,
  slug          TEXT UNIQUE,
  status        TEXT NOT NULL DEFAULT 'draft',  -- draft | active | unpublished | past_due
  category      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE storefronts (
  shop_id   UUID PRIMARY KEY REFERENCES shops(id) ON DELETE CASCADE,
  name      TEXT,
  tagline   TEXT,
  about     TEXT,
  phone     TEXT,
  whatsapp  TEXT,
  address   TEXT,
  hours     JSONB,        -- { "mon": {"open":"09:00","close":"21:00"}, ... }
  products  JSONB,        -- [ { "name": "Atta", "price": null, "note": "" }, ... ]
  images    JSONB,
  theme     TEXT DEFAULT 'classic',
  raw_transcript TEXT
);
CREATE TABLE subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id   TEXT NOT NULL,
  provider        TEXT NOT NULL DEFAULT 'razorpay',
  provider_sub_id TEXT,
  plan            TEXT NOT NULL DEFAULT 'free',  -- free | pro
  status          TEXT NOT NULL DEFAULT 'active',-- active | past_due | cancelled
  current_period_end TIMESTAMPTZ
);
```

**Indexes:** `shops(owner_user_id)`, `shops(slug)`, `subscriptions(owner_user_id)`.

---

## 8. Tech stack

| Concern | Choice |
|---|---|
| Build tool | Claude Code (Pro plan) |
| Framework | Next.js (App Router) + TypeScript |
| Local runtime | Node.js 18+ |
| Database | Neon Postgres (free) |
| Auth (M2) | Auth.js / NextAuth on Postgres |
| Secrets | Host env vars (Vercel) / `.env.local` |
| STT | Web Speech API (free) → Whisper later |
| LLM | Anthropic `claude-sonnet-4-6` |
| Payments (M3) | Razorpay Subscriptions |
| Host | Vercel free (recommended) or Replit free |

---

## 9. Architecture & security (zero-trust)

- **Owner path:** authenticated → every API route re-verifies session → `owner_user_id` derived from verified session, never client-supplied → queries scoped to owner.
- **Public path:** unauthenticated, read-only → only `status = 'active'` served → never exposes owner ids or draft content.
- **Billing:** the Razorpay webhook is the source of truth for `subscriptions.status`.

### Zero-trust requirements (non-negotiable)
1. Validate the session on every mutating request.
2. Derive tenant identity server-side; never accept `shop_id`/`owner_user_id` from the client for writes. Every query carries `WHERE owner_user_id = :session_user`.
3. (Recommended) Enable Postgres Row-Level Security as a backstop.
4. Verify Razorpay webhook signatures.
5. Validate and size-limit uploads; sanitize all LLM-produced text before rendering.
6. Rate-limit the voice/LLM endpoint per user/IP.

---

## 10. Monetization

| | Free | Pro (₹249/mo target — validate) |
|---|---|---|
| Storefronts | 1 | Up to 5 |
| Branding | "Made with BolDukaan" | Removed |
| Themes | Classic only | All themes |
| Voice editing | — | ✓ |
| Custom domain (M4) | — | ✓ |
| Analytics (M4) | — | ✓ |

---

## 13. Success metrics
- **M0 gate:** ≥ 80% of fields correct from a single unedited voice input across 5 test shops.
- **Activation:** % of visitors who speak → publish.
- **Time-to-published:** < 2 minutes.
- **Funnel virality:** storefronts shared on WhatsApp → new visitors who start onboarding.
- **Conversion:** free → pro rate.

---

## 14. Risks & open questions

| Risk | Mitigation |
|---|---|
| Hindi/Punjabi STT accuracy on cheap phones in noisy shops | Test early; tap-to-edit fallback; Whisper for prod |
| Commodity perception ("Google does this free") | Lead 100% on voice effortlessness |
| Claude hallucinating shop details | Strict JSON validation; null over guess; owner confirms before publish |
| Willingness to pay unproven | Free tier + branding funnel; validate ₹ price before M3 |
| Hitting Pro usage caps mid-build | Milestone-sized sessions; keep CLAUDE.md tight |
| Accidental API billing on Claude Code | Keep ANTHROPIC_API_KEY out of the dev shell |

**Open questions before M3:**
1. Will owners trust a voice-generated page enough to publish without heavy editing?
2. Is the payment trigger "remove branding," "voice edit," or "more storefronts"?
3. Hindi vs Punjabi vs English — which dominates input for the first 20 shops?

---

*Build M0 first. Everything else is scaffolding around a thesis that M0 either proves or kills.*
