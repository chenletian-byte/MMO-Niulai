// In-app keyboard. Drives MathField instances (math layouts) and ordinary inputs (text layouts).
import { tex } from './render.js';

const I = {
  bksp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 5H9l-6 7 6 7h12z"/><path d="M17 9l-5 6M12 9l5 6"/></svg>',
  left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 6l-6 6 6 6"/></svg>',
  right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>',
  enter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 5v6a3 3 0 0 1-3 3H5"/><path d="M9 10l-4 4 4 4"/></svg>',
  shift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 4l8 8h-4v7H8v-7H4z"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>',
};

// key spec: [label, action, opts]; label beginning with '$' is LaTeX, '#' is an icon
const k = (l, a, o = {}) => ({ l, a, ...o });
const ctl = (extra = []) => [k('#left', 'left', { c: 'fn' }), k('#right', 'right', { c: 'fn' }), ...extra, k('#bksp', 'bksp', { c: 'fn', w: 2 }), k('#enter', 'enter', { c: 'accent' })];

const MATH = {
  '123': [
    [k('7', 'c:7'), k('8', 'c:8'), k('9', 'c:9'), k('$\\div', 'c:÷', { c: 'fn' }), k('$\\frac{\\square}{\\square}', 'frac', { c: 'fn' }), k('$\\sqrt{\\square}', 'sqrt', { c: 'fn' }), k('$\\square^2', 'sq', { c: 'fn' }), k('$\\square^{n}', 'sup', { c: 'fn' })],
    [k('4', 'c:4'), k('5', 'c:5'), k('6', 'c:6'), k('$\\times', 'c:×', { c: 'fn' }), k('$(\\,)', 'paren', { c: 'fn' }), k('$\\sqrt[n]{\\square}', 'root', { c: 'fn' }), k('$\\pi', 'c:π', { c: 'fn' }), k('$\\circ', 'c:°', { c: 'fn' })],
    [k('1', 'c:1'), k('2', 'c:2'), k('3', 'c:3'), k('$-', 'c:−', { c: 'fn' }), k('$x', 'c:x'), k('$y', 'c:y'), k('$|\\square|', 'abs', { c: 'fn' }), k(',', 'c:,', { c: 'fn' })],
    [k('0', 'c:0'), k('.', 'c:.'), k('$=', 'c:=', { c: 'fn' }), k('$+', 'c:+', { c: 'fn' }), ...ctl()],
  ],
  fx: [
    [k('$\\sin', 'fn:sin', { c: 'fn' }), k('$\\cos', 'fn:cos', { c: 'fn' }), k('$\\tan', 'fn:tan', { c: 'fn' }), k('$\\theta', 'c:θ'), k('$\\ln', 'fn:ln', { c: 'fn' }), k('$\\lg', 'fn:log', { c: 'fn' }), k('$\\log_{n}', 'logb', { c: 'fn' }), k('$\\mathrm{e}^{\\square}', 'exp', { c: 'fn' })],
    [k('$\\sec', 'fn:sec', { c: 'fn' }), k('$\\text{cosec}', 'fn:cosec', { c: 'fn' }), k('$\\cot', 'fn:cot', { c: 'fn' }), k('$\\mathrm{e}', 'e'), k('$\\int_a^b', 'int', { c: 'fn' }), k('$\\tfrac{d}{dx}', 'sym:ddx', { c: 'fn' }), k('$\\tfrac{dy}{dx}', 'sym:dydx', { c: 'fn' }), k('$\\square^{-1}', 'inv', { c: 'fn' })],
    [k('$x', 'c:x'), k('$y', 'c:y'), k('$k', 'c:k'), k('$c', 'c:c'), k('$<', 'c:<', { c: 'fn' }), k('$>', 'c:>', { c: 'fn' }), k('$\\le', 'c:≤', { c: 'fn' }), k('$\\ge', 'c:≥', { c: 'fn' })],
    [k('$(', 'paren', { c: 'fn' }), k('$)', 'close', { c: 'fn' }), k('$\\square^{n}', 'sup', { c: 'fn' }), k('$\\frac{\\square}{\\square}', 'frac', { c: 'fn' }), ...ctl()],
  ],
  abc: [
    'qwertyuiop'.split('').map((c) => k('$' + c, 'c:' + c)),
    'asdfghjkl'.split('').map((c) => k('$' + c, 'c:' + c)),
    [...'zxcvbnm'.split('').map((c) => k('$' + c, 'c:' + c)), k('$\\alpha', 'c:α'), k('$\\beta', 'c:β')],
    [k('$+', 'c:+', { c: 'fn' }), k('$-', 'c:−', { c: 'fn' }), k('$=', 'c:=', { c: 'fn' }), ...ctl()],
  ],
  geo: [
    [k('$\\angle', 'sym:∠', { c: 'fn' }), k('$\\triangle', 'sym:△', { c: 'fn' }), k('$\\parallel', 'sym:∥', { c: 'fn' }), k('$\\perp', 'sym:⊥', { c: 'fn' }), k('$\\cong', 'sym:≅', { c: 'fn' }), k('$\\sim', 'sym:∼', { c: 'fn' }), k('$=', 'c:=', { c: 'fn' }), k('$\\circ', 'c:°', { c: 'fn' })],
    'ABCDEFGH'.split('').map((c) => k(c, 'c:' + c)),
    'JKLMNOPQ'.split('').map((c) => k(c, 'c:' + c)),
    'RSTUVWXY'.split('').map((c) => k(c, 'c:' + c)),
    [k('Z', 'c:Z'), k('$+', 'c:+', { c: 'fn' }), k('1', 'c:1'), k('2', 'c:2'), ...ctl()],
  ],
};

const TEXT = {
  abc: (shift) => [
    'qwertyuiop'.split('').map((c) => k(shift ? c.toUpperCase() : c, 't:' + (shift ? c.toUpperCase() : c))),
    'asdfghjkl'.split('').map((c) => k(shift ? c.toUpperCase() : c, 't:' + (shift ? c.toUpperCase() : c))),
    [k('#shift', 'shift', { c: shift ? 'accent' : 'fn' }), ...'zxcvbnm'.split('').map((c) => k(shift ? c.toUpperCase() : c, 't:' + (shift ? c.toUpperCase() : c))), k('#bksp', 'tbksp', { c: 'fn' })],
    [k('123', 'tlayout:num', { c: 'fn small' }), k('∠ △', 'tlayout:sym', { c: 'fn small' }), k('space', 't: ', { w: 4, c: 'small' }), k('.', 't:.'), k('#enter', 'tenter', { c: 'accent', w: 2 })],
  ],
  num: () => [
    '1234567890'.split('').map((c) => k(c, 't:' + c)),
    ['-', '/', ':', ';', '(', ')', '_', '&', '@', '"'].map((c) => k(c, 't:' + c)),
    [k('.', 't:.'), k(',', 't:,'), k('?', 't:?'), k('!', 't:!'), k("'", "t:'"), k('#', 't:#'), k('+', 't:+'), k('=', 't:='), k('#bksp', 'tbksp', { c: 'fn', w: 2 })],
    [k('ABC', 'tlayout:abc', { c: 'fn small' }), k('∠ △', 'tlayout:sym', { c: 'fn small' }), k('space', 't: ', { w: 4, c: 'small' }), k('#enter', 'tenter', { c: 'accent', w: 2 })],
  ],
  sym: () => [
    ['∠', '△', '∥', '⊥', '≅', '∼', '°', '='].map((c) => k(c, 't:' + c)),
    ['²', '³', '√', 'π', 'θ', '≤', '≥', '≠'].map((c) => k(c, 't:' + c)),
    ['∴', '∵', '⇒', '±', '×', '÷', '<', '>'].map((c) => k(c, 't:' + c)),
    [k('ABC', 'tlayout:abc', { c: 'fn small' }), k('123', 'tlayout:num', { c: 'fn small' }), k('space', 't: ', { w: 3, c: 'small' }), k('#bksp', 'tbksp', { c: 'fn' }), k('#enter', 'tenter', { c: 'accent', w: 2 })],
  ],
};

const DEFAULT_TAB = { num: '123', alg: '123', calc: 'fx', trig: 'fx', geo: 'geo', abc: 'abc' };
const TABS = [['123', '123'], ['fx', 'f(x)'], ['abc', 'abc'], ['geo', '∠ △']];

export class Keyboard {
  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'kb';
    this.el.innerHTML = '<div class="kb-inner"><div class="kb-tabs"></div><div class="kb-rows"></div></div>';
    document.body.append(this.el);
    this.target = null; // MathField or input element
    this.mode = 'math';
    this.tab = '123';
    this.tlayout = 'abc';
    this.shift = false;
    this.cache = new Map();
    this.enabledForText = true;
    this.el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const key = e.target.closest('.key, .kb-tab');
      if (!key) return;
      key.classList.add('press');
      setTimeout(() => key.classList.remove('press'), 120);
      if (key.dataset.tab) { this.tab = key.dataset.tab; this.draw(); return; }
      if (key.dataset.hide) { this.hide(); return; }
      this.press(key.dataset.a);
      if (navigator.vibrate && this.haptics) navigator.vibrate(6);
    });
    // repeat backspace on long press
    let rep;
    this.el.addEventListener('pointerdown', (e) => {
      const key = e.target.closest('.key');
      if (!key || !/bksp/.test(key.dataset.a || '')) return;
      clearInterval(rep);
      const t0 = setTimeout(() => { rep = setInterval(() => this.press(key.dataset.a), 70); }, 420);
      const stop = () => { clearTimeout(t0); clearInterval(rep); window.removeEventListener('pointerup', stop); };
      window.addEventListener('pointerup', stop);
    });
    document.addEventListener('pointerdown', (e) => {
      if (!this.isOpen()) return;
      // composedPath survives the re-render a math field does on pointerdown
      const path = e.composedPath();
      if (path.includes(this.el)) return;
      if (path.some((n) => n.matches && n.matches('.mf, .kb-input, .slot, .rchip, .kb-keep'))) return;
      this.hide();
    });
    document.addEventListener('focusin', (e) => {
      const t = e.target;
      if (t && t.matches && t.matches('input.kb-input, textarea.kb-input')) this.attachInput(t);
    });
    window.__kb = this;
  }
  isOpen() { return this.el.classList.contains('open'); }
  setTextEnabled(on) {
    this.enabledForText = on;
    document.querySelectorAll('input.kb-input').forEach((i) => i.setAttribute('inputmode', on ? 'none' : i.dataset.im || 'text'));
  }
  attach(mf) {
    if (this.target && this.target !== mf && this.target._mf !== undefined) {}
    if (this.target && this.target !== mf) this._blurTarget();
    this.target = mf;
    this.mode = 'math';
    const want = DEFAULT_TAB[mf.kb] || '123';
    if (this._lastKb !== mf.kb) this.tab = want;
    this._lastKb = mf.kb;
    this.draw();
    this.show();
  }
  attachInput(input) {
    if (!this.enabledForText) return;
    if (this.target && this.target !== input) this._blurTarget();
    this.target = input;
    this.mode = 'text';
    input.classList.add('kb-target');
    this.tlayout = input.dataset.kbl || 'abc';
    this.shift = false;
    this.draw();
    this.show();
  }
  _blurTarget() {
    const t = this.target;
    if (!t) return;
    if (t.blur && t.el) t.blur();
    else if (t.classList) t.classList.remove('kb-target');
  }
  show() {
    this.el.classList.add('open');
    document.body.classList.add('kb-open');
    requestAnimationFrame(() => {
      const hgt = this.el.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--kb-h', hgt + 'px');
      const node = this.target && (this.target.el || this.target);
      if (node && node.getBoundingClientRect) {
        const r = node.getBoundingClientRect();
        const limit = window.innerHeight - hgt - 16;
        if (r.bottom > limit) window.scrollBy({ top: r.bottom - limit + 20, behavior: 'smooth' });
      }
    });
  }
  hide() {
    this.el.classList.remove('open');
    document.body.classList.remove('kb-open');
    document.documentElement.style.setProperty('--kb-h', '0px');
    this._blurTarget();
    this.target = null;
  }
  _label(l) {
    if (l.startsWith('#')) return I[l.slice(1)] || '';
    if (l.startsWith('$')) {
      if (!this.cache.has(l)) this.cache.set(l, tex(l.slice(1)));
      return this.cache.get(l);
    }
    return l.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  }
  draw() {
    const tabs = this.el.querySelector('.kb-tabs');
    const rowsEl = this.el.querySelector('.kb-rows');
    let rows;
    if (this.mode === 'math') {
      tabs.innerHTML = TABS.map(([id, name]) => `<button class="kb-tab ${this.tab === id ? 'on' : ''}" data-tab="${id}">${name}</button>`).join('') + `<button class="kb-tab kb-hide" data-hide="1" aria-label="hide keyboard">${I.down}</button>`;
      rows = MATH[this.tab];
    } else {
      tabs.innerHTML = `<span class="tiny muted" style="padding:0 6px">Keyboard</span><button class="kb-tab kb-hide" data-hide="1" aria-label="hide keyboard">${I.down}</button>`;
      rows = TEXT[this.tlayout](this.shift);
    }
    rowsEl.innerHTML = rows.map((r) => {
      const cols = r.reduce((s, x) => s + (x.w || 1), 0);
      return `<div class="kb-row" style="grid-template-columns:repeat(${cols},1fr)">${r.map((x) => `<button class="key ${x.c || ''} ${x.w ? 'wide' + x.w : ''}" data-a="${x.a.replace(/"/g, '&quot;')}">${this._label(x.l)}</button>`).join('')}</div>`;
    }).join('');
  }
  press(a) {
    const t = this.target;
    if (!t || !a) return;
    if (this.mode === 'math') { t.cmd(a); return; }
    // text input
    if (a === 'shift') { this.shift = !this.shift; this.draw(); return; }
    if (a.startsWith('tlayout:')) { this.tlayout = a.slice(8); this.draw(); return; }
    if (a === 'tenter') {
      const form = t.form;
      const ev = new CustomEvent('kb-enter', { bubbles: true, cancelable: true });
      const proceed = t.dispatchEvent(ev);
      if (proceed && form && form.requestSubmit) form.requestSubmit();
      else if (proceed && !form) this.hide();
      return;
    }
    const s = t.selectionStart ?? t.value.length, e = t.selectionEnd ?? t.value.length;
    if (a === 'tbksp') {
      if (s === e && s > 0) { t.value = t.value.slice(0, s - 1) + t.value.slice(e); t.setSelectionRange(s - 1, s - 1); }
      else if (s !== e) { t.value = t.value.slice(0, s) + t.value.slice(e); t.setSelectionRange(s, s); }
    } else if (a.startsWith('t:')) {
      const ch = a.slice(2);
      if (t.maxLength > 0 && t.value.length >= t.maxLength) return;
      t.value = t.value.slice(0, s) + ch + t.value.slice(e);
      t.setSelectionRange(s + ch.length, s + ch.length);
      if (this.shift) { this.shift = false; this.draw(); }
    }
    t.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

// Make an <input> use the in-app keyboard.
export function kbInput(attrs = {}) {
  const i = document.createElement('input');
  i.className = 'input kb-input';
  for (const [a, v] of Object.entries(attrs)) if (v != null) i.setAttribute(a, v);
  i.dataset.im = attrs.inputmode || 'text';
  if (!window.__kb || window.__kb.enabledForText) i.setAttribute('inputmode', 'none');
  i.autocomplete = attrs.autocomplete || 'off';
  i.setAttribute('autocapitalize', 'off');
  i.spellcheck = false;
  return i;
}
