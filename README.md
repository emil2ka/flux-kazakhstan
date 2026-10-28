# FLUX — finalist prototype

Multilingual short-trip booking prototype for Saryarqa Routes. Charyn day trip: **44,000 KZT per person**, 7 November 2026, English-speaking guide, up to 12 guests. One traveller by default. Transfer, lunch, water and park entry included; no overnight stay.

Live: https://flux-kazakhstan.vercel.app/index.html?lang=ru

## Run offline

```sh
python3 -m http.server 3328 --bind 127.0.0.1
```

Open http://127.0.0.1:3328/index.html?lang=ru. Local assets/fonts, no build step. UI: RU/DE/EN. Only Charyn has the complete demo journey; other routes are concepts.

## Booking and tickets

Each traveller provides a name; one email belongs to the booking. Named tickets have unique IDs. Each costs 44,000: model deposit 8,800 and model balance 35,200. Two guests total 88,000. Each PDF ticket has two pages; download separately or as one collection. Saved historical bookings retain their accepted terms and price.

No real charges, mail delivery, shared inventory or production database. localStorage is browser-local. Cancellation is a request. operator.html redirects to the trip. Guiding is English only; no live interpretation.

## Model and checks

Planning model: operator-assisted sales from month 2; 400 new foreign guests/40 departures in year one, 10 target guests, 12 maximum. First-year total 19,848,000 KZT including estimated audio-guide costs; base payback month 15, -30% scenario month 22 with fewer departures and unchanged marketing. Fixed-calendar downside does not pay back in 24 months. The existing company client flow is separate. Supplier rates, demand and the tax assumption are unvalidated; full existing payroll is not allocated. See docs/economics-final.json.

Run `node --test tests/proof-core.test.cjs`. Browser regression files are in tests/ and require Playwright. proof-core.js stores bookings; final-demo.js renders the pilot; receipt.js produces PDF tickets. site.js renders discovery. Russian source: locales/ru.json, rebuilt by scripts/build-locales.py.

AI use: docs/AI-USE.md. Final rules: https://docs.google.com/document/d/1Oir2Izl827gC0uCQyh7fm7UaPKgzI6D-r0e-EQ3_s00/edit
