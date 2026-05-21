import { startRouter } from './router.js';

/* ── Nav: scroll + mobile burger ──────────────────────── */
const nav    = document.getElementById('nav');
const burger = document.getElementById('nav-burger');
const links  = document.getElementById('nav-links');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

burger.addEventListener('click', () => {
  const open = burger.classList.toggle('open');
  links.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', open);
});

links.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    burger.classList.remove('open');
    links.classList.remove('open');
    burger.setAttribute('aria-expanded', false);
  });
});

/* ── Reveal-on-scroll (re-observed by views after render) ──── */
export const revealObserver = new IntersectionObserver(
  entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); revealObserver.unobserve(e.target); }
  }),
  { threshold: 0.12 }
);

export function observeReveals(root = document) {
  root.querySelectorAll('.reveal:not(.visible)').forEach(el => revealObserver.observe(el));
}

startRouter();
