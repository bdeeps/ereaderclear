// Chapter 2: electrophoresis. A charged particle in an electric field feels a force and drifts through the
// fluid toward the electrode of opposite sign (electrophoresis: F. F. Reuss observed clay particles moving
// in water in an electric field in Moscow, 1807-1809). In the capsule, a field one way sends the white
// particles to the viewer and the black ones to the back; reversing it swaps them. The speeds are a cartoon:
// the full swing takes a few tenths of a second at 'real speed' here, and real panels vary with
// temperature, fluid and drive scheme (E Ink quotes update times as short as 120 ms for a whole display).
import { THREE, M, CapsuleView, Pop, COL, clamp, grey, approach } from '../eink.js';
import { arrow, box } from '../kit.js';

const T = 0.3; // seconds for a full swing at 100% speed

export default {
  id: 'field',
  short: 'A push from a field',
  title: 'The field moves the particles',
  subtitle: 'Opposite charges attract, so a voltage sends white and black in opposite directions.',
  view: { pos: [0.5, 2.8, 8.6], target: [0, 2.3, 0] },
  learn: `<p>A capsule sits between two <b>electrodes</b>: a transparent one at the front, where you look, and one behind. Put a voltage across them and an <b>electric field</b> fills the capsule. Charged particles feel a force and drift through the fluid. This is <b>electrophoresis</b>, and it has been known since the early 1800s.</p>
    <p>Opposite charges attract. Make the front electrode negative and the white (positive) particles rush up to it while the black (negative) ones go to the back: the dot turns <b>white</b>. Reverse the voltage and everything swaps: the dot turns <b>black</b>. The dose matters. A short pulse moves the particles only part of the way and gives a <b>grey</b>.</p>
    <p>Notice what happens when you set the voltage back to zero: nothing. The particles stop where they are, and the picture stays.</p>
    <p class="tip"><b>Try it:</b> drag the voltage slider left and right, then the Pulse buttons. Slow the playback down to watch them cross.</p>
    <p class="note">The strengths and times are a cartoon. Real panels use pulses tuned to the display, its temperature and the ink.</p>`,
  terms: [
    { t: 'Electrophoresis', d: 'The drift of charged particles through a fluid when an electric field is applied.' },
    { t: 'Electrode', d: 'A conducting plate that sets up the electric field across the capsule.' },
    { t: 'Dose', d: 'Strength of the field multiplied by how long it is on. It sets how far the particles travel.' },
  ],
  defaults: { field: 0, speed: 0.25, charges: true },
  controls: [
    { key: 'field', type: 'range', label: 'Voltage across the capsule', min: -1, max: 1, step: 0.01, ends: ['Black to the front', 'White to the front'], fmt: (v) => (Math.abs(v) < 0.02 ? 'Off' : (v > 0 ? 'Rear +  ' : 'Rear −  ') + Math.round(Math.abs(v) * 100) + '%') },
    { key: 'pulse', type: 'buttons', label: 'Send a pulse', items: [
      { label: 'Full white', act: (s, i) => i.pulse(1, 1.15) }, { label: 'Full black', act: (s, i) => i.pulse(-1, 1.15) },
      { label: 'Half pulse', act: (s, i) => i.pulse(1, 0.5) }, { label: 'Quarter pulse', act: (s, i) => i.pulse(-1, 0.25) }] },
    { key: 'speed', type: 'log', label: 'Playback speed', min: 0.05, max: 1, fmt: (v) => (v > 0.9 ? 'Normal' : `${Math.round(1 / v)}× slower`) },
    { key: 'charges', type: 'toggle', label: 'Show the charges' },
  ],
  quiz: [
    { q: 'What makes the particles move?', options: ['Heat', 'An electric field acting on their charge', 'A tiny motor', 'The backlight'], answer: 1, why: 'Charged particles drift through the fluid in an electric field. That is electrophoresis.' },
    { q: 'You reverse the voltage across a capsule. What happens?', options: ['Nothing', 'The white and black particles swap places', 'The capsule bursts', 'The screen gets brighter'], answer: 1, why: 'The two kinds carry opposite charges, so the field pushes them in opposite directions.' },
    { q: 'How do you get a grey dot?', options: ['A weaker backlight', 'A pulse that moves the particles only part of the way', 'Mixing in grey particles', 'Heating the screen'], answer: 1, why: 'Dose (field times time) sets how far the particles travel, so a short pulse stops them half way.' },
  ],
  reel: [
    { ms: 5200, caption: 'A voltage across the capsule pushes white up to you and black away.', set: { field: 0, speed: 0.4, charges: true }, act: (s, i) => { i.snap(0); i.pulse(1, 1.2); }, view: { pos: [2.5, 2.8, 7.8], target: [0, 2.3, 0] }, spin: 0 },
    { ms: 5200, caption: 'Reverse the voltage and the dot turns black. Switch it off and the picture stays.', set: { field: 0, speed: 0.4 }, act: (s, i) => { i.snap(1); i.pulse(-1, 1.2); }, view: { pos: [-2.5, 2.8, 7.8], target: [0, 2.3, 0] }, spin: 0 },
  ],
  build({ stage, s }) {
    stage.floor.visible = false;
    const root = new THREE.Group(); stage.root.add(root);
    const Y = 2.3, R = 1.4;
    const pop = new Pop(16, 11); pop.snap(0.5); pop.sticky = 0.4;
    const cap = new CapsuleView(pop, R, { seed: 4 }); cap.obj.position.y = Y; root.add(cap.obj);
    const top = new THREE.Mesh(new THREE.BoxGeometry(5, 0.1, 3), M.clear(0x8ef0ff, 0.22, { roughness: 0.1 })); top.position.y = Y + R + 0.3; root.add(top);
    const bot = box(5, 0.16, 3, M.metal(0x59606e)); bot.position.y = Y - R - 0.3; root.add(bot);
    const arrows = [-1.6, -0.8, 0, 0.8, 1.6].map((x) => { const a = arrow(COL.amber, 1, 0.22, 0.03); a.position.set(x, 0, 1.55); root.add(a); return a; });
    const lblTop = stage.label('front electrode', [2.9, Y + R + 0.3, 0], root);
    const lblBot = stage.label('rear electrode', [2.9, Y - R - 0.3, 0], root);
    stage.label('you look from here', [0, Y + R + 1.25, 0], root, 'hot');
    const eye = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.35, 16), M.glow(COL.cyan)); eye.rotation.x = Math.PI; eye.position.set(0, Y + R + 0.72, 0); root.add(eye);
    const marks = [stage.label('+', [0, 0, 0], cap.obj, 'hot'), stage.label('−', [0, 0, 0], cap.obj, 'hot')];
    let pul = null, tt = 0, F = 0;
    return {
      snap: (k) => { pop.snap(k); },
      pulse(f, dose) { pul = { f, rem: dose }; pop.resetKick(); },
      update(dt, st, time) {
        tt = time;
        const sp = st.speed, dd = dt * sp / T;
        F = st.field;
        if (Math.abs(F) > 0.02) pop.drive(F, dd); else if (!pul) pop.resetKick();
        let fp = 0;
        if (pul) { const d = Math.min(pul.rem, dd); pop.drive(pul.f, d); pul.rem -= d; fp = pul.f; if (pul.rem <= 1e-6) pul = null; }
        const f = Math.abs(F) > 0.02 ? F : fp;
        // arrows: field points from the + plate to the - plate; F>0 = rear plate +
        arrows.forEach((a) => {
          a.visible = Math.abs(f) > 0.02; if (!a.visible) return;
          a.set(0.6 + 1.2 * Math.abs(f)); a.rotation.z = f > 0 ? 0 : Math.PI; a.position.y = f > 0 ? Y - 1.0 : Y + 1.0;
        });
        lblTop.element.innerHTML = Math.abs(f) < 0.02 ? 'front electrode' : `front electrode <b>${f > 0 ? '−' : '+'}</b>`;
        lblBot.element.innerHTML = Math.abs(f) < 0.02 ? 'rear electrode' : `rear electrode <b>${f > 0 ? '+' : '−'}</b>`;
        cap.place(time, 0.8);
        marks.forEach((m) => { m.visible = st.charges; });
        const a = cap.at(0, time, 0.8), b = cap.at(pop.n, time, 0.8);
        marks[0].position.set(a[0], a[1] + 0.2, a[2] + 0.1); marks[1].position.set(b[0], b[1] + 0.2, b[2] + 0.1);
      },
      readout(st) {
        const r = pop.refl(), f = Math.abs(st.field) > 0.02 ? st.field : 0;
        return `<div class="big">${r > 0.8 ? 'White' : r < 0.2 ? 'Black' : r > 0.4 && r < 0.6 ? 'Mid grey' : r > 0.5 ? 'Light grey' : 'Dark grey'}</div>
          <div class="row"><span>The dot looks</span><span><span class="sw" style="background:${grey(0.06 + 0.9 * r)}"></span> <b>${Math.round(r * 100)}% white</b></span></div>
          <div class="row"><span>Field</span><b>${f === 0 && !pul ? 'off, picture holds' : f > 0 ? 'white up' : f < 0 ? 'black up' : 'pulse'}</b></div>`;
      },
    };
  },
};
