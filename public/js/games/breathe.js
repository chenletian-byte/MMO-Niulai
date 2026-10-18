// Box breathing 4-4-4-4 with a slow orb; then a look-away cue.
export function breathe(el, ui) {
  const orb = document.createElement('div');
  orb.className = 'breathe-orb';
  const label = document.createElement('div');
  label.className = 'serif';
  label.style.cssText = 'font-size:24px;margin-top:28px;text-align:center;min-height:36px';
  el.append(orb, label);
  const phases = [['Breathe in', 1.35], ['Hold', 1.35], ['Breathe out', 0.75], ['Hold', 0.75]];
  let i = 0, cycles = 0, alive = true;
  const run = () => {
    if (!alive) return;
    const [t, s] = phases[i % 4];
    label.textContent = t;
    orb.style.transform = `scale(${s})`;
    i++;
    if (i % 4 === 0) { cycles++; ui && ui(`${cycles} cycle${cycles === 1 ? '' : 's'} · try 4 to 6`); }
  };
  run();
  const tm = setInterval(run, 4000);
  ui && ui('Follow the orb. Four seconds each side of the box.');
  return { stop() { alive = false; clearInterval(tm); } };
}
