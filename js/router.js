import { renderHome }  from './views/home.js';
import { renderBlog }  from './views/blog.js';
import { renderPost }  from './views/post.js';
import { renderAdmin } from './views/admin.js';
import { setSEO }      from './seo.js';

const routes = [
  { match: /^\/?$/,              view: renderHome,  title: 'Mahesh Acharya — Data Scientist & AI Engineer' },
  { match: /^\/blog\/?$/,        view: renderBlog,  title: 'Blog · Mahesh Acharya' },
  { match: /^\/blog\/([^/]+)$/,  view: renderPost,  title: 'Post · Mahesh Acharya' },
  { match: /^\/admin\/?$/,       view: renderAdmin, title: 'Admin · Mahesh Acharya' }
];

function parseHash() {
  // Strip leading '#' and any trailing in-page anchor (e.g. '#/#about' → '/')
  let raw = (location.hash || '#/').replace(/^#/, '') || '/';
  raw = raw.replace(/#.*$/, '') || '/';
  return raw.startsWith('/') ? raw : '/' + raw;
}

async function dispatch() {
  const path = parseHash();
  const root = document.getElementById('app');
  const nav  = document.getElementById('nav');

  for (const r of routes) {
    const m = path.match(r.match);
    if (m) {
      document.title = r.title;
      nav.classList.toggle('nav--solid', path !== '/');
      try {
        await r.view(root, m.slice(1));
      } catch (err) {
        console.error('[router] view failed', err);
        setSEO({ title: 'Error', description: 'Something went wrong.', noindex: true });
        root.innerHTML = `<section class="section"><div class="container">
          <h2 class="section__title">Something went wrong</h2>
          <p class="muted">${escapeHtml(err.message || String(err))}</p>
        </div></section>`;
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }
  }

  setSEO({ title: 'Page not found', description: 'No such page.', noindex: true });
  root.innerHTML = `<section class="section"><div class="container">
    <h2 class="section__title">404</h2>
    <p class="muted">No route for <code>${escapeHtml(path)}</code>.</p>
    <p><a class="btn btn--ghost" href="#/">Back home</a></p>
  </div></section>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

let lastPath = null;
export function startRouter() {
  window.addEventListener('hashchange', () => {
    const p = parseHash();
    if (p === lastPath) {
      // same route, only the in-page anchor changed — just scroll
      const anchor = (location.hash.match(/#[^#]*#(.+)$/) || [])[1];
      if (anchor) {
        const el = document.getElementById(anchor);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }
    lastPath = p;
    dispatch();
  });
  lastPath = parseHash();
  dispatch();
}

export function navigate(path) {
  location.hash = path.startsWith('#') ? path : '#' + path;
}
