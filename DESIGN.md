# DESIGN.md — BolDukaan

This file is the visual contract. All UI must follow it. When generating any component, derive every color, font, and spacing value from the tokens here. Do not introduce default Tailwind colors (no `indigo-500`, `slate-*`, `bg-gradient-*`), default system fonts, or centered-card-on-gradient layouts. If a choice isn't covered here, match the spirit: confident, warm, precise.

## Direction: "Signboard"

The confidence of a hand-painted Indian shopfront — petrol-teal enamel boards, hot marigold signage, bold lettering — executed with digital precision and restraint. The product's magic is voice becoming a storefront, so the voice interaction is the signature and gets the boldness; everything else stays quiet.

This is deliberately NOT the cream-background + high-contrast-serif + terracotta look. Avoid that entirely — it's a generic default.

## Two surfaces (different jobs)

1. **App chrome** (landing, voice screen, dashboard): the full Signboard brand. Bold, confident, petrol grounds, marigold signal. This is where "premium" lives.
2. **Generated storefronts** (`/s/[slug]`): clean, trustworthy, fast, legible. NOT an art piece — a kirana owner's page must load instantly on a cheap Android and look credible. Same palette foundation for brand coherence, but calm and content-first.

## Color tokens

```
--paper:        #F4F3EF   /* cool-neutral content bg (NOT warm cream) */
--ink:          #15201E   /* near-black, green undertone — primary text */
--petrol:       #0C3B38   /* brand ground (hero, nav, dashboard chrome) */
--petrol-deep:  #072724   /* darker petrol, pressed/depth */
--marigold:     #F59E1B   /* THE signal color — voice action only, used sparingly */
--marigold-deep:#C77C0A   /* marigold text/hover on light */
--muted:        #7C8482   /* secondary text */
--line:         #E2E1DA   /* hairline borders on paper */
--green:        #2E9E5B   /* open-now / success only */
--surface-tint: #E9F0EE   /* soft petrol-tint chip/button bg on paper */
```

Rules:
- Marigold is reserved for the voice action and one or two signal moments. It is never a generic button color. Overusing it kills the signal.
- Petrol grounds carry paper-colored text. Paper grounds carry ink text.
- Green is only for live/open/success states.
- No gradients. Depth comes from one soft shadow + the petrol/paper contrast, not glow.

## Typography

```
Display:  "Bricolage Grotesque", weights 700–800   /* headlines, shop names, hero */
Body/UI:  "Hanken Grotesk", weights 400/500/600     /* everything else */
Hindi/Punjabi content: "Noto Sans Devanagari", "Noto Sans Gurmukhi"
```

- Load via `next/font/google`. Always include the Noto faces — storefront content and shop-owner-facing copy appears in Hindi/Punjabi and must not fall back to a tofu font.
- Headlines: Bricolage 800, tight tracking (`-0.02em`), line-height ~1.0. Big and confident — signage, not delicate.
- Body: Hanken, line-height 1.5–1.6.
- Sentence case everywhere. Never Title Case, never ALL CAPS except the small letterspaced eyebrow/label treatment.
- Type scale (mobile-first): display 40px, h2 24px, h3 18px, body 16px, label 12px (uppercase, letterspaced 0.14em, muted).

## Layout & shape

- Mobile-first, single column, generous vertical rhythm (24/32/40px sections).
- Radii: cards 18px, controls/buttons 12px, chips/pills 999px. Tactile, not bubbly.
- Borders: 1px `--line` hairlines on paper. On petrol, a faint marigold enamel frame (`border:1.5px solid rgba(245,158,27,.22)`) used at most once per screen.
- One soft shadow token only: `0 6px 20px rgba(21,32,30,.05)` for raised cards; `0 12px 28px rgba(245,158,27,.4)` for the voice button.
- Asymmetry over dead-centered everything (except the voice button, which is centered because it's the focal ritual).

## The signature: voice button

The one element the product is remembered by. Spend the motion budget here.

- A large circular marigold button (~116px) with two concentric breathing rings.
- Idle: rings slowly breathe (scale 1→1.08, opacity fade), 3.4s loop. A small pulsing dot signals "ready to listen."
- Recording (held): drive the ring radius / an equalizer of bars from real mic amplitude via the Web Audio API `AnalyserNode`. It must react to the actual voice — this realtime responsiveness is what makes it feel alive vs. a fake loop.
- Release → resolve: rings collapse inward and the storefront card animates in (staggered fields, fast, eased). The waveform visibly "becoming" the shop.
- All motion is transform/opacity only (GPU-cheap for low-end Android). Throttle the analyser. Honor `prefers-reduced-motion` — fall back to a static button + instant card.

## Component patterns

- Buttons: primary = `--ink` bg / paper text, 12px radius, weight 600. Secondary = `--surface-tint` bg / `--petrol` text. Marigold is NOT a button color (except the voice ritual).
- Chips (products, tags): `--surface-tint` bg, `--petrol` text, pill radius.
- Open-now indicator: green dot + "Open now · closes 9:00 PM" in `--green`.
- Storefront card: white bg, `--line` border, 18px radius, shop name in Bricolage, hours/products/contact, call (ink) + WhatsApp (tint) actions.
- Inputs: use shadcn/ui primitives, re-themed to these tokens. Do not ship default shadcn neutral styling — override the CSS vars so it doesn't read as "a shadcn app."

## Performance floor (non-negotiable for this audience)

Target: a ₹8–10k Android phone on 4G in a shop.
- No WebGL, no heavy hero video, no large webfonts beyond the three families above.
- Public storefronts are server-rendered and ship minimal JS.
- Images lazy-loaded and compressed. Lighthouse mobile performance ≥ 90.

## Do NOT

- No default Tailwind palette (indigo/slate/etc.), no `bg-gradient-*`.
- No warm-cream + serif-display + terracotta theme (generic default).
- No marigold as a general accent — it's the voice signal only.
- No centered card floating on a gradient.
- No motion that isn't transform/opacity; nothing that janks on a cheap phone.
- No Title Case, no decorative numbered markers unless content is a real sequence.
