/* IRONCORE Academia · site.js (JS puro, sem dependências) */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const WA = '5519998722479';

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const span = (p, a, b) => clamp((p - a) / (b - a));
  const prog = el => { const r = el.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - innerHeight)); };

  /* header sólido depois da abertura */
  const nav = $('#nav');
  const hero = $('#topo');
  const onNav = () => nav.classList.toggle('solid', scrollY > innerHeight * 0.7);

  /* LEDs do final: traços que se desenham */
  $$('.leds path').forEach(p => p.setAttribute('pathLength', '1'));
  const ledIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('lit'); ledIO.unobserve(e.target); } }), { threshold: .2 });
  $$('.leds').forEach(el => ledIO.observe(el));

  /* HERO: 04:59 → 05:00, LEDs acendem, o salão acende */
  const stage = $('#stage'), shade = $('#heroShade');
  const clock = $('#heroClock'), clockSub = $('#clockSub');
  const capClock = $('#capClock'), capTitle = $('#capTitle'), hint = $('#hint');
  const leds = stage ? [...stage.querySelectorAll('.led')] : [];
  const heroFrame = () => {
    if (!stage) return;
    const p = reduce ? 1 : prog(hero);
    const opened = p > .08;
    clock.textContent = opened ? '05:00' : '04:59';
    clock.classList.toggle('lit', opened);
    clockSub.textContent = opened ? 'A Ironcore abre. As luzes acendem.' : 'Artur Nogueira · a academia ainda está fechada';
    leds[0] && leds[0].style.setProperty('--o', span(p, .08, .16));
    leds[1] && leds[1].style.setProperty('--o', span(p, .14, .22));
    leds[2] && leds[2].style.setProperty('--o', span(p, .20, .28));
    leds[3] && leds[3].style.setProperty('--o', span(p, .24, .34));
    stage.style.setProperty('--lit', (.04 + .96 * span(p, .16, .48)).toFixed(3));
    stage.style.setProperty('--zoom', (1 + .1 * span(p, .2, 1)).toFixed(4));
    shade.style.setProperty('--shade', span(p, .36, .56));
    capClock.classList.toggle('on', p < .42);
    capTitle.classList.toggle('on', p >= .46);
    if (hint) hint.style.opacity = p > .05 ? 0 : 1;
  };

  /* revelações ao rolar (uma vez) */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15, rootMargin: '0px 0px -8% 0px' });
  $$('.rv, .rvc, .reels, .events').forEach(el => io.observe(el));

  /* contadores */
  const fmt = (v, d) => v.toFixed(d).replace('.', ',');
  const cIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; cIO.unobserve(e.target);
    const el = e.target, to = +el.dataset.count, d = +(el.dataset.dec || 0);
    if (reduce) { el.textContent = fmt(to, d); return; }
    const t0 = performance.now(), dur = 1400;
    const step = t => { const k = Math.min(1, (t - t0) / dur), ease = 1 - Math.pow(1 - k, 3); el.textContent = fmt(to * ease, d); if (k < 1) requestAnimationFrame(step); };
    el.textContent = fmt(0, d); requestAnimationFrame(step);
  }), { threshold: .6 });
  $$('[data-count]').forEach(el => cIO.observe(el));

  /* rolagem: só calcula enquanto a seção está visível */
  const active = new Set();
  let ticking = false;
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  function frame() { ticking = false; onNav(); heroFrame(); active.forEach(fn => fn()); }
  const watch = (el, fn) => new IntersectionObserver(([e]) => { e.isIntersecting ? active.add(fn) : active.delete(fn); req(); }, { rootMargin: '10% 0px' }).observe(el);

  /* manifesto: palavras acendem com a rolagem */
  const man = $('#manifest');
  if (man) {
    man.innerHTML = man.dataset.text.split(' ').map(w => { const hl = /^\*.*\*/.test(w); return `<span class="w${hl ? ' hl' : ''}">${w.replace(/\*/g, '')}</span>`; }).join(' ');
    const words = $$('.w', man);
    if (reduce) words.forEach(w => w.classList.add('on'));
    else watch(man, () => {
      const r = man.getBoundingClientRect(), vh = innerHeight;
      const p = Math.min(1, Math.max(0, (vh * .85 - r.top) / (r.height + vh * .35)));
      const n = Math.round(p * words.length * 1.15);
      words.forEach((w, i) => w.classList.toggle('on', i < n));
    });
  }

  /* UM DIA NA IRONCORE: relógio 05:00 → 22:00 guiado pela rolagem */
  const day = $('#dia');
  if (day) {
    const chaps = $$('.chap', day), pics = $$('#dayMedia picture'), clock = $('#clock'), fill = $('#dayFill');
    const ticks = $$('.hours-bar span', day);
    const T = chaps.map(c => +c.dataset.t);
    const moods = ['#1a2838', '#241010', '#120c0c', '#1c1410', '#2a1010', '#140808'];
    let cur = -1;
    const hhmm = h => { const m = Math.round(h * 60 / 10) * 10, hh = Math.floor(m / 60), mm = m % 60; return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0'); };
    const set = (i) => {
      if (i === cur) return; cur = i;
      chaps.forEach((c, k) => c.classList.toggle('is-on', k === i));
      pics.forEach((p, k) => p.classList.toggle('on', k === +chaps[i].dataset.img));
      ticks.forEach((t, k) => t.classList.toggle('on', k <= i));
      $('#dayMedia').style.setProperty('--mood', moods[i] || 'transparent');
    };
    // carrega as fotos do dia antes de chegar nelas
    new IntersectionObserver(([e], o) => { if (e.isIntersecting) { $$('img', day).forEach(i => i.loading = 'eager'); o.disconnect(); } }, { rootMargin: '100% 0px' }).observe(day);
    watch(day, () => {
      const r = day.getBoundingClientRect(), span = r.height - innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / span));
      // cada capítulo ocupa uma fatia igual da rolagem; o relógio anda dentro da fatia
      const i = Math.min(T.length - 1, Math.floor(p * T.length * .999));
      set(i); goTo(T[i]);
    });
    // o relógio "corre" até o horário do capítulo, contando os minutos
    let shown = 5, target = 5, raf = 0;
    const paint = () => { clock.textContent = hhmm(shown); fill.style.setProperty('--f', ((shown - 5) / 17).toFixed(4)); };
    const tick = () => { const d = target - shown; shown = Math.abs(d) < .02 ? target : shown + d * .09; paint(); raf = shown === target ? 0 : requestAnimationFrame(tick); };
    function goTo(h) { if (h === target) return; target = h; if (reduce) { shown = h; paint(); return; } if (!raf) raf = requestAnimationFrame(tick); }
    set(0); paint();
  }

  /* GRADE DE AULAS (post de 11/2026) */
  const G = {
    1: [['07:20', 'Spinning'], ['08:00', 'GAP'], ['17:00', 'Pilates'], ['18:30', 'Spinning'], ['19:15', 'FitDance'], ['20:00', 'Aerobox']],
    2: [['07:00', 'FitDance'], ['08:00', 'Ritbox'], ['09:00', 'Pilates'], ['18:30', 'Spinning'], ['19:15', 'FitDance'], ['20:10', 'GAP']],
    3: [['07:00', 'Alongamento'], ['08:00', 'Aerobox'], ['09:00', 'Spinning'], ['18:30', 'Spinning'], ['19:15', 'FitDance'], ['20:00', 'Spinning']],
    4: [['07:20', 'Spinning'], ['08:00', 'Pilates'], ['18:30', 'Spinning'], ['19:15', 'FitDance']],
    5: [['07:00', 'FitDance'], ['08:00', 'GAP']],
    6: []
  };
  const DN = { 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb' };
  const nowBR = () => {
    const P = {}; new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', hourCycle: 'h23', weekday: 'short', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date()).forEach(x => P[x.type] = x.value);
    return { wd: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(P.weekday), min: (+P.hour % 24) * 60 + +P.minute };
  };
  const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  const tabs = $('#clsTabs'), ruler = $('#ruler'), list = $('#clsList');
  if (tabs) {
    const now = nowBR();
    const today = now.wd >= 1 && now.wd <= 6 ? now.wd : 1;
    const R0 = 6 * 60, R1 = 21 * 60; // régua das 6h às 21h
    const pos = m => ((m - R0) / (R1 - R0) * 100).toFixed(2) + '%';
    const render = d => {
      $$('button', tabs).forEach(b => b.setAttribute('aria-selected', String(+b.dataset.d === d)));
      const L = G[d], isToday = d === now.wd;
      const next = isToday ? L.findIndex(([t]) => toMin(t) + 50 > now.min) : -1;
      list.innerHTML = L.length ? L.map(([t, n], k) => `<li><b>${t}</b><span>${n}</span>${k === next ? `<em>${toMin(t) <= now.min ? 'Agora' : 'Próxima'}</em>` : ''}</li>`).join('')
        : '<li><span>Sem aulas coletivas na grade de sábado. Musculação das 9h às 14h.</span></li>';
      let html = '';
      for (let h = 6; h <= 21; h += 3) html += `<span class="tick" style="left:${pos(h * 60)}">${h}h</span>`;
      if (!L.length) html += '<div class="empty">Sem aulas coletivas no sábado. O salão abre das 9h às 14h.</div>';
      // aulas muito próximas alternam altura para não encostar
      let last = -1e9, lvl = 0;
      L.forEach(([t, n], k) => { const m = toMin(t); lvl = m - last < 70 ? (lvl + 1) % 2 : 0; last = m; html += `<div class="ev${k === next ? ' now' : ''}" style="left:${pos(m)};--k:${k};--h:${lvl ? 92 : 40}px"><b>${t}</b><span>${n}</span><i></i></div>`; });
      if (isToday && now.min > R0 && now.min < R1) html += `<span class="now-line" style="left:${pos(now.min)}"></span>`;
      ruler.innerHTML = html;
      ruler.classList.remove('go'); void ruler.offsetWidth;
      if (ruler.dataset.seen) ruler.classList.add('go');
    };
    tabs.innerHTML = Object.keys(G).map(d => `<button type="button" role="tab" data-d="${d}">${DN[d]}<small>${+d === now.wd ? 'hoje' : (G[d].length + ' aulas')}</small></button>`).join('');
    tabs.addEventListener('click', e => { const b = e.target.closest('button'); if (b) render(+b.dataset.d); });
    tabs.addEventListener('keydown', e => { if (!/Arrow(Left|Right)/.test(e.key)) return; const bs = $$('button', tabs), i = bs.findIndex(b => b.getAttribute('aria-selected') === 'true'); const n = bs[(i + (e.key === 'ArrowRight' ? 1 : bs.length - 1)) % bs.length]; n.focus(); render(+n.dataset.d); });
    render(today);
    new IntersectionObserver(([e], o) => { if (e.isIntersecting) { ruler.dataset.seen = 1; ruler.classList.add('go'); o.disconnect(); } }, { threshold: .4 }).observe(ruler);
  }

  /* status aberto/fechado (horário de Brasília; feriados não entram) */
  const st = $('#status');
  if (st) {
    const { wd, min } = nowBR();
    const wk = wd >= 1 && wd <= 5, open = wk ? (min >= 300 && min < 1320) : (min >= 540 && min < 840);
    let txt;
    if (open) txt = `Aberto agora · fecha às ${wk ? '22h' : '14h'}`;
    else if (wk && min < 300) txt = 'Fechado · abre hoje às 5h';
    else if (!wk && min < 540) txt = 'Fechado · abre hoje às 9h';
    else { const nwd = (wd + 1) % 7; txt = `Fechado · abre amanhã às ${nwd >= 1 && nwd <= 5 ? '5h' : '9h'}`; }
    st.classList.add(open ? 'open' : 'closed'); $('#statusTxt').textContent = txt;
  }

  /* formulário → WhatsApp */
  const form = $('#form');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    const nome = form.nome.value.trim(), err = $('#f-nome-err');
    if (!nome) { form.nome.setAttribute('aria-invalid', 'true'); err.hidden = false; form.nome.focus(); return; }
    form.nome.removeAttribute('aria-invalid'); err.hidden = true;
    const msg = `Olá, Ironcore! Meu nome é ${nome}. Quero agendar uma aula experimental de ${form.obj.value}, ${form.turno.value}. ${form.pass.value}`.trim();
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  });

  /* botão flutuante some no hero e no formulário */
  const waf = $('#waf');
  if (waf) {
    const hidden = new Set();
    const o = new IntersectionObserver(es => { es.forEach(e => e.isIntersecting ? hidden.add(e.target) : hidden.delete(e.target)); waf.classList.toggle('hide', hidden.size > 0); }, { threshold: .15 });
    ['#topo', '#agendar', '.final'].forEach(s => { const el = $(s); if (el) o.observe(el); });
  }

  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  addEventListener('load', req);
  frame();
  if (new URLSearchParams(location.search).has('aceso')) addEventListener('load', () => scrollTo(0, hero.offsetHeight - innerHeight * 1.15));
})();
