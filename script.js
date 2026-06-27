const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const resumeLinks = $$('[data-resume-link]');
const langButtons = $$('[data-set-lang]');
const nav = $('.nav');
const header = $('.header');
let mobileMenuOpen = false;

// Mobile menu toggle
header.addEventListener('click', (e) => {
  const clickTarget = e.target.closest('.brand') || e.target.closest('.lang-toggle');
  if (!clickTarget) {
    mobileMenuOpen = !mobileMenuOpen;
    nav.classList.toggle('active', mobileMenuOpen);
  }
});

// Close menu when clicking on a link
nav.addEventListener('click', () => {
  mobileMenuOpen = false;
  nav.classList.remove('active');
});

function setLang(lang) {
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
  document.documentElement.dataset.lang = lang;

  $$('[data-en]').forEach((el) => {
    const value = el.dataset[lang === 'pt' ? 'pt' : 'en'];
    if (value) el.textContent = value;
  });

  resumeLinks.forEach((link) => {
    link.href = lang === 'pt'
      ? 'assets/curriculo-fernando-parmezani-ptbr.pdf'
      : 'assets/resume-fernando-parmezani-en.pdf';
  });

  langButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.setLang === lang);
  });

  localStorage.setItem('portfolioLanguage', lang);
}

langButtons.forEach((button) => {
  button.addEventListener('click', () => setLang(button.dataset.setLang));
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

$$('.reveal').forEach((el) => observer.observe(el));
$('#year').textContent = new Date().getFullYear();
setLang(localStorage.getItem('portfolioLanguage') || 'en');
