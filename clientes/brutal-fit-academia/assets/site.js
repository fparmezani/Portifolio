/* Brutal Fit Academia · site.js (JS puro, sem dependências) */
(() => {
  const WA = '5519999766046';
  const BOOKSY_URL = ''; // pendente: colar aqui o link do Booksy da Brutal Fit quando o dono enviar
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* hero: entrada em cascata */
  const hero = $('.hero');
  requestAnimationFrame(() => requestAnimationFrame(() => hero && hero.classList.add('go')));

  /* cabeçalho sólido assim que a página rola */
  const nav = $('#nav');
  const sentinel = document.createElement('div');
  sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:8px;pointer-events:none';
  document.body.prepend(sentinel);
  new IntersectionObserver(([e]) => nav.classList.toggle('solid', !e.isIntersecting)).observe(sentinel);

  /* revelações (uma vez por elemento) */
  const once = (els, cb, opts = { rootMargin: '0px 0px -12% 0px', threshold: 0.12 }) => {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target); cb(e.target);
    }), opts);
    els.forEach(el => io.observe(el));
  };
  once($$('.rv'), el => el.classList.add('in'));
  /* com clip-path 100% o IntersectionObserver nunca "vê" o elemento: observa o pai */
  $$('.rv-clip').forEach(el => once([el.parentElement], () => el.classList.add('in'), { rootMargin: '0px 0px -15% 0px', threshold: 0 }));
  once($$('.score, .calm, .promo, .final'), el => el.classList.add('in'), { threshold: 0.3 });

  /* contadores da nota (0 → 5,0 e 0 → 105) */
  const fmt = (v, dec) => dec ? v.toFixed(dec).replace('.', ',') : String(Math.round(v));
  once($$('[data-count]'), el => {
    const to = +el.dataset.count, dec = +(el.dataset.dec || 0);
    if (reduce) { el.textContent = fmt(to, dec); return; }
    const t0 = performance.now(), dur = 1400;
    const step = t => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(to * e, dec);
      if (p < 1) requestAnimationFrame(step);
    };
    el.textContent = fmt(0, dec);
    requestAnimationFrame(step);
  }, { threshold: 0.5 });

  /* Sandro: as palavras da frase acendem em sequência */
  const quote = $('[data-words]');
  if (quote) {
    let i = 0;
    const wrap = (node, red) => node.textContent.split(/(\s+)/).map(t => {
      if (!t.trim()) return document.createTextNode(t);
      const s = document.createElement('span');
      s.className = 'w' + (red ? ' r' : ''); s.style.setProperty('--i', i++); s.textContent = t; return s;
    });
    [...quote.childNodes].forEach(n => {
      const parts = n.nodeType === 3 ? wrap(n, false) : wrap(n, n.classList && n.classList.contains('r'));
      n.replaceWith(...parts);
    });
    once([$('.sandro')], el => el.classList.add('in'), { threshold: 0.35 });
  }

  /* História fixada: da catraca à conquista */
  const story = $('.story');
  if (story) {
    const figs = $$('#storyMedia figure'), steps = $$('#storySteps li'), ol = $('#storySteps');
    const n = steps.length;
    const set = k => {
      figs.forEach((f, j) => { f.classList.toggle('on', j === k); f.classList.toggle('past', j < k); });
      steps.forEach((s, j) => s.classList.toggle('on', j === k));
      ol.style.setProperty('--p', (k + 1) / n);
    };
    const canPin = () => innerHeight >= 560;
    if (canPin()) {
      story.classList.add('pin');
      for (let k = 0; k < n; k++) {
        const t = document.createElement('div');
        t.className = 'story-trig'; t.dataset.k = k;
        t.style.top = `calc(${k} * 85vh)`;
        story.appendChild(t);
      }
      const io = new IntersectionObserver(entries => entries.forEach(e => {
        if (e.isIntersecting) set(+e.target.dataset.k);
      }), { rootMargin: '-50% 0px -50% 0px' });
      $$('.story-trig', story).forEach(t => io.observe(t));
      set(0);
    } else {
      figs.forEach((f, j) => f.classList.toggle('on', j === 0));
    }
  }

  /* Objetivos: acordeão (passar o mouse ou tocar) */
  const acc = $('#acc');
  if (acc) {
    const items = $$('.acc-item', acc);
    const open = it => items.forEach(x => {
      const on = x === it;
      x.classList.toggle('on', on);
      $('.acc-btn', x).setAttribute('aria-expanded', on);
      $('.acc-more .btn', x).tabIndex = on ? 0 : -1;
    });
    items.forEach(it => {
      $('.acc-btn', it).addEventListener('click', () => open(it));
      if (matchMedia('(hover: hover) and (pointer: fine)').matches) it.addEventListener('mouseenter', () => open(it));
    });
  }

  /* botões que levam ao formulário já com o objetivo marcado */
  $$('[data-pick]').forEach(a => a.addEventListener('click', () => {
    const r = $$('input[name="obj"]').find(x => x.value === a.dataset.pick);
    if (r) r.checked = true;
  }));

  /* letreiro: duplica as fotos para o laço contínuo */
  const reel = $('#reel');
  if (reel && !reduce) $$('figure', reel).forEach(f => {
    const c = f.cloneNode(true); c.setAttribute('aria-hidden', 'true');
    $('img', c).alt = ''; reel.appendChild(c);
  });

  /* promoção: some sozinha depois da data */
  const promo = $('#promo');
  if (promo && Date.now() > Date.parse(promo.dataset.until)) {
    promo.hidden = true;
    $$('[data-promo-link]').forEach(a => a.closest('li').remove());
  }

  /* Booksy: o botão só aparece quando houver o link */
  const bk = $('#booksy');
  if (bk && BOOKSY_URL) { bk.href = BOOKSY_URL; bk.hidden = false; }

  /* formulário → WhatsApp com a mensagem pronta */
  const form = $('#form');
  if (form) {
    const nome = $('#f-nome'), err = $('#f-nome-err');
    nome.addEventListener('input', () => { if (nome.value.trim()) { nome.removeAttribute('aria-invalid'); err.textContent = ''; } });
    form.addEventListener('submit', ev => {
      ev.preventDefault();
      const n = nome.value.trim();
      if (!n) {
        nome.setAttribute('aria-invalid', 'true');
        err.textContent = 'Escreva seu nome para a mensagem sair completa.';
        nome.focus(); return;
      }
      const obj = (form.querySelector('input[name="obj"]:checked') || {}).value || 'Ainda não sei';
      const msg = $('#f-msg').value.trim();
      let txt = `Olá, Brutal Fit! Meu nome é ${n} e quero começar a treinar.\nObjetivo: ${obj}.`;
      if (msg) txt += `\n${msg}`;
      txt += '\nPodem me passar os planos e horários?';
      window.open(`https://wa.me/${WA}?text=${encodeURIComponent(txt)}`, '_blank', 'noopener');
    });
  }

  /* botão flutuante / barra do celular somem sobre o formulário e o final */
  const floaters = [$('#waf'), $('#mbar')].filter(Boolean);
  const hideOn = $$('.hero-cta, #agendar, .final');
  const vis = new Set();
  const fio = new IntersectionObserver(entries => {
    entries.forEach(e => e.isIntersecting ? vis.add(e.target) : vis.delete(e.target));
    floaters.forEach(f => f.classList.toggle('hide', vis.size > 0));
  }, { threshold: 0.15 });
  hideOn.forEach(el => fio.observe(el));
})();
