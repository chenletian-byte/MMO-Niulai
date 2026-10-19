import { h, pct } from '../dom.js';
import { api } from '../api.js';
import { state, SUBJ } from '../state.js';
import { bars } from './home.js';

export function syllabusView(root, args) {
  const subject = SUBJ[args[0]] ? args[0] : 'emath';
  const S = state.meta.syllabus[subject];
  const seg = h('div', { class: 'seg' }, ...['emath', 'amath'].map((s) => h('button', { class: s === subject ? 'on' : '', onclick: () => (location.hash = '#/syllabus/' + s) }, SUBJ[s].name)));
  const list = h('div', { class: 'stack' }, h('div', { class: 'loader' }));
  root.append(h('div', { class: 'stack' },
    h('div', { class: 'page-head' }, h('div', {}, h('div', { class: 'kicker' }, `Syllabus ${S.code} · ${S.year || 2026}`), h('h1', {}, SUBJ[subject].long), h('div', { class: 'small muted' }, 'Coverage and repeat accuracy for every topic in the 2026 syllabus. Tap a topic to see its content or practise only that topic.')), seg),
    h('div', { class: 'card tight' }, bars(state.me.subjects[subject])),
    list));
  api('/progress?subject=' + subject).then((d) => {
    list.innerHTML = '';
    for (const [strand, codes] of S.strands) {
      const card = h('div', { class: 'card', style: { padding: '6px 14px' } }, h('div', { class: 'caps', style: { padding: '12px 6px 4px' } }, strand));
      for (const code of codes) {
        const t = d.topics[code];
        if (!t) continue;
        const pts = (S.points && S.points[code]) || [];
        const detail = h('div', { class: 'topic-detail hidden' },
          h('ul', {}, ...pts.map((x) => h('li', {}, x))),
          h('a', { class: 'btn small primary', href: `#/learn/${subject}?topic=${code}` }, 'Practise this topic'));
        const row = h('div', { class: 'topic-row', role: 'button', tabindex: '0' },
          h('div', {}, h('div', { style: { fontWeight: 600 } }, t.name), h('div', { class: 'tiny muted' }, `${t.seen}/${t.total} question types · ${t.questions} attempts · accuracy ${t.counted ? pct(t.correct / t.counted) : '—'}`)),
          h('div', { class: 't-bars' }, h('div', { class: 'bar thin expo' }, h('i', { style: { width: (t.total ? (t.seen / t.total) * 100 : 0) + '%' } })), h('div', { class: 'bar thin acc', style: { marginTop: '5px' } }, h('i', { style: { width: (t.counted ? (t.correct / t.counted) * 100 : 0) + '%' } }))));
        row.addEventListener('click', () => detail.classList.toggle('hidden'));
        card.append(row, detail);
      }
      list.append(card);
    }
  });
}
