// Minimal SVG diagram builder. Styling comes from CSS classes so diagrams follow day/night themes.
export class Fig {
  constructor(w = 320, h = 230) {
    this.w = w; this.h = h; this.items = []; this.pts = {};
  }
  pt(name, x, y, opts = {}) {
    this.pts[name] = [x, y];
    if (opts.dot !== false) this.items.push(`<circle class="dg-dot" cx="${f(x)}" cy="${f(y)}" r="2.6"/>`);
    if (opts.label !== false) {
      const [dx, dy] = opts.off || this._autoOff(x, y);
      this.items.push(`<text class="dg-lbl" x="${f(x + dx)}" y="${f(y + dy)}" text-anchor="middle" dominant-baseline="central">${opts.text || name}</text>`);
    }
    return this;
  }
  _autoOff(x, y) {
    const cx = this.w / 2, cy = this.h / 2;
    const dx = x - cx, dy = y - cy;
    const L = Math.hypot(dx, dy) || 1;
    return [(dx / L) * 13, (dy / L) * 13];
  }
  P(n) { return this.pts[n]; }
  seg(a, b, cls = 'dg-line') {
    const [x1, y1] = Array.isArray(a) ? a : this.pts[a];
    const [x2, y2] = Array.isArray(b) ? b : this.pts[b];
    this.items.push(`<line class="${cls}" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}"/>`);
    return this;
  }
  poly(names, cls = 'dg-line') {
    for (let i = 0; i < names.length; i++) this.seg(names[i], names[(i + 1) % names.length], cls);
    return this;
  }
  circle(cx, cy, r, cls = 'dg-line') {
    this.items.push(`<circle class="${cls}" cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="none"/>`);
    return this;
  }
  text(x, y, t, cls = 'dg-note') {
    this.items.push(`<text class="${cls}" x="${f(x)}" y="${f(y)}" text-anchor="middle" dominant-baseline="central">${t}</text>`);
    return this;
  }
  // angle arc at vertex v between rays to a and b, optional label
  angle(v, a, b, label = '', r = 20, cls = 'dg-arc') {
    const [vx, vy] = this.pts[v];
    const [ax, ay] = this.pts[a];
    const [bx, by] = this.pts[b];
    let t1 = Math.atan2(ay - vy, ax - vx), t2 = Math.atan2(by - vy, bx - vx);
    let d = t2 - t1;
    while (d <= -Math.PI) d += 2 * Math.PI;
    while (d > Math.PI) d -= 2 * Math.PI;
    const x1 = vx + r * Math.cos(t1), y1 = vy + r * Math.sin(t1);
    const x2 = vx + r * Math.cos(t1 + d), y2 = vy + r * Math.sin(t1 + d);
    this.items.push(`<path class="${cls}" d="M${f(x1)},${f(y1)} A${r},${r} 0 0 ${d > 0 ? 1 : 0} ${f(x2)},${f(y2)}" fill="none"/>`);
    if (label) {
      const tm = t1 + d / 2;
      const lr = r + 12;
      this.items.push(`<text class="dg-ang" x="${f(vx + lr * Math.cos(tm))}" y="${f(vy + lr * Math.sin(tm))}" text-anchor="middle" dominant-baseline="central">${label}</text>`);
    }
    return this;
  }
  right(v, a, b, s = 10) {
    const [vx, vy] = this.pts[v];
    const u = unit(this.pts[a], [vx, vy]), w = unit(this.pts[b], [vx, vy]);
    const p1 = [vx + u[0] * s, vy + u[1] * s];
    const p2 = [p1[0] + w[0] * s, p1[1] + w[1] * s];
    const p3 = [vx + w[0] * s, vy + w[1] * s];
    this.items.push(`<path class="dg-arc" d="M${f(p1[0])},${f(p1[1])} L${f(p2[0])},${f(p2[1])} L${f(p3[0])},${f(p3[1])}" fill="none"/>`);
    return this;
  }
  tick(a, b, n = 1) {
    const [x1, y1] = this.pts[a], [x2, y2] = this.pts[b];
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const [ux, uy] = unit([x2, y2], [x1, y1]);
    const nx = -uy, ny = ux;
    for (let i = 0; i < n; i++) {
      const o = (i - (n - 1) / 2) * 4;
      const cx = mx + ux * o, cy = my + uy * o;
      this.items.push(`<line class="dg-tick" x1="${f(cx - nx * 5)}" y1="${f(cy - ny * 5)}" x2="${f(cx + nx * 5)}" y2="${f(cy + ny * 5)}"/>`);
    }
    return this;
  }
  arrow(a, b) {
    // parallel marker arrow in middle of segment
    const [x1, y1] = this.pts[a], [x2, y2] = this.pts[b];
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const [ux, uy] = unit([x2, y2], [x1, y1]);
    const nx = -uy, ny = ux;
    this.items.push(`<path class="dg-tick" d="M${f(mx - ux * 6 + nx * 5)},${f(my - uy * 6 + ny * 5)} L${f(mx)},${f(my)} L${f(mx - ux * 6 - nx * 5)},${f(my - uy * 6 - ny * 5)}" fill="none"/>`);
    return this;
  }
  label(a, b, t, side = 1, off = 12) {
    const [x1, y1] = this.pts[a], [x2, y2] = this.pts[b];
    const [ux, uy] = unit([x2, y2], [x1, y1]);
    this.items.push(`<text class="dg-note" x="${f((x1 + x2) / 2 - uy * off * side)}" y="${f((y1 + y2) / 2 + ux * off * side)}" text-anchor="middle" dominant-baseline="central">${t}</text>`);
    return this;
  }
  raw(s) { this.items.push(s); return this; }
  toString() {
    const pts = Object.entries(this.pts).map(([k, [x, y]]) => `${k}=${f(x)},${f(y)}`).join('|');
    return `<svg class="diagram" viewBox="0 0 ${this.w} ${this.h}" xmlns="http://www.w3.org/2000/svg" role="img" data-pts="${pts}">${this.items.join('')}</svg>`;
  }
}
const f = (n) => Math.round(n * 10) / 10;
function unit(to, from) {
  const dx = to[0] - from[0], dy = to[1] - from[1];
  const L = Math.hypot(dx, dy) || 1;
  return [dx / L, dy / L];
}
export const polar = (cx, cy, r, deg) => [cx + r * Math.cos((deg * Math.PI) / 180), cy - r * Math.sin((deg * Math.PI) / 180)];

// letter relabelling to vary proof questions
export function relabel(r, names, pool = 'ABCDEFGHJKLMNPQRSTUVWXYZ') {
  const letters = r.shuffle(pool.split('')).slice(0, names.length);
  const map = {};
  names.forEach((n, i) => (map[n] = letters[i]));
  const apply = (s) => s.replace(/[A-Z]/g, (c) => (c in map ? map[c] : c));
  // relabel only inside $...$ math segments (keeps English words intact)
  const LT = (s) => s.replace(/\$[^$]*\$/g, (m) => m.replace(/(\\[a-zA-Z]+)|([A-Z])/g, (all, cmd, c) => (cmd ? cmd : c in map ? map[c] : c)));
  return { map, L: apply, LT };
}
