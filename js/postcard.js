/* ─────────────────────────────────────────────────────────────
   LinkedIn-style post card — shared by the home preview and the
   /blog page. Includes the engagement bar so visitors can drop a
   coin straight from the card.
   ───────────────────────────────────────────────────────────── */
import { wireClap } from './clap.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

function relTime(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = diff / 6e4, h = m / 60, d = h / 24, w = d / 7, mo = d / 30, y = d / 365;
  if (m < 1)  return 'Just now';
  if (m < 60) return Math.floor(m) + 'm';
  if (h < 24) return Math.floor(h) + 'h';
  if (d < 7)  return Math.floor(d) + 'd';
  if (w < 5)  return Math.floor(w) + 'w';
  if (mo < 12)return Math.floor(mo) + 'mo';
  return Math.floor(y) + 'y';
}

/**
 * @param {object}  post           row from `posts`
 * @param {object}  [opts]
 * @param {boolean} [opts.draft]   render as an unpublished draft
 */
export function postCardHTML(post, { draft = false } = {}) {
  const href = `#/blog/${encodeURIComponent(post.slug)}`;
  return `
    <article class="li-card reveal" data-slug="${esc(post.slug)}">
      <div class="li-card__head">
        <div class="li-card__avatar">M</div>
        <div class="li-card__id">
          <p class="li-card__name">
            Mahesh Acharya
            ${draft ? '<span class="li-card__draft">Draft</span>' : '<span class="li-card__dot">·</span><span class="li-card__you">1st</span>'}
          </p>
          <p class="li-card__headline">Co-founder @ AlphaTEDS · Data Scientist</p>
          <p class="li-card__time">${draft ? 'Unpublished' : esc(relTime(post.published_at))} · <span aria-hidden="true">🌐</span></p>
        </div>
        <span class="li-card__logo">MA</span>
      </div>

      ${post.cover_url ? `<a href="${href}" class="li-card__cover-link">
        <img class="li-card__cover" src="${esc(post.cover_url)}" alt="" loading="lazy" />
      </a>` : ''}

      <a class="li-card__body" href="${href}">
        <h3 class="li-card__title">${esc(post.title)}</h3>
        ${post.excerpt ? `<p class="li-card__excerpt">${esc(post.excerpt)}</p>` : ''}
      </a>

      <div class="li-card__count">
        <span class="li-card__coin-badge">🪙</span>
        <span data-clap-total>${post.claps ?? 0}</span>&nbsp;coins
      </div>

      <div class="li-card__actions">
        <button class="li-card__btn li-card__btn--clap" data-clap-btn ${draft ? 'disabled' : ''}>
          <span class="li-card__btn-icon">🪙</span> Give a coin
        </button>
        <a class="li-card__btn" href="${href}">
          <span class="li-card__btn-icon">📖</span> Read post
        </a>
        ${draft ? `<a class="li-card__btn" href="#/admin"><span class="li-card__btn-icon">✏️</span> Edit</a>` : ''}
      </div>
    </article>
  `;
}

/** Activate clap buttons on every card inside `root`. */
export function wirePostCards(root) {
  root.querySelectorAll('.li-card').forEach(card => {
    const btn   = card.querySelector('[data-clap-btn]');
    const total = card.querySelector('[data-clap-total]');
    if (!btn || btn.disabled || !total) return;
    wireClap({
      btn, total, slug: card.dataset.slug,
      onPop: () => { btn.classList.add('pop'); setTimeout(() => btn.classList.remove('pop'), 250); }
    });
  });
}
