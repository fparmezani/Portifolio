document.documentElement.classList.add('js');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const header = document.querySelector('[data-header]');
if (header) {
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

document.querySelectorAll('[data-year]').forEach((el) => {
  el.textContent = String(new Date().getFullYear());
});

const wa = document.querySelector('[data-wa]');
if (wa) {
  const tabs = [...wa.querySelectorAll('[data-wa-tab]')];
  const threads = [...wa.querySelectorAll('[data-wa-thread]')];
  const show = (id) => {
    tabs.forEach((t) => t.setAttribute('aria-selected', t.dataset.waTab === id ? 'true' : 'false'));
    threads.forEach((th) => {
      const on = th.dataset.waThread === id;
      th.hidden = !on;
      th.classList.toggle('on', on);
      if (on && !reduceMotion) {
        th.classList.remove('on');
        void th.offsetWidth;
        th.classList.add('on');
      }
    });
  };
  tabs.forEach((t) => t.addEventListener('click', () => show(t.dataset.waTab)));
}

const reveals = [...document.querySelectorAll('.reveal')];
if (reveals.length) {
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach((el) => io.observe(el));
  }
}
