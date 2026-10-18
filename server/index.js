import express from 'express';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, J, tx } from './db.js';
import { SYLLABUS, TIERS, generate, fromPaper, paperBank, chooseTemplate, publicQuestion, revealKey, publicReasons, byId } from './gen/index.js';
import { rng } from './gen/util.js';
import { gradeQuestion } from './math/grade.js';
import { getUser, saveUser, subjProg, templateStats, hasSeenTemplate, subjectStats, applyResult, checkTopicMaster, levelOf, BADGES, FRAMES, LEVELS, BASIC_TARGET, ADV_ATTEMPTS, ADV_ACC, gradeBand, award, frame } from './game.js';
import { getBots, botsEnabled } from './bots.js';
import { startCoach, runReviews } from './coach.js';
import { currentWindow, windowEnds, buildMock, MOCK_MINUTES, scoreOf, WINDOW_MS } from './mock.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '200kb' }));

// ---------- auth helpers ----------
const COOKIE = 'mmo_session';
const hash = (pw, salt) => crypto.scryptSync(pw, salt, 64).toString('hex');
function cookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}
function newSession(res, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  db.prepare('INSERT INTO sessions(token, user_id, created_at, expires_at) VALUES (?,?,?,?)').run(token, userId, now, now + 30 * 86400e3);
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 86400}${process.env.SECURE_COOKIE === '1' ? '; Secure' : ''}`);
}
function auth(req, res, next) {
  const token = cookies(req)[COOKIE];
  const s = token && db.prepare('SELECT * FROM sessions WHERE token=? AND expires_at>?').get(token, Date.now());
  if (!s) return res.status(401).json({ error: 'Please sign in.' });
  req.user = getUser(s.user_id);
  if (!req.user) return res.status(401).json({ error: 'Please sign in.' });
  req.token = token;
  next();
}
const logEvent = (userId, type, data) => db.prepare('INSERT INTO events(user_id, type, data, created_at) VALUES (?,?,?,?)').run(userId, type, data ? JSON.stringify(data) : null, Date.now());

const attemptsByIp = new Map();
function throttle(req, res, next) {
  const k = req.ip;
  const now = Date.now();
  const a = (attemptsByIp.get(k) || []).filter((t) => now - t < 10 * 60e3);
  if (a.length > 30) return res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' });
  a.push(now);
  attemptsByIp.set(k, a);
  next();
}

// ---------- auth routes ----------
app.post('/api/auth/register', throttle, (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || !/^[A-Za-z0-9_.\-]{3,20}$/.test(username)) return res.status(400).json({ error: 'Username: 3–20 letters, numbers, _ . or -' });
  if (typeof password !== 'string' || password.length < 6 || password.length > 100) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  if (db.prepare('SELECT 1 FROM users WHERE username=?').get(username)) return res.status(409).json({ error: 'That username is taken.' });
  const salt = crypto.randomBytes(16).toString('hex');
  const r = rng(crypto.randomInt(1e9));
  const avatar = { curve: r.pick(['rose', 'lissajous', 'spiro', 'golden', 'cardioid', 'butterfly']), hue: r.int(0, 359), k: r.int(2, 6), frame: 'none' };
  const info = db.prepare('INSERT INTO users(username, pass_hash, salt, created_at, last_seen, avatar) VALUES (?,?,?,?,?,?)').run(username, hash(password, salt), salt, Date.now(), Date.now(), JSON.stringify(avatar));
  newSession(res, Number(info.lastInsertRowid));
  logEvent(Number(info.lastInsertRowid), 'visit', { first: true });
  res.json({ ok: true });
});

app.post('/api/auth/login', throttle, (req, res) => {
  const { username, password } = req.body || {};
  const u = typeof username === 'string' && db.prepare('SELECT * FROM users WHERE username=?').get(username);
  if (!u || typeof password !== 'string' || !crypto.timingSafeEqual(Buffer.from(hash(password, u.salt), 'hex'), Buffer.from(u.pass_hash, 'hex'))) return res.status(401).json({ error: 'Wrong username or password.' });
  newSession(res, u.id);
  logEvent(u.id, 'visit', { login: true });
  res.json({ ok: true });
});

app.post('/api/auth/logout', auth, (req, res) => {
  db.prepare('DELETE FROM sessions WHERE token=?').run(req.token);
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; Max-Age=0`);
  res.json({ ok: true });
});

// ---------- profile ----------
function meView(u) {
  const subjects = {};
  for (const s of ['emath', 'amath']) {
    const p = subjProg(u, s);
    subjects[s] = { ...subjectStats(u.id, s), tier: p.tier, basicDone: p.basicDone, basicTarget: BASIC_TARGET, vault: p.vault, xp: p.xp || 0 };
    const ch = db.prepare(`SELECT COUNT(*) n, SUM(counted) c, SUM(CASE WHEN counted=1 AND correct=1 THEN 1 ELSE 0 END) k FROM attempts WHERE user_id=? AND subject=? AND tier='challenging'`).get(u.id, s);
    subjects[s].advReq = { attempts: ch.n || 0, need: ADV_ATTEMPTS, acc: ch.c ? ch.k / ch.c : null, needAcc: ADV_ACC };
  }
  const review = db.prepare('SELECT * FROM reviews WHERE user_id=? AND read_at IS NULL ORDER BY created_at DESC LIMIT 1').get(u.id);
  const vaultOpen = db.prepare('SELECT COUNT(*) n FROM mistakes WHERE user_id=? AND resolved_at IS NULL').get(u.id).n;
  return {
    id: u.id,
    username: u.username,
    xp: u.xp,
    level: levelOf(u.xp),
    streak: u.streak,
    bestStreak: u.best_streak,
    dayStreak: u.day_streak,
    settings: u.settings,
    avatar: u.avatar,
    badges: u.badges,
    frames: u.frames,
    subjects,
    vaultUnlocked: Object.values(u.progress).some((p) => p && p.vault),
    vaultOpen,
    review: review ? { id: review.id, created_at: review.created_at, ...J.parse(review.body, {}) } : null,
    createdAt: u.created_at,
  };
}

app.get('/api/me', auth, (req, res) => {
  const u = req.user;
  const lastEv = db.prepare('SELECT MAX(created_at) t FROM events WHERE user_id=?').get(u.id).t || 0;
  if (Date.now() - lastEv > 30 * 60e3) logEvent(u.id, 'visit');
  saveUser(u);
  res.json(meView(u));
});

app.get('/api/meta', (req, res) => {
  res.json({ syllabus: SYLLABUS, reasons: publicReasons(), badges: BADGES, frames: FRAMES, levels: LEVELS, tiers: TIERS, mockMinutes: MOCK_MINUTES });
});

app.patch('/api/me/settings', auth, (req, res) => {
  const u = req.user;
  const b = req.body || {};
  const s = u.settings;
  if (['system', 'light', 'dark'].includes(b.theme)) s.theme = b.theme;
  if (['serif', 'sans', 'humanist'].includes(b.font)) s.font = b.font;
  if (Number.isFinite(b.pomodoro) && b.pomodoro >= 10 && b.pomodoro <= 180) s.pomodoro = Math.round(b.pomodoro);
  if (typeof b.internalKb === 'boolean') s.internalKb = b.internalKb;
  if (typeof b.autoTimer === 'boolean') s.autoTimer = b.autoTimer;
  if (typeof b.motion === 'boolean') s.motion = b.motion;
  saveUser(u);
  res.json(meView(u));
});

app.patch('/api/me/avatar', auth, (req, res) => {
  const u = req.user;
  const b = req.body || {};
  const a = u.avatar;
  if (['rose', 'lissajous', 'spiro', 'golden', 'cardioid', 'butterfly'].includes(b.curve)) a.curve = b.curve;
  if (Number.isInteger(b.hue) && b.hue >= 0 && b.hue < 360) a.hue = b.hue;
  if (Number.isInteger(b.k) && b.k >= 2 && b.k <= 9) a.k = b.k;
  if (typeof b.frame === 'string' && u.frames.includes(b.frame)) a.frame = b.frame;
  saveUser(u);
  res.json(meView(u));
});

app.post('/api/reviews/:id/read', auth, (req, res) => {
  db.prepare('UPDATE reviews SET read_at=? WHERE id=? AND user_id=?').run(Date.now(), Number(req.params.id), req.user.id);
  res.json({ ok: true });
});
app.get('/api/reviews', auth, (req, res) => {
  const rows = db.prepare('SELECT * FROM reviews WHERE user_id=? ORDER BY created_at DESC LIMIT 20').all(req.user.id);
  res.json(rows.map((r) => ({ id: r.id, created_at: r.created_at, read: !!r.read_at, ...J.parse(r.body, {}) })));
});

const lastPing = new Map();
app.post('/api/ping', auth, (req, res) => {
  const now = Date.now();
  const t = lastPing.get(req.user.id) || 0;
  if (now - t > 50e3) {
    lastPing.set(req.user.id, now);
    logEvent(req.user.id, 'heartbeat', { view: String((req.body || {}).view || '').slice(0, 20) });
  }
  if ((req.body || {}).event === 'break') logEvent(req.user.id, 'break', { game: String(req.body.game || '').slice(0, 20) });
  res.json({ ok: true });
});

// ---------- questions ----------
function storeQuestion(userId, q, context) {
  const qid = crypto.randomBytes(9).toString('base64url');
  db.prepare('INSERT INTO questions(qid, user_id, template_id, subject, topic, tier, context, data, created_at) VALUES (?,?,?,?,?,?,?,?,?)').run(qid, userId, q.templateId, q.subject, q.topic, q.tier, context, JSON.stringify(q), Date.now());
  return qid;
}
function loadQuestion(userId, qid) {
  const row = db.prepare('SELECT * FROM questions WHERE qid=? AND user_id=?').get(qid, userId);
  if (!row) return null;
  return { row, q: J.parse(row.data, null) };
}

app.get('/api/next', auth, (req, res) => {
  const u = req.user;
  const subject = req.query.subject === 'amath' ? 'amath' : 'emath';
  const prog = subjProg(u, subject);
  const unlocked = TIERS.slice(0, TIERS.indexOf(prog.tier) + 1);
  const r = rng(crypto.randomInt(2 ** 31));
  let tier = req.query.tier && unlocked.includes(req.query.tier) ? req.query.tier : null;
  if (!tier) tier = unlocked.length === 1 || r.chance(0.7) ? unlocked[unlocked.length - 1] : r.pick(unlocked.slice(0, -1));
  const topic = typeof req.query.topic === 'string' && SYLLABUS[subject].topics[req.query.topic] ? req.query.topic : null;
  let q;
  const papers = paperBank().filter((p) => p.subject === subject && (!topic || p.topic === topic));
  if (tier === 'advanced' && papers.length && r.chance(0.35)) q = fromPaper(r.pick(papers));
  else {
    const forced = typeof req.query.tpl === 'string' && byId[req.query.tpl] && byId[req.query.tpl].subject === subject ? byId[req.query.tpl] : null;
    const t = forced || chooseTemplate(subject, tier, templateStats(u.id, subject), r, topic);
    q = generate(t.id, tier, crypto.randomInt(2 ** 31));
  }
  const qid = storeQuestion(u.id, q, 'learn');
  res.json({ qid, context: 'learn', firstOfType: !hasSeenTemplate(u.id, q.templateId), ...publicQuestion(q), unlockedTiers: unlocked });
});

function recordAnswer(u, row, q, answers, timeMs, context) {
  const graded = gradeQuestion(q, answers);
  const firstOfType = !hasSeenTemplate(u.id, q.templateId);
  const now = Date.now();
  let gained;
  tx(() => {
    db.prepare('INSERT INTO attempts(user_id, qid, template_id, subject, topic, tier, context, correct, counted, time_ms, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(
      u.id, row.qid, q.templateId, q.subject, q.topic, q.tier, context, graded.ok ? 1 : 0, firstOfType ? 0 : 1, Math.max(0, Math.min(Number(timeMs) || 0, 6 * 3600e3)), now
    );
    db.prepare('UPDATE questions SET answered_at=?, data=? WHERE qid=?').run(now, JSON.stringify({ ...q, answers, graded }), row.qid);
    if (!graded.ok && (context === 'learn' || context === 'mock')) {
      db.prepare('INSERT OR IGNORE INTO mistakes(user_id, qid, template_id, subject, topic, created_at) VALUES (?,?,?,?,?,?)').run(u.id, row.qid, q.templateId, q.subject, q.topic, now);
    }
    if (context === 'vault' && q.origin) {
      if (graded.ok) db.prepare('UPDATE mistakes SET resolved_at=?, retries=retries+1 WHERE user_id=? AND qid=?').run(now, u.id, q.origin);
      else db.prepare('UPDATE mistakes SET retries=retries+1 WHERE user_id=? AND qid=?').run(u.id, q.origin);
    }
    gained = applyResult(u, q, graded, { context, firstOfType });
    const prog = subjProg(u, q.subject);
    prog.xp = (prog.xp || 0) + gained.xp;
    if (context === 'vault' && graded.ok) {
      const n = db.prepare('SELECT COUNT(*) n FROM mistakes WHERE user_id=? AND resolved_at IS NOT NULL').get(u.id).n;
      if (n >= 10) award(u, 'redeem10', gained);
    }
    checkTopicMaster(u, q.subject, gained);
    saveUser(u);
  });
  logEvent(u.id, 'answer', { tpl: q.templateId, ok: graded.ok, ctx: context });
  return { graded, firstOfType, gained };
}

app.post('/api/answer', auth, (req, res) => {
  const u = req.user;
  const { qid, answers, timeMs } = req.body || {};
  const L = loadQuestion(u.id, String(qid || ''));
  if (!L) return res.status(404).json({ error: 'Question not found.' });
  if (L.row.context === 'mock') return res.status(400).json({ error: 'Mock questions are submitted with the paper.' });
  if (L.row.answered_at) return res.status(409).json({ error: 'Already answered.' });
  const { graded, firstOfType, gained } = recordAnswer(u, L.row, L.q, answers || {}, timeMs, L.row.context);
  res.json({
    ok: graded.ok,
    parts: graded.parts,
    reveal: revealKey(L.q),
    solution: L.q.solution,
    firstOfType,
    gained,
    me: meView(getUser(u.id)),
  });
});

// ---------- mistake vault ----------
app.get('/api/vault', auth, (req, res) => {
  const u = req.user;
  if (!Object.values(u.progress).some((p) => p && p.vault)) return res.status(403).json({ error: 'locked' });
  const rows = db.prepare('SELECT m.*, q.data FROM mistakes m JOIN questions q ON q.qid = m.qid WHERE m.user_id=? ORDER BY m.resolved_at IS NOT NULL, m.created_at DESC LIMIT 300').all(u.id);
  res.json(rows.map((r) => {
    const q = J.parse(r.data, {});
    return { qid: r.qid, subject: r.subject, topic: r.topic, title: q.title, tier: q.tier, stem: q.stem, created_at: r.created_at, resolved: !!r.resolved_at, retries: r.retries, source: q.source };
  }));
});

app.get('/api/vault/:qid', auth, (req, res) => {
  const L = loadQuestion(req.user.id, req.params.qid);
  if (!L) return res.status(404).json({ error: 'not found' });
  res.json({ ...publicQuestion(L.q), answers: L.q.answers, graded: L.q.graded, reveal: revealKey(L.q), solution: L.q.solution });
});

app.post('/api/vault/:qid/retry', auth, (req, res) => {
  const u = req.user;
  const m = db.prepare('SELECT * FROM mistakes WHERE user_id=? AND qid=?').get(u.id, req.params.qid);
  if (!m) return res.status(404).json({ error: 'not found' });
  const L = loadQuestion(u.id, m.qid);
  let q;
  if (m.template_id.startsWith('paper:')) {
    const e = paperBank().find((p) => 'paper:' + p.id === m.template_id);
    q = e ? fromPaper(e) : L.q;
  } else q = generate(m.template_id, L.q.tier, crypto.randomInt(2 ** 31));
  q.origin = m.qid;
  const qid = storeQuestion(u.id, q, 'vault');
  res.json({ qid, context: 'vault', ...publicQuestion(q) });
});

// ---------- syllabus / stats ----------
app.get('/api/progress', auth, (req, res) => {
  const subject = req.query.subject === 'amath' ? 'amath' : 'emath';
  const st = subjectStats(req.user.id, subject);
  const recent = db.prepare('SELECT correct, counted, created_at, topic FROM attempts WHERE user_id=? AND subject=? ORDER BY created_at DESC LIMIT 40').all(req.user.id, subject);
  res.json({ ...st, recent });
});

// ---------- leaderboard ----------
app.get('/api/leaderboard', auth, (req, res) => {
  const scope = ['emath', 'amath'].includes(req.query.scope) ? req.query.scope : 'all';
  const users = db.prepare('SELECT id, username, xp, best_streak, avatar, badges, progress FROM users').all();
  let rows = users.map((u) => {
    const prog = J.parse(u.progress, {});
    const av = J.parse(u.avatar, {});
    return {
      id: 'u' + u.id, username: u.username, me: u.id === req.user.id,
      xp: scope === 'all' ? u.xp : (prog[scope] && prog[scope].xp) || 0,
      badges: J.parse(u.badges, []), avatar: av, frame: av.frame || 'none', bestStreak: u.best_streak,
    };
  });
  if (botsEnabled(users.length)) {
    rows = rows.concat(getBots().filter((b) => scope === 'all' || b.subjects.includes(scope)).map((b) => ({
      id: b.id, username: b.username, xp: scope === 'all' ? b.xp : scope === 'emath' ? b.emXp : b.xp - b.emXp, badges: b.badges, avatar: b.avatar, frame: b.frame, bestStreak: b.bestStreak,
    })));
  }
  rows = rows.filter((r) => r.xp > 0 || r.me).sort((a, b) => b.xp - a.xp);
  rows.forEach((r, i) => { r.rank = i + 1; r.level = levelOf(r.xp); });
  const mine = rows.find((r) => r.me);
  res.json({ scope, rows: rows.slice(0, 100), me: mine || null, total: rows.length });
});

// ---------- mock papers ----------
app.get('/api/mock', auth, (req, res) => {
  const u = req.user;
  const w = currentWindow();
  const out = { window: w, endsAt: windowEnds(w), minutes: MOCK_MINUTES, size: 10, subjects: {} };
  for (const s of ['emath', 'amath']) {
    const m = db.prepare('SELECT * FROM mocks WHERE user_id=? AND window=? AND subject=?').get(u.id, w, s);
    out.subjects[s] = m ? { started_at: m.started_at, submitted_at: m.submitted_at, score: m.score, grade: m.grade, deadline: m.started_at + MOCK_MINUTES * 60e3 } : null;
  }
  const hist = db.prepare('SELECT window, subject, score, grade, submitted_at FROM mocks WHERE user_id=? AND submitted_at IS NOT NULL ORDER BY submitted_at DESC LIMIT 10').all(u.id);
  out.history = hist;
  // window leaderboard
  out.board = db.prepare('SELECT u.username, m.subject, m.score, m.grade FROM mocks m JOIN users u ON u.id=m.user_id WHERE m.window=? AND m.submitted_at IS NOT NULL ORDER BY m.score DESC LIMIT 10').all(w);
  res.json(out);
});

app.post('/api/mock/start', auth, (req, res) => {
  const u = req.user;
  const subject = req.body && req.body.subject === 'amath' ? 'amath' : 'emath';
  const w = currentWindow();
  let m = db.prepare('SELECT * FROM mocks WHERE user_id=? AND window=? AND subject=?').get(u.id, w, subject);
  if (m && m.submitted_at) return res.status(409).json({ error: 'You have already sat this paper. A new one is released every 2 hours.' });
  let qids;
  if (!m) {
    const qs = buildMock(subject, w);
    qids = qs.map((q) => storeQuestion(u.id, q, 'mock'));
    db.prepare('INSERT INTO mocks(user_id, window, subject, started_at, qids) VALUES (?,?,?,?,?)').run(u.id, w, subject, Date.now(), JSON.stringify(qids));
    logEvent(u.id, 'mock_start', { subject, window: w });
    m = db.prepare('SELECT * FROM mocks WHERE user_id=? AND window=? AND subject=?').get(u.id, w, subject);
  } else qids = J.parse(m.qids, []);
  const questions = qids.map((qid) => { const L = loadQuestion(u.id, qid); return { qid, ...publicQuestion(L.q) }; });
  res.json({ subject, window: w, startedAt: m.started_at, deadline: m.started_at + MOCK_MINUTES * 60e3, questions });
});

app.post('/api/mock/submit', auth, (req, res) => {
  const u = req.user;
  const subject = req.body && req.body.subject === 'amath' ? 'amath' : 'emath';
  const w = Number(req.body && req.body.window);
  const m = db.prepare('SELECT * FROM mocks WHERE user_id=? AND window=? AND subject=?').get(u.id, w, subject);
  if (!m) return res.status(404).json({ error: 'No paper in progress.' });
  if (m.submitted_at) return res.status(409).json({ error: 'Already submitted.' });
  const late = Date.now() > m.started_at + MOCK_MINUTES * 60e3 + 120e3;
  const answers = (req.body && req.body.answers) || {};
  const qids = J.parse(m.qids, []);
  let got = 0, tot = 0;
  const results = [];
  const gainedAll = { xp: 0, badges: [], frames: [], unlocks: [] };
  for (const qid of qids) {
    const L = loadQuestion(u.id, qid);
    const ans = late ? {} : answers[qid] || {};
    const { graded, gained } = recordAnswer(getUser(u.id), L.row, L.q, ans, 0, 'mock');
    const sc = scoreOf(L.q, graded);
    got += sc.got; tot += sc.tot;
    gainedAll.xp += gained.xp;
    gainedAll.badges.push(...gained.badges); gainedAll.frames.push(...gained.frames); gainedAll.unlocks.push(...gained.unlocks);
    results.push({ qid, ok: graded.ok, parts: graded.parts, score: sc, reveal: revealKey(L.q), solution: L.q.solution, title: L.q.title, topic: L.q.topic });
  }
  const pct = tot ? (got / tot) * 100 : 0;
  const grade = gradeBand(pct);
  db.prepare('UPDATE mocks SET submitted_at=?, score=?, grade=? WHERE user_id=? AND window=? AND subject=?').run(Date.now(), pct, grade, u.id, w, subject);
  const fresh = getUser(u.id);
  award(fresh, 'mock', gainedAll);
  const bonus = Math.round(pct * 1.5);
  fresh.xp += bonus;
  subjProg(fresh, subject).xp = (subjProg(fresh, subject).xp || 0) + bonus;
  gainedAll.xp += bonus;
  if (grade === 'A1') { award(fresh, 'a1', gainedAll); frame(fresh, 'laurel', gainedAll); }
  saveUser(fresh);
  logEvent(u.id, 'mock_submit', { subject, pct, grade });
  res.json({ pct, grade, late, results, gained: gainedAll, me: meView(getUser(u.id)) });
});

// ---------- admin ----------
app.post('/api/admin/run-reviews', async (req, res) => {
  if (!process.env.ADMIN_TOKEN || req.headers['x-admin-token'] !== process.env.ADMIN_TOKEN) return res.status(403).json({ error: 'forbidden' });
  res.json(await runReviews());
});

// ---------- static ----------
app.use('/vendor/katex', express.static(path.join(ROOT, 'node_modules', 'katex', 'dist'), { maxAge: '30d' }));
app.use(express.static(path.join(ROOT, 'public'), { extensions: ['html'] }));
app.get(/^\/(?!api\/).*/, (req, res) => res.sendFile(path.join(ROOT, 'public', 'index.html')));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
  console.log(`MMO maths studio on http://localhost:${PORT}`);
  startCoach();
});
void WINDOW_MS; void byId;
