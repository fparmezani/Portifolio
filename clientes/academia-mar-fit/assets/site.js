/* Academia Mar Fit · site.js */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const WA = 'https://wa.me/5519995131444?text=';
  const pad = n => String(n).padStart(2, '0');

  /* ---------- horário de Brasília ---------- */
  const brNow = () => {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    const get = t => parts.find(x => x.type === t).value;
    const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    return { wd, m: +get('hour') * 60 + +get('minute') };
  };

  /* ---------- nav sólido assim que rolar + botão flutuante ---------- */
  const nav = $('#nav');
  const sentinel = document.createElement('div');
  sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:8px;pointer-events:none';
  document.body.prepend(sentinel);
  new IntersectionObserver(([e]) => nav.classList.toggle('solid', !e.isIntersecting)).observe(sentinel);

  /* ---------- abertura: 03:59 → 04:00, as luminárias acendem ---------- */
  const room = $('#room'), clock = $('#clock'), clockSub = $('#clockSub'), hc = $('.hero-clock');
  const openUp = () => {
    clock.textContent = '04:00';
    clockSub.textContent = 'A Mar Fit abriu';
    hc.classList.add('open');
  };
  if (reduce) { openUp(); room.classList.add('lights', 'lit'); }
  else {
    setTimeout(openUp, 850);
    setTimeout(() => room.classList.add('lights'), 950);
    setTimeout(() => room.classList.add('lit'), 950 + 7 * 135 + 650);
  }

  /* ---------- contadores ---------- */
  const countUp = el => {
    const to = +el.dataset.to, dec = +(el.dataset.dec || 0), t0 = performance.now(), d = reduce ? 0 : 1300;
    const tick = t => {
      const k = d ? clamp((t - t0) / d) : 1, v = to * (1 - Math.pow(1 - k, 3));
      el.textContent = v.toFixed(dec).replace('.', ',');
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const countIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { countUp(e.target); countIO.unobserve(e.target); } }), { threshold: .6 });
  $$('.count').forEach(el => { if (!reduce) el.textContent = '0'; countIO.observe(el); });

  /* ---------- revelações (uma vez por elemento) ---------- */
  const revealIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px', threshold: .15 });
  $$('.rv-clip, #week, #crest, .plans-grid, .team-q').forEach(el => revealIO.observe(el));

  /* frase da equipe: palavra por palavra */
  const tq = $('#teamQ');
  tq.innerHTML = tq.textContent.trim().split(/\s+/).map((w, i) => `<span class="w" style="--i:${i}">${w}</span>`).join(' ');

  /* dia de hoje no quadro de aulas */
  const { wd } = brNow();
  const th = $(`.wk-head [data-d="${wd}"]`); if (th) th.classList.add('today');

  /* ---------- um dia na Mar Fit (seção fixa) ---------- */
  const day = $('#dia'), chs = $$('#chapters .ch'), pics = $$('#dayPhotos img'), N = chs.length;
  const bigClock = $('#bigClock'), bigDay = $('#bigDay'), arcFg = $('#arcFg'), marker = $('#marker'), glow = $('#glow');
  const ticks = $$('#ticks span'), track = $('.track');
  const canPin = !reduce && innerHeight >= 540;
  // céu de cada capítulo: [topo, base, brilho do sol]
  const SKY = [
    ['#0a0c17', '#0e0e0f', 0], ['#2a1f0a', '#14110b', .32], ['#2b2612', '#121210', .26],
    ['#232830', '#111214', .2], ['#2a1a10', '#120f0d', .24], ['#0b0b12', '#0e0e0f', 0], ['#26220f', '#121110', .22]
  ];
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',')})`; };
  let cur = -1;
  const setChapter = i => {
    if (i === cur) return; cur = i;
    chs.forEach((c, j) => c.classList.toggle('cur', j === i));
    pics.forEach((p, j) => { p.classList.toggle('cur', j === i); p.classList.toggle('seen', j < i); });
    ticks.forEach((t, j) => t.classList.toggle('on', j <= i));
    bigDay.textContent = chs[i].dataset.day;
    if (!canPin) bigClock.textContent = `${pad(+chs[i].dataset.h)}:${pad(+chs[i].dataset.m)}`;
  };
  if (canPin) {
    document.documentElement.classList.add('pin');
    day.style.setProperty('--n', N);
    ticks.forEach((t, j) => { t.style.left = `${(j / (N - 1)) * 100}%`; });
    pics.forEach(p => { p.loading = 'eager'; });
  }
  const minutes = chs.map(c => +c.dataset.h * 60 + +c.dataset.m);
  const dayFrame = () => {
    const r = day.getBoundingClientRect();
    const p = clamp(-r.top / (r.height - innerHeight));
    const f = p * (N - 1), a = Math.floor(f), b = Math.min(N - 1, a + 1), k = f - a;
    setChapter(k >= .5 ? b : a);
    // o relógio corre até a hora do próximo capítulo e chega nela quando ele aparece
    const t = clamp((k - .1) / .4);
    const m = b === N - 1 ? (k >= .5 ? minutes[b] : minutes[a]) : Math.round(lerp(minutes[a], minutes[b], t));
    bigClock.textContent = `${pad(Math.floor(m / 60))}:${pad(Math.round(m % 60 / 5) * 5 % 60)}`;
    const s0 = SKY[a], s1 = SKY[b];
    day.style.setProperty('--sky-a', mix(s0[0], s1[0], t));
    day.style.setProperty('--sky-b', mix(s0[1], s1[1], t));
    glow.style.setProperty('--ga', lerp(s0[2], s1[2], t).toFixed(3));
    // sol no arco (parábola sobre a linha do dia)
    const x = p, y = 1 - 4 * x * (1 - x) * .92;
    glow.style.setProperty('--gx', `${x * 100}%`);
    glow.style.setProperty('--gy', `${30 + y * 60}%`);
    track.style.setProperty('--p', p.toFixed(4));
    marker.style.setProperty('--mx', p.toFixed(4));
    marker.style.setProperty('--my', y.toFixed(3));
    arcFg.style.strokeDashoffset = (1 - p).toFixed(4);
  };
  setChapter(0);

  /* ---------- parallax da foto da equipe ---------- */
  const teamImg = $('#teamImg');
  const teamFrame = () => {
    const r = teamImg.getBoundingClientRect();
    teamImg.style.setProperty('--py', `${((r.top + r.height / 2 - innerHeight / 2) / innerHeight * -26).toFixed(1)}px`);
  };

  /* ---------- laço de quadros só enquanto as seções estão na tela ---------- */
  const active = new Set();
  let raf = 0;
  const loop = () => {
    raf = 0;
    if (active.has(day)) dayFrame();
    if (active.has(teamImg)) teamFrame();
    if (active.size) raf = requestAnimationFrame(loop);
  };
  const viewIO = new IntersectionObserver(es => {
    es.forEach(e => e.isIntersecting ? active.add(e.target) : active.delete(e.target));
    if (active.size && !raf) raf = requestAnimationFrame(loop);
  });
  if (canPin) viewIO.observe(day);
  if (!reduce) viewIO.observe(teamImg);
  addEventListener('resize', () => { if (canPin) dayFrame(); });

  /* ---------- formulário → WhatsApp ---------- */
  const form = $('#form'), nome = $('#f-nome'), err = $('#errNome');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const n = nome.value.trim();
    if (!n) { nome.setAttribute('aria-invalid', 'true'); nome.setAttribute('aria-describedby', 'errNome'); err.hidden = false; nome.focus(); return; }
    nome.removeAttribute('aria-invalid'); err.hidden = true;
    let msg = `Olá, Mar Fit! Meu nome é ${n} e quero começar a treinar.\nObjetivo: ${form.objetivo.value}\nMelhor horário: ${form.turno.value}`;
    if (form.pass.value !== 'Não tenho') msg += `\n${form.pass.value}`;
    open(WA + encodeURIComponent(msg), '_blank', 'noopener');
  });
  nome.addEventListener('input', () => { if (nome.value.trim()) { nome.removeAttribute('aria-invalid'); err.hidden = true; } });

  /* ---------- aberto agora ---------- */
  const status = $('#status'), stTxt = $('#statusTxt');
  const setStatus = () => {
    const { wd, m } = brNow();
    const week = wd >= 1 && wd <= 5;
    const open = week ? m >= 240 && m < 1320 : m >= 480 && m < 720;
    status.classList.toggle('open', open);
    if (open) stTxt.textContent = week ? 'Aberto agora, até as 22h' : 'Aberto agora, até as 12h';
    else if (week && m < 240) stTxt.textContent = 'Fechado, abre às 4h';
    else if (!week && m < 480) stTxt.textContent = 'Fechado, abre às 8h';
    else if (wd === 5 || wd === 6) stTxt.textContent = 'Fechado, abre amanhã às 8h';
    else stTxt.textContent = 'Fechado, abre amanhã às 4h';
  };
  setStatus(); setInterval(setStatus, 60000);
})();
