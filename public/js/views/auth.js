import { h } from '../dom.js';
import { api } from '../api.js';
import { kbInput } from '../keyboard.js';
import { BRAND } from '../art.js';
import { tex } from '../render.js';

export function authView(root) {
  root.innerHTML = '';
  let mode = 'login';
  const user = kbInput({ placeholder: 'username', maxlength: 20, autocomplete: 'username' });
  const pass = kbInput({ placeholder: 'password', type: 'password', maxlength: 100, autocomplete: 'current-password' });
  const err = h('div', { class: 'fb-msg', style: { minHeight: '18px' } });
  const btn = h('button', { class: 'btn primary block', type: 'submit' }, 'Sign in');
  const seg = h('div', { class: 'seg', style: { marginBottom: '16px' } });
  const setMode = (m) => {
    mode = m;
    seg.innerHTML = '';
    for (const [id, l] of [['login', 'Sign in'], ['register', 'Create account']]) seg.append(h('button', { type: 'button', class: id === mode ? 'on' : '', onclick: () => setMode(id) }, l));
    btn.textContent = mode === 'login' ? 'Sign in' : 'Create account';
    pass.setAttribute('autocomplete', mode === 'login' ? 'current-password' : 'new-password');
    err.textContent = '';
  };
  setMode('login');
  const form = h('form', { class: 'stack', onsubmit: async (e) => {
    e.preventDefault();
    err.textContent = '';
    btn.disabled = true;
    try {
      await api('/auth/' + mode, { body: { username: user.value.trim(), password: pass.value } });
      if (window.__kb) window.__kb.hide();
      await window.__app.signedIn();
    } catch (x) { err.textContent = x.message; }
    btn.disabled = false;
  } },
    h('label', { class: 'field' }, h('label', {}, 'Username'), user),
    h('label', { class: 'field' }, h('label', {}, 'Password'), pass),
    err, btn,
  );
  user.addEventListener('kb-enter', (e) => { e.preventDefault(); pass.focus(); });
  const formulas = ['\\frac{d}{dx}\\sin x = \\cos x', 'b^2 - 4ac < 0', '\\angle ACB = 90^\\circ', '\\sin^2\\theta + \\cos^2\\theta = 1', '\\int_0^1 x^2\\,dx = \\tfrac13', '\\log_a xy = \\log_a x + \\log_a y'];
  const art = h('div', { class: 'auth-art', style: { position: 'relative', overflow: 'hidden', borderRadius: '16px', background: 'var(--grad-soft)' } },
    ...formulas.map((f, i) => h('div', { style: { position: 'absolute', left: (8 + (i % 2) * 46) + '%', top: (10 + Math.floor(i / 2) * 30) + '%', opacity: 0.7 - (i % 3) * 0.15, fontSize: '15px', color: 'var(--ink-2)' }, html: tex(f) })));
  const card = h('div', { class: 'card auth-card fade-in' },
    art,
    h('div', { class: 'row', style: { margin: '6px 0 4px' }, html: BRAND + '<div><div class="brand-name">MMO Maths</div><div class="brand-sub">O-Level E Math · A Math</div></div>' }),
    h('p', { class: 'muted small', style: { margin: '6px 0 16px' } }, 'Practice that tracks you: every question type you meet, every mistake you make, every proof step you justify.'),
    seg, form,
  );
  root.append(h('div', { class: 'auth-wrap' }, card));
  return { destroy() {} };
}
