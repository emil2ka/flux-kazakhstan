/* FLUX demo model. Local, versioned records; no real payment or live inventory. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FluxProof = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const KEY = 'flux-final-demo-v1';
  const clone = value => JSON.parse(JSON.stringify(value));
  const DEFAULT = {
    id: 'charyn-2026-11-07', tour: 'charyn', start: '2026-11-07', end: '2026-11-08',
    price: 55000, capacity: 8, languages: ['de', 'en'], transfer: 'included',
    transferExtra: false, accommodation: 'included', park: 'included', meals: 'included',
    cancelHours: 48, meeting: 'Almaty', currency: 'KZT'
  };
  const initial = () => ({
    schema: 1, draft: { ...clone(DEFAULT), transferExtra: true },
    activeVersion: 'CH-2026-11-07-v1',
    versions: [{ id: 'CH-2026-11-07-v1', number: 1, publishedAt: '2026-10-27T00:00:00Z', departure: clone(DEFAULT) }],
    bookings: []
  });
  function storage(store) { return store || (typeof localStorage !== 'undefined' ? localStorage : null); }
  function read(store) {
    const s = storage(store);
    if (!s) return initial();
    try {
      const raw = s.getItem(KEY);
      if (!raw) return initial();
      const value = JSON.parse(raw);
      if (value.schema !== 1 || !Array.isArray(value.versions) || !Array.isArray(value.bookings)) return initial();
      return value;
    } catch (_) { return initial(); }
  }
  function write(value, store) {
    const s = storage(store);
    if (!s) throw new Error('storage');
    try { s.setItem(KEY, JSON.stringify(value)); } catch (_) { throw new Error('storage'); }
    return clone(value);
  }
  function check(d) {
    const errors = [];
    if (!Number.isInteger(d.price) || d.price < 1 || d.price > 1000000) errors.push('price');
    if (!Number.isInteger(d.capacity) || d.capacity < 1 || d.capacity > 8) errors.push('capacity');
    if (d.transfer !== 'included') errors.push('transfer');
    if (d.transfer === 'included' && d.transferExtra) errors.push('transfer_conflict');
    if (d.accommodation !== 'included') errors.push('accommodation');
    if (d.park !== 'included') errors.push('park');
    if (d.meals !== 'included') errors.push('meals');
    if (!Array.isArray(d.languages) || !d.languages.length || d.languages.some(l => !['de', 'en'].includes(l))) errors.push('language');
    if (![24, 48, 72].includes(Number(d.cancelHours))) errors.push('cancellation');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.start || '') || !/^\d{4}-\d{2}-\d{2}$/.test(d.end || '') || d.start > d.end) errors.push('date');
    return errors;
  }
  function published(store) {
    const state = read(store);
    const version = state.versions.find(v => v.id === state.activeVersion);
    if (!version || check(version.departure).length) throw new Error('unpublished');
    return clone(version);
  }
  function saveDraft(draft, store) {
    const state = read(store);
    // Route/date are intentionally fixed for this one-route pilot.
    state.draft = { ...clone(DEFAULT), ...clone(draft), id: DEFAULT.id, tour: 'charyn', start: DEFAULT.start, end: DEFAULT.end };
    write(state, store);
    return clone(state.draft);
  }
  function publish(store) {
    const state = read(store);
    if (check(state.draft).length) throw new Error('inconsistent');
    const alreadyBooked = state.bookings.filter(b => ['demo_confirmed', 'cancel_requested'].includes(b.status)).reduce((n, b) => n + b.guests, 0);
    if (state.draft.capacity < alreadyBooked) throw new Error('capacity');
    const number = Math.max(...state.versions.map(v => v.number)) + 1;
    const version = { id: `CH-2026-11-07-v${number}`, number, publishedAt: new Date().toISOString(), departure: clone(state.draft) };
    state.versions.push(version); state.activeVersion = version.id;
    write(state, store);
    return clone(version);
  }
  function remaining(store) {
    const v = published(store), state = read(store);
    return Math.max(0, v.departure.capacity - state.bookings.filter(b => ['demo_confirmed', 'cancel_requested'].includes(b.status)).reduce((n, b) => n + b.guests, 0));
  }
  function book(input, store) {
    const state = read(store), version = published(store);
    if (input.versionId !== version.id) throw new Error('version_changed');
    const guests = Number(input.guests);
    if (!Number.isInteger(guests) || guests < 1 || guests > remaining(store)) throw new Error('seats');
    if (!version.departure.languages.includes(input.guideLanguage)) throw new Error('language');
    const name = String(input.name || '').trim().slice(0, 100);
    const email = String(input.email || '').trim().slice(0, 160);
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('contact');
    if (!input.accepted) throw new Error('consent');
    let ref;
    do { ref = 'FX-' + Math.random().toString(36).slice(2, 7).toUpperCase().padEnd(5, '0'); } while (state.bookings.some(b => b.ref === ref));
    const total = guests * version.departure.price;
    const booking = {
      ref, name, email, guests, guideLanguage: input.guideLanguage,
      status: 'demo_confirmed', paymentMode: 'simulation', paidAmount: 0,
      total, deposit: Math.round(total * .2), balance: total - Math.round(total * .2),
      acceptedAt: new Date().toISOString(), termsVersionId: version.id,
      termsSnapshot: clone(version), note: String(input.note || '').trim().slice(0, 500)
    };
    state.bookings.push(booking); write(state, store);
    return clone(booking);
  }
  function cancel(ref, store) {
    const state = read(store), booking = state.bookings.find(b => b.ref === ref);
    if (!booking) throw new Error('booking');
    booking.status = 'cancel_requested'; write(state, store);
    return clone(booking);
  }
  return { KEY, DEFAULT: clone(DEFAULT), read, check, saveDraft, publish, published, remaining, book, cancel };
});
