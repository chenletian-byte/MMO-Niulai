import { h, pct } from '../dom.js';
import { api, patch } from '../api.js';
import { state, applyPrefs, SUBJ } from '../state.js';
import { avatarSVG, badgeSVG } from '../art.js';
import { toast } from '../fx.js';
import { showBulletin } from './bulletin.js';

const CURVES = [['rose', 'Rose'], ['lissajous', 'Lissajous'], ['spiro', 'Spirograph'], ['golden', 'Spiral'], ['cardioid', 'Limaçon'], ['butterfly', 'Butterfly']];

export function meView(root) {
  const me = state.me;
  const av = { ...me.avatar };
  const preview = h('div', {});
  const drawPrev = () => { preview.innerHTML = avatarSVG(av, 120); };
  drawPrev();
  const save = async (body) => { state.me = await patch('/me/avatar', body); };
  const curveRow = h('div', { class: 'row wrap' });
  const drawCurves = () => {
    curveRow.innerHTML = '';
    for (const [id, l] of CURVES) curveRow.append(h('button', { class: 'btn small' + (av.curve === id ? ' primary' : ''), onclick: () => { av.curve = id; drawPrev(); drawCurves(); save({ curve: id }); }, title: l, html: avatarSVG({ ...av, curve: id, frame: 'none' }, 30) + `<span>${l}</span>` }));
  };
  drawCurves();
  const hue = h('input', { type: 'range', min: 0, max: 359, value: av.hue ?? 260 });
  hue.addEventListener('input', () => { av.hue = Number(hue.value); drawPrev(); });
  hue.addEventListener('change', () => save({ hue: av.hue }));
  const kk = h('input', { type: 'range', min: 2, max: 9, value: av.k ?? 3 });
  kk.addEventListener('input', () => { av.k = Number(kk.value); drawPrev(); });
  kk.addEventListener('change', () => save({ k: av.k }));

  const frames = h('div', { class: 'badge-grid' });
  const drawFrames = () => {
    frames.innerHTML = '';
    for (const [id, f] of Object.entries(state.meta.frames)) {
      const owned = me.frames.includes(id);
      frames.append(h('button', { class: 'badge-tile' + (owned ? '' : ' locked'), style: { cursor: owned ? 'pointer' : 'default', outline: av.frame === id ? '2px solid var(--violet)' : '' }, onclick: () => { if (!owned) return; av.frame = id; drawPrev(); drawFrames(); save({ frame: id }); }, html: avatarSVG({ ...av, frame: id }, 54, id) + `<b>${f.name}</b><span>${owned ? (av.frame === id ? 'Equipped' : 'Tap to equip') : f.how}</span>` }));
    }
  };
  drawFrames();

  const badges = h('div', { class: 'badge-grid' }, ...Object.entries(state.meta.badges).map(([id, b]) => h('div', { class: 'badge-tile' + (me.badges.includes(id) ? '' : ' locked'), html: badgeSVG(id, b, 46) + `<b>${b.name}</b><span>${b.desc}</span>` })));

  // settings
  const s = { theme: 'system', font: 'serif', pomodoro: 40, internalKb: true, autoTimer: true, motion: true, ...me.settings };
  const setS = async (k, v) => { s[k] = v; applyPrefs(s); state.me = await patch('/me/settings', { [k]: v }); };
  const segOf = (key, opts) => {
    const el = h('div', { class: 'seg' });
    const d = () => { el.innerHTML = ''; for (const [id, l] of opts) el.append(h('button', { class: s[key] === id ? 'on' : '', onclick: () => { setS(key, id); d(); } }, l)); };
    d();
    return el;
  };
  const pomo = h('input', { type: 'range', min: 10, max: 120, step: 5, value: s.pomodoro });
  const pomoL = h('b', {}, s.pomodoro + ' min');
  pomo.addEventListener('input', () => (pomoL.textContent = pomo.value + ' min'));
  pomo.addEventListener('change', () => setS('pomodoro', Number(pomo.value)));
  const settingRow = (label, ctl, hint) => h('div', { class: 'row spread wrap', style: { padding: '12px 0', borderBottom: '1px solid var(--line)' } }, h('div', {}, h('div', { style: { fontWeight: 600 } }, label), hint ? h('div', { class: 'tiny muted' }, hint) : null), ctl);
  const settings = h('div', {},
    settingRow('Theme', segOf('theme', [['system', 'Auto'], ['light', 'Day'], ['dark', 'Night']])),
    settingRow('Reading font', segOf('font', [['serif', 'Serif'], ['sans', 'Sans'], ['humanist', 'Humanist']]), 'Serif is closest to Claude’s reading style'),
    settingRow('Focus timer', h('div', { style: { minWidth: '200px' } }, h('div', { class: 'row spread' }, h('span', { class: 'tiny muted' }, 'Break prompt after'), pomoL), pomo), 'Never shown during mock papers'),
    settingRow('In-app keyboard for text', segOf('internalKb', [[true, 'On'], [false, 'Device']]), 'Maths answers always use the maths keyboard'),
    settingRow('Start question timer automatically', segOf('autoTimer', [[true, 'On'], [false, 'Off']])),
    settingRow('Animations', segOf('motion', [[true, 'On'], [false, 'Reduced']])),
  );

  const stats = h('div', { class: 'grid2' }, ...['emath', 'amath'].map((sb) => {
    const st = me.subjects[sb];
    return h('div', { class: 'card flat tight' }, h('b', {}, SUBJ[sb].name), h('div', { class: 'small muted' }, `${st.exposure.seen}/${st.exposure.total} types · ${st.exposure.questions} questions · accuracy ${pct(st.accuracy.pct)} · ${st.xp} XP`));
  }));

  const history = h('div', {});
  api('/reviews').then((rs) => {
    if (!rs.length) { history.append(h('div', { class: 'small muted' }, 'Your first coach’s note arrives within 3 hours of practising.')); return; }
    rs.forEach((r) => history.append(h('button', { class: 'btn ghost block', style: { justifyContent: 'space-between' }, onclick: () => showBulletin(r) }, h('span', {}, r.title), h('span', { class: 'tiny muted' }, new Date(r.created_at).toLocaleString()))));
  });

  root.append(h('div', { class: 'stack' },
    h('div', { class: 'page-head' }, h('div', {}, h('div', { class: 'kicker' }, 'Profile'), h('h1', {}, me.username), h('div', { class: 'small muted' }, `Level ${me.level.level} · ${me.level.name} · ${me.xp} XP · best combo ${me.bestStreak}`)),
      h('button', { class: 'btn', onclick: async () => { await api('/auth/logout', { body: {} }); state.me = null; location.hash = '#/'; location.reload(); } }, 'Sign out')),
    stats,
    h('div', { class: 'card' }, h('h3', {}, 'Avatar'), h('div', { class: 'row wrap', style: { gap: '20px', alignItems: 'flex-start' } }, preview, h('div', { class: 'grow stack', style: { minWidth: '240px' } }, curveRow, h('div', {}, h('div', { class: 'caps' }, 'Colour'), hue), h('div', {}, h('div', { class: 'caps' }, 'Parameter k'), kk))), h('div', { class: 'tiny muted', style: { marginTop: '10px' } }, 'Each avatar is a parametric curve. Change k to change its symmetry.')),
    h('div', { class: 'card' }, h('h3', {}, 'Frames'), frames),
    h('div', { class: 'card' }, h('h3', {}, 'Badges'), h('div', { class: 'small muted', style: { marginBottom: '10px' } }, `${me.badges.length} of ${Object.keys(state.meta.badges).length} earned`), badges),
    h('div', { class: 'card' }, h('h3', {}, 'Settings'), settings),
    h('div', { class: 'card' }, h('h3', {}, 'Coach’s notes'), history),
  ));
  void toast;
}
