import { marked } from 'https://esm.sh/marked@12';

marked.setOptions({ gfm: true, breaks: true, headerIds: false, mangle: false });

export function md(src, { inline = false } = {}) {
  if (!src) return '';
  return inline ? marked.parseInline(src) : marked.parse(src);
}
