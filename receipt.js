/* FLUX confirmation and offline PDF. Every variable term comes from the booking snapshot. */
(() => {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  const clean = value => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  function model(booking, language) {
    const b = JSON.parse(JSON.stringify(booking));
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
      intro:t('Детали поездки и принятые условия — в одном билете.','Your trip details and accepted terms, together in one ticket.','Reisedetails und akzeptierte Bedingungen in einem Ticket.'),
      trip:t('Чарын','Charyn Canyon','Charyn-Canyon'),
      from:t('Из Алматы','From Almaty','Ab Almaty'),
      duration:t('2 дня · 1 ночь','2 days · 1 night','2 Tage · 1 Nacht'),
      photo:t('Чарынский каньон','Charyn Canyon','Charyn-Canyon'),
      date:t('Даты поездки','Travel dates','Reisedaten'),
      guests:t('Путешественников','Travellers','Reisende'),
      guide:t('Язык гида','Guide language','Guidesprache'),
      guest:t('На имя','Lead traveller','Gebucht für'),
      email:t('Электронная почта','Email','E-Mail'),
      ref:t('Номер брони','Booking reference','Buchungsnummer'),
      total:t('Полная стоимость','Total trip price','Gesamtpreis'),
      deposit:t('Предоплата по модели · 20%','Model deposit · 20%','Modellanzahlung · 20 %'),
      balance:t('Остаток по модели','Model balance','Modellrestbetrag'),
      charged:t('Денег списано: 0 ₸','Money charged: 0 KZT','Abgebucht: 0 KZT'),
      version:t('Версия условий','Terms version','Bedingungsversion'),
      download:t('Скачать билет PDF','Download PDF ticket','PDF-Ticket herunterladen'),
      preparing:t('Готовим билет…','Preparing your ticket…','Ticket wird erstellt…'),
      retry:t('Не удалось подготовить PDF. Попробуйте скачать ещё раз. Бронь сохранена.','Could not prepare the PDF. Please try again. Your booking is saved.','Das PDF konnte nicht erstellt werden. Bitte erneut versuchen. Die Buchung bleibt gespeichert.'),
      cancel:t('Запросить отмену','Request cancellation','Stornierung anfragen'),
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
      t('Гид на выбранном языке','Guide in your selected language','Guide in der gewählten Sprache'),
      d.park === 'included' && t('Вход в национальный парк','National park entry','Nationalparkeintritt'),
      d.meals === 'included' && t('Два обеда, ужин и завтрак','Two lunches, dinner and breakfast','Zwei Mittagessen, Abendessen und Frühstück'),
    ].filter(Boolean);
    const cancellation = t(
      `Отмена не позднее чем за ${d.cancelHours} часов до выезда: возврат предоплаты целиком. Позже предоплата не возвращается. Если выезд отменяет оператор, предоплата возвращается целиком. Запрос отмены ещё не означает выполненный возврат. В демо денег не списывают. Условия реального пилота должен утвердить оператор.`,
      `Cancel at least ${d.cancelHours} hours before departure for a full deposit refund. Later cancellations forfeit the deposit. If the operator cancels, the deposit is refunded in full. A cancellation request is not a completed refund. No money is charged in this demo. A real operator must approve the live policy.`,
      `Bei Stornierung mindestens ${d.cancelHours} Stunden vor Abreise wird die Anzahlung vollständig erstattet. Danach verfällt sie. Sagt der Veranstalter ab, wird die Anzahlung vollständig erstattet. Eine Stornoanfrage ist noch keine Erstattung. In dieser Demo wird nichts abgebucht. Echte Bedingungen muss der Veranstalter freigeben.`);
    return {b,lang,labels,amount,money:n=>amount(n)+' ₸',pdfMoney:n=>amount(n)+' ₸',dates,accepted,inclusions,cancellation,
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
      fileBase64('fonts/source-serif4-semibold.ttf'),picture('assets/field-charyn.webp',1400,490),
      picture('assets/logo-flux.png',175,159,'image/png'),
    ]).catch(e=>{assetPromise=null;throw e;});
    return assetPromise;
  }
  async function pdf(booking,lang) {
    const r=model(booking,lang),{b,labels:l}=r;
    const [PDF,files]=await Promise.all([loadSDK(),assets()]);
    const doc=new PDF({unit:'pt',format:'a4',compress:true,putOnlyUsedFonts:true});
    const names=[['source-sans3-regular.ttf','FluxSans','normal'],['source-sans3-semibold.ttf','FluxSans','bold'],['source-serif4-semibold.ttf','FluxSerif','normal']];
    names.forEach(([file,font,weight],i)=>{doc.addFileToVFS(file,files[i]);doc.addFont(file,font,weight);});
    doc.setLanguage(r.lang);doc.setProperties({title:'FLUX / '+b.ref,subject:r.state,author:'FLUX / Saryarqa Routes'});
    const ink='#20251F',muted='#687065',coral='#EC7658',cream='#F5F0E6',white='#FFFFFF',line='#DBDFD5';
    const width=doc.internal.pageSize.getWidth(),height=doc.internal.pageSize.getHeight(),left=40,span=width-80;
    function text(value,x,y,size=11,color=ink,font='FluxSans',weight='normal',options={}) {
      doc.setFont(font,weight);doc.setFontSize(size);doc.setTextColor(color);doc.text(clean(value),x,y,options);
    }
    function para(value,x,y,maxWidth,size=11,color=ink,font='FluxSans',weight='normal') {
      doc.setFont(font,weight);doc.setFontSize(size);doc.setTextColor(color);
      const rows=doc.splitTextToSize(clean(value),maxWidth);
      doc.text(rows,x,y,{lineHeightFactor:1.4});return y+rows.length*size*1.4;
    }
    function rect(x,y,w,h,color,radius=0) {doc.setFillColor(color);if(radius)doc.roundedRect(x,y,w,h,radius,radius,'F');else doc.rect(x,y,w,h,'F');}
    function header() {
      rect(0,0,width,height,white);doc.addImage(files[4],'PNG',left,26,35,32);
      text('FLUX',left+46,51,23,ink,'FluxSans','bold');text(b.ref,width-left,48,11,muted,'FluxSans','bold',{align:'right'});
    }
    function footer(n) {
      doc.setDrawColor(line);doc.setLineWidth(.6);doc.line(left,height-57,width-left,height-57);
      text('FLUX / '+b.ref,left,height-37,9,muted);text(n+' / 2',width-left,height-37,9,muted,'FluxSans','normal',{align:'right'});
    }
    function field(label,value,x,y,w) {text(label,x,y,9,muted,'FluxSans','bold');return para(value,x,y+19,w,12);}
    header();text(r.state,left,88,10,muted,'FluxSans','bold');
    doc.addImage(files[3],'JPEG',left,108,span,170);
    text(l.trip,left+16,317,29,ink,'FluxSerif');text(l.duration,width-left-16,315,11,muted,'FluxSans','normal',{align:'right'});
    let y=para(l.guest+': '+b.name,left+16,340,span-32,12);
    y+=16;
    const third=(span-48)/3;
    const end=Math.max(field(l.date,r.dates,left+16,y,third),field(l.guests,b.guests,left+16+third+8,y,third-8),field(l.guide,r.guide,left+16+2*(third+8),y,third-8));
    y=end+20;
    rect(left,y,span,112,ink,12);
    text(l.total,left+16,y+24,10,cream);text(r.pdfMoney(b.total),left+16,y+61,31,white,'FluxSans','bold');
    text(l.charged,left+16,y+91,11,cream);
    text(l.deposit,left+span/2+20,y+26,9,cream);text(r.pdfMoney(b.deposit),left+span/2+20,y+48,15,white,'FluxSans','bold');
    text(l.balance,left+span/2+20,y+76,9,cream);text(r.pdfMoney(b.balance),left+span/2+20,y+98,15,white,'FluxSans','bold');
    y+=132;
    field(l.departure,r.city,left+16,y,span/2-30);field(l.version,String(b.termsSnapshot.number),left+span/2+20,y,span/2-30);
    y+=59;
    const noticeHeight=Math.max(54,doc.splitTextToSize(l.demo,span-32).length*16+24);
    rect(left,y,span,noticeHeight,cream,9);para(l.demo,left+16,y+22,span-32,11);
    y+=noticeHeight+20;
    para(l.accepted+': '+r.accepted+' (Almaty)',left+16,y,span-32,10,muted);
    if(y+25>height-70)throw new Error('pdf_layout');
    footer(1);

    doc.addPage();header();
    text(l.details,left,108,28,ink,'FluxSerif');
    y=para(l.termsIntro,left,133,span,11,muted)+20;
    rect(left,y-12,span,53,cream,8);
    text(l.version+' '+b.termsSnapshot.number,left+14,y+6,11,ink,'FluxSans','bold');
    text(b.termsVersionId,left+14,y+25,10,muted);
    y+=70;
    text(l.included,left,y,15,ink,'FluxSans','bold');y+=25;
    for(const item of r.inclusions){doc.setFillColor(coral);doc.circle(left+3,y-4,2,'F');y=para(item,left+16,y,span-16,12)+7;}
    y+=9;text(l.excluded,left,y,15,ink,'FluxSans','bold');y=para(l.extras,left,y+23,span,12)+20;
    text(l.cancellation,left,y,15,ink,'FluxSans','bold');y=para(r.cancellation,left,y+23,span,12)+21;
    text(l.guest,left,y,10,muted,'FluxSans','bold');y=para(b.name,left,y+18,span,11)+9;
    text(l.email,left,y,10,muted,'FluxSans','bold');y=para(b.email,left,y+18,span,11)+17;
    y=para(l.termsFooter,left,y,span,10,muted);
    if(y>height-70)throw new Error('pdf_layout');
    footer(2);return doc.output('blob');
  }
  async function download(booking,lang) {
    const blob=await pdf(booking,lang);
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=booking.ref+'-FLUX.pdf';
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
    return blob;
  }
  window.FluxReceipt={model,markup,pdf,download};
})();
