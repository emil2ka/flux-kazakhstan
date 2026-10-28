# FLUX · Finalist prototype

[Что изменено к финалу: сайт, репозитории и документы](docs/FINAL-CHANGES.ru.md).

Kazakhstan short-trip concept for German-speaking visitors. The DE/EN destination site is preserved; the complete Charyn pilot and operator workflow also have a Russian view for the final pitch.

Live Russian start: https://flux-kazakhstan.vercel.app/demo.html?lang=ru

Operator: https://flux-kazakhstan.vercel.app/operator.html?lang=ru

## What works

1. Structured departure: full price, inclusions, guide language and cancellation terms.
2. Contradictory or incomplete fields block publication. Fix the sample transfer conflict, then publish a new version.
3. A traveller books the published version. A stale checkout cannot confirm after conditions change.
4. The demo booking retains its accepted terms snapshot. Download confirmation or request cancellation; old snapshots survive later publications.

Pilot: Charyn, 7-8 November 2026, 55,000 KZT per person, eight guests maximum. Data are illustrative. Other routes remain concepts; their checkout directs to this pilot.

## Storage and payments

The pilot uses localStorage in one browser. It has no shared database or operator authentication. No money is charged, no card details are collected, and no contact information is sent. Clearing browser storage clears local records. Cancellation requests do not complete refunds or release seats automatically.

api/send-receipt.js is an older optional Vercel/Resend experiment; the finalist flow does not call it. Email delivery and live payments are not claimed as ready.

## Run locally, including offline

No build step or external fonts are required.

```bash
python3 -m http.server 3328 --bind 127.0.0.1
```

Open http://127.0.0.1:3328/demo.html?lang=ru . Use HTTP, not a file URL, so pages share the same storage origin. Keep operator and traveller views in the same browser.

## Checks

```bash
node tests/proof-core.test.cjs
```

tests/browser.mjs requires Playwright with Chromium available. FLUX_NODE_MODULES optionally points to an installed node_modules directory, ending with /. FLUX_BASE_URL optionally selects the local or deployed URL. The test uses a temporary context, synthetic contact data and no POST requests.

## Source

proof-core.js holds the tested version/booking model. final-demo.js and final-demo.css render the pilot; site.js and enhance.js render the original destination pages. Images/fonts are local. docs/AI-USE.md records AI use and links to prompts. The 55,000 KZT financial model includes twelve months of support; historical Stage 1 figures should not be mixed with it.
