import { h, pct } from '../dom.js';
import { api } from '../api.js';
import { state, SUBJ } from '../state.js';
import { bars } from './home.js';

export function syllabusView(root, args) {
  const subject = SUBJ[args[0]] ? args[0] : 'emath';
  const seg = h('div', { class: 'seg' }, ...['emath', 'amath'].map((s) => h('button', { class: s === subject ? 'on' : '', onclick: () => (location.hash = '#/syllabus/' + s) }, SUBJ[s].name)));
  const list = h('div', { class: 'card', style: { padding: '6px 14px' } }, h('div', { class: 'loader' }));
  root.append(h('div', { class: 'stack' },
    h('div', { class: 'page-head' }, h('div', {}, h('div', { class: 'kicker' }, 'Syllabus map · ' + state.meta.syllabus[subject].code), h('h1', {}, SUBJ[subject].long), h('div', { class: 'small muted' }, 'Coverage and repeat accuracy for every strand of the official syllabus. Tap a topic to practise only that.')), seg),
    h('div', { class: 'card tight' }, bars(state.me.subjects[subject])),
    list));
  api('/progress?subject=' + subject).then((d) => {
    list.innerHTML = '';
    for (const [code, t] of Object.entries(d.topics)) {
      list.append(h('a', { class: 'topic-row', href: `#/learn/${subject}?topic=${code}`, style: { color: 'inherit' } },
        h('span', { class: 'topic-code' }, code),
        h('div', {}, h('div', { style: { fontWeight: 600 } }, t.name), h('div', { class: 'tiny muted' }, `${t.seen}/${t.total} types · ${t.questions} attempts · accuracy ${t.counted ? pct(t.correct / t.counted) : '—'}`)),
        h('div', { class: 't-bars' }, h('div', { class: 'bar thin expo' }, h('i', { style: { width: (t.total ? (t.seen / t.total) * 100 : 0) + '%' } })), h('div', { class: 'bar thin acc', style: { marginTop: '5px' } }, h('i', { style: { width: (t.counted ? (t.correct / t.counted) * 100 : 0) + '%' } }))),
      ));
    }
  });
}
