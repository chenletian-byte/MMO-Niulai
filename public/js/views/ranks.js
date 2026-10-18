import { h } from '../dom.js';
import { api } from '../api.js';
import { state } from '../state.js';
import { avatarSVG, badgeSVG } from '../art.js';

export function ranksView(root) {
  let scope = 'all';
  const seg = h('div', { class: 'seg' });
  const body = h('div', {}, h('div', { class: 'loader' }));
  const draw = async () => {
    seg.innerHTML = '';
    for (const [id, l] of [['all', 'Overall'], ['emath', 'E Math'], ['amath', 'A Math']]) seg.append(h('button', { class: scope === id ? 'on' : '', onclick: () => { scope = id; draw(); } }, l));
    body.innerHTML = '<div class="loader"></div>';
    const d = await api('/leaderboard?scope=' + scope);
    body.innerHTML = '';
    const B = state.meta.badges;
    const badges = (r, n = 5) => h('span', { class: 'lb-badges', html: r.badges.slice(-n).map((b) => badgeSVG(b, B[b], 18)).join('') });
    const top = d.rows.slice(0, 3);
    if (top.length === 3) {
      const pod = (r, cls) => h('div', { class: 'pod ' + cls }, h('div', { class: 'pr' }, String(r.rank)), h('div', { html: avatarSVG(r.avatar, cls === 'first' ? 68 : 54, r.frame) }), h('div', { class: 'pname' }, r.username), h('div', { class: 'pxp' }, `${r.xp} XP · ${r.level.name}`), badges(r, 4));
      body.append(h('div', { class: 'podium' }, pod(top[1], ''), pod(top[0], 'first'), pod(top[2], '')));
    }
    const list = h('div', { class: 'card', style: { padding: '8px' } });
    for (const r of d.rows.slice(top.length === 3 ? 3 : 0)) {
      list.append(h('div', { class: 'lb-row' + (r.me ? ' me' : '') },
        h('span', { class: 'lb-rank' }, String(r.rank)),
        h('span', { html: avatarSVG(r.avatar, 38, r.frame) }),
        h('div', { class: 'grow' }, h('div', { class: 'lb-name' }, r.username, badges(r)), h('div', { class: 'tiny muted' }, `Lv ${r.level.level} · ${r.level.name} · best combo ${r.bestStreak || 0}`)),
        h('span', { class: 'lb-xp' }, r.xp.toLocaleString())));
    }
    if (d.me && d.me.rank > 100) list.append(h('div', { class: 'lb-row me' }, h('span', { class: 'lb-rank' }, String(d.me.rank)), h('span', { html: avatarSVG(d.me.avatar, 38, d.me.frame) }), h('div', { class: 'grow lb-name' }, d.me.username), h('span', { class: 'lb-xp' }, String(d.me.xp))));
    body.append(list);
  };
  root.append(h('div', { class: 'stack' }, h('div', { class: 'page-head' }, h('div', {}, h('div', { class: 'kicker' }, 'Leaderboard'), h('h1', {}, 'Ranks'), h('div', { class: 'small muted' }, 'XP from practice, vault redemptions and mock papers. Badges show after each name.')), seg), body));
  draw().catch((e) => { body.innerHTML = ''; body.append(h('div', { class: 'card empty' }, e.message)); });
}
