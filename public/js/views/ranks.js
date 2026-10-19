import { h } from '../dom.js';
import { api } from '../api.js';
import { state } from '../state.js';
import { avatarSVG, badgeSVG, ring } from '../art.js';
import { modal } from '../fx.js';

export function ranksView(root) {
  let scope = 'all';
  let pin = null, obs = null;
  const seg = h('div', { class: 'seg' });
  const body = h('div', {}, h('div', { class: 'loader' }));
  const B = state.meta.badges;
  const badges = (r, n = 5) => h('span', { class: 'lb-badges', html: r.badges.slice(-n).map((b) => badgeSVG(b, B[b], 18)).join('') });
  const details = (r) => {
    const F = state.meta.frames;
    const lv = r.level;
    const earned = r.badges.length
      ? h('div', { class: 'badge-grid', style: { gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))' } }, ...r.badges.map((b) => h('div', { class: 'badge-tile', html: badgeSVG(b, B[b], 40) + `<b>${B[b]?.name || b}</b><span>${B[b]?.desc || ''}</span>` })))
      : h('div', { class: 'small muted' }, 'No badges yet.');
    const m = modal(h('div', { class: 'stack' },
      h('div', { class: 'row', style: { gap: '16px' } },
        h('div', { html: avatarSVG(r.avatar, 84, r.frame) }),
        h('div', { class: 'grow' }, h('div', { class: 'kicker' }, `Rank ${r.rank} · ${scope === 'all' ? 'Overall' : scope === 'emath' ? 'E Math' : 'A Math'}`), h('h2', { style: { margin: 0, wordBreak: 'break-all' } }, r.username), h('div', { class: 'small muted' }, `Level ${lv.level} · ${lv.name}`)),
        h('div', { html: ring(lv.into / lv.span, 56, String(lv.level)), title: `${lv.span - lv.into} XP to next level` })),
      h('div', { class: 'stats3' },
        h('div', { class: 'stat' }, h('b', {}, r.xp.toLocaleString()), h('span', {}, 'XP')),
        h('div', { class: 'stat' }, h('b', {}, String(r.bestStreak || 0)), h('span', {}, 'best combo')),
        h('div', { class: 'stat' }, h('b', {}, String(r.badges.length)), h('span', {}, 'badges'))),
      h('div', { class: 'small muted' }, `Frame: ${F[r.frame]?.name || 'Plain'}`),
      h('div', {}, h('div', { class: 'caps', style: { marginBottom: '8px' } }, 'Badges'), earned),
      h('div', { class: 'row', style: { justifyContent: 'flex-end' } },
        r.me ? h('a', { class: 'btn', href: '#/me', onclick: () => m.close() }, 'Edit my profile') : null,
        h('button', { class: 'btn primary', onclick: () => m.close() }, 'Close'))));
  };
  const rowOf = (r, clickable = true) => h('div', { class: 'lb-row' + (r.me ? ' me' : '') + (clickable ? ' tap' : ''), role: clickable ? 'button' : null, tabindex: clickable ? '0' : null, onclick: clickable ? () => details(r) : null, onkeydown: clickable ? (e) => { if (e.key === 'Enter') details(r); } : null },
    h('span', { class: 'lb-rank' }, String(r.rank)),
    h('span', { html: avatarSVG(r.avatar, 38, r.frame) }),
    h('div', { class: 'grow' }, h('div', { class: 'lb-name' }, r.username, badges(r)), h('div', { class: 'tiny muted' }, `Lv ${r.level.level} · ${r.level.name} · best combo ${r.bestStreak || 0}`)),
    h('span', { class: 'lb-xp' }, r.xp.toLocaleString()));
  const clearPin = () => { if (obs) obs.disconnect(); obs = null; if (pin) pin.remove(); pin = null; };

  const draw = async () => {
    seg.innerHTML = '';
    for (const [id, l] of [['all', 'Overall'], ['emath', 'E Math'], ['amath', 'A Math']]) seg.append(h('button', { class: scope === id ? 'on' : '', onclick: () => { scope = id; draw(); } }, l));
    clearPin();
    body.innerHTML = '<div class="loader"></div>';
    const d = await api('/leaderboard?scope=' + scope);
    body.innerHTML = '';
    const top = d.rows.slice(0, 3);
    let mine = null;
    if (top.length === 3) {
      const pod = (r, cls) => {
        const el = h('div', { class: 'pod tap ' + cls + (r.me ? ' me' : ''), role: 'button', tabindex: '0', onclick: () => details(r) }, h('div', { class: 'pr' }, String(r.rank)), h('div', { html: avatarSVG(r.avatar, cls === 'first' ? 68 : 54, r.frame) }), h('div', { class: 'pname' }, r.username), h('div', { class: 'pxp' }, `${r.xp} XP · ${r.level.name}`), badges(r, 4));
        if (r.me) mine = el;
        return el;
      };
      body.append(h('div', { class: 'podium' }, pod(top[1], ''), pod(top[0], 'first'), pod(top[2], '')));
    }
    const list = h('div', { class: 'card', style: { padding: '8px' } });
    for (const r of d.rows.slice(top.length === 3 ? 3 : 0)) {
      const el = rowOf(r);
      if (r.me) mine = el;
      list.append(el);
    }
    if (d.me && d.me.rank > 100) { mine = rowOf(d.me); list.append(mine); }
    body.append(list);

    // Pinned "your rank" bar: visible while your own row is off screen; tap to jump to it.
    if (d.me && mine) {
      pin = rowOf(d.me, false);
      pin.classList.add('lb-pin');
      pin.setAttribute('role', 'button');
      pin.title = 'Jump to your rank';
      pin.addEventListener('click', () => {
        mine.scrollIntoView({ behavior: 'smooth', block: 'center' });
        mine.classList.remove('flash'); void mine.offsetWidth; mine.classList.add('flash');
      });
      document.body.append(pin);
      obs = new IntersectionObserver(([e]) => pin && pin.classList.toggle('off', e.isIntersecting), { rootMargin: '0px 0px -90px 0px' });
      obs.observe(mine);
    }
  };
  root.append(h('div', { class: 'stack' }, h('div', { class: 'page-head' }, h('div', {}, h('div', { class: 'kicker' }, 'Leaderboard'), h('h1', {}, 'Ranks'), h('div', { class: 'small muted' }, 'XP from practice, vault redemptions and mock papers. Badges show after each name.')), seg), body));
  draw().catch((e) => { body.innerHTML = ''; body.append(h('div', { class: 'card empty' }, e.message)); });
  return { destroy: clearPin };
}
