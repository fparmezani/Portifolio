/* Stronger Academia · site.js (JS puro, sem dependências) */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  // entrada do hero
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('ready')));

  // header sólido assim que a página rola
  const nav = $('#nav');
  const sentinel = document.createElement('div');
  sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:8px;pointer-events:none';
  document.body.prepend(sentinel);
  new IntersectionObserver(([e]) => nav.classList.toggle('solid', !e.isIntersecting)).observe(sentinel);

  // contadores
  const fmt = (n, dec, th) => {
    let s = n.toFixed(dec).replace('.', ',');
    if (th) s = Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return s;
  };
  const count = el => {
    const to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), th = 'thousands' in el.dataset;
    if (reduce) { el.textContent = fmt(to, dec, th); return; }
    const t0 = performance.now(), dur = 1400;
    const step = t => {
      const p = clamp((t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(to * e, dec, th);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // revelação ao rolar (uma vez por elemento)
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    el.classList.add('on');
    if (el.dataset.count) count(el);
    io.unobserve(el);
  }), { rootMargin: '0px 0px -12% 0px', threshold: .08 });
  $$('.rv, .reveal, [data-count], #stars, #week').forEach(el => io.observe(el));

  // ===== cenas guiadas pela rolagem (um laço rAF só enquanto alguma está visível) =====
  const scenes = new Set(), visible = new Set();
  let running = false;
  const loop = () => {
    visible.forEach(fn => fn());
    if (visible.size) requestAnimationFrame(loop); else running = false;
  };
  const watch = (el, fn) => {
    scenes.add(fn);
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) visible.add(fn); else { fn(); visible.delete(fn); }
      if (visible.size && !running) { running = true; requestAnimationFrame(loop); }
    }).observe(el);
  };

  // O dia na Stronger: relógio de 04:59 a 21:30
  const day = $('#dia');
  if (day) {
    if (reduce) day.classList.add('static');
    else {
      const chs = $$('.ch', day), imgs = $$('#dayMedia img'), clock = $('#clock'), bar = $('#dayBar');
      const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
      const times = chs.map(c => toMin(c.dataset.t));
      const n = chs.length;
      let cur = -1;
      const set = i => {
        if (i === cur) return;
        chs.forEach((c, k) => c.classList.toggle('on', k === i));
        imgs.forEach((im, k) => { im.classList.toggle('on', k === i); im.classList.toggle('was', k < i); });
        cur = i;
      };
      const tick = () => {
        const r = day.getBoundingClientRect();
        const p = clamp(-r.top / (r.height - innerHeight));
        const x = p * n, i = Math.min(n - 1, Math.floor(x));
        const local = clamp(x - i);
        const next = i < n - 1 ? times[i + 1] : times[i];
        // o relógio corre na segunda metade de cada capítulo
        const m = Math.round(times[i] + (next - times[i]) * clamp((local - .55) / .45));
        clock.textContent = String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
        bar.style.transform = `scaleX(${clamp((m - 300) / (1290 - 300))})`;
        set(i);
      };
      set(0);
      watch(day, tick);
    }
  }

  // parallax leve na foto de gerações (até ~6%)
  const par = $('[data-par]');
  if (par && !reduce) watch(par, () => {
    const r = par.parentElement.getBoundingClientRect();
    const p = clamp((innerHeight - r.top) / (innerHeight + r.height));
    par.style.transform = `translate3d(0,${(-p * 10.7).toFixed(2)}%,0)`;
  });

  // linha do tempo desenha com a rolagem
  const tl = $('#tl'), tlLine = $('#tlLine');
  if (tl && tlLine) {
    if (reduce) tlLine.style.transform = 'scaleY(1)';
    else watch(tl, () => {
      const r = tl.getBoundingClientRect();
      tlLine.style.transform = `scaleY(${clamp((innerHeight * .6 - r.top) / r.height).toFixed(3)})`;
    });
  }

  // modalidades
  const mods = $$('.mod'), modImgs = $$('#modPanel img');
  const pick = i => {
    mods.forEach((b, k) => { b.classList.toggle('is-on', k === i); b.setAttribute('aria-selected', k === i); });
    modImgs.forEach((im, k) => im.classList.toggle('is-on', k === i));
  };
  mods.forEach((b, i) => {
    b.addEventListener('click', () => pick(i));
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) b.addEventListener('mouseenter', () => pick(i));
  });

  // horários: dia de hoje, marcador de agora e status (horário de Brasília)
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  const get = t => parts.find(x => x.type === t).value;
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  const mins = +get('hour') * 60 + +get('minute');
  const weekend = wd === 0 || wd === 6;
  const [open, close] = weekend ? [480, 720] : [300, 1290];
  const row = $(`.w-rows li[data-d="${wd}"]`);
  if (row) {
    row.classList.add('today');
    const now = document.createElement('span');
    now.className = 'now'; now.style.setProperty('--h', (mins / 60).toFixed(2));
    now.setAttribute('aria-hidden', 'true');
    $('.w-track', row).append(now);
  }
  const st = $('#status'), stt = $('#statusTxt');
  const hhmm = m => (m % 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}` : `${m / 60}h`);
  if (st) {
    if (mins >= open && mins < close) { st.classList.add('open'); stt.textContent = `Aberta agora · fecha às ${hhmm(close)}`; }
    else if (mins < open) stt.textContent = `Fechada agora · abre hoje às ${hhmm(open)}`;
    else {
      const t = (wd + 1) % 7, o = (t === 0 || t === 6) ? 480 : 300;
      stt.textContent = `Fechada agora · abre amanhã às ${hhmm(o)}`;
    }
  }
})();
