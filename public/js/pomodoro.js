// Focus timer: after N minutes of practice (default 40) it offers a break. Never during a mock paper.
import { h } from './dom.js';
import { state } from './state.js';
import { modal } from './fx.js';

const FOCUS_VIEWS = new Set(['learn', 'vault', 'syllabus']);
const store = {
  get() { try { return JSON.parse(sessionStorage.getItem('mmo.focus') || '{"s":0}'); } catch { return { s: 0 }; } },
  set(v) { try { sessionStorage.setItem('mmo.focus', JSON.stringify(v)); } catch {} },
};

export const Pomodoro = {
  view: null,
  data: store.get(),
  open: false,
  init() {
    setInterval(() => this.tick(), 1000);
  },
  setView(v) { this.view = v; },
  limit() { return (state.me?.settings?.pomodoro || 40) * 60 + (this.data.snooze || 0); },
  tick() {
    if (!state.me || this.open) return;
    if (!FOCUS_VIEWS.has(this.view) || document.visibilityState !== 'visible') return;
    if (document.querySelector('.mock-bar')) return; // in a mock paper
    const today = new Date().toDateString();
    try { if (localStorage.getItem('mmo.noBreak') === today) return; } catch {}
    this.data.s = (this.data.s || 0) + 1;
    store.set(this.data);
    if (this.data.s >= this.limit()) this.prompt();
  },
  remainingMin() { return Math.max(0, Math.round((this.limit() - (this.data.s || 0)) / 60)); },
  reset() { this.data = { s: 0 }; store.set(this.data); },
  prompt() {
    this.open = true;
    const mins = Math.round((this.data.s || 0) / 60);
    const content = h('div', { class: 'bulletin' },
      h('div', { class: 'kicker' }, 'Focus session'),
      h('h2', {}, `${mins} minutes of focused work`),
      h('p', {}, 'A short break now usually means fewer careless slips later. The lounge has a few low-effort things to do — no maths involved.'),
      h('div', { class: 'row wrap', style: { marginTop: '16px' } },
        h('button', { class: 'btn primary', onclick: () => { m.close(); this.reset(); location.hash = '#/lounge'; } }, 'Take a 5-minute break'),
        h('button', { class: 'btn', onclick: () => { this.data.snooze = (this.data.snooze || 0) + 15 * 60; store.set(this.data); m.close(); } }, 'Keep going (15 min)'),
        h('button', { class: 'btn ghost small', onclick: () => { try { localStorage.setItem('mmo.noBreak', new Date().toDateString()); } catch {} m.close(); } }, 'Not today'),
      ),
    );
    const m = modal(content, { dismiss: false, onClose: () => { this.open = false; } });
  },
};
