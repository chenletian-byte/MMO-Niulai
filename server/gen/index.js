import emath from './emath.js';
import amath from './amath.js';
import { rng, finalize } from './util.js';
import { publicReasons } from './reasons.js';
import { toLatex, evalString } from '../math/expr.js';

function showKey(k) {
  const latex = toLatex(k.v);
  let approx = null;
  try {
    if (k.type === 'num') {
      const v = evalString(k.v, {}, { angle: k.angle || 'rad' });
      const acc = k.acc || 'exact';
      if (acc.startsWith('sf')) approx = String(Number(v.toPrecision(+acc.slice(2))));
      else if (acc.startsWith('dp')) approx = v.toFixed(+acc.slice(2));
      else if (!Number.isInteger(v) && /[@/]/.test(k.v)) approx = String(Number(v.toPrecision(4)));
    }
  } catch {}
  return { latex: approx && /^-?[\d.]+$/.test(latex) ? approx : latex, approx: approx && approx !== latex ? approx : null, plusC: !!k.plusC };
}
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const SYLLABUS = {
  emath: {
    code: '4052',
    name: 'Mathematics (E Math)',
    short: 'E Math',
    topics: {
      N1: 'Numbers and their operations', N2: 'Ratio and proportion', N3: 'Percentage', N4: 'Rate and speed',
      N5: 'Algebraic expressions and formulae', N6: 'Functions and graphs', N7: 'Equations and inequalities', N8: 'Set language and notation',
      G1: 'Angles, triangles and polygons', G2: 'Congruence and similarity', G3: 'Properties of circles', G4: "Pythagoras' theorem and trigonometry",
      G5: 'Mensuration', G6: 'Coordinate geometry', G7: 'Vectors in two dimensions', S1: 'Data analysis', S2: 'Probability', MIX: 'Concepts and definitions',
    },
  },
  amath: {
    code: '4049',
    name: 'Additional Mathematics (A Math)',
    short: 'A Math',
    topics: {
      A1: 'Quadratic functions', A2: 'Equations and inequalities', A3: 'Surds', A4: 'Polynomials and partial fractions', A5: 'Binomial expansions',
      A6: 'Exponential and logarithmic functions', G1: 'Trigonometric functions, identities and equations', G2: 'Coordinate geometry in two dimensions',
      G3: 'Proofs in plane geometry', C1: 'Differentiation and integration', MIX: 'Concepts and definitions',
    },
  },
};

export const TEMPLATES = [...emath, ...amath];
export const byId = Object.fromEntries(TEMPLATES.map((t) => [t.id, t]));
export const TIERS = ['basic', 'challenging', 'advanced'];

// Optional bank of real past-paper questions (see README for the format).
let PAPERS = [];
try {
  PAPERS = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'paperbank.json'), 'utf8')).questions || [];
} catch {
  PAPERS = [];
}
export const paperBank = () => PAPERS;

export function templatesFor(subject, tier) {
  return TEMPLATES.filter((t) => t.subject === subject && (!tier || t.tiers.includes(tier)));
}

// Number of distinct (template, tier) "question types" per subject — denominator of the exposure bar.
export function typeCount(subject, topic) {
  return TEMPLATES.filter((t) => t.subject === subject && (!topic || t.topic === topic)).reduce((s, t) => s + t.tiers.length, 0);
}

function sourceFor(t, tier) {
  const code = SYLLABUS[t.subject].code;
  if (tier === 'advanced') return { kind: 'original', label: `MMO original · exam-style (O-Level ${code})` };
  return { kind: 'generated', label: `MMO practice generator · ${code} ${t.topic}` };
}

export function generate(templateId, tier, seed) {
  const t = byId[templateId];
  if (!t) throw new Error('unknown template ' + templateId);
  if (!t.tiers.includes(tier)) tier = t.tiers[t.tiers.length - 1];
  const r = rng(seed);
  const raw = t.gen.call(t, r, tier);
  const { parts, key } = finalize(r, raw.parts, tier);
  return {
    templateId: t.id,
    subject: t.subject,
    topic: raw.topicOverride || t.topic,
    tier,
    title: t.title,
    stem: raw.stem,
    diagram: raw.diagram || null,
    parts,
    key,
    solution: raw.solution || [],
    source: sourceFor(t, tier),
    seed,
  };
}

// Build a question from the past-paper bank entry.
export function fromPaper(entry) {
  const r = rng(entry.id.length * 7919);
  const parts = entry.parts.map((p) => ({ ...p, _t: p.kind }));
  const { parts: pub, key } = finalize(r, parts, 'advanced');
  const s = entry.source || {};
  return {
    templateId: 'paper:' + entry.id,
    subject: entry.subject,
    topic: entry.topic,
    tier: 'advanced',
    title: entry.title || 'Past-paper question',
    stem: entry.stem,
    diagram: entry.diagram || null,
    parts: pub,
    key,
    solution: entry.solution || [],
    source: { kind: 'paper', label: [s.school, s.year, s.exam, s.paper && 'Paper ' + s.paper, s.question && 'Q' + s.question].filter(Boolean).join(' · ') },
    seed: 0,
  };
}

// Choose a template adaptively: unseen types first, then weak ones, with randomness.
export function chooseTemplate(subject, tier, stats, r, topic) {
  let pool = templatesFor(subject, tier);
  if (topic) {
    const tp = pool.filter((t) => t.topic === topic);
    if (tp.length) pool = tp;
  }
  const weights = pool.map((t) => {
    const s = stats[t.id];
    if (!s) return 4; // never seen
    const acc = s.counted ? s.correct / s.counted : 0.5;
    const recency = s.lastAt ? Math.min(3, (Date.now() - s.lastAt) / 86400000) : 1;
    return 0.6 + (1 - acc) * 2.5 + recency * 0.3;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let x = r.next() * total;
  for (let i = 0; i < pool.length; i++) {
    x -= weights[i];
    if (x <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

// Strip the answer key before sending to the browser.
export function publicQuestion(q) {
  const { key, solution, seed, ...rest } = q;
  return rest;
}

export function revealKey(q) {
  // Human-readable answers for the feedback panel
  const out = {};
  for (const part of q.parts) {
    const k = q.key[part.id];
    if (part.kind === 'choice') out[part.id] = { correct: k.correct, explain: k.explain };
    else if (part.kind === 'math') out[part.id] = { values: (k.multi || [k]).map(showKey) };
    else if (part.kind === 'proof') {
      const b = {};
      for (const [bid, bk] of Object.entries(k.blanks)) {
        if (bk.type === 'reason') b[bid] = { reason: bk.accept[0] };
        else if (bk.type === 'stmt') b[bid] = bk.show ? { latex: bk.show } : bk.correctOpt != null ? { opt: bk.correctOpt, stmt: bk.accept[0] } : { stmt: bk.accept[0] };
        else b[bid] = bk.show ? { latex: bk.show } : showKey(bk.key);
      }
      out[part.id] = { blanks: b };
    }
  }
  return out;
}

export { publicReasons };
