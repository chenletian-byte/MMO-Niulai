// Timed mock papers: a new paper per subject every 2 hours, the same for everyone in that window.
import { rng } from './gen/util.js';
import { TEMPLATES, generate } from './gen/index.js';

export const WINDOW_MS = Number(process.env.MOCK_WINDOW_HOURS || 2) * 3600e3;
export const MOCK_MINUTES = Number(process.env.MOCK_MINUTES || 60);
export const MOCK_SIZE = 10;

export const currentWindow = (now = Date.now()) => Math.floor(now / WINDOW_MS);
export const windowEnds = (w) => (w + 1) * WINDOW_MS;

export function mockPlan(subject, w) {
  const r = rng(w * 7 + (subject === 'emath' ? 1 : 2));
  const pool = TEMPLATES.filter((t) => t.subject === subject && t.id.indexOf('concept') < 0 && (t.tiers.includes('challenging') || t.tiers.includes('advanced')));
  // spread over topics: one per topic first
  const byTopic = {};
  for (const t of r.shuffle(pool)) (byTopic[t.topic] = byTopic[t.topic] || []).push(t);
  const picks = [];
  const topics = r.shuffle(Object.keys(byTopic));
  while (picks.length < MOCK_SIZE && topics.some((k) => byTopic[k].length)) {
    for (const k of topics) {
      if (picks.length >= MOCK_SIZE) break;
      const t = byTopic[k].shift();
      if (t) picks.push(t);
    }
  }
  return picks.map((t, i) => {
    const tier = t.tiers.includes('advanced') && r.chance(0.6) ? 'advanced' : t.tiers.includes('challenging') ? 'challenging' : t.tiers[t.tiers.length - 1];
    return { templateId: t.id, tier, seed: w * 1000 + i * 37 + 11 };
  });
}

export function buildMock(subject, w) {
  return mockPlan(subject, w).map((p) => generate(p.templateId, p.tier, p.seed));
}

// partial credit: fraction of parts (proof parts: fraction of blanks) correct
export function scoreOf(q, graded) {
  let got = 0, tot = 0;
  for (const p of q.parts) {
    const g = graded.parts[p.id];
    if (p.kind === 'proof') {
      const vals = Object.values(g.blanks || {});
      tot += 1;
      got += vals.length ? vals.filter(Boolean).length / vals.length : 0;
    } else {
      tot += 1;
      got += g.ok ? 1 : 0;
    }
  }
  const weight = q.tier === 'advanced' ? 6 : 4;
  return { got: (got / tot) * weight, tot: weight };
}
