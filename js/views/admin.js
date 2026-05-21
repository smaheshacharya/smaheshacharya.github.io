import { api } from '../api.js';
import { signIn, signOut, isAdmin, onAuthChange } from '../auth.js';
import { md } from '../md.js';
import { setSEO } from '../seo.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

// ── Schema: defines the fields each table exposes in the admin UI ──
const TABLES = {
  posts: {
    label: 'Blog posts',
    singular: 'post',
    fields: [
      { name: 'title',        label: 'Title',        type: 'text',     required: true },
      { name: 'slug',         label: 'Slug',         type: 'text',     required: true, hint: 'url-friendly, no spaces' },
      { name: 'excerpt',      label: 'Excerpt',      type: 'textarea', rows: 2, hint: 'short preview shown on cards' },
      { name: 'cover_url',    label: 'Cover image URL', type: 'text' },
      { name: 'content_md',   label: 'Content (Markdown)', type: 'markdown', rows: 18, required: true },
      { name: 'seo_title',       label: 'SEO title',       type: 'text',     hint: 'optional — overrides the post title in search & social previews' },
      { name: 'seo_description', label: 'SEO description', type: 'textarea', rows: 2, hint: 'optional — ~155 chars; defaults to the excerpt' },
      { name: 'is_published', label: 'Published',    type: 'checkbox' },
      { name: 'published_at', label: 'Publish date', type: 'datetime', hint: 'leave blank to use now when publishing' }
    ],
    summary: r => `${r.title} ${r.is_published ? '' : '— DRAFT'}`
  },
  experiences: {
    label: 'Experience',
    singular: 'experience',
    fields: [
      { name: 'role',       label: 'Role',       type: 'text', required: true },
      { name: 'company',    label: 'Company',    type: 'text', required: true },
      { name: 'badge',      label: 'Badge',      type: 'text', hint: 'e.g. Part Time' },
      { name: 'start_date', label: 'Start',      type: 'text', hint: 'e.g. Feb 2023' },
      { name: 'end_date',   label: 'End',        type: 'text', hint: 'e.g. Present' },
      { name: 'tech',       label: 'Tech',       type: 'array' },
      { name: 'bullets',    label: 'Bullets',    type: 'array-multiline', hint: 'one bullet per line, markdown allowed' },
      { name: 'sort_order', label: 'Sort order', type: 'number' }
    ],
    summary: r => `${r.role} @ ${r.company}`
  },
  projects: {
    label: 'Projects',
    singular: 'project',
    fields: [
      { name: 'title',       label: 'Title',       type: 'text', required: true },
      { name: 'year',        label: 'Year',        type: 'text' },
      { name: 'icon',        label: 'Icon (emoji)',type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea', rows: 4 },
      { name: 'tags',        label: 'Tags',        type: 'array' },
      { name: 'sort_order',  label: 'Sort order',  type: 'number' }
    ],
    summary: r => `${r.title}`
  },
  skill_groups: {
    label: 'Skill groups',
    singular: 'skill group',
    fields: [
      { name: 'name',       label: 'Name',  type: 'text', required: true },
      { name: 'items',      label: 'Items', type: 'array' },
      { name: 'color',      label: 'Color', type: 'select', options: ['gray','blue','green','purple'] },
      { name: 'sort_order', label: 'Sort order', type: 'number' }
    ],
    summary: r => `${r.name} (${(r.items || []).length})`
  },
  education: {
    label: 'Education',
    singular: 'entry',
    fields: [
      { name: 'degree',     label: 'Degree', type: 'text', required: true },
      { name: 'school',     label: 'School', type: 'text' },
      { name: 'thesis',     label: 'Thesis', type: 'textarea', rows: 3 },
      { name: 'start_year', label: 'Start year', type: 'number' },
      { name: 'end_year',   label: 'End year',   type: 'number' },
      { name: 'sort_order', label: 'Sort order', type: 'number' }
    ],
    summary: r => r.degree
  },
  volunteering: {
    label: 'Volunteering',
    singular: 'entry',
    fields: [
      { name: 'title',       label: 'Title',       type: 'text', required: true },
      { name: 'org',         label: 'Organization',type: 'text' },
      { name: 'date',        label: 'Date',        type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea', rows: 4 },
      { name: 'sort_order',  label: 'Sort order',  type: 'number' }
    ],
    summary: r => r.title
  },
  stats: {
    label: 'Hero stats',
    singular: 'stat',
    fields: [
      { name: 'label',      label: 'Label', type: 'text', required: true },
      { name: 'value',      label: 'Value', type: 'text', required: true },
      { name: 'sort_order', label: 'Sort order', type: 'number' }
    ],
    summary: r => `${r.value} ${r.label}`
  },
  site_meta: {
    label: 'Site meta',
    singular: 'site meta',
    singleton: true,
    fields: [
      { name: 'hero_badge',   label: 'Hero badge',   type: 'text' },
      { name: 'hero_title',   label: 'Hero title',   type: 'textarea', rows: 2 },
      { name: 'hero_sub',     label: 'Hero subtitle',type: 'textarea', rows: 2 },
      { name: 'about_md',     label: 'About (markdown)', type: 'markdown', rows: 8 },
      { name: 'avatar_letter',label: 'Avatar letter',type: 'text' },
      { name: 'meta_based_in',label: 'Based in',     type: 'text' },
      { name: 'meta_role',    label: 'Role',         type: 'text' },
      { name: 'meta_focus',   label: 'Focus',        type: 'text' },
      { name: 'meta_edu',     label: 'Education',    type: 'text' },
      { name: 'seo_title',       label: 'SEO title (home page)',       type: 'text',     hint: 'optional — browser tab & social title; defaults to your name' },
      { name: 'seo_description', label: 'SEO description (home page)', type: 'textarea', rows: 2, hint: 'optional — defaults to the hero subtitle' },
      { name: 'og_image',        label: 'Social share image URL',      type: 'text',     hint: 'optional — image shown when the site is shared on LinkedIn / Twitter' }
    ]
  }
};

export async function renderAdmin(root) {
  setSEO({ title: 'Admin', description: 'Site administration.', noindex: true });
  if (!(await isAdmin())) {
    return renderLogin(root);
  }
  renderShell(root);
}

// ── Login screen ───────────────────────────────────────────────

function renderLogin(root) {
  root.innerHTML = `
    <section class="section admin-login">
      <div class="container container--narrow">
        <h2 class="section__title">Admin sign-in</h2>
        <p class="muted">Only the site owner can access this area.</p>
        <form class="admin-form" id="login-form">
          <label class="admin-field">
            <span>Email</span>
            <input type="email" id="login-email" required autocomplete="email" />
          </label>
          <label class="admin-field">
            <span>Password</span>
            <input type="password" id="login-password" required autocomplete="current-password" />
          </label>
          <button type="submit" class="btn btn--primary">Sign in</button>
          <p class="admin-msg" id="login-msg" aria-live="polite"></p>
        </form>
      </div>
    </section>
  `;

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const msg      = document.getElementById('login-msg');
    msg.textContent = 'Signing in…';
    try {
      await signIn(email, password);
      msg.textContent = '';
      renderShell(root);
    } catch (err) {
      msg.textContent = err.message || 'Sign in failed.';
      msg.className = 'admin-msg admin-msg--error';
    }
  });
}

// ── Admin shell with sidebar ───────────────────────────────────

let currentTab = 'posts';

function renderShell(root) {
  root.innerHTML = `
    <section class="section admin">
      <div class="container admin__container">

        <header class="admin__header">
          <h2 class="admin__title">Admin panel</h2>
          <button class="btn btn--ghost" id="signout-btn">Sign out</button>
        </header>

        <div class="admin__layout">
          <aside class="admin__sidebar">
            ${Object.entries(TABLES).map(([key, t]) => `
              <button class="admin__nav-btn ${key === currentTab ? 'is-active' : ''}" data-tab="${key}">
                ${esc(t.label)}
              </button>
            `).join('')}
          </aside>
          <div class="admin__main" id="admin-main"></div>
        </div>

      </div>
    </section>
  `;

  document.getElementById('signout-btn').addEventListener('click', async () => {
    await signOut();
    renderLogin(root);
  });

  root.querySelectorAll('.admin__nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentTab = btn.dataset.tab;
      root.querySelectorAll('.admin__nav-btn').forEach(b => b.classList.toggle('is-active', b === btn));
      renderTab();
    });
  });

  renderTab();
}

async function renderTab() {
  const main = document.getElementById('admin-main');
  const def  = TABLES[currentTab];
  main.innerHTML = `<p class="muted">Loading…</p>`;

  try {
    const rows = await api.adminList(currentTab);

    if (def.singleton) {
      const row = rows[0] || { id: 1 };
      main.innerHTML = renderForm(def, row, /*isNew*/ !rows[0]);
      wireForm(main.querySelector('form'), currentTab, def, row);
      return;
    }

    main.innerHTML = `
      <div class="admin__main-head">
        <h3 class="admin__main-title">${esc(def.label)}</h3>
        <button class="btn btn--primary" id="new-btn">+ New ${esc(def.singular)}</button>
      </div>

      <ul class="admin__list">
        ${rows.length === 0
          ? `<li class="muted admin__empty">No entries yet.</li>`
          : rows.map(r => `
            <li class="admin__row" data-id="${esc(r.id)}">
              <span class="admin__row-title">${esc(def.summary(r))}</span>
              <span class="admin__row-actions">
                <button class="btn btn--ghost btn--sm" data-action="edit">Edit</button>
                <button class="btn btn--danger btn--sm" data-action="delete">Delete</button>
              </span>
            </li>
          `).join('')}
      </ul>

      <div id="admin-editor"></div>
    `;

    main.querySelector('#new-btn').addEventListener('click', () => openEditor({}, true));

    main.querySelectorAll('.admin__row').forEach(li => {
      const id  = li.dataset.id;
      const row = rows.find(r => String(r.id) === id);
      li.querySelector('[data-action="edit"]').addEventListener('click', () => openEditor(row, false));
      li.querySelector('[data-action="delete"]').addEventListener('click', async () => {
        if (!confirm(`Delete "${def.summary(row)}"?`)) return;
        await api.remove(currentTab, id);
        renderTab();
      });
    });
  } catch (err) {
    main.innerHTML = `<p class="admin-msg admin-msg--error">${esc(err.message || err)}</p>`;
  }
}

function openEditor(row, isNew) {
  const editor = document.getElementById('admin-editor');
  const def    = TABLES[currentTab];
  editor.innerHTML = renderForm(def, row, isNew);
  wireForm(editor.querySelector('form'), currentTab, def, row);
  editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Field rendering ────────────────────────────────────────────

function renderForm(def, row, isNew) {
  return `
    <form class="admin-form" data-form>
      <h4 class="admin-form__title">${isNew ? 'New' : 'Edit'} ${esc(def.singular)}</h4>
      ${def.fields.map(f => renderField(f, row[f.name])).join('')}
      <div class="admin-form__actions">
        <button type="submit" class="btn btn--primary">${isNew ? 'Create' : 'Save'}</button>
        <button type="button" class="btn btn--ghost" data-action="cancel">Cancel</button>
      </div>
      <p class="admin-msg" data-msg aria-live="polite"></p>
    </form>
  `;
}

function renderField(f, val) {
  const id = `f-${f.name}`;
  const hint = f.hint ? `<small class="admin-field__hint">${esc(f.hint)}</small>` : '';
  const req  = f.required ? ' required' : '';

  switch (f.type) {
    case 'text':
      return wrap(f, `<input id="${id}" name="${f.name}" type="text" value="${esc(val ?? '')}"${req} />${hint}`);
    case 'number':
      return wrap(f, `<input id="${id}" name="${f.name}" type="number" value="${val ?? ''}"${req} />${hint}`);
    case 'textarea':
      return wrap(f, `<textarea id="${id}" name="${f.name}" rows="${f.rows || 4}"${req}>${esc(val ?? '')}</textarea>${hint}`);
    case 'markdown':
      return wrap(f, `
        <div class="md-editor">
          <textarea id="${id}" name="${f.name}" rows="${f.rows || 12}"${req} data-md>${esc(val ?? '')}</textarea>
          <div class="md-preview markdown" data-md-preview></div>
        </div>${hint}`);
    case 'checkbox':
      return wrap(f, `<input id="${id}" name="${f.name}" type="checkbox" ${val ? 'checked' : ''} />${hint}`, /*compact*/ true);
    case 'datetime': {
      const v = val ? new Date(val).toISOString().slice(0, 16) : '';
      return wrap(f, `<input id="${id}" name="${f.name}" type="datetime-local" value="${v}" />${hint}`);
    }
    case 'select':
      return wrap(f, `
        <select id="${id}" name="${f.name}">
          ${(f.options || []).map(o => `<option value="${esc(o)}" ${o === val ? 'selected' : ''}>${esc(o)}</option>`).join('')}
        </select>${hint}`);
    case 'array':
      return wrap(f, `<input id="${id}" name="${f.name}" type="text" value="${esc((val || []).join(', '))}" data-type="array" />${hint || '<small class="admin-field__hint">comma-separated</small>'}`);
    case 'array-multiline':
      return wrap(f, `<textarea id="${id}" name="${f.name}" rows="${f.rows || 5}" data-type="array-multiline">${esc((val || []).join('\n'))}</textarea>${hint || '<small class="admin-field__hint">one item per line</small>'}`);
    default:
      return '';
  }
}

function wrap(f, inner, compact = false) {
  return `<label class="admin-field${compact ? ' admin-field--row' : ''}">
    <span>${esc(f.label)}</span>
    ${inner}
  </label>`;
}

// ── Form wiring ────────────────────────────────────────────────

function wireForm(form, table, def, original) {
  // Markdown live preview
  form.querySelectorAll('[data-md]').forEach(ta => {
    const preview = ta.parentElement.querySelector('[data-md-preview]');
    const update  = () => { preview.innerHTML = md(ta.value || ''); };
    ta.addEventListener('input', update);
    update();
  });

  // Cancel
  const cancel = form.querySelector('[data-action="cancel"]');
  if (cancel) cancel.addEventListener('click', () => { form.closest('#admin-editor').innerHTML = ''; });

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = form.querySelector('[data-msg]');
    msg.textContent = 'Saving…';
    msg.className = 'admin-msg';

    try {
      const row = collect(form, def);
      // Preserve id (and singleton id=1)
      if (original.id) row.id = original.id;
      else if (def.singleton) row.id = 1;

      // For posts: if marked published and no published_at, set now
      if (table === 'posts' && row.is_published && !row.published_at) {
        row.published_at = new Date().toISOString();
      }

      await api.upsert(table, row);
      msg.textContent = 'Saved.';
      msg.className = 'admin-msg admin-msg--ok';
      setTimeout(() => renderTab(), 400);
    } catch (err) {
      console.error(err);
      msg.textContent = err.message || String(err);
      msg.className = 'admin-msg admin-msg--error';
    }
  });
}

function collect(form, def) {
  const out = {};
  for (const f of def.fields) {
    const el = form.elements[f.name];
    if (!el) continue;

    if (f.type === 'checkbox') {
      out[f.name] = el.checked;
    } else if (f.type === 'number') {
      out[f.name] = el.value === '' ? null : Number(el.value);
    } else if (f.type === 'datetime') {
      out[f.name] = el.value ? new Date(el.value).toISOString() : null;
    } else if (f.type === 'array') {
      out[f.name] = el.value.split(',').map(s => s.trim()).filter(Boolean);
    } else if (f.type === 'array-multiline') {
      out[f.name] = el.value.split('\n').map(s => s.trim()).filter(Boolean);
    } else {
      const v = el.value;
      out[f.name] = v === '' ? null : v;
    }
  }
  return out;
}

// ── Re-render admin when auth state changes ────────────────────
onAuthChange(() => {
  if (location.hash.startsWith('#/admin')) {
    const root = document.getElementById('app');
    if (root) renderAdmin(root);
  }
});
