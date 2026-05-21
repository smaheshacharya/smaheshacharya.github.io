import { sb } from './supabase.js';

const cache = new Map();
const CACHE_MS = 60_000;

async function cached(key, fn) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < CACHE_MS) return hit.v;
  const v = await fn();
  cache.set(key, { t: Date.now(), v });
  return v;
}

export function clearCache(key) {
  if (key) cache.delete(key); else cache.clear();
}

function take(res) {
  if (res.error) throw res.error;
  return res.data ?? [];
}

export const api = {
  siteMeta: () => cached('site_meta', async () =>
    take(await sb.from('site_meta').select('*').eq('id', 1).maybeSingle().then(r => ({ data: r.data ? [r.data] : [], error: r.error })))[0] || {}
  ),

  stats:        () => cached('stats',        async () => take(await sb.from('stats').select('*').order('sort_order'))),
  skillGroups:  () => cached('skill_groups', async () => take(await sb.from('skill_groups').select('*').order('sort_order'))),
  experiences:  () => cached('experiences',  async () => take(await sb.from('experiences').select('*').order('sort_order'))),
  education:    () => cached('education',    async () => take(await sb.from('education').select('*').order('sort_order'))),
  projects:     () => cached('projects',     async () => take(await sb.from('projects').select('*').order('sort_order'))),
  volunteering: () => cached('volunteering', async () => take(await sb.from('volunteering').select('*').order('sort_order'))),

  posts: (limit) => cached('posts:' + (limit ?? 'all'), async () => {
    let q = sb.from('posts')
      .select('id, slug, title, excerpt, claps, cover_url, published_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false });
    if (limit) q = q.limit(limit);
    return take(await q);
  }),

  // No is_published filter — RLS shows published to everyone and
  // drafts only to the admin, so admins can preview unpublished posts.
  postBySlug: async (slug) => {
    const { data, error } = await sb.from('posts').select('*').eq('slug', slug).maybeSingle();
    if (error) throw error;
    return data;
  },

  // Admin-only: unpublished posts (RLS blocks non-admins → empty).
  drafts: async () => {
    const { data, error } = await sb.from('posts')
      .select('id, slug, title, excerpt, claps, cover_url, published_at, updated_at')
      .eq('is_published', false)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  clap: async (slug) => {
    const { data, error } = await sb.rpc('clap_post', { post_slug: slug });
    if (error) throw error;
    return data;
  },

  // ── admin (writes) ──
  upsert: async (table, row) => {
    const { data, error } = await sb.from(table).upsert(row).select().single();
    if (error) throw error;
    clearCache(table);
    return data;
  },
  remove: async (table, id) => {
    const { error } = await sb.from(table).delete().eq('id', id);
    if (error) throw error;
    clearCache(table);
  },
  // Admin list — bypasses the published filter for posts
  adminList: async (table) => {
    let q = sb.from(table).select('*');
    if (table === 'posts') q = q.order('published_at', { ascending: false, nullsFirst: false });
    else if (table === 'site_meta') q = q.eq('id', 1);
    else q = q.order('sort_order');
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  }
};
