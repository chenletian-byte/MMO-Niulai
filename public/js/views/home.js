import { h, pct, fmtTime } from '../dom.js';
import { api } from '../api.js';
import { state, SUBJ } from '../state.js';
import { ICON, ring, avatarSVG, badgeSVG } from '../art.js';
import { Pomodoro } from '../pomodoro.js';

const TIER_NAME = { basic: 'Basic · tutorial', challenging: 'Challenging', advanced: 'Advanced' };

export function bars(st) {
  const e = st.exposure, a = st.accuracy;
  return h('div', {},
    h('div', { class: 'bar-label' }, h('span', {}, 'Learning progress', h('span', { class: 'muted' }, ` · ${e.questions} question${e.questions === 1 ? '' : 's'} met`)), h('b', {}, `${e.seen}/${e.total} types`)),
    h('div', { class: 'bar expo' }, h('i', { style: { width: Math.round(e.pct * 100) + '%' } })),
    h('div', { class: 'bar-label' }, h('span', {}, 'Accuracy', h('span', { class: 'muted' }, a.counted ? ` · ${a.correct}/${a.counted} on repeat types` : ' · starts on your 2nd go at a type')), h('b', {}, pct(a.pct))),
    h('div', { class: 'bar acc' }, h('i', { style: { width: Math.round((a.pct || 0) * 100) + '%' } })),
  );
}

export function homeView(root) {
  const me = state.me;
  const hr = new Date().getHours();
  const greet = hr < 5 ? 'Still up' : hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
  const lv = me.level;
  const hero = h('div', { class: 'card hero fade-in' },
    h('div', { class: 'row', style: { gap: '16px', alignItems: 'center' } },
      h('div', { html: avatarSVG(me.avatar, 64) }),
      h('div', { class: 'grow' },
        h('div', { class: 'kicker' }, greet),
        h('h1', {}, me.username),
        h('div', { class: 'row wrap small muted' },
          h('span', {}, `Level ${lv.level} · ${lv.name}`), h('span', {}, '·'), h('span', {}, `${me.xp} XP`),
          me.badges.length ? h('span', { class: 'lb-badges', html: me.badges.slice(-5).map((b) => badgeSVG(b, state.meta.badges[b], 18)).join('') }) : null),
      ),
      h('div', { html: ring(lv.into / lv.span, 64, String(lv.level)), title: `${lv.span - lv.into} XP to next level` }),
    ),
    h('div', { class: 'stats3', style: { marginTop: '18px' } },
      h('div', { class: 'stat' }, h('b', {}, String(me.streak)), h('span', {}, 'current combo')),
      h('div', { class: 'stat' }, h('b', {}, String(me.dayStreak)), h('span', {}, 'day streak')),
      h('div', { class: 'stat' }, h('b', {}, Pomodoro.remainingMin() + ' min'), h('span', {}, 'until break')),
    ),
  );

  const subj = (s) => {
    const st = me.subjects[s];
    const tutorial = st.tier === 'basic'
      ? h('div', { class: 'small', style: { marginTop: '12px' } }, h('div', { class: 'bar-label' }, h('span', {}, 'Basic tutorial'), h('b', {}, `${Math.min(st.basicDone, st.basicTarget)}/${st.basicTarget}`)), h('div', { class: 'bar thin expo' }, h('i', { style: { width: (Math.min(1, st.basicDone / st.basicTarget) * 100) + '%' } })), h('div', { class: 'tiny muted', style: { marginTop: '6px' } }, 'Finish it to unlock Challenging and the Mistake Vault.'))
      : st.tier === 'challenging'
      ? h('div', { class: 'tiny muted', style: { marginTop: '10px' } }, `Advanced unlocks at ${st.advReq.need} Challenging questions (${st.advReq.attempts} so far) with ≥ ${Math.round(st.advReq.needAcc * 100)}% repeat accuracy (now ${pct(st.advReq.acc)}).`)
      : null;
    return h('div', { class: 'card subj-card fade-in' },
      h('div', { class: 'subj-code' }, s === 'emath' ? '4052' : '4049'),
      h('div', { class: 'row spread' }, h('h2', {}, h('span', { class: 'subj-dot', style: { background: SUBJ[s].color } }), SUBJ[s].name), h('span', { class: 'chip ' + (st.tier === 'basic' ? 'teal' : st.tier === 'challenging' ? 'sky' : 'violet') }, TIER_NAME[st.tier])),
      h('div', { class: 'small muted' }, SUBJ[s].long),
      bars(st),
      tutorial,
      h('div', { class: 'row', style: { marginTop: '16px' } },
        h('a', { class: 'btn primary grow', href: '#/learn/' + s }, 'Learn'),
        h('a', { class: 'btn', href: '#/syllabus/' + s, html: ICON.syllabus, title: 'Syllabus map', style: { width: '44px', padding: '10px' } })),
    );
  };

  let timer;
  const mockCard = h('div', { class: 'card fade-in' }, h('div', { class: 'loader', style: { margin: '10px auto' } }));
  api('/mock').then((m) => {
    const left = m.endsAt - Date.now();
    const done = ['emath', 'amath'].filter((s) => m.subjects[s]?.submitted_at);
    mockCard.innerHTML = '';
    const cd = h('span', { class: 'countdown', style: { fontSize: '22px' } }, fmtTime(left));
    timer = setInterval(() => { const l = m.endsAt - Date.now(); cd.textContent = fmtTime(l); if (l <= 0) clearInterval(timer); }, 1000);
    mockCard.append(
      h('div', { class: 'row spread' }, h('div', {}, h('div', { class: 'kicker' }, 'Mock paper'), h('h3', { style: { margin: 0 } }, 'This window’s paper')), h('div', { style: { textAlign: 'right' } }, cd, h('div', { class: 'tiny muted' }, 'until the next paper'))),
      h('p', { class: 'small muted' }, `${m.size} questions · ${m.minutes} minutes · graded A1–F9. A1 earns the Laurel frame.`),
      h('div', { class: 'row wrap' }, ...['emath', 'amath'].map((s) => m.subjects[s]?.submitted_at ? h('span', { class: 'chip ' + (m.subjects[s].grade === 'A1' ? 'gold' : 'violet') }, `${SUBJ[s].name}: ${m.subjects[s].grade}`) : null), h('a', { class: 'btn small ' + (done.length === 2 ? '' : 'grad'), href: '#/mock' }, done.length === 2 ? 'View results' : 'Sit the paper')),
    );
  }).catch(() => { mockCard.innerHTML = '<div class="muted small">Mock paper unavailable.</div>'; });

  const vault = me.vaultUnlocked
    ? h('a', { class: 'card fade-in', href: '#/vault', style: { display: 'block', color: 'inherit' } }, h('div', { class: 'row' }, h('span', { class: 'icon-btn', html: ICON.vault }), h('div', { class: 'grow' }, h('h3', { style: { margin: 0 } }, 'Mistake Vault'), h('div', { class: 'small muted' }, me.vaultOpen ? `${me.vaultOpen} question${me.vaultOpen === 1 ? '' : 's'} waiting to be redeemed` : 'Empty — nice.')), h('span', { class: 'chip violet' }, String(me.vaultOpen))))
    : h('div', { class: 'card fade-in', style: { opacity: 0.85 } }, h('div', { class: 'row' }, h('span', { class: 'icon-btn', html: ICON.lock }), h('div', { class: 'grow' }, h('h3', { style: { margin: 0 } }, 'Mistake Vault · locked'), h('div', { class: 'small muted' }, 'Complete a Basic tutorial to unlock it.'))));

  const lounge = h('a', { class: 'card fade-in', href: '#/lounge', style: { display: 'block', color: 'inherit' } }, h('div', { class: 'row' }, h('span', { class: 'icon-btn', html: ICON.lounge }), h('div', { class: 'grow' }, h('h3', { style: { margin: 0 } }, 'Break lounge'), h('div', { class: 'small muted' }, 'Lazy snake, blocks, bubble wrap, breathing.'))));

  root.append(h('div', { class: 'stack' }, hero, h('div', { class: 'grid2' }, subj('emath'), subj('amath')), mockCard, h('div', { class: 'grid2' }, vault, lounge)));
  return { destroy() { clearInterval(timer); } };
}
