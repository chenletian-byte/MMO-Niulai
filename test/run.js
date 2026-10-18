// Self-check: every template, every tier, many seeds: generation works and the answer key grades as correct.
import { TEMPLATES, generate, revealKey } from '../server/gen/index.js';
import { gradeQuestion } from '../server/math/grade.js';

let n = 0, fails = 0;
const modelAnswer = (q) => {
  const ans = {};
  for (const p of q.parts) {
    const k = q.key[p.id];
    if (p.kind === 'math') {
      const conv = (x) => (x.plusC ? `(${x.v})+c` : x.v);
      ans[p.id] = k.multi ? k.multi.map(conv) : conv({ ...k, v: k.v });
    } else if (p.kind === 'choice') ans[p.id] = k.correct;
    else if (p.kind === 'proof') {
      const a = {};
      for (const [b, bk] of Object.entries(k.blanks)) {
        if (bk.type === 'reason') a[b] = '#' + bk.accept[0];
        else if (bk.type === 'stmt') a[b] = bk.correctOpt != null ? '#opt:' + bk.correctOpt : bk.accept[0];
        else a[b] = bk.key.v;
      }
      ans[p.id] = a;
    }
  }
  return ans;
};
for (const t of TEMPLATES) {
  for (const tier of t.tiers) {
    for (let seed = 1; seed <= 60; seed++) {
      n++;
      let q;
      try {
        q = generate(t.id, tier, seed * 977 + 13);
        // remove form-only constraints for self-test
        for (const k of Object.values(q.key)) { if (k && k.form) delete k.form; if (k && k.forbid) delete k.forbid; }
        const g = gradeQuestion(q, modelAnswer(q));
        revealKey(q);
        const bad = JSON.stringify(q).match(/NaN|Infinity|[^a-z ]undefined|undefined[^a-z ."]/);
        if (!g.ok || bad) {
          fails++;
          if (fails < 15) console.log('FAIL', t.id, tier, seed, bad ? 'contains ' + bad[0] : JSON.stringify(g.parts), q.stem.slice(0, 120));
        }
      } catch (e) {
        fails++;
        if (fails < 15) console.log('ERROR', t.id, tier, seed, e.message);
      }
    }
  }
}
console.log(`${n} generated, ${fails} failures, ${TEMPLATES.length} templates`);
process.exit(fails ? 1 : 0);
