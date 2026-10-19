// Interactive diagrams: highlight angles, line segments and triangles named in the question or proof.
const NS = 'http://www.w3.org/2000/svg';

export function parsePts(svg) {
  const raw = svg && svg.getAttribute('data-pts');
  const pts = {};
  if (!raw) return pts;
  for (const part of raw.split('|')) {
    const m = part.match(/^([A-Z])=(-?[\d.]+),(-?[\d.]+)$/);
    if (m) pts[m[1]] = [Number(m[2]), Number(m[3])];
  }
  return pts;
}

// Find references in LaTeX / plain text: ∠ABC, △ABC, segments AB (only if both points exist).
export function refsIn(text, pts) {
  const out = [];
  const seen = new Set();
  const push = (r) => { const k = r.kind + ':' + r.key; if (!seen.has(k)) { seen.add(k); out.push(r); } };
  let s = String(text || '').replace(/\\angle\s*/g, '∠').replace(/\\triangle\s*/g, '△').replace(/\\text\{[^}]*\}/g, ' ');
  s = s.replace(/∠\s*([A-Z])([A-Z])([A-Z])/g, (m, a, v, b) => {
    if (pts[a] && pts[v] && pts[b]) push({ kind: 'ang', a, v, b, key: (a < b ? a + v + b : b + v + a), label: '∠' + a + v + b });
    return ' ';
  });
  s = s.replace(/△\s*([A-Z])([A-Z])([A-Z])/g, (m, a, b, c) => {
    if (pts[a] && pts[b] && pts[c]) push({ kind: 'tri', a, b, c, key: [a, b, c].sort().join(''), label: '△' + a + b + c });
    return ' ';
  });
  // only look for segments inside math ($...$) or in bare statements
  const math = /\$/.test(s) ? (s.match(/\$[^$]*\$/g) || []).join(' ') : s;
  const re = /(?<![A-Za-z\\])([A-Z])([A-Z])(?![A-Za-z])/g;
  let m;
  while ((m = re.exec(math))) {
    const [, a, b] = m;
    if (a !== b && pts[a] && pts[b]) push({ kind: 'seg', a, b, key: [a, b].sort().join(''), label: a + b });
  }
  return out;
}

export class Diagram {
  constructor(wrap) {
    this.svg = wrap.querySelector('svg');
    this.pts = parsePts(this.svg);
    this.layer = document.createElementNS(NS, 'g');
    this.layer.setAttribute('class', 'hl-layer');
    if (this.svg) this.svg.insertBefore(this.layer, this.svg.firstChild);
    this.on = new Map();
  }
  has() { return this.svg && Object.keys(this.pts).length > 0; }
  _draw(r, tone) {
    const P = this.pts;
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'hl hl-' + tone);
    if (r.kind === 'seg') {
      const [x1, y1] = P[r.a], [x2, y2] = P[r.b];
      g.innerHTML = `<line class="hl-seg" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" pathLength="1"/>`;
    } else if (r.kind === 'ang') {
      const [vx, vy] = P[r.v], [ax, ay] = P[r.a], [bx, by] = P[r.b];
      const t1 = Math.atan2(ay - vy, ax - vx);
      let d = Math.atan2(by - vy, bx - vx) - t1;
      while (d <= -Math.PI) d += 2 * Math.PI;
      while (d > Math.PI) d -= 2 * Math.PI;
      const R = 26;
      const x1 = vx + R * Math.cos(t1), y1 = vy + R * Math.sin(t1);
      const x2 = vx + R * Math.cos(t1 + d), y2 = vy + R * Math.sin(t1 + d);
      g.innerHTML = `<path class="hl-ang" d="M${vx},${vy} L${x1},${y1} A${R},${R} 0 0 ${d > 0 ? 1 : 0} ${x2},${y2} Z"/>` +
        `<line class="hl-seg" x1="${vx}" y1="${vy}" x2="${ax}" y2="${ay}" pathLength="1"/><line class="hl-seg" x1="${vx}" y1="${vy}" x2="${bx}" y2="${by}" pathLength="1"/>`;
    } else if (r.kind === 'tri') {
      const pts = [r.a, r.b, r.c].map((k) => P[k].join(',')).join(' ');
      g.innerHTML = `<polygon class="hl-tri" points="${pts}" pathLength="1"/>`;
    }
    this.layer.append(g);
    return g;
  }
  toggle(r, tone = 'a') {
    const k = r.kind + ':' + r.key;
    if (this.on.has(k)) { this.on.get(k).remove(); this.on.delete(k); return false; }
    this.on.set(k, this._draw(r, tone));
    return true;
  }
  show(refs, tone = 'a') {
    this.clear();
    refs.forEach((r) => this.on.set(r.kind + ':' + r.key, this._draw(r, tone)));
  }
  clear() { this.on.forEach((g) => g.remove()); this.on.clear(); }
}
