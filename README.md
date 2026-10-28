# FLUX · Finalist prototype

[Что изменено к финалу: сайт, репозитории и документы](docs/FINAL-CHANGES.ru.md).

Kazakhstan short-trip concept for German-speaking visitors. The full website is available in Russian, German and English: home, catalog, all five routes, journal, finder and booking workflow. The RU / DE / EN switch preserves the route and chosen language.

Live Russian start: https://flux-kazakhstan.vercel.app/demo.html?lang=ru

## What works

1. Trip itinerary, full price, inclusions, guide language and cancellation terms are visible before booking.
2. A traveller books directly from the trip page, without an operator check or publication step.
3. The demo booking keeps the trip details accepted at checkout. Its confirmation is a responsive travel pass with a Charyn photograph, traveller details and model payment breakdown.
4. Download a styled two-page PDF or request cancellation. The saved trip details remain attached to the booking.

Confirmation links use a local booking reference. Reloading or switching RU / DE / EN preserves the confirmation in the same browser. A cancellation request persists on reload and remains a request, not a completed refund. The removed operator URL redirects to the Charyn trip so older links remain usable.

The PDF uses two A4 landscape pages: a photo travel pass with a dark tear-off stub, then saved terms in two columns with a separate contact strip. The web confirmation keeps its existing layout. The PDF is generated locally on demand, including embedded fonts for Cyrillic, German and the tenge symbol. It does not send contact information to a server. `vendor/DEPENDENCIES.json` records the pinned jsPDF build and Adobe font revisions; MIT/OFL licenses are included. No CDN or internet connection is needed when the site is served locally.

Checkout starts with one traveller. The total follows the number selected; existing bookings keep the price accepted at confirmation. Guides conduct the tour in English only.

Pilot: Charyn, 7-8 November 2026, 89,000 KZT per person, English-speaking guide, eight guests maximum. Data are illustrative. Other routes remain concepts; their checkout directs to this pilot.

## Storage and payments

The pilot uses localStorage in one browser. It has no shared database or operator authentication. No money is charged, no card details are collected, and no contact information is sent. Clearing browser storage clears local records. Cancellation requests do not complete refunds or release seats automatically.

api/send-receipt.js is an older optional Vercel/Resend experiment; the finalist flow does not call it. Email delivery and live payments are not claimed as ready.

## Run locally, including offline

No build step or external fonts are required.

```bash
python3 -m http.server 3328 --bind 127.0.0.1
```

Open http://127.0.0.1:3328/demo.html?lang=ru . Use HTTP, not a file URL, so pages share the same storage origin.

## Checks

```bash
node tests/proof-core.test.cjs
```

tests/browser.mjs requires Playwright with Chromium available. FLUX_NODE_MODULES optionally points to an installed node_modules directory, ending with /. FLUX_BASE_URL optionally selects the local or deployed URL. The test uses a temporary context, synthetic contact data and no POST requests.

`tests/receipt.mjs` checks PDF downloads in RU/DE/EN, 320-1440 px confirmation layouts, accepted snapshot preservation after a price/policy change, reload/language/cancellation persistence, local-only assets, failed-download retry and long contact fields. `FLUX_RECEIPT_OUT` chooses the output directory for its synthetic PDFs and screenshots.

## Source

proof-core.js holds the local booking model and saved trip details. final-demo.js and final-demo.css render the pilot; site.js and enhance.js render the original destination pages. Images/fonts are local. docs/AI-USE.md records AI use and links to prompts. The 89,000 KZT model includes twelve months of support, 198 first-year guests and 33 departures; historical Stage 1 figures should not be mixed with it.

## Russian locale

Edit locales/ru.json and run python3 scripts/build-locales.py to regenerate the offline i18n-ru.js. Full Russian checks: node tests/russian.mjs (Playwright required). The dictionary covers 363 interface strings and all five itineraries.

Financial plan: KZT 7.0731m project expenses plus KZT 12.210m trip execution = KZT 19.2831m first-year total. Payback month 14 / 18. The downside assumes fewer departures with unchanged marketing; keeping the original calendar does not pay back within 24 months. Vehicle/driver, guide and per-guest costs are planning estimates, not supplier quotations.
