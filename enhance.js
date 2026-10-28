/* ============================================================
   FLUX — enhancement layer (progressive, optional)
   Runs after site.js. Adds kinetic type, parallax,
   magnetic buttons, self-drawing map, counters, film grain.
   ============================================================ */
(() => {
if(window.FluxDemo?.owned) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine   = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const raf    = requestAnimationFrame;

  /* ---------- kinetic headline: split into word masks ---------- */
  function splitWords(h, step){
    if(h.dataset.split) return;
    h.dataset.split = '1';
    const nodes = Array.from(h.childNodes);
    h.textContent = '';
    let i = 0;
    nodes.forEach(n => {
      if(n.nodeName === 'BR'){ h.append(document.createTextNode(' ')); h.append(n); return; }
      const txt = n.textContent || '';
      txt.split(/(\s+)/).forEach(tok => {
        if(!tok) return;
        if(!tok.trim()){ h.append(document.createTextNode(tok)); return; }
        const box = document.createElement('span'); box.className = 'word';
        const inner = document.createElement('span');
        inner.textContent = tok;
        inner.style.transitionDelay = (i * (step||80)) + 'ms';
        i++;
        box.append(inner); h.append(box);
      });
    });
  }
  function kinetic(){
    document.querySelectorAll('.hero h1,.catalog-intro h1,.journal h1,.detail-heading h1')
      .forEach(h => splitWords(h, 80));
    raf(() => raf(() => document.body.classList.add('is-loaded')));
  }

  /* ---------- magnetic buttons ---------- */
  function magnetic(){
    if(!fine || reduce) return;
    document.querySelectorAll('.button').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width/2) * 0.26;
        const y = (e.clientY - r.top - r.height/2) * 0.36;
        b.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
      b.addEventListener('pointerdown', () => { b.style.transitionDuration = '.12s'; b.style.transform += ' scale(.96)'; });
      b.addEventListener('pointerup',   () => { b.style.transitionDuration = ''; });
    });
  }

  /* ---------- scroll: progress bar, hero parallax, header ---------- */
  function scrollFx(){
    const bar = document.createElement('div');
    bar.className = 'scroll-progress'; bar.setAttribute('aria-hidden','true');
    document.body.prepend(bar);

    const photo  = document.querySelector('.hero-photo');
    const copy   = document.querySelector('.hero-copy');
    const loc    = document.querySelector('.hero-location');
    const header = document.querySelector('.header');
    const inter  = document.querySelector('.interlude-img');

    let ticking = false;
    let lastY = scrollY || 0;
    const upd = () => {
      const y = scrollY || document.documentElement.scrollTop;
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(y/max,1) : 0})`;

      if(!reduce && photo){
        const hero = photo.closest('.hero');
        const hh = hero ? hero.offsetHeight : 680;
        const p  = Math.min(y / hh, 1);
        photo.style.setProperty('--par', (p * 72).toFixed(1) + 'px');
        photo.style.setProperty('--zoom', (1.1 + p * 0.13).toFixed(3));
        if(copy){
          copy.style.transform = `translateY(calc(-50% + ${(p*95).toFixed(1)}px))`;
          copy.style.opacity = String(Math.max(0, 1 - p*1.35));
        }
        if(loc) loc.style.opacity = String(Math.max(0, 1 - p*1.7));
      }
      if(!reduce && inter){
        const box = inter.parentElement.getBoundingClientRect();
        if(box.bottom > 0 && box.top < innerHeight){
          const ip = (innerHeight - box.top) / (innerHeight + box.height);
          inter.style.setProperty('--ipar', ((ip - .5) * 64).toFixed(1) + 'px');
        }
      }
      if(header){
        header.classList.toggle('is-scrolled', y > 10);
        const menuOpen = document.querySelector('#mobile-menu:not([hidden])');
        const dy = y - lastY;
        if(menuOpen || y < 80) header.classList.remove('is-hidden');
        else if(dy > 6) header.classList.add('is-hidden');
        else if(dy < -6) header.classList.remove('is-hidden');
      }
      lastY = y;
      ticking = false;
    };
    addEventListener('scroll', () => { if(!ticking){ ticking = true; raf(upd); } }, {passive:true});
    upd();
  }

  /* ---------- hero scroll cue ---------- */
  function heroCue(){
    const hero = document.querySelector('.hero');
    if(!hero || hero.querySelector('.scroll-cue')) return;
    const cue = document.createElement('div');
    cue.className = 'scroll-cue'; cue.setAttribute('aria-hidden','true');
    cue.append(document.createElement('span'));
    hero.append(cue);
  }

  /* ---------- self-drawing map + staged pin reveal ---------- */
  function mapDraw(){
    const sec  = document.querySelector('.map-section');
    if(!sec) return;
    const svg  = document.querySelector('.kz-map');
    const land = document.querySelector('.kz-land');
    if(!svg || !land){
      if(reduce || !('IntersectionObserver' in window)){ sec.classList.add('is-drawn'); return; }
      const io = new IntersectionObserver(es => {
        es.forEach(e => { if(e.isIntersecting){ sec.classList.add('is-drawn'); io.disconnect(); } });
      }, {threshold:0.2});
      io.observe(sec);
      return;
    }
    if(reduce){ sec.classList.add('is-drawn'); return; }

    const pts = land.getAttribute('points').trim().split(' ').map(p => p.split(',').map(Number));
    let len = 0;
    for(let i = 0; i < pts.length; i++){
      const a = pts[i], b = pts[(i+1) % pts.length];
      len += Math.hypot(b[0]-a[0], b[1]-a[1]);
    }
    land.style.setProperty('--len', Math.ceil(len));

    Array.from(svg.querySelectorAll('.pin')).forEach((p,i) => p.style.transitionDelay = (1.35 + i*0.13) + 's');
    Array.from(svg.querySelectorAll('.kz-water')).forEach((w,i) => w.style.transitionDelay = (1.5 + i*0.1) + 's');
    Array.from(svg.querySelectorAll('.kz-city')).forEach((c,i) => c.style.transitionDelay = (2.0 + i*0.1) + 's');
    Array.from(document.querySelectorAll('.map-legend .legend-item')).forEach((li,i) => li.style.transitionDelay = (1.6 + i*0.09) + 's');

    if(!('IntersectionObserver' in window)){ sec.classList.add('is-drawn'); return; }
    const io = new IntersectionObserver(es => {
      es.forEach(e => { if(e.isIntersecting){ sec.classList.add('is-drawn'); io.disconnect(); } });
    }, {threshold:0.2});
    io.observe(sec);
  }

  /* ---------- map: photo preview on hover/focus ---------- */
  function mapPreview(){
    const frame = document.querySelector('.map-frame');
    const box = frame && frame.querySelector('.map-preview');
    if(!box) return;
    const img = box.querySelector('.map-preview-img');
    const name = box.querySelector('strong');
    const meta = box.querySelector('span');
    const items = frame.querySelectorAll('[data-photo]');
    if(!img || !items.length) return;

    const show = item => {
      img.style.backgroundImage = 'url("' + item.dataset.photo + '")';
      name.textContent = item.dataset.name || '';
      meta.textContent = item.dataset.meta || '';
      box.classList.add('on');
    };
    const hide = () => box.classList.remove('on');
    const onOver = e => {
      const item = e.target.closest('[data-photo]');
      if(item) show(item);
    };

    frame.addEventListener('pointerover', onOver);
    frame.addEventListener('focusin', onOver);
    frame.addEventListener('pointerleave', hide);
    frame.addEventListener('focusout', e => {
      if(!frame.contains(e.relatedTarget)) hide();
    });
  }

  /* ---------- immersive band: marquee + counters ---------- */
  function band(){
    const strip = document.querySelector('.fact-strip');
    if(!strip || document.querySelector('.wow-band')) return;

    const language=document.documentElement.lang;
    const words=language==='ru'?['Кольсай','Чарын','Бурабай','Туркестан','Алтын-Эмель','Балхаш','Астана','Алматы']:['Kolsai','Charyn','Burabay','Turkestan','Altyn-Emel','Balkhash','Astana','Almaty'];
    const label=(ru,de,en)=>language==='ru'?ru:language==='de'?de:en;
    const one = words.map(w => `<span>${w}</span><i></i>`).join('');

    const el = document.createElement('section');
    el.className = 'wow-band';
    el.innerHTML =
      `<div class="wow-marquee" aria-hidden="true">` +
        `<div class="wow-marquee-track">${one}</div>` +
        `<div class="wow-marquee-track">${one}</div>` +
      `</div>` +
      `<div class="wrap wow-stats">` +
        `<div class="wow-stat"><b data-count="5">0</b><span>${label('Маршрутов','Reisen','Journeys')}</span></div>` +
        `<div class="wow-stat"><b data-count="4">0</b><span>${label('Дня в путешествии','Tage draußen','Days outside')}</span></div>` +
        `<div class="wow-stat"><b data-count="8">0</b><span>${label('Человек в группе','Max. Gruppe','Max group')}</span></div>` +
      `</div>`;
    strip.after(el);

    const nums = Array.from(el.querySelectorAll('[data-count]'));
    if(reduce || !('IntersectionObserver' in window)){
      nums.forEach(n => n.textContent = n.dataset.count);
      return;
    }
    const run = node => {
      const end = +node.dataset.count, t0 = performance.now(), dur = 1500;
      const tick = t => {
        const p = Math.min((t - t0)/dur, 1);
        const e = 1 - Math.pow(1 - p, 3);
        node.textContent = Math.round(end * e);
        if(p < 1) raf(tick);
      };
      raf(tick);
    };
    const io = new IntersectionObserver(es => {
      es.forEach(e => { if(e.isIntersecting){ run(e.target); io.unobserve(e.target); } });
    }, {threshold:0.6});
    nums.forEach(n => io.observe(n));
  }

  /* ---------- film grain overlay ---------- */
  function grain(){
    if(reduce) return;
    if(document.querySelector('.grain')) return;
    const g = document.createElement('div');
    g.className = 'grain';
    g.setAttribute('aria-hidden','true');
    document.body.append(g);
  }

  /* ---------- drag-to-scroll with momentum ---------- */
  function dragScroll(){
    document.querySelectorAll('.home-trips,.review-grid').forEach(el => {
      if(getComputedStyle(el).overflowX !== 'auto') return;
      let down = false, startX = 0, startLeft = 0, lastX = 0, vel = 0, moved = false, glide = null;
      el.addEventListener('pointerdown', e => {
        if(e.pointerType === 'touch') return;     // мобильным хватает нативного
        down = true; moved = false;
        startX = lastX = e.clientX; startLeft = el.scrollLeft; vel = 0;
        cancelAnimationFrame(glide);
        el.classList.add('is-dragging');
      });
      el.addEventListener('pointermove', e => {
        if(!down) return;
        const dx = e.clientX - startX;
        if(Math.abs(dx) > 4) moved = true;
        el.scrollLeft = startLeft - dx;
        vel = e.clientX - lastX; lastX = e.clientX;
      });
      const release = () => {
        if(!down) return;
        down = false; el.classList.remove('is-dragging');
        const run = () => {
          vel *= 0.94;
          if(Math.abs(vel) < 0.4) return;
          el.scrollLeft -= vel;
          glide = raf(run);
        };
        glide = raf(run);
      };
      addEventListener('pointerup', release);
      addEventListener('pointercancel', release);
      // не открываем ссылку, если просто перетаскивали
      el.addEventListener('click', e => {
        if(moved){ e.preventDefault(); e.stopPropagation(); moved = false; }
      }, true);
    });
  }

  /* ---------- curtain reveal for images ---------- */
  function imgReveal(){
    const imgs = document.querySelectorAll('.trip-photo,.way-main,.journal figure,.review-grid figure');
    if(!imgs.length) return;
    if(reduce || !('IntersectionObserver' in window)){ imgs.forEach(i => i.classList.add('rv-in')); return; }
    imgs.forEach(i => i.classList.add('rv'));
    /* clip-path сам по себе скрывает элемент, и IntersectionObserver тогда
       считает ratio = 0 — наблюдатель никогда бы не сработал. Поэтому
       наблюдаем РОДИТЕЛЯ, а разрез применяем к самому изображению. */
    const io = new IntersectionObserver(es => es.forEach(e => {
      if(!e.isIntersecting) return;
      e.target.querySelectorAll('.rv:not(.rv-in)').forEach(x => x.classList.add('rv-in'));
      io.unobserve(e.target);
    }), {threshold:0.18});
    const parents = new Set();
    imgs.forEach(i => { if(i.parentElement) parents.add(i.parentElement); });
    parents.forEach(p => io.observe(p));
  }

  /* ---------- section heading word reveal on scroll ---------- */
  function revealWords(){
    const heads = document.querySelectorAll('.section-heading h2,.way-copy h2,.questions h2,.reviews h2,.stories h2,.confidence h2,.journal-copy h2,.detail-heading h2,.interlude-quote');
    if(!heads.length) return;
    if(reduce || !('IntersectionObserver' in window)){ heads.forEach(h => h.classList.add('kw-in')); return; }
    heads.forEach(h => { splitWords(h, 55); h.classList.add('kw'); });
    const io = new IntersectionObserver(es => es.forEach(e => {
      if(e.isIntersecting){ e.target.classList.add('kw-in'); io.unobserve(e.target); }
    }), {threshold:0.35});
    heads.forEach(h => io.observe(h));
  }

  /* ---------- back to top with progress ring ---------- */
  function toTop(){
    if(document.querySelector('.to-top')) return;
    const locale=document.documentElement.lang;
    const de=locale==='de',ru=locale==='ru';
    const b = document.createElement('button');
    b.className = 'to-top'; b.type = 'button';
    b.setAttribute('aria-label', ru?'Наверх':de?'Nach oben':'Back to top');
    b.innerHTML = '<svg viewBox="0 0 40 40" aria-hidden="true"><circle class="tt-bg" cx="20" cy="20" r="17"/><circle class="tt-fg" cx="20" cy="20" r="17"/></svg><span aria-hidden="true">↑</span>';
    document.body.append(b);
    const fg = b.querySelector('.tt-fg');
    const C = 2 * Math.PI * 17;
    fg.style.strokeDasharray = C.toFixed(2);
    const upd = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      fg.style.strokeDashoffset = (C * (1 - p)).toFixed(2);
      b.classList.toggle('is-on', window.scrollY > innerHeight * 0.7);
    };
    addEventListener('scroll', upd, {passive:true});
    addEventListener('resize', upd);
    b.addEventListener('click', () => window.scrollTo({top:0, behavior: reduce ? 'auto' : 'smooth'}));
    upd();
  }

  /* ---------- command palette (Ctrl/⌘ + K) ---------- */
  function palette(){
    if(document.getElementById('cmdk')) return;
    const locale=document.documentElement.lang;
    const de=locale==='de',ru=locale==='ru';
    const T=(en,deTxt)=>ru?(window.FluxLocale.strings[en]||en):de?deTxt:en;
    const href = (page, extra) => page + '?lang=' + locale + (extra || '');

    const items = [
      {g: T('Destinations','Ziele'), t: T('Kolsai Lakes','Kolsai-Seen'),      go:() => location.href = href('tours.html','&place=kolsai')},
      {g: T('Destinations','Ziele'), t: T('Charyn Canyon','Charyn-Canyon'),   go:() => location.href = href('tours.html','&place=charyn')},
      {g: T('Destinations','Ziele'), t: T('Burabay','Burabay'),                            go:() => location.href = href('tours.html','&place=burabay')},
      {g: T('Destinations','Ziele'), t: T('Turkestan','Turkestan'),                          go:() => location.href = href('tours.html','&place=turkestan')},
      {g: T('Destinations','Ziele'), t: T('Altyn-Emel','Altyn-Emel'),                         go:() => location.href = href('tours.html','&place=altyn')},
      {g: T('Pages','Seiten'), t: T('All trips','Alle Reisen'),               go:() => location.href = href('tours.html')},
      {g: T('Pages','Seiten'), t: T('Home','Startseite'),                     go:() => location.href = href('index.html')},
      {g: T('Pages','Seiten'), t: T('Journal','Reisehinweise'),               go:() => location.href = href('journal.html')},
      {g: T('View','Ansicht'), t: T('Open the map','Karte öffnen'),           go:() => { const m = document.querySelector('.map-section'); if(m) m.scrollIntoView({behavior: reduce?'auto':'smooth'}); }},
      {g: T('View','Ansicht'), t: T('Back to top','Nach oben'),               go:() => window.scrollTo({top:0, behavior: reduce?'auto':'smooth'})},
      ...['ru','de','en'].filter(l=>l!==locale).map(l=>({g:T('Language','Sprache'),t:ru?({ru:'Русский',de:'Немецкий',en:'Английский'}[l]):({ru:'Русский',de:'Deutsch',en:'English'}[l]),go:()=>{const u=new URL(location.href);u.searchParams.set('lang',l);location.href=u.href;}}))
    ];

    const back = document.createElement('div'); back.className = 'cmdk-backdrop';
    const box  = document.createElement('div'); box.className = 'cmdk'; box.id = 'cmdk';
    box.setAttribute('role','dialog'); box.setAttribute('aria-modal','true');
    box.setAttribute('aria-label', T('Command palette','Befehlspalette'));
    box.innerHTML =
      '<input class="cmdk-input" type="text" autocomplete="off" spellcheck="false" placeholder="' +
      T('Search destinations, pages…','Ziele, Seiten suchen…') + '">' +
      '<div class="cmdk-list" role="listbox"></div>';
    document.body.append(back, box);

    const input = box.querySelector('.cmdk-input');
    const list  = box.querySelector('.cmdk-list');
    let shown = items.slice(), active = 0;

    const draw = () => {
      if(!shown.length){ list.innerHTML = '<p class="cmdk-empty">' + T('Nothing found','Nichts gefunden') + '</p>'; return; }
      let html = '', g = '';
      shown.forEach((it, i) => {
        if(it.g !== g){ g = it.g; html += '<p class="cmdk-group">' + g + '</p>'; }
        html += '<div class="cmdk-item' + (i === active ? ' on' : '') + '" role="option" data-i="' + i + '">' +
                '<span>' + it.t + '</span><span class="k">↵</span></div>';
      });
      list.innerHTML = html;
      const on = list.querySelector('.cmdk-item.on');
      if(on) on.scrollIntoView({block:'nearest'});
    };

    const filter = q => {
      q = q.trim().toLowerCase();
      shown = q ? items.filter(i => (i.t + ' ' + i.g).toLowerCase().includes(q)) : items.slice();
      active = 0; draw();
    };
    const open = () => {
      back.classList.add('is-on'); box.classList.add('is-on');
      document.body.classList.add('cmdk-open');
      input.value = ''; filter(''); input.focus();
    };
    const close = () => {
      back.classList.remove('is-on'); box.classList.remove('is-on');
      document.body.classList.remove('cmdk-open');
    };
    const run = i => { if(shown[i]){ close(); shown[i].go(); } };

    input.addEventListener('input', e => filter(e.target.value));
    input.addEventListener('keydown', e => {
      if(e.key === 'ArrowDown'){ e.preventDefault(); active = Math.min(active+1, shown.length-1); draw(); }
      else if(e.key === 'ArrowUp'){ e.preventDefault(); active = Math.max(active-1, 0); draw(); }
      else if(e.key === 'Enter'){ e.preventDefault(); run(active); }
      else if(e.key === 'Escape'){ close(); }
    });
    list.addEventListener('click', e => {
      const it = e.target.closest('.cmdk-item');
      if(it) run(+it.dataset.i);
    });
    back.addEventListener('click', close);
    addEventListener('keydown', e => {
      if((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'){ e.preventDefault(); box.classList.contains('is-on') ? close() : open(); }
      else if(e.key === 'Escape' && box.classList.contains('is-on')) close();
    });

    // кнопка-триггер в шапке
    const tools = document.querySelector('.header-tools');
    if(tools){
      const trig = document.createElement('button');
      trig.type = 'button'; trig.className = 'cmdk-trigger';
      trig.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4.3-4.3"/></svg>';
      trig.setAttribute('aria-label', T('Open command palette','Befehlspalette öffnen'));
      trig.addEventListener('click', open);
      tools.prepend(trig);
    }
  }

  /* ---------- failsafe: content must never stay hidden ---------- */
  function failsafe(){
    /* rAF может быть заблокирован на фоновой вкладке, а IntersectionObserver
       — не сработать. Через паузу гарантируем, что видимая область не пустая.
       Ниже первого экрана элементы оставляем на IO, чтобы не потерять reveal. */
    setTimeout(() => {
      document.body.classList.add('is-loaded');
      const vh = innerHeight;
      document.querySelectorAll('.rv:not(.rv-in),.kw:not(.kw-in)').forEach(el => {
        const r = el.getBoundingClientRect();
        if(r.top < vh && r.bottom > 0) el.classList.add('rv-in','kw-in');
      });
    }, 1800);
  }

  /* ---------- boot ---------- */
  function init(){
    grain(); kinetic(); scrollFx(); mapDraw(); mapPreview(); band();
    dragScroll(); imgReveal(); revealWords(); palette(); failsafe();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
