// Generative avatars (parametric curves), frames, badge emblems and UI icons. No emoji anywhere.

function curvePath(curve, k = 3) {
  const pts = [];
  const N = 420;
  for (let j = 0; j <= N; j++) {
    const t = (j / N) * Math.PI * 2;
    let x, y;
    switch (curve) {
      case 'rose': { const r = Math.cos(k * t); x = r * Math.cos(t); y = r * Math.sin(t); break; }
      case 'lissajous': { x = Math.sin((k) * t + Math.PI / 2); y = Math.sin((k + 1) * t); break; }
      case 'spiro': { const R = 1, rr = 1 / (k + 1), d = 0.55; const tt = t * (k + 1); x = (R - rr) * Math.cos(tt) + d * Math.cos(((R - rr) / rr) * tt); y = (R - rr) * Math.sin(tt) - d * Math.sin(((R - rr) / rr) * tt); x /= 1.1; y /= 1.1; break; }
      case 'golden': { const tt = t * 3; const r = 0.035 * Math.exp(0.306 * tt * (0.9 + k * 0.04)); x = Math.min(1, r) * Math.cos(tt); y = Math.min(1, r) * Math.sin(tt); break; }
      case 'cardioid': { const r = (1 + Math.cos(t)) / 2 * (0.75 + 0.05 * k) + 0.1 * Math.cos(k * t); x = r * Math.cos(t) - 0.35; y = r * Math.sin(t); break; }
      case 'butterfly': { const tt = t * 6; const r = (Math.exp(Math.cos(tt)) - 2 * Math.cos(4 * tt) - Math.pow(Math.sin(tt / 12), 5)) / 4.2; x = r * Math.sin(tt); y = -r * Math.cos(tt) + 0.2; break; }
      default: { x = Math.cos(t); y = Math.sin(t); }
    }
    pts.push([50 + x * 30, 50 + y * 30]);
  }
  return 'M' + pts.map((p) => p[0].toFixed(2) + ',' + p[1].toFixed(2)).join('L');
}

let gid = 0;
export function avatarSVG(av = {}, size = 44, frame) {
  const id = 'av' + ++gid;
  const hue = av.hue ?? 260;
  const f = frame ?? av.frame ?? 'none';
  const c1 = `hsl(${hue} 62% 60%)`, c2 = `hsl(${(hue + 70) % 360} 62% 52%)`;
  const bg = `hsl(${hue} 45% 50% / 0.12)`;
  const path = curvePath(av.curve || 'rose', av.k || 3);
  return `<span class="avatar" style="width:${size}px;height:${size}px"><svg viewBox="0 0 100 100" aria-hidden="true">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
    ${frameDefs(id, f)}</defs>
    <circle cx="50" cy="50" r="${f === 'none' ? 47 : 41}" fill="${bg}" stroke="${c1}" stroke-opacity=".25"/>
    <g transform="translate(50 50) scale(${f === 'none' ? 1 : 0.86}) translate(-50 -50)"><path d="${path}" fill="none" stroke="url(#${id})" stroke-width="2.1" stroke-linejoin="round"/></g>
    ${frameSVG(id, f)}
  </svg></span>`;
}

function frameDefs(id, f) {
  if (f === 'aurora') return `<linearGradient id="${id}f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a5fd0"/><stop offset=".5" stop-color="#2f9fe0"/><stop offset="1" stop-color="#14a99a"/></linearGradient>`;
  if (f === 'laurel') return `<linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8c766"/><stop offset="1" stop-color="#b8872c"/></linearGradient>`;
  if (f === 'prism') return `<linearGradient id="${id}f" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9a82ec"/><stop offset="1" stop-color="#4fb6f2"/></linearGradient>`;
  return '';
}
function frameSVG(id, f) {
  switch (f) {
    case 'orbit': return `<circle cx="50" cy="50" r="46" fill="none" stroke="#2f9fe0" stroke-width="2" stroke-dasharray="2 5" stroke-linecap="round"/><circle cx="50" cy="4" r="3.4" fill="#14a99a"/>`;
    case 'helix': {
      let d1 = '', d2 = '';
      for (let j = 0; j <= 120; j++) { const t = (j / 120) * Math.PI * 2; const r1 = 46 + 2.6 * Math.sin(t * 12), r2 = 46 - 2.6 * Math.sin(t * 12); d1 += (j ? 'L' : 'M') + (50 + r1 * Math.cos(t)).toFixed(1) + ',' + (50 + r1 * Math.sin(t)).toFixed(1); d2 += (j ? 'L' : 'M') + (50 + r2 * Math.cos(t)).toFixed(1) + ',' + (50 + r2 * Math.sin(t)).toFixed(1); }
      return `<path d="${d1}" fill="none" stroke="#7a5fd0" stroke-width="1.6"/><path d="${d2}" fill="none" stroke="#14a99a" stroke-width="1.6"/>`;
    }
    case 'prism': return `<polygon points="${[0, 1, 2, 3, 4, 5].map((i) => { const a = (Math.PI / 3) * i - Math.PI / 2; return (50 + 47 * Math.cos(a)).toFixed(1) + ',' + (50 + 47 * Math.sin(a)).toFixed(1); }).join(' ')}" fill="none" stroke="url(#${id}f)" stroke-width="3.2" stroke-linejoin="round"/>`;
    case 'laurel': {
      let leaves = '';
      for (let s of [-1, 1]) for (let j = 0; j < 7; j++) {
        const a = Math.PI / 2 + s * (0.35 + j * 0.33);
        const x = 50 + 45 * Math.cos(a), y = 50 + 45 * Math.sin(a);
        const rot = (a * 180) / Math.PI + (s > 0 ? 60 : -60);
        leaves += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="5.2" ry="2.2" transform="rotate(${rot.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="url(#${id}f)"/>`;
      }
      return `<circle cx="50" cy="50" r="45" fill="none" stroke="url(#${id}f)" stroke-width="1.2" opacity=".6"/>${leaves}`;
    }
    case 'aurora': return `<circle cx="50" cy="50" r="46" fill="none" stroke="url(#${id}f)" stroke-width="4"/><circle cx="50" cy="50" r="41.5" fill="none" stroke="url(#${id}f)" stroke-width=".8" opacity=".7"/>`;
  }
  return '';
}

const TONE = { teal: ['#14a99a', '#7fe3d6'], violet: ['#7a5fd0', '#b9a8f2'], sky: ['#2f9fe0', '#9fd8ff'], gold: ['#b8872c', '#e8c766'] };
export function badgeSVG(id, meta, size = 46) {
  const b = meta || { shape: 'circle', tone: 'violet' };
  const [c1, c2] = TONE[b.tone] || TONE.violet;
  const gidd = 'bg' + ++gid;
  const poly = (n, r, rot = -90) => [...Array(n)].map((_, i) => { const a = ((rot + (360 / n) * i) * Math.PI) / 180; return (24 + r * Math.cos(a)).toFixed(1) + ',' + (24 + r * Math.sin(a)).toFixed(1); }).join(' ');
  let body = '';
  switch (b.shape) {
    case 'hex': body = `<polygon points="${poly(6, 20)}" fill="url(#${gidd})"/><polygon points="${poly(6, 12)}" fill="none" stroke="#fff" stroke-width="1.6" opacity=".9"/>`; break;
    case 'key': body = `<circle cx="24" cy="24" r="20" fill="url(#${gidd})"/><circle cx="19" cy="24" r="6" fill="none" stroke="#fff" stroke-width="2.2"/><path d="M25 24h11M32 24v5M36 24v4" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>`; break;
    case 'chevron': case 'chevron2': case 'chevron3': {
      const n = b.shape === 'chevron' ? 1 : b.shape === 'chevron2' ? 2 : 3;
      body = `<polygon points="${poly(4, 21, -90)}" fill="url(#${gidd})"/>` + [...Array(n)].map((_, i) => `<path d="M15 ${30 - i * 6 + (n - 1) * 3}l9-7 9 7" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
      break;
    }
    case 'circle': case 'circle2': body = `<circle cx="24" cy="24" r="20" fill="url(#${gidd})"/><circle cx="24" cy="24" r="12" fill="none" stroke="#fff" stroke-width="1.6"/>${b.shape === 'circle2' ? '<circle cx="24" cy="24" r="6" fill="none" stroke="#fff" stroke-width="1.6"/>' : '<circle cx="24" cy="24" r="2.4" fill="#fff"/>'}`; break;
    case 'square': case 'square2': body = `<rect x="5" y="5" width="38" height="38" rx="9" fill="url(#${gidd})"/><rect x="17" y="17" width="14" height="14" fill="#fff" opacity=".95"/>${b.shape === 'square2' ? '<rect x="12" y="12" width="24" height="24" fill="none" stroke="#fff" stroke-width="1.4"/>' : ''}`; break;
    case 'loop': body = `<circle cx="24" cy="24" r="20" fill="url(#${gidd})"/><path d="M14 24a10 10 0 1 0 3-7.1M14 13v5h5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`; break;
    case 'tri': body = `<polygon points="${poly(3, 22, -90)}" fill="url(#${gidd})"/><polygon points="${poly(3, 10, 90)}" fill="#fff" opacity=".85" transform="translate(0 2)"/>`; break;
    case 'star': body = `<polygon points="${[...Array(10)].map((_, i) => { const r = i % 2 ? 9 : 21; const a = ((-90 + 36 * i) * Math.PI) / 180; return (24 + r * Math.cos(a)).toFixed(1) + ',' + (24 + r * Math.sin(a)).toFixed(1); }).join(' ')}" fill="url(#${gidd})"/>`; break;
    case 'page': body = `<path d="M11 5h19l8 8v30H11z" fill="url(#${gidd})"/><path d="M16 20h16M16 26h16M16 32h10" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`; break;
    case 'laurel': body = `<circle cx="24" cy="24" r="20" fill="url(#${gidd})"/><text x="24" y="29" text-anchor="middle" font-family="Source Serif 4, Georgia, serif" font-size="15" font-weight="700" fill="#fff">A1</text><path d="M9 26c0-6 3-11 7-13M39 26c0-6-3-11-7-13" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/>`; break;
    case 'week': body = `<circle cx="24" cy="24" r="20" fill="url(#${gidd})"/>${[...Array(7)].map((_, i) => { const a = ((-90 + (360 / 7) * i) * Math.PI) / 180; return `<circle cx="${(24 + 12 * Math.cos(a)).toFixed(1)}" cy="${(24 + 12 * Math.sin(a)).toFixed(1)}" r="2.6" fill="#fff"/>`; }).join('')}`; break;
    default: body = `<circle cx="24" cy="24" r="20" fill="url(#${gidd})"/>`;
  }
  return `<svg viewBox="0 0 48 48" width="${size}" height="${size}" aria-label="${(b.name || id).replace(/"/g, '')}"><title>${b.name || id}</title><defs><linearGradient id="${gidd}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c2}"/><stop offset="1" stop-color="${c1}"/></linearGradient></defs>${body}</svg>`;
}

export const ICON = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M4 10.5L12 4l8 6.5V20H14.5v-5h-5v5H4z"/></svg>',
  learn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 19l5-14 4 9 2-4 5 9"/><circle cx="9" cy="5" r="1.2" fill="currentColor"/></svg>',
  vault: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="12" cy="12" r="3.6"/><path d="M12 8.4v-1M12 16.6v1M15.6 12h1M7.4 12h1" stroke-linecap="round"/></svg>',
  ranks: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M4 20V13h4.5v7M9.75 20V8h4.5v12M15.5 20v-9H20v9"/></svg>',
  me: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.2-3.6 4.1-5.5 7.5-5.5s6.3 1.9 7.5 5.5" stroke-linecap="round"/></svg>',
  mock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M6 3.5h9l3.5 3.5v13.5H6z" stroke-linejoin="round"/><path d="M9 11h6M9 14.5h6M9 18h3.5"/></svg>',
  syllabus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M5 5h14M5 10h14M5 15h9M5 20h6"/></svg>',
  lounge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M5 14c0 3.3 3.1 6 7 6s7-2.7 7-6V9H5z" stroke-linejoin="round"/><path d="M19 10.5h1.2a2.3 2.3 0 0 1 0 4.6H19M9 3.5c-.8 1 .8 2-.1 3M13 3.5c-.8 1 .8 2-.1 3"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  cross: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6.5" y="5" width="4" height="14" rx="1"/><rect x="13.5" y="5" width="4" height="14" rx="1"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5l12 7-12 7z"/></svg>',
  kb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="2.5" y="6" width="19" height="12" rx="2.5"/><path d="M6 10h.01M9.3 10h.01M12.6 10h.01M15.9 10h.01M18.5 10h.01M7 14.2h10"/></svg>',
  flame: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 21c-3.6 0-6-2.4-6-5.6 0-3.8 3.6-5.2 4.4-9.4 2.8 1.6 4 4 4 6 .9-.6 1.5-1.6 1.6-2.6 1.5 1.4 2 3.4 2 5.6C18 18.6 15.6 21 12 21z"/></svg>',
  spark: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14.5 6l-6 6 6 6"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M4 5.5c2.7-1 5.3-1 8 .8 2.7-1.8 5.3-1.8 8-.8V19c-2.7-1-5.3-1-8 .8-2.7-1.8-5.3-1.8-8-.8z"/><path d="M12 6.3v13.5"/></svg>',
};

export const BRAND = `<svg class="brand-mark" viewBox="0 0 64 64"><defs><linearGradient id="bm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a5fd0"/><stop offset=".55" stop-color="#2f9fe0"/><stop offset="1" stop-color="#14a99a"/></linearGradient></defs><rect width="64" height="64" rx="17" fill="url(#bm)"/><path d="M14 44 L24 20 L32 36 L40 20 L50 44" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="32" cy="50" r="2.6" fill="#fff"/></svg>`;

export function ring(pct, size = 64, label = '') {
  const r = 26, c = 2 * Math.PI * r;
  const id = 'rg' + ++gid;
  return `<svg class="lvl-ring" viewBox="0 0 64 64" width="${size}" height="${size}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--violet)"/><stop offset="1" stop-color="var(--teal)"/></linearGradient></defs><circle cx="32" cy="32" r="${r}" fill="none" stroke="var(--line-2)" stroke-width="5"/><circle cx="32" cy="32" r="${r}" fill="none" stroke="url(#${id})" stroke-width="5" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}" transform="rotate(-90 32 32)" style="transition:stroke-dashoffset 1s"/><text x="32" y="37" text-anchor="middle" font-size="16" font-weight="700" fill="var(--ink)" font-family="var(--f-read)">${label}</text></svg>`;
}
