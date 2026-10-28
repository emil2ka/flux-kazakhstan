/* Finalist pilot UI. Same brand, one coherent route, DE/EN customer views + RU pitch view. */
(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  const page = document.body.dataset.page;
  const requestedLang = params.get('lang');
  const owned = page === 'demo' ||
    (['tours', 'booking'].includes(page) && params.get('place') === 'charyn');
  window.FluxDemo = { owned };
  if (!owned) return;
  const F = window.FluxProof;
  let rememberedLang; try { rememberedLang=localStorage.getItem('flux-language'); } catch (_) {}
  const lang=['ru','en','de'].includes(requestedLang)?requestedLang:['ru','en','de'].includes(rememberedLang)?rememberedLang:page==='demo'?'ru':'de';
  document.documentElement.lang = lang;
  try { localStorage.setItem('flux-language', lang); } catch (_) {}
  document.body.classList.add('final-demo');
  const tr = (ru, en, de) => lang === 'ru' ? ru : lang === 'de' ? de : en;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const money = n => new Intl.NumberFormat(lang === 'ru' ? 'ru-RU' : lang === 'de' ? 'de-DE' : 'en-GB').format(n) + ' ₸';
  const link = (file, extra = '') => `${file}?lang=${lang}${extra}`;
  const tourURL = () => link('tours.html', '&place=charyn');
  const bookingURL = () => link('booking.html', '&place=charyn');
  const routeName = tr('Чарын', 'Charyn Canyon', 'Charyn-Canyon');
  const dateLabel = tr('7–8 ноября 2026', '7–8 Nov 2026', '7.–8. Nov. 2026');
  const guideName = l => l === 'de' ? tr('Немецкий', 'German', 'Deutsch') : tr('Английский', 'English', 'Englisch');
  const logo = `<a class="wordmark" href="${link('index.html')}" aria-label="FLUX"><span class="brand-lockup"><img class="brand-mark" src="assets/logo-flux.png" alt="" width="35" height="32"><span class="brand-word">FLUX</span></span></a>`;
  const header = `<header class="header header-minimal">${logo}<nav class="fd-nav"><a href="${tourURL()}">${tr('Тур', 'The trip', 'Die Reise')}</a></nav><div class="languages">${['ru', 'de', 'en'].map(l => `<button data-final-lang="${l}" aria-pressed="${l === lang}">${l.toUpperCase()}</button>`).join('<span>/</span>')}</div></header>`;
  const footer = `<footer class="wrap fd-footer">${logo}<p>${tr('Демонстрационный прототип Saryarqa Routes. Фото созданы с помощью ИИ. Реальные туры и платежи не оформляются.', 'Saryarqa Routes prototype. AI-generated imagery. No real trips or payments are processed.', 'Saryarqa-Routes-Prototyp. KI-generierte Bilder. Keine echten Reisen oder Zahlungen.')}</p></footer>`;
  const demoNotice = `<p class="fd-notice">${tr('Демовыезд: цена, программа и условия — пример для пилота, а не реальное предложение.', 'Demo departure: price, itinerary and terms are pilot assumptions, not a live offer.', 'Demo-Termin: Preis, Programm und Bedingungen sind Pilotannahmen, kein buchbares Angebot.')}</p>`;
  const btn = (href, label, cls = '') => `<a class="button button-dark ${cls}" href="${href}">${label}<span aria-hidden="true">→</span></a>`;
  const included = () => [
    tr('Трансфер из Алматы и обратно', 'Return transfer from Almaty', 'Hin- und Rücktransfer ab Almaty'),
    tr('Одна ночь в гостевом доме', 'One night in a guesthouse', 'Eine Nacht in einer Pension'),
    tr('Англоязычный гид', 'English-speaking guide', 'Englischsprachiger Guide'),
    tr('Вход в национальный парк', 'National park entry', 'Nationalparkeintritt'),
    tr('Два обеда, ужин и завтрак', 'Two lunches, dinner and breakfast', 'Zwei Mittagessen, Abendessen und Frühstück')
  ];
  function cancellation(v) {
    const h = v.departure.cancelHours;
    return tr(`В демосценарии отмена не позднее чем за ${h} часов до выезда предусматривает возврат предоплаты целиком. Позже предоплата не возвращается. Если выезд отменяет оператор, предоплата возвращается целиком. Заявка на отмену ещё не означает выполненный возврат. Денег в демо не списывают. Условия реального пилота должен утвердить оператор.`,
      `Demo policy: cancel at least ${h} hours before departure for a full deposit refund. Later cancellations forfeit the deposit. If the operator cancels, the deposit is refunded in full. A cancellation request is not a completed refund. No money is charged in this demo. A real operator must approve the live policy.`,
      `Demo-Regel: Bei Stornierung mindestens ${h} Stunden vor Abreise wird die Anzahlung vollständig erstattet. Danach verfällt die Anzahlung. Sagt der Veranstalter ab, wird sie vollständig erstattet. Eine Stornoanfrage ist noch keine Erstattung. In dieser Demo wird kein Geld abgebucht. Der Veranstalter muss echte Bedingungen freigeben.`);
  }
  function terms(v) {
    return `<section id="included" class="fd-section"><p class="eyebrow">${tr('До бронирования', 'Before booking', 'Vor der Buchung')}</p><h2>${tr('Что входит в цену', "What's included", 'Was enthalten ist')}</h2><div class="fd-terms"><ul>${included().map(x => `<li>${x}</li>`).join('')}</ul><div><h3>${tr('Без обязательных доплат', 'No mandatory extras', 'Keine Pflichtzuschläge')}</h3><p>${tr('Все обязательные услуги по программе включены. Личные покупки и напитки вне программы оплачиваются отдельно.', 'All mandatory itinerary services are included. Personal purchases and drinks outside the programme are extra.', 'Alle verpflichtenden Programmleistungen sind enthalten. Persönliche Einkäufe und zusätzliche Getränke kosten extra.')}</p><p>${tr('Экскурсия проходит на английском языке.', 'The tour is guided in English.', 'Die Führung findet auf Englisch statt.')}</p></div></div></section>
      <section id="cancellation" class="fd-section"><h2>${tr('Условия отмены', 'Cancellation terms', 'Stornobedingungen')}</h2><p class="fd-readable">${cancellation(v)}</p></section>`;
  }
  function home() {
    return `<main id="main"><section class="fd-hero wrap"><div><p class="eyebrow">Saryarqa Routes</p><h1>${tr('Короткие туры<br>по Казахстану', 'Short trips.<br>Clear terms.', 'Kurze Reisen.<br>Klare Bedingungen.')}</h1><p>${tr('Для тех, кто уже едет в Казахстан и хочет добавить два дня на природе.', 'For travellers already visiting Kazakhstan who want two guided days in nature.', 'Für Reisende, die Kasachstan schon besuchen und zwei geführte Tage in der Natur ergänzen möchten.')}</p>${btn(tourURL(), tr('Посмотреть тур', 'Explore the trip', 'Reise ansehen'))}${demoNotice}</div><figure><img src="assets/photo-charyn-1.webp" alt="${routeName}"></figure></section><section class="wrap fd-section"><h2>${tr('Один выезд для пилота', 'One pilot departure', 'Ein Pilottermin')}</h2><p>${routeName} · ${dateLabel} · ${money(F.published().departure.price)}</p><p>${tr('Программа, полная цена и условия отмены доступны до бронирования. После оформления можно скачать билет.', 'See the itinerary, full price and cancellation terms before booking. Download your ticket after confirmation.', 'Programm, Gesamtpreis und Stornobedingungen sind vor der Buchung sichtbar. Danach kannst du dein Ticket herunterladen.')}</p>${btn(tourURL(), tr('Открыть условия', 'Review terms', 'Bedingungen ansehen'))}</section></main>`;
  }
  function trip() {
    const v = F.published(), d = v.departure;
    return `<main id="main" class="pdp"><div class="detail-top wrap"><nav class="breadcrumb"><a href="${link('index.html')}">${tr('Главная', 'Home', 'Startseite')}</a><span>/</span><span>${routeName}</span></nav><div class="detail-heading"><div><p class="eyebrow">${tr('Каньон и открытое небо', 'Canyon and open sky', 'Canyon und Weite')}</p><h1>${routeName}</h1></div><p>${tr('Два дня из Алматы', 'Two days from Almaty', 'Zwei Tage ab Almaty')}</p></div><div class="detail-chips"><span>${tr('2 дня', '2 days', '2 Tage')}</span><span>${dateLabel}</span><span>${tr('Демовыезд', 'Demo departure', 'Demo-Termin')}</span></div></div><div class="pdp-top wrap"><div class="detail-photo"><img src="assets/field-charyn.webp" alt="${routeName}"></div><aside class="pdp-buy"><span class="eyebrow">${tr('Полная цена', 'Full trip price', 'Gesamtpreis')}</span><strong class="pdp-price">${money(d.price)}</strong><span class="pdp-per">${tr('за человека', 'per person', 'pro Person')}</span><dl class="pdp-meta"><div><dt>${tr('Выезд', 'Departure', 'Abreise')}</dt><dd>${dateLabel}</dd></div><div><dt>${tr('Место встречи', 'Meeting point', 'Treffpunkt')}</dt><dd>${tr('Алматы, точка в подтверждении', 'Almaty, details in confirmation', 'Almaty, Details in der Bestätigung')}</dd></div><div><dt>${tr('Язык гида', 'Guide language', 'Guidesprache')}</dt><dd>${d.languages.map(guideName).join(' / ')}</dd></div><div><dt>${tr('Мест в демо', 'Demo places', 'Demo-Plätze')}</dt><dd>${F.remaining()}</dd></div></dl>${btn(bookingURL(), tr('Перейти к бронированию', 'Continue to booking', 'Zur Buchung'))}<p class="pdp-note">${tr('20% предоплата. В демо деньги не списываются.', '20% deposit. No money is charged in this demo.', '20 % Anzahlung. In der Demo wird nichts abgebucht.')}</p></aside></div><div class="wrap">${demoNotice}<section class="fd-section"><h2>${tr('Программа', 'Itinerary', 'Programm')}</h2><div class="fd-itinerary"><article><span class="eyebrow">${tr('День 1', 'Day 1', 'Tag 1')}</span><h3>${tr('Из Алматы в каньон', 'Almaty to the canyon', 'Von Almaty zum Canyon')}</h3><p>${tr('Встреча в 08:00 у гостиницы «Казахстан», проспект Достык, 52. Трансфер, прогулка по Долине замков, обед, ужин и гостевой дом.', 'Meet at 08:00 at Kazakhstan Hotel, 52 Dostyk Avenue. Transfer, Valley of Castles walk, lunch, dinner and guesthouse.', 'Treffen um 08:00 am Hotel Kazakhstan, Dostyk52. Transfer, Spaziergang im Tal der Schlösser, Mittag- und Abendessen, Pension.')}</p></article><article><span class="eyebrow">${tr('День 2', 'Day 2', 'Tag 2')}</span><h3>${tr('Прогулка и возвращение', 'Explore and return', 'Erkunden und zurückfahren')}</h3><p>${tr('Завтрак, короткая прогулка с учётом погоды, обед и возвращение в Алматы к 19:00. Программа демонстрационная.', 'Breakfast, a weather-dependent short walk, lunch and return to Almaty by 19:00. Illustrative itinerary.', 'Frühstück, kurzer wetterabhängiger Spaziergang, Mittagessen und Rückkehr nach Almaty bis 19:00. Beispielprogramm.')}</p></article></div></section>${terms(v)}</div></main>`;
  }
  function booking() {
    const v = F.published();
    return `<main id="main" class="checkout"><div class="checkout-wrap wrap"><a class="back-link" href="${tourURL()}">${tr('Вернуться к туру', 'Back to trip', 'Zurück zur Reise')}</a><div class="checkout-grid" id="fd-checkout-grid"><aside class="checkout-summary"><figure><img src="assets/field-charyn.webp" alt="${routeName}"></figure><p class="eyebrow">${tr('Каньон и открытое небо', 'Canyon and open sky', 'Canyon und Weite')}</p><h2>${routeName}</h2><p>${dateLabel}</p><div class="co-price" id="fd-total"></div><h3>${tr('Включено', 'Included', 'Enthalten')}</h3><ul class="co-included">${included().map(x => `<li>${x}</li>`).join('')}</ul><p class="bk-note">${tr('Демобронирование. Реальных списаний нет.', 'Demo booking. No real money is charged.', 'Demobuchung. Es wird kein echtes Geld abgebucht.')}</p></aside><section class="checkout-form"><div class="checkout-head"><p class="eyebrow">${tr('Бронирование', 'Booking', 'Buchung')}</p><h1>${tr('Ваше путешествие', 'Your trip', 'Deine Reise')}</h1><p>${tr('Проверьте выезд и сохраните условия вместе с бронью.', 'Review the departure and save your terms with the booking.', 'Prüfe den Termin und speichere die Bedingungen mit der Buchung.')}</p></div><form id="fd-booking-form" novalidate><section class="checkout-section"><span class="checkout-num">01</span><h2>${tr('Выезд и путешественники', 'Date and travellers', 'Termin und Reisende')}</h2><label class="bk-field full">${tr('Выезд', 'Departure', 'Termin')}<input value="${dateLabel} · ${money(v.departure.price)}" readonly></label><div class="bk-grid"><label class="bk-field">${tr('Путешественников', 'Travellers', 'Reisende')}<input id="fd-guests" type="number" value="1" min="1" max="${F.remaining()}" step="1"></label><label class="bk-field">${tr('Язык гида', 'Guide language', 'Guidesprache')}<input id="fd-guide" value="${guideName('en')}" readonly></label></div></section><section class="checkout-section"><span class="checkout-num">02</span><h2>${tr('Ваши данные', 'Your details', 'Deine Daten')}</h2><div class="bk-grid"><label class="bk-field">${tr('Имя', 'Name', 'Name')}<input id="fd-name" autocomplete="name" maxlength="100"></label><label class="bk-field">${tr('Электронная почта', 'Email', 'E-Mail')}<input id="fd-email" type="email" autocomplete="email" maxlength="160"></label></div></section><section class="checkout-section"><span class="checkout-num">03</span><h2>${tr('Условия и подтверждение', 'Terms and confirmation', 'Bedingungen und Bestätigung')}</h2><p>${tr('В реальном пилоте: предоплата 20%, остаток до выезда. Здесь действие только создаёт демозапись.', 'Live pilot plan: 20% deposit, balance before departure. This action only creates a demo record.', 'Im echten Pilot:20 % Anzahlung, Rest vor Abreise. Hier entsteht nur ein Demodatensatz.')}</p><label class="bk-consent"><input type="checkbox" id="fd-consent"><span>${tr('Я принимаю', 'I accept the', 'Ich akzeptiere die')} <a href="${tourURL()}#cancellation" target="_blank" rel="noopener">${tr('условия отмены', 'cancellation terms', 'Stornobedingungen')}</a> ${tr('и понимаю, что это демо.', 'and understand this is a demo.', 'und verstehe, dass dies eine Demo ist.')}</span></label><p class="bk-error" id="fd-error" role="alert"></p><button type="submit" class="button button-dark" id="fd-book">${tr('Подтвердить демобронирование', 'Confirm demo booking', 'Demobuchung bestätigen')} <span aria-hidden="true">→</span></button></section></form></section></div><div id="fd-confirmation" hidden></div></div></main>`;
  }
  const errorMessages = {
    language: ['Укажите язык гида для этого выезда.', 'Set the guide language for this departure.', 'Lege die Guidesprache für diesen Termin fest.'],
    version_changed: ['Условия обновились. Обновите страницу и примите новую версию.', 'Terms changed. Reload and accept the new version.', 'Die Bedingungen wurden geändert. Lade die Seite neu und akzeptiere die neue Version.'],
    seats: ['Укажите целое число путешественников в пределах свободных мест.', 'Enter a whole number of travellers within available places.', 'Wähle eine ganze Personenzahl innerhalb freier Plätze.'],
    contact: ['Введите имя и корректную электронную почту.', 'Enter your name and valid email.', 'Gib deinen Namen und eine gültige E-Mail ein.'],
    consent: ['Подтвердите согласие с условиями.', 'Accept the terms first.', 'Akzeptiere zuerst die Bedingungen.'],
    storage: ['Браузер не разрешает сохранить демозапись. Разрешите локальное хранилище.', 'Browser storage is blocked. Allow local storage to save the demo.', 'Der Browserspeicher ist gesperrt. Erlaube ihn für die Demo.']
  };
  const errorText = code => tr(...(errorMessages[code] || [ 'Не удалось сохранить запись.', 'Could not save the record.', 'Der Datensatz konnte nicht gespeichert werden.' ]));
  const markup = page === 'booking' && params.get('place') === 'charyn' ? booking() : page === 'tours' && params.get('place') === 'charyn' ? trip() : home();
  document.querySelector('.skip').textContent = tr('К содержимому', 'Skip to content', 'Zum Inhalt');
  document.getElementById('site').innerHTML = header + markup + footer;
  document.title = 'FLUX — ' + (page === 'booking' ? tr('Бронирование', 'Booking', 'Buchung') : routeName);
  const description=tr('Короткие туры по Казахстану: программа, полная цена и согласованные условия. Демонстрационный прототип FLUX.','Short Kazakhstan trips: itinerary, full price and agreed terms. FLUX demonstration prototype.','Kurze Reisen durch Kasachstan: Programm, Gesamtpreis und abgestimmte Bedingungen. FLUX-Demoprototyp.');
  for(const selector of ['meta[name="description"]','meta[property="og:description"]','meta[name="twitter:description"]']){const m=document.querySelector(selector);if(m)m.content=description;}
  for(const selector of ['meta[property="og:title"]','meta[name="twitter:title"]']){const m=document.querySelector(selector);if(m)m.content=document.title;}
  document.querySelectorAll('[data-final-lang]').forEach(b => b.addEventListener('click', () => { const u = new URL(location.href); u.searchParams.set('lang', b.dataset.finalLang); location.href = u.href; }));
  const q = s => document.querySelector(s);
  function showConfirmation(bookingRecord) {
    let receipt=bookingRecord;
    const R=window.FluxReceipt, panel=q('#fd-confirmation');
    panel.innerHTML=R.markup(receipt,lang);panel.hidden=false;
    q('#fd-checkout-grid')?.remove();
    document.body.classList.add('fd-confirming');
    const url=new URL(location.href);url.searchParams.set('ref',receipt.ref);history.replaceState(null,'',url);
    q('#fd-download').addEventListener('click',async()=>{
      const button=q('#fd-download'), label=button.querySelector('span'), state=q('#fd-download-status');
      const l=R.model(receipt,lang).labels;
      button.disabled=true;button.setAttribute('aria-busy','true');label.textContent=l.preparing;state.textContent='';
      try {await R.download(receipt,lang);}catch(error){state.textContent=l.retry;}
      finally {button.disabled=false;button.removeAttribute('aria-busy');label.textContent=l.download;}
    });
    q('#fd-cancel').addEventListener('click',()=>{
      try {
        receipt=F.cancel(receipt.ref);
        const r=R.model(receipt,lang);
        q('#fd-cancel-status').textContent=r.labels.cancelled;q('#fd-cancel').disabled=true;
        q('#fd-receipt-state').innerHTML='<span aria-hidden="true">✓</span>'+esc(r.state);
      } catch(error) {q('#fd-cancel-status').textContent=errorText(error.message);}
    });
    window.scrollTo({top:0,behavior:'instant'});
    q('#receipt-heading').focus({preventScroll:true});
  }
  if(page==='booking'&&params.get('place')==='charyn'&&params.get('ref')) {
    const saved=F.read().bookings.find(b=>b.ref===params.get('ref'));
    if(saved)showConfirmation(saved);
  }
  if (q('#fd-booking-form')) {
    const acceptedVersion = F.published();
    const update = () => {
      const n = Number(q('#fd-guests').value) || 1, total = n * acceptedVersion.departure.price, deposit = Math.round(total * .2);
      q('#fd-total').innerHTML = `<div><span>${n} × ${money(acceptedVersion.departure.price)}</span><strong>${money(total)}</strong></div><div class="co-total"><span>${tr('Итого', 'Total', 'Gesamt')}</span><strong>${money(total)}</strong></div><div><span>${tr('Предоплата 20%', 'Deposit 20%', 'Anzahlung 20 %')}</span><strong>${money(deposit)}</strong></div><div><span>${tr('Остаток', 'Balance', 'Rest')}</span><strong>${money(total - deposit)}</strong></div>`;
    };
    q('#fd-guests').addEventListener('input', update); update();
    q('#fd-booking-form').addEventListener('submit', e => {
      e.preventDefault();
      try {
        const b = F.book({ versionId: acceptedVersion.id, guests: Number(q('#fd-guests').value), guideLanguage: 'en', name: q('#fd-name').value, email: q('#fd-email').value, accepted: q('#fd-consent').checked });
        showConfirmation(b);
      } catch (err) { q('#fd-error').textContent = errorText(err.message); }
    });
  }
})();
