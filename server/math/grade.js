import { parse, evaluate, variables, hasDecimal, isProductForm, ParseError } from './expr.js';
import { matchReasonText } from '../gen/reasons.js';

const close = (a, b, rel = 1e-7) => Math.abs(a - b) <= rel * Math.max(1, Math.abs(a), Math.abs(b));

function sfTol(v, sf) {
  if (v === 0) return 0.5 * Math.pow(10, -sf);
  const mag = Math.floor(Math.log10(Math.abs(v)));
  return 0.5 * Math.pow(10, mag - sf + 1) * 1.0001;
}

// Grade a single math answer string against a key.
// key: { type:'num'|'expr', v:string, acc?: 'exact'|'sf3'|'dp1'|'dp2'..., vars?, domain?, product?, plusC?, angle?, noDecimal? }
export function gradeMath(input, key) {
  const res = { ok: false, msg: '' };
  if (input == null || String(input).trim() === '') {
    res.msg = 'No answer entered.';
    return res;
  }
  let tree;
  try {
    tree = parse(input);
  } catch (e) {
    res.msg = 'Could not read that expression.';
    return res;
  }
  const opts = { angle: key.angle || 'rad' };
  const raw = String(input).replace(/\s+/g, '');
  if (key.forbid && key.forbid.some((f) => raw.includes(f))) {
    // still check equivalence so the message is useful
    res.msg = 'Not fully simplified yet.';
    return res;
  }
  if (key.form === 'std' && !/^-?[1-9](\.\d+)?(\*10\^\(?-?\d+\)?)?$/.test(raw)) {
    res.msg = 'Write it in standard form: A × 10ⁿ with 1 ≤ A < 10.';
    return res;
  }
  if (key.type === 'num') {
    let got;
    try {
      const vs = [...variables(tree)];
      if (vs.length) {
        res.msg = 'Expected a number, not an expression in ' + vs.join(', ') + '.';
        return res;
      }
      got = evaluate(tree, {}, opts);
    } catch {
      res.msg = 'Could not evaluate that.';
      return res;
    }
    const want = evaluate(parse(key.v), {}, opts);
    if (!Number.isFinite(got)) { res.msg = 'That value is undefined.'; return res; }
    const acc = key.acc || 'exact';
    if (acc === 'exact') {
      res.ok = close(got, want, 1e-9);
      if (res.ok && key.noDecimal && hasDecimal(input) && !Number.isInteger(want)) {
        res.ok = false;
        res.msg = 'Correct value, but give the exact form (no decimals).';
      }
    } else if (acc.startsWith('sf')) {
      const n = +acc.slice(2);
      res.ok = Math.abs(got - want) <= sfTol(want, n);
      if (!res.ok && Math.abs(got - want) <= sfTol(want, n - 1)) res.msg = `Close — check your rounding (${n} significant figures).`;
    } else if (acc.startsWith('dp')) {
      const n = +acc.slice(2);
      res.ok = Math.abs(got - want) <= 0.5 * Math.pow(10, -n) * 1.0001;
      if (!res.ok && Math.abs(got - want) <= 0.5 * Math.pow(10, 1 - n)) res.msg = `Close — check your rounding (${n} decimal places).`;
    }
    return res;
  }
  if (key.type === 'expr') {
    const keyTree = parse(key.v);
    const vars = key.vars && key.vars.length ? key.vars : [...variables(keyTree)];
    const userVars = [...variables(tree)];
    const extra = userVars.filter((v) => !vars.includes(v) && !(key.plusC && v === 'c'));
    if (extra.length) { res.msg = 'Unexpected variable: ' + extra.join(', ') + '.'; return res; }
    if (key.plusC && !userVars.includes('c')) {
      res.msg = 'Indefinite integral — don’t forget the constant + c.';
    }
    const [lo, hi] = key.domain || [0.3, 2.7];
    let diffs = [];
    let tries = 0, good = 0;
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    while (good < 8 && tries < 60) {
      tries++;
      const env = {};
      for (const v of vars) env[v] = lo + (hi - lo) * rnd();
      if (key.plusC) env.c = 0;
      let a, b;
      try {
        a = evaluate(tree, env, opts);
        b = evaluate(keyTree, env, opts);
      } catch (e) {
        res.msg = res.msg || 'Could not evaluate that.';
        return { ok: false, msg: res.msg };
      }
      if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
      good++;
      diffs.push(a - b);
    }
    if (!good) { res.msg = 'Could not evaluate that.'; return res; }
    if (key.plusC) {
      const d0 = diffs[0];
      const okShape = diffs.every((d) => close(d, d0, 1e-6));
      res.ok = okShape && userVars.includes('c');
      if (okShape && !userVars.includes('c')) res.msg = 'Right function — but add the arbitrary constant + c.';
      return res;
    }
    res.ok = diffs.every((d) => Math.abs(d) <= 1e-6 * Math.max(1, Math.abs(d)) || close(d, 0, 1e-7));
    if (res.ok && key.product && !isProductForm(tree)) {
      res.ok = false;
      res.msg = 'Equivalent, but the question asks for fully factorised form.';
    }
    if (res.ok && key.noDecimal && hasDecimal(input)) {
      res.ok = false;
      res.msg = 'Equivalent, but give exact values (no decimals).';
    }
    return res;
  }
  return res;
}

// ---------- geometry statement canonicaliser ----------
const segRe = /^[A-Z]{2}$/;

function canonTerm(t) {
  t = t.trim();
  if (t.startsWith('∠')) {
    const L = t.slice(1);
    if (L.length === 3) {
      const [a, b, c] = L;
      return '∠' + (a < c ? a + b + c : c + b + a);
    }
    return '∠' + L;
  }
  if (segRe.test(t)) return [...t].sort().join('');
  return t;
}

function canonTri(rel, left, right) {
  const A = left.replace('△', ''), B = right.replace('△', '');
  if (A.length !== 3 || B.length !== 3) return null;
  const options = [];
  for (const [P, Q] of [[A, B], [B, A]]) {
    const pairs = [0, 1, 2].map((i) => P[i] + Q[i]).sort();
    options.push(pairs.join('|'));
  }
  options.sort();
  return rel + options[0];
}

export function canonStatement(s) {
  let x = String(s)
    .replace(/\s+/g, '')
    .replace(/\\/g, '')
    .replace(/∡/g, '∠')
    .replace(/Δ/g, '△')
    .replace(/~/g, '∼')
    .replace(/\|\|/g, '∥');
  for (const rel of ['≅', '∼']) {
    if (x.includes(rel)) {
      const [l, r] = x.split(rel);
      const c = canonTri(rel, l, r || '');
      if (c) return c;
    }
  }
  for (const rel of ['∥', '⊥']) {
    if (x.includes(rel)) {
      const parts = x.split(rel).map(canonTerm).sort();
      return parts.join(rel);
    }
  }
  if (x.includes('=')) {
    const parts = x.split('=').map((p) => {
      // handle sums like ∠ABC+∠BCD
      const terms = p.split('+').map(canonTerm).sort();
      return terms.join('+');
    });
    // numbers at the end, rest sorted
    return parts.sort().join('=');
  }
  return canonTerm(x);
}

// ---------- grade a whole question ----------
// question.key holds keys per part id; answers: { [partId]: value }
export function gradeQuestion(q, answers) {
  const results = {};
  let allOk = true;
  for (const part of q.parts) {
    const key = q.key[part.id];
    const ans = answers ? answers[part.id] : undefined;
    let r;
    if (part.kind === 'math') {
      if (key.multi) {
        // unordered list of answers
        const given = Array.isArray(ans) ? ans.filter((a) => String(a || '').trim()) : [];
        const remaining = key.multi.slice();
        const per = [];
        for (const g of given) {
          const idx = remaining.findIndex((k) => gradeMath(g, k).ok);
          if (idx >= 0) { remaining.splice(idx, 1); per.push(true); } else per.push(false);
        }
        const ok = remaining.length === 0 && per.every(Boolean);
        r = { ok, per, msg: ok ? '' : remaining.length && per.every(Boolean) ? 'Some solutions are missing.' : '' };
      } else {
        r = gradeMath(Array.isArray(ans) ? ans[0] : ans, key);
      }
    } else if (part.kind === 'choice') {
      r = { ok: Number(ans) === key.correct };
    } else if (part.kind === 'proof') {
      const blanks = {};
      let ok = true;
      for (const [bid, bk] of Object.entries(key.blanks)) {
        const v = ans ? ans[bid] : undefined;
        let b = false;
        if (bk.type === 'reason') {
          if (typeof v === 'string' && v.startsWith('#')) b = bk.accept.includes(v.slice(1));
          else if (typeof v === 'string') b = matchReasonText(v, bk.accept);
        } else if (bk.type === 'stmt') {
          if (typeof v === 'string' && v.startsWith('#tex:')) b = !!bk.show && v.slice(5) === bk.show;
          else if (typeof v === 'string' && v.startsWith('#stmt:')) { const cv = canonStatement(v.slice(6)); b = bk.accept.some((a) => canonStatement(a) === cv); }
          else if (typeof v === 'string' && v.startsWith('#opt:')) b = Number(v.slice(5)) === bk.correctOpt;
          else if (typeof v === 'string') {
            const cv = canonStatement(v);
            b = bk.accept.some((a) => canonStatement(a) === cv);
          }
        } else if (bk.type === 'math') {
          b = gradeMath(v, bk.key).ok;
        }
        blanks[bid] = b;
        if (!b) ok = false;
      }
      r = { ok, blanks };
    } else {
      r = { ok: false };
    }
    results[part.id] = r;
    if (!r.ok) allOk = false;
  }
  return { ok: allOk, parts: results };
}

export { ParseError };
