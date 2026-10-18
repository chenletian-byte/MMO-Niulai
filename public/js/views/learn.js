import { h } from '../dom.js';
import { api } from '../api.js';
import { state, SUBJ } from '../state.js';
import { Player } from './player.js';
import { ICON } from '../art.js';
import { toast, xpFloat, burst, badgeToasts, playUnlocks } from '../fx.js';
import { bars } from './home.js';

const TIERS = [['', 'Auto'], ['basic', 'Basic'], ['challenging', 'Challenging'], ['advanced', 'Advanced']];

export function learnView(root, args, params) {
  const subject = args[0];
  if (!subject || !SUBJ[subject]) return pickSubject(root);
  let tier = params.get('tier') || '';
  const topic = params.get('topic') || '';
  const tpl = params.get('tpl') || '';
  let player = null;
  const me = state.me;
  const unlocked = ['basic', 'challenging', 'advanced'].slice(0, ['basic', 'challenging', 'advanced'].indexOf(me.subjects[subject].tier) + 1);
  const seg = h('div', { class: 'seg' });
  const drawSeg = () => {
    seg.innerHTML = '';
    for (const [id, l] of TIERS) {
      const locked = id && !unlocked.includes(id);
      seg.append(h('button', { class: tier === id ? 'on' : '', disabled: locked, title: locked ? 'Locked' : '', onclick: () => { tier = id; drawSeg(); next(); }, html: (locked ? `<span style="display:inline-flex;width:12px;height:12px;vertical-align:-1px;margin-right:4px">${ICON.lock}</span>` : '') + l }));
    }
  };
  drawSeg();
  const combo = h('span', { class: 'combo hidden' });
  const setCombo = (n) => { combo.classList.toggle('hidden', n < 2); combo.textContent = '×' + n + ' combo'; combo.classList.remove('pop'); void combo.offsetWidth; combo.classList.add('pop'); };
  setCombo(me.streak);
  const topicName = topic ? state.meta.syllabus[subject].topics[topic] : '';
  const header = h('div', { class: 'page-head' },
    h('div', {}, h('div', { class: 'kicker' }, SUBJ[subject].long), h('h1', {}, SUBJ[subject].name + ' practice'), topic ? h('div', { class: 'row small' }, h('span', { class: 'chip violet' }, topic + ' · ' + topicName), h('a', { href: '#/learn/' + subject, class: 'small' }, 'clear filter')) : h('div', { class: 'small muted' }, 'Random questions across the syllabus, weighted towards what you haven’t mastered.')),
    h('div', { class: 'row wrap' }, combo, seg),
  );
  const barsBox = h('div', { class: 'card tight' }, bars(me.subjects[subject]));
  const stage = h('div', {}, h('div', { class: 'loader' }));
  root.append(h('div', { class: 'stack' }, header, barsBox, stage));

  async function next() {
    if (player) player.destroy();
    stage.innerHTML = '<div class="loader"></div>';
    try {
      const q = await api(`/next?subject=${subject}${tier ? '&tier=' + tier : ''}${topic ? '&topic=' + topic : ''}${tpl ? '&tpl=' + tpl : ''}`);
      mount(q);
    } catch (e) {
      stage.innerHTML = '';
      stage.append(h('div', { class: 'card empty' }, e.message));
    }
  }
  function mount(q) {
    stage.innerHTML = '';
    player = Player(q, { mode: 'practice', onSubmit: async (answers, timeMs, btn) => {
      const res = await api('/answer', { body: { qid: q.qid, answers, timeMs } });
      player.showResult(res);
      const r = btn.getBoundingClientRect();
      xpFloat(r.left + r.width / 2, r.top, '+' + res.gained.xp + ' XP');
      if (res.ok) burst(r.left + r.width / 2, r.top + r.height / 2);
      else player.el.classList.add('shake');
      setCombo(res.gained.combo);
      if (res.gained.combo && res.gained.combo % 5 === 0) toast(`${res.gained.combo} in a row`, 'Combo bonus XP is now active');
      state.me = res.me;
      barsBox.innerHTML = '';
      barsBox.append(bars(res.me.subjects[subject]));
      badgeToasts(res.gained);
      window.__app.refreshNav();
      btn.replaceWith(h('button', { class: 'btn grad', onclick: next }, 'Next question'));
      if (res.firstOfType) toast('New question type recorded', 'Your next attempt at this type will count towards accuracy');
      if (res.gained.unlocks.length) {
        await playUnlocks(res.gained.unlocks);
        unlocked.splice(0, unlocked.length, ...['basic', 'challenging', 'advanced'].slice(0, ['basic', 'challenging', 'advanced'].indexOf(res.me.subjects[subject].tier) + 1));
        drawSeg();
      }
    } });
    stage.append(player.el);
  }
  next();
  return { destroy() { if (player) player.destroy(); } };
}

function pickSubject(root) {
  const me = state.me;
  root.append(h('div', { class: 'page-head' }, h('div', {}, h('div', { class: 'kicker' }, 'Learn'), h('h1', {}, 'Choose a subject'))));
  root.append(h('div', { class: 'grid2' }, ...['emath', 'amath'].map((s) => h('a', { class: 'card subj-card fade-in', href: '#/learn/' + s, style: { color: 'inherit', display: 'block' } },
    h('div', { class: 'subj-code' }, s === 'emath' ? '4052' : '4049'),
    h('h2', {}, h('span', { class: 'subj-dot', style: { background: SUBJ[s].color } }), SUBJ[s].name),
    h('div', { class: 'small muted' }, SUBJ[s].long), bars(me.subjects[s])))));
}
