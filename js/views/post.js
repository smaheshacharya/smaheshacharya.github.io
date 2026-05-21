import { api } from '../api.js';
import { md } from '../md.js';
import { setSEO, postJsonLd } from '../seo.js';
import { wireClap, getLocalClaps, CLAP_CAP } from '../clap.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

const fmtDate = iso => iso
  ? new Date(iso).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
  : 'Unpublished';

export async function renderPost(root, [slug]) {
  const post = await api.postBySlug(slug);

  if (!post) {
    setSEO({ title: 'Post not found', description: 'This post does not exist or is not published.', noindex: true });
    root.innerHTML = `<section class="section"><div class="container">
      <h2 class="section__title">Post not found</h2>
      <p><a class="btn btn--ghost" href="#/blog">← Back to blog</a></p>
    </div></section>`;
    return;
  }

  // SEO — seo_title / seo_description override, fall back to title / excerpt
  setSEO({
    title:       post.seo_title || post.title,
    description: post.seo_description || post.excerpt || '',
    image:       post.cover_url || undefined,
    type:        'article',
    noindex:     !post.is_published,           // don't index drafts
    jsonLd:      post.is_published ? postJsonLd(post) : null
  });

  const localClaps = getLocalClaps(slug);

  root.innerHTML = `
    <article class="post">
      <div class="container container--narrow">

        <a href="#/blog" class="post__back">← All posts</a>

        ${!post.is_published ? `<div class="post__draft-banner">
          🔒 Draft — only you can see this. Publish it from the <a href="#/admin">admin panel</a>.
        </div>` : ''}

        <header class="post__header">
          <h1 class="post__title">${esc(post.title)}</h1>
          <div class="post__meta">
            <div class="post__author">
              <div class="post__author-avatar">M</div>
              <div>
                <p class="post__author-name">Mahesh Acharya</p>
                <p class="post__author-sub">${fmtDate(post.published_at)} · ${readingTime(post.content_md)} min read</p>
              </div>
            </div>
          </div>
        </header>

        ${post.cover_url ? `<img class="post__cover" src="${esc(post.cover_url)}" alt="" />` : ''}

        <div class="post__body markdown">${md(post.content_md || '')}</div>

        <div class="post__clap">
          <button class="clap-btn" id="clap-btn" aria-label="Give a coin to this post">
            <span class="clap-btn__icon">🪙</span>
            <span class="clap-btn__label">Tap to give a coin</span>
          </button>
          <div class="clap-stats">
            <span class="clap-stats__total" id="clap-total">${post.claps}</span>
            <span class="clap-stats__sub">total coins · <span id="clap-mine">${localClaps}</span>/${CLAP_CAP} from you</span>
          </div>
        </div>

        <div class="post__footer">
          <a href="#/blog" class="btn btn--ghost">← More posts</a>
          <a href="https://www.linkedin.com/in/mahesh-acharya-data/" target="_blank" rel="noopener" class="btn btn--primary">Follow on LinkedIn</a>
        </div>
      </div>
    </article>
  `;

  const btn = document.getElementById('clap-btn');
  wireClap({
    btn,
    total: document.getElementById('clap-total'),
    mine:  document.getElementById('clap-mine'),
    slug,
    onPop: () => { btn.classList.add('pop'); setTimeout(() => btn.classList.remove('pop'), 250); }
  });
}

function readingTime(mdSrc) {
  const words = (mdSrc || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
