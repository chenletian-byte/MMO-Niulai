import { api } from './api.js';
import { h } from './dom.js';
import { state, refreshMe, applyPrefs } from './state.js';
import { Keyboard } from './keyboard.js';
import { ICON, BRAND } from './art.js';
import { Pomodoro } from './pomodoro.js';
import { authView } from './views/auth.js';
import { homeView } from './views/home.js';
import { learnView } from './views/learn.js';
import { vaultView } from './views/vault.js';
import { ranksView } from './views/ranks.js';
import { meView } from './views/me.js';
import { mockView } from './views/mock.js';
import { syllabusView } from './views/syllabus.js';
import { loungeView } from './views/lounge.js';
import { showBulletin } from './views/bulletin.js';

const NAV = [
  { id: 'home', label: 'Home', icon: 'home', href: '#/' },
  { id: 'learn', label: 'Learn', icon: 'learn', href: '#/learn' },
  { id: 'mock', label: 'Mock', icon: 'mock', href: '#/mock' },
  { id: 'vault', label: 'Vault', icon: 'vault', href: '#/vault', locked: () => !state.me?.vaultUnlocked },
  { id: 'ranks', label: 'Ranks', icon: 'ranks', href: '#/ranks' },
  { id: 'me', label: 'Me', icon: 'me', href: '#/me' },
];

let shell, main, current;

function navItems(cls) {
  return NAV.map((n) => h('a', { class: 'nav-item ' + cls, href: n.href, 'data-nav': n.id, html: ICON[n.icon] + `<span>${n.label}</span>` + (n.locked && n.locked() ? `<span class="lock">${ICON.lock}</span>` : '') }));
}

function buildShell() {
  document.getElementById('app').innerHTML = '';
  const side = h('aside', { class: 'side' },
    h('a', { class: 'brand', href: '#/', html: BRAND + '<div><div class="brand-name">MMO Maths</div><div class="brand-sub">O-Level studio</div></div>' }),
    navItems(''),
    h('a', { class: 'nav-item', href: '#/syllabus/emath', 'data-nav': 'syllabus', html: ICON.syllabus + '<span>Syllabus map</span>' }),
    h('a', { class: 'nav-item', href: '#/lounge', 'data-nav': 'lounge', html: ICON.lounge + '<span>Break lounge</span>' }),
    h('div', { class: 'side-foot small muted' }, 'Syllabus 4052 · 4049'),
  );
  main = h('main', { class: 'main' });
  const tabbar = h('nav', { class: 'tabbar' }, navItems(''));
  shell = h('div', { class: 'shell' }, side, main, tabbar);
  document.getElementById('app').append(shell);
}

export function refreshNav() {
  if (!shell) return;
  shell.querySelectorAll('[data-nav]').forEach((a) => {
    const n = NAV.find((x) => x.id === a.dataset.nav);
    if (n && n.locked) {
      const lk = a.querySelector('.lock');
      if (!n.locked() && lk) lk.remove();
    }
  });
}

async function route() {
  const hash = location.hash.replace(/^#/, '') || '/';
  const [path, qs] = hash.split('?');
  const parts = path.split('/').filter(Boolean);
  const params = new URLSearchParams(qs || '');
  if (!state.me) {
    if (current && current.destroy) current.destroy();
    current = authView(document.getElementById('app'));
    shell = null;
    return;
  }
  if (!shell) buildShell();
  if (window.__kb) window.__kb.hide();
  if (current && current.destroy) current.destroy();
  main.innerHTML = '';
  const name = parts[0] || 'home';
  shell.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('on', a.dataset.nav === name || (name === '' && a.dataset.nav === 'home')));
  state.view = name;
  Pomodoro.setView(name);
  window.scrollTo(0, 0);
  const views = { home: homeView, learn: learnView, vault: vaultView, ranks: ranksView, me: meView, mock: mockView, syllabus: syllabusView, lounge: loungeView };
  const v = views[name] || homeView;
  current = v(main, parts.slice(1), params) || null;
}

export function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }
export async function signedIn() {
  await refreshMe();
  buildShell();
  route();
  if (state.me.review) showBulletin(state.me.review);
}

async function boot() {
  new Keyboard();
  try { state.meta = await api('/meta'); } catch { state.meta = { reasons: {}, badges: {}, frames: {}, syllabus: {} }; }
  const waitKatex = () => new Promise((r) => { const t = () => (window.katex ? r() : setTimeout(t, 30)); t(); });
  await waitKatex();
  try {
    await refreshMe();
  } catch {
    state.me = null;
  }
  window.addEventListener('hashchange', route);
  if (state.me) {
    buildShell();
    applyPrefs(state.me.settings);
    Pomodoro.init();
    route();
    if (state.me.review) setTimeout(() => showBulletin(state.me.review), 400);
  } else route();
  // activity heartbeat (for the coach log) while the tab is visible
  setInterval(() => { if (state.me && document.visibilityState === 'visible') api('/ping', { body: { view: state.view } }).catch(() => {}); }, 60000);
}

window.__app = { go, signedIn, refreshNav };
boot();
