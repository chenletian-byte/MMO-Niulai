// Structured WYSIWYG math input. No native text box: input comes from the in-app keyboard
// (or a physical keyboard on desktop). Renders with KaTeX, serialises to the grader syntax.
import { tex } from './render.js';

const KIDS = { frac: ['n', 'd'], sqrt: ['a'], root: ['i', 'a'], sup: ['a'], fn: ['a'], logb: ['b', 'a'], abs: ['a'], paren: ['a'], int: ['lo', 'hi', 'a'] };
const FN_TEX = { sin: '\\sin', cos: '\\cos', tan: '\\tan', ln: '\\ln', log: '\\lg', sec: '\\sec', cosec: '\\operatorname{cosec}', cot: '\\cot', asin: '\\sin^{-1}', acos: '\\cos^{-1}', atan: '\\tan^{-1}' };
const CHAR_TEX = {
  '+': '\\,+\\,', '-': '\\,-\\,', '−': '\\,-\\,', '*': '\\times', '×': '\\,\\times\\,', '÷': '\\,\\div\\,', '=': '\\;=\\;', '<': '\\;<\\;', '>': '\\;>\\;', '≤': '\\;\\le\\;', '≥': '\\;\\ge\\;',
  'π': '\\pi', 'θ': '\\theta', 'α': '\\alpha', 'β': '\\beta', '°': '^{\\circ}', ',': ',\\,', '∞': '\\infty', '±': '\\pm', '!': '!', '.': '.',
};
export const SYM_TEX = { '∠': '\\angle ', '△': '\\triangle ', '∥': '\\;\\parallel\\;', '⊥': '\\;\\perp\\;', '≅': '\\;\\cong\\;', '∼': '\\;\\sim\\;', 'ddx': '\\frac{d}{dx}', 'dydx': '\\frac{dy}{dx}' };
const SER = { '×': '*', '÷': '/', '−': '-', 'π': '@pi' };

let RID = 0;

export class MathField {
  constructor({ kb = 'num', placeholder = 'Tap to answer', inline = false, onChange, onEnter, wide = false } = {}) {
    this.kb = kb;
    this.placeholder = placeholder;
    this.onChange = onChange;
    this.onEnter = onEnter;
    this.root = this._row();
    this.cur = { row: this.root, i: 0 };
    this.el = document.createElement('div');
    this.el.className = 'mf' + (inline ? ' inline' : '') + (wide ? ' wide' : '');
    this.el.tabIndex = 0;
    this.el.setAttribute('role', 'textbox');
    this.el.setAttribute('aria-label', 'math answer');
    this.el._mf = this;
    this.el.addEventListener('pointerdown', (e) => this._pointer(e));
    this.el.addEventListener('focus', () => this.focus());
    this.el.addEventListener('keydown', (e) => this._key(e));
    this.disabled = false;
    this.render();
  }
  _row() { const r = []; r._id = ++RID; return r; }
  isEmpty() { return this.root.length === 0; }

  focus() {
    if (this.disabled) return;
    if (window.__kb) window.__kb.attach(this);
    this.el.classList.add('focus');
    this.render();
  }
  blur() { this.el.classList.remove('focus'); this.render(); }
  setDisabled(d) { this.disabled = d; if (d) this.blur(); }

  // ---------- tree helpers ----------
  _positions() {
    const out = [];
    const walk = (row) => {
      for (let i = 0; i <= row.length; i++) {
        out.push({ row, i });
        const n = row[i];
        if (n && KIDS[n.t]) for (const k of KIDS[n.t]) walk(n[k]);
      }
    };
    walk(this.root);
    return out;
  }
  _parent(row) {
    let found = null;
    const walk = (r) => {
      r.forEach((n, idx) => {
        if (found || !KIDS[n.t]) return;
        for (const k of KIDS[n.t]) {
          if (n[k] === row) { found = { node: n, key: k, prow: r, pidx: idx }; return; }
          walk(n[k]);
        }
      });
    };
    walk(this.root);
    return found;
  }
  _rowById(id) {
    let found = null;
    const walk = (r) => {
      if (r._id === id) found = r;
      for (const n of r) if (KIDS[n.t]) for (const k of KIDS[n.t]) walk(n[k]);
    };
    walk(this.root);
    return found;
  }
  _changed() { this.render(); if (this.onChange) this.onChange(this.value()); }

  // ---------- editing ----------
  insertChar(v, extra = {}) {
    this.cur.row.splice(this.cur.i, 0, { t: 'c', v, ...extra });
    this.cur.i++;
    this._changed();
  }
  insertSym(v) {
    this.cur.row.splice(this.cur.i, 0, { t: 'sym', v });
    this.cur.i++;
    this._changed();
  }
  insertStruct(t, opts = {}) {
    const n = { t, ...opts };
    for (const k of KIDS[t]) n[k] = this._row();
    if (opts.fill) for (const [k, arr] of Object.entries(opts.fill)) { n[k] = this._row(); n[k].push(...arr); }
    delete n.fill;
    const { row, i } = this.cur;
    if (t === 'frac' && opts.takePrev) {
      delete n.takePrev;
      let j = i;
      while (j > 0 && row[j - 1].t === 'c' && /[0-9a-zA-Z.θπ]/.test(row[j - 1].v)) j--;
      if (j === i && i > 0 && row[i - 1].t !== 'c' && row[i - 1].t !== 'sym') {
        j = i - 1;
        if (row[j].t === 'sup' && j > 0) j--;
      }
      if (j < i) {
        const taken = row.splice(j, i - j);
        n.n.push(...taken);
        row.splice(j, 0, n);
        this.cur = { row: n.d, i: 0 };
        this._changed();
        return;
      }
    }
    row.splice(i, 0, n);
    const firstEmpty = KIDS[t].find((k) => n[k].length === 0);
    if (opts.after) this.cur = { row, i: i + 1 };
    else this.cur = firstEmpty ? { row: n[firstEmpty], i: 0 } : { row, i: i + 1 };
    this._changed();
  }
  move(d) {
    const ps = this._positions();
    const idx = ps.findIndex((p) => p.row === this.cur.row && p.i === this.cur.i);
    const nx = ps[Math.max(0, Math.min(ps.length - 1, idx + d))];
    if (nx) this.cur = { row: nx.row, i: nx.i };
    this.render();
  }
  vertical(d) {
    const p = this._parent(this.cur.row);
    if (!p) return;
    const keys = KIDS[p.node.t];
    if (p.node.t === 'frac' || p.node.t === 'int') {
      const order = p.node.t === 'frac' ? ['n', 'd'] : ['hi', 'lo'];
      const ix = order.indexOf(p.key);
      const ni = ix + d;
      if (ix >= 0 && ni >= 0 && ni < order.length) {
        const row = p.node[order[ni]];
        this.cur = { row, i: Math.min(this.cur.i, row.length) };
        this.render();
        return;
      }
    }
    void keys;
  }
  exitParen() {
    let p = this._parent(this.cur.row);
    while (p && !['paren', 'fn', 'abs', 'sqrt', 'logb'].includes(p.node.t)) p = this._parent(p.prow);
    if (p) { this.cur = { row: p.prow, i: p.pidx + 1 }; this.render(); }
    else this.insertChar(')');
  }
  backspace() {
    const { row, i } = this.cur;
    if (i > 0) {
      const n = row[i - 1];
      if (!KIDS[n.t] || KIDS[n.t].every((k) => n[k].length === 0)) {
        row.splice(i - 1, 1);
        this.cur.i--;
      } else {
        const last = KIDS[n.t][KIDS[n.t].length - 1];
        this.cur = { row: n[last], i: n[last].length };
      }
      this._changed();
      return;
    }
    const p = this._parent(row);
    if (!p) return;
    const kids = KIDS[p.node.t];
    if (kids.every((k) => p.node[k].length === 0)) {
      p.prow.splice(p.pidx, 1);
      this.cur = { row: p.prow, i: p.pidx };
    } else {
      const ki = kids.indexOf(p.key);
      if (ki > 0) { const prev = p.node[kids[ki - 1]]; this.cur = { row: prev, i: prev.length }; }
      else if (kids.length === 1) {
        // unwrap single-child structure: keep its contents
        const contents = p.node[kids[0]];
        p.prow.splice(p.pidx, 1, ...contents);
        this.cur = { row: p.prow, i: p.pidx };
      } else this.cur = { row: p.prow, i: p.pidx };
    }
    this._changed();
  }
  clear() { this.root.length = 0; this.cur = { row: this.root, i: 0 }; this._changed(); }

  // keyboard command dispatcher
  cmd(a) {
    if (this.disabled) return;
    const [op, arg] = a.split(':');
    switch (op) {
      case 'c': return this.insertChar(arg === 'COLON' ? ':' : arg);
      case 'e': return this.insertChar('e', { k: true });
      case 'sym': return this.insertSym(arg);
      case 'frac': return this.insertStruct('frac');
      case 'sqrt': return this.insertStruct('sqrt');
      case 'root': return this.insertStruct('root');
      case 'sup': return this.insertStruct('sup');
      case 'sq': return this.insertStruct('sup', { fill: { a: [{ t: 'c', v: '2' }] }, after: true });
      case 'inv': return this.insertStruct('sup', { fill: { a: [{ t: 'c', v: '-' }, { t: 'c', v: '1' }] }, after: true });
      case 'exp': this.insertChar('e', { k: true }); return this.insertStruct('sup');
      case 'paren': return this.insertStruct('paren');
      case 'close': return this.exitParen();
      case 'abs': return this.insertStruct('abs');
      case 'fn': return this.insertStruct('fn', { name: arg });
      case 'logb': return this.insertStruct('logb');
      case 'int': return this.insertStruct('int');
      case 'left': return this.move(-1);
      case 'right': return this.move(1);
      case 'up': return this.vertical(-1);
      case 'down': return this.vertical(1);
      case 'bksp': return this.backspace();
      case 'clear': return this.clear();
      case 'enter': return this.onEnter && this.onEnter();
    }
  }

  _key(e) {
    if (this.disabled) return;
    const k = e.key;
    if (e.metaKey || e.ctrlKey) return;
    let handled = true;
    if (/^[0-9.]$/.test(k)) this.insertChar(k);
    else if (/^[a-zA-Z]$/.test(k)) this.insertChar(k);
    else if (k === '+' || k === '-' || k === '=' || k === ',' || k === '<' || k === '>' || k === '!') this.insertChar(k === '-' ? '−' : k);
    else if (k === '*') this.insertChar('×');
    else if (k === '/') this.insertStruct('frac', { takePrev: true });
    else if (k === '^') this.insertStruct('sup');
    else if (k === '(') this.insertStruct('paren');
    else if (k === ')') this.exitParen();
    else if (k === '|') this.insertStruct('abs');
    else if (k === 'Backspace') this.backspace();
    else if (k === 'ArrowLeft') this.move(-1);
    else if (k === 'ArrowRight') this.move(1);
    else if (k === 'ArrowUp') this.vertical(-1);
    else if (k === 'ArrowDown') this.vertical(1);
    else if (k === 'Enter') { if (this.onEnter) this.onEnter(); }
    else handled = false;
    if (handled) e.preventDefault();
  }

  _pointer(e) {
    if (this.disabled) return;
    e.preventDefault();
    const t = e.target.closest('[data-p]');
    if (t && this.el.contains(t)) {
      const [rid, pos] = t.dataset.p.split('.');
      const row = this._rowById(Number(rid));
      if (row) {
        if (pos === 'e') this.cur = { row, i: 0 };
        else {
          const r = t.getBoundingClientRect();
          const i = Number(pos);
          this.cur = { row, i: e.clientX > r.left + r.width / 2 ? i + 1 : i };
        }
      }
    } else this.cur = { row: this.root, i: this.root.length };
    this.el.focus({ preventScroll: true });
    this.focus();
  }

  // ---------- output ----------
  _ser(row) {
    return row.map((n) => {
      switch (n.t) {
        case 'c': return n.k ? '@e' : SER[n.v] ?? n.v;
        case 'sym': return n.v;
        case 'frac': return `((${this._ser(n.n)})/(${this._ser(n.d)}))`;
        case 'sqrt': return `@sqrt(${this._ser(n.a)})`;
        case 'root': return `@root(${this._ser(n.i)},${this._ser(n.a)})`;
        case 'sup': return `^(${this._ser(n.a)})`;
        case 'fn': return `@${n.name}(${this._ser(n.a)})`;
        case 'logb': return `@logb(${this._ser(n.b)},${this._ser(n.a)})`;
        case 'abs': return `@abs(${this._ser(n.a)})`;
        case 'paren': return `(${this._ser(n.a)})`;
        case 'int': return `@int(${this._ser(n.lo)},${this._ser(n.hi)},${this._ser(n.a)})`;
      }
      return '';
    }).join('');
  }
  value() { return this._ser(this.root); }
  // plain unicode text (used for geometry statements)
  text() {
    const t = (row) => row.map((n) => (n.t === 'c' ? (n.k ? 'e' : n.v) : n.t === 'sym' ? n.v : KIDS[n.t] ? KIDS[n.t].map((k) => t(n[k])).join('') : '')).join('');
    return t(this.root);
  }

  _tex(row, caret) {
    const CARET = '\\htmlClass{mf-caret}{\\vphantom{X}}';
    if (!row.length) {
      if (caret && this.cur.row === row) return CARET + '\\htmlData{p=' + row._id + '.e}{\\phantom{0}}';
      return `\\htmlData{p=${row._id}.e}{\\htmlClass{mf-ph}{\\square}}`;
    }
    let s = '';
    row.forEach((n, i) => {
      if (caret && this.cur.row === row && this.cur.i === i) s += CARET;
      s += `\\htmlData{p=${row._id}.${i}}{${this._ntex(n, caret)}}`;
    });
    if (caret && this.cur.row === row && this.cur.i === row.length) s += CARET;
    return s;
  }
  _ntex(n, c) {
    const T = (r) => this._tex(r, c);
    switch (n.t) {
      case 'c': return n.k ? '\\mathrm{e}' : CHAR_TEX[n.v] ?? n.v;
      case 'sym': return SYM_TEX[n.v] ?? n.v;
      case 'frac': return `\\dfrac{${T(n.n)}}{${T(n.d)}}`;
      case 'sqrt': return `\\sqrt{${T(n.a)}}`;
      case 'root': return `\\sqrt[${T(n.i)}]{${T(n.a)}}`;
      case 'sup': return `{}^{${T(n.a)}}`;
      case 'fn': return `${FN_TEX[n.name] || '\\operatorname{' + n.name + '}'}\\left(${T(n.a)}\\right)`;
      case 'logb': return `\\log_{${T(n.b)}}\\left(${T(n.a)}\\right)`;
      case 'abs': return `\\left|${T(n.a)}\\right|`;
      case 'paren': return `\\left(${T(n.a)}\\right)`;
      case 'int': return `\\displaystyle\\int_{${T(n.lo)}}^{${T(n.hi)}} ${T(n.a)}\\,dx`;
    }
    return '';
  }
  latex() { return this._tex(this.root, false).replace(/\\htmlData\{[^}]*\}/g, ''); }
  render() {
    const focused = this.el.classList.contains('focus');
    if (!this.root.length && !focused) {
      this.el.innerHTML = `<span class="mf-empty">${this.placeholder}</span>`;
      return;
    }
    this.el.innerHTML = tex(this._tex(this.root, focused));
    const caret = this.el.querySelector('.mf-caret');
    if (caret && caret.scrollIntoView) {
      const r = caret.getBoundingClientRect(), b = this.el.getBoundingClientRect();
      if (r.right > b.right - 8) this.el.scrollLeft += r.right - b.right + 24;
      if (r.left < b.left + 8) this.el.scrollLeft -= b.left - r.left + 24;
    }
  }
}

// Plain readonly latex of a stored grader-syntax string is shown server-side; nothing needed here.
