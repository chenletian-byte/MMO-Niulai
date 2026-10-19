// Helpers shared by question generators.
import { REASONS } from './reasons.js';

export function rng(seed) {
  let a = seed >>> 0 || 1;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const R = {
    next,
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    nz: (lo, hi) => { let v; do v = lo + Math.floor(next() * (hi - lo + 1)); while (v === 0); return v; },
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    sign: () => (next() < 0.5 ? -1 : 1),
    chance: (p) => next() < p,
    shuffle: (arr) => {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
  };
  return R;
}

export const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
export const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);

// round helpers
export const round = (x, dp) => { const f = Math.pow(10, dp); return Math.round(x * f + (x >= 0 ? 1e-9 : -1e-9)) / f; };
export function sf(x, n = 3) {
  if (x === 0) return 0;
  const mag = Math.floor(Math.log10(Math.abs(x)));
  const f = Math.pow(10, n - 1 - mag);
  return Math.round(x * f) / f;
}
export function fmt(x, maxDp = 6) {
  if (Number.isInteger(x)) return String(x).replace('-', '−');
  return String(parseFloat(x.toFixed(maxDp))).replace('-', '−');
}
export function fmt3(x) {
  const v = sf(x, 3);
  const mag = Math.floor(Math.log10(Math.abs(v || 1)));
  const dp = Math.max(0, 2 - mag);
  return v.toFixed(dp).replace('-', '−');
}
export function money(x) { return x.toFixed(2); }

// LaTeX fraction (reduced). n/d integers.
export function fr(n, d = 1) {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d);
  n /= g; d /= g;
  if (d === 1) return String(n);
  return (n < 0 ? '-' : '') + `\\frac{${Math.abs(n)}}{${d}}`;
}
// key-string fraction
export function frk(n, d = 1) {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d);
  n /= g; d /= g;
  return d === 1 ? `(${n})` : `(${n}/${d})`;
}

// coefficient·variable term for LaTeX: coef(3,'x') -> "3x", coef(-1,'x') -> "-x"
export function coef(c, v, first = false) {
  if (c === 0) return '';
  const abs = Math.abs(c);
  const body = v ? (abs === 1 ? v : abs + v) : String(abs);
  if (first) return (c < 0 ? '-' : '') + body;
  return (c < 0 ? ' - ' : ' + ') + body;
}

// polynomial LaTeX: coefficients highest degree first
export function poly(cs, v = 'x') {
  const n = cs.length - 1;
  let out = '';
  cs.forEach((c, i) => {
    const p = n - i;
    if (c === 0) return;
    const vv = p === 0 ? '' : p === 1 ? v : `${v}^{${p}}`;
    out += coef(c, vv, out === '');
  });
  return out || '0';
}
// polynomial key-string
export function polyk(cs, v = 'x') {
  const n = cs.length - 1;
  return cs.map((c, i) => `(${c})*${v}^${n - i}`).join('+') || '0';
}
// linear "ax + b"
export const lin = (a, b, v = 'x') => poly([a, b], v);
// signed constant " + 3" / " - 3"
export const sg = (n) => (n < 0 ? ` - ${Math.abs(n)}` : ` + ${n}`);

// --------- question building ---------
let partCounter = 0;

export function mathPart(id, o) {
  return { _t: 'math', id, ...o };
}
export function choicePart(id, o) {
  return { _t: 'choice', id, ...o };
}
export function proofPart(id, o) {
  return { _t: 'proof', id, ...o };
}
// proof line blank helpers
export const R = (accept, extra = []) => ({ _b: 'reason', accept: [].concat(accept), extra });
export const S = (accept, distractors = []) => ({ _b: 'stmt', accept: [].concat(accept), distractors });
export const N = (key, pre = '', post = '') => ({ _b: 'math', key, pre, post });
// expression step: key for typing, latex for the correct chip, distractor latex chips (basic tier)
export const E = (key, latex, distractors = [], kb = 'trig') => ({ _b: 'expr', key, latex, distractors, kb });

const REASON_GROUPS = {
  lines: ['vert_opp', 'alt', 'corr', 'co_int', 'adj_line', 'ang_pt', 'tri_sum', 'ext_ang', 'isos', 'conv_alt', 'conv_corr', 'given', 'poly_sum'],
  cong: ['given', 'common_side', 'common_angle', 'vert_opp', 'alt', 'corr', 'sss', 'sas', 'asa', 'aas', 'rhs', 'cong_sides', 'cong_angles', 'midpoint', 'radii', 'tan_ext', 'isos', 'parallelogram'],
  sim: ['given', 'sim_angles', 'common_angle', 'vert_opp', 'alt', 'corr', 'aa_sim', 'sas_sim', 'sim_ratio', 'midpt_thm', 'midpoint', 'same_seg', 'alt_seg', 'tri_sum'],
  circle: ['radii', 'tan_rad', 'tan_ext', 'semicircle', 'centre', 'same_seg', 'cyclic', 'alt_seg', 'perp_chord', 'isos', 'tri_sum', 'adj_line', 'alt', 'given', 'rhs', 'common_side'],
  alg: ['disc_neg', 'disc_pos', 'disc_zero', 'coeff_pos', 'sq_nonneg', 'd2_pos', 'd2_neg', 'dy_pos', 'pyth_id', 'sec_id', 'double_angle', 'factor_thm', 'remainder_thm'],
};

// eslint-disable-next-line no-unused-vars
function reasonChips(r, accept, extra, tier, group) {
  const pool = (REASON_GROUPS[group] || Object.keys(REASONS)).filter((x) => !accept.includes(x));
  if (tier === 'basic') {
    const distract = r.shuffle([...extra.filter((x) => !accept.includes(x)), ...r.shuffle(pool)]).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3);
    return r.shuffle([accept[0], ...distract]);
  }
  return [...new Set([...accept.slice(0, 1), ...pool])].sort();
}

function autoDistractors(stmt) {
  const out = [];
  if (stmt.includes('⊥')) out.push(stmt.replace('⊥', '∥'));
  if (stmt.includes('∥')) out.push(stmt.replace('∥', '⊥'));
  if (stmt.includes('≅')) out.push(stmt.replace('≅', '∼'));
  if (stmt.includes('∼')) out.push(stmt.replace('∼', '≅'));
  const m = stmt.match(/△([A-Z])([A-Z])([A-Z])(.)△([A-Z])([A-Z])([A-Z])/);
  if (m) out.push(`△${m[1]}${m[2]}${m[3]}${m[4]}△${m[6]}${m[5]}${m[7]}`);
  const a = stmt.match(/^∠([A-Z]{3})=∠([A-Z]{3})$/);
  if (a) out.push(`∠${a[1]}=∠${a[2][1]}${a[2][0]}${a[2][2]}`);
  const sgm = stmt.match(/^([A-Z]{2})=([A-Z]{2})$/);
  if (sgm) out.push(`${sgm[1][0]}${sgm[2][0]}=${sgm[1][1]}${sgm[2][1]}`);
  return out.filter((x) => x !== stmt);
}

// Convert parts into public parts + answer key. tier controls proof scaffolding.
export function finalize(r, parts, tier) {
  const pub = [];
  const key = {};
  for (const p of parts) {
    if (p._t === 'math') {
      const { _t, id, key: k, multi, ...rest } = p;
      pub.push({ kind: 'math', id, count: multi ? multi.length : 1, ...rest });
      key[id] = multi ? { multi } : k;
    } else if (p._t === 'choice') {
      const { _t, id, options, correct, explain, ...rest } = p;
      const order = r.shuffle(options.map((_, i) => i));
      pub.push({ kind: 'choice', id, options: order.map((i) => options[i]), ...rest });
      key[id] = { correct: order.indexOf(correct), explain };
    } else if (p._t === 'proof') {
      const { _t, id, lines, group = 'lines', ...rest } = p;
      const blanks = {};
      // One shared answer bank for the whole proof: every correct chip once per use, plus distractors.
      const bank = [];
      const reasonExtras = [];
      const stmtExtras = [];
      let bi = 0;
      const pubLines = lines.map((line) =>
        line.map((seg) => {
          if (typeof seg === 'string') return { tx: seg };
          const bid = 'b' + bi++;
          if (seg._b === 'reason') {
            blanks[bid] = { type: 'reason', accept: seg.accept };
            if (tier === 'advanced') return { blank: bid, type: 'reason', mode: 'text' };
            bank.push({ t: 'reason', v: seg.accept[0] });
            reasonExtras.push(...(seg.extra || []));
            return { blank: bid, type: 'reason', mode: 'chips' };
          }
          if (seg._b === 'stmt') {
            blanks[bid] = { type: 'stmt', accept: seg.accept };
            if (tier !== 'basic') return { blank: bid, type: 'stmt', mode: 'type' };
            bank.push({ t: 'stmt', v: seg.accept[0] });
            const d = [...seg.distractors, ...autoDistractors(seg.accept[0])].find((v) => v !== seg.accept[0]);
            if (d) stmtExtras.push({ t: 'stmt', v: d });
            return { blank: bid, type: 'stmt', mode: 'chips' };
          }
          if (seg._b === 'expr') {
            if (tier === 'basic') {
              blanks[bid] = { type: 'stmt', accept: [], show: seg.latex };
              bank.push({ t: 'tex', v: seg.latex });
              if (seg.distractors[0]) stmtExtras.push({ t: 'tex', v: seg.distractors[0] });
              return { blank: bid, type: 'stmt', mode: 'chips' };
            }
            blanks[bid] = { type: 'math', key: seg.key, show: seg.latex };
            return { blank: bid, type: 'math', kb: seg.kb };
          }
          if (seg._b === 'math') {
            blanks[bid] = { type: 'math', key: seg.key };
            return { blank: bid, type: 'math', pre: seg.pre, post: seg.post, kb: seg.key.kb || 'num' };
          }
          return { tx: '?' };
        })
      );
      if (bank.length) {
        const usedReasons = new Set(bank.filter((b) => b.t === 'reason').map((b) => b.v));
        let rd;
        if (tier === 'basic') {
          const pool = [...reasonExtras, ...r.shuffle(REASON_GROUPS[group] || [])].filter((x, i, a) => a.indexOf(x) === i && !usedReasons.has(x));
          rd = pool.slice(0, Math.min(4, Math.max(2, usedReasons.size)));
        } else rd = (REASON_GROUPS[group] || []).filter((x) => !usedReasons.has(x));
        const sd = stmtExtras.filter((x, i, a) => a.findIndex((y) => y.v === x.v) === i && !bank.some((b) => b.v === x.v)).slice(0, 3);
        const all = r.shuffle([...bank, ...rd.map((v) => ({ t: 'reason', v })), ...sd]);
        rest.bank = all.map((b, i) => ({ id: 'k' + i, ...b }));
      }
      pub.push({ kind: 'proof', id, lines: pubLines, ...rest });
      key[id] = { blanks };
    }
  }
  return { parts: pub, key };
}

// Plain-text preview of a statement for answers display
export function stmtToLatex(s) {
  return s
    .replace(/∠/g, '\\angle ')
    .replace(/△/g, '\\triangle ')
    .replace(/≅/g, '\\cong ')
    .replace(/∼/g, '\\sim ')
    .replace(/∥/g, '\\parallel ')
    .replace(/⊥/g, '\\perp ')
    .replace(/°/g, '^\\circ');
}
