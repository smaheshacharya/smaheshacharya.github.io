import { api } from '../api.js';
import { observeReveals } from '../main.js';
import { md } from '../md.js';
import { postCardHTML, wirePostCards } from '../postcard.js';
import { setSEO, personJsonLd } from '../seo.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

const colorClass = c => ({ blue:'tag--blue', green:'tag--green', purple:'tag--purple' }[c] || '');

export async function renderHome(root) {
  const [meta, stats, skills, exp, edu, projects, vols, posts] = await Promise.all([
    api.siteMeta(), api.stats(), api.skillGroups(), api.experiences(),
    api.education(), api.projects(), api.volunteering(), api.posts(3)
  ]);

  setSEO({
    title:       meta.seo_title || null,   // null → just the site name
    description: meta.seo_description || meta.hero_sub || '',
    image:       meta.og_image || undefined,
    type:        'profile',
    jsonLd:      personJsonLd(meta)
  });

  root.innerHTML = `
    <section class="hero" id="hero">
      <div class="hero__bg-grid"></div>
      <div class="hero__content">
        ${meta.hero_badge ? `<div class="hero__badge">${esc(meta.hero_badge)}</div>` : ''}
        <h1 class="hero__name">Mahesh<br /><span class="hero__name--accent">Acharya</span></h1>
        <p class="hero__title">${esc(meta.hero_title || '')}</p>
        <p class="hero__sub">${esc(meta.hero_sub || '')}</p>
        <div class="hero__cta">
          <a href="#/#contact" class="btn btn--primary">Get in touch</a>
          <a href="#/#experience" class="btn btn--ghost">View work</a>
        </div>
        <div class="hero__stats">
          ${stats.map((s, i) => `
            ${i > 0 ? '<div class="stat__divider"></div>' : ''}
            <div class="stat">
              <span class="stat__num">${esc(s.value)}</span>
              <span class="stat__lbl">${esc(s.label)}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="hero__scroll-hint" aria-hidden="true"><div class="hero__scroll-line"></div></div>
    </section>

    <section class="section" id="about">
      <div class="container">
        <div class="section__label">01 / About</div>
        <h2 class="section__title">Who I am</h2>
        <div class="about__grid">
          <div class="about__text">
            ${md(meta.about_md || '')}
            <div class="about__links">
              <a href="mailto:mahesh01acharya@gmail.com" class="icon-link">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                mahesh01acharya@gmail.com
              </a>
              <a href="https://www.linkedin.com/in/mahesh-acharya-data/" target="_blank" rel="noopener" class="icon-link">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                linkedin.com/in/mahesh-acharya-data
              </a>
            </div>
          </div>
          <div class="about__card">
            <div class="about__avatar"><div class="about__avatar-inner">${esc(meta.avatar_letter || 'M')}</div></div>
            <div class="about__meta">
              ${meta.meta_based_in ? metaItem('Based in', meta.meta_based_in) : ''}
              ${meta.meta_role     ? metaItem('Role',     meta.meta_role)     : ''}
              ${meta.meta_focus    ? metaItem('Focus',    meta.meta_focus)    : ''}
              ${meta.meta_edu      ? metaItem('Education',meta.meta_edu)      : ''}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section section--alt" id="skills">
      <div class="container">
        <div class="section__label">02 / Skills</div>
        <h2 class="section__title">Tech stack</h2>
        <div class="skills__grid">
          ${skills.map(g => `
            <div class="skill-group">
              <h3 class="skill-group__title">${esc(g.name)}</h3>
              <div class="skill-tags">
                ${(g.items || []).map(it => `<span class="tag ${colorClass(g.color)}">${esc(it)}</span>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <section class="section" id="experience">
      <div class="container">
        <div class="section__label">03 / Experience</div>
        <h2 class="section__title">Where I've worked</h2>
        <div class="timeline">
          ${exp.map(e => `
            <div class="timeline__item reveal">
              <div class="timeline__dot"></div>
              <div class="timeline__card">
                <div class="timeline__header">
                  <div>
                    <h3 class="timeline__role">${esc(e.role)} ${e.badge ? `<span class="badge">${esc(e.badge)}</span>` : ''}</h3>
                    <p class="timeline__company">${esc(e.company)}</p>
                  </div>
                  <span class="timeline__date">${esc(e.start_date || '')} ${e.end_date ? '— ' + esc(e.end_date) : ''}</span>
                </div>
                <div class="timeline__tech">
                  ${(e.tech || []).map(t => `<span class="chip">${esc(t)}</span>`).join('')}
                </div>
                <ul class="timeline__list">
                  ${(e.bullets || []).map(b => `<li>${md(b, { inline: true })}</li>`).join('')}
                </ul>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <section class="section section--alt" id="education">
      <div class="container">
        <div class="section__label">04 / Education</div>
        <h2 class="section__title">Academic background</h2>
        ${edu.map(e => `
          <div class="edu__card reveal">
            <div class="edu__icon">🎓</div>
            <div class="edu__body">
              <h3>${esc(e.degree)}</h3>
              ${e.school ? `<p class="edu__uni">${esc(e.school)}</p>` : ''}
              ${e.thesis ? `<p class="edu__thesis"><strong>Thesis:</strong> ${esc(e.thesis)}</p>` : ''}
            </div>
            <span class="edu__date">${e.start_year || ''} – ${e.end_year || ''}</span>
          </div>
        `).join('')}
      </div>
    </section>

    <section class="section" id="projects">
      <div class="container">
        <div class="section__label">05 / Projects &amp; Awards</div>
        <h2 class="section__title">Highlights</h2>
        <div class="cards">
          ${projects.map(p => `
            <div class="card reveal">
              <div class="card__top">
                <span class="card__icon">${esc(p.icon || '✦')}</span>
                <span class="card__year">${esc(p.year || '')}</span>
              </div>
              <h3 class="card__title">${esc(p.title)}</h3>
              <p class="card__desc">${esc(p.description || '')}</p>
              <div class="card__tags">
                ${(p.tags || []).map(t => `<span class="chip">${esc(t)}</span>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <section class="section section--alt" id="volunteering">
      <div class="container">
        <div class="section__label">06 / Volunteering</div>
        <h2 class="section__title">Giving back</h2>
        <div class="vol__list">
          ${vols.map(v => `
            <div class="vol__item reveal">
              <div class="vol__marker"></div>
              <div class="vol__body">
                <div class="vol__header">
                  <h3>${esc(v.title)}</h3>
                  <span class="vol__date">${esc(v.date || '')}</span>
                </div>
                ${v.org ? `<p class="vol__org">${esc(v.org)}</p>` : ''}
                ${v.description ? `<p>${esc(v.description)}</p>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <section class="section" id="blog-preview">
      <div class="container">
        <div class="section__label">07 / Blog</div>
        <h2 class="section__title">Latest posts</h2>
        <div class="li-feed">
          ${posts.length === 0
            ? `<p class="muted">No posts yet — add one from the <a href="#/admin">admin panel</a>.</p>`
            : posts.map(p => postCardHTML(p)).join('')}
        </div>
        ${posts.length > 0 ? `
          <div class="linkedin__view-all">
            <a href="#/blog" class="btn btn--ghost">
              View all posts
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M7 17 17 7M7 7h10v10"/></svg>
            </a>
          </div>` : ''}
      </div>
    </section>

    <section class="section section--alt" id="contact">
      <div class="container contact__wrap">
        <div class="section__label">08 / Contact</div>
        <h2 class="section__title">Let's connect</h2>
        <p class="contact__sub">Whether you have a project idea, a research collaboration, or just want to say hi — I'd love to hear from you.</p>
        <div class="contact__actions">
          <a href="mailto:mahesh01acharya@gmail.com" class="btn btn--primary btn--lg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            mahesh01acharya@gmail.com
          </a>
          <a href="https://www.linkedin.com/in/mahesh-acharya-data/" target="_blank" rel="noopener" class="btn btn--ghost btn--lg">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
            LinkedIn
          </a>
        </div>
      </div>
    </section>
  `;

  observeReveals(root);
  wirePostCards(root);
  handleAnchor();
}

function metaItem(k, v) {
  return `<div class="meta-item">
    <span class="meta-item__key">${esc(k)}</span>
    <span class="meta-item__val">${esc(v)}</span>
  </div>`;
}

// If URL has #/#section, scroll to that section after render
function handleAnchor() {
  const m = location.hash.match(/^#\/#(.+)$/);
  if (!m) return;
  const el = document.getElementById(m[1]);
  if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
}
