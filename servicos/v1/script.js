document.documentElement.classList.add('js');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Revela os blocos ao rolar
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('in');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

// Menu do celular
const menuBtn = document.querySelector('[data-menu]');
const nav = document.getElementById('nav');
menuBtn?.addEventListener('click', () => {
  const open = menuBtn.getAttribute('aria-expanded') !== 'true';
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  nav.classList.toggle('open', open);
});
nav?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
  menuBtn.setAttribute('aria-expanded', 'false');
  nav.classList.remove('open');
}));

// Cada case alterna entre as telas do projeto enquanto está visível
document.querySelectorAll('[data-case]').forEach((card) => {
  const slides = [...card.querySelectorAll('.screen img')];
  const dots = card.querySelector('.dots');
  let current = 0;
  let timer = null;

  const buttons = slides.map((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `Tela ${i + 1} de ${slides.length}`);
    b.setAttribute('aria-pressed', String(i === 0));
    b.addEventListener('click', () => { show(i); restart(); });
    b.addEventListener('mouseenter', () => { show(i); stop(); });
    dots.appendChild(b);
    return b;
  });

  function show(i) {
    current = i;
    slides.forEach((s, j) => s.classList.toggle('is-active', j === i));
    buttons.forEach((b, j) => b.setAttribute('aria-pressed', String(j === i)));
  }
  function stop() { clearInterval(timer); timer = null; }
  function start() {
    if (reduceMotion || timer) return;
    timer = setInterval(() => show((current + 1) % slides.length), 3400);
  }
  function restart() { stop(); start(); }

  new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()), { threshold: 0.4 }).observe(card);
  dots.addEventListener('mouseleave', start);
});

document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
