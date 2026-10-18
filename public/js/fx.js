// Feedback effects: toasts, XP floats, geometric bursts, modals and the unlock cinematic.
import { h, svg } from './dom.js';
import { badgeSVG } from './art.js';
import { state } from './state.js';

export function toast(title, sub = '', icon = '') {
  const box = document.getElementById('toasts');
  const t = h('div', { class: 'toast' }, icon ? h('div', { class: 't-ico', html: icon }) : null, h('div', {}, h('b', {}, title), sub ? h('span', {}, sub) : null));
  box.append(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 320); }, 3600);
}

export function xpFloat(x, y, text) {
  const el = h('div', { class: 'xp-float', style: { left: x + 'px', top: y + 'px' } }, text);
  document.body.append(el);
  setTimeout(() => el.remove(), 1400);
}

// a small burst of geometric shards (triangles, circles, plus signs) — restrained, not confetti
export function burst(x, y, n = 14) {
  if (document.documentElement.dataset.motion === 'off') return;
  const c = h('canvas', { class: 'burst', width: 240, height: 240, style: { left: x - 120 + 'px', top: y - 120 + 'px', width: '240px', height: '240px' } });
  document.body.append(c);
  const ctx = c.getContext('2d');
  const cols = ['#7a5fd0', '#2f9fe0', '#14a99a'];
  const parts = [...Array(n)].map((_, i) => ({ a: (i / n) * Math.PI * 2 + Math.random() * 0.4, v: 2.2 + Math.random() * 2.4, s: 3 + Math.random() * 4, k: i % 3, c: cols[i % 3], r: Math.random() * 6 }));
  let f = 0;
  const step = () => {
    f++;
    ctx.clearRect(0, 0, 240, 240);
    for (const p of parts) {
      const d = p.v * f * (1 - f / 70);
      const px = 120 + Math.cos(p.a) * d, py = 120 + Math.sin(p.a) * d;
      ctx.globalAlpha = Math.max(0, 1 - f / 45);
      ctx.strokeStyle = ctx.fillStyle = p.c;
      ctx.lineWidth = 1.6;
      ctx.save(); ctx.translate(px, py); ctx.rotate(p.r + f * 0.08);
      ctx.beginPath();
      if (p.k === 0) { ctx.moveTo(0, -p.s); ctx.lineTo(p.s, p.s); ctx.lineTo(-p.s, p.s); ctx.closePath(); ctx.stroke(); }
      else if (p.k === 1) { ctx.arc(0, 0, p.s * 0.7, 0, Math.PI * 2); ctx.stroke(); }
      else { ctx.moveTo(-p.s, 0); ctx.lineTo(p.s, 0); ctx.moveTo(0, -p.s); ctx.lineTo(0, p.s); ctx.stroke(); }
      ctx.restore();
    }
    if (f < 46) requestAnimationFrame(step); else c.remove();
  };
  requestAnimationFrame(step);
}

export function modal(content, { wide = false, onClose, dismiss = true } = {}) {
  const back = h('div', { class: 'modal-back' });
  const box = h('div', { class: 'modal' + (wide ? ' wide' : '') });
  box.append(content);
  back.append(box);
  const close = () => { back.remove(); if (onClose) onClose(); };
  if (dismiss) back.addEventListener('pointerdown', (e) => { if (e.target === back) close(); });
  document.body.append(back);
  return { close, box };
}

export function badgeToasts(gained) {
  const meta = state.meta;
  for (const b of gained.badges || []) toast('Badge earned · ' + (meta.badges[b]?.name || b), meta.badges[b]?.desc || '', badgeSVG(b, meta.badges[b], 40));
  for (const f of gained.frames || []) toast('New avatar frame · ' + (meta.frames[f]?.name || f), 'Equip it in your profile', '');
  if (gained.levelUp) toast(`Level ${gained.levelUp.level} · ${gained.levelUp.name}`, 'Level up', `<svg viewBox="0 0 48 48"><defs><linearGradient id="lu" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a5fd0"/><stop offset="1" stop-color="#14a99a"/></linearGradient></defs><circle cx="24" cy="24" r="21" fill="url(#lu)"/><text x="24" y="30" text-anchor="middle" font-size="17" font-weight="800" fill="#fff" font-family="Inter">${gained.levelUp.level}</text></svg>`);
}

// ---------- unlock cinematic ----------
export function cinematic({ kicker, title, text, cta = 'Continue', variant = 'vault' }) {
  return new Promise((resolve) => {
    const art = variant === 'vault' ? vaultArt() : tierArt(variant);
    const wrap = h('div', { class: 'cine' });
    const inner = h('div', { style: { textAlign: 'center' } });
    inner.append(svg(art));
    const btn = h('button', { class: 'btn grad', style: { minWidth: '200px' } }, cta);
    inner.append(h('div', { class: 'cine-text' }, h('div', { class: 'cine-kicker' }, kicker), h('h1', { class: 'serif' }, title), h('p', {}, text), btn));
    wrap.append(inner);
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * Math.PI * 2, d = 140 + Math.random() * 220;
      wrap.append(h('i', { class: 'particle', style: { left: '50%', top: '42%', '--dx': Math.cos(a) * d + 'px', '--dy': Math.sin(a) * d + 'px', animationDelay: 2.75 + Math.random() * 0.4 + 's', background: ['#9fd8ff', '#7fe3d6', '#b9a8f2'][i % 3] } }));
    }
    document.body.append(wrap);
    wrap.querySelectorAll('.draw').forEach((p) => { try { p.style.setProperty('--len', Math.ceil(p.getTotalLength()) + 1); } catch {} });
    btn.addEventListener('click', () => { wrap.style.transition = 'opacity .35s'; wrap.style.opacity = 0; setTimeout(() => { wrap.remove(); resolve(); }, 360); });
  });
}

function vaultArt() {
  const ticks = [...Array(36)].map((_, i) => { const a = (i * 10 * Math.PI) / 180; const r1 = i % 3 ? 112 : 104; return `<line class="ln" x1="${200 + r1 * Math.cos(a)}" y1="${200 + r1 * Math.sin(a)}" x2="${200 + 118 * Math.cos(a)}" y2="${200 + 118 * Math.sin(a)}" stroke="#7fe3d6" stroke-opacity=".7"/>`; }).join('');
  const hexPts = (r, rot = 0) => [...Array(6)].map((_, i) => { const a = ((60 * i + rot) * Math.PI) / 180; return `${200 + r * Math.cos(a)},${200 + r * Math.sin(a)}`; }).join(' ');
  return `<svg class="cine-art" viewBox="0 0 400 400">
    <defs><radialGradient id="cg"><stop offset="0" stop-color="#9fd8ff" stop-opacity=".9"/><stop offset="1" stop-color="#7a5fd0" stop-opacity="0"/></radialGradient></defs>
    <circle class="glow" cx="200" cy="200" r="150" fill="url(#cg)"/>
    <g class="door-l"><path class="ln draw" style="--d:1.2s" d="M200 52 A148 148 0 0 0 200 348" stroke="#b9a8f2" stroke-width="2"/></g>
    <g class="door-r"><path class="ln draw" style="--d:1.2s" d="M200 52 A148 148 0 0 1 200 348" stroke="#b9a8f2" stroke-width="2"/></g>
    <circle class="ln draw" style="--d:1.4s;--delay:.2s" cx="200" cy="200" r="128" stroke="#4fb6f2"/>
    <g class="spin">${ticks}<polygon class="ln draw" style="--delay:.4s" points="${hexPts(84, 30)}" stroke="#9a82ec" stroke-width="1.6"/>
      <polygon class="ln draw" style="--delay:.6s" points="${hexPts(58)}" stroke="#2fc8b6" stroke-width="1.4"/>
      <line class="ln draw" style="--delay:.8s" x1="200" y1="120" x2="200" y2="280" stroke="#efeaff" stroke-width="2.4"/>
      <line class="ln draw" style="--delay:.8s" x1="120" y1="200" x2="280" y2="200" stroke="#efeaff" stroke-width="2.4"/></g>
    <circle class="ln draw" style="--delay:1s" cx="200" cy="200" r="20" stroke="#efeaff" stroke-width="2.4"/>
  </svg>`;
}
function tierArt(variant) {
  const n = variant === 'advanced' ? 5 : 3;
  const layers = [...Array(n)].map((_, j) => {
    const r = 60 + j * 26;
    const k = 3 + j;
    const pts = [...Array(k)].map((_, i) => { const a = ((360 / k) * i - 90) * (Math.PI / 180); return `${200 + r * Math.cos(a)},${200 + r * Math.sin(a)}`; }).join(' ');
    return `<polygon class="ln draw" style="--delay:${0.25 * j}s;--d:1.3s" points="${pts}" stroke="${['#9a82ec', '#4fb6f2', '#2fc8b6', '#b9a8f2', '#7fe3d6'][j]}" stroke-width="1.6"/>`;
  }).join('');
  return `<svg class="cine-art" viewBox="0 0 400 400"><defs><radialGradient id="cg2"><stop offset="0" stop-color="#9fd8ff" stop-opacity=".7"/><stop offset="1" stop-color="#7a5fd0" stop-opacity="0"/></radialGradient></defs><circle class="glow" cx="200" cy="200" r="160" fill="url(#cg2)"/><g class="spin">${layers}</g><circle class="ln draw" style="--delay:1.2s" cx="200" cy="200" r="8" stroke="#fff" stroke-width="2"/></svg>`;
}

export async function playUnlocks(unlocks = []) {
  for (const u of unlocks) {
    if (u.kind === 'vault') {
      await cinematic({ kicker: 'Tutorial complete', title: 'Mistake Vault unlocked', text: 'Every question you get wrong is now stored and served back to you — fresh numbers, same idea — until you get it right.', cta: 'Open the vault', variant: 'vault' });
    } else if (u.kind === 'tier') {
      const name = u.subject === 'emath' ? 'E Math' : 'A Math';
      if (u.tier === 'challenging') await cinematic({ kicker: name + ' · tier 2', title: 'Challenging unlocked', text: 'Proof steps are now typed with the geometry keyboard, and the reason bank opens up in full. Questions get closer to exam papers.', cta: 'Continue', variant: 'challenging' });
      else await cinematic({ kicker: name + ' · tier 3', title: 'Advanced unlocked', text: 'Exam-style multi-part questions. Reasons are written in your own words — the way markers expect them.', cta: 'Continue', variant: 'advanced' });
    }
  }
}
