// Gentle falling blocks. Slow, no speed-up; a full board just clears itself.
const SHAPES = [[[1, 1, 1, 1]], [[1, 1], [1, 1]], [[0, 1, 0], [1, 1, 1]], [[1, 0, 0], [1, 1, 1]], [[0, 0, 1], [1, 1, 1]], [[1, 1, 0], [0, 1, 1]], [[0, 1, 1], [1, 1, 0]]];
export function blocks(canvas, ui) {
  const W = 10, H = 18, S = Math.floor(Math.min(24, (window.innerHeight - 320) / H, (window.innerWidth - 60) / W));
  canvas.width = W * S; canvas.height = H * S;
  const ctx = canvas.getContext('2d');
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const cols = ['--violet', '--sky', '--teal'];
  let grid = [...Array(H)].map(() => Array(W).fill(0)), piece, lines = 0, alive = true;
  const spawn = () => { const s = SHAPES[Math.floor(Math.random() * SHAPES.length)]; piece = { s, x: Math.floor((W - s[0].length) / 2), y: 0, c: 1 + Math.floor(Math.random() * 3) }; if (hit(piece.s, piece.x, piece.y)) { grid = grid.map((r) => r.map(() => 0)); ui && ui('Board cleared — keep stacking.'); } };
  const hit = (s, x, y) => s.some((r, j) => r.some((v, i) => v && (x + i < 0 || x + i >= W || y + j >= H || (y + j >= 0 && grid[y + j][x + i]))));
  const rot = (s) => s[0].map((_, i) => s.map((r) => r[i]).reverse());
  const lock = () => {
    piece.s.forEach((r, j) => r.forEach((v, i) => { if (v && piece.y + j >= 0) grid[piece.y + j][piece.x + i] = piece.c; }));
    const before = grid.length;
    grid = grid.filter((r) => r.some((v) => !v));
    const cleared = before - grid.length;
    while (grid.length < H) grid.unshift(Array(W).fill(0));
    if (cleared) { lines += cleared; ui && ui(`${lines} line${lines === 1 ? '' : 's'} cleared`); }
    spawn();
  };
  const move = (dx, dy) => { if (!hit(piece.s, piece.x + dx, piece.y + dy)) { piece.x += dx; piece.y += dy; return true; } return false; };
  const drop = () => { if (!move(0, 1)) lock(); draw(); };
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cell = (x, y, c) => { ctx.fillStyle = css(cols[c - 1]); ctx.beginPath(); ctx.roundRect(x * S + 1.5, y * S + 1.5, S - 3, S - 3, 4); ctx.fill(); };
    grid.forEach((r, y) => r.forEach((v, x) => v && cell(x, y, v)));
    piece.s.forEach((r, j) => r.forEach((v, i) => v && cell(piece.x + i, piece.y + j, piece.c)));
  };
  const act = (a) => {
    if (!alive) return;
    if (a === 'left') move(-1, 0);
    if (a === 'right') move(1, 0);
    if (a === 'down') move(0, 1);
    if (a === 'rot') { const r = rot(piece.s); if (!hit(r, piece.x, piece.y)) piece.s = r; else if (!hit(r, piece.x - 1, piece.y)) { piece.s = r; piece.x--; } }
    if (a === 'drop') { while (move(0, 1)); lock(); }
    draw();
  };
  const key = (e) => { const m = { ArrowLeft: 'left', ArrowRight: 'right', ArrowDown: 'down', ArrowUp: 'rot', ' ': 'drop' }[e.key]; if (m) { act(m); e.preventDefault(); } };
  window.addEventListener('keydown', key);
  let sx, sy, st;
  canvas.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; st = Date.now(); });
  canvas.addEventListener('pointerup', (e) => { const dx = e.clientX - sx, dy = e.clientY - sy; if (Math.hypot(dx, dy) < 12) act('rot'); else if (Math.abs(dx) > Math.abs(dy)) act(dx > 0 ? 'right' : 'left'); else if (dy > 0) act(Date.now() - st < 220 ? 'drop' : 'down'); });
  spawn();
  draw();
  const t = setInterval(drop, 720);
  ui && ui('Tap to rotate, swipe to move, flick down to drop.');
  return { act, stop() { alive = false; clearInterval(t); window.removeEventListener('keydown', key); } };
}
