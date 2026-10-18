// Expression parser + evaluator used for grading.
// Syntax (produced by the client math editor and used for answer keys):
//   numbers, single-letter variables (x, y, θ, k ...), + - * / ^ ( ) ,
//   implicit multiplication (2x, 3(x+1), x y)
//   @sqrt(a) @root(n,a) @abs(a) @sin(a) @cos(a) @tan(a) @ln(a) @log(a) @logb(b,a)
//   @int(lo,hi,body)  (definite integral in x, numeric Simpson)
//   @pi @e   constants
//   °  (ignored, angles are in the part's angle mode)

const FUNCS = new Set(['sqrt', 'root', 'abs', 'sin', 'cos', 'tan', 'sec', 'cosec', 'cot', 'ln', 'log', 'logb', 'int', 'asin', 'acos', 'atan']);
const CONSTS = { pi: Math.PI, e: Math.E };

export class ParseError extends Error {}

function tokenize(src) {
  const s = String(src)
    .replace(/[×·]/g, '*')
    .replace(/÷/g, '/')
    .replace(/[−–]/g, '-')
    .replace(/π/g, '@pi')
    .replace(/°/g, '')
    .replace(/\s+/g, '');
  const out = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      const txt = s.slice(i, j);
      if ((txt.match(/\./g) || []).length > 1) throw new ParseError('bad number');
      out.push({ t: 'num', v: parseFloat(txt), raw: txt });
      i = j;
    } else if (c === '@') {
      let j = i + 1;
      while (j < s.length && /[a-z]/.test(s[j])) j++;
      const name = s.slice(i + 1, j);
      if (FUNCS.has(name)) out.push({ t: 'fn', v: name });
      else if (name in CONSTS) out.push({ t: 'const', v: name });
      else throw new ParseError('unknown @' + name);
      i = j;
    } else if (/[+\-*/^(),!]/.test(c)) {
      out.push({ t: 'op', v: c });
      i++;
    } else if (/\p{L}/u.test(c)) {
      out.push({ t: 'var', v: c });
      i++;
    } else {
      throw new ParseError('unexpected ' + c);
    }
  }
  return out;
}

export function parse(src) {
  const toks = tokenize(src);
  let p = 0;
  const peek = () => toks[p];
  const isOp = (v) => peek() && peek().t === 'op' && peek().v === v;
  const eat = (v) => {
    if (!isOp(v)) throw new ParseError('expected ' + v);
    p++;
  };
  const startsPrimary = () => {
    const t = peek();
    if (!t) return false;
    return t.t === 'num' || t.t === 'var' || t.t === 'fn' || t.t === 'const' || (t.t === 'op' && t.v === '(');
  };

  function expr() {
    let node = term();
    while (isOp('+') || isOp('-')) {
      const op = toks[p++].v;
      node = { k: op, a: node, b: term() };
    }
    return node;
  }
  function term() {
    let node = unary();
    for (;;) {
      if (isOp('*') || isOp('/')) {
        const op = toks[p++].v;
        node = { k: op, a: node, b: unary() };
      } else if (startsPrimary()) {
        node = { k: '*', a: node, b: power() };
      } else break;
    }
    return node;
  }
  function unary() {
    if (isOp('-')) { p++; return { k: 'neg', a: unary() }; }
    if (isOp('+')) { p++; return unary(); }
    return power();
  }
  function power() {
    let base = postfix();
    if (isOp('^')) {
      p++;
      return { k: '^', a: base, b: unary() };
    }
    return base;
  }
  function postfix() {
    let n = primary();
    while (isOp('!')) { p++; n = { k: 'fact', a: n }; }
    return n;
  }
  function primary() {
    const t = peek();
    if (!t) throw new ParseError('unexpected end');
    if (t.t === 'num') { p++; return { k: 'num', v: t.v, raw: t.raw }; }
    if (t.t === 'var') { p++; return { k: 'var', v: t.v }; }
    if (t.t === 'const') { p++; return { k: 'const', v: t.v }; }
    if (t.t === 'fn') {
      p++;
      eat('(');
      const args = [expr()];
      while (isOp(',')) { p++; args.push(expr()); }
      eat(')');
      return { k: 'fn', v: t.v, args };
    }
    if (isOp('(')) {
      p++;
      const e = expr();
      eat(')');
      return { k: 'paren', a: e };
    }
    throw new ParseError('unexpected ' + t.v);
  }
  if (!toks.length) throw new ParseError('empty');
  const tree = expr();
  if (p !== toks.length) throw new ParseError('trailing input');
  return tree;
}

function fact(n) {
  if (n < 0 || !Number.isInteger(n) || n > 170) return NaN;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

export function evaluate(node, env = {}, opts = {}) {
  const deg = opts.angle === 'deg';
  const toRad = (a) => (deg ? (a * Math.PI) / 180 : a);
  const fromRad = (a) => (deg ? (a * 180) / Math.PI : a);
  const ev = (n) => {
    switch (n.k) {
      case 'num': return n.v;
      case 'var':
        if (n.v in env) return env[n.v];
        if (n.v === 'e' ) return Math.E;
        throw new ParseError('unknown variable ' + n.v);
      case 'const': return CONSTS[n.v];
      case 'paren': return ev(n.a);
      case 'neg': return -ev(n.a);
      case '+': return ev(n.a) + ev(n.b);
      case '-': return ev(n.a) - ev(n.b);
      case '*': return ev(n.a) * ev(n.b);
      case '/': return ev(n.a) / ev(n.b);
      case '^': {
        const a = ev(n.a), b = ev(n.b);
        if (a < 0 && !Number.isInteger(b)) {
          // allow odd roots of negatives, e.g. (-8)^(1/3)
          const inv = 1 / b;
          if (Math.abs(inv - Math.round(inv)) < 1e-9 && Math.round(inv) % 2 !== 0) return -Math.pow(-a, b);
        }
        return Math.pow(a, b);
      }
      case 'fact': return fact(ev(n.a));
      case 'fn': {
        const A = n.args.map((x) => x);
        const one = () => ev(A[0]);
        switch (n.v) {
          case 'sqrt': return Math.sqrt(one());
          case 'root': {
            const k = ev(A[0]), v = ev(A[1]);
            if (v < 0 && Math.round(k) % 2 === 1) return -Math.pow(-v, 1 / k);
            return Math.pow(v, 1 / k);
          }
          case 'abs': return Math.abs(one());
          case 'sin': return Math.sin(toRad(one()));
          case 'cos': return Math.cos(toRad(one()));
          case 'tan': return Math.tan(toRad(one()));
          case 'sec': return 1 / Math.cos(toRad(one()));
          case 'cosec': return 1 / Math.sin(toRad(one()));
          case 'cot': return 1 / Math.tan(toRad(one()));
          case 'asin': return fromRad(Math.asin(one()));
          case 'acos': return fromRad(Math.acos(one()));
          case 'atan': return fromRad(Math.atan(one()));
          case 'ln': return Math.log(one());
          case 'log': return A.length === 2 ? Math.log(ev(A[1])) / Math.log(ev(A[0])) : Math.log10(one());
          case 'logb': return Math.log(ev(A[1])) / Math.log(ev(A[0]));
          case 'int': {
            const lo = ev(A[0]), hi = ev(A[1]);
            const N = 400;
            const h = (hi - lo) / N;
            const f = (x) => evaluate(A[2], { ...env, x }, opts);
            let s = f(lo) + f(hi);
            for (let i = 1; i < N; i++) s += f(lo + i * h) * (i % 2 ? 4 : 2);
            return (s * h) / 3;
          }
        }
      }
    }
    throw new ParseError('cannot evaluate');
  };
  return ev(node);
}

export function variables(node, acc = new Set()) {
  if (!node || typeof node !== 'object') return acc;
  if (node.k === 'var') acc.add(node.v);
  for (const key of ['a', 'b']) if (node[key]) variables(node[key], acc);
  if (node.args) node.args.forEach((x) => variables(x, acc));
  return acc;
}

export function hasDecimal(src) {
  return /\d\.\d|\.\d/.test(String(src));
}

// true if the top level of the expression is a product (no top-level + or -)
export function isProductForm(node) {
  let n = node;
  while (n.k === 'paren') n = n.a;
  if (n.k === 'neg') n = n.a;
  return n.k === '*' || n.k === '^' || n.k === 'paren' || n.k === 'var' || n.k === 'num' || n.k === 'fn';
}

export function evalString(src, env = {}, opts = {}) {
  return evaluate(parse(src), env, opts);
}

// AST -> LaTeX (used to show model answers). Light tidying of +(-n), x^1, 1*x.
export function toLatex(src) {
  let tree;
  try { tree = parse(src); } catch { return String(src); }
  const prec = { '+': 1, '-': 1, '*': 2, '/': 2, neg: 3, '^': 4 };
  const isNegNum = (n) => (n.k === 'num' && n.v < 0) || n.k === 'neg' || (n.k === 'paren' && isNegNum(n.a));
  const strip = (n) => (n.k === 'paren' ? strip(n.a) : n);
  const L = (n, parent = 0) => {
    switch (n.k) {
      case 'num': return n.raw || String(n.v);
      case 'var': return n.v === 'θ' ? '\\theta' : n.v;
      case 'const': return n.v === 'pi' ? '\\pi' : 'e';
      case 'paren': {
        const inner = strip(n.a);
        if (inner.k === 'num' || inner.k === 'var' || inner.k === 'const' || inner.k === 'fn') return L(inner, parent);
        if (inner.k === '/' && parent < 4) return L(inner, parent);
        if (inner.k === 'neg' && parent <= 1) return L(inner, parent);
        return parent >= 2 ? `\\left(${L(inner)}\\right)` : L(inner, parent);
      }
      case 'neg': return '-' + L(n.a, 3);
      case '+': {
        const b = strip(n.b);
        if (b.k === 'neg') return `${L(n.a, 1)} - ${L(b.a, 2)}`;
        if (b.k === 'num' && b.v === 0) return L(n.a, parent);
        if (b.k === '*' && isNegNum(strip(b.a))) {
          const c = strip(strip(b.a).k === 'neg' ? strip(b.a).a : strip(b.a));
          return `${L(n.a, 1)} - ${c.k === 'num' && c.v === 1 ? '' : L(c, 2)}${L(b.b, 2)}`;
        }
        const s = `${L(n.a, 1)} + ${L(n.b, 1)}`;
        return parent > 1 ? `\\left(${s}\\right)` : s;
      }
      case '-': { const s = `${L(n.a, 1)} - ${L(n.b, 2)}`; return parent > 1 ? `\\left(${s}\\right)` : s; }
      case '*': {
        const a = strip(n.a), b = strip(n.b);
        if (a.k === 'num' && a.v === 1) return L(b, 2);
        if (b.k === '^' && strip(b.b).k === 'num' && strip(b.b).v === 0) return L(a, 2);
        const needDot = (b.k === 'num') || (a.k === 'num' && b.k === 'paren' && false);
        return `${L(n.a, 2)}${needDot ? ' \\times ' : ' '}${L(n.b, 2)}`;
      }
      case '/': return `\\dfrac{${L(n.a)}}{${L(n.b)}}`;
      case '^': {
        const e = strip(n.b);
        if (e.k === 'num' && e.v === 1) return L(n.a, 4);
        const base = strip(n.a);
        const bl = base.k === 'var' || base.k === 'num' || base.k === 'const' ? L(base) : `\\left(${L(base)}\\right)`;
        return `${bl}^{${L(e)}}`;
      }
      case 'fact': return L(n.a, 4) + '!';
      case 'fn': {
        const a = n.args.map((x) => L(x));
        switch (n.v) {
          case 'sqrt': return `\\sqrt{${a[0]}}`;
          case 'root': return `\\sqrt[${a[0]}]{${a[1]}}`;
          case 'abs': return `\\left|${a[0]}\\right|`;
          case 'ln': return `\\ln\\left(${a[0]}\\right)`;
          case 'log': return a.length === 2 ? `\\log_{${a[0]}}\\left(${a[1]}\\right)` : `\\lg\\left(${a[0]}\\right)`;
          case 'logb': return `\\log_{${a[0]}}\\left(${a[1]}\\right)`;
          case 'int': return `\\int_{${a[0]}}^{${a[1]}} ${a[2]}\\,dx`;
          case 'cosec': return `\\csc\\left(${a[0]}\\right)`;
          default: return `\\${n.v}\\left(${a[0]}\\right)`;
        }
      }
    }
    return '';
  };
  return L(tree).replace(/\+ -/g, '- ').replace(/- -/g, '+ ');
}
