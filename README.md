# FLUX — Kazakhstan travel concept

Bilingual (DE/EN) static prototype for a small-group travel product: trip pages, departures, a three-step demo checkout and a demo receipt email.

Prices, dates, guides, reviews and departures are illustrative. Checkout is a demo: no card is charged and no real booking is created. The receipt email is also a demo.

## Stack

- Plain HTML, CSS and JavaScript — no build step.
- `api/send-receipt.js` — Vercel serverless function for the demo receipt.
- [Resend](https://resend.com) for email delivery (optional).

## Deploy on Vercel

1. Import this repository at [vercel.com/new](https://vercel.com/new).
2. Framework preset: **Other**. Build command and output directory: leave empty (the site is at the repository root).
3. Optionally enable the demo receipt email:
   - Create a Resend account and an API key with sending access.
   - In Vercel → **Settings → Environment Variables**, add `RESEND_API_KEY`.
   - For any recipient, verify a domain in Resend and set `RECEIPT_FROM=FLUX <receipts@your-domain>`.
   - Redeploy. Environment variables only apply to new deployments.
4. Without `RESEND_API_KEY`, checkout still works and shows a demo fallback instead of sending email.

> Before domain verification, Resend's default `onboarding@resend.dev` sender can only deliver to the email address that owns the Resend account.

## Structure

```text
index.html, tours.html, booking.html, journal.html
site.js, enhance.js, enhance.css, style.css
api/send-receipt.js
vercel.json
assets/, fonts/
```

## Local preview

```bash
python3 -m http.server 3327
# open http://127.0.0.1:3327/
```

The serverless email function runs only on Vercel.
