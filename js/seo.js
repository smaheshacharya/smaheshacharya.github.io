/* ─────────────────────────────────────────────────────────────
   Dynamic SEO — title, meta description, Open Graph, Twitter
   cards, canonical link, and JSON-LD structured data.
   Called by each view on render.
   ───────────────────────────────────────────────────────────── */

const SITE_NAME   = 'Mahesh Acharya';
const SITE_AUTHOR = 'Mahesh Acharya';

function upsertMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (content == null || content === '') { if (el) el.remove(); return; }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); document.head.appendChild(el); }
  el.setAttribute('href', href);
}

/**
 * @param {object} o
 * @param {string} o.title        page title (site name is appended automatically)
 * @param {string} o.description  meta description (~155 chars ideal)
 * @param {string} [o.image]      absolute image URL for social cards
 * @param {string} [o.type]       og:type — 'website' | 'article' | 'profile'
 * @param {boolean}[o.noindex]    true → tell crawlers not to index
 * @param {object} [o.jsonLd]     schema.org structured-data object
 */
export function setSEO({ title, description, image, type = 'website', noindex = false, jsonLd = null }) {
  const fullTitle = title ? `${title} · ${SITE_NAME}` : SITE_NAME;
  const url = location.href;
  const desc = description || '';

  document.title = title || SITE_NAME;
  upsertMeta('name', 'description', desc);
  upsertMeta('name', 'author', SITE_AUTHOR);
  upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');

  // Open Graph (LinkedIn / Facebook)
  upsertMeta('property', 'og:title', fullTitle);
  upsertMeta('property', 'og:description', desc);
  upsertMeta('property', 'og:type', type);
  upsertMeta('property', 'og:url', url);
  upsertMeta('property', 'og:site_name', SITE_NAME);
  upsertMeta('property', 'og:image', image || null);

  // Twitter card
  upsertMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
  upsertMeta('name', 'twitter:title', fullTitle);
  upsertMeta('name', 'twitter:description', desc);
  upsertMeta('name', 'twitter:image', image || null);

  upsertLink('canonical', url);

  // JSON-LD structured data
  let ld = document.getElementById('jsonld');
  if (jsonLd) {
    if (!ld) {
      ld = document.createElement('script');
      ld.type = 'application/ld+json';
      ld.id = 'jsonld';
      document.head.appendChild(ld);
    }
    ld.textContent = JSON.stringify(jsonLd);
  } else if (ld) {
    ld.remove();
  }
}

/* Convenience builders ------------------------------------------------ */

export function personJsonLd(meta = {}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: SITE_AUTHOR,
    jobTitle: meta.meta_role || 'Data Scientist & ML Engineer',
    description: meta.seo_description || meta.hero_sub || '',
    url: location.origin + location.pathname,
    sameAs: [
      'https://www.linkedin.com/in/mahesh-acharya-data/',
      'https://acharyamahesh.substack.com/'
    ],
    worksFor: { '@type': 'Organization', name: 'AlphaTEDS Technology' }
  };
}

export function postJsonLd(post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.seo_description || post.excerpt || '',
    image: post.cover_url || undefined,
    datePublished: post.published_at || undefined,
    dateModified: post.updated_at || post.published_at || undefined,
    author:    { '@type': 'Person', name: SITE_AUTHOR, url: 'https://www.linkedin.com/in/mahesh-acharya-data/' },
    publisher: { '@type': 'Person', name: SITE_AUTHOR },
    mainEntityOfPage: location.href
  };
}
