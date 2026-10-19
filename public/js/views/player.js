import { h, fmtTime } from '../dom.js';
import { rich, tex, stmtTex } from '../render.js';
import { MathField } from '../mathfield.js';
import { kbInput } from '../keyboard.js';
import { ICON } from '../art.js';
import { state, SUBJ } from '../state.js';
import { Diagram, refsIn } from '../diagram.js';
import { api } from '../api.js';

const TIER_NAME = { basic: 'Basic', challenging: 'Challenging', advanced: 'Advanced' };
const TIER_CLS = { basic: 'teal', challenging: 'sky', advanced: 'violet' };
const reduced = () => document.documentElement.dataset.motion === 'off' || matchMedia('(prefers-reduced-motion: reduce)').matches;

export function strandOf(subject, topic) {
  const S = state.meta?.syllabus?.[subject];
  const st = S?.strands?.find(([, codes]) => codes.includes(topic));
  return st ? st[0] : '';
}

// Fly a copy of `from` to the rectangle of `to` (FLIP-style), then run done().
function fly(fromEl, toEl, done) {
  if (reduced() || !fromEl || !toEl) { done(); return; }
  const a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
  const g = fromEl.cloneNode(true);
  g.classList.add('fly-chip');
  Object.assign(g.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px' });
  document.body.append(g);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const anim = g.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${dx * 0.55}px, ${dy * 0.55 - 26}px) scale(1.06)`, opacity: 1, offset: 0.55 }, { transform: `translate(${dx}px, ${dy}px) scale(0.96)`, opacity: 0.4 }], { duration: 360, easing: 'cubic-bezier(.3,.7,.2,1)' });
  anim.onfinish = () => { g.remove(); done(); };
}

export function Player(q, { mode = 'practice', onSubmit, onRedo, number } = {}) {
  const fields = [];
  const collectors = {};
  const resultHooks = {};
  const lockers = [];
  let locked = false;
  let timerMs = 0, timerOn = false, t0 = 0, tick;
  const autoTimer = state.me?.settings?.autoTimer !== false;
  const reasons = state.meta.reasons;

  const nextField = (cur) => {
    const i = fields.indexOf(cur);
    const nx = fields[i + 1];
    if (nx) nx.focus(); else if (mode === 'practice' && submitBtn && !submitBtn.disabled) submitBtn.click();
  };
  const mkField = (opts) => {
    const mf = new MathField({ ...opts, onEnter: () => nextField(mf) });
    fields.push(mf);
    lockers.push(() => mf.setDisabled(true));
    return mf;
  };

  // ---------- header ----------
  const timerEl = h('button', { class: 'timer', title: 'Your timer — tap to pause or resume' });
  const updTimer = () => {
    const ms = timerMs + (timerOn ? Date.now() - t0 : 0);
    timerEl.innerHTML = (timerOn ? ICON.pause : ICON.play) + `<span>${timerOn || ms ? fmtTime(ms) : 'Start timer'}</span>`;
    timerEl.classList.toggle('run', timerOn);
  };
  const startTimer = () => { if (timerOn || locked) return; timerOn = true; t0 = Date.now(); tick = setInterval(updTimer, 500); updTimer(); };
  const stopTimer = () => { if (!timerOn) return; timerMs += Date.now() - t0; timerOn = false; clearInterval(tick); updTimer(); };
  timerEl.addEventListener('click', () => (timerOn ? stopTimer() : startTimer()));
  updTimer();

  const topicName = state.meta?.syllabus?.[q.subject]?.topics?.[q.topic] || '';
  const head = h('div', { class: 'qhead' },
    number ? h('span', { class: 'chip violet' }, 'Q' + number) : null,
    h('span', { class: 'chip' }, SUBJ[q.subject].name),
    h('span', { class: 'chip ' + TIER_CLS[q.tier] }, TIER_NAME[q.tier]),
    q.firstOfType ? h('span', { class: 'chip gold', title: 'First time you meet this question type: it counts towards coverage, not accuracy.' }, 'New type') : null,
    h('span', { class: 'grow small muted', style: { minWidth: '120px' } }, topicName),
    mode === 'practice' ? timerEl : null,
  );

  // ---------- body ----------
  const body = h('div', { class: 'qbody' });
  body.append(h('div', { class: 'qstem', html: rich(q.stem) }));
  let dia = null;
  if (q.diagram) {
    const wrap = h('div', { class: 'diagram-wrap', html: q.diagram });
    body.append(wrap);
    dia = new Diagram(wrap);
    if (dia.has()) {
      const allText = [q.stem, ...q.parts.flatMap((p) => (p.lines || []).flat().map((s) => s.tx || ''))].join(' ');
      const found = refsIn(allText, dia.pts);
      const refs = [...found.filter((r) => r.kind !== 'seg'), ...found.filter((r) => r.kind === 'seg')].slice(0, 8);
      if (refs.length) {
        const chips = h('div', { class: 'focus-row' }, h('span', { class: 'tiny muted' }, 'Tap to highlight'),
          ...refs.map((r) => {
            const c = h('button', { class: 'focus-chip', type: 'button', html: tex(r.kind === 'seg' ? r.label : stmtTex(r.label)) });
            c.addEventListener('click', () => c.classList.toggle('on', dia.toggle(r, 'a')));
            return c;
          }));
        body.append(chips);
      }
    }
    body.append(h('div', { class: 'tiny muted', style: { textAlign: 'center' } }, 'Diagram not drawn to scale'));
  }
  const highlightText = (text) => {
    if (!dia || !dia.has()) return;
    const refs = refsIn(text, dia.pts);
    body.querySelectorAll('.focus-chip.on').forEach((c) => c.classList.remove('on'));
    if (refs.length) dia.show(refs, 'b'); else dia.clear();
  };

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
      addBtn = h('button', { class: 'btn small ghost kb-keep', onclick: () => { if (!locked && mfs.length < 6) addBox().focus(); } }, '+ add another solution');
      box.append(h('div', { class: 'tiny muted' }, 'Give every solution, and only the valid ones.'), addBtn);
      lockers.push(() => addBtn.remove());
    }
    const msg = h('div', { class: 'fb-msg hidden' });
    const ans = h('div', { class: 'hidden', style: { marginTop: '8px' } });
    box.append(msg, ans);
    collectors[p.id] = () => (p.count > 1 || p.open ? mfs.map((m) => m.value()) : mfs[0].value());
    resultHooks[p.id] = (r, rev) => {
      mfs.forEach((m, i) => {
        const ok = r.per ? r.per[i] : r.ok;
        if (m.isEmpty() && !(p.count > 1 || p.open)) m.el.classList.add('no');
        else if (!m.isEmpty()) { m.el.classList.add(ok ? 'ok' : 'no'); m._mark.className = 'mark ' + (ok ? 'ok' : 'no'); m._mark.innerHTML = ok ? ICON.check : ICON.cross; }
      });
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
      const b = h('button', { class: 'choice', onclick: () => { if (locked) return; sel = i; btns.forEach((x, j) => x.classList.toggle('sel', j === i)); } }, h('span', { class: 'letter' }, 'ABCDEF'[i]), h('span', { html: rich(o) }));
      return b;
    });
    lockers.push(() => btns.forEach((b) => (b.disabled = true)));
    box.append(h('div', { class: 'choices' }, btns));
    const exp = h('div', { class: 'hidden solution', style: { margin: '10px 0 0' } });
    box.append(exp);
    collectors[p.id] = () => sel;
    resultHooks[p.id] = (r, rev) => {
      btns.forEach((b, j) => { if (rev && j === rev.correct) b.classList.add('right'); else if (j === sel) b.classList.add('wrong'); });
      if (rev && rev.explain) { exp.innerHTML = rich(rev.explain); exp.classList.remove('hidden'); }
    };
  }

  function renderProof(p, box) {
    const proof = h('div', { class: 'proof' });
    const tokens = {}; // id -> { t, v, el, slot: bid|null }
    const slots = {}; // bid -> { el, type, mode, token, get, line }
    let active = null;
    const trayChips = h('div', { class: 'tray-chips' });
    const tray = h('div', { class: 'tray kb-keep' }, h('div', { class: 'tray-title' }, 'Answer bank · tap a chip or drag it into a bracket. Each chip is used once.'), trayChips);
    const tokType = (t) => (t.t === 'reason' ? 'reason' : 'stmt');
    const tokHtml = (t) => (t.t === 'reason' ? esc(reasons[t.v]?.label || t.v) : tex(t.t === 'tex' ? t.v : stmtTex(t.v)));

    const setActive = (bid) => {
      active = bid;
      Object.entries(slots).forEach(([id, s]) => s.el.classList.toggle('active', id === bid));
      if (bid && slots[bid].mode === 'chips' && window.__kb && window.__kb.isOpen()) window.__kb.hide();
      // dim chips that cannot go into the active slot
      const want = bid && slots[bid].mode === 'chips' ? slots[bid].type : null;
      Object.values(tokens).forEach((t) => t.el.classList.toggle('dim', !!want && tokType(t) !== want));
    };
    const nextEmpty = (type, after) => {
      const ids = Object.keys(slots).filter((id) => slots[id].mode === 'chips' && (!type || slots[id].type === type));
      const start = after ? ids.indexOf(after) + 1 : 0;
      return ids.slice(start).concat(ids.slice(0, start)).find((id) => !slots[id].token) || null;
    };
    const renderSlot = (bid) => {
      const s = slots[bid];
      s.el.innerHTML = '';
      if (s.token) {
        const t = tokens[s.token];
        const c = h('span', { class: 'rchip placed' + (t.t !== 'reason' ? ' math' : ''), html: tokHtml(t) });
        dragify(c, t.id, bid);
        s.el.append(c);
        s.el.classList.add('filled');
      } else {
        s.el.textContent = s.type === 'reason' ? 'reason' : 'statement';
        s.el.classList.remove('filled');
      }
    };
    const toTray = (tid) => {
      const t = tokens[tid];
      if (t.slot) { const s = slots[t.slot]; s.token = null; renderSlot(t.slot); }
      t.slot = null;
      trayChips.append(t.el);
      t.el.classList.remove('gone');
      if (!reduced()) t.el.animate([{ transform: 'scale(.6)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 220, easing: 'cubic-bezier(.2,1.4,.4,1)' });
    };
    const place = (tid, bid, fromEl) => {
      const t = tokens[tid], s = slots[bid];
      if (!t || !s || locked || tokType(t) !== s.type) return false;
      const prevSlot = t.slot;
      const displaced = s.token && s.token !== tid ? s.token : null;
      const src = fromEl || t.el;
      const commit = () => {
        if (prevSlot) { slots[prevSlot].token = null; }
        if (displaced) {
          // swap: displaced chip goes where this one came from
          if (prevSlot) { slots[prevSlot].token = displaced; tokens[displaced].slot = prevSlot; renderSlot(prevSlot); }
          else { tokens[displaced].slot = null; toTray(displaced); }
        } else if (prevSlot) renderSlot(prevSlot);
        s.token = tid; t.slot = bid;
        t.el.remove();
        renderSlot(bid);
        if (!reduced()) s.el.animate([{ transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 260, easing: 'cubic-bezier(.2,1.4,.4,1)' });
        setActive(nextEmpty(null, bid));
      };
      if (!prevSlot) t.el.classList.add('gone');
      fly(src, s.el, commit);
      return true;
    };
    function dragify(chip, tid, fromSlot) {
      let sx, sy, ghost = null, moved = false;
      chip.addEventListener('pointerdown', (e) => {
        if (locked) return;
        e.preventDefault();
        e.stopPropagation();
        sx = e.clientX; sy = e.clientY; moved = false;
        chip.setPointerCapture(e.pointerId);
      });
      chip.addEventListener('pointermove', (e) => {
        if (sx == null) return;
        if (!moved && Math.hypot(e.clientX - sx, e.clientY - sy) > 6) {
          moved = true;
          ghost = chip.cloneNode(true);
          ghost.classList.add('ghost-chip');
          document.body.append(ghost);
          chip.classList.add('lifting');
        }
        if (ghost) {
          ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px';
          proof.querySelectorAll('.slot.drop').forEach((x) => x.classList.remove('drop'));
          const sl = slotAt(e.clientX, e.clientY);
          if (sl && slots[sl].type === tokType(tokens[tid])) slots[sl].el.classList.add('drop');
        }
      });
      const end = (e) => {
        if (sx == null) return;
        sx = null;
        chip.classList.remove('lifting');
        proof.querySelectorAll('.slot.drop').forEach((x) => x.classList.remove('drop'));
        if (ghost) {
          const sl = slotAt(e.clientX, e.clientY);
          const g = ghost; ghost = null;
          if (sl && sl !== fromSlot && slots[sl].type === tokType(tokens[tid])) { g.remove(); place(tid, sl, chip); return; }
          if (!sl && fromSlot) { g.remove(); toTray(tid); setActive(fromSlot); return; }
          // snap back
          const r = chip.getBoundingClientRect();
          if (reduced()) g.remove();
          else g.animate([{ left: g.style.left, top: g.style.top }, { left: r.left + r.width / 2 + 'px', top: r.top + r.height / 2 + 'px' }], { duration: 200, easing: 'ease-out' }).onfinish = () => g.remove();
          return;
        }
        // tap
        if (fromSlot) { toTray(tid); setActive(fromSlot); return; }
        const t = tokens[tid];
        const target = active && slots[active].mode === 'chips' && slots[active].type === tokType(t) && !slots[active].token ? active : nextEmpty(tokType(t), null);
        if (target) place(tid, target);
        else { chip.classList.remove('nudge'); void chip.offsetWidth; chip.classList.add('nudge'); }
      };
      chip.addEventListener('pointerup', end);
      chip.addEventListener('pointercancel', () => { sx = null; if (ghost) { ghost.remove(); ghost = null; } chip.classList.remove('lifting'); });
    }
    const slotAt = (x, y) => {
      for (const [bid, s] of Object.entries(slots)) {
        if (s.mode !== 'chips') continue;
        const r = s.el.getBoundingClientRect();
        if (x >= r.left - 6 && x <= r.right + 6 && y >= r.top - 6 && y <= r.bottom + 6) return bid;
      }
      return null;
    };

    p.lines.forEach((line, li) => {
      const row = h('div', { class: 'pline' }, h('span', { class: 'num' }, String(li + 1)));
      const lineText = line.map((s) => s.tx || '').join(' ');
      row.addEventListener('click', (e) => {
        if (e.target.closest('.slot, .mf, input, .rchip')) return;
        const extra = Object.values(slots).filter((s) => s.line === li && s.token).map((s) => tokens[s.token]).filter((t) => t.t === 'stmt').map((t) => t.v).join(' ');
        proof.querySelectorAll('.pline.lit').forEach((x) => x.classList.remove('lit'));
        row.classList.add('lit');
        highlightText(lineText + ' ' + extra);
      });
      line.forEach((seg) => {
        if (seg.tx != null) { row.append(h('span', { html: rich(seg.tx) })); return; }
        const bid = seg.blank;
        if (seg.mode === 'chips') {
          const el = h('button', { class: 'slot kb-keep' + (seg.type === 'reason' ? ' reason' : ''), type: 'button' });
          slots[bid] = { el, type: seg.type, mode: 'chips', token: null, line: li };
          el.addEventListener('click', () => { if (!locked && !slots[bid].token) setActive(bid); });
          renderSlot(bid);
          row.append(el);
        } else if (seg.type === 'reason') {
          const inp = kbInput({ placeholder: 'reason, e.g. alternate angles', 'data-kbl': 'abc', maxlength: 80 });
          inp.style.cssText = 'width:auto;flex:1;min-width:180px;font-size:15px;padding:8px 12px';
          const wrap = h('span', { class: 'slot reason', style: { padding: '2px 4px', minWidth: '200px', flex: '1' } }, inp);
          slots[bid] = { el: wrap, type: 'reason', mode: 'text', get: () => inp.value, inp, line: li };
          inp.addEventListener('focus', () => setActive(bid));
          lockers.push(() => { inp.disabled = true; });
          row.append(wrap);
        } else if (seg.type === 'stmt') {
          const mf = mkField({ kb: 'geo', inline: true, placeholder: 'statement' });
          mf.el.addEventListener('pointerdown', () => setActive(bid));
          const wrap = h('span', { class: 'slot', style: { padding: '2px', border: 0, background: 'none' } }, mf.el);
          slots[bid] = { el: wrap, type: 'stmt', mode: 'type', get: () => mf.text(), mf, line: li };
          row.append(wrap);
        } else {
          const mf = mkField({ kb: seg.kb || 'num', inline: true, placeholder: '?' });
          mf.el.addEventListener('pointerdown', () => setActive(bid));
          const wrap = h('span', { class: 'row', style: { gap: '4px' } }, seg.pre ? h('span', { html: tex(seg.pre) }) : null, mf.el, seg.post ? h('span', { html: tex(seg.post) }) : null);
          slots[bid] = { el: wrap, type: 'math', mode: 'type', get: () => mf.value(), mf, line: li };
          row.append(wrap);
        }
      });
      proof.append(row);
    });
    box.append(proof);
    if (p.bank && p.bank.length) {
      for (const b of p.bank) {
        const el = h('div', { class: 'rchip' + (b.t !== 'reason' ? ' math' : ''), html: tokHtml(b), title: b.t === 'reason' ? reasons[b.v]?.full || '' : '' });
        tokens[b.id] = { ...b, el, slot: null };
        dragify(el, b.id, null);
        trayChips.append(el);
      }
      box.append(tray);
      lockers.push(() => tray.classList.add('closed'));
      const first = nextEmpty(null, null);
      if (first) setTimeout(() => setActive(first), 30);
    }

    collectors[p.id] = () => {
      const out = {};
      for (const [bid, s] of Object.entries(slots)) {
        if (s.mode === 'chips') {
          const t = s.token && tokens[s.token];
          out[bid] = !t ? '' : t.t === 'reason' ? '#' + t.v : t.t === 'tex' ? '#tex:' + t.v : '#stmt:' + t.v;
        } else out[bid] = s.get();
      }
      return out;
    };
    resultHooks[p.id] = (r, rev) => {
      setActive(null);
      for (const [bid, s] of Object.entries(slots)) {
        const ok = r.blanks && r.blanks[bid];
        const target = s.mf ? s.mf.el : s.el;
        target.classList.add(ok ? 'ok' : 'no');
        if (!ok && rev && rev.blanks && rev.blanks[bid]) {
          const b = rev.blanks[bid];
          let txt = '';
          if (b.reason) txt = esc(reasons[b.reason]?.label || b.reason);
          else if (b.stmt) txt = tex(stmtTex(b.stmt));
          else if (b.latex) txt = tex(b.latex) + (b.approx ? ` <span class="muted small">≈ ${b.approx}</span>` : '');
          const row = proof.children[s.line];
          let fix = row.nextElementSibling && row.nextElementSibling.classList.contains('pfix') ? row.nextElementSibling : null;
          if (!fix) { fix = h('div', { class: 'pfix' }); row.after(fix); }
          fix.innerHTML += `<span class="pfix-item"><span class="tiny caps">Should be</span> ${txt}</span>`;
        }
      }
    };
  }

  // ---------- guided steps (hints before checking, full walkthrough after) ----------
  const guide = h('div', { class: 'guide hidden' });
  const guideList = h('ol', { class: 'guide-steps' });
  const guideCtl = h('div', { class: 'row wrap', style: { marginTop: '10px' } });
  guide.append(h('div', { class: 'row spread' }, h('div', { class: 'caps' }, 'Step by step'), h('span', { class: 'tiny muted guide-count' })), guideList, guideCtl);
  let shownSteps = [];
  let allSteps = null;
  const addStep = (s, i, total) => {
    const li = h('li', { class: 'guide-step', html: rich(s) });
    li.addEventListener('click', () => { guideList.querySelectorAll('.guide-step').forEach((x) => x.classList.remove('cur')); li.classList.add('cur'); highlightText(s); });
    guideList.append(li);
    guideList.querySelectorAll('.guide-step').forEach((x) => x.classList.remove('cur'));
    li.classList.add('cur');
    highlightText(s);
    shownSteps.push(s);
    guide.classList.remove('hidden');
    guide.querySelector('.guide-count').textContent = `${i + 1} of ${total}`;
    if (!reduced()) li.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'ease-out' });
    li.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'nearest' });
  };
  const drawGuideCtl = () => {
    guideCtl.innerHTML = '';
    if (!allSteps) return;
    if (shownSteps.length < allSteps.length) {
      guideCtl.append(
        h('button', { class: 'btn small primary', onclick: () => { addStep(allSteps[shownSteps.length], shownSteps.length, allSteps.length); drawGuideCtl(); } }, shownSteps.length ? 'Next step' : 'Start the walkthrough'),
        h('button', { class: 'btn small ghost', onclick: () => { while (shownSteps.length < allSteps.length) addStep(allSteps[shownSteps.length], shownSteps.length, allSteps.length); drawGuideCtl(); } }, 'Show all steps'));
    } else if (dia && dia.has()) guideCtl.append(h('span', { class: 'tiny muted' }, 'Tap any step to see it on the diagram again.'));
  };

  // ---------- footer ----------
  const foot = h('div', { class: 'qfoot' });
  const src = h('div', { class: 'source grow' }, h('span', { html: ICON.book, style: { width: '14px', height: '14px', display: 'inline-flex' } }), q.source?.label || '');
  let submitBtn = null, hintBtn = null;
  if (mode === 'practice') {
    hintBtn = h('button', { class: 'btn small ghost', title: 'Reveals the worked solution one step at a time. Using hints halves the XP for this question.', onclick: async () => {
      hintBtn.disabled = true;
      try {
        const r = await api('/hint', { body: { qid: q.qid } });
        if (r.step) addStep(r.step, r.index, r.total);
        hintBtn.textContent = r.done ? 'No more hints' : 'Next hint';
        hintBtn.disabled = !!r.done;
        hintBtn.classList.add('used');
      } catch { hintBtn.disabled = false; }
    } }, 'Hint');
    submitBtn = h('button', { class: 'btn primary', onclick: async () => {
      submitBtn.disabled = true;
      stopTimer();
      try { await onSubmit(collect(), timerMs, submitBtn); } catch (e) { submitBtn.disabled = false; throw e; }
    } }, 'Check answer');
    foot.append(src, hintBtn, submitBtn);
  } else foot.append(src);

  const el = h('div', { class: 'card qcard fade-in' }, head, body, guide, foot);
  if (mode === 'practice' && autoTimer) startTimer();

  function collect() {
    const out = {};
    for (const [id, f] of Object.entries(collectors)) out[id] = f();
    return out;
  }
  function lock() {
    locked = true;
    stopTimer();
    lockers.forEach((f) => f());
    if (window.__kb && window.__kb.isOpen()) window.__kb.hide();
    if (hintBtn) hintBtn.remove();
  }
  function showResult(res) {
    lock();
    for (const p of q.parts) if (resultHooks[p.id]) resultHooks[p.id](res.parts[p.id] || {}, res.reveal && res.reveal[p.id]);
    if (res.solution && res.solution.length) {
      allSteps = res.solution;
      guide.classList.remove('hidden');
      guide.querySelector('.guide-count').textContent = `${shownSteps.length} of ${allSteps.length}`;
      drawGuideCtl();
      // a wrong answer starts the walkthrough automatically
      if (!res.ok && !shownSteps.length) { addStep(allSteps[0], 0, allSteps.length); drawGuideCtl(); }
    }
  }
  // Footer after checking: no editing, only Redo or Next.
  function afterCheck(onNext) {
    if (!submitBtn) return;
    const actions = h('div', { class: 'row' },
      onRedo ? h('button', { class: 'btn', onclick: onRedo, title: 'Clear your answers and try the same question again' }, 'Redo') : null,
      h('button', { class: 'btn grad', onclick: onNext }, 'Next question'));
    submitBtn.replaceWith(actions);
  }
  function destroy() { clearInterval(tick); }
  return { el, collect, showResult, afterCheck, lock, destroy, foot, stopTimer, get timeMs() { return timerMs + (timerOn ? Date.now() - t0 : 0); } };
}

function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
