// Progress, tiers, XP, levels, badges and frames.
import { db, J } from './db.js';
import { typeCount, SYLLABUS, byId } from './gen/index.js';

export const BASIC_TARGET = 12; // basic questions to finish the tutorial in a subject
export const ADV_ATTEMPTS = 30; // challenging attempts needed
export const ADV_ACC = 0.7; // and repeat accuracy on them

export const LEVELS = ['Point', 'Line', 'Ray', 'Segment', 'Angle', 'Triangle', 'Polygon', 'Circle', 'Ellipse', 'Parabola', 'Hyperbola', 'Spiral', 'Helix', 'Fractal', 'Manifold', 'Infinity'];
export function levelOf(xp) {
  // level n reached at 60·n·(n+1)/2 ... grows gently
  let n = 0;
  while (60 * ((n + 1) * (n + 2)) / 2 <= xp) n++;
  const cur = (60 * n * (n + 1)) / 2, next = (60 * (n + 1) * (n + 2)) / 2;
  return { level: n + 1, name: LEVELS[Math.min(n, LEVELS.length - 1)], into: xp - cur, span: next - cur };
}

export const BADGES = {
  found_emath: { name: 'Foundations · E', desc: 'Finished the E Math basic tutorial', shape: 'hex', tone: 'teal' },
  found_amath: { name: 'Foundations · A', desc: 'Finished the A Math basic tutorial', shape: 'hex', tone: 'violet' },
  vault: { name: 'Vault Keeper', desc: 'Unlocked the Mistake Vault', shape: 'key', tone: 'sky' },
  streak5: { name: 'Combo ×5', desc: '5 correct in a row', shape: 'chevron', tone: 'teal' },
  streak10: { name: 'Combo ×10', desc: '10 correct in a row', shape: 'chevron2', tone: 'sky' },
  streak25: { name: 'Unbroken', desc: '25 correct in a row', shape: 'chevron3', tone: 'violet' },
  q100: { name: 'Century', desc: '100 questions answered', shape: 'circle', tone: 'sky' },
  q500: { name: 'Five Hundred', desc: '500 questions answered', shape: 'circle2', tone: 'violet' },
  proof10: { name: 'Q.E.D.', desc: '10 proofs completed perfectly', shape: 'square', tone: 'teal' },
  proof50: { name: 'Proof Smith', desc: '50 proofs completed perfectly', shape: 'square2', tone: 'violet' },
  redeem10: { name: 'Redemption', desc: 'Cleared 10 questions from the Mistake Vault', shape: 'loop', tone: 'teal' },
  asc_emath: { name: 'Ascended · E', desc: 'Unlocked E Math Advanced', shape: 'tri', tone: 'teal' },
  asc_amath: { name: 'Ascended · A', desc: 'Unlocked A Math Advanced', shape: 'tri', tone: 'violet' },
  topic: { name: 'Topic Master', desc: 'Every question type in a topic seen, ≥ 90% repeat accuracy', shape: 'star', tone: 'sky' },
  mock: { name: 'Paper Runner', desc: 'Completed a timed mock paper', shape: 'page', tone: 'sky' },
  a1: { name: 'A1 Distinction', desc: 'Scored A1 on a mock paper', shape: 'laurel', tone: 'gold' },
  days7: { name: 'Seven Days', desc: 'Studied 7 days in a row', shape: 'week', tone: 'teal' },
};

export const FRAMES = {
  none: { name: 'Plain', how: 'Default' },
  orbit: { name: 'Orbit', how: 'Reach level 5' },
  helix: { name: 'Helix', how: 'Reach level 10' },
  prism: { name: 'Prism', how: 'Earn the Unbroken badge (25 combo)' },
  laurel: { name: 'Laurel', how: 'Score A1 on a mock paper' },
  aurora: { name: 'Aurora', how: 'Unlock Advanced in both subjects' },
};

export function getUser(id) {
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!u) return null;
  return {
    ...u,
    settings: J.parse(u.settings, {}),
    avatar: J.parse(u.avatar, {}),
    badges: J.parse(u.badges, []),
    frames: J.parse(u.frames, ['none']),
    progress: J.parse(u.progress, {}),
  };
}

export function saveUser(u) {
  db.prepare('UPDATE users SET xp=?, streak=?, best_streak=?, day_streak=?, last_day=?, settings=?, avatar=?, badges=?, frames=?, progress=?, last_seen=? WHERE id=?').run(
    u.xp, u.streak, u.best_streak, u.day_streak, u.last_day, JSON.stringify(u.settings), JSON.stringify(u.avatar), JSON.stringify(u.badges), JSON.stringify(u.frames), JSON.stringify(u.progress), Date.now(), u.id
  );
}

export function subjProg(u, subject) {
  if (!u.progress[subject]) u.progress[subject] = { basicDone: 0, tier: 'basic', vault: false, proofs: 0 };
  return u.progress[subject];
}

// Template-level stats (for adaptive selection and accuracy).
export function templateStats(userId, subject) {
  const rows = db.prepare(`SELECT template_id, COUNT(*) n, SUM(counted) counted, SUM(CASE WHEN counted=1 AND correct=1 THEN 1 ELSE 0 END) correct, MAX(created_at) lastAt FROM attempts WHERE user_id=? AND subject=? GROUP BY template_id`).all(userId, subject);
  const out = {};
  for (const r of rows) out[r.template_id] = { n: r.n, counted: r.counted || 0, correct: r.correct || 0, lastAt: r.lastAt };
  return out;
}

export function hasSeenTemplate(userId, templateId) {
  return !!db.prepare('SELECT 1 FROM attempts WHERE user_id=? AND template_id=? LIMIT 1').get(userId, templateId);
}

// The two progress bars + per-topic breakdown.
export function subjectStats(userId, subject) {
  const seenTypes = db.prepare(`SELECT topic, template_id, tier FROM attempts WHERE user_id=? AND subject=? AND template_id NOT LIKE 'paper:%' GROUP BY template_id, tier`).all(userId, subject);
  const total = typeCount(subject);
  const qSeen = db.prepare('SELECT COUNT(DISTINCT qid) n FROM attempts WHERE user_id=? AND subject=?').get(userId, subject).n;
  const acc = db.prepare('SELECT SUM(counted) c, SUM(CASE WHEN counted=1 AND correct=1 THEN 1 ELSE 0 END) k FROM attempts WHERE user_id=? AND subject=?').get(userId, subject);
  const topics = {};
  for (const [code, name] of Object.entries(SYLLABUS[subject].topics)) {
    if (code === 'MIX') continue;
    topics[code] = { name, total: typeCount(subject, code), seen: 0, counted: 0, correct: 0, questions: 0 };
  }
  for (const s of seenTypes) {
    const t = byId[s.template_id];
    const tp = t ? t.topic : s.topic;
    if (topics[tp]) topics[tp].seen++;
  }
  const per = db.prepare(`SELECT topic, COUNT(*) n, SUM(counted) c, SUM(CASE WHEN counted=1 AND correct=1 THEN 1 ELSE 0 END) k FROM attempts WHERE user_id=? AND subject=? GROUP BY topic`).all(userId, subject);
  for (const p of per) if (topics[p.topic]) { topics[p.topic].counted = p.c || 0; topics[p.topic].correct = p.k || 0; topics[p.topic].questions = p.n; }
  // MIX concept questions are attributed to their real topic via topic column already
  const seen = seenTypes.length;
  return {
    exposure: { seen: Math.min(seen, total), total, questions: qSeen, pct: total ? Math.min(1, seen / total) : 0 },
    accuracy: { counted: acc.c || 0, correct: acc.k || 0, pct: acc.c ? acc.k / acc.c : null },
    topics,
  };
}

function award(u, id, out) {
  if (!u.badges.includes(id)) { u.badges.push(id); out.badges.push(id); }
}
function frame(u, id, out) {
  if (!u.frames.includes(id)) { u.frames.push(id); out.frames.push(id); }
}

// Apply the result of one answered question. Returns XP & unlock info for the UI.
export function applyResult(u, q, result, { context, firstOfType }) {
  const out = { xp: 0, badges: [], frames: [], unlocks: [], levelUp: null, combo: 0 };
  const prog = subjProg(u, q.subject);
  const before = levelOf(u.xp).level;
  const base = { basic: 10, challenging: 20, advanced: 35 }[q.tier] || 10;
  if (result.ok) {
    u.streak += 1;
    u.best_streak = Math.max(u.best_streak, u.streak);
    out.xp += base;
    if (u.streak >= 3) out.xp += 2 * Math.min(u.streak, 10);
    if (context === 'vault') out.xp += 15;
  } else {
    u.streak = 0;
    out.xp += 2;
  }
  if (firstOfType) out.xp += 5;
  out.combo = u.streak;
  u.xp += out.xp;

  // daily streak
  const today = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10); // Singapore day
  if (u.last_day !== today) {
    const y = new Date(Date.now() + 8 * 3600e3 - 86400e3).toISOString().slice(0, 10);
    u.day_streak = u.last_day === y ? u.day_streak + 1 : 1;
    u.last_day = today;
  }
  if (u.day_streak >= 7) award(u, 'days7', out);

  if (q.tier === 'basic' && context === 'learn') prog.basicDone += 1;
  const isProof = q.parts.some((p) => p.kind === 'proof');
  if (isProof && result.ok) prog.proofs = (prog.proofs || 0) + 1;

  // tutorial completion -> challenging + vault
  if (prog.tier === 'basic' && prog.basicDone >= BASIC_TARGET) {
    prog.tier = 'challenging';
    if (!Object.values(u.progress).some((p) => p && p.vault)) out.unlocks.push({ kind: 'vault' });
    out.unlocks.push({ kind: 'tier', subject: q.subject, tier: 'challenging' });
    award(u, q.subject === 'emath' ? 'found_emath' : 'found_amath', out);
    prog.vault = true;
    award(u, 'vault', out);
  }
  // advanced unlock
  if (prog.tier === 'challenging') {
    const ch = db.prepare(`SELECT COUNT(*) n, SUM(counted) c, SUM(CASE WHEN counted=1 AND correct=1 THEN 1 ELSE 0 END) k FROM attempts WHERE user_id=? AND subject=? AND tier='challenging'`).get(u.id, q.subject);
    const n = (ch.n || 0) + (q.tier === 'challenging' ? 1 : 0);
    const c = (ch.c || 0) + (q.tier === 'challenging' && !firstOfType ? 1 : 0);
    const k = (ch.k || 0) + (q.tier === 'challenging' && !firstOfType && result.ok ? 1 : 0);
    if (n >= ADV_ATTEMPTS && c > 0 && k / c >= ADV_ACC) {
      prog.tier = 'advanced';
      out.unlocks.push({ kind: 'tier', subject: q.subject, tier: 'advanced' });
      award(u, q.subject === 'emath' ? 'asc_emath' : 'asc_amath', out);
    }
  }
  if (u.streak >= 5) award(u, 'streak5', out);
  if (u.streak >= 10) award(u, 'streak10', out);
  if (u.streak >= 25) { award(u, 'streak25', out); frame(u, 'prism', out); }
  const total = db.prepare('SELECT COUNT(*) n FROM attempts WHERE user_id=?').get(u.id).n + 1;
  if (total >= 100) award(u, 'q100', out);
  if (total >= 500) award(u, 'q500', out);
  const proofs = Object.values(u.progress).reduce((s, p) => s + ((p && p.proofs) || 0), 0);
  if (proofs >= 10) award(u, 'proof10', out);
  if (proofs >= 50) award(u, 'proof50', out);
  if (['emath', 'amath'].every((s) => u.progress[s] && u.progress[s].tier === 'advanced')) frame(u, 'aurora', out);

  const after = levelOf(u.xp);
  if (after.level > before) {
    out.levelUp = after;
    if (after.level >= 5) frame(u, 'orbit', out);
    if (after.level >= 10) frame(u, 'helix', out);
  }
  return out;
}

export function checkTopicMaster(u, subject, out) {
  const st = subjectStats(u.id, subject);
  for (const t of Object.values(st.topics)) {
    if (t.total && t.seen >= t.total && t.counted >= 10 && t.correct / t.counted >= 0.9) { award(u, 'topic', out); break; }
  }
}

export function gradeBand(pct) {
  const bands = [[75, 'A1'], [70, 'A2'], [65, 'B3'], [60, 'B4'], [55, 'C5'], [50, 'C6'], [45, 'D7'], [40, 'E8']];
  for (const [p, g] of bands) if (pct >= p) return g;
  return 'F9';
}

export { award, frame };
