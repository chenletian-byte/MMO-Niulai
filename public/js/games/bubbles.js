// Bubble wrap. Pop, and it slowly refills.
export function bubbles(canvas, ui) {
  const C = 7, R = 9, S = Math.floor(Math.min(360, window.innerWidth - 40) / C);
  canvas.width = C * S; canvas.height = R * S;
  const ctx = canvas.getContext('2d');
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const g = [...Array(R)].map(() => Array(C).fill(1));
  let popped = 0, alive = true;
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) {
      const cx = x * S + S / 2 + (y % 2 ? S / 4 : -S / 4) * 0.4, cy = y * S + S / 2, r = S * 0.38;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7);
      if (g[y][x] === 1) {
        const gr = ctx.createRadialGradient(cx - r / 3, cy - r / 3, 1, cx, cy, r);
        gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, css('--sky') + '55');
        ctx.fillStyle = gr; ctx.fill(); ctx.strokeStyle = css('--sky'); ctx.globalAlpha = 0.5; ctx.stroke(); ctx.globalAlpha = 1;
      } else { ctx.strokeStyle = css('--line-2'); ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]); }
    }
  };
  canvas.addEventListener('pointerdown', (e) => {
    const r = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * C), y = Math.floor(((e.clientY - r.top) / r.height) * R);
    if (g[y] && g[y][x] === 1) { g[y][x] = 0; popped++; if (navigator.vibrate) navigator.vibrate(8); ui && ui(`${popped} popped`); draw(); }
  });
  const t = setInterval(() => { if (!alive) return; const empties = []; g.forEach((r, y) => r.forEach((v, x) => !v && empties.push([x, y]))); if (empties.length > C * R * 0.6) { const [x, y] = empties[Math.floor(Math.random() * empties.length)]; g[y][x] = 1; draw(); } }, 900);
  draw();
  ui && ui('Pop as many as you like.');
  return { stop() { alive = false; clearInterval(t); } };
}
