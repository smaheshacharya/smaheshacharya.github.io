import { api } from '../api.js';
import { isAdmin } from '../auth.js';
import { observeReveals } from '../main.js';
import { postCardHTML, wirePostCards } from '../postcard.js';
import { setSEO } from '../seo.js';

export async function renderBlog(root) {
  const admin = await isAdmin();
  const [posts, drafts] = await Promise.all([
    api.posts(),
    admin ? api.drafts() : Promise.resolve([])
  ]);

  setSEO({
    title: 'Blog',
    description: 'LinkedIn-style notes on data science, machine learning and AI engineering by Mahesh Acharya.',
    type: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Mahesh Acharya — Blog',
      url: location.href,
      author: { '@type': 'Person', name: 'Mahesh Acharya' }
    }
  });

  root.innerHTML = `
    <section class="section blog-page">
      <div class="container">
        <div class="section__label">Blog</div>
        <h2 class="section__title">All posts</h2>

        ${admin && drafts.length ? `
          <div class="blog-page__drafts">
            <div class="blog-page__drafts-head">
              <h3 class="blog-page__drafts-title">Drafts</h3>
              <span class="blog-page__drafts-badge">admin only · ${drafts.length}</span>
            </div>
            <div class="li-feed">
              ${drafts.map(p => postCardHTML(p, { draft: true })).join('')}
            </div>
          </div>
        ` : ''}

        <div class="li-feed">
          ${posts.length === 0
            ? `<p class="muted">No published posts yet.</p>`
            : posts.map(p => postCardHTML(p)).join('')}
        </div>
      </div>
    </section>
  `;

  observeReveals(root);
  wirePostCards(root);
}
