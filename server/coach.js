// The 3-hourly coach: reads each student's activity log and writes a short review.
// Students with zero activity since their last review are skipped.
import { db, J, getMeta, setMeta } from './db.js';
import { SYLLABUS } from './gen/index.js';
import { subjectStats } from './game.js';

const PERIOD = Number(process.env.REVIEW_HOURS || 3) * 3600e3;

function pct(x) { return x == null ? '—' : Math.round(x * 100) + '%'; }

function summarise(userId, since) {
  const att = db.prepare('SELECT * FROM attempts WHERE user_id=? AND created_at>? ORDER BY created_at').all(userId, since);
  const ev = db.prepare('SELECT type, created_at, data FROM events WHERE user_id=? AND created_at>? ORDER BY created_at').all(userId, since);
  if (!att.length && !ev.some((e) => e.type !== 'heartbeat' || true)) return null;
  if (!att.length && !ev.length) return null;
  const counted = att.filter((a) => a.counted);
  const right = counted.filter((a) => a.correct);
  const times = att.map((a) => a.time_ms).filter((t) => t > 0);
  const byTopic = {};
  for (const a of att) {
    const k = a.subject + ':' + a.topic;
    byTopic[k] = byTopic[k] || { n: 0, wrong: 0, subject: a.subject, topic: a.topic };
    byTopic[k].n++;
    if (!a.correct) byTopic[k].wrong++;
  }
  const visits = ev.filter((e) => e.type === 'visit').length;
  const minutes = ev.filter((e) => e.type === 'heartbeat').length;
  const hours = ev.map((e) => new Date(e.created_at + 8 * 3600e3).getUTCHours());
  const late = hours.filter((h) => h >= 0 && h < 5).length;
  const mocks = ev.filter((e) => e.type === 'mock_submit').map((e) => J.parse(e.data, {}));
  const breaks = ev.filter((e) => e.type === 'break').length;
  const weak = Object.values(byTopic).filter((t) => t.wrong >= 2).sort((a, b) => b.wrong / b.n - a.wrong / a.n).slice(0, 2);
  const strong = Object.values(byTopic).filter((t) => t.n >= 3 && t.wrong === 0).slice(0, 2);
  return {
    attempts: att.length, counted: counted.length, correct: right.length, firsts: att.length - counted.length,
    acc: counted.length ? right.length / counted.length : null,
    avgSec: times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length / 1000) : null,
    visits, minutes, late, mocks, breaks, weak, strong,
    subjects: [...new Set(att.map((a) => a.subject))],
  };
}

function ruleText(name, s, overall) {
  const lines = [];
  const tn = (t) => `${SYLLABUS[t.subject].short} ${t.topic} (${SYLLABUS[t.subject].topics[t.topic] || t.topic})`;
  if (!s.attempts) {
    lines.push(`You dropped in ${s.visits || 1} time${s.visits === 1 ? '' : 's'} but didn't answer anything — even three questions keeps the thread warm.`);
  } else {
    lines.push(`${s.attempts} question${s.attempts === 1 ? '' : 's'} since the last note${s.minutes ? `, about ${s.minutes} active minute${s.minutes === 1 ? '' : 's'}` : ''}.`);
    if (s.acc != null) {
      if (s.acc >= 0.9) lines.push(`Repeat accuracy ${pct(s.acc)} — that's exam-ready consistency.`);
      else if (s.acc >= 0.7) lines.push(`Repeat accuracy ${pct(s.acc)}. Solid; the gap to 90% is usually careless steps, not concepts.`);
      else lines.push(`Repeat accuracy ${pct(s.acc)}. Slow down on the types you've seen before — read the solution steps once more before moving on.`);
    } else lines.push(`All ${s.firsts} were first encounters, so they only count towards coverage for now.`);
    if (s.avgSec != null) lines.push(s.avgSec < 25 ? `Average ${s.avgSec}s per question — fast. Make sure speed isn't costing marks.` : s.avgSec > 240 ? `Average ${Math.round(s.avgSec / 60)} min per question. Try timing yourself to build exam pace.` : `Average ${s.avgSec}s per question — a healthy pace.`);
  }
  if (s.strong.length) lines.push(`Strong: ${s.strong.map(tn).join(', ')}.`);
  if (s.weak.length) lines.push(`Focus next: ${s.weak.map(tn).join(', ')} — your Mistake Vault has them queued.`);
  if (s.mocks.length) lines.push(`Mock paper: ${s.mocks.map((m) => `${m.grade} (${Math.round(m.pct)}%)`).join(', ')}.`);
  if (s.late >= 3) lines.push('A lot of this was after midnight. Sleep consolidates what you practised — consider an earlier session.');
  for (const [sub, st] of Object.entries(overall)) {
    lines.push(`${SYLLABUS[sub].short}: ${st.exposure.seen}/${st.exposure.total} question types met, repeat accuracy ${pct(st.accuracy.pct)}.`);
  }
  return lines;
}

async function deepseekText(name, s, overall) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return null;
  const prompt = `You are a concise, warm but honest O-Level maths coach in Singapore. Write 3-5 short sentences (plain text, no emoji, no lists) reviewing this student's last few hours. Mention one specific strength and one specific next step.\nStudent: ${name}\nStats: ${JSON.stringify({ ...s, overall: Object.fromEntries(Object.entries(overall).map(([k, v]) => [k, { types: v.exposure, acc: v.accuracy }])) })}`;
  try {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      body: JSON.stringify({ model: process.env.DEEPSEEK_MODEL || 'deepseek-chat', messages: [{ role: 'user', content: prompt }], max_tokens: 300, temperature: 0.6 }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const j = await res.json();
    return j.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

export async function runReviews(now = Date.now()) {
  const users = db.prepare('SELECT id, username, created_at FROM users').all();
  let written = 0, skipped = 0;
  for (const u of users) {
    const last = db.prepare('SELECT MAX(created_at) t FROM reviews WHERE user_id=?').get(u.id).t || u.created_at;
    const s = summarise(u.id, last);
    if (!s || (!s.attempts && !s.visits)) { skipped++; continue; }
    const overall = {};
    for (const sub of ['emath', 'amath']) {
      const st = subjectStats(u.id, sub);
      if (st.exposure.questions) overall[sub] = st;
    }
    const ai = await deepseekText(u.username, s, overall);
    const body = {
      title: s.attempts ? (s.acc != null && s.acc >= 0.85 ? 'Sharp work' : s.attempts >= 15 ? 'Good volume' : 'Progress note') : 'Checking in',
      lines: ai ? [ai] : ruleText(u.username, s, overall),
      stats: { attempts: s.attempts, acc: s.acc, avgSec: s.avgSec, minutes: s.minutes, visits: s.visits },
      by: ai ? 'deepseek' : 'rules',
      period: [last, now],
    };
    db.prepare('INSERT INTO reviews(user_id, created_at, body) VALUES (?,?,?)').run(u.id, now, JSON.stringify(body));
    written++;
  }
  setMeta('last_review_run', now);
  return { written, skipped };
}

export function startCoach() {
  const tick = async () => {
    const last = getMeta('last_review_run', 0);
    if (Date.now() - last >= PERIOD) {
      try {
        const r = await runReviews();
        console.log(`[coach] reviews written=${r.written} skipped=${r.skipped}`);
      } catch (e) {
        console.error('[coach]', e);
      }
    }
  };
  setTimeout(tick, 10_000);
  setInterval(tick, 5 * 60_000); // check every 5 min; runs when 3 h have passed (survives restarts)
}
