import emath from './emath.js';
import amath from './amath.js';
import { rng, finalize, stmtToLatex } from './util.js';
import { REASONS } from './reasons.js';
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

// Topic structure follows the 2026 SEAB syllabus documents (4052 Mathematics, 4049 Additional Mathematics).
// Codes are internal keys only; the app shows strand and topic names.
export const SYLLABUS = {
  emath: {
    code: '4052',
    year: 2026,
    name: 'Mathematics (E Math)',
    short: 'E Math',
    strands: [
      ['Number and Algebra', ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8']],
      ['Geometry and Measurement', ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7']],
      ['Statistics and Probability', ['S1', 'S2']],
    ],
    topics: {
      N1: 'Numbers and their operations', N2: 'Ratio and proportion', N3: 'Percentage', N4: 'Rate and speed',
      N5: 'Algebraic expressions and formulae', N6: 'Functions and graphs', N7: 'Equations and inequalities', N8: 'Set language and notation',
      G1: 'Angles, triangles and polygons', G2: 'Congruence and similarity', G3: 'Properties of circles', G4: "Pythagoras' theorem and trigonometry",
      G5: 'Mensuration', G6: 'Coordinate geometry', G7: 'Vectors in two dimensions', S1: 'Data analysis', S2: 'Probability', MIX: 'Concepts and definitions',
    },
    points: {
      N1: ['primes and prime factorisation; highest common factor and lowest common multiple', 'squares, square roots, cubes and cube roots', 'negative numbers, integers, rational numbers, real numbers and their four operations', 'approximation and estimation, including significant figures and decimal places', 'standard form A × 10ⁿ, where n is an integer and 1 ≤ A < 10', 'laws of indices, including zero, negative and rational indices'],
      N2: ['ratios involving rational numbers; writing a ratio in its simplest form', 'map scales', 'direct and inverse proportion'],
      N3: ['expressing one quantity as a percentage of another', 'percentage increase and decrease', 'reverse percentages', 'problems involving percentages'],
      N4: ['concepts of rate and average rate', 'speed, uniform speed and average speed', 'conversion of units'],
      N5: ['using letters to represent numbers; evaluating and translating expressions', 'expansion and factorisation of algebraic expressions, including (a ± b)² and a² − b²', 'factorisation of quadratic expressions', 'operations on algebraic fractions', 'changing the subject of a formula'],
      N6: ['Cartesian coordinates; graphs of linear functions and gradient', 'graphs of quadratic functions: symmetry and maximum or minimum points', 'graphs of power functions and exponential functions', 'estimating the gradient of a curve by drawing a tangent'],
      N7: ['linear equations and simultaneous linear equations in two variables', 'fractional equations with numerical and linear algebraic denominators', 'quadratic equations by factorisation, formula, completing the square and graphs', 'linear inequalities in one variable'],
      N8: ['use of set language and notation: ξ, ∅, ∈, ∉, ⊆, ⊂, A′, A ∩ B, A ∪ B', 'Venn diagrams'],
      G1: ['right, acute, obtuse and reflex angles', 'vertically opposite angles, angles on a straight line and angles at a point', 'angles formed by two parallel lines and a transversal', 'properties of triangles, special quadrilaterals and regular polygons', 'angle sum of interior and exterior angles of polygons'],
      G2: ['congruent and similar figures', 'tests for congruent and similar triangles', 'enlargement and scale factor', 'ratio of areas and volumes of similar figures'],
      G3: ['symmetry properties of circles: equal chords, perpendicular bisector of a chord, tangents from an external point', 'angle properties: angle in a semicircle, angle at the centre, angles in the same segment, angles in opposite segments', 'tangent perpendicular to radius'],
      G4: ["Pythagoras' theorem", 'trigonometric ratios of acute angles', 'sine and cosine of obtuse angles', 'area of a triangle = ½ab sin C', 'sine rule and cosine rule', 'angles of elevation and depression, bearings, and simple problems in three dimensions'],
      G5: ['perimeter and area of plane figures', 'volume and surface area of prisms, cylinders, pyramids, cones and spheres', 'arc length, area of a sector and area of a segment'],
      G6: ['gradient of a straight line', 'length of a line segment', 'equation of a straight line y = mx + c'],
      G7: ['vector notation and column vectors', 'magnitude of a vector', 'addition, subtraction and scalar multiples of vectors', 'position vectors and geometric problems'],
      S1: ['tables, bar graphs, pictograms, line graphs, pie charts, histograms, dot diagrams and stem-and-leaf diagrams', 'cumulative frequency diagrams and box-and-whisker plots', 'mean, mode, median, quartiles, range, interquartile range and standard deviation', 'interpreting and comparing data sets'],
      S2: ['probability as a measure of chance', 'probability of single events', 'probability of combined events using possibility diagrams and tree diagrams', 'addition and multiplication of probabilities: mutually exclusive and independent events'],
    },
  },
  amath: {
    code: '4049',
    year: 2026,
    name: 'Additional Mathematics (A Math)',
    short: 'A Math',
    strands: [
      ['Algebra', ['A1', 'A2', 'A3', 'A4', 'A5', 'A6']],
      ['Geometry and Trigonometry', ['G1', 'G2', 'G3']],
      ['Calculus', ['C1']],
    ],
    topics: {
      A1: 'Quadratic functions', A2: 'Equations and inequalities', A3: 'Surds', A4: 'Polynomials and partial fractions', A5: 'Binomial expansions',
      A6: 'Exponential and logarithmic functions', G1: 'Trigonometric functions, identities and equations', G2: 'Coordinate geometry in two dimensions',
      G3: 'Proofs in plane geometry', C1: 'Differentiation and integration', MIX: 'Concepts and definitions',
    },
    points: {
      A1: ['finding the maximum or minimum value of a quadratic function by completing the square', 'conditions for a quadratic function to be always positive (or always negative)', 'using quadratic functions as models'],
      A2: ['conditions for a quadratic equation to have two real roots, two equal roots or no real roots', 'conditions for a line to intersect, touch or not intersect a curve', 'solving simultaneous equations in two variables, one linear and one non-linear, by substitution', 'solving quadratic inequalities and representing the solution on a number line'],
      A3: ['four operations on surds, including rationalising the denominator', 'solving equations involving surds'],
      A4: ['multiplication and division of polynomials', 'remainder theorem and factor theorem', 'factorisation of cubic polynomials and solving cubic equations', 'partial fractions with linear factors, repeated linear factors and an irreducible quadratic factor'],
      A5: ['binomial theorem for positive integer n', 'use of the general term', 'use of the notation n! and the binomial coefficient'],
      A6: ['exponential and logarithmic functions and their graphs, including e^x and ln x', 'laws of logarithms and change of base', 'solving exponential and logarithmic equations', 'using exponential and logarithmic functions as models'],
      G1: ['six trigonometric functions for angles of any magnitude, in degrees or radians', 'principal values and exact values for special angles', 'amplitude, periodicity and symmetries; graphs of y = a sin(bx) + c and related functions', 'identities: sin²A + cos²A = 1, sec²A = 1 + tan²A, cosec²A = 1 + cot²A, compound angle and double angle formulae', 'expressing a sin θ + b cos θ in the form R sin(θ ± α) or R cos(θ ± α)', 'solving trigonometric equations and proving identities'],
      G2: ['conditions for two lines to be parallel or perpendicular', 'midpoint of a line segment and area of a rectilinear figure', 'coordinate geometry of circles', 'transforming a relationship to linear form to determine unknown constants'],
      G3: ['use of properties of parallel lines, triangles, polygons and circles in proofs', 'congruent and similar triangles', 'midpoint theorem', 'tangent-chord (alternate segment) theorem'],
      C1: ['derivative as the gradient of a tangent; derivatives of xⁿ, sin x, cos x, tan x, eˣ and ln x', 'chain rule, product rule and quotient rule', 'increasing and decreasing functions; stationary points and their nature', 'tangents and normals, connected rates of change, maxima and minima', 'integration as the reverse of differentiation; definite integrals', 'area under a curve and area bounded by a curve and a line', 'displacement, velocity and acceleration of a particle moving in a straight line'],
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
  if (tier === 'advanced') return { kind: 'original', label: `MMO original · exam-style · Syllabus ${code} (2026)` };
  return { kind: 'generated', label: `MMO practice generator · Syllabus ${code} (2026)` };
}

export function generate(templateId, tier, seed) {
  const t = byId[templateId];
  if (!t) throw new Error('unknown template ' + templateId);
  if (!t.tiers.includes(tier)) tier = t.tiers[t.tiers.length - 1];
  const r = rng(seed);
  const raw = t.gen.call(t, r, tier);
  const { parts, key } = finalize(r, raw.parts, tier);
  // proof-only questions get a line-by-line walkthrough; mixed questions keep their worked solution
  const walk = parts.every((p) => p.kind === 'proof') ? proofWalkthrough(parts, key) : [];
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
    solution: walk.length ? [...walk, ...(raw.solution || []).filter((x) => !/^\$/.test(x.trim())).map((x) => '**Tip:** ' + x)] : raw.solution || [],
    source: sourceFor(t, tier),
    seed,
  };
}

// Turn each proof line into a guided step: the completed statement plus the full reason.
function proofWalkthrough(parts, key) {
  const steps = [];
  for (const p of parts) {
    if (p.kind !== 'proof') continue;
    const blanks = key[p.id].blanks;
    p.lines.forEach((line) => {
      let text = '';
      const why = [];
      for (const seg of line) {
        if (seg.tx != null) { text += seg.tx + ' '; continue; }
        const bk = blanks[seg.blank];
        if (bk.type === 'reason') why.push(REASONS[bk.accept[0]]?.full || bk.accept[0]);
        else if (bk.type === 'stmt') text += '$' + (bk.show || stmtToLatex(bk.accept[0])) + '$ ';
        else if (bk.type === 'math') text += '$' + (bk.show || toLatex(bk.key.v)) + (seg.post || '') + '$ ';
      }
      text = text.replace(/\$\s*\$/g, ' ').replace(/\s+/g, ' ').trim();
      if (!text) return;
      steps.push(why.length ? `${text}\n**Reason:** ${why.join('; ')}.` : text);
    });
  }
  return steps;
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
  const { key, solution, seed, answers, graded, hints, origin, ...rest } = q;
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
        else if (bk.type === 'stmt') b[bid] = bk.show ? { latex: bk.show } : { stmt: bk.accept[0] };
        else b[bid] = bk.show ? { latex: bk.show } : showKey(bk.key);
      }
      out[part.id] = { blanks: b };
    }
  }
  return out;
}

export { publicReasons };
