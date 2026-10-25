const RESEND_ENDPOINT = 'https://api.resend.com/emails';

const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c]);

const money = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('en-US').format(n) + ' ₸';
};

const text = (value, max) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.status(405).json({ sent: false, error: 'Method not allowed' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = null;
    }
  }
  if (!body || typeof body !== 'object') {
    res.status(400).json({ sent: false, error: 'Invalid body' });
    return;
  }

  const email = text(body.email, 160).toLowerCase();
  const ref = text(body.ref, 40).toUpperCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ sent: false, error: 'Invalid email' });
    return;
  }
  if (!/^FX-[A-Z0-9]{5}$/.test(ref)) {
    res.status(400).json({ sent: false, error: 'Invalid reference' });
    return;
  }

  const total = Number(body.total);
  if (!Number.isFinite(total) || total <= 0 || total > 1e9) {
    res.status(400).json({ sent: false, error: 'Invalid total' });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    res.status(200).json({ sent: false, configured: false });
    return;
  }

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const hits = globalThis.__receiptHits || (globalThis.__receiptHits = new Map());
  const recent = (hits.get(ip) || []).filter((t) => now - t < 3600000);
  if (recent.length >= 10) {
    res.status(429).json({ sent: false, error: 'Too many requests' });
    return;
  }
  recent.push(now);
  hits.set(ip, recent);

  const de = body.lang === 'de';
  const guests = Math.max(1, Math.min(8, Number(body.guests) || 1));
  const deposit = Math.round(total * 0.2);
  const balance = total - deposit;
  const trip = text(body.trip, 120) || 'FLUX trip';
  const date = text(body.date, 120) || '—';
  const name = text(body.name, 120);

  const copy = de
    ? {
        badge: 'FLUX · Demo-Beleg',
        heading: 'Deine Demo-Buchung',
        intro: 'Danke! Hier ist die Zusammenfassung deiner Demo-Buchung.',
        reference: 'Referenz',
        trip: 'Reise',
        date: 'Termin',
        guests: 'Reisende',
        total: 'Gesamt',
        deposit: 'Anzahlung bezahlt (20 %)',
        balance: 'Rest vor der Abreise',
        note: 'Dies ist eine Demo. Es wurde kein Geld abgebucht und es entsteht keine echte Buchung.',
        footer: 'Flux · Saryarqa Routes Konzept',
        subject: 'FLUX Demo-Beleg ' + ref,
      }
    : {
        badge: 'FLUX · demo receipt',
        heading: 'Your demo booking',
        intro: 'Thanks! Here is the summary of your demo booking.',
        reference: 'Reference',
        trip: 'Trip',
        date: 'Date',
        guests: 'Travellers',
        total: 'Total',
        deposit: 'Deposit paid (20%)',
        balance: 'Balance before departure',
        note: 'This is a demo. No card was charged and no real booking was created.',
        footer: 'Flux · Saryarqa Routes concept',
        subject: 'FLUX demo receipt ' + ref,
      };

  const rows = [
    [copy.trip, trip],
    [copy.date, date],
    [copy.guests, String(guests)],
    [copy.total, money(total)],
    [copy.deposit, money(deposit)],
    [copy.balance, money(balance)],
  ];

  const rowsHtml = rows
    .map(
      ([label, value], index) =>
        `<tr><td style="padding:11px 0;${index ? 'border-top:1px solid #ecebe5;' : ''}font-size:13px;color:#565d56">${esc(label)}</td><td style="padding:11px 0;${index ? 'border-top:1px solid #ecebe5;' : ''}font-size:13px;font-weight:600;text-align:right;color:#181a17">${esc(value)}</td></tr>`
    )
    .join('');

  const html = `<!doctype html>
<html lang="${de ? 'de' : 'en'}">
<body style="margin:0;padding:0;background:#f6f5f1;font-family:Arial,Helvetica,sans-serif;color:#181a17">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="background:#ffffff;border:1px solid #e6e5df;border-radius:16px;overflow:hidden">
      <div style="padding:28px 28px 0">
        <p style="margin:0 0 10px;font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:#a83a1a;font-weight:700">${esc(copy.badge)}</p>
        <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:28px;line-height:1.1;letter-spacing:-.6px">${esc(copy.heading)}</h1>
        <p style="margin:0 0 20px;font-size:13px;line-height:1.6;color:#565d56">${esc(copy.intro)}${name ? ' ' + esc(de ? 'Für ' : 'For ') + esc(name) + '.' : ''}</p>
      </div>
      <div style="padding:0 28px 24px">
        <p style="margin:0 0 4px;font-size:11px;letter-spacing:.8px;text-transform:uppercase;color:#565d56">${esc(copy.reference)}</p>
        <p style="margin:0 0 18px;font-family:Georgia,serif;font-size:24px;letter-spacing:1px">${esc(ref)}</p>
        <table role="presentation" style="width:100%;border-collapse:collapse">${rowsHtml}</table>
      </div>
      <div style="background:#f6f5f1;padding:16px 28px;font-size:11px;line-height:1.6;color:#565d56">${esc(copy.note)}</div>
    </div>
    <p style="margin:16px 0 0;text-align:center;font-size:10px;color:#8b918b">${esc(copy.footer)}</p>
  </div>
</body>
</html>`;

  const textBody = [
    copy.badge,
    '',
    copy.reference + ': ' + ref,
    copy.trip + ': ' + trip,
    copy.date + ': ' + date,
    copy.guests + ': ' + guests,
    copy.total + ': ' + money(total),
    copy.deposit + ': ' + money(deposit),
    copy.balance + ': ' + money(balance),
    '',
    copy.note,
    '',
    copy.footer,
  ].join('\n');

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RECEIPT_FROM || 'FLUX Demo <onboarding@resend.dev>',
        to: [email],
        subject: copy.subject,
        html,
        text: textBody,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.error('Resend rejected the message:', response.status, detail.slice(0, 500));
      res.status(502).json({ sent: false, configured: true, error: 'Email provider rejected the message' });
      return;
    }

    res.status(200).json({ sent: true });
  } catch (error) {
    console.error('Resend request failed:', error);
    res.status(502).json({ sent: false, configured: true, error: 'Email provider unavailable' });
  }
};
