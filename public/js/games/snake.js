// Lazy snake: walls wrap, bumping into yourself just sheds your tail. Nothing to lose.
export function snake(canvas, ui) {
  const N = 18, S = Math.floor(Math.min(360, window.innerWidth - 40) / N);
  canvas.width = canvas.height = N * S;
  const ctx = canvas.getContext('2d');
  let body = [[9, 9], [8, 9], [7, 9]], dir = [1, 0], next = [1, 0], food = spot(), eaten = 0, alive = true;
  function spot() { let p; do p = [Math.floor(Math.random() * N), Math.floor(Math.random() * N)]; while (body && body.some((b) => b[0] === p[0] && b[1] === p[1])); return p; }
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const step = () => {
    if (!alive) return;
    if (next[0] !== -dir[0] || next[1] !== -dir[1]) dir = next;
    const h = [(body[0][0] + dir[0] + N) % N, (body[0][1] + dir[1] + N) % N];
    const hit = body.findIndex((b) => b[0] === h[0] && b[1] === h[1]);
    if (hit > 0) body = body.slice(0, hit);
    body.unshift(h);
    if (h[0] === food[0] && h[1] === food[1]) { eaten++; food = spot(); ui && ui(`Length ${body.length} · ${eaten} eaten`); } else body.pop();
    draw();
  };
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = css('--teal');
    ctx.beginPath(); ctx.arc(food[0] * S + S / 2, food[1] * S + S / 2, S / 3, 0, 7); ctx.fill();
    body.forEach((b, i) => {
      ctx.fillStyle = i ? css('--violet') : css('--sky');
      ctx.globalAlpha = 1 - (i / body.length) * 0.55;
      ctx.beginPath(); ctx.roundRect(b[0] * S + 2, b[1] * S + 2, S - 4, S - 4, 5); ctx.fill();
    });
    ctx.globalAlpha = 1;
  };
  const key = (e) => {
    const m = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] }[e.key];
    if (m) { next = m; e.preventDefault(); }
  };
  let sx, sy;
  const ts = (e) => { sx = e.clientX; sy = e.clientY; };
  const te = (e) => { const dx = e.clientX - sx, dy = e.clientY - sy; if (Math.hypot(dx, dy) < 14) return; next = Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]; };
  window.addEventListener('keydown', key);
  canvas.addEventListener('pointerdown', ts);
  canvas.addEventListener('pointerup', te);
  const t = setInterval(step, 170);
  draw();
  ui && ui('Swipe or use arrow keys. Walls wrap around; you cannot lose.');
  return { pad: (d) => (next = d), stop() { alive = false; clearInterval(t); window.removeEventListener('keydown', key); } };
}
