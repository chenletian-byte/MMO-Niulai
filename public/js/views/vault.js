import { h } from '../dom.js';
import { api } from '../api.js';
import { state, SUBJ } from '../state.js';
import { rich } from '../render.js';
import { Player } from './player.js';
import { ICON } from '../art.js';
import { xpFloat, burst, badgeToasts, modal, toast } from '../fx.js';

export function vaultView(root) {
  if (!state.me.vaultUnlocked) {
    root.append(h('div', { class: 'card empty' }, h('div', { html: ICON.lock, style: { width: '56px', margin: '0 auto 10px', opacity: 0.6 } }), h('h2', {}, 'Mistake Vault is locked'), h('p', {}, 'Finish the Basic tutorial in either subject to unlock it. Your mistakes are already being saved.'), h('a', { class: 'btn primary', href: '#/learn' }, 'Go to Learn')));
    return;
  }
  let filter = 'open', subj = '';
  let player = null;
  const list = h('div', {}, h('div', { class: 'loader' }));
  const stage = h('div', {});
  const seg = h('div', { class: 'seg' });
  const seg2 = h('div', { class: 'seg' });
  let items = [];
  const draw = () => {
    seg.innerHTML = '';
    for (const [id, l] of [['open', 'To redeem'], ['done', 'Redeemed'], ['all', 'All']]) seg.append(h('button', { class: filter === id ? 'on' : '', onclick: () => { filter = id; draw(); } }, l));
    seg2.innerHTML = '';
    for (const [id, l] of [['', 'Both'], ['emath', 'E Math'], ['amath', 'A Math']]) seg2.append(h('button', { class: subj === id ? 'on' : '', onclick: () => { subj = id; draw(); } }, l));
    const shown = items.filter((m) => (filter === 'all' || (filter === 'open' ? !m.resolved : m.resolved)) && (!subj || m.subject === subj));
    list.innerHTML = '';
    if (!shown.length) { list.append(h('div', { class: 'card empty' }, filter === 'open' ? 'Nothing to redeem. Every mistake you make in practice or mocks lands here.' : 'Nothing here yet.')); return; }
    const byTopic = {};
    shown.forEach((m) => (byTopic[m.subject + ':' + m.topic] = byTopic[m.subject + ':' + m.topic] || []).push(m));
    for (const [k, arr] of Object.entries(byTopic)) {
      const [s, t] = k.split(':');
      list.append(h('div', { class: 'caps', style: { margin: '18px 4px 8px' } }, `${SUBJ[s].name} · ${t} · ${state.meta.syllabus[s].topics[t] || ''}`));
      for (const m of arr) {
        list.append(h('div', { class: 'card tight fade-in', style: { marginBottom: '8px' } },
          h('div', { class: 'row spread' }, h('b', {}, m.title), h('span', { class: 'chip ' + (m.resolved ? 'teal' : 'violet') }, m.resolved ? 'Redeemed' : m.retries ? `${m.retries} retr${m.retries === 1 ? 'y' : 'ies'}` : 'New')),
          h('div', { class: 'qstem small', style: { fontSize: '15px', maxHeight: '3.2em', overflow: 'hidden', margin: '6px 0' }, html: rich(m.stem) }),
          h('div', { class: 'row' }, h('span', { class: 'tiny muted grow' }, m.source?.label || ''), h('button', { class: 'btn small', onclick: () => review(m) }, 'Review'), h('button', { class: 'btn small primary', onclick: () => retry(m) }, m.resolved ? 'Practise again' : 'Redeem')),
        ));
      }
    }
  };
  async function load() {
    items = await api('/vault');
    draw();
  }
  async function review(m) {
    const d = await api('/vault/' + m.qid);
    const p = Player({ ...d, firstOfType: false }, { mode: 'review' });
    p.showResult({ parts: d.graded?.parts || {}, reveal: d.reveal, solution: d.solution });
    modal(h('div', {}, h('div', { class: 'kicker' }, 'Answers and worked solution'), p.el), { wide: true });
  }
  async function retry(m) {
    const q = await api(`/vault/${m.qid}/retry`, { body: {} });
    list.classList.add('hidden');
    stage.innerHTML = '';
    const back = h('button', { class: 'btn ghost small', onclick: () => { stage.innerHTML = ''; list.classList.remove('hidden'); load(); }, html: ICON.back + ' Back to vault' });
    player = Player({ ...q, firstOfType: false }, { mode: 'practice', onSubmit: async (answers, timeMs, btn) => {
      const res = await api('/answer', { body: { qid: q.qid, answers, timeMs } });
      player.showResult(res);
      const r = btn.getBoundingClientRect();
      xpFloat(r.left + r.width / 2, r.top, '+' + res.gained.xp + ' XP');
      if (res.ok) { burst(r.left + r.width / 2, r.top + r.height / 2); toast('Redeemed', 'This mistake is cleared from the vault'); }
      state.me = res.me;
      badgeToasts(res.gained);
      btn.replaceWith(h('button', { class: 'btn grad', onclick: () => back.click() }, 'Back to vault'));
    } });
    stage.append(h('div', { class: 'stack' }, back, h('div', { class: 'small muted' }, 'Same idea, fresh numbers. Get it right to redeem the original.'), player.el));
  }
  root.append(h('div', { class: 'stack' },
    h('div', { class: 'page-head' }, h('div', {}, h('div', { class: 'kicker' }, 'Mistake Vault'), h('h1', {}, 'Turn mistakes into marks'), h('div', { class: 'small muted' }, 'Wrong answers are stored here. Redeem them with a fresh version of the same question.')), h('div', { class: 'row wrap' }, seg2, seg)),
    list, stage));
  draw();
  load().catch((e) => { list.innerHTML = ''; list.append(h('div', { class: 'card empty' }, e.message)); });
  return { destroy() { if (player) player.destroy(); } };
}
