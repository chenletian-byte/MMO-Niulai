import { h, fmtTime } from '../dom.js';
import { api } from '../api.js';
import { state, SUBJ } from '../state.js';
import { Player } from './player.js';
import { modal, badgeToasts, playUnlocks, burst } from '../fx.js';

export function mockView(root) {
  let timer, players = [];
  const destroy = () => { clearInterval(timer); players.forEach((p) => p.destroy()); };

  async function overview() {
    destroy();
    root.innerHTML = '<div class="loader"></div>';
    const m = await api('/mock');
    root.innerHTML = '';
    const cd = h('span', { class: 'countdown' }, fmtTime(m.endsAt - Date.now()));
    timer = setInterval(() => (cd.textContent = fmtTime(m.endsAt - Date.now())), 1000);
    const card = (s) => {
      const st = m.subjects[s];
      return h('div', { class: 'card subj-card' },
        h('div', { class: 'subj-code' }, s === 'emath' ? '4052' : '4049'),
        h('h2', {}, h('span', { class: 'subj-dot', style: { background: SUBJ[s].color } }), SUBJ[s].name + ' mock'),
        st?.submitted_at
          ? h('div', {}, h('div', { class: 'grade-big', style: { fontSize: '64px' } }, st.grade), h('div', { class: 'small muted' }, `${Math.round(st.score)}% · next paper in the next window`))
          : h('div', {}, h('p', { class: 'small muted' }, st ? `In progress · ${fmtTime(st.deadline - Date.now())} left` : `${m.size} questions across the syllabus · ${m.minutes} minutes`),
            h('button', { class: 'btn grad', onclick: () => start(s) }, st ? 'Resume paper' : 'Start paper')),
      );
    };
    root.append(h('div', { class: 'stack' },
      h('div', { class: 'page-head' }, h('div', {}, h('div', { class: 'kicker' }, 'Mock papers'), h('h1', {}, 'A new paper every 2 hours'), h('div', { class: 'small muted' }, 'Everyone gets the same paper in a window. Timed, no hints, graded A1–F9. Break reminders are paused while you sit it.')), h('div', { style: { textAlign: 'right' } }, cd, h('div', { class: 'tiny muted' }, 'until the next release'))),
      h('div', { class: 'grid2' }, card('emath'), card('amath')),
      m.board.length ? h('div', { class: 'card' }, h('h3', {}, 'This window'), ...m.board.map((b, i) => h('div', { class: 'lb-row' }, h('span', { class: 'lb-rank' }, String(i + 1)), h('div', { class: 'grow lb-name' }, b.username, h('span', { class: 'chip' }, SUBJ[b.subject].name)), h('span', { class: 'chip ' + (b.grade === 'A1' ? 'gold' : 'violet') }, b.grade), h('span', { class: 'lb-xp' }, Math.round(b.score) + '%')))) : null,
      m.history.length ? h('div', { class: 'card' }, h('h3', {}, 'Your history'), ...m.history.map((x) => h('div', { class: 'row spread small', style: { padding: '6px 0', borderBottom: '1px solid var(--line)' } }, h('span', {}, SUBJ[x.subject].name + ' · ' + new Date(x.submitted_at).toLocaleString()), h('b', {}, `${x.grade} · ${Math.round(x.score)}%`)))) : null,
    ));
  }

  async function start(subject) {
    destroy();
    root.innerHTML = '<div class="loader"></div>';
    let paper;
    try { paper = await api('/mock/start', { body: { subject } }); } catch (e) { root.innerHTML = ''; root.append(h('div', { class: 'card empty' }, e.message)); return; }
    root.innerHTML = '';
    const left = h('b', { class: 'countdown', style: { fontSize: '20px' } });
    const submitBtn = h('button', { class: 'btn grad small', onclick: () => confirmSubmit() }, 'Submit paper');
    const bar = h('div', { class: 'mock-bar' }, h('span', { class: 'chip violet' }, SUBJ[subject].name + ' mock'), h('span', { class: 'grow' }), left, submitBtn);
    let submitted = false;
    const tickFn = () => {
      const l = paper.deadline - Date.now();
      left.textContent = fmtTime(l);
      left.style.color = l < 5 * 60e3 ? 'var(--bad)' : '';
      if (l <= 0 && !submitted) submit();
    };
    tickFn();
    timer = setInterval(tickFn, 1000);
    players = paper.questions.map((q, i) => Player({ ...q, firstOfType: false }, { mode: 'mock', number: i + 1 }));
    root.append(bar, h('div', { class: 'stack' }, ...players.map((p) => p.el), h('button', { class: 'btn primary block', onclick: () => confirmSubmit() }, 'Submit paper')));
    const confirmSubmit = () => {
      const m = modal(h('div', {}, h('h2', {}, 'Submit your paper?'), h('p', { class: 'muted' }, 'You cannot change answers afterwards.'), h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: () => { m.close(); submit(); } }, 'Submit'), h('button', { class: 'btn', onclick: () => m.close() }, 'Keep working'))));
    };
    async function submit() {
      if (submitted) return;
      submitted = true;
      clearInterval(timer);
      const answers = {};
      paper.questions.forEach((q, i) => (answers[q.qid] = players[i].collect()));
      root.innerHTML = '<div class="loader"></div>';
      const res = await api('/mock/submit', { body: { subject, window: paper.window, answers } });
      state.me = res.me;
      root.innerHTML = '';
      const hero = h('div', { class: 'card', style: { textAlign: 'center' } }, h('div', { class: 'kicker' }, SUBJ[subject].name + ' mock · result'), h('div', { class: 'grade-big' }, res.grade), h('div', { class: 'serif', style: { fontSize: '20px' } }, Math.round(res.pct) + '%'), h('div', { class: 'small muted' }, `+${res.gained.xp} XP${res.late ? ' · submitted after time — unanswered' : ''}`), h('div', { class: 'row', style: { justifyContent: 'center', marginTop: '14px' } }, h('a', { class: 'btn', href: '#/vault' }, 'Mistakes → vault'), h('button', { class: 'btn primary', onclick: overview }, 'Done')));
      root.append(h('div', { class: 'stack' }, hero, ...res.results.map((r, i) => {
        const p = players[i];
        p.showResult(r);
        const sc = h('div', { class: 'row spread small', style: { padding: '0 4px 6px' } }, h('span', {}, `Q${i + 1} · ${r.title}`), h('b', {}, `${Math.round(r.score.got * 10) / 10} / ${r.score.tot}`));
        return h('div', {}, sc, p.el);
      })));
      const rr = hero.getBoundingClientRect();
      if (res.grade === 'A1') burst(rr.left + rr.width / 2, rr.top + 80, 24);
      badgeToasts(res.gained);
      if (res.gained.unlocks?.length) playUnlocks(res.gained.unlocks);
    }
  }

  overview().catch((e) => { root.innerHTML = ''; root.append(h('div', { class: 'card empty' }, e.message)); });
  return { destroy };
}
