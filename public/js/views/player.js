import { h, fmtTime } from '../dom.js';
import { rich, tex, stmtTex } from '../render.js';
import { MathField } from '../mathfield.js';
import { kbInput } from '../keyboard.js';
import { ICON } from '../art.js';
import { state, SUBJ } from '../state.js';

const TIER_NAME = { basic: 'Basic', challenging: 'Challenging', advanced: 'Advanced' };
const TIER_CLS = { basic: 'teal', challenging: 'sky', advanced: 'violet' };

export function Player(q, { mode = 'practice', onSubmit, number } = {}) {
  const fields = []; // ordered focusables for Enter navigation
  const collectors = {};
  const resultHooks = {};
  let timerMs = 0, timerOn = false, t0 = 0, tick;
  const autoTimer = state.me?.settings?.autoTimer !== false;

  const nextField = (cur) => {
    const i = fields.indexOf(cur);
    const nx = fields[i + 1];
    if (nx) nx.focus(); else if (mode === 'practice' && submitBtn && !submitBtn.disabled) submitBtn.click();
  };
  const mkField = (opts) => {
    const mf = new MathField({ ...opts, onEnter: () => nextField(mf) });
    fields.push(mf);
    return mf;
  };

  // ---------- header ----------
  const timerEl = h('button', { class: 'timer', title: 'Your timer — tap to pause or resume' });
  const updTimer = () => {
    const ms = timerMs + (timerOn ? Date.now() - t0 : 0);
    timerEl.innerHTML = (timerOn ? ICON.pause : ICON.play) + `<span>${timerOn || ms ? fmtTime(ms) : 'Start timer'}</span>`;
    timerEl.classList.toggle('run', timerOn);
  };
  const startTimer = () => { if (timerOn) return; timerOn = true; t0 = Date.now(); tick = setInterval(updTimer, 500); updTimer(); };
  const stopTimer = () => { if (!timerOn) return; timerMs += Date.now() - t0; timerOn = false; clearInterval(tick); updTimer(); };
  timerEl.addEventListener('click', () => (timerOn ? stopTimer() : startTimer()));
  updTimer();

  const topicName = state.meta?.syllabus?.[q.subject]?.topics?.[q.topic] || q.topic;
  const head = h('div', { class: 'qhead' },
    number ? h('span', { class: 'chip violet' }, 'Q' + number) : null,
    h('span', { class: 'chip' }, SUBJ[q.subject].name + ' · ' + q.topic),
    h('span', { class: 'chip ' + TIER_CLS[q.tier] }, TIER_NAME[q.tier]),
    q.firstOfType ? h('span', { class: 'chip gold', title: 'First time you meet this question type: it counts towards coverage, not accuracy.' }, 'New type') : null,
    h('span', { class: 'grow small muted', style: { minWidth: '120px' } }, topicName),
    mode === 'practice' ? timerEl : null,
  );

  // ---------- body ----------
  const body = h('div', { class: 'qbody' });
  body.append(h('div', { class: 'qstem', html: rich(q.stem) }));
  if (q.diagram) body.append(h('div', { class: 'diagram-wrap', html: q.diagram }));
  if (q.diagram) body.append(h('div', { class: 'tiny muted', style: { textAlign: 'center' } }, 'Diagram not drawn to scale'));

  q.parts.forEach((p) => {
    const box = h('div', { class: 'part' });
    if (p.prompt || p.label) box.append(h('div', { class: 'part-prompt' }, p.label ? h('span', { class: 'part-label' }, p.label) : null, h('span', { html: rich(p.prompt || '') })));
    if (p.kind === 'math') renderMath(p, box);
    else if (p.kind === 'choice') renderChoice(p, box);
    else if (p.kind === 'proof') renderProof(p, box);
    body.append(box);
  });

  function renderMath(p, box) {
    const list = h('div', {});
    const mfs = [];
    const addBox = () => {
      const mf = mkField({ kb: p.kb || 'num', wide: true, placeholder: mfs.length ? 'another answer' : 'Tap to answer' });
      mfs.push(mf);
      const mark = h('span', { class: 'mark hidden' });
      list.append(h('div', { class: 'ans-row' }, p.pre ? h('span', { class: 'ans-pre', html: tex(p.pre) }) : null, mf.el, p.post ? h('span', { class: 'ans-post', html: tex(p.post) }) : null, mark));
      mf._mark = mark;
      return mf;
    };
    const n = p.open ? 1 : p.count || 1;
    for (let i = 0; i < n; i++) addBox();
    box.append(list);
    let addBtn;
    if (p.open) {
      addBtn = h('button', { class: 'btn small ghost kb-keep', onclick: () => { if (mfs.length < 6) addBox().focus(); } }, '+ add another solution');
      box.append(h('div', { class: 'tiny muted' }, 'Give every solution — and only valid ones.'), addBtn);
    }
    const msg = h('div', { class: 'fb-msg hidden' });
    const ans = h('div', { class: 'hidden', style: { marginTop: '8px' } });
    box.append(msg, ans);
    collectors[p.id] = () => (p.count > 1 || p.open ? mfs.map((m) => m.value()) : mfs[0].value());
    resultHooks[p.id] = (r, rev) => {
      mfs.forEach((m, i) => {
        m.setDisabled(true);
        const ok = r.per ? r.per[i] : r.ok;
        if (m.isEmpty() && !(p.count > 1 || p.open)) { m.el.classList.add('no'); }
        else if (!m.isEmpty()) { m.el.classList.add(ok ? 'ok' : 'no'); m._mark.classList.remove('hidden'); m._mark.className = 'mark ' + (ok ? 'ok' : 'no'); m._mark.innerHTML = ok ? ICON.check : ICON.cross; }
      });
      if (addBtn) addBtn.remove();
      if (r.msg) { msg.textContent = r.msg; msg.classList.remove('hidden'); }
      if (rev && rev.values) {
        ans.innerHTML = '';
        ans.append(h('span', { class: 'fb-ans' }, h('span', { class: 'tiny caps' }, r.ok ? 'Answer' : 'Correct answer'), h('span', { html: rev.values.map((v) => tex((p.pre ? p.pre + ' ' : '') + v.latex + (v.plusC ? ' + c' : '') + (p.post ? ' ' + p.post : '')) + (v.approx && v.approx !== v.latex ? ` <span class="muted small">≈ ${v.approx}</span>` : '')).join(' &nbsp;·&nbsp; ') })));
        ans.classList.remove('hidden');
      }
    };
  }

  function renderChoice(p, box) {
    let sel = null;
    const btns = p.options.map((o, i) => {
      const b = h('button', { class: 'choice', onclick: () => { if (b.disabled) return; sel = i; btns.forEach((x, j) => x.classList.toggle('sel', j === i)); } }, h('span', { class: 'letter' }, 'ABCDEF'[i]), h('span', { html: rich(o) }));
      return b;
    });
    box.append(h('div', { class: 'choices' }, btns));
    const exp = h('div', { class: 'hidden solution', style: { margin: '10px 0 0' } });
    box.append(exp);
    collectors[p.id] = () => sel;
    resultHooks[p.id] = (r, rev) => {
      btns.forEach((b, j) => { b.disabled = true; if (rev && j === rev.correct) b.classList.add('right'); else if (j === sel) b.classList.add('wrong'); });
      if (rev && rev.explain) { exp.innerHTML = rich(rev.explain); exp.classList.remove('hidden'); }
    };
  }

  function renderProof(p, box) {
    const proof = h('div', { class: 'proof' });
    const tray = h('div', { class: 'tray hidden kb-keep' }, h('div', { class: 'tray-title' }, 'Tap or drag into the highlighted bracket'), h('div', { class: 'tray-chips' }));
    const slots = {}; // bid -> {el, get, type, mode, set}
    let active = null;
    const reasons = state.meta.reasons;

    const activate = (bid) => {
      active = bid;
      Object.entries(slots).forEach(([id, s]) => s.el.classList.toggle('active', id === bid));
      const s = slots[bid];
      const chips = tray.querySelector('.tray-chips');
      chips.innerHTML = '';
      if (!s || s.mode !== 'chips') { tray.classList.add('hidden'); return; }
      if (window.__kb && window.__kb.isOpen()) window.__kb.hide();
      tray.querySelector('.tray-title').textContent = s.type === 'reason' ? 'Reasons — tap or drag into the bracket' : 'Statements — choose the correct one';
      s.options.forEach((o, i) => {
        const c = h('div', { class: 'rchip' + (s.type === 'stmt' ? ' math' : ''), html: s.type === 'reason' ? esc(reasons[o]?.label || o) : tex(s.latex ? o : stmtTex(o)), title: s.type === 'reason' ? reasons[o]?.full || '' : '' });
        c._val = s.type === 'reason' ? o : i;
        c._html = c.innerHTML;
        dragChip(c, s.type);
        chips.append(c);
      });
      tray.classList.remove('hidden');
    };
    const fill = (bid, val, html) => {
      const s = slots[bid];
      if (!s || s.locked) return;
      s.value = val;
      s.el.innerHTML = html;
      s.el.classList.add('filled');
      // advance to the next empty chip slot
      const ids = Object.keys(slots);
      const next = ids.slice(ids.indexOf(bid) + 1).concat(ids.slice(0, ids.indexOf(bid))).find((id) => slots[id].mode === 'chips' && slots[id].value == null);
      if (next) activate(next); else { activate(null); }
    };
    function dragChip(c, type) {
      let sx, sy, ghost = null, moved = false;
      c.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        sx = e.clientX; sy = e.clientY; moved = false;
        c.setPointerCapture(e.pointerId);
      });
      c.addEventListener('pointermove', (e) => {
        if (sx == null) return;
        if (!moved && Math.hypot(e.clientX - sx, e.clientY - sy) > 6) {
          moved = true;
          ghost = c.cloneNode(true);
          ghost.classList.add('ghost-chip');
          document.body.append(ghost);
        }
        if (ghost) {
          ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px';
          document.querySelectorAll('.slot.drop').forEach((x) => x.classList.remove('drop'));
          ghost.style.display = 'none';
          const under = document.elementFromPoint(e.clientX, e.clientY);
          ghost.style.display = '';
          const sl = under && under.closest('.slot');
          if (sl && sl._type === type && sl._chips) sl.classList.add('drop');
        }
      });
      c.addEventListener('pointerup', (e) => {
        if (sx == null) return;
        sx = null;
        if (ghost) {
          ghost.remove(); ghost = null;
          document.querySelectorAll('.slot.drop').forEach((x) => x.classList.remove('drop'));
          const under = document.elementFromPoint(e.clientX, e.clientY);
          const sl = under && under.closest('.slot');
          const okDrop = sl && sl._type === type && sl._chips && sl._bid && (type === 'reason' ? slots[sl._bid].options.includes(c._val) : sl._bid === active);
          if (okDrop) {
            fill(sl._bid, c._val, c._html);
            return;
          }
          return;
        }
        if (active) fill(active, c._val, c._html);
      });
    }

    p.lines.forEach((line, li) => {
      const row = h('div', { class: 'pline' }, h('span', { class: 'num' }, String(li + 1)));
      line.forEach((seg) => {
        if (seg.tx != null) { row.append(h('span', { html: rich(seg.tx) })); return; }
        const bid = seg.blank;
        if (seg.type === 'reason' && seg.mode === 'chips') {
          const el = h('button', { class: 'slot reason kb-keep', type: 'button' }, 'reason');
          el._bid = bid; el._type = 'reason'; el._chips = true;
          el.addEventListener('click', () => activate(bid));
          slots[bid] = { el, type: 'reason', mode: 'chips', options: seg.chips, value: null };
          row.append(el);
        } else if (seg.type === 'reason') {
          const inp = kbInput({ placeholder: 'reason, e.g. alternate angles', 'data-kbl': 'abc', maxlength: 80 });
          inp.style.cssText = 'width:auto;flex:1;min-width:180px;font-size:15px;padding:8px 12px';
          const wrap = h('span', { class: 'slot reason', style: { padding: '2px 4px', minWidth: '200px', flex: '1' } }, inp);
          wrap._bid = bid;
          slots[bid] = { el: wrap, type: 'reason', mode: 'text', get: () => inp.value, inp };
          inp.addEventListener('focus', () => activate(bid));
          row.append(wrap);
        } else if (seg.type === 'stmt' && seg.mode === 'chips') {
          const el = h('button', { class: 'slot kb-keep', type: 'button' }, 'statement');
          el._bid = bid; el._type = 'stmt'; el._chips = true;
          el.addEventListener('click', () => activate(bid));
          slots[bid] = { el, type: 'stmt', mode: 'chips', options: seg.options, latex: seg.latex, value: null };
          row.append(el);
        } else if (seg.type === 'stmt') {
          const mf = mkField({ kb: 'geo', inline: true, placeholder: 'statement' });
          mf.el.addEventListener('pointerdown', () => activate(bid));
          const wrap = h('span', { class: 'slot', style: { padding: '2px', border: 0, background: 'none' } }, mf.el);
          slots[bid] = { el: wrap, type: 'stmt', mode: 'type', get: () => mf.text(), mf };
          row.append(wrap);
        } else {
          const mf = mkField({ kb: seg.kb || 'num', inline: true, placeholder: '?' });
          mf.el.addEventListener('pointerdown', () => activate(bid));
          const wrap = h('span', { class: 'row', style: { gap: '4px' } }, seg.pre ? h('span', { html: tex(seg.pre) }) : null, mf.el, seg.post ? h('span', { html: tex(seg.post) }) : null);
          slots[bid] = { el: wrap, type: 'math', mode: 'type', get: () => mf.value(), mf };
          row.append(wrap);
        }
      });
      proof.append(row);
    });
    box.append(proof, tray);
    const fix = h('div', { class: 'hidden solution', style: { margin: '10px 0 0' } });
    box.append(fix);
    // focus the first chip slot automatically for basic tier
    const firstChip = Object.keys(slots).find((id) => slots[id].mode === 'chips');
    if (firstChip) setTimeout(() => activate(firstChip), 50);

    collectors[p.id] = () => {
      const out = {};
      for (const [bid, s] of Object.entries(slots)) {
        if (s.mode === 'chips') out[bid] = s.value == null ? '' : s.type === 'reason' ? '#' + s.value : '#opt:' + s.value;
        else out[bid] = s.get();
      }
      return out;
    };
    resultHooks[p.id] = (r, rev) => {
      activate(null);
      const lines = [];
      for (const [bid, s] of Object.entries(slots)) {
        s.locked = true;
        const ok = r.blanks && r.blanks[bid];
        const target = s.mode === 'chips' || s.type === 'reason' ? s.el : s.mf ? s.mf.el : s.el;
        target.classList.add(ok ? 'ok' : 'no');
        if (s.mf) s.mf.setDisabled(true);
        if (s.inp) s.inp.disabled = true;
        if (!ok && rev && rev.blanks && rev.blanks[bid]) {
          const b = rev.blanks[bid];
          let txt = '';
          if (b.reason) txt = esc(reasons[b.reason]?.label || b.reason) + ` <span class="muted small">— ${esc(reasons[b.reason]?.full || '')}</span>`;
          else if (b.stmt) txt = tex(stmtTex(b.stmt));
          else if (b.latex) txt = tex(b.latex) + (b.approx ? ` <span class="muted small">≈ ${b.approx}</span>` : '');
          const lineNo = [...proof.children].findIndex((row) => row.contains(s.el)) + 1;
          lines.push(`<li>Line ${lineNo}: ${txt}</li>`);
        }
      }
      if (lines.length) { fix.innerHTML = '<div class="caps">Corrections</div><ol style="list-style:none;padding-left:0">' + lines.join('') + '</ol>'; fix.classList.remove('hidden'); }
    };
  }

  // ---------- footer ----------
  const foot = h('div', { class: 'qfoot' });
  const src = h('div', { class: 'source grow' }, h('span', { html: ICON.book, style: { width: '14px', height: '14px', display: 'inline-flex' } }), q.source?.label || '');
  let submitBtn = null;
  if (mode === 'practice') {
    submitBtn = h('button', { class: 'btn primary', onclick: async () => {
      submitBtn.disabled = true;
      stopTimer();
      try { await onSubmit(collect(), timerMs, submitBtn); } catch (e) { submitBtn.disabled = false; throw e; }
    } }, 'Check answer');
    foot.append(src, submitBtn);
  } else foot.append(src);

  const solution = h('div', { class: 'solution hidden' });
  const el = h('div', { class: 'card qcard fade-in' }, head, body, solution, foot);
  if (mode === 'practice' && autoTimer) startTimer();

  function collect() {
    const out = {};
    for (const [id, f] of Object.entries(collectors)) out[id] = f();
    return out;
  }
  function showResult(res) {
    for (const p of q.parts) if (resultHooks[p.id]) resultHooks[p.id](res.parts[p.id] || {}, res.reveal && res.reveal[p.id]);
    if (res.solution && res.solution.length) {
      solution.innerHTML = `<div class="caps">Worked solution</div><ol>${res.solution.map((s) => `<li>${rich(s)}</li>`).join('')}</ol>`;
      solution.classList.remove('hidden');
    }
    if (timerMs) head.querySelector('.timer') && (timerEl.title = 'Time taken');
  }
  function destroy() { clearInterval(tick); }
  return { el, collect, showResult, destroy, foot, stopTimer, get timeMs() { return timerMs + (timerOn ? Date.now() - t0 : 0); } };
}

function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
