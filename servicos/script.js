const hasGsap = !!(window.gsap && window.ScrollTrigger);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (hasGsap) document.documentElement.classList.add('js');

// ---------- Parede de telas (hero e CTA final) ----------
const SITES = ['imc', 'aline', 'ctlucas', 'raquel', 'miranha'];
const DESK = { imc: 5, aline: 5, ctlucas: 5, raquel: 5, miranha: 6 };
const MOB = 5;

function buildWall(el, { lazy = false } = {}) {
  if (!el) return;
  const counters = Object.fromEntries(SITES.map((s) => [s, { d: 0, m: 0 }]));
  const load = lazy ? 'loading="lazy"' : 'decoding="async"';
  const img = (src) => `<img src="assets/wall/${src}.webp" alt="" ${load}>`;
  const nextDesk = (s) => `${s}-d${counters[s].d++ % DESK[s]}`;
  const nextMob = (s) => `${s}-m${counters[s].m++ % MOB}`;

  let html = '';
  for (let c = 0; c < 7; c++) {
    let items = '';
    for (let i = 0; i < 6; i++) {
      const site = SITES[(c * 2 + i) % SITES.length];
      if ((i + c) % 3 === 2) {
        const other = SITES[(c * 2 + i + 2) % SITES.length];
        items += `<div class="tile-pair"><div class="tile">${img(nextMob(site))}</div><div class="tile">${img(nextMob(other))}</div></div>`;
      } else {
        items += `<div class="tile">${img(nextDesk(site))}</div>`;
      }
    }
    const dur = 55 + ((c * 17) % 40);
    html += `<div class="col"><div class="col-inner" style="--dur:${dur}s">${items}${items}</div></div>`;
  }
  el.innerHTML = html;
}
buildWall(document.querySelector('[data-wall]'));
buildWall(document.querySelector('[data-wall-flat]'), { lazy: true });

// ---------- Header ----------
const header = document.querySelector('[data-header]');
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ---------- Celular da órbita troca de site ----------
const cycler = [...document.querySelectorAll('[data-cycler] img')];
if (cycler.length && !reduceMotion) {
  let k = 0;
  setInterval(() => {
    cycler[k].classList.remove('on');
    k = (k + 1) % cycler.length;
    cycler[k].classList.add('on');
  }, 2400);
}

document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

// ---------- Manifesto: separa em palavras ----------
const manifesto = document.querySelector('[data-words]');
if (manifesto) {
  const words = manifesto.textContent.trim().split(/\s+/);
  const hlFrom = words.length - 5;
  manifesto.innerHTML = words.map((w, i) => `<span class="w${i >= hlFrom ? ' hl' : ''}">${w}</span>`).join(' ');
  if (!hasGsap || reduceMotion) manifesto.querySelectorAll('.w').forEach((w) => { w.style.opacity = 1; });
}

if (hasGsap) {
  gsap.registerPlugin(ScrollTrigger);

  // rolagem suave
  if (window.Lenis && !reduceMotion) {
    const lenis = new Lenis({ lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: 0, duration: 1.4 });
    }));
  }

  const wall = document.querySelector('[data-wall]');
  const stage = document.querySelector('.wall-stage');
  const mm = gsap.matchMedia();

  mm.add({ desktop: '(min-width: 1001px)', mobile: '(max-width: 1000px)', motion: '(prefers-reduced-motion: no-preference)' }, (ctx) => {
    const { desktop, motion } = ctx.conditions;
    const small = !desktop;
    const base = small ? { rx: 44, rz: -24 } : { rx: 46, rz: -22 };
    gsap.set(wall, { xPercent: -50, yPercent: -50, left: '50%', top: '50%', x: 0, y: 0, rotationX: base.rx, rotationZ: base.rz, scale: 1.05 });

    if (!motion) {
      gsap.set('.js .reveal', { opacity: 1, y: 0 });
      return;
    }

    // abertura do hero
    const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
    intro
      .from(wall, { opacity: 0, scale: 1.6, rotationX: base.rx + 20, duration: 2.4 }, 0)
      .from('h1 .line > span', { yPercent: 110, duration: 1.2, stagger: 0.12 }, 0.5)
      .fromTo('[data-uau]', { scale: 0.4, opacity: 0, filter: 'blur(30px) drop-shadow(0px 0px 0px rgba(13,110,253,0))' }, { scale: 1, opacity: 1, filter: 'blur(0px) drop-shadow(0px 0px 60px rgba(13,110,253,0.45))', duration: 1.8, ease: 'expo.out' }, 0.9)
      .from('.hero-sub, .hero-cta', { y: 24, opacity: 0, duration: 1, stagger: 0.1 }, 1.3)
      .from('.header', { y: -30, opacity: 0, duration: 1 }, 1.1)
      .from('.scroll-hint', { opacity: 0, duration: 1 }, 1.8);

    // ao rolar, a parede "deita" e a gente mergulha nela
    gsap.timeline({
      scrollTrigger: { trigger: '.hero', start: 'top top', end: small ? '+=60%' : '+=90%', scrub: 1, pin: true, anticipatePin: 1 },
    })
      .to(wall, { rotationX: 12, rotationZ: -4, scale: small ? 1.5 : 1.25, ease: 'none' }, 0)
      .to('[data-hero-copy]', { y: -140, opacity: 0, scale: 0.92, ease: 'none' }, 0)
      .to('.hero-shade', { opacity: 0.35, ease: 'none' }, 0)
      .to('.scroll-hint', { opacity: 0, ease: 'none' }, 0);

    // parede segue o mouse, de leve
    if (desktop) {
      const qx = gsap.quickTo(stage, 'x', { duration: 1.2, ease: 'power3' });
      const qy = gsap.quickTo(stage, 'y', { duration: 1.2, ease: 'power3' });
      const onMove = (e) => {
        qx((e.clientX / innerWidth - 0.5) * -60);
        qy((e.clientY / innerHeight - 0.5) * -40);
      };
      window.addEventListener('mousemove', onMove);
      ctx.add(() => () => window.removeEventListener('mousemove', onMove));
    }

    // manifesto acende palavra por palavra
    gsap.to('.manifesto .w', {
      opacity: 1, stagger: 0.08, ease: 'none',
      scrollTrigger: { trigger: '.manifesto', start: 'top 70%', end: 'bottom 60%', scrub: 1 },
    });

    // showreel horizontal
    const track = document.querySelector('[data-reel-track]');
    const slides = gsap.utils.toArray('.slide');
    const num = document.querySelector('[data-reel-num]');
    if (desktop) {
      const dist = () => track.scrollWidth - innerWidth;
      const scroll = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: '[data-reel]', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true,
          onUpdate: (self) => {
            gsap.set('[data-reel-bar]', { scaleX: self.progress });
            num.textContent = String(Math.min(slides.length, Math.round(self.progress * (slides.length - 1)) + 1)).padStart(2, '0');
          },
        },
      });
      slides.forEach((slide, i) => {
        const st = { trigger: slide, containerAnimation: scroll, start: 'left right', end: 'right left', scrub: true };
        gsap.fromTo(slide.querySelector('.slide-bg'), { xPercent: -6 }, { xPercent: 6, ease: 'none', scrollTrigger: st });
        gsap.fromTo(slide.querySelector('.frame'), { rotationY: -28, x: 120 }, { rotationY: 6, x: -60, ease: 'none', scrollTrigger: st });
        gsap.fromTo(slide.querySelector('.phone'), { y: 120, rotation: 10 }, { y: -60, rotation: -2, ease: 'none', scrollTrigger: st });
        gsap.fromTo(slide.querySelector('.slide-index'), { x: 200 }, { x: -200, ease: 'none', scrollTrigger: st });
        gsap.from(slide.querySelectorAll('.slide-seg, .slide-name, .slide-line, .slide-link'), {
          x: 80, opacity: 0, stagger: 0.08, duration: 1, ease: 'expo.out',
          scrollTrigger: i === 0
            ? { trigger: '[data-reel]', start: 'top 60%', toggleActions: 'play none none reverse' }
            : { trigger: slide, containerAnimation: scroll, start: 'left 65%', toggleActions: 'play none none reverse' },
        });
      });
    } else {
      slides.forEach((slide) => {
        gsap.from(slide.querySelectorAll('.slide-seg, .slide-name, .slide-line, .slide-link'), {
          y: 40, opacity: 0, stagger: 0.08, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: slide, start: 'top 70%' },
        });
        gsap.from(slide.querySelector('.frame'), { y: 80, rotationX: 20, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: slide, start: 'top 55%' } });
        gsap.from(slide.querySelector('.phone'), { y: 120, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: slide, start: 'top 45%' } });
      });
    }

    // órbita: as pílulas giram e continuam de pé
    const chips = gsap.utils.toArray('.ring span').map((el) => ({
      el, base: parseFloat(el.style.getPropertyValue('--a')), dir: el.closest('.r1') ? 1 : -0.7,
    }));
    let spin = 0;
    const tick = (_, dt) => {
      spin += dt * 0.006;
      chips.forEach((c) => c.el.style.setProperty('--a', `${c.base + spin * c.dir}deg`));
    };
    ScrollTrigger.create({
      trigger: '.orbit', start: 'top bottom', end: 'bottom top',
      onToggle: (self) => (self.isActive ? gsap.ticker.add(tick) : gsap.ticker.remove(tick)),
    });
    gsap.from('.orbit', { scale: 0.7, opacity: 0, rotation: -30, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: '.orbit', start: 'top 75%' } });

    // faixas: o letreiro anda sozinho e acelera com a rolagem
    const bands = gsap.utils.toArray('.band > div');
    ScrollTrigger.create({
      trigger: '.bands', start: 'top bottom', end: 'bottom top',
      onUpdate: (self) => {
        const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 400, 5);
        bands.forEach((b) => b.getAnimations().forEach((an) => { an.playbackRate = boost; }));
        gsap.delayedCall(0.25, () => bands.forEach((b) => b.getAnimations().forEach((an) => { an.playbackRate = 1; })));
      },
    });

    // linha do processo
    gsap.to('[data-line]', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.how', start: 'top 60%', end: 'bottom 70%', scrub: 1 } });

    // títulos grandes sobem com máscara
    gsap.utils.toArray('.big, .finale-title').forEach((el) => {
      gsap.from(el, { y: 80, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
    });

    // revelações genéricas
    ScrollTrigger.batch('.reveal', {
      start: 'top 88%',
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.1, stagger: 0.1, ease: 'expo.out', overwrite: true }),
    });

    // parede do final gira devagar
    gsap.set('[data-wall-flat]', { xPercent: -50, yPercent: -50, left: '50%', top: '50%', rotationX: 18, rotationZ: 8, scale: 1.1 });
    gsap.fromTo('[data-wall-flat]', { rotationZ: 14, scale: 1.3 }, { rotationZ: 4, scale: 1.05, ease: 'none', scrollTrigger: { trigger: '.finale', start: 'top bottom', end: 'bottom bottom', scrub: 1 } });

    // botões magnéticos
    if (desktop) {
      document.querySelectorAll('[data-magnetic]').forEach((btn) => {
        const xTo = gsap.quickTo(btn, 'x', { duration: 0.6, ease: 'power3' });
        const yTo = gsap.quickTo(btn, 'y', { duration: 0.6, ease: 'power3' });
        btn.addEventListener('mousemove', (e) => {
          const r = btn.getBoundingClientRect();
          xTo((e.clientX - r.left - r.width / 2) * 0.35);
          yTo((e.clientY - r.top - r.height / 2) * 0.35);
        });
        btn.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
      });
    }
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
}
