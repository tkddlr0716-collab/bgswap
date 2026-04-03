# BgSwap

> AI-powered product photo background removal & replacement for e-commerce sellers.

**Live:** https://bgswap.io

---

## What is BgSwap?

Upload any product photo. AI removes the background and generates 15 professional backgrounds (5 solid + 5 gradient + 5 texture) with optional drop shadows and custom colors. Built for Amazon, Etsy, Shopify, and eBay sellers who need marketplace-compliant product images without studio photography.

### Pricing (one-time, no subscription)

| Plan | Price | Products | Backgrounds | Total Images | Per-image |
|------|-------|----------|-------------|-------------|-----------|
| Free | $0 | 1 | 5 (watermarked, 512px) | 5 | - |
| Starter | $4.99 | 10 | 15 each | 150 | $0.03 |
| Pro | $29 | 100 | 15 each | 1,500 | $0.02 |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.1 + React 19 + TypeScript |
| Styling | TailwindCSS 4 |
| AI | Replicate (`bria/remove-background`) |
| Image Processing | Sharp (compositing, shadows, watermark) |
| Database | Turso (SQLite, ap-northeast-1) |
| Storage | Cloudflare R2 (APAC, public URL) |
| Payments | Polar.sh (webhook-based) |
| Email | Resend (send.bgswap.io) |
| Analytics | PostHog (cookie consent gated) |
| Hosting | Vercel |
| Domain | bgswap.io (Namecheap) |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page (v2 - conversion optimized)
│   ├── upload/page.tsx       # Photo upload (mobile camera support)
│   ├── result/[id]/page.tsx  # Result + payment (Starter/Pro)
│   ├── download/[token]/     # Download page (ZIP + individual)
│   ├── privacy/page.tsx      # Privacy Policy (GDPR/CCPA/PIPA)
│   ├── terms/page.tsx        # Terms of Service
│   ├── refund/page.tsx       # Refund Policy
│   ├── not-found.tsx         # Custom 404
│   ├── error.tsx             # Custom 500
│   ├── layout.tsx            # Root layout (header, footer, PostHog)
│   ├── robots.ts             # robots.txt generation
│   ├── sitemap.ts            # sitemap.xml generation
│   ├── order/[id]/upload/    # Bulk upload page (post-payment)
│   └── api/
│       ├── upload/route.ts   # POST - file upload → R2
│       ├── generate/route.ts # POST - free preview generation
│       ├── generate-one/     # POST - single image processing (paid)
│       ├── status/[id]/      # GET  - order status + processing trigger
│       ├── options/[id]/     # PUT  - save customization options
│       ├── download/[token]/ # GET  - download data / ZIP generation
│       ├── webhook/polar/    # POST - payment webhook (Standard Webhooks)
│       └── cron/cleanup/     # GET  - cleanup + stalled recovery (daily)
├── lib/
│   ├── db.ts                 # Turso client + auto table creation
│   ├── r2.ts                 # S3 client (upload, delete, getPublicUrl)
│   ├── replicate.ts          # Bria AI model invocation
│   ├── compositor.ts         # Sharp compositing (15 backgrounds, shadows)
│   ├── email.ts              # Resend integration
│   ├── security.ts           # Disposable email blocking, rate limit
│   └── analytics.ts          # PostHog event helpers (20 events)
├── components/
│   ├── PostHogProvider.tsx   # Analytics provider (consent-gated)
│   ├── CookieConsent.tsx     # GDPR cookie consent banner
│   └── JsonLd.tsx            # Structured data (FAQ, App, Org)
├── proxy.ts                  # Middleware (CSRF + CORS)
└── public/
    ├── og-image.png          # OG image (1200x630)
    └── llms.txt              # AI crawler summary
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install & Run

```bash
cd bgswap
npm install
npm run dev
```

Open http://localhost:3000

### Environment Variables

Create `.env.local`:

```env
# AI
REPLICATE_API_TOKEN=

# Storage (Cloudflare R2)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=bgswap
R2_PUBLIC_URL=

# Database (Turso)
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=

# Payments (Polar.sh)
POLAR_WEBHOOK_SECRET=
NEXT_PUBLIC_POLAR_CHECKOUT_STARTER=
NEXT_PUBLIC_POLAR_CHECKOUT_PRO=

# Email (Resend)
RESEND_API_KEY=

# Hosting
NEXT_PUBLIC_BASE_URL=https://bgswap.io
CRON_SECRET=

# Analytics (optional)
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

---

## Deployment

Deployed via Vercel CLI (not GitHub integration):

```bash
npx vercel --prod
```

### DNS (Namecheap → bgswap.io)

| Type | Host | Value |
|------|------|-------|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com. |
| TXT | resend._domainkey | (DKIM key from Resend) |
| MX | send | feedback-smtp.ap-northeast-1.amazonses.com (Priority: 10) |
| TXT | send | v=spf1 include:amazonses.com ~all |
| TXT | @ | google-site-verification=... |

---

## External Services

| Service | Purpose | Status |
|---------|---------|--------|
| **Replicate** | AI background removal (bria/remove-background) | Active |
| **Cloudflare R2** | Image storage (APAC, 7-day auto-delete) | Active |
| **Turso** | SQLite database (ap-northeast-1, 6 indexes) | Active |
| **Polar.sh** | Payment processing (Starter/Pro, webhook) | Active |
| **Resend** | Email delivery (send.bgswap.io, DKIM verified) | Active |
| **PostHog** | Analytics (consent-gated, 20 custom events) | Active |
| **Vercel Cron** | Daily cleanup at 03:00 UTC | Active |
| **Google Search Console** | SEO monitoring | Active |

---

## Security

### Phase 1 (Completed)
- **File upload validation** — magic bytes (JPEG/PNG/WebP), Sharp decode, 8000x8000px max, 10MB limit
- **CSP** — `default-src 'self'`, restrictive `connect-src`, `object-src 'none'`, `frame-ancestors 'none'`
- **Security headers** — X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy
- **Cookie consent** — GDPR-compliant, PostHog disabled until user accepts
- **HSTS** — Vercel auto-applied (`max-age=63072000`)

### Phase 2 (Completed)
- **CSRF protection** — Origin header verification on all POST /api/ routes (webhook/cron exempted)
- **CORS restriction** — Access-Control-Allow-Origin limited to bgswap.io + localhost
- **SSRF defense** — R2 URL prefix validation before Replicate API calls
- **Custom error pages** — 404 (not-found.tsx), 500 (error.tsx)

### Known Limitations (MVP)
- Rate limiting is in-memory (DB daily cap exists, Redis planned for >500 req/day)
- No email verification (Polar.sh payment email used instead)
- R2 image URLs are public (mitigated by 7-day auto-expiry)

---

## SEO & Discoverability

- **robots.txt** — Allow /, Disallow /api/, /result/, /download/
- **sitemap.xml** — 5 pages with priority and changeFrequency
- **JSON-LD** — FAQPage (7 Q&A), SoftwareApplication (pricing), Organization
- **llms.txt** — AI crawler summary (features, pricing, differentiators)
- **og-image.png** — 1200x630px, blue gradient with branding
- **metadataBase** — Canonical URLs via NEXT_PUBLIC_BASE_URL

---

## Legal

- **Privacy Policy** (`/privacy`) — GDPR, CCPA, PIPA compliant. Cookie table, data subject rights, 7-day auto-delete.
- **Terms of Service** (`/terms`) — AI-generated content notice, perpetual commercial license, Polar.sh payment disclosure, Korean jurisdiction.
- **Refund Policy** (`/refund`) — Free re-generation + full refund within 7 days.

---

## User Flow

```
Landing → Upload → Free Preview → Payment (Starter/Pro) → Generation → Download
   │                    │                                        │
   │                    └── watermarked, 512px                   └── full res, 15 backgrounds
   │                                                                  + email with download link
   └── FAQ, Pricing, Before/After demo
```

---

## Development Timeline

### Phase 0: MVP (Completed)
- Core upload → AI process → download flow
- Landing page v2 (conversion optimized)
- Mobile-first upload with camera support
- Polar.sh payment integration
- Turso DB + R2 storage + Replicate AI

### Phase 1: Launch Blockers (Completed 2026-03-31)
- File upload security (magic bytes + Sharp validation)
- CSP + security headers
- GDPR cookie consent banner
- PostHog tracking code (20 events)
- SEO: robots.txt, sitemap.xml, JSON-LD, llms.txt, og-image
- metadataBase + canonical URLs

### Phase 2: Launch Week (Completed 2026-03-31)
- CSRF protection (Origin header verification)
- API CORS restriction
- SSRF defense
- Custom 404/500 error pages
- Legal documents (GDPR/PIPA Privacy Policy, Terms with AI disclaimer)
- Payment transparency ("Payments by Polar.sh")
- Custom domain (bgswap.io)
- Resend domain verification (send.bgswap.io)
- PostHog activation
- Google Search Console (pending DNS verification)

### Domain Migration (Completed 2026-03-31)

| Item | Before | After |
|------|--------|-------|
| Domain | bgswap.vercel.app | bgswap.io |
| Email sender | noreply@bgswap.com | noreply@send.bgswap.io |
| Support email | support@bgswap.com | support@bgswap.io |
| Resend domain | bgswap.com (wrong) | bgswap.io (verified) |
| PostHog | Disabled | Active (project 363744) |

### Phase 3: Post-Launch (Completed)
- [x] Product Hunt launch materials, Reddit strategy
- [x] Comparison blog (MDX + `/blog/[slug]`)
- [x] Google Search Console, Sentry error tracking
- [x] Test code (Vitest, 51 tests)

### Phase A~D: Feature Expansion (Completed 2026-04-02)
- [x] Output 2048px, custom background color, free 5-background preview
- [x] Marketplace presets, shadow/padding options, blog MDX
- [x] Texture backgrounds (total 15), batch gallery UI
- [x] Bulk processing (queue-based, 3-parallel, auto-retry)
- [x] Polar webhook (Standard Webhooks), server-side ZIP, email with upload link
- See `STATUS.md` for full details

---

## Documentation

| File | Description |
|------|-------------|
| `README.md` | This file — project overview & setup |
| `STATUS.md` | Current status, recent changes, remaining tasks |
| `AGENTS.md` | Next.js agent rules |
| `docs-backup/` | Archived docs (PROGRESS, ROADMAP, DESIGN, etc.) |

---

## Contact

- **Support:** support@bgswap.io
- **Website:** https://bgswap.io
