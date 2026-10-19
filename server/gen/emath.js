// O-Level Mathematics (Syllabus 4052) generators.
import { gcd, lcm, fr, frk, poly, polyk, lin, sg, coef, fmt, fmt3, sf, round, mathPart as M, choicePart as C, proofPart as P, R, S, N, stmtToLatex as SL } from './util.js';
import { Fig, polar, relabel } from './svg.js';

const T = [];
const add = (t) => T.push({ subject: 'emath', ...t });

// ---------------- NUMBER & ALGEBRA ----------------
add({
  id: 'em-std-form', topic: 'N1', title: 'Standard form', tiers: ['basic', 'challenging'],
  gen(r, tier) {
    const a = r.int(12, 95) / 10, b = r.int(12, 95) / 10;
    const m = r.int(2, 9), n = tier === 'basic' ? r.int(2, 6) : -r.int(2, 6);
    const div = tier !== 'basic' && r.chance(0.5);
    const val = div ? (a * Math.pow(10, m)) / (b * Math.pow(10, n)) : a * b * Math.pow(10, m + n);
    const mant = val / Math.pow(10, Math.floor(Math.log10(val)));
    const e = Math.floor(Math.log10(val));
    const op = div ? '\\div' : '\\times';
    return {
      stem: `Calculate $(${a} \\times 10^{${m}}) ${op} (${b} \\times 10^{${n}})$, giving your answer in standard form${div ? ' correct to 3 significant figures' : ''}.`,
      parts: [M('a', { kb: 'num', key: { type: 'num', v: String(val), acc: div ? 'sf3' : 'exact', form: 'std' } })],
      solution: [
        div ? `$= \\dfrac{${a}}{${b}} \\times 10^{${m} - (${n})}$` : `$= (${a} \\times ${b}) \\times 10^{${m} + (${n})}$`,
        `$= ${div ? fmt3(mant) : fmt(round(mant, 6))} \\times 10^{${e}}$`,
        'Standard form means $A \\times 10^{n}$ with $1 \\le A < 10$.',
      ],
    };
  },
});

add({
  id: 'em-indices', topic: 'N1', title: 'Laws of indices', tiers: ['basic', 'challenging'],
  gen(r, tier) {
    const v = r.pick(['x', 'a', 'p', 'y']);
    if (tier === 'basic') {
      const m = r.int(2, 9), n = r.int(2, 7), p = r.int(1, 8);
      return {
        stem: `Simplify $\\dfrac{${v}^{${m}} \\times ${v}^{${n}}}{${v}^{${p}}}$ and write it as $${v}^{k}$.`,
        parts: [M('a', { pre: 'k =', kb: 'num', key: { type: 'num', v: String(m + n - p) } })],
        solution: [`Multiply → add indices: $${v}^{${m}+${n}} = ${v}^{${m + n}}$`, `Divide → subtract: $${v}^{${m + n}-${p}} = ${v}^{${m + n - p}}$`],
      };
    }
    const m = r.int(2, 5), n = r.int(2, 4), q = r.int(2, 4);
    // (v^m)^n / v^(-q) * v^(1/2)... keep integer: (v^m)^n × v^{-q}
    const k = m * n - q;
    return {
      stem: `Given that $\\dfrac{(${v}^{${m}})^{${n}}}{${v}^{${q}}} \\times \\sqrt{${v}^{4}} = ${v}^{k}$, find $k$.`,
      parts: [M('a', { pre: 'k =', kb: 'num', key: { type: 'num', v: String(k + 2) } })],
      solution: [`Power of a power: $(${v}^{${m}})^{${n}} = ${v}^{${m * n}}$`, `$\\sqrt{${v}^{4}} = ${v}^{2}$`, `$k = ${m * n} - ${q} + 2 = ${k + 2}$`],
    };
  },
});

add({
  id: 'em-hcf-lcm', topic: 'N1', title: 'HCF and LCM', tiers: ['basic', 'challenging'],
  gen(r) {
    const pr = [2, 3, 5, 7];
    const ea = pr.map(() => r.int(0, 3)), eb = pr.map(() => r.int(0, 3));
    ea[0] = Math.max(ea[0], 1); eb[1] = Math.max(eb[1], 1);
    const A = pr.reduce((s, p, i) => s * Math.pow(p, ea[i]), 1), B = pr.reduce((s, p, i) => s * Math.pow(p, eb[i]), 1);
    const fac = (e) => pr.map((p, i) => (e[i] ? (e[i] > 1 ? `${p}^{${e[i]}}` : `${p}`) : '')).filter(Boolean).join(' \\times ');
    const H = gcd(A, B), L = lcm(A, B);
    return {
      stem: `Written as products of prime factors, $${A} = ${fac(ea)}$ and $${B} = ${fac(eb)}$. Find`,
      parts: [
        M('a', { label: '(a)', prompt: 'the highest common factor,', kb: 'num', key: { type: 'num', v: String(H) } }),
        M('b', { label: '(b)', prompt: 'the lowest common multiple.', kb: 'num', key: { type: 'num', v: String(L) } }),
      ],
      solution: ['HCF: take the **lowest** power of each common prime.', `HCF $= ${H}$`, 'LCM: take the **highest** power of every prime that appears.', `LCM $= ${L}$`],
    };
  },
});

add({
  id: 'em-percent', topic: 'N3', title: 'Reverse percentage', tiers: ['basic', 'challenging'],
  gen(r, tier) {
    const p = r.pick([5, 8, 10, 12, 15, 20, 25, 30]);
    const up = r.chance(0.5);
    const orig = r.int(4, 60) * 20;
    const now = orig * (1 + (up ? p : -p) / 100);
    const item = r.pick(['a bicycle', 'a laptop', 'a pair of headphones', 'a concert ticket', 'a calculator set']);
    if (tier === 'basic') {
      return {
        stem: `The price of ${item} ${up ? 'increased' : 'decreased'} by ${p}% to $\\$${now.toFixed(2)}$. Find the original price.`,
        parts: [M('a', { pre: '\\$', kb: 'num', key: { type: 'num', v: String(orig), acc: 'dp2' } })],
        solution: [`New price is $${up ? 100 + p : 100 - p}\\%$ of the original.`, `Original $= \\dfrac{${now.toFixed(2)}}{${(up ? 100 + p : 100 - p) / 100}} = \\$${orig.toFixed(2)}$`],
      };
    }
    const q = r.pick([10, 20, 25]);
    const fin = now * (1 - q / 100);
    return {
      stem: `A shop ${up ? 'raised' : 'reduced'} the price of ${item} by ${p}%. During a sale, the new price was then reduced by ${q}%, so it sold for $\\$${fin.toFixed(2)}$. Find the original price.`,
      parts: [M('a', { pre: '\\$', kb: 'num', key: { type: 'num', v: String(orig), acc: 'dp2' } })],
      solution: [`Overall multiplier $= ${(1 + (up ? p : -p) / 100).toFixed(2)} \\times ${(1 - q / 100).toFixed(2)}$`, `Original $= ${fin.toFixed(2)} \\div (${(1 + (up ? p : -p) / 100).toFixed(2)} \\times ${(1 - q / 100).toFixed(2)}) = \\$${orig.toFixed(2)}$`, 'Percentage changes multiply — they do not add.'],
    };
  },
});

add({
  id: 'em-interest', topic: 'N3', title: 'Compound interest', tiers: ['challenging', 'advanced'],
  gen(r) {
    const P = r.int(4, 40) * 500, rate = r.pick([1.5, 2, 2.5, 3, 3.5, 4]), yrs = r.int(2, 5);
    const half = r.chance(0.4);
    const n = half ? yrs * 2 : yrs, i = half ? rate / 2 : rate;
    const A = P * Math.pow(1 + i / 100, n);
    const I = Math.round((A - P) * 100) / 100;
    return {
      stem: `$\\$${P}$ is invested at ${rate}% per annum compound interest, compounded ${half ? 'half-yearly' : 'yearly'}. Find the interest earned after ${yrs} years, correct to the nearest cent.`,
      parts: [M('a', { pre: '\\$', kb: 'num', key: { type: 'num', v: String(I), acc: 'dp2' } })],
      solution: [`$A = P\\left(1 + \\dfrac{r}{100}\\right)^{n}$ with $r = ${i}$, $n = ${n}$`, `$A = ${P}(${1 + i / 100})^{${n}} = ${A.toFixed(4)}$`, `Interest $= A - P = \\$${I.toFixed(2)}$`],
    };
  },
});

add({
  id: 'em-ratio', topic: 'N2', title: 'Ratio and proportion', tiers: ['basic', 'challenging'],
  gen(r, tier) {
    const names = r.shuffle(['Aisha', 'Ben', 'Chloe', 'Dev', 'Ethan', 'Farah', 'Wei Ling', 'Ravi']);
    const a = r.int(1, 6), b = r.int(1, 6), c = r.int(1, 6);
    const k = r.int(5, 40) * (tier === 'basic' ? 2 : 3);
    if (tier === 'basic') {
      const tot = k * (a + b + c);
      return {
        stem: `$\\$${tot}$ is shared among ${names[0]}, ${names[1]} and ${names[2]} in the ratio $${a} : ${b} : ${c}$. How much does ${names[1]} receive?`,
        parts: [M('a', { pre: '\\$', kb: 'num', key: { type: 'num', v: String(k * b) } })],
        solution: [`Total parts $= ${a + b + c}$; one part $= ${tot} \\div ${a + b + c} = ${k}$`, `${names[1]}: $${b} \\times ${k} = ${k * b}$`],
      };
    }
    const diff = k * Math.abs(a - c) || k;
    const cc = a === c ? c + 1 : c;
    const d2 = k * Math.abs(a - cc);
    return {
      stem: `The ratio of ${names[0]}'s savings to ${names[1]}'s savings to ${names[2]}'s savings is $${a} : ${b} : ${cc}$. ${names[0]} has $\\$${d2}$ ${a > cc ? 'more' : 'less'} than ${names[2]}. Find their total savings.`,
      parts: [M('a', { pre: '\\$', kb: 'num', key: { type: 'num', v: String(k * (a + b + cc)) } })],
      solution: [`Difference of $${Math.abs(a - cc)}$ parts $= \\$${d2}$, so 1 part $= \\$${k}$`, `Total $= ${a + b + cc} \\times ${k} = \\$${k * (a + b + cc)}$`],
    };
  },
});

add({
  id: 'em-speed', topic: 'N4', title: 'Average speed', tiers: ['basic', 'challenging'],
  gen(r) {
    const t1 = r.pick([0.5, 1, 1.5, 2]), v1 = r.int(8, 18) * 5;
    const t2 = r.pick([0.25, 0.5, 0.75, 1, 1.25]), v2 = r.int(8, 18) * 5;
    const d1 = t1 * v1, d2 = t2 * v2;
    const avg = (d1 + d2) / (t1 + t2);
    const mins = (t) => (t * 60) + ' min';
    return {
      stem: `A van travels ${fmt(d1)} km at ${v1} km/h, then a further ${fmt(d2)} km in ${mins(t2)}. Find its average speed for the whole journey in km/h, correct to 3 significant figures where necessary.`,
      parts: [M('a', { post: '\\text{ km/h}', kb: 'num', key: { type: 'num', v: String(avg), acc: 'sf3' } })],
      solution: [`Time for first part $= ${fmt(d1)} \\div ${v1} = ${t1}$ h`, `Total distance $= ${fmt(d1 + d2)}$ km, total time $= ${t1 + t2}$ h`, `Average speed $= \\dfrac{\\text{total distance}}{\\text{total time}} = ${fmt3(avg)}$ km/h`, 'Average speed is **not** the mean of the two speeds.'],
    };
  },
});

add({
  id: 'em-expand', topic: 'N5', title: 'Expansion', tiers: ['basic', 'challenging'],
  gen(r, tier) {
    const a = r.nz(1, 4) * (tier === 'basic' ? 1 : r.sign()), b = r.nz(-7, 7), c = r.nz(1, 5), d = r.nz(-7, 7);
    if (tier === 'basic') {
      const cs = [a * c, a * d + b * c, b * d];
      return {
        stem: `Expand and simplify $(${lin(a, b)})(${lin(c, d)})$.`,
        parts: [M('a', { kb: 'alg', key: { type: 'expr', v: polyk(cs), vars: ['x'] } })],
        solution: [`$= ${coef(a * c, 'x^2', true)}${coef(a * d, 'x')}${coef(b * c, 'x')}${sg(b * d)}$`, `$= ${poly(cs)}$`],
      };
    }
    const e = r.nz(-5, 5), k = r.nz(2, 4);
    // (ax+b)^2 - k(cx+d)(x+e)
    const sq = [a * a, 2 * a * b, b * b];
    const pr = [c, c * e + d, d * e].map((v) => v * k);
    const cs = sq.map((v, i) => v - pr[i]);
    return {
      stem: `Expand and simplify $(${lin(a, b)})^{2} - ${k}(${lin(c, d)})(${lin(1, e)})$.`,
      parts: [M('a', { kb: 'alg', key: { type: 'expr', v: polyk(cs), vars: ['x'] } })],
      solution: [`$(${lin(a, b)})^{2} = ${poly(sq)}$`, `$${k}(${lin(c, d)})(${lin(1, e)}) = ${poly(pr)}$`, `Subtract carefully (every sign changes): $${poly(cs)}$`],
    };
  },
});

add({
  id: 'em-factorise', topic: 'N5', title: 'Factorisation', tiers: ['basic', 'challenging'],
  gen(r, tier) {
    const p = tier === 'basic' ? 1 : r.int(2, 5), q = r.nz(-8, 8), s = r.nz(-8, 8);
    const rr = tier === 'basic' ? 1 : r.int(1, 3);
    const g = gcd(gcd(p, q), 1);
    void g;
    const cs = [p * rr, p * s + q * rr, q * s];
    const sol = `(${lin(p, q)})(${lin(rr, s)})`;
    if (gcd(gcd(cs[0], cs[1]), cs[2]) !== 1) return this.gen(r, tier);
    return {
      stem: `Factorise completely $${poly(cs)}$.`,
      parts: [M('a', { kb: 'alg', key: { type: 'expr', v: `(${p}*x+(${q}))*(${rr}*x+(${s}))`, vars: ['x'], product: true } })],
      solution: [`Look for two numbers with product $${cs[0]} \\times (${cs[2]}) = ${cs[0] * cs[2]}$ and sum $${cs[1]}$.`, `$${poly(cs)} = ${sol}$`, 'Check by expanding back.'],
    };
  },
});

add({
  id: 'em-subject', topic: 'N5', title: 'Changing the subject', tiers: ['basic', 'challenging', 'advanced'],
  gen(r, tier) {
    const a = r.int(2, 7), b = r.nz(-9, 9), c = r.int(2, 6);
    if (tier === 'basic') {
      return {
        stem: `Make $x$ the subject of $y = \\dfrac{${lin(a, b)}}{${c}}$.`,
        parts: [M('a', { pre: 'x =', kb: 'alg', key: { type: 'expr', v: `(${c}*y-(${b}))/${a}`, vars: ['y'] } })],
        solution: [`$${c}y = ${lin(a, b)}$`, `$${a}x = ${c}y${sg(-b)}$`, `$x = \\dfrac{${c}y${sg(-b)}}{${a}}$`],
      };
    }
    if (tier === 'challenging') {
      return {
        stem: `Make $x$ the subject of $y = \\sqrt{\\dfrac{x ${b < 0 ? '-' : '+'} ${Math.abs(b)}}{${c}}}$.`,
        parts: [M('a', { pre: 'x =', kb: 'alg', key: { type: 'expr', v: `${c}*y^2-(${b})`, vars: ['y'] } })],
        solution: ['Square both sides first.', `$y^{2} = \\dfrac{x${sg(b)}}{${c}}$`, `$x = ${c}y^{2}${sg(-b)}$`],
      };
    }
    return {
      stem: `Make $x$ the subject of $\\dfrac{${a}}{x ${b < 0 ? '-' : '+'} ${Math.abs(b)}} = y + ${c}$.`,
      parts: [M('a', { pre: 'x =', kb: 'alg', key: { type: 'expr', v: `${a}/(y+${c})-(${b})`, vars: ['y'], domain: [0.5, 3] } })],
      solution: [`$x${sg(b)} = \\dfrac{${a}}{y + ${c}}$`, `$x = \\dfrac{${a}}{y + ${c}}${sg(-b)}$`],
    };
  },
});

add({
  id: 'em-algfrac', topic: 'N5', title: 'Algebraic fractions', tiers: ['challenging', 'advanced'],
  gen(r) {
    const a = r.int(1, 7);
    let b = r.int(1, 8);
    if (b === a) b = a + 1;
    // (x^2 - a^2) / (x^2 + (b-a)x - ab) = (x+a)/(x+b)
    return {
      stem: `Simplify $\\dfrac{x^{2} - ${a * a}}{${poly([1, b - a, -a * b])}}$.`,
      parts: [M('a', { kb: 'alg', key: { type: 'expr', v: `(x+${a})/(x+${b})`, vars: ['x'], forbid: ['^(2)', 'x^2'] } })],
      solution: [`Numerator: difference of two squares $(x - ${a})(x + ${a})$`, `Denominator: $(x - ${a})(x + ${b})$`, `Cancel the common factor $(x - ${a})$: $\\dfrac{x + ${a}}{x + ${b}}$`],
    };
  },
});

add({
  id: 'em-lineq', topic: 'N7', title: 'Linear equations with fractions', tiers: ['basic', 'challenging'],
  gen(r) {
    const b = r.int(2, 5);
    let d = r.int(2, 6);
    if (d === b) d++;
    const a = r.nz(-6, 6), c = r.nz(-6, 6), e = r.nz(-3, 4);
    // (x+a)/b - (x-c)/d = e  -> d(x+a) - b(x-c) = bde
    const num = b * d * e - d * a - b * c, den = d - b;
    return {
      stem: `Solve $\\dfrac{x ${a < 0 ? '-' : '+'} ${Math.abs(a)}}{${b}} - \\dfrac{x ${c < 0 ? '+' : '-'} ${Math.abs(c)}}{${d}} = ${e}$.`,
      parts: [M('a', { pre: 'x =', kb: 'num', key: { type: 'num', v: frk(num, den) } })],
      solution: [`Multiply every term by $${b * d}$: $${d}(x${sg(a)}) - ${b}(x${sg(-c)}) = ${b * d * e}$`, `$${d - b}x = ${num}$`, `$x = ${fr(num, den)}$`],
    };
  },
});

add({
  id: 'em-simul', topic: 'N7', title: 'Simultaneous equations', tiers: ['basic', 'challenging'],
  gen(r) {
    const x = r.int(-6, 6), y = r.int(-6, 6);
    let a1, b1, a2, b2;
    do { a1 = r.nz(-5, 5); b1 = r.nz(-5, 5); a2 = r.nz(-5, 5); b2 = r.nz(-5, 5); } while (a1 * b2 - a2 * b1 === 0);
    const c1 = a1 * x + b1 * y, c2 = a2 * x + b2 * y;
    return {
      stem: `Solve the simultaneous equations $$${poly([a1, 0]).replace('x', 'x')}${coef(b1, 'y')} = ${c1}, \\qquad ${poly([a2, 0])}${coef(b2, 'y')} = ${c2}.$$`,
      parts: [
        M('x', { pre: 'x =', kb: 'num', key: { type: 'num', v: String(x) } }),
        M('y', { pre: 'y =', kb: 'num', key: { type: 'num', v: String(y) } }),
      ],
      solution: [`Make the coefficients of $y$ equal: multiply the first by $${Math.abs(b2)}$ and the second by $${Math.abs(b1)}$, then eliminate.`, `$x = ${x}$`, `Substitute back: $y = ${y}$`, 'Check in **both** equations.'],
    };
  },
});

add({
  id: 'em-quadformula', topic: 'N7', title: 'Quadratic formula', tiers: ['basic', 'challenging'],
  gen(r) {
    let a, b, c, D;
    do { a = r.int(1, 4); b = r.nz(-9, 9); c = r.nz(-9, 9); D = b * b - 4 * a * c; } while (D <= 0 || Number.isInteger(Math.sqrt(D)));
    const x1 = (-b + Math.sqrt(D)) / (2 * a), x2 = (-b - Math.sqrt(D)) / (2 * a);
    return {
      stem: `Solve $${poly([a, b, c])} = 0$, giving your answers correct to 2 decimal places.`,
      parts: [M('a', { pre: 'x =', kb: 'num', multi: [{ type: 'num', v: String(x1), acc: 'dp2' }, { type: 'num', v: String(x2), acc: 'dp2' }] })],
      solution: [`$x = \\dfrac{-b \\pm \\sqrt{b^{2} - 4ac}}{2a} = \\dfrac{${-b} \\pm \\sqrt{${D}}}{${2 * a}}$`, `$x = ${x1.toFixed(2)}$ or $x = ${x2.toFixed(2)}$`],
    };
  },
});

add({
  id: 'em-inequality', topic: 'N7', title: 'Linear inequalities', tiers: ['basic', 'challenging'],
  gen(r, tier) {
    let p, q, s, t;
    do { p = r.nz(-9, 9); q = r.nz(-6, 6); s = r.nz(-9, 9); t = r.nz(-6, 6); } while (q === t);
    const strict = r.chance(0.5);
    // p + qx < s + tx  ->  (q - t) x < s - p
    const k = q - t, rhs = s - p;
    const flip = k < 0;
    const sym = strict ? (flip ? '>' : '<') : flip ? '\\ge' : '\\le';
    const opts = ['<', '>', '\\le', '\\ge'];
    const parts = [
      C('d', { label: '(a)', prompt: 'The solution is $x \\;\\square\\; k$. Which sign?', options: opts.map((o) => `$x ${o} k$`), correct: opts.indexOf(sym) }),
      M('k', { label: '', pre: 'k =', kb: 'num', key: { type: 'num', v: frk(rhs, k) } }),
    ];
    const bound = rhs / k;
    if (tier === 'challenging') {
      const isInt = Number.isInteger(bound);
      let ans;
      if (sym === '>' ) ans = Math.floor(bound) + 1;
      else if (sym === '\\ge') ans = Math.ceil(bound);
      else if (sym === '<') ans = isInt ? bound - 1 : Math.floor(bound);
      else ans = Math.floor(bound);
      parts.push(M('i', { label: '(b)', prompt: `Hence write down the ${sym === '>' || sym === '\\ge' ? 'smallest' : 'largest'} integer value of $x$.`, kb: 'num', key: { type: 'num', v: String(ans) } }));
    }
    return {
      stem: `Solve the inequality $${p}${coef(q, 'x')} ${strict ? '<' : '\\le'} ${s}${coef(t, 'x')}$.`,
      parts,
      solution: [`Collect $x$ terms: $${k}x ${strict ? '<' : '\\le'} ${rhs}$`, flip ? '**Dividing by a negative number reverses the inequality sign.**' : `Divide by $${k}$.`, `$x ${sym} ${fr(rhs, k)}$`],
    };
  },
});

function vennSvg(region) {
  // regions: 'AnB','AuB','AnB_','A_nB','AuB_'
  const id = 'v' + Math.random().toString(36).slice(2, 7);
  const A = `<circle cx="120" cy="115" r="62"/>`, B = `<circle cx="200" cy="115" r="62"/>`;
  let fill = '';
  if (region === 'AnB') fill = `<clipPath id="${id}a">${A}</clipPath><circle class="dg-fill" clip-path="url(#${id}a)" cx="200" cy="115" r="62"/>`;
  if (region === 'AuB') fill = `<g class="dg-fill">${A}${B}</g>`;
  if (region === 'AnB_') fill = `<mask id="${id}m"><rect width="320" height="230" fill="white"/><circle cx="200" cy="115" r="62" fill="black"/></mask><circle class="dg-fill" mask="url(#${id}m)" cx="120" cy="115" r="62"/>`;
  if (region === 'A_nB') fill = `<mask id="${id}m"><rect width="320" height="230" fill="white"/><circle cx="120" cy="115" r="62" fill="black"/></mask><circle class="dg-fill" mask="url(#${id}m)" cx="200" cy="115" r="62"/>`;
  if (region === 'AuB_') fill = `<mask id="${id}m"><rect width="320" height="230" fill="white"/><circle cx="120" cy="115" r="62" fill="black"/><circle cx="200" cy="115" r="62" fill="black"/></mask><rect class="dg-fill" mask="url(#${id}m)" x="20" y="20" width="280" height="190"/>`;
  return `<svg class="diagram" viewBox="0 0 320 230">${fill}<rect class="dg-line" x="20" y="20" width="280" height="190" fill="none"/><circle class="dg-line" cx="120" cy="115" r="62" fill="none"/><circle class="dg-line" cx="200" cy="115" r="62" fill="none"/><text class="dg-lbl" x="80" y="62">A</text><text class="dg-lbl" x="240" y="62">B</text><text class="dg-lbl" x="34" y="36">ξ</text></svg>`;
}

add({
  id: 'em-sets', topic: 'N8', title: 'Set language and notation', tiers: ['basic', 'challenging'],
  gen(r, tier) {
    if (tier === 'basic' || r.chance(0.4)) {
      const regions = [['AnB', 'A \\cap B'], ['AuB', 'A \\cup B'], ['AnB_', "A \\cap B'"], ['A_nB', "A' \\cap B"], ['AuB_', "(A \\cup B)'"]];
      const i = r.int(0, regions.length - 1);
      const others = r.shuffle(regions.filter((_, j) => j !== i)).slice(0, 3);
      const opts = [regions[i], ...others];
      return {
        stem: 'Which set is represented by the shaded region?',
        diagram: vennSvg(regions[i][0]),
        parts: [C('a', { options: opts.map((o) => `$${o[1]}$`), correct: 0 })],
        solution: [`Shaded region $= ${regions[i][1]}$`, "$\\cap$ = in both, $\\cup$ = in either, $'$ = **not** in the set."],
      };
    }
    const i = r.int(2, 15), oa = r.int(3, 20), ob = r.int(3, 20), ne = r.int(1, 12);
    const U = i + oa + ob + ne;
    return {
      stem: `In a class survey, $n(\\xi) = ${U}$, $n(A) = ${i + oa}$, $n(B) = ${i + ob}$ and $n((A \\cup B)') = ${ne}$. Find`,
      parts: [
        M('a', { label: '(a)', prompt: '$n(A \\cap B)$,', kb: 'num', key: { type: 'num', v: String(i) } }),
        M('b', { label: '(b)', prompt: "$n(A \\cap B')$.", kb: 'num', key: { type: 'num', v: String(oa) } }),
      ],
      solution: [`$n(A \\cup B) = ${U} - ${ne} = ${U - ne}$`, `$n(A \\cap B) = n(A) + n(B) - n(A \\cup B) = ${i + oa} + ${i + ob} - ${U - ne} = ${i}$`, `$n(A \\cap B') = ${i + oa} - ${i} = ${oa}$`],
    };
  },
});

add({
  id: 'em-gradient', topic: 'N6', title: 'Straight-line graphs', tiers: ['basic', 'challenging'],
  gen(r) {
    let x1, y1, x2, y2;
    do { x1 = r.int(-6, 6); x2 = r.int(-6, 6); y1 = r.int(-8, 8); y2 = r.int(-8, 8); } while (x1 === x2 || (y2 - y1) % (x2 - x1) !== 0);
    const m = (y2 - y1) / (x2 - x1), c = y1 - m * x1;
    return {
      stem: `A line passes through $A(${x1}, ${y1})$ and $B(${x2}, ${y2})$. Its equation is $y = mx + c$.`,
      parts: [
        M('m', { label: '(a)', prompt: 'Find the gradient.', pre: 'm =', kb: 'num', key: { type: 'num', v: String(m) } }),
        M('c', { label: '(b)', prompt: 'Find the $y$-intercept.', pre: 'c =', kb: 'num', key: { type: 'num', v: String(c) } }),
      ],
      solution: [`$m = \\dfrac{${y2} - (${y1})}{${x2} - (${x1})} = ${m}$`, `Substitute $A$: $${y1} = ${m}(${x1}) + c \\Rightarrow c = ${c}$`, `$y = ${poly([m, c])}$`],
    };
  },
});

// ---------------- GEOMETRY ----------------
add({
  id: 'em-polygon', topic: 'G1', title: 'Angles in polygons', tiers: ['basic', 'challenging'],
  gen(r, tier) {
    const n = r.pick([5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36]);
    const int = (180 * (n - 2)) / n, ext = 360 / n;
    if (tier === 'basic') {
      return {
        stem: `Find the size of each interior angle of a regular polygon with ${n} sides.`,
        parts: [M('a', { post: '^\\circ', kb: 'num', key: { type: 'num', v: String(int) } })],
        solution: [`Each exterior angle $= \\dfrac{360^\\circ}{${n}} = ${fmt(ext)}^\\circ$`, `Interior $= 180^\\circ - ${fmt(ext)}^\\circ = ${fmt(int)}^\\circ$`],
      };
    }
    return {
      stem: `Each interior angle of a regular polygon is $${fmt(int)}^\\circ$. Find the number of sides.`,
      parts: [M('a', { kb: 'num', key: { type: 'num', v: String(n) } })],
      solution: [`Exterior angle $= 180^\\circ - ${fmt(int)}^\\circ = ${fmt(ext)}^\\circ$`, `$n = \\dfrac{360^\\circ}{${fmt(ext)}^\\circ} = ${n}$`],
    };
  },
});

add({
  id: 'em-parallel', topic: 'G1', title: 'Angles with parallel lines (with reasons)', tiers: ['basic', 'challenging', 'advanced'], proof: true,
  gen(r, tier) {
    const a = r.int(35, 145);
    const th = 180 - a; // direction of transversal (upwards) from +x axis
    const F = new Fig(320, 230);
    const t = (th * Math.PI) / 180;
    const Q = [160 + 70 / Math.tan(t) * 0, 80];
    // place Q on top line y=80, R on bottom line y=160 along direction t
    const dx = 80 / Math.tan(t);
    const Qp = [160 + dx / 2, 80], Rp = [160 - dx / 2, 160];
    void Q;
    F.seg([30, 80], [290, 80]).seg([30, 160], [290, 160]);
    const ext = 45;
    const Pp = [Qp[0] + Math.cos(t) * ext, Qp[1] - Math.sin(t) * ext];
    const Sp = [Rp[0] - Math.cos(t) * ext, Rp[1] + Math.sin(t) * ext];
    F.seg(Pp, Sp);
    F.pt('A', 30, 80, { off: [-10, -8] }).pt('B', 290, 80, { off: [10, -8] }).pt('C', 30, 160, { off: [-10, 8] }).pt('D', 290, 160, { off: [10, 8] });
    F.pt('P', Pp[0], Pp[1], { off: [0, -12] }).pt('Q', Qp[0], Qp[1], { off: [12, -10] }).pt('R', Rp[0], Rp[1], { off: [-12, 10] }).pt('S', Sp[0], Sp[1], { off: [0, 12] });
    F.arrow('A', 'B').arrow('C', 'D');
    F.angle('Q', 'A', 'P', `${a}°`, 16);
    const { LT, L, map } = relabel(r, ['A', 'B', 'C', 'D', 'P', 'Q', 'R', 'S']);
    let svg = F.toString().replace(/>([A-Z])</g, (m, c) => `>${map[c] || c}<`);
    const lines = [
      [`$${SL(L('∠BQR'))} =$`, N({ type: 'num', v: String(a) }, '', '^\\circ'), R('vert_opp', ['alt', 'corr'])],
      [`$${SL(L('∠QRC'))} =$`, N({ type: 'num', v: String(a) }, '', '^\\circ'), R('alt', ['corr', 'co_int', 'vert_opp'])],
      [`$${SL(L('∠QRD'))} =$`, N({ type: 'num', v: String(180 - a) }, '', '^\\circ'), R(['adj_line', 'co_int'], ['alt', 'corr', 'tri_sum'])],
    ];
    if (tier !== 'basic') lines.push([`$${SL(L('∠DRS'))} =$`, N({ type: 'num', v: String(a) }, '', '^\\circ'), R(['corr', 'vert_opp'], ['alt', 'co_int'])]);
    return {
      stem: LT(`In the diagram, $AB \\parallel CD$ and the straight line $PQRS$ cuts them at $Q$ and $R$. $\\angle AQP = ${a}^\\circ$. Find each angle, stating your reason.`),
      diagram: svg,
      parts: [P('p', { lines, group: 'lines' })],
      solution: [LT(`$\\angle BQR = ${a}^\\circ$ (vertically opposite angles)`), LT(`$\\angle QRC = \\angle BQR = ${a}^\\circ$ (alternate angles, $AB \\parallel CD$)`), LT(`$\\angle QRD = 180^\\circ - ${a}^\\circ = ${180 - a}^\\circ$ (angles on a straight line)`), ...(tier !== 'basic' ? [LT(`$\\angle DRS = \\angle BQR = ${a}^\\circ$ (corresponding angles)`)] : [])],
    };
  },
});

add({
  id: 'em-proof-cong', topic: 'G2', title: 'Congruence proof', tiers: ['basic', 'challenging', 'advanced'], proof: true,
  gen(r, tier) {
    const cfg = r.int(0, 3);
    const F = new Fig(320, 230);
    const names = ['A', 'B', 'C', 'D', 'M', 'X'];
    const { L, LT, map } = relabel(r, names);
    const hard = tier !== 'basic';
    let stem, lines, sol;
    if (cfg === 0) {
      F.pt('A', 160, 25).pt('B', 70, 120).pt('C', 160, 205).pt('D', 250, 120);
      F.poly(['A', 'B', 'C', 'D']).seg('A', 'C', 'dg-line dg-dash');
      F.tick('A', 'B', 1).tick('A', 'D', 1).tick('B', 'C', 2).tick('D', 'C', 2);
      stem = LT('In the quadrilateral $ABCD$, $AB = AD$ and $CB = CD$. Prove that $\\triangle ABC \\cong \\triangle ADC$, and hence that $AC$ bisects $\\angle BAD$.');
      lines = [
        [`$${SL(L('AB = AD'))}$`, R('given')],
        [`$${SL(L('CB = CD'))}$`, R('given')],
        hard ? [S(L('AC=AC')), R('common_side')] : [`$${SL(L('AC = AC'))}$`, R('common_side', ['given', 'radii'])],
        [S(L('△ABC≅△ADC'), [L('△ABC≅△DAC'), L('△ABC∼△ADC')]), R('sss', ['sas', 'rhs', 'asa'])],
        [hard ? S(L('∠BAC=∠DAC')) : `$${SL(L('∠BAC = ∠DAC'))}$`, R('cong_angles', ['alt', 'isos', 'cong_sides'])],
        [LT('so $AC$ bisects $\\angle BAD$.')],
      ];
      sol = ['Two pairs of sides are given; the third side is shared.', 'SSS gives congruence; then use corresponding angles of congruent triangles.'];
    } else if (cfg === 1) {
      F.pt('A', 60, 50).pt('B', 260, 180).pt('C', 70, 175).pt('D', 250, 55).pt('M', 160, 115, { off: [0, -14] });
      F.seg('A', 'B').seg('C', 'D').seg('A', 'C').seg('D', 'B');
      F.tick('A', 'M', 1).tick('M', 'B', 1).tick('C', 'M', 2).tick('M', 'D', 2);
      stem = LT('The lines $AB$ and $CD$ intersect at $M$, where $M$ is the midpoint of both $AB$ and $CD$. Prove that $\\triangle AMC \\cong \\triangle BMD$ and hence that $AC \\parallel DB$.');
      lines = [
        [`$${SL(L('AM = BM'))}$`, R(['midpoint', 'given'])],
        [hard ? S(L('∠AMC=∠BMD')) : `$${SL(L('∠AMC = ∠BMD'))}$`, R('vert_opp', ['alt', 'corr', 'adj_line'])],
        [`$${SL(L('CM = DM'))}$`, R(['midpoint', 'given'])],
        [S(L('△AMC≅△BMD'), [L('△AMC≅△DMB'), L('△AMC∼△BMD')]), R('sas', ['sss', 'asa', 'rhs'])],
        [hard ? S(L('∠CAM=∠DBM')) : `$${SL(L('∠CAM = ∠DBM'))}$`, R('cong_angles', ['alt', 'vert_opp'])],
        [hard ? S(L('AC∥DB'), [L('AC⊥DB')]) : `$${SL(L('AC ∥ DB'))}$`, R('conv_alt', ['alt', 'corr', 'co_int'])],
      ];
      sol = ['The included angle is between the two pairs of equal sides — that is SAS.', 'Equal alternate angles ⇒ the lines are parallel (converse).'];
    } else if (cfg === 2) {
      const O = [160, 95];
      F.circle(160, 95, 78);
      const A = polar(160, 95, 78, 215), B = polar(160, 95, 78, 325);
      F.pt('O', O[0], O[1], { off: [0, -12] }).pt('A', A[0], A[1]).pt('B', B[0], B[1]).pt('M', 160, A[1], { off: [0, 13] });
      F.seg('A', 'B').seg('O', 'A').seg('O', 'B').seg('O', 'M', 'dg-line dg-dash').right('M', 'B', 'O');
      stem = LT('$O$ is the centre of the circle and $M$ is a point on the chord $AB$ such that $OM \\perp AB$. Prove that $\\triangle OMA \\cong \\triangle OMB$ and hence that $AM = BM$.');
      lines = [
        [hard ? S(L('∠OMA=∠OMB')) : `$${SL(L('∠OMA = ∠OMB'))} = 90^\\circ$`, R('given', ['tan_rad', 'semicircle'])],
        [hard ? S(L('OA=OB')) : `$${SL(L('OA = OB'))}$`, R('radii', ['given', 'tan_ext'])],
        [`$${SL(L('OM = OM'))}$`, R('common_side')],
        [S(L('△OMA≅△OMB'), [L('△OMA≅△MOB'), L('△OMA∼△OMB')]), R('rhs', ['sas', 'sss', 'asa'])],
        [hard ? S(L('AM=BM')) : `$${SL(L('AM = BM'))}$`, R('cong_sides', ['radii', 'midpoint'])],
      ];
      sol = ['A right angle, equal hypotenuses (the radii) and a common side give congruence by right angle-hypotenuse-side (RHS).', 'This is exactly why the perpendicular from the centre bisects a chord.'];
    } else {
      F.pt('A', 60, 45).pt('B', 260, 45).pt('C', 260, 185).pt('D', 60, 185).pt('X', 160, 115, { off: [14, 0] });
      F.seg('A', 'B').seg('D', 'C').seg('A', 'C').seg('B', 'D').arrow('A', 'B').arrow('D', 'C');
      F.tick('A', 'B', 2).tick('D', 'C', 2);
      stem = LT('$AB \\parallel DC$ and $AB = DC$. The diagonals $AC$ and $BD$ meet at $X$. Prove that $\\triangle ABX \\cong \\triangle CDX$ and hence that $X$ is the midpoint of $AC$.');
      lines = [
        [hard ? S(L('∠BAX=∠DCX')) : `$${SL(L('∠BAX = ∠DCX'))}$`, R('alt', ['corr', 'vert_opp', 'co_int'])],
        [hard ? S(L('∠ABX=∠CDX')) : `$${SL(L('∠ABX = ∠CDX'))}$`, R('alt', ['corr', 'vert_opp'])],
        [`$${SL(L('AB = CD'))}$`, R('given')],
        [S(L('△ABX≅△CDX'), [L('△ABX≅△DCX'), L('△ABX∼△CDX')]), R(['aas', 'asa'], ['sas', 'sss', 'rhs'])],
        [hard ? S(L('AX=CX')) : `$${SL(L('AX = CX'))}$`, R('cong_sides', ['given', 'midpoint'])],
      ];
      sol = ['Parallel lines give two pairs of alternate angles.', 'Two angles and a corresponding side give congruence by angle-angle-side (AAS); many schools also accept angle-side-angle (ASA).'];
    }
    const svg = F.toString().replace(/>([A-Z])</g, (m, c) => `>${map[c] || c}<`);
    return { stem, diagram: svg, parts: [P('p', { lines, group: 'cong', prompt: 'Complete the proof.' })], solution: sol.concat(['Order of letters matters: matching vertices must be in the same position in both triangles.']) };
  },
});

add({
  id: 'em-proof-sim', topic: 'G2', title: 'Similar triangles', tiers: ['basic', 'challenging', 'advanced'], proof: true,
  gen(r, tier) {
    const hard = tier !== 'basic';
    const { L, LT, map } = relabel(r, ['A', 'B', 'C', 'D', 'E', 'X']);
    const F = new Fig(320, 230);
    if (r.chance(0.5)) {
      const ad = r.int(2, 6), db = r.int(2, 6), de = r.int(2, 9);
      const bc = (de * (ad + db)) / ad;
      const k = ad / (ad + db);
      F.pt('A', 160, 20).pt('B', 40, 205).pt('C', 280, 205);
      F.pt('D', 160 - 120 * k, 20 + 185 * k, { off: [-12, 0] }).pt('E', 160 + 120 * k, 20 + 185 * k, { off: [12, 0] });
      F.poly(['A', 'B', 'C']).seg('D', 'E').arrow('D', 'E').arrow('B', 'C');
      const svg = F.toString().replace(/>([A-Z])</g, (m, c) => `>${map[c] || c}<`);
      return {
        stem: LT(`$D$ and $E$ lie on $AB$ and $AC$ with $DE \\parallel BC$. $AD = ${ad}$ cm, $DB = ${db}$ cm and $DE = ${de}$ cm. Show that $\\triangle ADE \\sim \\triangle ABC$ and find $BC$.`),
        diagram: svg,
        parts: [P('p', {
          group: 'sim', prompt: 'Complete the working.',
          lines: [
            [hard ? S(L('∠ADE=∠ABC')) : `$${SL(L('∠ADE = ∠ABC'))}$`, R('corr', ['alt', 'vert_opp', 'co_int'])],
            [hard ? S(L('∠AED=∠ACB')) : `$${SL(L('∠AED = ∠ACB'))}$`, R('corr', ['alt', 'vert_opp'])],
            [S(L('△ADE∼△ABC'), [L('△ADE≅△ABC'), L('△ADE∼△ACB')]), R('aa_sim', ['sss', 'asa', 'sas'])],
            [LT('$\\dfrac{BC}{DE} = \\dfrac{AB}{AD} \\Rightarrow BC =$'), N({ type: 'num', v: String(bc), acc: 'sf3' }, '', '\\text{ cm}'), R('sim_ratio', ['midpt_thm', 'cong_sides'])],
          ],
        })],
        solution: [LT(`$AB = ${ad + db}$ cm`), LT(`$BC = ${de} \\times \\dfrac{${ad + db}}{${ad}} = ${fmt3(bc)}$ cm`), 'Use $AB$, not $DB$, in the ratio — a very common slip.'],
      };
    }
    const ax = r.int(3, 9), xb = r.int(2, 8), cx = r.int(2, 8);
    const xd = (ax * xb) / cx;
    F.circle(160, 115, 90);
    const A = polar(160, 115, 90, 160), B = polar(160, 115, 90, 340), C = polar(160, 115, 90, 60), D = polar(160, 115, 90, 245);
    // intersection of AB and CD
    const ix = intersect(A, B, C, D);
    F.pt('A', ...A).pt('B', ...B).pt('C', ...C).pt('D', ...D).pt('X', ix[0], ix[1], { off: [8, -12] });
    F.seg('A', 'B').seg('C', 'D').seg('A', 'C', 'dg-line dg-dash').seg('D', 'B', 'dg-line dg-dash');
    const svg = F.toString().replace(/>([A-Z])</g, (m, c) => `>${map[c] || c}<`);
    return {
      stem: LT(`The chords $AB$ and $CD$ of a circle meet at $X$. $AX = ${ax}$ cm, $XB = ${xb}$ cm and $CX = ${cx}$ cm. Show that $\\triangle AXC \\sim \\triangle DXB$ and find $XD$.`),
      diagram: svg,
      parts: [P('p', {
        group: 'sim', prompt: 'Complete the working.',
        lines: [
          [hard ? S(L('∠CAB=∠CDB')) : `$${SL(L('∠CAB = ∠CDB'))}$`, R('same_seg', ['alt_seg', 'centre', 'cyclic'])],
          [hard ? S(L('∠AXC=∠DXB')) : `$${SL(L('∠AXC = ∠DXB'))}$`, R('vert_opp', ['alt', 'corr'])],
          [S(L('△AXC∼△DXB'), [L('△AXC≅△DXB'), L('△AXC∼△BXD')]), R('aa_sim', ['sss', 'asa'])],
          [LT('$\\dfrac{AX}{DX} = \\dfrac{CX}{BX} \\Rightarrow XD =$'), N({ type: 'num', v: String(xd), acc: 'sf3' }, '', '\\text{ cm}')],
        ],
      })],
      solution: [LT('Both $\\angle CAB$ and $\\angle CDB$ stand on the arc $CB$.'), LT(`$AX \\cdot XB = CX \\cdot XD \\Rightarrow XD = \\dfrac{${ax} \\times ${xb}}{${cx}} = ${fmt3(xd)}$ cm`)],
    };
  },
});

function intersect(p1, p2, p3, p4) {
  const [x1, y1] = p1, [x2, y2] = p2, [x3, y3] = p3, [x4, y4] = p4;
  const d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / d;
  return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)];
}

add({
  id: 'em-circle', topic: 'G3', title: 'Circle properties (with reasons)', tiers: ['basic', 'challenging', 'advanced'], proof: true,
  gen(r, tier) {
    const cfg = r.int(0, 3);
    const F = new Fig(320, 230);
    const cx = 160, cy = 115, rad = 85;
    F.circle(cx, cy, rad);
    const { LT, L, map } = relabel(r, ['A', 'B', 'C', 'D', 'T']);
    let stem, lines, sol;
    if (cfg === 0) {
      const a = r.int(22, 66);
      const A = polar(cx, cy, rad, 180), B = polar(cx, cy, rad, 0), Cc = polar(cx, cy, rad, 2 * a);
      F.pt('A', ...A).pt('B', ...B).pt('C', ...Cc).pt('O', cx, cy, { off: [0, 12] });
      F.seg('A', 'B').seg('A', 'C').seg('C', 'B').angle('A', 'B', 'C', `${a}°`, 22);
      stem = LT(`$AB$ is a diameter of the circle with centre $O$, and $C$ lies on the circle. $\\angle CAB = ${a}^\\circ$.`);
      lines = [
        [`$${SL(L('∠ACB'))} =$`, N({ type: 'num', v: '90' }, '', '^\\circ'), R('semicircle', ['centre', 'tan_rad', 'same_seg'])],
        [`$${SL(L('∠ABC'))} =$`, N({ type: 'num', v: String(90 - a) }, '', '^\\circ'), R('tri_sum', ['adj_line', 'ext_ang', 'isos'])],
      ];
      sol = [LT('$\\angle ACB = 90^\\circ$ (angle in a semicircle)'), LT(`$\\angle ABC = 180^\\circ - 90^\\circ - ${a}^\\circ = ${90 - a}^\\circ$`)];
    } else if (cfg === 1) {
      const a = r.int(25, 80);
      const A = polar(cx, cy, rad, 270 - a), B = polar(cx, cy, rad, 270 + a), Cc = polar(cx, cy, rad, 90 + r.int(-25, 25));
      F.pt('A', ...A).pt('B', ...B).pt('C', ...Cc).pt('O', cx, cy, { off: [0, -13] });
      F.seg('O', 'A').seg('O', 'B').seg('C', 'A').seg('C', 'B').angle('O', 'A', 'B', `${2 * a}°`, 18);
      stem = LT(`$A$, $B$ and $C$ lie on the circle with centre $O$. $\\angle AOB = ${2 * a}^\\circ$.`);
      lines = [[`$${SL(L('∠ACB'))} =$`, N({ type: 'num', v: String(a) }, '', '^\\circ'), R('centre', ['same_seg', 'semicircle', 'cyclic'])]];
      if (tier !== 'basic') lines.push([`$${SL(L('∠OAB'))} =$`, N({ type: 'num', v: String(90 - a) }, '', '^\\circ'), R('isos', ['radii', 'tri_sum', 'tan_rad'])]);
      sol = [LT(`$\\angle ACB = \\tfrac12 \\angle AOB = ${a}^\\circ$ (angle at centre is twice angle at circumference)`), ...(tier !== 'basic' ? [LT(`$OA = OB$ (radii), so $\\triangle OAB$ is isosceles: $\\angle OAB = \\dfrac{180^\\circ - ${2 * a}^\\circ}{2} = ${90 - a}^\\circ$`)] : [])];
    } else if (cfg === 2) {
      const a = r.int(55, 125);
      const B = polar(cx, cy, rad, 90), A = polar(cx, cy, rad, 270 - a), Cc = polar(cx, cy, rad, 270 + a), D = polar(cx, cy, rad, 270);
      F.pt('A', ...A).pt('B', ...B).pt('C', ...Cc).pt('D', ...D);
      F.poly(['A', 'B', 'C', 'D']).angle('B', 'A', 'C', `${a}°`, 18);
      stem = LT(`$ABCD$ is a cyclic quadrilateral with $\\angle ABC = ${a}^\\circ$.`);
      lines = [[`$${SL(L('∠ADC'))} =$`, N({ type: 'num', v: String(180 - a) }, '', '^\\circ'), R('cyclic', ['same_seg', 'co_int', 'centre'])]];
      sol = [LT(`$\\angle ADC = 180^\\circ - ${a}^\\circ = ${180 - a}^\\circ$ (angles in opposite segments)`)];
    } else {
      const b = r.int(28, 55);
      const A = [cx, cy + rad];
      const tx = cx + rad * Math.tan((b * Math.PI) / 180);
      F.pt('O', cx, cy, { off: [0, -12] }).pt('A', ...A, { off: [0, 12] }).pt('T', Math.min(tx, 305), A[1], { off: [0, 12] });
      F.seg([30, A[1]], [310, A[1]]).seg('O', 'A').seg('O', 'T').right('A', 'O', 'T').angle('O', 'A', 'T', `${b}°`, 22);
      stem = LT(`$TA$ is a tangent to the circle with centre $O$ at $A$. $\\angle AOT = ${b}^\\circ$.`);
      lines = [
        [`$${SL(L('∠OAT'))} =$`, N({ type: 'num', v: '90' }, '', '^\\circ'), R('tan_rad', ['semicircle', 'alt_seg', 'radii'])],
        [`$${SL(L('∠ATO'))} =$`, N({ type: 'num', v: String(90 - b) }, '', '^\\circ'), R('tri_sum', ['ext_ang', 'adj_line', 'isos'])],
      ];
      sol = [LT('The tangent is perpendicular to the radius at the point of contact.'), LT(`$\\angle ATO = 180^\\circ - 90^\\circ - ${b}^\\circ = ${90 - b}^\\circ$`)];
    }
    const svg = F.toString().replace(/>([A-Z])</g, (m, c) => `>${map[c] || c}<`);
    return { stem: stem + ' Find each angle, giving a reason.', diagram: svg, parts: [P('p', { lines, group: 'circle' })], solution: sol };
  },
});

add({
  id: 'em-determine-right', topic: 'G4', title: 'Determine: right-angled triangle?', tiers: ['basic', 'challenging'], proof: true,
  gen(r) {
    const trip = r.pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [9, 40, 41], [20, 21, 29]]);
    const k = r.int(1, 3);
    let [a, b, c] = trip.map((v) => v * k);
    const yes = r.chance(0.55);
    if (!yes) c += r.pick([-1, 1]);
    const { LT, L } = relabel(r, ['P', 'Q', 'R']);
    return {
      stem: LT(`In $\\triangle PQR$, $PQ = ${a}$ cm, $QR = ${b}$ cm and $PR = ${c}$ cm. Determine whether $\\triangle PQR$ is right-angled. Show your working.`),
      parts: [
        P('p', {
          group: 'lines',
          lines: [
            [LT('$PQ^{2} + QR^{2} =$'), N({ type: 'num', v: String(a * a + b * b) })],
            [LT('$PR^{2} =$'), N({ type: 'num', v: String(c * c) })],
          ],
        }),
        C('c', { label: 'Conclusion', options: [LT('Since $PQ^2 + QR^2 = PR^2$, $\\triangle PQR$ is right-angled at $Q$ (converse of Pythagoras’ theorem).'), LT('Since $PQ^2 + QR^2 \\neq PR^2$, $\\triangle PQR$ is not right-angled.'), LT('It is right-angled because $PR$ is the longest side.'), LT('We cannot decide without measuring an angle.')], correct: yes ? 0 : 1 }),
      ],
      solution: [LT(`$PQ^2 + QR^2 = ${a * a} + ${b * b} = ${a * a + b * b}$`), LT(`$PR^2 = ${c * c}$`), yes ? 'Equal ⇒ right angle opposite the longest side, at $Q$. Name the theorem: **converse** of Pythagoras’ theorem.' : 'Not equal ⇒ not right-angled.', 'To *determine*, you must compute both sides and state a conclusion with the reason.'],
    };
  },
});

add({
  id: 'em-pythag-trig', topic: 'G4', title: 'Pythagoras and trigonometric ratios', tiers: ['basic', 'challenging'],
  gen(r, tier) {
    const F = new Fig(320, 230);
    F.pt('A', 60, 190).pt('B', 270, 190).pt('C', 270, 50);
    F.poly(['A', 'B', 'C']).right('B', 'A', 'C');
    const { map, LT } = relabel(r, ['A', 'B', 'C']);
    const mode = tier === 'basic' ? r.pick(['hyp', 'opp']) : r.pick(['opp', 'ang']);
    if (mode === 'hyp') {
      const a = r.int(3, 15), b = r.int(3, 15);
      F.label('A', 'B', `${a} cm`, -1).label('B', 'C', `${b} cm`, -1);
      const svg = F.toString().replace(/>([A-Z])</g, (m, c) => `>${map[c] || c}<`);
      return {
        stem: LT(`In $\\triangle ABC$, $\\angle ABC = 90^\\circ$, $AB = ${a}$ cm and $BC = ${b}$ cm. Find $AC$, correct to 3 significant figures.`),
        diagram: svg,
        parts: [M('a', { post: '\\text{ cm}', kb: 'num', key: { type: 'num', v: String(Math.hypot(a, b)), acc: 'sf3' } })],
        solution: [LT(`$AC^2 = ${a}^2 + ${b}^2 = ${a * a + b * b}$`), LT(`$AC = \\sqrt{${a * a + b * b}} = ${fmt3(Math.hypot(a, b))}$ cm`)],
      };
    }
    if (mode === 'opp') {
      const ang = r.int(20, 70), h = r.int(5, 20);
      F.label('A', 'C', `${h} cm`, 1).angle('A', 'B', 'C', `${ang}°`, 26);
      const svg = F.toString().replace(/>([A-Z])</g, (m, c) => `>${map[c] || c}<`);
      const bc = h * Math.sin((ang * Math.PI) / 180);
      return {
        stem: LT(`In $\\triangle ABC$, $\\angle ABC = 90^\\circ$, $\\angle BAC = ${ang}^\\circ$ and $AC = ${h}$ cm. Find $BC$, correct to 3 significant figures.`),
        diagram: svg,
        parts: [M('a', { post: '\\text{ cm}', kb: 'trig', key: { type: 'num', v: String(bc), acc: 'sf3' } })],
        solution: ['SOH-CAH-TOA: $BC$ is opposite, $AC$ is the hypotenuse → sine.', LT(`$BC = ${h} \\sin ${ang}^\\circ = ${fmt3(bc)}$ cm`)],
      };
    }
    const a = r.int(4, 15), b = r.int(4, 15);
    F.label('A', 'B', `${a} cm`, -1).label('B', 'C', `${b} cm`, -1);
    const svg = F.toString().replace(/>([A-Z])</g, (m, c) => `>${map[c] || c}<`);
    const ang = (Math.atan(b / a) * 180) / Math.PI;
    return {
      stem: LT(`In $\\triangle ABC$, $\\angle ABC = 90^\\circ$, $AB = ${a}$ cm and $BC = ${b}$ cm. Find $\\angle BAC$, correct to 1 decimal place.`),
      diagram: svg,
      parts: [M('a', { post: '^\\circ', kb: 'trig', key: { type: 'num', v: String(ang), acc: 'dp1' } })],
      solution: [LT(`$\\tan \\angle BAC = \\dfrac{${b}}{${a}}$`), LT(`$\\angle BAC = \\tan^{-1}\\left(\\dfrac{${b}}{${a}}\\right) = ${ang.toFixed(1)}^\\circ$`)],
    };
  },
});

add({
  id: 'em-sine-cosine', topic: 'G4', title: 'Sine rule, cosine rule and area', tiers: ['challenging', 'advanced'],
  gen(r) {
    const mode = r.pick(['cos', 'sin', 'area']);
    const { LT } = relabel(r, ['P', 'Q', 'R']);
    if (mode === 'cos') {
      const a = r.int(5, 15), b = r.int(5, 15), C = r.int(35, 130);
      const c = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos((C * Math.PI) / 180));
      return {
        stem: LT(`In $\\triangle PQR$, $PQ = ${a}$ cm, $QR = ${b}$ cm and $\\angle PQR = ${C}^\\circ$. Find $PR$.`),
        parts: [M('a', { post: '\\text{ cm}', kb: 'trig', key: { type: 'num', v: String(c), acc: 'sf3' } })],
        solution: ['Two sides and the included angle → cosine rule.', LT(`$PR^2 = ${a}^2 + ${b}^2 - 2(${a})(${b})\\cos ${C}^\\circ$`), LT(`$PR = ${fmt3(c)}$ cm`)],
      };
    }
    if (mode === 'sin') {
      const A = r.int(30, 75), B = r.int(30, 70), a = r.int(6, 18);
      const b = (a * Math.sin((B * Math.PI) / 180)) / Math.sin((A * Math.PI) / 180);
      return {
        stem: LT(`In $\\triangle PQR$, $\\angle QPR = ${A}^\\circ$, $\\angle PQR = ${B}^\\circ$ and $QR = ${a}$ cm. Find $PR$.`),
        parts: [M('a', { post: '\\text{ cm}', kb: 'trig', key: { type: 'num', v: String(b), acc: 'sf3' } })],
        solution: ['Match each side with its opposite angle: $QR$ ↔ $\\angle P$, $PR$ ↔ $\\angle Q$.', LT(`$\\dfrac{PR}{\\sin ${B}^\\circ} = \\dfrac{${a}}{\\sin ${A}^\\circ}$`), LT(`$PR = ${fmt3(b)}$ cm`)],
      };
    }
    const a = r.int(5, 16), b = r.int(5, 16), C = r.int(25, 150);
    const ar = 0.5 * a * b * Math.sin((C * Math.PI) / 180);
    return {
      stem: LT(`In $\\triangle PQR$, $PQ = ${a}$ cm, $QR = ${b}$ cm and $\\angle PQR = ${C}^\\circ$. Find the area of $\\triangle PQR$.`),
      parts: [M('a', { post: '\\text{ cm}^2', kb: 'trig', key: { type: 'num', v: String(ar), acc: 'sf3' } })],
      solution: [`Area $= \\tfrac12 ab\\sin C = \\tfrac12(${a})(${b})\\sin ${C}^\\circ = ${fmt3(ar)}$ cm²`],
    };
  },
});

add({
  id: 'em-arc-sector', topic: 'G5', title: 'Arc length and sector area', tiers: ['basic', 'challenging', 'advanced'],
  gen(r, tier) {
    const rad = r.int(4, 20), th = r.pick([30, 40, 45, 60, 72, 80, 100, 120, 135, 150]);
    const arc = (th / 360) * 2 * Math.PI * rad, area = (th / 360) * Math.PI * rad * rad;
    if (tier === 'basic') {
      return {
        stem: `A sector of a circle has radius ${rad} cm and angle $${th}^\\circ$. Find`,
        parts: [
          M('a', { label: '(a)', prompt: 'the arc length,', post: '\\text{ cm}', kb: 'num', key: { type: 'num', v: String(arc), acc: 'sf3' } }),
          M('b', { label: '(b)', prompt: 'the area of the sector.', post: '\\text{ cm}^2', kb: 'num', key: { type: 'num', v: String(area), acc: 'sf3' } }),
        ],
        solution: [`Arc $= \\dfrac{${th}}{360} \\times 2\\pi(${rad}) = ${fmt3(arc)}$ cm`, `Area $= \\dfrac{${th}}{360} \\times \\pi(${rad})^2 = ${fmt3(area)}$ cm²`],
      };
    }
    const seg = area - 0.5 * rad * rad * Math.sin((th * Math.PI) / 180);
    const per = arc + 2 * rad * Math.sin((th * Math.PI) / 360);
    return {
      stem: `$AB$ is a chord of a circle with centre $O$ and radius ${rad} cm, and $\\angle AOB = ${th}^\\circ$. For the minor segment cut off by $AB$, find`,
      parts: [
        M('a', { label: '(a)', prompt: 'its area,', post: '\\text{ cm}^2', kb: 'trig', key: { type: 'num', v: String(seg), acc: 'sf3' } }),
        M('b', { label: '(b)', prompt: 'its perimeter.', post: '\\text{ cm}', kb: 'trig', key: { type: 'num', v: String(per), acc: 'sf3' } }),
      ],
      solution: [`Segment = sector − triangle $= ${fmt3(area)} - \\tfrac12(${rad})^2\\sin ${th}^\\circ = ${fmt3(seg)}$ cm²`, `Chord $AB = 2(${rad})\\sin ${th / 2}^\\circ$`, `Perimeter = arc + chord $= ${fmt3(per)}$ cm`],
    };
  },
});

add({
  id: 'em-volume', topic: 'G5', title: 'Volume and surface area', tiers: ['basic', 'challenging'],
  gen(r, tier) {
    const solid = r.pick(['cylinder', 'cone', 'sphere', 'hemisphere']);
    const rad = r.int(2, 9), h = r.int(3, 15);
    const exact = tier === 'basic';
    let vol, txt, sol;
    if (solid === 'cylinder') { vol = rad * rad * h; txt = `a cylinder of radius ${rad} cm and height ${h} cm`; sol = `V = \\pi r^2 h = \\pi(${rad})^2(${h})`; }
    if (solid === 'cone') { vol = (rad * rad * h) / 3; txt = `a cone of radius ${rad} cm and height ${h} cm`; sol = `V = \\tfrac13 \\pi r^2 h = \\tfrac13\\pi(${rad})^2(${h})`; }
    if (solid === 'sphere') { vol = (4 * rad ** 3) / 3; txt = `a sphere of radius ${rad} cm`; sol = `V = \\tfrac43 \\pi r^3 = \\tfrac43\\pi(${rad})^3`; }
    if (solid === 'hemisphere') { vol = (2 * rad ** 3) / 3; txt = `a solid hemisphere of radius ${rad} cm`; sol = `V = \\tfrac23 \\pi r^3 = \\tfrac23\\pi(${rad})^3`; }
    const k = vol; // V = k π
    const num = Math.round(k * 3), den = 3;
    return {
      stem: `Find the volume of ${txt}, ${exact ? 'leaving your answer in terms of $\\pi$' : 'correct to 3 significant figures'}.`,
      parts: [M('a', { post: '\\text{ cm}^3', kb: 'num', key: exact ? { type: 'num', v: `${frk(num, den)}*@pi`, acc: 'exact', noDecimal: true } : { type: 'num', v: String(k * Math.PI), acc: 'sf3' } })],
      solution: [`$${sol}$`, exact ? `$= ${fr(num, den)}\\pi$ cm³` : `$= ${fmt3(k * Math.PI)}$ cm³`],
    };
  },
});

add({
  id: 'em-coord', topic: 'G6', title: 'Coordinate geometry', tiers: ['basic', 'challenging'],
  gen(r, tier) {
    const x1 = r.int(-7, 7), y1 = r.int(-7, 7);
    let x2, y2;
    do { x2 = r.int(-7, 7); y2 = r.int(-7, 7); } while (x2 === x1 && y2 === y1);
    const d2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    const parts = [
      M('d', { label: '(a)', prompt: 'Find the length of $AB$ (exact form or 3 s.f.).', kb: 'num', key: { type: 'num', v: `@sqrt(${d2})`, acc: 'sf3' } }),
      M('mx', { label: '(b)', prompt: 'Find the midpoint of $AB$.', pre: 'x =', kb: 'num', key: { type: 'num', v: String((x1 + x2) / 2) } }),
      M('my', { label: '', pre: 'y =', kb: 'num', key: { type: 'num', v: String((y1 + y2) / 2) } }),
    ];
    const sol = [`$AB = \\sqrt{(${x2} - (${x1}))^2 + (${y2} - (${y1}))^2} = \\sqrt{${d2}}$`, `Midpoint $= \\left(\\dfrac{${x1} + ${x2}}{2}, \\dfrac{${y1} + ${y2}}{2}\\right) = (${fmt((x1 + x2) / 2)}, ${fmt((y1 + y2) / 2)})$`];
    if (tier !== 'basic' && x2 !== x1 && y2 !== y1) {
      const m = (y2 - y1) / (x2 - x1);
      parts.push(M('pm', { label: '(c)', prompt: 'Find the gradient of a line perpendicular to $AB$.', kb: 'num', key: { type: 'num', v: frk(-(x2 - x1), y2 - y1) } }));
      sol.push(`$m_{AB} = ${fr(y2 - y1, x2 - x1)}$; perpendicular gradients satisfy $m_1 m_2 = -1$, so $m = ${fr(-(x2 - x1), y2 - y1)}$`);
      void m;
    }
    return { stem: `The points $A(${x1}, ${y1})$ and $B(${x2}, ${y2})$ are given.`, parts, solution: sol };
  },
});

add({
  id: 'em-vectors', topic: 'G7', title: 'Vectors in two dimensions', tiers: ['basic', 'challenging'],
  gen(r) {
    const a = [r.nz(-6, 6), r.nz(-6, 6)], b = [r.nz(-6, 6), r.nz(-6, 6)];
    const p = r.nz(-3, 3), q = r.nz(-3, 3);
    const v = [p * a[0] + q * b[0], p * a[1] + q * b[1]];
    const col = (u) => `\\begin{pmatrix} ${u[0]} \\\\ ${u[1]} \\end{pmatrix}`;
    const comb = `${p === 1 ? '' : p === -1 ? '-' : p}\\mathbf{a} ${q < 0 ? '-' : '+'} ${Math.abs(q) === 1 ? '' : Math.abs(q)}\\mathbf{b}`;
    return {
      stem: `$\\mathbf{a} = ${col(a)}$ and $\\mathbf{b} = ${col(b)}$.`,
      parts: [
        M('x', { label: '(a)', prompt: `Find $${comb}$ (top component, then bottom).`, pre: '\\text{top} =', kb: 'num', key: { type: 'num', v: String(v[0]) } }),
        M('y', { label: '', pre: '\\text{bottom} =', kb: 'num', key: { type: 'num', v: String(v[1]) } }),
        M('m', { label: '(b)', prompt: 'Find $|\\mathbf{a}|$.', kb: 'num', key: { type: 'num', v: `@sqrt(${a[0] ** 2 + a[1] ** 2})`, acc: 'sf3' } }),
      ],
      solution: [`$${comb} = ${col(v)}$`, `$|\\mathbf{a}| = \\sqrt{(${a[0]})^2 + (${a[1]})^2} = \\sqrt{${a[0] ** 2 + a[1] ** 2}}$`],
    };
  },
});

// ---------------- STATISTICS & PROBABILITY ----------------
add({
  id: 'em-stats', topic: 'S1', title: 'Mean and median from a frequency table', tiers: ['basic', 'challenging'],
  gen(r) {
    const xs = [0, 1, 2, 3, 4, 5].slice(0, r.int(4, 6));
    const fs = xs.map(() => r.int(1, 12));
    const n = fs.reduce((a, b) => a + b, 0);
    const mean = xs.reduce((s, x, i) => s + x * fs[i], 0) / n;
    const sorted = xs.flatMap((x, i) => Array(fs[i]).fill(x));
    const med = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
    const table = `$$\\begin{array}{c|${'c'.repeat(xs.length)}} \\text{Number of books} & ${xs.join(' & ')} \\\\ \\hline \\text{Frequency} & ${fs.join(' & ')} \\end{array}$$`;
    return {
      stem: `The table shows the number of books read last month by ${n} students. ${table}`,
      parts: [
        M('a', { label: '(a)', prompt: 'Find the mean (3 s.f. where necessary).', kb: 'num', key: { type: 'num', v: String(mean), acc: 'sf3' } }),
        M('b', { label: '(b)', prompt: 'Find the median.', kb: 'num', key: { type: 'num', v: String(med) } }),
      ],
      solution: [`$\\sum fx = ${xs.reduce((s, x, i) => s + x * fs[i], 0)}$, $\\sum f = ${n}$`, `Mean $= ${fmt3(mean)}$`, n % 2 ? `Median is the ${(n + 1) / 2}th value $= ${med}$` : `Median is the mean of the ${n / 2}th and ${n / 2 + 1}th values $= ${fmt(med)}$`],
    };
  },
});

add({
  id: 'em-prob', topic: 'S2', title: 'Probability without replacement', tiers: ['basic', 'challenging', 'advanced'],
  gen(r, tier) {
    const red = r.int(2, 8), blue = r.int(2, 8), n = red + blue;
    const both = frk(red * (red - 1), n * (n - 1));
    const diff = frk(2 * red * blue, n * (n - 1));
    const parts = [M('a', { label: '(a)', prompt: 'Find the probability that both are red.', kb: 'num', key: { type: 'num', v: both } })];
    if (tier !== 'basic') parts.push(M('b', { label: '(b)', prompt: 'Find the probability that the two marbles are of different colours.', kb: 'num', key: { type: 'num', v: diff } }));
    return {
      stem: `A bag contains ${red} red and ${blue} blue marbles. Two marbles are taken at random without replacement.`,
      parts,
      solution: [`$P(RR) = \\dfrac{${red}}{${n}} \\times \\dfrac{${red - 1}}{${n - 1}} = ${fr(red * (red - 1), n * (n - 1))}$`, ...(tier !== 'basic' ? [`$P(RB) + P(BR) = 2 \\times \\dfrac{${red}}{${n}} \\times \\dfrac{${blue}}{${n - 1}} = ${fr(2 * red * blue, n * (n - 1))}$`] : []), 'Without replacement: the denominator drops by 1 on the second draw.'],
    };
  },
});

// ---------------- CONCEPTS / DEFINITIONS ----------------
const EM_CONCEPTS = [
  { topic: 'N1', q: 'Which of the following numbers is irrational?', o: ['$\\sqrt{50}$', '$\\sqrt{49}$', '$0.\\dot{3}$', '$\\dfrac{22}{7}$'], e: 'An irrational number cannot be written as $\\frac{p}{q}$. $\\sqrt{50} = 5\\sqrt2$ is irrational; recurring decimals are rational.' },
  { topic: 'N1', q: 'Which statement about prime numbers is correct?', o: ['2 is the only even prime number.', '1 is a prime number.', 'Every odd number is prime.', '9 is prime because it is odd.'], e: 'A prime has exactly two distinct factors: 1 and itself. 1 has only one factor.' },
  { topic: 'G1', q: 'Which property is true for every rhombus?', o: ['Its diagonals bisect each other at right angles.', 'Its diagonals are equal in length.', 'All its angles are 90°.', 'It has exactly one pair of parallel sides.'], e: 'Rhombus: all sides equal, diagonals are perpendicular bisectors of each other (but not necessarily equal).' },
  { topic: 'G2', q: 'Which of these is NOT a valid test for congruent triangles?', o: ['SSA (two sides and a non-included angle)', 'SAS', 'ASA', 'RHS'], e: 'SSA can produce two different triangles (the ambiguous case), so it does not prove congruence. RHS is the special right-angled case.' },
  { topic: 'G2', q: 'Two triangles have all three pairs of angles equal. What can you conclude?', o: ['They are similar.', 'They are congruent.', 'They have equal areas.', 'Nothing.'], e: 'AAA (equiangular) proves similarity only — the triangles may be different sizes.' },
  { topic: 'N6', q: 'Lines $L_1$ and $L_2$ are perpendicular. $L_1$ has gradient $\\frac{2}{3}$. The gradient of $L_2$ is', o: ['$-\\frac{3}{2}$', '$\\frac{3}{2}$', '$-\\frac{2}{3}$', '$\\frac{2}{3}$'], e: 'Perpendicular lines: $m_1 m_2 = -1$.' },
  { topic: 'S1', q: 'A data set has one extremely large value. Which average is least affected by it?', o: ['The median', 'The mean', 'The total', 'The range'], e: 'The median depends only on the middle position, so outliers barely affect it.' },
  { topic: 'G5', q: 'What is the difference between a sector and a segment?', o: ['A sector is bounded by two radii and an arc; a segment by a chord and an arc.', 'They are the same region.', 'A segment is bounded by two radii and an arc.', 'A sector is always smaller than a segment.'], e: 'Sector = "pizza slice" (radii + arc). Segment = region between a chord and its arc.' },
  { topic: 'S2', q: 'Events $A$ and $B$ are mutually exclusive. Which is true?', o: ['$P(A \\text{ or } B) = P(A) + P(B)$', '$P(A \\text{ and } B) = P(A) \\times P(B)$', '$P(A) + P(B) = 1$', '$P(A) = P(B)$'], e: 'Mutually exclusive means they cannot both happen, so $P(A \\text{ and } B)=0$ and probabilities add.' },
  { topic: 'G3', q: 'Why is the angle in a semicircle 90°?', o: ['It is half of the 180° angle at the centre on the diameter.', 'Because the triangle is isosceles.', 'Because the tangent is perpendicular to the radius.', 'Because opposite angles of a cyclic quadrilateral add to 180°.'], e: 'The diameter subtends 180° at the centre; the angle at the circumference is half of that.' },
  { topic: 'N7', q: 'When solving $-3x > 12$, the correct solution is', o: ['$x < -4$', '$x > -4$', '$x > 4$', '$x < 4$'], e: 'Dividing an inequality by a negative number reverses the sign.' },
  { topic: 'G4', q: 'In the expression for the cosine rule $a^2 = b^2 + c^2 - 2bc\\cos A$, the angle $A$ is', o: ['the angle between sides $b$ and $c$', 'the angle opposite $b$', 'always the largest angle', 'the angle between sides $a$ and $b$'], e: 'The angle $A$ is opposite side $a$, i.e. the included angle between $b$ and $c$.' },
];
add({
  id: 'em-concept', topic: 'MIX', title: 'Concepts and definitions', tiers: ['basic', 'challenging', 'advanced'],
  gen(r) {
    const c = r.pick(EM_CONCEPTS);
    return { topicOverride: c.topic, stem: c.q, parts: [C('a', { options: c.o, correct: 0, explain: c.e })], solution: [c.e] };
  },
});

export default T;
