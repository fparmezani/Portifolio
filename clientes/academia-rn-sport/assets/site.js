/* Academia RN Sport · site.js (JS puro; sem JS o conteúdo continua todo visível) */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const WA = 'https://wa.me/5519989624722?text=';

  /* ---------- reveal (uma vez por elemento) ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  $$('.rv').forEach(el => io.observe(el));

  /* ---------- contadores ---------- */
  const countIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; countIO.unobserve(e.target);
    const el = e.target, to = +el.dataset.count, dec = +(el.dataset.dec || 0);
    const fmt = v => v.toFixed(dec).replace('.', ',');
    if (reduce) { el.textContent = fmt(to); return; }
    const t0 = performance.now(), d = 1300;
    const tick = t => { const k = clamp((t - t0) / d); el.textContent = fmt(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tick); };
    el.textContent = fmt(0); requestAnimationFrame(tick);
  }), { threshold: .6 });
  $$('[data-count]').forEach(el => countIO.observe(el));

  /* ---------- atividades: abas ---------- */
  const list = $('#actsList'), acts = $$('.act');
  list.innerHTML = acts.map((a, i) => `<button role="tab" id="t-act-${i}" aria-controls="act-${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}"><span>${a.dataset.name}</span><svg aria-hidden="true"><use href="#arrow"/></svg></button>`).join('');
  const tabs = $$('button', list);
  acts.forEach((a, i) => { a.setAttribute('role', 'tabpanel'); a.setAttribute('aria-labelledby', `t-act-${i}`); a.classList.toggle('cur', i === 0); });
  let cur = 0;
  const setAct = (i, focus) => {
    if (i === cur) return; cur = i;
    tabs.forEach((t, j) => { t.setAttribute('aria-selected', j === i); t.tabIndex = j === i ? 0 : -1; });
    acts.forEach((a, j) => a.classList.toggle('cur', j === i));
    if (focus) tabs[i].focus();
    tabs[i].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  };
  list.addEventListener('click', e => { const b = e.target.closest('button'); if (b) setAct(tabs.indexOf(b)); });
  list.addEventListener('keydown', e => {
    const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]; if (!d) return;
    e.preventDefault(); setAct((cur + d + tabs.length) % tabs.length, true);
  });
  const q = +new URLSearchParams(location.search).get('at');
  if (q >= 1 && q <= acts.length) setAct(q - 1);

  /* ---------- mergulho: água sobe e capítulos trocam com a rolagem ---------- */
  const dive = $('#piscina'), steps = $$('.ds'), pics = $$('.dp'), diveBar = $('#diveBar');
  const pinned = () => !reduce && matchMedia('(min-width:901px)').matches;
  const setStatic = () => document.documentElement.classList.toggle('static', !pinned());
  setStatic();
  let chap = 0;
  const diveFrame = () => {
    if (!pinned()) return;
    const r = dive.getBoundingClientRect();
    const p = clamp(-r.top / (r.height - innerHeight));
    dive.style.setProperty('--w', clamp(p / .18).toFixed(3));            // água sobe no primeiro trecho
    const c = Math.min(3, Math.floor(clamp((p - .12) / .84) * 4));
    diveBar.style.setProperty('--p', clamp((p - .12) / .84).toFixed(3));
    if (c !== chap) {
      chap = c;
      steps.forEach((s, i) => s.classList.toggle('on', i === c));
      pics.forEach((f, i) => f.classList.toggle('on', i <= c));
    }
  };

  /* ---------- 21 anos: linha amarela se desenha ---------- */
  const tl = $('#timeline'), tlItems = $$('.tl', tl);
  const tlFrame = () => {
    if (reduce || innerWidth <= 900) { tl.style.setProperty('--tl', 1); return; }
    const r = tl.getBoundingClientRect();
    const p = clamp((innerHeight * .85 - r.top) / (r.height * .9));
    tl.style.setProperty('--tl', p.toFixed(3));
    tlItems.forEach((it, i) => it.style.setProperty('--dot', p >= i / tlItems.length ? 1 : .4));
  };

  /* ---------- clube: 21 carimbos, um a um ---------- */
  const stamps = $('#stamps'), stampN = $('#stampN');
    const dots = $$('i', stamps);
  new IntersectionObserver((es, ob) => es.forEach(e => {
    if (!e.isIntersecting) return; ob.disconnect();
    if (reduce) { dots.forEach(d => d.classList.add('on')); stampN.textContent = 21; return; }
    dots.forEach((d, i) => setTimeout(() => { d.classList.add('on'); stampN.textContent = i + 1; }, 300 + i * 110));
  }), { threshold: .55 }).observe($('#stampCard'));

  /* ---------- nav sólida assim que a página rola ---------- */
  const nav = $('#nav');
  const navFrame = () => nav.classList.toggle('solid', scrollY > 8);

  /* ---------- um único laço de rolagem (rAF) ---------- */
  let ticking = false;
  const frame = () => { ticking = false; navFrame(); diveFrame(); tlFrame(); };
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', () => { setStatic(); req(); });
  frame();

  /* ---------- formulário → WhatsApp ---------- */
  const form = $('#form'), nome = $('#f-nome'), err = $('#f-err'), at = $('#f-at'), hint = $('#f-hint');
  const onlyU1 = ['Natação infantil', 'Natação adulto', 'Hidroginástica', 'Funcional e alongamento'];
  const fixUnit = () => {
    const need = onlyU1.includes(at.value) && $('#u2').checked;
    if (need) { $('#u1').checked = true; hint.hidden = false; } else if (!onlyU1.includes(at.value)) hint.hidden = true;
  };
  at.addEventListener('change', fixUnit);
  $('#u2').addEventListener('change', fixUnit);
  nome.addEventListener('input', () => { if (nome.value.trim()) { err.hidden = true; nome.removeAttribute('aria-invalid'); } });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const n = nome.value.trim();
    if (!n) { err.hidden = false; nome.setAttribute('aria-invalid', 'true'); nome.focus(); return; }
    const u = form.unidade.value;
    const msg = `Olá, RN Sport! Meu nome é ${n} e quero agendar uma aula teste.\nAtividade: ${at.value}\nUnidade: ${u}`;
    open(WA + encodeURIComponent(msg), '_blank', 'noopener');
  });

  /* ---------- onde: abas das unidades ---------- */
  const ltabs = $$('.tabs button'), locs = $$('.loc');
  const setLoc = i => {
    ltabs.forEach((t, j) => { t.setAttribute('aria-selected', j === i); t.tabIndex = j === i ? 0 : -1; });
    locs.forEach((l, j) => { l.hidden = j !== i; });
  };
  ltabs.forEach((t, i) => t.addEventListener('click', () => setLoc(i)));
  $('.tabs').addEventListener('keydown', e => {
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (!d) return;
    const i = (ltabs.findIndex(t => t.getAttribute('aria-selected') === 'true') + d + 2) % 2; setLoc(i); ltabs[i].focus();
  });
  setLoc(0);

  /* ---------- aberto agora (Unidade 1, horário de Brasília) ---------- */
  const st = $('#status'), stTxt = $('#statusTxt');
  const setStatus = () => {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    const g = t => parts.find(x => x.type === t).value;
    const wd = g('weekday'), m = +g('hour') * 60 + +g('minute');
    const H = { Mon: [360, 1320], Tue: [360, 1320], Wed: [360, 1320], Thu: [360, 1320], Fri: [360, 1260], Sat: [480, 720] }[wd];
    const open = H && m >= H[0] && m < H[1];
    st.classList.toggle('open', !!open);
    const hh = v => String(Math.floor(v / 60)).padStart(2, '0') + 'h';
    if (open) stTxt.textContent = `Aberta agora · até as ${hh(H[1])}`;
    else if (H && m < H[0]) stTxt.textContent = `Fechada · abre às ${hh(H[0])}`;
    else stTxt.textContent = wd === 'Fri' ? 'Fechada · abre sábado às 08h' : (wd === 'Sat' || wd === 'Sun') ? 'Fechada · abre segunda às 06h' : 'Fechada · abre amanhã às 06h';
  };
  setStatus(); setInterval(setStatus, 60000);
})();
