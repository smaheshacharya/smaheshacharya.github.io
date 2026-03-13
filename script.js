/* ═══════════════════════════════════════════════════════════
   MAHESH ACHARYA — Personal Website Scripts
   ═══════════════════════════════════════════════════════════ */

/* ── Nav: scroll effect ─────────────────────────────────── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

/* ── Nav: mobile burger ─────────────────────────────────── */
const burger = document.querySelector('.nav__burger');
const navLinks = document.querySelector('.nav__links');

burger.addEventListener('click', () => {
  const isOpen = burger.classList.toggle('open');
  navLinks.classList.toggle('open', isOpen);
  burger.setAttribute('aria-expanded', isOpen);
});

// Close menu when a link is clicked
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    burger.classList.remove('open');
    navLinks.classList.remove('open');
    burger.setAttribute('aria-expanded', false);
  });
});

/* ── Newsletter form ────────────────────────────────────── */
const SUBSTACK_URL = 'https://acharyamahesh.substack.com';

const newsletterForm = document.getElementById('newsletter-form');
const newsletterMsg  = document.getElementById('newsletter-msg');

if (newsletterForm) {
  newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('newsletter-email').value.trim();
    if (!email) return;

    window.open(`${SUBSTACK_URL}/subscribe?email=${encodeURIComponent(email)}`, '_blank', 'noopener');

    newsletterMsg.textContent = 'Opening Substack — complete your subscription there!';
    newsletterMsg.className = 'newsletter__msg newsletter__msg--success';
    newsletterForm.reset();

    setTimeout(() => {
      newsletterMsg.textContent = '';
      newsletterMsg.className = 'newsletter__msg';
    }, 5000);
  });
}

/* ── Reveal on scroll ───────────────────────────────────── */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
