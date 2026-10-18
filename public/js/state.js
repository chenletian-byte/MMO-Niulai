import { api } from './api.js';

export const state = { me: null, meta: null, view: null };

export function applyPrefs(s = {}) {
  const root = document.documentElement;
  if (s.theme && s.theme !== 'system') root.dataset.theme = s.theme; else delete root.dataset.theme;
  if (s.font && s.font !== 'serif') root.dataset.font = s.font; else delete root.dataset.font;
  if (s.motion === false) root.dataset.motion = 'off'; else delete root.dataset.motion;
  try { localStorage.setItem('mmo.prefs', JSON.stringify({ theme: s.theme, font: s.font })); } catch {}
  if (window.__kb) window.__kb.setTextEnabled(s.internalKb !== false);
}

export async function refreshMe() {
  state.me = await api('/me');
  applyPrefs(state.me.settings);
  return state.me;
}
export const SUBJ = { emath: { name: 'E Math', long: 'Mathematics 4052', color: 'var(--teal)' }, amath: { name: 'A Math', long: 'Additional Mathematics 4049', color: 'var(--violet)' } };
