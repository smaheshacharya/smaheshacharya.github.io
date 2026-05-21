/* ─────────────────────────────────────────────────────────────
   Shared "coin / clap" logic — used by the post page and the
   LinkedIn-style cards. localStorage caps repeat clicks per
   browser (Medium-style); the server RPC only ever does +1.
   ───────────────────────────────────────────────────────────── */
import { api } from './api.js';

export const CLAP_CAP = 50;

const key = slug => `clap:${slug}`;
export const getLocalClaps = slug => Number(localStorage.getItem(key(slug)) || 0);
const setLocalClaps = (slug, n) => localStorage.setItem(key(slug), String(n));

/**
 * Wire a clap button to a total counter.
 * @param {object} o
 * @param {HTMLElement} o.btn    the clickable button
 * @param {HTMLElement} o.total  element whose textContent is the total count
 * @param {HTMLElement} [o.mine] optional element showing this browser's count
 * @param {string} o.slug       post slug
 * @param {Function} [o.onPop]  callback fired on each successful click (animation)
 */
export function wireClap({ btn, total, mine, slug, onPop }) {
  let mineN = getLocalClaps(slug);
  let busy  = false;

  const refresh = () => {
    if (mine) mine.textContent = mineN;
    btn.disabled = mineN >= CLAP_CAP;
    btn.classList.toggle('is-maxed', mineN >= CLAP_CAP);
  };
  refresh();

  btn.addEventListener('click', async () => {
    if (busy || mineN >= CLAP_CAP) return;
    busy = true;

    const before = Number(String(total.textContent).replace(/[^\d-]/g, '') || 0);
    total.textContent = String(before + 1);
    mineN += 1;
    setLocalClaps(slug, mineN);
    refresh();
    if (onPop) onPop();

    try {
      const newTotal = await api.clap(slug);
      if (typeof newTotal === 'number' && newTotal >= 0) total.textContent = String(newTotal);
    } catch (err) {
      console.error('clap failed', err);
      total.textContent = String(before);          // roll back
      mineN -= 1;
      setLocalClaps(slug, mineN);
      refresh();
    } finally {
      busy = false;
    }
  });
}
