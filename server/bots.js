// Seed players for the leaderboard until the real community is big enough.
// They are hidden automatically once real users >= BOT_CUTOFF (default 25), or always when SEED_BOTS=0.
import { rng } from './gen/util.js';
import { getMeta, setMeta } from './db.js';

const NAMES = [
  'quietvector', 'dy_dx_dan', 'kopi.siew.dai', 'LHS=RHS', 'nightowl_07', 'sinθ_enjoyer', 'Mochi', 'zero.divisor', 'tangent_tan', 'Arcsine',
  'rui.xin', 'chip&dale', 'surd_lord', 'pi_r_squared', 'Ky', 'eigenwhale', 'saltedegg', 'QEDee', 'jjjjjj', 'hyperbolic',
  'mathsmaxxing', 'lowkeyLogs', 'Rhombus', 'fennel', 'p.k.', 'hamster_hamilton', 'radian_rae', 'mint.tea', 'oliveoil', 'calc_cat',
  'xuan', 'bisector', 'ahmad.r', 'lemma_lime',
];

export function botsEnabled(realCount) {
  if (process.env.SEED_BOTS === '0') return false;
  const cutoff = Number(process.env.BOT_CUTOFF || 25);
  return realCount < cutoff;
}

export function getBots() {
  let launch = getMeta('launch_at');
  if (!launch) { launch = Date.now(); setMeta('launch_at', launch); }
  const days = (Date.now() - launch) / 86400000;
  const r = rng(20250101);
  return NAMES.map((name, i) => {
    const base = Math.round(300 + Math.pow(r.next(), 1.6) * 5200);
    const rate = 20 + r.next() * 140; // xp per day
    const wobble = Math.sin(days * (0.7 + r.next()) + i) * 20;
    const xp = Math.max(0, Math.round(base + rate * days + wobble));
    const em = r.next(), am = r.next();
    const subjects = em < 0.2 ? ['amath'] : am < 0.25 ? ['emath'] : ['emath', 'amath'];
    const badges = [];
    if (xp > 500) badges.push(subjects.includes('emath') ? 'found_emath' : 'found_amath', 'vault');
    if (xp > 1500) badges.push('streak5', 'q100');
    if (xp > 2600) badges.push('proof10');
    if (xp > 3800) badges.push('streak10', subjects.includes('amath') ? 'asc_amath' : 'asc_emath');
    if (xp > 5000 && r.next() < 0.5) badges.push('a1');
    const frame = xp > 5000 && badges.includes('a1') ? 'laurel' : xp > 2700 ? 'helix' : xp > 900 ? 'orbit' : 'none';
    return {
      id: 'b' + i,
      username: name,
      xp,
      subjects,
      emXp: subjects.includes('emath') ? Math.round(xp * (subjects.length === 2 ? 0.35 + em * 0.3 : 1)) : 0,
      badges,
      avatar: { curve: ['rose', 'lissajous', 'spiro', 'golden', 'cardioid', 'butterfly'][Math.floor(r.next() * 6)], hue: Math.floor(r.next() * 360), k: 2 + Math.floor(r.next() * 5) },
      frame,
      bestStreak: Math.round(3 + r.next() * 30),
      bot: true,
    };
  });
}
