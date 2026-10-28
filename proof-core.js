/* FLUX local booking records and accepted trip details. No real payment or live inventory. */
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
    schema: 1,
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
  function published(store) {
    const state = read(store);
    const version = state.versions.find(v => v.id === state.activeVersion);
    if (!version || !version.departure || !Number.isInteger(version.departure.price) || version.departure.price < 1) throw new Error('departure');
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
  return { KEY, DEFAULT: clone(DEFAULT), read, published, remaining, book, cancel };
});
