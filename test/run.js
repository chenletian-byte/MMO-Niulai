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
        else if (bk.type === 'stmt') a[b] = bk.show ? '#tex:' + bk.show : (q.tier === 'basic' ? '#stmt:' : '') + bk.accept[0];
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
        for (const p of q.parts) if (p.kind === 'proof') {
          const chipSlots = p.lines.flat().filter((x) => x.blank && x.mode === 'chips');
          const bank = (p.bank || []).map((b) => b.t + ':' + b.v);
          for (const sl of chipSlots) {
            const bk = q.key[p.id].blanks[sl.blank];
            const want = bk.type === 'reason' ? 'reason:' + bk.accept[0] : bk.show ? 'tex:' + bk.show : 'stmt:' + bk.accept[0];
            const i = bank.indexOf(want);
            if (i < 0) throw new Error('bank missing ' + want);
            bank.splice(i, 1);
          }
        }
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
