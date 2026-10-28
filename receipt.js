/* FLUX confirmation and offline PDF. Every variable term comes from the booking snapshot. */
(() => {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  const clean = value => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  function tickets(booking) {
    if (!Array.isArray(booking.passengers) || booking.passengers.length !== booking.guests) return [];
    return booking.passengers.map((p,index) => ({index,name:p.name,ticketId:p.ticketId,total:booking.total/booking.guests}));
  }
  function model(booking, language, passengerIndex) {
    const b = JSON.parse(JSON.stringify(booking));
    const people = tickets(booking), individual = passengerIndex !== undefined && passengerIndex !== null;
    const passenger = individual ? people[passengerIndex] : null;
    if (individual && (!Number.isInteger(passengerIndex) || !passenger)) throw new Error('ticket');
    if (passenger) {
      b.name=passenger.name;b.ref=passenger.ticketId;b.guests=1;b.total=passenger.total;
      b.deposit=Math.floor(booking.deposit/booking.guests)+(passengerIndex<booking.deposit%booking.guests?1:0);
      b.balance=b.total-b.deposit;
    }
    const lang = ['ru','de','en'].includes(language) ? language : 'en';
    const t = (ru, en, de) => lang === 'ru' ? ru : lang === 'de' ? de : en;
    const locale = {ru:'ru-RU',en:'en-GB',de:'de-DE'}[lang];
    const v = b.termsSnapshot, d = v.departure;
    const amount = value => new Intl.NumberFormat(locale).format(value);
    const date = new Intl.DateTimeFormat(locale,{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
    const dates = date.formatRange(new Date(d.start+'T12:00:00Z'),new Date(d.end+'T12:00:00Z'));
    const accepted = new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Almaty'}).format(new Date(b.acceptedAt));
    const labels = {
      status:t('Демобронь сохранена','Demo booking saved','Demobuchung gespeichert'),
      cancelStatus:t('Отмена запрошена','Cancellation requested','Stornierung angefragt'),
      title:t('Ваша поездка сохранена','Your trip, saved.','Deine Reise ist gespeichert.'),
      intro:people.length>1 ? t('Одна бронь, отдельный именной билет для каждого туриста.','One booking, a named ticket for every traveller.','Eine Buchung, ein persönliches Ticket pro Person.') : t('Детали поездки и принятые условия — в одном билете.','Your trip details and accepted terms, together in one ticket.','Reisedetails und akzeptierte Bedingungen in einem Ticket.'),
      trip:t('Чарын','Charyn Canyon','Charyn-Canyon'),
      from:t('Из Алматы','From Almaty','Ab Almaty'),
      duration:t('2 дня · 1 ночь','2 days · 1 night','2 Tage · 1 Nacht'),
      photo:t('Чарынский каньон','Charyn Canyon','Charyn-Canyon'),
      date:t('Даты поездки','Travel dates','Reisedaten'),
      guests:t('Путешественников','Travellers','Reisende'),
      guide:t('Язык гида','Guide language','Guidesprache'),
      guest:individual ? t('Имя и фамилия','Full name','Vor- und Nachname') : t('Первый путешественник','Lead traveller','Erste reisende Person'),
      email:t('Электронная почта','Email','E-Mail'),
      ref:individual ? t('Номер билета','Ticket number','Ticketnummer') : t('Номер брони','Booking reference','Buchungsnummer'),
      total:individual ? t('Стоимость билета','Ticket price','Ticketpreis') : t('Полная стоимость брони','Total booking price','Gesamtpreis der Buchung'),
      deposit:t('Предоплата по модели · 20%','Model deposit · 20%','Modellanzahlung · 20 %'),
      balance:t('Остаток по модели','Model balance','Modellrestbetrag'),
      charged:t('Денег списано: 0 ₸','Money charged: 0 KZT','Abgebucht: 0 KZT'),
      version:t('Версия условий','Terms version','Bedingungsversion'),
      download:people.length>1 ? t('Скачать все билеты PDF','Download all PDF tickets','Alle Tickets als PDF herunterladen') : t('Скачать билет PDF','Download PDF ticket','PDF-Ticket herunterladen'),
      people:t('Именные билеты','Your named tickets','Persönliche Tickets'),
      ticketDownload:t('Скачать билет','Download ticket','Ticket herunterladen'),
      ticket:t('Билет','Ticket','Ticket'),
      preparing:t('Готовим билет…','Preparing your ticket…','Ticket wird erstellt…'),
      retry:t('Не удалось подготовить PDF. Попробуйте скачать ещё раз. Бронь сохранена.','Could not prepare the PDF. Please try again. Your booking is saved.','Das PDF konnte nicht erstellt werden. Bitte erneut versuchen. Die Buchung bleibt gespeichert.'),
      cancel:people.length>1 ? t('Запросить отмену всей брони','Cancel the whole booking','Gesamte Buchung stornieren') : t('Запросить отмену','Request cancellation','Stornierung anfragen'),
      cancelled:t('Запрос отмены сохранён. Возврат денег не выполнялся: это демо.','Cancellation request saved. No refund was processed: this is a demo.','Stornoanfrage gespeichert. Keine Erstattung ausgeführt: Dies ist eine Demo.'),
      demo:t('Это демобронь в этом браузере. Реальная поездка не оформлена, деньги не списаны.','This is a demo booking in this browser. No real trip is reserved and no money is charged.','Dies ist eine Demobuchung in diesem Browser. Keine echte Reisebuchung und keine Abbuchung.'),
      details:t('Сохранённые условия','Your saved terms','Gespeicherte Bedingungen'),
      included:t('Включено в стоимость','Included in the price','Im Preis enthalten'),
      excluded:t('Не включено','Not included','Nicht enthalten'),
      extras:t('Личные покупки и напитки вне программы. Обязательных доплат по программе нет.','Personal purchases and drinks outside the itinerary. No mandatory itinerary extras.','Persönliche Einkäufe und Getränke außerhalb des Programms. Keine verpflichtenden Programmzuschläge.'),
      cancellation:t('Правила отмены','Cancellation terms','Stornobedingungen'),
      accepted:t('Условия приняты','Terms accepted','Bedingungen akzeptiert'),
      termsIntro:t('Эта версия сохранена вместе с вашей демобронью. Поздние изменения предложения не меняют этот документ.','This version was saved with your demo booking. Later offer changes do not change this document.','Diese Version wurde mit deiner Demobuchung gespeichert. Spätere Angebotsänderungen ändern dieses Dokument nicht.'),
      termsFooter:t('Демонстрационный документ FLUX. Не платёжный чек и не реальный проездной билет.','FLUX demonstration document. Not a payment receipt or a real travel ticket.','FLUX-Demodokument. Kein Zahlungsbeleg und kein echtes Reiseticket.'),
      departure:t('Город отправления','Departure city','Abfahrtsort'),
    };
    const inclusions = [
      d.transfer === 'included' && t('Трансфер из Алматы и обратно','Return transfer from Almaty','Hin- und Rücktransfer ab Almaty'),
      d.accommodation === 'included' && t('Одна ночь в гостевом доме','One night in a guesthouse','Eine Nacht in einer Pension'),
      b.guideLanguage==='en' ? t('Англоязычный гид','English-speaking guide','Englischsprachiger Guide') : t('Гид на языке брони','Guide in the booked language','Guide in der gebuchten Sprache'),
      d.park === 'included' && t('Вход в национальный парк','National park entry','Nationalparkeintritt'),
      d.meals === 'included' && t('Два обеда, ужин и завтрак','Two lunches, dinner and breakfast','Zwei Mittagessen, Abendessen und Frühstück'),
    ].filter(Boolean);
    const cancellation = t(
      `Отмена не позднее чем за ${d.cancelHours} часов до выезда: возврат предоплаты целиком. Позже предоплата не возвращается. Если выезд отменяет оператор, предоплата возвращается целиком. Запрос отмены ещё не означает выполненный возврат. В демо денег не списывают. Условия реального пилота должен утвердить оператор.`,
      `Cancel at least ${d.cancelHours} hours before departure for a full deposit refund. Later cancellations forfeit the deposit. If the operator cancels, the deposit is refunded in full. A cancellation request is not a completed refund. No money is charged in this demo. A real operator must approve the live policy.`,
      `Bei Stornierung mindestens ${d.cancelHours} Stunden vor Abreise wird die Anzahlung vollständig erstattet. Danach verfällt sie. Sagt der Veranstalter ab, wird die Anzahlung vollständig erstattet. Eine Stornoanfrage ist noch keine Erstattung. In dieser Demo wird nichts abgebucht. Echte Bedingungen muss der Veranstalter freigeben.`);
    return {b,lang,labels,individual,passengerIndex,bookingRef:booking.ref,partySize:booking.guests,tickets:people,amount,money:n=>amount(n)+' ₸',pdfMoney:n=>amount(n)+' ₸',dates,accepted,inclusions,cancellation,
      guide:b.guideLanguage === 'de' ? t('Немецкий','German','Deutsch') : t('Английский','English','Englisch'),
      city:d.meeting === 'Almaty' ? t('Алматы','Almaty','Almaty') : clean(d.meeting),
      state:b.status === 'cancel_requested' ? labels.cancelStatus : labels.status};
  }

  function markup(booking,lang) {
    const r=model(booking,lang),{b,labels:l}=r;
    const field=(label,value)=>`<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`;
    return `<section class="fd-receipt" aria-labelledby="receipt-heading">
      <div class="fd-receipt-intro"><div><p class="fd-saved-state" id="fd-receipt-state"><span aria-hidden="true">✓</span>${escape(r.state)}</p><h1 id="receipt-heading" tabindex="-1">${escape(l.title)}</h1><p class="fd-receipt-lead">${escape(l.intro)}</p></div><span class="fd-demo-pill">${escape(l.charged)}</span></div>
      <article class="fd-trip-pass"><figure class="fd-pass-photo"><img src="assets/field-charyn.webp" alt="${escape(l.photo)}"><figcaption><span>${escape(l.from)}</span><strong>${escape(l.trip)}</strong><span>${escape(l.duration)}</span></figcaption></figure>
      <div class="fd-pass-paper"><div class="fd-pass-top"><span>FLUX / ${escape(l.ref)}</span><strong>${escape(b.ref)}</strong></div><h2>${escape(l.trip)}</h2><dl class="fd-pass-fields">${field(l.date,r.dates)}${field(l.guests,b.guests)}${field(l.guide,r.guide)}${field(l.guest,b.name)}</dl><div class="fd-pass-total"><span>${escape(l.total)}</span><strong>${escape(r.money(b.total))}</strong></div><dl class="fd-pass-payment">${field(l.deposit,r.money(b.deposit))}${field(l.balance,r.money(b.balance))}</dl><div class="fd-pass-version"><span>${escape(l.version)} ${escape(b.termsSnapshot.number)}</span><span>${escape(l.duration)}</span></div></div></article>
      ${r.tickets.length>1 ? `<section class="fd-ticket-list" aria-labelledby="fd-tickets-title"><h2 id="fd-tickets-title">${escape(l.people)}</h2><div>${r.tickets.map(p=>`<article class="fd-person-ticket"><span class="fd-ticket-number">${String(p.index+1).padStart(2,'0')}</span><div><h3>${escape(p.name)}</h3><p>${escape(p.ticketId)} · ${escape(r.money(p.total))}</p></div><button type="button" class="fd-person-download" data-ticket-download="${p.index}" aria-label="${escape(l.ticketDownload+': '+p.name)}"><span>${escape(l.ticketDownload)}</span><span aria-hidden="true">↓</span></button></article>`).join('')}</div></section>` : ''}
      <div class="fd-receipt-actions"><div><button id="fd-download" class="button fd-download-ticket" type="button"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M5 17v4h14v-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg><span>${escape(l.download)}</span></button><p class="fd-download-status" id="fd-download-status" role="status" aria-live="polite"></p></div><button id="fd-cancel" class="fd-text-button" type="button" ${b.status==='cancel_requested'?'disabled':''}>${escape(l.cancel)}</button></div><p id="fd-cancel-status" class="fd-cancel-result" role="status">${b.status==='cancel_requested'?escape(l.cancelled):''}</p>
      <p class="fd-receipt-demo">${escape(l.demo)}</p>
      <details class="fd-saved-terms"><summary>${escape(l.details)}<span aria-hidden="true">+</span></summary><div class="fd-saved-grid"><div><h3>${escape(l.included)}</h3><ul>${r.inclusions.map(x=>`<li>${escape(x)}</li>`).join('')}</ul><h3>${escape(l.excluded)}</h3><p>${escape(l.extras)}</p></div><div><h3>${escape(l.cancellation)}</h3><p>${escape(r.cancellation)}</p><p class="fd-snapshot-id">${escape(b.termsVersionId)}<br>${escape(l.accepted)}: ${escape(r.accepted)} (Almaty)</p></div></div></details>
    </section>`;
  }

  let sdkPromise, assetPromise;
  function loadSDK() {
    if(window.jspdf?.jsPDF)return Promise.resolve(window.jspdf.jsPDF);
    if(!sdkPromise)sdkPromise=new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src='vendor/jspdf.umd.min.js';script.async=true;
      script.onload=()=>window.jspdf?.jsPDF?resolve(window.jspdf.jsPDF):reject(new Error('pdf_sdk'));
      script.onerror=()=>{script.remove();reject(new Error('pdf_sdk'));};document.head.append(script);
    }).catch(e=>{sdkPromise=null;throw e;});
    return sdkPromise;
  }
  async function fileBase64(path) {
    const response=await fetch(path);if(!response.ok)throw new Error('pdf_asset');
    const data=new Uint8Array(await response.arrayBuffer());let binary='';
    for(let i=0;i<data.length;i+=32768)binary+=String.fromCharCode(...data.subarray(i,i+32768));
    return btoa(binary);
  }
  function picture(path,width,height,format='image/jpeg') {
    return new Promise((resolve,reject)=>{
      const img=new Image();img.onload=()=>{
        try {const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');
          const ratio=Math.max(width/img.width,height/img.height),sw=width/ratio,sh=height/ratio;
          ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.drawImage(img,(img.width-sw)/2,(img.height-sh)/2,sw,sh,0,0,width,height);
          resolve(canvas.toDataURL(format,.92));}catch(e){reject(e);}
      };img.onerror=()=>reject(new Error('pdf_image'));img.src=path;
    });
  }
  function assets() {
    if(!assetPromise)assetPromise=Promise.all([
      fileBase64('fonts/source-sans3-regular.ttf'),fileBase64('fonts/source-sans3-semibold.ttf'),
      fileBase64('fonts/source-serif4-semibold.ttf'),picture('assets/field-charyn.webp',900,1395),
      picture('assets/logo-flux.png',175,159,'image/png'),
    ]).catch(e=>{assetPromise=null;throw e;});
    return assetPromise;
  }
  async function pdf(booking,lang,passengerIndex) {
    const r=model(booking,lang),{b,labels:l}=r;
    const [PDF,files]=await Promise.all([loadSDK(),assets()]);
    const doc=new PDF({unit:'pt',format:'a4',orientation:'landscape',compress:true,putOnlyUsedFonts:true});
    const names=[['source-sans3-regular.ttf','FluxSans','normal'],['source-sans3-semibold.ttf','FluxSans','bold'],['source-serif4-semibold.ttf','FluxSerif','normal']];
    names.forEach(([file,font,weight],i)=>{doc.addFileToVFS(file,files[i]);doc.addFont(file,font,weight);});
    doc.setLanguage(r.lang);doc.setProperties({title:'FLUX / '+b.ref,subject:r.state,author:'FLUX / Saryarqa Routes'});
    const ink='#202B25',muted='#70766B',coral='#EE795B',paper='#FFFDF8',outer='#EEE9DF',line='#DADDD3';
    const width=doc.internal.pageSize.getWidth(),height=doc.internal.pageSize.getHeight();
    const tr=(ru,en,de)=>r.lang==='ru'?ru:r.lang==='de'?de:en;
    function text(value,x,y,size=11,color=ink,font='FluxSans',weight='normal',options={}) {
      doc.setFont(font,weight);doc.setFontSize(size);doc.setTextColor(color);doc.text(clean(value),x,y,options);
    }
    function para(value,x,y,maxWidth,size=11,color=ink,font='FluxSans',weight='normal',factor=1.35) {
      doc.setFont(font,weight);doc.setFontSize(size);doc.setTextColor(color);
      const rows=doc.splitTextToSize(clean(value),maxWidth);
      doc.text(rows,x,y,{lineHeightFactor:factor});return y+rows.length*size*factor;
    }
    function rect(x,y,w,h,color,radius=0) {doc.setFillColor(color);if(radius)doc.roundedRect(x,y,w,h,radius,radius,'F');else doc.rect(x,y,w,h,'F');}
    function rule(x1,y1,x2,y2,color=line,dash=[]) {doc.setDrawColor(color);doc.setLineWidth(.65);doc.setLineDashPattern(dash,0);doc.line(x1,y1,x2,y2);doc.setLineDashPattern([],0);}
    function field(label,value,x,y,w,size=12) {text(label,x,y,9,muted);return para(value,x,y+19,w,size);}
    function background(){rect(0,0,width,height,outer);}
    function brand(x,y) {doc.addImage(files[4],'PNG',x,y-25,30,27);text('FLUX',x+40,y,21,ink,'FluxSans','bold');}
    const people=tickets(booking);
    const indexes=passengerIndex!==undefined ? [passengerIndex] : people.length ? people.map(p=>p.index) : [undefined];
    for (let ticketNumber=0;ticketNumber<indexes.length;ticketNumber++) {
    if(ticketNumber)doc.addPage('a4','landscape');
    const r=model(booking,lang,indexes[ticketNumber]),{b,labels:l}=r;
    const x=28,y=34,w=width-56,h=height-115,photoW=240,stubW=142;
    const contentX=x+photoW,stubX=x+w-stubW,pad=24,cx=contentX+pad,cw=stubX-cx-pad;
    background();
    // The ticket silhouette and three materials: canyon, warm paper, dark tear-off stub.
    rect(x+2,y+4,w,h,'#E3DED4',16);rect(x,y,w,h,paper,16);
    doc.saveGraphicsState();doc.roundedRect(x,y,w,h,16,16,null);doc.clip();doc.discardPath();
    doc.addImage(files[3],'JPEG',x,y,photoW,h-108);
    rect(x,y+h-108,photoW,108,ink);
    rect(stubX,y,stubW,h,ink);
    doc.restoreGraphicsState();
    text(tr('КАЗАХСТАН','KAZAKHSTAN','KASACHSTAN'),x+22,y+h-79,9,'#CAD1C5','FluxSans','bold');
    text(l.from,x+22,y+h-43,25,paper,'FluxSerif');
    text(l.duration,x+22,y+h-22,11,'#D4DACA');
    // Actual project logo; no invented verification marks or decorative QR codes.
    brand(cx,79);
    rect(stubX-120,60,96,23,'#FBE8DE',12);
    text(tr('ДЕМО-БИЛЕТ','DEMO TICKET','DEMO-TICKET'),stubX-72,75,9,'#A74C36','FluxSans','bold',{align:'center'});
    text(tr('БИЛЕТ НА ПОЕЗДКУ','TRAVEL PASS','REISETICKET'),cx,111,9,muted,'FluxSans','bold');
    text(l.trip,cx,149,34,ink,'FluxSerif');
    text(l.guest,cx,177,9,muted);
    const nameEnd=para(b.name,cx,198,cw,13,ink,'FluxSans','bold',1.25);
    if(nameEnd>265)throw new Error('pdf_layout');
    const half=(cw-24)/2;
    field(l.date,r.dates,cx,271,half,12);
    field(l.guide,r.guide,cx+half+24,271,half,12);
    rule(cx,329,stubX-pad,329);
    text(l.total,cx,352,10,muted);
    text(r.pdfMoney(b.total),cx,392,32,ink,'FluxSans','bold');
    field(l.deposit,r.pdfMoney(b.deposit),cx,420,half,13);
    field(l.balance,r.pdfMoney(b.balance),cx+half+24,420,half,13);
    text(l.charged,cx,481,10,'#4E6650','FluxSans','bold');
    // A useful stub: reference, travel days, passenger count and accepted version.
    const mid=stubX+stubW/2,locale={ru:'ru-RU',en:'en-GB',de:'de-DE'}[r.lang];
    const start=new Date(b.termsSnapshot.departure.start+'T12:00:00Z');
    const end=new Date(b.termsSnapshot.departure.end+'T12:00:00Z');
    text(l.ref,mid,69,8.5,'#CDD5C8','FluxSans','normal',{align:'center'});
    text(b.ref,mid,94,16,paper,'FluxSans','bold',{align:'center'});
    rule(stubX+18,115,x+w-18,115,'#526052');
    text(l.date,mid,144,8.5,'#CDD5C8','FluxSans','normal',{align:'center'});
    text(String(start.getUTCDate()).padStart(2,'0')+' / '+String(end.getUTCDate()).padStart(2,'0'),mid,181,29,paper,'FluxSerif','normal',{align:'center'});
    text(new Intl.DateTimeFormat(locale,{month:'short',year:'numeric',timeZone:'UTC'}).format(start),mid,204,10,'#D6DDCF','FluxSans','normal',{align:'center'});
    text(r.individual?l.ticket:l.guests,mid,254,8.5,'#CDD5C8','FluxSans','normal',{align:'center'});
    doc.setDrawColor('#6E7A68');doc.setLineWidth(.7);doc.circle(mid,297,31,'S');
    text(r.individual?r.passengerIndex+1:b.guests,mid,309,35,paper,'FluxSans','bold',{align:'center'});
    if(r.individual)text(tr('из ','of ','von ')+r.partySize,mid,341,10,'#D6DDCF','FluxSans','normal',{align:'center'});
    rule(stubX+18,355,x+w-18,355,'#526052');
    text(l.version,mid,388,8.5,'#CDD5C8','FluxSans','normal',{align:'center'});
    text('V.'+String(b.termsSnapshot.number).padStart(2,'0'),mid,424,26,paper,'FluxSerif','normal',{align:'center'});
    text('FLUX / '+tr('ЧАРЫН','CHARYN','CHARYN'),mid,479,8.5,'#CDD5C8','FluxSans','bold',{align:'center'});
    rule(stubX,y+13,stubX,y+h-13,'#9FA796',[2.5,4]);
    doc.setFillColor(outer);doc.circle(stubX,y,11,'F');doc.circle(stubX,y+h,11,'F');
    const bookingNote=r.individual?tr('Бронь ','Booking ','Buchung ')+r.bookingRef+' · ':'';
    const foot=para(bookingNote+r.state+'. '+l.demo,28,y+h+26,width-56,10,muted);
    if(foot>height-22)throw new Error('pdf_layout');
    text('01 / 02',width-28,height-16,8.5,muted,'FluxSans','normal',{align:'right'});

    // Matching landscape reverse: readable two-column terms and a separate contact strip.
    doc.addPage('a4','landscape');background();
    rect(28,28,width-56,height-71,paper,16);
    brand(50,69);text(b.ref,width-50,65,11,muted,'FluxSans','bold',{align:'right'});
    text(l.details,50,119,30,ink,'FluxSerif');
    const introEnd=para(l.termsIntro,50,143,width-100,11,muted);
    if(introEnd>180)throw new Error('pdf_layout');
    const colW=(width-126)/2,rx=50+colW+26;
    text(l.included,50,201,14,ink,'FluxSans','bold');
    let ly=226;
    for(const item of r.inclusions) {doc.setFillColor(coral);doc.circle(53,ly-4,2,'F');ly=para(item,65,ly,colW-15,11)+7;}
    ly+=12;text(l.excluded,50,ly,14,ink,'FluxSans','bold');
    ly=para(l.extras,50,ly+23,colW,11);
    text(l.cancellation,rx,201,14,ink,'FluxSans','bold');
    let ry=para(r.cancellation,rx,226,colW,11);
    ry+=18;text(l.version+' '+b.termsSnapshot.number,rx,ry,10,muted,'FluxSans','bold');
    ry=para(b.termsVersionId,rx,ry+17,colW,10,muted)+10;
    ry=para(l.termsFooter,rx,ry,colW,9.5,muted);
    const stripY=Math.max(435,ly+16,ry+16);
    if(stripY>448)throw new Error('pdf_layout');
    rect(50,stripY,width-100,85,'#F0EEE4',9);
    field(l.guest,b.name,64,stripY+18,colW-24,10.5);
    const emailEnd=field(l.email,b.email,rx+12,stripY+18,colW-24,10.5);
    if(emailEnd>stripY+82)throw new Error('pdf_layout');
    para(l.accepted+': '+r.accepted+' (Almaty)',28,height-31,width-120,9,muted);
    text('02 / 02',width-28,height-16,8.5,muted,'FluxSans','normal',{align:'right'});
    }
    return doc.output('blob');
  }
  async function download(booking,lang,passengerIndex) {
    const blob=await pdf(booking,lang,passengerIndex);
    const ref=passengerIndex===undefined?booking.ref:model(booking,lang,passengerIndex).b.ref;
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=ref+'-FLUX.pdf';
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
    return blob;
  }
  window.FluxReceipt={model,markup,pdf,download,tickets};
})();
