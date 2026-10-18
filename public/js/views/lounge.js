import { h, fmtTime } from '../dom.js';
import { api } from '../api.js';
import { snake } from '../games/snake.js';
import { blocks } from '../games/blocks.js';
import { bubbles } from '../games/bubbles.js';
import { breathe } from '../games/breathe.js';
import { Pomodoro } from '../pomodoro.js';
import { ICON } from '../art.js';

const GAMES = [
  { id: 'breathe', name: 'Box breathing', desc: 'Four slow cycles. The quickest reset for tired focus.', art: '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="20" fill="none" stroke="var(--sky)" stroke-width="2"/><circle cx="32" cy="32" r="12" fill="var(--violet)" opacity=".5"/></svg>' },
  { id: 'bubbles', name: 'Bubble wrap', desc: 'Pop. That is all.', art: '<svg viewBox="0 0 64 64">' + [0, 1, 2].flatMap((y) => [0, 1, 2].map((x) => `<circle cx="${14 + x * 18}" cy="${14 + y * 18}" r="7" fill="none" stroke="var(--teal)" stroke-width="2"/>`)).join('') + '</svg>' },
  { id: 'snake', name: 'Lazy snake', desc: 'Walls wrap and you can’t lose. Just wander.', art: '<svg viewBox="0 0 64 64"><path d="M10 44h16V20h14v24h14" fill="none" stroke="var(--violet)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="54" cy="20" r="4" fill="var(--teal)"/></svg>' },
  { id: 'blocks', name: 'Slow blocks', desc: 'Falling blocks at a calm pace. No speed-up.', art: '<svg viewBox="0 0 64 64"><rect x="12" y="34" width="12" height="12" rx="2" fill="var(--violet)"/><rect x="26" y="34" width="12" height="12" rx="2" fill="var(--sky)"/><rect x="26" y="20" width="12" height="12" rx="2" fill="var(--sky)"/><rect x="40" y="34" width="12" height="12" rx="2" fill="var(--teal)"/></svg>' },
];

export function loungeView(root) {
  let game = null, t;
  const start = Date.now();
  const clock = h('b', { class: 'countdown', style: { fontSize: '22px' } });
  t = setInterval(() => (clock.textContent = fmtTime(Date.now() - start)), 1000);
  clock.textContent = '0:00';
  const stage = h('div', {});
  const menu = h('div', { class: 'game-grid' }, ...GAMES.map((g) => h('div', { class: 'card game-tile', onclick: () => open(g) }, h('div', { class: 'art', html: g.art }), h('b', {}, g.name), h('div', { class: 'small muted' }, g.desc))));
  const tips = h('div', { class: 'card tight small muted' }, 'While you are here: stand up, drink some water, and let your eyes rest on something far away for a few seconds. Then come back.');
  function open(g) {
    if (game) game.stop();
    api('/ping', { body: { event: 'break', game: g.id } }).catch(() => {});
    menu.classList.add('hidden');
    stage.innerHTML = '';
    const status = h('div', { class: 'small muted', style: { textAlign: 'center', margin: '10px 0' } });
    const ui = (s) => (status.textContent = s);
    const back = h('button', { class: 'btn ghost small', html: ICON.back + ' All activities', onclick: () => { game && game.stop(); game = null; stage.innerHTML = ''; menu.classList.remove('hidden'); } });
    const wrap = h('div', { class: 'card game-stage' });
    stage.append(h('div', { class: 'stack' }, back, wrap));
    if (g.id === 'breathe') { const box = h('div', { style: { display: 'grid', placeItems: 'center', padding: '40px 0' } }); wrap.append(box, status); game = breathe(box, ui); return; }
    const cv = h('canvas');
    wrap.append(h('h3', {}, g.name), cv, status);
    if (g.id === 'snake') {
      game = snake(cv, ui);
      const b = (l, d) => h('button', { onclick: () => game.pad(d) }, l);
      wrap.append(h('div', { class: 'pad' }, h('span'), b('↑', [0, -1]), h('span'), b('←', [-1, 0]), b('↓', [0, 1]), b('→', [1, 0])));
    } else if (g.id === 'blocks') {
      game = blocks(cv, ui);
      const b = (l, a) => h('button', { onclick: () => game.act(a) }, l);
      wrap.append(h('div', { class: 'pad' }, b('⟲', 'rot'), b('⤓', 'drop'), b('↓', 'down'), b('←', 'left'), h('span'), b('→', 'right')));
    } else game = bubbles(cv, ui);
  }
  root.append(h('div', { class: 'stack' },
    h('div', { class: 'page-head' }, h('div', {}, h('div', { class: 'kicker' }, 'Break lounge'), h('h1', {}, 'Step away for five'), h('div', { class: 'small muted' }, 'Nothing here is graded, timed or counted.')), h('div', { style: { textAlign: 'right' } }, clock, h('div', { class: 'tiny muted' }, 'on break'))),
    menu, stage, tips,
    h('div', { class: 'row' }, h('a', { class: 'btn primary', href: '#/learn', onclick: () => Pomodoro.reset() }, 'Back to practice')),
  ));
  return { destroy() { clearInterval(t); if (game) game.stop(); } };
}
