import { h } from '../dom.js';
import { modal } from '../fx.js';
import { api } from '../api.js';
import { pct } from '../dom.js';

// Coach note shown in the centre of the screen on the next visit after a 3-hourly review.
export function showBulletin(r) {
  if (!r) return;
  const when = new Date(r.created_at).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  const st = r.stats || {};
  const content = h('div', { class: 'bulletin' },
    h('div', { class: 'kicker' }, 'Coach’s note · ' + when),
    h('h2', {}, r.title || 'Progress note'),
    ...(r.lines || []).map((l) => h('p', {}, l)),
    h('div', { class: 'stats3', style: { margin: '14px 0' } },
      h('div', { class: 'stat' }, h('b', {}, String(st.attempts ?? 0)), h('span', {}, 'questions')),
      h('div', { class: 'stat' }, h('b', {}, pct(st.acc)), h('span', {}, 'repeat accuracy')),
      h('div', { class: 'stat' }, h('b', {}, st.avgSec != null ? st.avgSec + 's' : '—'), h('span', {}, 'avg per question')),
    ),
    h('div', { class: 'row spread' }, h('span', { class: 'tiny muted' }, 'Written every 3 hours from your activity log'), h('button', { class: 'btn primary', onclick: () => m.close() }, 'Got it')),
  );
  const m = modal(content, { onClose: () => api(`/reviews/${r.id}/read`, { body: {} }).catch(() => {}) });
}
