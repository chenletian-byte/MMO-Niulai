// Render text with $inline$ / $$display$$ LaTeX and **bold** into HTML.
import { esc } from './dom.js';

const opts = { throwOnError: false, strict: 'ignore', trust: true };
export function tex(latex, display = false) {
  if (!window.katex) return esc(latex);
  try { return window.katex.renderToString(latex, { ...opts, displayMode: display }); } catch { return esc(latex); }
}
export function rich(text) {
  if (text == null) return '';
  const out = [];
  const re = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g;
  let last = 0, m;
  const s = String(text);
  while ((m = re.exec(s))) {
    out.push(plain(s.slice(last, m.index)));
    out.push(m[1] != null ? tex(m[1], true) : tex(m[2]));
    last = re.lastIndex;
  }
  out.push(plain(s.slice(last)));
  return out.join('');
}
function plain(t) {
  return esc(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
}
// statements like "∠ABC=∠DEF" → LaTeX
export function stmtTex(s) {
  return String(s)
    .replace(/∠/g, '\\angle ').replace(/△/g, '\\triangle ').replace(/≅/g, '\\cong ').replace(/∼/g, '\\sim ')
    .replace(/∥/g, '\\parallel ').replace(/⊥/g, '\\perp ').replace(/°/g, '^\\circ').replace(/=/g, ' = ');
}
