// O-Level Additional Mathematics (Syllabus 4049) generators.
import { gcd, fr, frk, poly, polyk, lin, sg, coef, fmt, fmt3, round, mathPart as M, choicePart as C, proofPart as P, R, S, N, E, stmtToLatex as SL } from './util.js';
import { Fig, polar, relabel } from './svg.js';

const T = [];
const add = (t) => T.push({ subject: 'amath', ...t });
const nCr = (n, r) => { let x = 1; for (let i = 1; i <= r; i++) x = (x * (n - r + i)) / i; return Math.round(x); };

// ---------------- A1 QUADRATIC FUNCTIONS ----------------
add({
  id: 'am-complete-square', topic: 'A1', title: 'Completing the square, max/min', tiers: ['basic', 'challenging', 'advanced'],
  gen(r, tier) {
    const a = tier === 'basic' ? 1 : r.pick([2, 3, -1, -2, -3]);
    const h = r.nz(-6, 6), k = r.int(-12, 12);
    const b = -2 * a * h, c = a * h * h + k;
    const parts = [
      M('p', { label: '(a)', prompt: `Express $f(x)$ in the form $${a === 1 ? '' : a === -1 ? '-' : a}(x + p)^{2} + q$.`, pre: 'p =', kb: 'num', key: { type: 'num', v: String(-h) } }),
      M('q', { label: '', pre: 'q =', kb: 'num', key: { type: 'num', v: String(k) } }),
      C('n', { label: '(b)', prompt: `Determine whether $f(x)$ has a maximum or a minimum value, and state it.`, options: [`Minimum value $${k}$, since $(x + p)^2 \\ge 0$ and the coefficient of $x^2$ is positive`, `Maximum value $${k}$, since $(x + p)^2 \\ge 0$ and the coefficient of $x^2$ is negative`, `Minimum value $${-h}$`, `Maximum value $${-h}$`], correct: a > 0 ? 0 : 1 }),
    ];
    if (tier !== 'basic') parts.push(M('x', { label: '(c)', prompt: 'State the value of $x$ at which this occurs.', pre: 'x =', kb: 'num', key: { type: 'num', v: String(h) } }));
    return {
      stem: `It is given that $f(x) = ${poly([a, b, c])}$.`,
      parts,
      solution: [
        a !== 1 ? `Factor out $${a}$: $${a}\\left[x^2 ${coef(b / a, 'x')}\\right] ${sg(c)}$` : 'Halve the coefficient of $x$ and square it.',
        `$f(x) = ${a === 1 ? '' : a === -1 ? '-' : a}(x ${h > 0 ? '-' : '+'} ${Math.abs(h)})^2 ${sg(k)}$`,
        `Since $(x ${h > 0 ? '-' : '+'} ${Math.abs(h)})^2 \\ge 0$ for all real $x$ and $${a} ${a > 0 ? '> 0' : '< 0'}$, $f$ has a **${a > 0 ? 'minimum' : 'maximum'}** value of $${k}$ at $x = ${h}$.`,
      ],
    };
  },
});

add({
  id: 'am-discriminant', topic: 'A1', title: 'Discriminant and intersection conditions', tiers: ['challenging', 'advanced'],
  gen(r) {
    const mode = r.pick(['none', 'two', 'tangent', 'equal']);
    if (mode === 'equal') {
      const s = r.int(2, 9);
      const a = r.pick([1, 4, 9].filter((x) => x <= 9));
      // a x^2 + kx + s^2 = 0 equal roots: k^2 = 4 a s^2 -> k = ±2 s sqrt(a)
      const kk = 2 * s * Math.sqrt(a);
      return {
        stem: `Find the values of $k$ for which the equation $${a === 1 ? '' : a}x^{2} + kx + ${s * s} = 0$ has two equal real roots.`,
        parts: [M('k', { pre: 'k =', kb: 'num', multi: [{ type: 'num', v: String(kk) }, { type: 'num', v: String(-kk) }], open: true })],
        solution: ['Equal roots ⇔ $b^2 - 4ac = 0$', `$k^2 - 4(${a})(${s * s}) = 0 \\Rightarrow k^2 = ${kk * kk}$`, `$k = \\pm ${kk}$`],
      };
    }
    const m = r.nz(-4, 4), b = r.nz(-6, 6), c = r.int(-6, 8);
    // y = x^2 + bx + c, y = mx + k -> x^2 + (b-m)x + (c-k) = 0 ; D = (b-m)^2 - 4(c-k)
    const B = b - m;
    const bound = frk(4 * c - B * B, 4);
    const bl = fr(4 * c - B * B, 4);
    const ask = { none: 'does not meet the curve', two: 'meets the curve at two distinct points', tangent: 'is a tangent to the curve' }[mode];
    const parts = [];
    if (mode === 'tangent') parts.push(M('k', { pre: 'k =', kb: 'num', key: { type: 'num', v: bound } }));
    else {
      const ops = ['<', '>', '\\le', '\\ge'];
      parts.push(C('d', { label: 'Inequality', prompt: 'The range is $k \\;\\square\\; \\beta$:', options: ops.map((o) => `$k ${o} \\beta$`), correct: mode === 'none' ? 0 : 1 }));
      parts.push(M('b', { label: '', pre: '\\beta =', kb: 'num', key: { type: 'num', v: bound } }));
    }
    return {
      stem: `Find the ${mode === 'tangent' ? 'value' : 'range of values'} of $k$ for which the line $y = ${coef(m, 'x', true)} + k$ ${ask} $y = ${poly([1, b, c])}$.`,
      parts,
      solution: [`Equate: $x^2 ${coef(B, 'x')} ${sg(c)} - k = 0$`, `Discriminant $= (${B})^2 - 4(1)(${c} - k) = ${B * B - 4 * c} + 4k$`, mode === 'none' ? 'No intersection ⇔ discriminant $< 0$' : mode === 'two' ? 'Two distinct points ⇔ discriminant $> 0$' : 'Tangent ⇔ discriminant $= 0$', `$k ${mode === 'none' ? '<' : mode === 'two' ? '>' : '='} ${bl}$`],
    };
  },
});

add({
  id: 'am-always-positive', topic: 'A1', title: 'Show that … for all real x', tiers: ['basic', 'challenging', 'advanced'], proof: true,
  gen(r) {
    let b, c;
    do { b = r.nz(-8, 8); c = r.int(2, 20); } while (b * b - 4 * c >= 0);
    const D = b * b - 4 * c;
    return {
      stem: `Show that $${poly([1, b, c])}$ is positive for all real values of $x$.`,
      parts: [P('p', {
        group: 'alg', prompt: 'Complete the argument.',
        lines: [
          [`Discriminant $= (${b})^2 - 4(1)(${c}) =$`, N({ type: 'num', v: String(D) })],
          ['Since the discriminant is negative,', R('disc_neg', ['disc_pos', 'disc_zero']), ', the curve does not cut the $x$-axis.'],
          ['Also', R('coeff_pos', ['sq_nonneg', 'd2_pos', 'dy_pos']), ', so the curve lies entirely above the $x$-axis: the expression is always positive.'],
        ],
      })],
      solution: [`$b^2 - 4ac = ${D} < 0$ ⇒ no real roots`, 'Coefficient of $x^2$ is $1 > 0$ ⇒ U-shaped curve', 'A U-shaped curve with no $x$-intercepts lies entirely above the axis. **Both** facts are needed for full marks.'],
    };
  },
});

// ---------------- A2 EQUATIONS & INEQUALITIES ----------------
add({
  id: 'am-quad-ineq', topic: 'A2', title: 'Quadratic inequalities', tiers: ['basic', 'challenging'],
  gen(r, tier) {
    let p = r.int(-7, 6), q = r.int(-6, 8);
    if (p === q) q++;
    if (p > q) [p, q] = [q, p];
    const neg = tier !== 'basic' && r.chance(0.5);
    const gt = r.chance(0.5);
    const cs = [1, -(p + q), p * q].map((v) => (neg ? -v : v));
    const outside = gt !== neg; // (x-p)(x-q) > 0 effectively
    return {
      stem: `Find the range of values of $x$ for which $${poly(cs)} ${gt ? '>' : '<'} 0$.`,
      parts: [
        C('f', { label: 'Form', options: ['$x < \\alpha$ or $x > \\beta$', '$\\alpha < x < \\beta$'], correct: outside ? 0 : 1 }),
        M('a', { label: '', pre: '\\alpha =', kb: 'num', key: { type: 'num', v: String(p) } }),
        M('b', { label: '', pre: '\\beta =', kb: 'num', key: { type: 'num', v: String(q) } }),
      ],
      solution: [neg ? `Multiply by $-1$ (reverse the sign): $${poly([1, -(p + q), p * q])} ${gt ? '<' : '>'} 0$` : 'Factorise.', `$(x ${p < 0 ? '+' : '-'} ${Math.abs(p)})(x ${q < 0 ? '+' : '-'} ${Math.abs(q)}) ${outside ? '>' : '<'} 0$`, 'Sketch the U-shaped curve through the roots.', outside ? `$x < ${p}$ or $x > ${q}$` : `$${p} < x < ${q}$`],
    };
  },
});

add({
  id: 'am-simul-nonlinear', topic: 'A2', title: 'Line meets curve', tiers: ['challenging', 'advanced'],
  gen(r) {
    const m = r.nz(-3, 3), c = r.int(-5, 5);
    let x1 = r.int(-5, 5), x2 = r.int(-5, 5);
    if (x1 === x2) x2 = x1 + r.int(1, 3);
    const p = m - (x1 + x2), q = c + x1 * x2;
    const big = Math.max(x1, x2);
    return {
      stem: `Find the coordinates of the points where the line $y = ${poly([m, c])}$ meets the curve $y = ${poly([1, p, q])}$.`,
      parts: [
        M('x', { label: '(a)', prompt: 'the $x$-coordinates:', pre: 'x =', kb: 'num', multi: [{ type: 'num', v: String(x1) }, { type: 'num', v: String(x2) }], open: true }),
        M('y', { label: '(b)', prompt: 'the $y$-coordinate of the point with the larger $x$-coordinate:', pre: 'y =', kb: 'num', key: { type: 'num', v: String(m * big + c) } }),
      ],
      solution: [`$${poly([1, p, q])} = ${poly([m, c])}$`, `$${poly([1, p - m, q - c])} = 0$`, `$(x ${-x1 < 0 ? '-' : '+'} ${Math.abs(x1)})(x ${-x2 < 0 ? '-' : '+'} ${Math.abs(x2)}) = 0$`, `Points: $(${x1}, ${m * x1 + c})$ and $(${x2}, ${m * x2 + c})$`],
    };
  },
});

// ---------------- A3 SURDS ----------------
add({
  id: 'am-surds', topic: 'A3', title: 'Surds', tiers: ['basic', 'challenging', 'advanced'],
  gen(r, tier) {
    const d = r.pick([2, 3, 5, 6, 7]);
    if (tier === 'basic') {
      const ks = [r.int(2, 5), r.int(2, 5), r.int(1, 4)];
      const sgn = [1, 1, -1];
      const tot = ks.reduce((s, k, i) => s + sgn[i] * k, 0);
      return {
        stem: `Simplify $\\sqrt{${ks[0] ** 2 * d}} + \\sqrt{${ks[1] ** 2 * d}} - \\sqrt{${ks[2] ** 2 * d}}$, giving your answer in the form $k\\sqrt{${d}}$.`,
        parts: [M('k', { pre: 'k =', kb: 'num', key: { type: 'num', v: String(tot) } })],
        solution: ks.map((k) => `$\\sqrt{${k * k * d}} = \\sqrt{${k * k}}\\sqrt{${d}} = ${k}\\sqrt{${d}}$`).concat([`Total: $${tot}\\sqrt{${d}}$`]),
      };
    }
    let a, c;
    do { a = r.nz(-5, 6); c = r.int(1, 5); } while (c * c === d);
    // (a + √d)/(c − √d) = ((ac + d) + (a + c)√d)/(c² − d)
    const den = c * c - d;
    return {
      stem: `Express $\\dfrac{${a} + \\sqrt{${d}}}{${c} - \\sqrt{${d}}}$ in the form $p + q\\sqrt{${d}}$, where $p$ and $q$ are rational.`,
      parts: [
        M('p', { pre: 'p =', kb: 'num', key: { type: 'num', v: frk(a * c + d, den) } }),
        M('q', { pre: 'q =', kb: 'num', key: { type: 'num', v: frk(a + c, den) } }),
      ],
      solution: [`Multiply top and bottom by the conjugate $${c} + \\sqrt{${d}}$.`, `Denominator: $${c}^2 - ${d} = ${den}$`, `Numerator: $${a * c} + ${a}\\sqrt{${d}} + ${c}\\sqrt{${d}} + ${d} = ${a * c + d} + ${a + c}\\sqrt{${d}}$`, `$p = ${fr(a * c + d, den)},\\; q = ${fr(a + c, den)}$`],
    };
  },
});

// ---------------- A4 POLYNOMIALS & PARTIAL FRACTIONS ----------------
add({
  id: 'am-remainder', topic: 'A4', title: 'Remainder and factor theorems', tiers: ['basic', 'challenging', 'advanced'],
  gen(r, tier) {
    const a = r.int(-6, 6), b = r.int(-9, 9), c = r.int(-12, 12);
    const f = (x) => x ** 3 + a * x * x + b * x + c;
    if (tier === 'basic') {
      const q = r.nz(-3, 3);
      return {
        stem: `Find the remainder when $f(x) = ${poly([1, a, b, c])}$ is divided by $x ${q < 0 ? '+' : '-'} ${Math.abs(q)}$.`,
        parts: [M('a', { kb: 'num', key: { type: 'num', v: String(f(q)) } })],
        solution: [`Remainder theorem: remainder $= f(${q})$`, `$f(${q}) = ${f(q)}$`],
      };
    }
    let p, q;
    do { p = r.nz(-3, 3); q = r.nz(-3, 3); } while (p === q);
    // choose unknown a, b; make (x - p) a factor: adjust c
    const cc = -(p ** 3 + a * p * p + b * p);
    const g = (x) => x ** 3 + a * x * x + b * x + cc;
    const Rm = g(q);
    return {
      stem: `The polynomial $x^3 + ax^2 + bx ${sg(cc)}$ has a factor $x ${p < 0 ? '+' : '-'} ${Math.abs(p)}$ and leaves a remainder of $${Rm}$ when divided by $x ${q < 0 ? '+' : '-'} ${Math.abs(q)}$. Find $a$ and $b$.`,
      parts: [M('a', { pre: 'a =', kb: 'num', key: { type: 'num', v: String(a) } }), M('b', { pre: 'b =', kb: 'num', key: { type: 'num', v: String(b) } })],
      solution: [`Factor theorem: $f(${p}) = 0 \\Rightarrow ${p * p}a ${coef(p, 'b')} = ${-(p ** 3) - cc}$`, `Remainder theorem: $f(${q}) = ${Rm} \\Rightarrow ${q * q}a ${coef(q, 'b')} = ${Rm - q ** 3 - cc}$`, `Solve simultaneously: $a = ${a},\\; b = ${b}$`],
    };
  },
});

add({
  id: 'am-cubic', topic: 'A4', title: 'Solving cubic equations', tiers: ['challenging', 'advanced'],
  gen(r, tier) {
    const rs = r.shuffle([-4, -3, -2, -1, 1, 2, 3, 4, 5]).slice(0, 2);
    let k = 1, q = r.nz(-3, 3);
    if (tier === 'advanced') { k = r.pick([2, 3]); q = r.pick([1, -1, 3, 5].filter((v) => gcd(v, k) === 1)); }
    // (k x - q)(x - r1)(x - r2)
    const m = [1, -(rs[0] + rs[1]), rs[0] * rs[1]];
    const cs = [k * m[0], k * m[1] - q * m[0], k * m[2] - q * m[1], -q * m[2]];
    const roots = [frk(q, k), String(rs[0]), String(rs[1])];
    const uniq = [...new Set(roots.map((x) => eval(x.replace(/[()]/g, ''))))];
    if (uniq.length < 3) return this.gen(r, tier);
    return {
      stem: `Solve the equation $${poly(cs)} = 0$.`,
      parts: [M('x', { pre: 'x =', kb: 'num', multi: roots.map((v) => ({ type: 'num', v })), open: true })],
      solution: [`Try small factors of the constant term: $f(${rs[0]}) = 0$, so $(x ${-rs[0] < 0 ? '-' : '+'} ${Math.abs(rs[0])})$ is a factor (factor theorem).`, 'Divide (or compare coefficients) to get the quadratic factor, then factorise it.', `$x = ${fr(q, k)},\\; ${rs[0]},\\; ${rs[1]}$`],
    };
  },
});

add({
  id: 'am-partial', topic: 'A4', title: 'Partial fractions', tiers: ['challenging', 'advanced'],
  gen(r, tier) {
    const A = r.nz(-5, 5), B = r.nz(-5, 5);
    let a = r.nz(-4, 4), b = r.nz(-4, 4);
    if (a === b) b = a + 1 === 0 ? a + 2 : a + 1;
    const den = (v) => `(x ${v < 0 ? '+' : '-'} ${Math.abs(v)})`;
    if (tier === 'challenging') {
      // A/(x-a) + B/(x-b)
      const p = A + B, q = -A * b - B * a;
      if (p === 0 && q === 0) return this.gen(r, tier);
      return {
        stem: `Express $\\dfrac{${poly([p, q])}}{${den(a)}${den(b)}}$ in partial fractions $\\dfrac{A}{${den(a).slice(1, -1)}} + \\dfrac{B}{${den(b).slice(1, -1)}}$.`,
        parts: [M('A', { pre: 'A =', kb: 'num', key: { type: 'num', v: String(A) } }), M('B', { pre: 'B =', kb: 'num', key: { type: 'num', v: String(B) } })],
        solution: [`$${poly([p, q])} \\equiv A${den(b)} + B${den(a)}$`, `Put $x = ${a}$: $A = ${A}$`, `Put $x = ${b}$: $B = ${B}$`],
      };
    }
    const Cc = r.nz(-4, 4);
    // A/(x-a) + B/(x-b) + C/(x-b)^2 ; numerator = A(x-b)^2 + B(x-a)(x-b) + C(x-a)
    const n2 = A + B, n1 = -2 * A * b - B * (a + b) + Cc, n0 = A * b * b + B * a * b - Cc * a;
    return {
      stem: `Express $\\dfrac{${poly([n2, n1, n0])}}{${den(a)}${den(b)}^{2}}$ in the form $\\dfrac{A}{${den(a).slice(1, -1)}} + \\dfrac{B}{${den(b).slice(1, -1)}} + \\dfrac{C}{${den(b)}^{2}}$.`,
      parts: [M('A', { pre: 'A =', kb: 'num', key: { type: 'num', v: String(A) } }), M('B', { pre: 'B =', kb: 'num', key: { type: 'num', v: String(B) } }), M('C', { pre: 'C =', kb: 'num', key: { type: 'num', v: String(Cc) } })],
      solution: [`$${poly([n2, n1, n0])} \\equiv A${den(b)}^2 + B${den(a)}${den(b)} + C${den(a)}$`, `$x = ${a}$: $A = ${A}$;  $x = ${b}$: $C = ${Cc}$`, `Compare $x^2$ coefficients: $A + B = ${n2} \\Rightarrow B = ${B}$`],
    };
  },
});

// ---------------- A5 BINOMIAL ----------------
add({
  id: 'am-binomial', topic: 'A5', title: 'Binomial expansion', tiers: ['basic', 'challenging', 'advanced'],
  gen(r, tier) {
    if (tier === 'advanced') {
      const n = r.pick([6, 9]), cst = r.nz(-3, 3);
      // (x^2 + c/x)^n : term x^(2n-3r) -> r = 2n/3
      const rr = (2 * n) / 3;
      const val = nCr(n, rr) * cst ** rr;
      return {
        stem: `Find the term independent of $x$ in the expansion of $\\left(x^{2} ${cst < 0 ? '-' : '+'} \\dfrac{${Math.abs(cst)}}{x}\\right)^{${n}}$.`,
        parts: [M('a', { kb: 'num', key: { type: 'num', v: String(val) } })],
        solution: [`General term: $\\binom{${n}}{r}(x^2)^{${n}-r}\\left(\\dfrac{${cst}}{x}\\right)^{r} = \\binom{${n}}{r}(${cst})^{r} x^{${2 * n} - 3r}$`, `Independent of $x$: $${2 * n} - 3r = 0 \\Rightarrow r = ${rr}$`, `Term $= \\binom{${n}}{${rr}}(${cst})^{${rr}} = ${val}$`],
      };
    }
    const n = r.int(4, 8), a = r.pick([1, 2, 3]), b = r.nz(-3, 3), k = r.int(2, Math.min(4, n));
    const val = nCr(n, k) * a ** (n - k) * b ** k;
    const parts = [M('a', { label: tier === 'basic' ? '' : '(a)', prompt: tier === 'basic' ? '' : `Find the coefficient of $x^{${k}}$.`, kb: 'num', key: { type: 'num', v: String(val) } })];
    let sol = [`Term in $x^{${k}}$: $\\binom{${n}}{${k}}(${a})^{${n - k}}(${b}x)^{${k}}$`, `Coefficient $= ${nCr(n, k)} \\times ${a ** (n - k)} \\times ${b ** k} = ${val}$`];
    if (tier === 'challenging') {
      const m = r.nz(-3, 3);
      // (1 + m x)(a + bx)^n coefficient of x^k
      const v2 = val + m * nCr(n, k - 1) * a ** (n - k + 1) * b ** (k - 1);
      parts.push(M('b', { label: '(b)', prompt: `Hence find the coefficient of $x^{${k}}$ in $(1 ${m < 0 ? '-' : '+'} ${Math.abs(m) === 1 ? '' : Math.abs(m)}x)(${a} ${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}x)^{${n}}$.`, kb: 'num', key: { type: 'num', v: String(v2) } }));
      sol.push(`Also need the $x^{${k - 1}}$ term: $\\binom{${n}}{${k - 1}}(${a})^{${n - k + 1}}(${b})^{${k - 1}}$`, `Coefficient $= ${val} + (${m})(${nCr(n, k - 1) * a ** (n - k + 1) * b ** (k - 1)}) = ${v2}$`);
    }
    return { stem: `${tier === 'basic' ? `Find the coefficient of $x^{${k}}$ in the expansion of` : 'Consider'} $(${a} ${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}x)^{${n}}$.`, parts, solution: sol };
  },
});

// ---------------- A6 EXPONENTIAL & LOGARITHMS ----------------
add({
  id: 'am-log-eq', topic: 'A6', title: 'Logarithmic equations', tiers: ['basic', 'challenging', 'advanced'],
  gen(r, tier) {
    if (tier === 'basic') {
      const b = r.pick([2, 3, 5]), k = r.int(2, 4), p = r.nz(-5, 5);
      const x = (b ** k - p);
      return {
        stem: `Solve $\\log_{${b}}(x ${p < 0 ? '-' : '+'} ${Math.abs(p)}) = ${k}$.`,
        parts: [M('x', { pre: 'x =', kb: 'num', key: { type: 'num', v: String(x) } })],
        solution: [`Convert to index form: $x ${sg(p)} = ${b}^{${k}} = ${b ** k}$`, `$x = ${x}$`],
      };
    }
    if (tier === 'challenging') {
      const opts = [[2, 3, 2, 2], [2, 4, 2, 6], [3, 2, 1, 8], [2, 5, 4, 4], [2, 4, 1, 15], [3, 3, 3, 6], [6, 2, 4, 5], [2, 6, 4, 12]];
      const [b, k, x0, d] = r.pick(opts.filter(([b, k, x, d]) => x * (x + d) === b ** k));
      return {
        stem: `Solve $\\log_{${b}} x + \\log_{${b}}(x + ${d}) = ${k}$.`,
        parts: [M('x', { pre: 'x =', kb: 'num', multi: [{ type: 'num', v: String(x0) }], open: true })],
        solution: [`Product law: $\\log_{${b}}[x(x + ${d})] = ${k}$`, `$x^2 + ${d}x - ${b ** k} = 0 \\Rightarrow (x - ${x0})(x + ${x0 + d}) = 0$`, `$x = ${x0}$ or $x = ${-(x0 + d)}$`, `**Reject** $x = ${-(x0 + d)}$ because $\\log_{${b}}$ of a negative number is undefined.`],
      };
    }
    const b = r.pick([2, 3]), k = r.pick([1, 2]);
    const B = b ** k;
    let p, q, s;
    do { p = r.int(1, 4); q = r.int(-5, 9); s = r.int(-2, 4); } while (B === p || (q + B * s) / (B - p) - s <= 0 || p * ((q + B * s) / (B - p)) + q <= 0);
    const xn = q + B * s, xd = B - p;
    return {
      stem: `Solve $\\log_{${b}}(${lin(p, q)}) - \\log_{${b}}(${lin(1, -s)}) = ${k}$.`,
      parts: [M('x', { pre: 'x =', kb: 'num', key: { type: 'num', v: frk(xn, xd) } })],
      solution: [`Quotient law: $\\log_{${b}}\\dfrac{${lin(p, q)}}{${lin(1, -s)}} = ${k}$`, `$${lin(p, q)} = ${B}(${lin(1, -s)})$`, `$x = ${fr(xn, xd)}$ — check both logs are defined.`],
    };
  },
});

add({
  id: 'am-exp-eq', topic: 'A6', title: 'Exponential equations (substitution)', tiers: ['challenging', 'advanced'],
  gen(r, tier) {
    const a = r.pick([2, 3]);
    const p = r.int(0, 3);
    let n;
    let nonPow = tier === 'advanced';
    if (nonPow) n = r.pick(a === 2 ? [3, 5, 6, 7] : [2, 4, 5, 7]);
    else { let q; do q = r.int(0, 3); while (q === p); n = a ** q; }
    const m = a ** p;
    const roots = [{ type: 'num', v: String(p) }, nonPow ? { type: 'num', v: `@ln(${n})/@ln(${a})`, acc: 'sf3' } : { type: 'num', v: String(Math.round(Math.log(n) / Math.log(a))) }];
    return {
      stem: `Using the substitution $u = ${a}^{x}$, solve $${a}^{2x} - ${m + n}(${a}^{x}) + ${m * n} = 0$${nonPow ? ', giving non-integer answers to 3 significant figures' : ''}.`,
      parts: [M('x', { pre: 'x =', kb: 'calc', multi: roots, open: true })],
      solution: [`$u^2 - ${m + n}u + ${m * n} = 0 \\Rightarrow (u - ${m})(u - ${n}) = 0$`, `$${a}^{x} = ${m} \\Rightarrow x = ${p}$`, nonPow ? `$${a}^{x} = ${n} \\Rightarrow x = \\dfrac{\\lg ${n}}{\\lg ${a}} = ${fmt3(Math.log(n) / Math.log(a))}$` : `$${a}^{x} = ${n} \\Rightarrow x = ${Math.round(Math.log(n) / Math.log(a))}$`],
    };
  },
});

add({
  id: 'am-exp-model', topic: 'A6', title: 'Exponential growth and decay', tiers: ['challenging', 'advanced'],
  gen(r) {
    const N0 = r.int(2, 9) * 100, k = r.pick([0.05, 0.08, 0.1, 0.12, 0.15, 0.2, 0.25]);
    const t1 = r.int(3, 10);
    const N1 = Math.round(N0 * Math.exp(-k * t1));
    const kk = Math.log(N0 / N1) / t1;
    const target = Math.round(N0 / r.pick([4, 5, 8, 10]));
    const t2 = Math.log(N0 / target) / kk;
    return {
      stem: `The mass, $m$ grams, of a radioactive substance after $t$ days is $m = ${N0}e^{-kt}$. After ${t1} days the mass is ${N1} g.`,
      parts: [
        M('k', { label: '(a)', prompt: 'Find $k$.', pre: 'k =', kb: 'calc', key: { type: 'num', v: String(kk), acc: 'sf3' } }),
        M('t', { label: '(b)', prompt: `Find the time taken for the mass to fall to ${target} g.`, post: '\\text{ days}', kb: 'calc', key: { type: 'num', v: String(t2), acc: 'sf3' } }),
      ],
      solution: [`$${N1} = ${N0}e^{-${t1}k} \\Rightarrow k = \\dfrac{1}{${t1}}\\ln\\dfrac{${N0}}{${N1}} = ${fmt3(kk)}$`, `$${target} = ${N0}e^{-kt} \\Rightarrow t = \\dfrac{1}{k}\\ln\\dfrac{${N0}}{${target}} = ${fmt3(t2)}$ days`, 'Keep the unrounded value of $k$ in your calculator for part (b).'],
    };
  },
});

// ---------------- G1 TRIGONOMETRY ----------------
add({
  id: 'am-trig-exact', topic: 'G1', title: 'Exact trig values and quadrants', tiers: ['basic', 'challenging', 'advanced'],
  gen(r, tier) {
    const [o, a, h] = r.pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]]);
    const quad = r.pick([2, 3, 4]);
    const sS = quad === 2 ? 1 : -1, cS = quad === 4 ? 1 : -1;
    const sinA = [sS * o, h], cosA = [cS * a, h], tanA = [sS * cS * o, a];
    const given = r.pick(['sin', 'cos', 'tan']);
    const gtxt = given === 'sin' ? `\\sin A = ${fr(...sinA)}` : given === 'cos' ? `\\cos A = ${fr(...cosA)}` : `\\tan A = ${fr(...tanA)}`;
    const range = { 2: '90^\\circ < A < 180^\\circ', 3: '180^\\circ < A < 270^\\circ', 4: '270^\\circ < A < 360^\\circ' }[quad];
    const parts = [];
    if (given !== 'sin') parts.push(M('s', { label: '', pre: '\\sin A =', kb: 'num', key: { type: 'num', v: frk(...sinA) } }));
    if (given !== 'cos') parts.push(M('c', { label: '', pre: '\\cos A =', kb: 'num', key: { type: 'num', v: frk(...cosA) } }));
    if (given !== 'tan' && tier === 'basic') parts.push(M('t', { label: '', pre: '\\tan A =', kb: 'num', key: { type: 'num', v: frk(...tanA) } }));
    if (tier !== 'basic') parts.push(M('d', { label: '', pre: '\\sin 2A =', kb: 'num', key: { type: 'num', v: frk(2 * sinA[0] * cosA[0], h * h) } }));
    if (tier === 'advanced') parts.push(M('e', { label: '', pre: '\\cos 2A =', kb: 'num', key: { type: 'num', v: frk(cosA[0] ** 2 - sinA[0] ** 2, h * h) } }));
    return {
      stem: `Given that $${gtxt}$ and $${range}$, find the exact value of each of the following (no calculator).`,
      parts,
      solution: [`Right-angled triangle with sides $${o}, ${a}, ${h}$.`, `Quadrant ${quad}: ${quad === 2 ? 'only sin is positive' : quad === 3 ? 'only tan is positive' : 'only cos is positive'} (ASTC).`, `$\\sin A = ${fr(...sinA)},\\; \\cos A = ${fr(...cosA)},\\; \\tan A = ${fr(...tanA)}$`, ...(tier !== 'basic' ? [`$\\sin 2A = 2\\sin A\\cos A = ${fr(2 * sinA[0] * cosA[0], h * h)}$`] : []), ...(tier === 'advanced' ? [`$\\cos 2A = \\cos^2 A - \\sin^2 A = ${fr(cosA[0] ** 2 - sinA[0] ** 2, h * h)}$`] : [])],
    };
  },
});

function solsSin(v) {
  if (Math.abs(v) > 1) return [];
  const b = (Math.asin(v) * 180) / Math.PI;
  return [...new Set([b, 180 - b, b + 360].map((x) => round(((x % 360) + 360) % 360, 6)).concat(Math.abs(b) < 1e-9 ? [360] : []))].filter((x) => x >= 0 && x <= 360).sort((a, b) => a - b);
}
function solsCos(v) {
  if (Math.abs(v) > 1) return [];
  const b = (Math.acos(v) * 180) / Math.PI;
  return [...new Set([b, 360 - b].map((x) => round(x, 6)))].filter((x) => x >= 0 && x <= 360).sort((a, b) => a - b);
}

add({
  id: 'am-trig-eq', topic: 'G1', title: 'Trigonometric equations', tiers: ['basic', 'challenging', 'advanced'],
  gen(r, tier) {
    if (tier === 'basic') {
      const tanv = r.pick([[2, 3], [3, 4], [5, 2], [1, 3], [4, 1]]);
      const base = (Math.atan(tanv[0] / tanv[1]) * 180) / Math.PI;
      return {
        stem: `Solve $${tanv[1]}\\sin x = ${tanv[0]}\\cos x$ for $0^\\circ \\le x \\le 360^\\circ$, giving answers to 1 decimal place.`,
        parts: [M('x', { pre: 'x =', post: '^\\circ', kb: 'trig', multi: [base, base + 180].map((v) => ({ type: 'num', v: String(v), acc: 'dp1' })), open: true })],
        solution: [`Divide by $\\cos x$: $\\tan x = ${fr(tanv[0], tanv[1])}$`, `Basic angle $= ${base.toFixed(1)}^\\circ$; tan is positive in quadrants 1 and 3.`, `$x = ${base.toFixed(1)}^\\circ, ${(base + 180).toFixed(1)}^\\circ$`],
      };
    }
    // (p s - q)(t s - u) = 0 in sin or cos with nice values
    const fn = r.pick(['sin', 'cos']);
    const vals = [[1, 2], [-1, 2], [1, 1], [-1, 1], [0, 1], [2, 1], [3, 2]];
    let v1, v2;
    do { v1 = r.pick(vals); v2 = r.pick(vals); } while (v1[0] * v2[1] === v2[0] * v1[1] || (Math.abs(v1[0] / v1[1]) > 1 && Math.abs(v2[0] / v2[1]) > 1));
    // (v1[1] s - v1[0])(v2[1] s - v2[0])
    const A = v1[1] * v2[1], B = -(v1[1] * v2[0] + v2[1] * v1[0]), Cc = v1[0] * v2[0];
    const sols = [...new Set([...(fn === 'sin' ? solsSin(v1[0] / v1[1]) : solsCos(v1[0] / v1[1])), ...(fn === 'sin' ? solsSin(v2[0] / v2[1]) : solsCos(v2[0] / v2[1]))])].sort((a, b) => a - b);
    let stem;
    if (tier === 'advanced' && fn === 'sin') {
      // A sin^2 + B sin + C = 0  ->  write as  -A cos^2 + B sin + (A + C) = 0
      stem = `Solve $${poly([B, A + Cc], '\\sin x')} = ${A === 1 ? '' : A}\\cos^{2} x$ for $0^\\circ \\le x \\le 360^\\circ$.`;
    } else stem = `Solve $${poly([A, B, Cc], `\\${fn} x`).replace(new RegExp(`\\\\${fn} x\\^\\{2\\}`), `\\${fn}^{2} x`)} = 0$ for $0^\\circ \\le x \\le 360^\\circ$.`;
    return {
      stem,
      parts: [M('x', { pre: 'x =', post: '^\\circ', kb: 'trig', multi: sols.map((v) => ({ type: 'num', v: String(v), acc: 'dp1' })), open: true })],
      solution: [...(tier === 'advanced' && fn === 'sin' ? ['Replace $\\cos^2 x = 1 - \\sin^2 x$ to get a quadratic in $\\sin x$.'] : []), `$(${v1[1] === 1 ? '' : v1[1]}\\${fn} x ${v1[0] < 0 ? '+' : '-'} ${Math.abs(v1[0])})(${v2[1] === 1 ? '' : v2[1]}\\${fn} x ${v2[0] < 0 ? '+' : '-'} ${Math.abs(v2[0])}) = 0$`, ...[v1, v2].map((v) => (Math.abs(v[0] / v[1]) > 1 ? `$\\${fn} x = ${fr(v[0], v[1])}$ has **no solution** (outside $[-1, 1]$).` : `$\\${fn} x = ${fr(v[0], v[1])}$`)), `$x = ${sols.map((s) => fmt(s) + '^\\circ').join(', ')}$`],
    };
  },
});

add({
  id: 'am-R-formula', topic: 'G1', title: 'R-formula', tiers: ['challenging', 'advanced'],
  gen(r) {
    const a = r.int(1, 7), b = r.int(1, 7);
    const cosForm = r.chance(0.5);
    const R2 = a * a + b * b;
    const alpha = (Math.atan(b / a) * 180) / Math.PI;
    const parts = [
      M('R', { label: '(a)', prompt: 'Find $R$ (exact).', pre: 'R =', kb: 'num', key: { type: 'num', v: `@sqrt(${R2})`, acc: 'exact' } }),
      M('al', { label: '', prompt: 'and $\\alpha$ (2 d.p.).', pre: '\\alpha =', post: '^\\circ', kb: 'trig', key: { type: 'num', v: String(alpha), acc: 'dp2' } }),
      M('mx', { label: '(b)', prompt: 'State the maximum value of the expression.', kb: 'num', key: { type: 'num', v: `@sqrt(${R2})`, acc: 'sf3' } }),
    ];
    return {
      stem: cosForm ? `Express $${a}\\cos\\theta + ${b}\\sin\\theta$ in the form $R\\cos(\\theta - \\alpha)$, where $R > 0$ and $0^\\circ < \\alpha < 90^\\circ$.` : `Express $${a}\\sin\\theta + ${b}\\cos\\theta$ in the form $R\\sin(\\theta + \\alpha)$, where $R > 0$ and $0^\\circ < \\alpha < 90^\\circ$.`,
      parts,
      solution: [`$R = \\sqrt{${a}^2 + ${b}^2} = \\sqrt{${R2}}$`, `$\\tan\\alpha = \\dfrac{${b}}{${a}} \\Rightarrow \\alpha = ${alpha.toFixed(2)}^\\circ$`, `Maximum $= R = \\sqrt{${R2}}$ since $-1 \\le \\${cosForm ? 'cos' : 'sin'}(\\cdot) \\le 1$`],
    };
  },
});

add({
  id: 'am-trig-graph', topic: 'G1', title: 'Amplitude and period', tiers: ['basic', 'challenging'],
  gen(r) {
    const a = r.nz(-5, 5), b = r.pick([1, 2, 3, 4, 0.5]), c = r.int(-3, 3);
    const fn = r.pick(['sin', 'cos']);
    const bt = b === 0.5 ? '\\tfrac12 ' : b === 1 ? '' : b;
    return {
      stem: `For $y = ${a === 1 ? '' : a === -1 ? '-' : a}\\${fn}\\,${bt}x ${c ? sg(c) : ''}$, $0^\\circ \\le x \\le 360^\\circ$, state`,
      parts: [
        M('a', { label: '(a)', prompt: 'the amplitude,', kb: 'num', key: { type: 'num', v: String(Math.abs(a)) } }),
        M('p', { label: '(b)', prompt: 'the period,', post: '^\\circ', kb: 'num', key: { type: 'num', v: String(360 / b) } }),
        M('m', { label: '(c)', prompt: 'the maximum value of $y$.', kb: 'num', key: { type: 'num', v: String(Math.abs(a) + c) } }),
      ],
      solution: [`Amplitude $= |${a}| = ${Math.abs(a)}$ (always positive)`, `Period $= \\dfrac{360^\\circ}{${b}} = ${360 / b}^\\circ$`, `Max $= ${Math.abs(a)} ${sg(c)} = ${Math.abs(a) + c}$`],
    };
  },
});

const IDENTITIES = [
  {
    lhs: '\\dfrac{1 - \\cos^2 x}{\\sin x \\cos x}', rhs: '\\tan x',
    steps: [
      { e: '\\dfrac{\\sin^2 x}{\\sin x\\cos x}', k: '@sin(x)^2/(@sin(x)*@cos(x))', d: ['\\dfrac{\\cos^2 x}{\\sin x\\cos x}', '\\dfrac{1}{\\sin x}', '\\dfrac{-\\sin^2 x}{\\sin x\\cos x}'], r: 'pyth_id' },
      { e: '\\dfrac{\\sin x}{\\cos x}', k: '@sin(x)/@cos(x)', d: ['\\dfrac{\\cos x}{\\sin x}', '\\sin x', '\\dfrac{1}{\\cos x}'] },
    ],
  },
  {
    lhs: '(1 + \\tan^2 x)\\cos^2 x', rhs: '1',
    steps: [
      { e: '\\sec^2 x \\cos^2 x', k: '@sec(x)^2*@cos(x)^2', d: ['\\tan^2 x\\cos^2 x', '\\csc^2 x\\cos^2 x', '\\sin^2 x'], r: 'sec_id' },
      { e: '\\dfrac{1}{\\cos^2 x}\\cdot\\cos^2 x', k: '(1/@cos(x)^2)*@cos(x)^2', d: ['\\dfrac{1}{\\sin^2 x}\\cdot\\cos^2 x', '\\cos^4 x', '\\dfrac{\\cos^2 x}{\\sin^2 x}'] },
    ],
  },
  {
    lhs: '\\dfrac{\\sin 2x}{1 + \\cos 2x}', rhs: '\\tan x',
    steps: [
      { e: '\\dfrac{2\\sin x\\cos x}{2\\cos^2 x}', k: '(2*@sin(x)*@cos(x))/(2*@cos(x)^2)', d: ['\\dfrac{2\\sin x\\cos x}{2\\sin^2 x}', '\\dfrac{2\\sin x}{1 + 2\\cos x}', '\\dfrac{\\sin x\\cos x}{1 + \\cos^2 x}'], r: 'double_angle' },
      { e: '\\dfrac{\\sin x}{\\cos x}', k: '@sin(x)/@cos(x)', d: ['\\dfrac{\\cos x}{\\sin x}', '\\sin x\\cos x', '\\dfrac{1}{\\cos x}'] },
    ],
  },
  {
    lhs: '(\\sin x + \\cos x)^2', rhs: '1 + \\sin 2x',
    steps: [
      { e: '\\sin^2 x + 2\\sin x\\cos x + \\cos^2 x', k: '@sin(x)^2+2*@sin(x)*@cos(x)+@cos(x)^2', d: ['\\sin^2 x + \\cos^2 x', '\\sin^2 x - 2\\sin x\\cos x + \\cos^2 x', '2\\sin x\\cos x'] },
      { e: '1 + 2\\sin x\\cos x', k: '1+2*@sin(x)*@cos(x)', d: ['2 + 2\\sin x\\cos x', '1 - 2\\sin x\\cos x', '2\\sin x\\cos x'], r: 'pyth_id' },
    ],
    last: 'double_angle',
  },
  {
    lhs: '\\cos^4 x - \\sin^4 x', rhs: '\\cos 2x',
    steps: [
      { e: '(\\cos^2 x - \\sin^2 x)(\\cos^2 x + \\sin^2 x)', k: '(@cos(x)^2-@sin(x)^2)*(@cos(x)^2+@sin(x)^2)', d: ['(\\cos^2 x - \\sin^2 x)^2', '(\\cos x - \\sin x)^4', '(\\cos^2 x + \\sin^2 x)^2'] },
      { e: '\\cos^2 x - \\sin^2 x', k: '@cos(x)^2-@sin(x)^2', d: ['\\cos^2 x + \\sin^2 x', '1', '2\\cos^2 x'], r: 'pyth_id' },
    ],
    last: 'double_angle',
  },
  {
    lhs: '\\dfrac{1}{1 - \\sin x} + \\dfrac{1}{1 + \\sin x}', rhs: '2\\sec^2 x',
    steps: [
      { e: '\\dfrac{2}{1 - \\sin^2 x}', k: '2/(1-@sin(x)^2)', d: ['\\dfrac{2\\sin x}{1 - \\sin^2 x}', '\\dfrac{2}{1 + \\sin^2 x}', '\\dfrac{1}{1 - \\sin^2 x}'] },
      { e: '\\dfrac{2}{\\cos^2 x}', k: '2/@cos(x)^2', d: ['\\dfrac{2}{\\sin^2 x}', '2\\cos^2 x', '\\dfrac{1}{\\cos^2 x}'], r: 'pyth_id' },
    ],
  },
];

add({
  id: 'am-identity', topic: 'G1', title: 'Proving trigonometric identities', tiers: ['basic', 'challenging', 'advanced'], proof: true,
  gen(r) {
    const id = r.pick(IDENTITIES);
    const lines = [[`$\\text{LHS} = ${id.lhs}$`]];
    id.steps.forEach((s) => {
      const line = ['$=$', E({ type: 'expr', v: s.k, vars: ['x'], domain: [0.2, 1.3] }, s.e, s.d, 'trig')];
      if (s.r) line.push(R(s.r, ['pyth_id', 'sec_id', 'double_angle'].filter((x) => x !== s.r)));
      lines.push(line);
    });
    lines.push(id.last ? [`$= ${id.rhs} = \\text{RHS}$`, R(id.last, ['pyth_id', 'sec_id'])] : [`$= ${id.rhs} = \\text{RHS}$`]);
    return {
      stem: `Prove the identity $${id.lhs} \\equiv ${id.rhs}$.`,
      parts: [P('p', { lines, group: 'alg', prompt: 'Fill in each step. Work on one side only.' })],
      solution: [`$${id.lhs}$`, ...id.steps.map((s) => `$= ${s.e}$`), `$= ${id.rhs}$`, 'Never move terms across the $\\equiv$ sign — transform one side until it becomes the other.'],
    };
  },
});

// ---------------- G2 COORDINATE GEOMETRY ----------------
add({
  id: 'am-circle-eq', topic: 'G2', title: 'Equation of a circle', tiers: ['basic', 'challenging', 'advanced'],
  gen(r, tier) {
    const a = r.int(-6, 6), b = r.int(-6, 6), rad = r.int(2, 9);
    const g = -a, f = -b, c = a * a + b * b - rad * rad;
    if (tier === 'advanced') {
      // tangent gradient at a point on circle
      const pts = [[3, 4], [4, 3], [5, 12], [12, 5], [6, 8], [8, 6]].map(([u, v]) => [u, v, Math.hypot(u, v)]);
      const [u, v, R0] = r.pick(pts);
      const su = r.sign(), sv = r.sign();
      const px = a + su * u, py = b + sv * v;
      const R2 = R0 * R0;
      return {
        stem: `A circle has centre $(${a}, ${b})$ and passes through $P(${px}, ${py})$.`,
        parts: [
          M('k', { label: '(a)', prompt: `Find $k$ where the equation is $(x ${a < 0 ? '+' : '-'} ${Math.abs(a)})^2 + (y ${b < 0 ? '+' : '-'} ${Math.abs(b)})^2 = k$.`, pre: 'k =', kb: 'num', key: { type: 'num', v: String(R2) } }),
          ...(sv * v !== 0 ? [M('m', { label: '(b)', prompt: 'Find the gradient of the tangent at $P$.', pre: 'm =', kb: 'num', key: { type: 'num', v: frk(-su * u, sv * v) } })] : []),
        ],
        solution: [`$k = r^2 = (${px} - ${a})^2 + (${py} - ${b})^2 = ${R2}$`, `Gradient of radius $= ${fr(sv * v, su * u || 1)}$`, 'Tangent is perpendicular to the radius, so its gradient $= -\\dfrac{1}{m_{\\text{radius}}}$' + (sv * v ? ` $= ${fr(-su * u, sv * v)}$` : '')],
      };
    }
    return {
      stem: `A circle has equation $x^2 + y^2 ${coef(2 * g, 'x')} ${coef(2 * f, 'y')} ${c ? sg(c) : ''} = 0$.`.replace('  ', ' '),
      parts: [
        M('x', { label: '(a)', prompt: 'Find the coordinates of the centre.', pre: 'x =', kb: 'num', key: { type: 'num', v: String(a) } }),
        M('y', { label: '', pre: 'y =', kb: 'num', key: { type: 'num', v: String(b) } }),
        M('r', { label: '(b)', prompt: 'Find the radius.', kb: 'num', key: { type: 'num', v: String(rad) } }),
      ],
      solution: [`Complete the square: $(x ${a < 0 ? '+' : '-'} ${Math.abs(a)})^2 + (y ${b < 0 ? '+' : '-'} ${Math.abs(b)})^2 = ${a * a} + ${b * b} ${sg(-c)}$`, `Centre $(${a}, ${b})$, radius $= \\sqrt{${rad * rad}} = ${rad}$`],
    };
  },
});

add({
  id: 'am-perp-bisector', topic: 'G2', title: 'Perpendicular bisector', tiers: ['challenging', 'advanced'],
  gen(r) {
    let x1, y1, x2, y2;
    do { x1 = r.int(-6, 6); y1 = r.int(-6, 6); x2 = r.int(-6, 6); y2 = r.int(-6, 6); } while (x1 === x2 || y1 === y2 || (x1 + x2) % 2 || (y1 + y2) % 2);
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const mn = -(x2 - x1), md = y2 - y1; // gradient
    // c = my - m mx
    const cn = my * md - mn * mx, cd = md;
    return {
      stem: `Find the equation of the perpendicular bisector of $AB$, where $A(${x1}, ${y1})$ and $B(${x2}, ${y2})$, in the form $y = mx + c$.`,
      parts: [M('m', { pre: 'm =', kb: 'num', key: { type: 'num', v: frk(mn, md) } }), M('c', { pre: 'c =', kb: 'num', key: { type: 'num', v: frk(cn, cd) } })],
      solution: [`Midpoint $(${mx}, ${my})$`, `$m_{AB} = ${fr(y2 - y1, x2 - x1)}$ ⇒ perpendicular gradient $${fr(mn, md)}$`, `$y - ${my} = ${fr(mn, md)}(x - ${mx})$ ⇒ $c = ${fr(cn, cd)}$`],
    };
  },
});

add({
  id: 'am-area-shoelace', topic: 'G2', title: 'Area of a polygon from coordinates', tiers: ['basic', 'challenging'],
  gen(r, tier) {
    const n = tier === 'basic' ? 3 : 4;
    let pts, area;
    do {
      const angs = r.shuffle([0, 1, 2, 3, 4, 5, 6, 7]).slice(0, n).sort((a, b) => a - b);
      pts = angs.map((k) => [Math.round(5 * Math.cos((k * Math.PI) / 4)) + r.int(-1, 1), Math.round(5 * Math.sin((k * Math.PI) / 4)) + r.int(-1, 1)]);
      let s = 0;
      for (let i = 0; i < n; i++) { const [a, b] = pts[i], [c, d] = pts[(i + 1) % n]; s += a * d - b * c; }
      area = Math.abs(s) / 2;
    } while (area < 4);
    const names = 'ABCD'.slice(0, n).split('');
    return {
      stem: `Find the area of the ${n === 3 ? 'triangle' : 'quadrilateral'} with vertices ${pts.map((p, i) => `$${names[i]}(${p[0]}, ${p[1]})$`).join(', ')}.`,
      parts: [M('a', { post: '\\text{ units}^2', kb: 'num', key: { type: 'num', v: String(area) } })],
      solution: ['Use the shoelace method, listing the vertices in order (anticlockwise) and repeating the first:', `Area $= \\tfrac12\\left|\\sum (x_i y_{i+1} - x_{i+1} y_i)\\right| = ${fmt(area)}$`],
    };
  },
});

// ---------------- G3 PROOFS IN PLANE GEOMETRY ----------------
add({
  id: 'am-proof-geo', topic: 'G3', title: 'Proofs in plane geometry', tiers: ['basic', 'challenging', 'advanced'], proof: true,
  gen(r, tier) {
    const cfg = r.int(0, 2);
    const hard = tier !== 'basic';
    const F = new Fig(320, 230);
    if (cfg === 0) {
      const { L, LT, map } = relabel(r, ['T', 'A', 'B', 'C']);
      const tb = r.int(2, 6), bc = r.int(2, 9);
      const ta = Math.sqrt(tb * (tb + bc));
      // circle centre (190,115) r 70; T outside left; secant T-B-C horizontal-ish; A tangent point
      const cx = 190, cy = 115, rr = 70;
      const T0 = [30, 150];
      const d = Math.hypot(cx - T0[0], cy - T0[1]);
      const ang = Math.atan2(cy - T0[1], cx - T0[0]);
      const tl = Math.sqrt(d * d - rr * rr);
      const off = Math.asin(rr / d);
      const A0 = [T0[0] + tl * Math.cos(ang - off), T0[1] + tl * Math.sin(ang - off)];
      // secant through centre-ish: direction slightly below centre
      const dir = ang + 0.12;
      const ux = Math.cos(dir), uy = Math.sin(dir);
      const fx = T0[0] - cx, fy = T0[1] - cy;
      const bq = fx * ux + fy * uy, cq = fx * fx + fy * fy - rr * rr;
      const s1 = -bq - Math.sqrt(bq * bq - cq), s2 = -bq + Math.sqrt(bq * bq - cq);
      F.circle(cx, cy, rr).pt('T', ...T0).pt('A', ...A0).pt('B', T0[0] + s1 * ux, T0[1] + s1 * uy, { off: [-4, 13] }).pt('C', T0[0] + s2 * ux, T0[1] + s2 * uy);
      F.seg('T', 'A').seg('T', 'C').seg('A', 'B', 'dg-line dg-dash').seg('A', 'C', 'dg-line dg-dash');
      const svg = F.toString().replace(/>([A-Z])<|([|"])([A-Z])=/g, (m, c, q, d) => (c ? `>${map[c] || c}<` : `${q}${map[d] || d}=`));
      return {
        stem: LT(`$TA$ is a tangent to the circle at $A$. The line $TBC$ meets the circle at $B$ and $C$. Prove that $\\triangle TAB \\sim \\triangle TCA$ and hence that $TA^2 = TB \\times TC$. Given $TB = ${tb}$ cm and $BC = ${bc}$ cm, find $TA$.`),
        diagram: svg,
        parts: [P('p', {
          group: 'sim',
          lines: [
            [hard ? S(L('∠TAB=∠TCA')) : `$${SL(L('∠TAB = ∠TCA'))}$`, R('alt_seg', ['same_seg', 'centre', 'tan_rad'])],
            [hard ? S(L('∠ATB=∠CTA')) : `$${SL(L('∠ATB = ∠CTA'))}$`, R('common_angle', ['vert_opp', 'alt', 'given'])],
            [S(L('△TAB∼△TCA'), [L('△TAB∼△TAC'), L('△TAB≅△TCA')]), R('aa_sim', ['sas', 'asa', 'sss'])],
            [LT('$\\dfrac{TA}{TC} = \\dfrac{TB}{TA} \\Rightarrow TA^2 = TB \\times TC$'), R('sim_ratio', ['cong_sides', 'midpt_thm'])],
            [LT('$TA =$'), N({ type: 'num', v: `@sqrt(${tb * (tb + bc)})`, acc: 'sf3' }, '', '\\text{ cm}')],
          ],
        })],
        solution: [LT('Angle between tangent $TA$ and chord $AB$ equals the angle in the alternate segment, $\\angle ACB$.'), LT(`$TC = ${tb} + ${bc} = ${tb + bc}$ ⇒ $TA = \\sqrt{${tb} \\times ${tb + bc}} = ${fmt3(ta)}$ cm`)],
      };
    }
    if (cfg === 1) {
      const { L, LT, map } = relabel(r, ['T', 'A', 'B']);
      const cx = 200, cy = 115, rr = 62;
      const T0 = [40, 115];
      const d = cx - T0[0];
      const tl = Math.sqrt(d * d - rr * rr);
      const off = Math.asin(rr / d);
      const A0 = [T0[0] + tl * Math.cos(-off), T0[1] + tl * Math.sin(-off)], B0 = [T0[0] + tl * Math.cos(off), T0[1] + tl * Math.sin(off)];
      F.circle(cx, cy, rr).pt('T', ...T0).pt('A', ...A0).pt('B', ...B0).pt('O', cx, cy, { off: [12, 0] });
      F.seg('T', 'A').seg('T', 'B').seg('O', 'A').seg('O', 'B').seg('O', 'T', 'dg-line dg-dash').right('A', 'T', 'O').right('B', 'T', 'O');
      const svg = F.toString().replace(/>([A-Z])<|([|"])([A-Z])=/g, (m, c, q, d) => (c ? `>${map[c] || c}<` : `${q}${map[d] || d}=`));
      return {
        stem: LT('$TA$ and $TB$ are tangents from $T$ to the circle with centre $O$. Prove that $\\triangle OAT \\cong \\triangle OBT$ and hence that $TA = TB$ and $OT$ bisects $\\angle ATB$.'),
        diagram: svg,
        parts: [P('p', {
          group: 'circle',
          lines: [
            [hard ? S(L('∠OAT=∠OBT')) : `$${SL(L('∠OAT = ∠OBT'))} = 90^\\circ$`, R('tan_rad', ['semicircle', 'alt_seg', 'given'])],
            [hard ? S(L('OA=OB')) : `$${SL(L('OA = OB'))}$`, R('radii', ['tan_ext', 'given'])],
            [`$${SL(L('OT = OT'))}$`, R('common_side')],
            [S(L('△OAT≅△OBT'), [L('△OAT≅△BOT'), L('△OAT∼△OBT')]), R('rhs', ['sas', 'sss', 'asa'])],
            [hard ? S(L('TA=TB')) : `$${SL(L('TA = TB'))}$`, R('cong_sides', ['tan_ext', 'radii'])],
            [hard ? S(L('∠ATO=∠BTO')) : `$${SL(L('∠ATO = ∠BTO'))}$`, R('cong_angles', ['alt_seg', 'isos'])],
          ],
        })],
        solution: ['The radius is perpendicular to the tangent, which gives the right angles; $OT$ is the common hypotenuse, so the triangles are congruent by RHS.', 'This proves the “tangents from an external point” property — so in an exam you may not quote it as the reason here.'],
      };
    }
    const { L, LT, map } = relabel(r, ['A', 'B', 'C', 'M', 'N']);
    F.pt('A', 150, 22).pt('B', 40, 205).pt('C', 285, 205).pt('M', 95, 113.5, { off: [-13, 0] }).pt('N', 217.5, 113.5, { off: [13, 0] });
    F.poly(['A', 'B', 'C']).seg('M', 'N').tick('A', 'M', 1).tick('M', 'B', 1).tick('A', 'N', 2).tick('N', 'C', 2);
    const svg = F.toString().replace(/>([A-Z])<|([|"])([A-Z])=/g, (m, c, q, d) => (c ? `>${map[c] || c}<` : `${q}${map[d] || d}=`));
    return {
      stem: LT('$M$ and $N$ are the midpoints of $AB$ and $AC$. Prove that $MN \\parallel BC$ and $MN = \\tfrac12 BC$.'),
      diagram: svg,
      parts: [P('p', {
        group: 'sim',
        lines: [
          [LT('$\\dfrac{AM}{AB} = \\dfrac{AN}{AC} = \\dfrac12$'), R('midpoint', ['midpt_thm', 'given'])],
          [hard ? S(L('∠MAN=∠BAC')) : `$${SL(L('∠MAN = ∠BAC'))}$`, R('common_angle', ['vert_opp', 'alt'])],
          [S(L('△AMN∼△ABC'), [L('△AMN≅△ABC'), L('△AMN∼△ACB')]), R('sas_sim', ['aa_sim', 'sss', 'sas'])],
          [hard ? S(L('∠AMN=∠ABC')) : `$${SL(L('∠AMN = ∠ABC'))}$`, R('sim_angles', ['alt', 'corr', 'cong_angles'])],
          [hard ? S(L('MN∥BC'), [L('MN⊥BC')]) : `$${SL(L('MN ∥ BC'))}$`, R('conv_corr', ['corr', 'alt', 'conv_alt'])],
          [LT('$\\dfrac{MN}{BC} = \\dfrac12$, so $MN = \\tfrac12 BC$'), R('sim_ratio', ['midpt_thm', 'cong_sides'])],
        ],
      })],
      solution: ['Two sides in ratio 1 : 2 with the included (common) angle ⇒ similar (SAS similarity).', 'Equal corresponding angles ⇒ parallel lines (converse).', 'You are proving the midpoint theorem here, so it cannot be used as a reason.'],
    };
  },
});

// ---------------- C1 CALCULUS ----------------
add({
  id: 'am-diff', topic: 'C1', title: 'Differentiation techniques', tiers: ['basic', 'challenging', 'advanced'],
  gen(r, tier) {
    const a = r.int(2, 5), b = r.int(1, 6), n = r.int(3, 6), k = r.int(2, 4);
    const pool = tier === 'basic'
      ? [
          () => ({ f: `(${a}x + ${b})^{${n}}`, d: `${n * a}*(${a}*x+${b})^${n - 1}`, s: [`Chain rule: $${n}(${a}x + ${b})^{${n - 1}} \\times ${a}$`, `$= ${n * a}(${a}x + ${b})^{${n - 1}}$`] }),
          () => ({ f: `${a}x^{${n}} - \\dfrac{${b}}{x^{${k}}}`, d: `${a * n}*x^${n - 1}+${b * k}*x^(-${k + 1})`, s: [`Write $\\dfrac{${b}}{x^{${k}}} = ${b}x^{-${k}}$`, `$${a * n}x^{${n - 1}} + ${b * k}x^{-${k + 1}}$`] }),
          () => ({ f: `\\sqrt{${a}x + ${b}}`, d: `${a}/(2*@sqrt(${a}*x+${b}))`, s: [`$(${a}x + ${b})^{1/2}$ ⇒ $\\tfrac12(${a}x + ${b})^{-1/2} \\times ${a}$`, `$= \\dfrac{${a}}{2\\sqrt{${a}x + ${b}}}$`] }),
          () => ({ f: `e^{${a}x}`, d: `${a}*@e^(${a}*x)`, s: [`$\\dfrac{d}{dx}e^{f(x)} = f'(x)e^{f(x)}$`, `$= ${a}e^{${a}x}$`] }),
        ]
      : tier === 'challenging'
      ? [
          () => ({ f: `x^{${k}}(${a}x + ${b})^{${n}}`, d: `${k}*x^${k - 1}*(${a}*x+${b})^${n}+x^${k}*${n * a}*(${a}*x+${b})^${n - 1}`, s: ['Product rule: $u\'v + uv\'$', `$= ${k}x^{${k - 1}}(${a}x + ${b})^{${n}} + ${n * a}x^{${k}}(${a}x + ${b})^{${n - 1}}$`] }),
          () => ({ f: `\\dfrac{${a}x + ${b}}{x + ${k}}`, d: `(${a}*${k}-${b})/(x+${k})^2`, s: ['Quotient rule: $\\dfrac{vu\' - uv\'}{v^2}$', `$= \\dfrac{${a}(x + ${k}) - (${a}x + ${b})}{(x + ${k})^2} = \\dfrac{${a * k - b}}{(x + ${k})^2}$`] }),
          () => ({ f: `\\ln(${a}x^{2} + ${b})`, d: `(${2 * a}*x)/(${a}*x^2+${b})`, s: [`$\\dfrac{d}{dx}\\ln f(x) = \\dfrac{f'(x)}{f(x)}$`, `$= \\dfrac{${2 * a}x}{${a}x^2 + ${b}}$`] }),
          () => ({ f: `\\sin^{${k}} x`, d: `${k}*@sin(x)^${k - 1}*@cos(x)`, s: [`$\\sin^{${k}} x = (\\sin x)^{${k}}$ — chain rule`, `$= ${k}\\sin^{${k - 1}} x\\cos x$`] }),
          () => ({ f: `\\cos(${a}x + ${b})`, d: `-${a}*@sin(${a}*x+${b})`, s: [`$= -${a}\\sin(${a}x + ${b})$`] }),
        ]
      : [
          () => ({ f: `x^{${k}} e^{${a}x}`, d: `${k}*x^${k - 1}*@e^(${a}*x)+${a}*x^${k}*@e^(${a}*x)`, s: ['Product rule', `$= x^{${k - 1}}e^{${a}x}(${k} + ${a}x)$`] }),
          () => ({ f: `\\dfrac{\\ln x}{x^{${k}}}`, d: `(1-${k}*@ln(x))/x^${k + 1}`, s: ['Quotient rule', `$= \\dfrac{x^{${k}}\\cdot\\frac1x - ${k}x^{${k - 1}}\\ln x}{x^{${2 * k}}} = \\dfrac{1 - ${k}\\ln x}{x^{${k + 1}}}$`] }),
          () => ({ f: `e^{${a}x}\\sin ${k}x`, d: `${a}*@e^(${a}*x)*@sin(${k}*x)+${k}*@e^(${a}*x)*@cos(${k}*x)`, s: ['Product rule', `$= e^{${a}x}(${a}\\sin ${k}x + ${k}\\cos ${k}x)$`] }),
          () => ({ f: `\\tan^{2}(${a}x)`, d: `2*@tan(${a}*x)*${a}*@sec(${a}*x)^2`, s: ['Chain rule twice', `$= ${2 * a}\\tan(${a}x)\\sec^2(${a}x)$`] }),
        ];
    const c = r.pick(pool)();
    return {
      stem: `Differentiate $y = ${c.f}$ with respect to $x$.`,
      parts: [M('d', { pre: '\\dfrac{dy}{dx} =', kb: 'calc', key: { type: 'expr', v: c.d, vars: ['x'], domain: [0.2, 1.2] } })],
      solution: c.s,
    };
  },
});

add({
  id: 'am-tangent', topic: 'C1', title: 'Tangents and normals', tiers: ['basic', 'challenging'],
  gen(r, tier) {
    const a = r.nz(-3, 3), b = r.int(-6, 6), c = r.int(-6, 6), p = r.nz(-3, 3);
    const y0 = a * p * p + b * p + c, m = 2 * a * p + b;
    const normal = tier === 'challenging' && m !== 0;
    const mm = normal ? [-1, m] : [m, 1];
    const cn = y0 * mm[1] - mm[0] * p, cd = mm[1];
    return {
      stem: `Find the equation of the ${normal ? 'normal' : 'tangent'} to the curve $y = ${poly([a, b, c])}$ at the point where $x = ${p}$, in the form $y = mx + c$.`,
      parts: [M('m', { pre: 'm =', kb: 'num', key: { type: 'num', v: frk(...mm) } }), M('c', { pre: 'c =', kb: 'num', key: { type: 'num', v: frk(cn, cd) } })],
      solution: [`$\\dfrac{dy}{dx} = ${poly([2 * a, b])}$; at $x = ${p}$, gradient $= ${m}$, point $(${p}, ${y0})$`, ...(normal ? [`Normal gradient $= -\\dfrac{1}{${m}} = ${fr(-1, m)}$`] : []), `$y - ${y0} = ${fr(...mm)}(x - ${p})$ ⇒ $c = ${fr(cn, cd)}$`],
    };
  },
});

add({
  id: 'am-stationary', topic: 'C1', title: 'Stationary points and their nature', tiers: ['basic', 'challenging', 'advanced'], proof: true,
  gen(r) {
    let s, t;
    do { s = r.int(-4, 3); t = r.int(-3, 5); } while (s >= t || (s + t) % 2 !== 0);
    const p = (-3 * (s + t)) / 2, q = 3 * s * t, c0 = r.int(-6, 6);
    const y = (x) => x ** 3 + p * x * x + q * x + c0;
    const d2s = 6 * s + 2 * p;
    return {
      stem: `The curve $y = ${poly([1, p, q, c0])}$ has two stationary points.`,
      parts: [
        M('x', { label: '(a)', prompt: 'Find the $x$-coordinates of the stationary points.', pre: 'x =', kb: 'num', multi: [{ type: 'num', v: String(s) }, { type: 'num', v: String(t) }], open: true }),
        P('p', {
          label: '(b)', prompt: `Determine the nature of the stationary point $(${s}, ${y(s)})$.`, group: 'alg',
          lines: [
            [`$\\dfrac{d^2y}{dx^2} = 6x ${sg(2 * p)}$; at $x = ${s}$, $\\dfrac{d^2y}{dx^2} =$`, N({ type: 'num', v: String(d2s) })],
            ['Test used:', R('d2_neg', ['d2_pos', 'dy_pos', 'disc_neg'])],
          ],
        }),
        C('n', { label: '', prompt: 'Hence the point is', options: ['a maximum point', 'a minimum point', 'a point of inflexion', 'impossible to classify'], correct: 0 }),
      ],
      solution: [`$\\dfrac{dy}{dx} = 3x^2 ${coef(2 * p, 'x')} ${sg(q)} = 3(x ${-s < 0 ? '-' : '+'} ${Math.abs(s)})(x ${-t < 0 ? '-' : '+'} ${Math.abs(t)})$`, `Stationary when $\\dfrac{dy}{dx} = 0$: $x = ${s}$ or $x = ${t}$`, `At $x = ${s}$: $\\dfrac{d^2y}{dx^2} = ${d2s} < 0$ ⇒ maximum`, 'Always state the test **and** the sign: “since d²y/dx² < 0, it is a maximum point”.'],
    };
  },
});

add({
  id: 'am-rates', topic: 'C1', title: 'Connected rates of change', tiers: ['challenging', 'advanced'],
  gen(r) {
    const mode = r.pick(['sphere', 'circle', 'cube']);
    const k = r.int(2, 30), x0 = r.int(2, 12);
    if (mode === 'sphere') {
      const v = k / (4 * Math.PI * x0 * x0);
      return {
        stem: `Air is pumped into a spherical balloon at a rate of ${k} cm³/s. Find the rate of increase of the radius when the radius is ${x0} cm.`,
        parts: [M('a', { post: '\\text{ cm/s}', kb: 'num', key: { type: 'num', v: String(v), acc: 'sf3' } })],
        solution: ['$V = \\tfrac43\\pi r^3 \\Rightarrow \\dfrac{dV}{dr} = 4\\pi r^2$', `$\\dfrac{dr}{dt} = \\dfrac{dV/dt}{dV/dr} = \\dfrac{${k}}{4\\pi(${x0})^2} = ${fmt3(v)}$ cm/s`],
      };
    }
    if (mode === 'circle') {
      const v = 2 * Math.PI * x0 * (k / 10);
      return {
        stem: `The radius of a circular oil spill increases at ${k / 10} m/s. Find the rate of increase of its area when the radius is ${x0} m.`,
        parts: [M('a', { post: '\\text{ m}^2\\text{/s}', kb: 'num', key: { type: 'num', v: String(v), acc: 'sf3' } })],
        solution: ['$A = \\pi r^2 \\Rightarrow \\dfrac{dA}{dr} = 2\\pi r$', `$\\dfrac{dA}{dt} = 2\\pi(${x0}) \\times ${k / 10} = ${fmt3(v)}$ m²/s`],
      };
    }
    const v = k / (3 * x0 * x0);
    return {
      stem: `The volume of a cube increases at ${k} cm³/s. Find the rate of increase of its edge length when the edge is ${x0} cm.`,
      parts: [M('a', { post: '\\text{ cm/s}', kb: 'num', key: { type: 'num', v: String(v), acc: 'sf3' } })],
      solution: ['$V = x^3 \\Rightarrow \\dfrac{dV}{dx} = 3x^2$', `$\\dfrac{dx}{dt} = \\dfrac{${k}}{3(${x0})^2} = ${fmt3(v)}$ cm/s`],
    };
  },
});

add({
  id: 'am-integrate', topic: 'C1', title: 'Indefinite integration', tiers: ['basic', 'challenging', 'advanced'],
  gen(r, tier) {
    const a = r.int(2, 6), b = r.int(1, 5), n = r.int(2, 5), k = r.int(2, 4);
    const pool = tier === 'basic'
      ? [
          () => ({ f: `${a * (n + 1)}x^{${n}} + ${b * 2}x`, F: `${a}*x^${n + 1}+${b}*x^2`, s: [`Raise the power by 1 and divide by the new power`, `$${a}x^{${n + 1}} + ${b}x^{2} + c$`] }),
          () => ({ f: `\\dfrac{${a * k}}{x^{${k + 1}}}`, F: `-${a}*x^(-${k})`, s: [`$${a * k}x^{-${k + 1}}$ ⇒ $\\dfrac{${a * k}x^{-${k}}}{-${k}}$`, `$= -\\dfrac{${a}}{x^{${k}}} + c$`] }),
        ]
      : tier === 'challenging'
      ? [
          () => ({ f: `(${a}x + ${b})^{${n}}`, F: `(${a}*x+${b})^${n + 1}/(${a * (n + 1)})`, s: [`$\\int (ax + b)^n\\,dx = \\dfrac{(ax + b)^{n+1}}{a(n + 1)} + c$`, `$= \\dfrac{(${a}x + ${b})^{${n + 1}}}{${a * (n + 1)}} + c$`] }),
          () => ({ f: `e^{${a}x} + \\sqrt{x}`, F: `@e^(${a}*x)/${a}+(2/3)*x^(3/2)`, s: [`$\\dfrac{1}{${a}}e^{${a}x} + \\dfrac{2}{3}x^{3/2} + c$`] }),
          () => ({ f: `\\cos ${k}x`, F: `@sin(${k}*x)/${k}`, s: [`$\\dfrac{1}{${k}}\\sin ${k}x + c$`] }),
        ]
      : [
          () => ({ f: `\\dfrac{${a}}{${k}x + ${b}}`, F: `(${a}/${k})*@ln(${k}*x+${b})`, s: [`$\\int \\dfrac{1}{ax + b}\\,dx = \\dfrac1a \\ln(ax + b) + c$`, `$= ${fr(a, k)}\\ln(${k}x + ${b}) + c$`] }),
          () => ({ f: `\\sin^2 x`, F: `x/2-@sin(2*x)/4`, s: ['Use $\\sin^2 x = \\tfrac12(1 - \\cos 2x)$', '$= \\tfrac12 x - \\tfrac14\\sin 2x + c$'] }),
          () => ({ f: `\\dfrac{(x + ${b})^2}{x^{2}}`, F: `x+${2 * b}*@ln(x)-${b * b}/x`, s: ['Expand and divide first: $1 + \\dfrac{' + 2 * b + '}{x} + \\dfrac{' + b * b + '}{x^2}$', `$= x + ${2 * b}\\ln x - \\dfrac{${b * b}}{x} + c$`] }),
        ];
    const c = r.pick(pool)();
    return {
      stem: `Find $\\displaystyle\\int ${c.f}\\, dx$.`,
      parts: [M('i', { kb: 'calc', key: { type: 'expr', v: c.F, vars: ['x'], plusC: true, domain: [0.3, 1.4] } })],
      solution: c.s.concat(['Indefinite integrals need $+\\,c$.']),
    };
  },
});

add({
  id: 'am-definite', topic: 'C1', title: 'Definite integrals and area', tiers: ['basic', 'challenging', 'advanced'],
  gen(r, tier) {
    if (tier === 'advanced' || (tier === 'challenging' && r.chance(0.5))) {
      let p = r.int(-3, 2), q = r.int(-1, 5);
      if (q <= p) q = p + r.int(2, 4);
      const area = (q - p) ** 3; // /6
      return {
        stem: `The curve $y = ${poly([-1, p + q, -p * q])}$ meets the $x$-axis at two points. Find the area of the region enclosed by the curve and the $x$-axis.`,
        parts: [M('a', { post: '\\text{ units}^2', kb: 'num', key: { type: 'num', v: frk(area, 6) } })],
        solution: [`Roots: $x = ${p}$ and $x = ${q}$`, `Area $= \\displaystyle\\int_{${p}}^{${q}} (${poly([-1, p + q, -p * q])})\\,dx = ${fr(area, 6)}$`],
      };
    }
    const a = r.int(1, 4), b = r.int(-4, 6), lo = r.int(-2, 1), hi = lo + r.int(1, 3);
    // ∫ (3a x^2 + 2b x + 1) dx = a x^3 + b x^2 + x
    const Fx = (x) => a * x ** 3 + b * x * x + x;
    return {
      stem: `Evaluate $\\displaystyle\\int_{${lo}}^{${hi}} (${poly([3 * a, 2 * b, 1])})\\,dx$.`,
      parts: [M('a', { kb: 'num', key: { type: 'num', v: String(Fx(hi) - Fx(lo)) } })],
      solution: [`$= \\left[${poly([a, b, 1, 0])}\\right]_{${lo}}^{${hi}}$`, `$= ${Fx(hi)} - (${Fx(lo)}) = ${Fx(hi) - Fx(lo)}$`],
    };
  },
});

// ---------------- CONCEPTS ----------------
const AM_CONCEPTS = [
  { topic: 'A1', q: 'The equation $ax^2 + bx + c = 0$ has no real roots. Which must be true?', o: ['$b^2 - 4ac < 0$', '$b^2 - 4ac > 0$', '$b^2 - 4ac = 0$', '$a < 0$'], e: 'No real roots ⇔ discriminant negative.' },
  { topic: 'A1', q: 'A line is a tangent to a curve. After substituting, the resulting quadratic has', o: ['discriminant equal to 0', 'discriminant greater than 0', 'discriminant less than 0', 'no constant term'], e: 'A tangent touches the curve at exactly one point ⇒ one repeated root.' },
  { topic: 'A4', q: '$f(3) = 0$ for a polynomial $f(x)$. What can you conclude?', o: ['$(x - 3)$ is a factor of $f(x)$', '$(x + 3)$ is a factor of $f(x)$', 'The remainder on dividing by $(x - 3)$ is 3', '$f(x)$ has no real roots'], e: 'Factor theorem: $f(a) = 0 \\iff (x - a)$ is a factor.' },
  { topic: 'A6', q: 'Why must $x = -4$ be rejected when solving $\\lg x + \\lg(x + 3) = \\lg 4$?', o: ['$\\lg(-4)$ is undefined', 'It does not satisfy the quadratic', 'Logs cannot equal 4', 'Negative answers are never allowed'], e: 'The logarithm of a negative number (or zero) is undefined for real numbers.' },
  { topic: 'A6', q: '$\\log_a xy$ equals', o: ['$\\log_a x + \\log_a y$', '$\\log_a x \\times \\log_a y$', '$\\log_a x - \\log_a y$', '$y\\log_a x$'], e: 'Product law of logarithms.' },
  { topic: 'C1', q: 'At a stationary point, $\\frac{d^2y}{dx^2} = 0$. What can you conclude about its nature?', o: ['Nothing yet — use the first derivative test', 'It is a maximum', 'It is a minimum', 'It is a point of inflexion'], e: 'The second derivative test is inconclusive when it equals 0; check the sign of $\\frac{dy}{dx}$ on either side.' },
  { topic: 'C1', q: 'To show that $y = x^3 + 3x$ is an increasing function, you should show', o: ['$\\frac{dy}{dx} = 3x^2 + 3 > 0$ for all $x$', '$y > 0$ for all $x$', '$\\frac{d^2y}{dx^2} > 0$', '$y(1) > y(0)$'], e: 'Increasing ⇔ gradient positive for all real $x$; $3x^2 \\ge 0$ so $3x^2 + 3 > 0$.' },
  { topic: 'G1', q: 'What is the period of $y = \\tan 2x$ (in degrees)?', o: ['$90^\\circ$', '$180^\\circ$', '$360^\\circ$', '$720^\\circ$'], e: 'tan has period 180°; $\\tan 2x$ has period $180^\\circ/2 = 90^\\circ$.' },
  { topic: 'G1', q: 'The principal value of $\\sin^{-1}(-\\frac12)$ is', o: ['$-30^\\circ$', '$210^\\circ$', '$330^\\circ$', '$150^\\circ$'], e: 'Principal values of $\\sin^{-1}$ lie in $[-90^\\circ, 90^\\circ]$.' },
  { topic: 'G2', q: 'Two lines with gradients $m_1$ and $m_2$ are perpendicular when', o: ['$m_1 m_2 = -1$', '$m_1 = m_2$', '$m_1 + m_2 = 0$', '$m_1 m_2 = 1$'], e: 'Perpendicular gradients are negative reciprocals.' },
  { topic: 'C1', q: '$\\frac{d}{dx}(\\ln 5x)$ equals', o: ['$\\frac1x$', '$\\frac5x$', '$\\frac{1}{5x}$', '$5\\ln x$'], e: '$\\ln 5x = \\ln 5 + \\ln x$, and $\\ln 5$ is a constant.' },
  { topic: 'G3', q: 'In a proof, which statement can you quote as a reason for “∠TAB = ∠ACB” where TA is a tangent?', o: ['Alternate segment theorem', 'Angles in the same segment', 'Tangent is perpendicular to radius', 'Alternate angles'], e: 'The angle between a tangent and a chord equals the angle in the alternate segment.' },
];
add({
  id: 'am-concept', topic: 'MIX', title: 'Concepts and definitions', tiers: ['basic', 'challenging', 'advanced'],
  gen(r) {
    const c = r.pick(AM_CONCEPTS);
    return { topicOverride: c.topic, stem: c.q, parts: [C('a', { options: c.o, correct: 0, explain: c.e })], solution: [c.e] };
  },
});

export default T;
