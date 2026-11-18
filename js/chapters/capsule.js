// Chapter 1: ink in a capsule. E Ink's "electronic ink" is a film of microcapsules, each thinner than a hair
// and filled with clear fluid, positively charged white particles (titanium dioxide) and negatively charged
// black particles (carbon black) (Comiskey, Albert, Yoshizawa & Jacobson, Nature 1998; Science Friday 2016;
// E Ink "How it works"). Which pigment carries which sign differs between descriptions and products; the
// model uses white positive, black negative. Sizes are not to scale: a real capsule holds far more particles.
import { THREE, M, CapsuleView, Pop, COL, clamp, approach } from '../eink.js';

const COLS = 11, ROWS = 7, SP = 0.86;
const E = ['.........', '..#####..', '.#.....#.', '.#######.', '.#.......', '..#.....#', '...#####.'];
let stageRef = null;
const VIEWS = { one: { pos: [0, 2.4, 5.2], target: [0, 1.7, 0] }, sheet: { pos: [0, 11, 4], target: [0, 0, 0.2] }, side: { pos: [0, 2.2, 8.4], target: [0, 1, 0] } };

export default {
  id: 'capsule',
  short: 'Ink in a capsule',
  title: 'A pixel is a tiny capsule',
  subtitle: 'White and black particles floating in clear fluid, a few thousand to a dot.',
  view: VIEWS.one,
  learn: `<p>An e-ink screen has no light and no colour filters. It is a film of <b>microcapsules</b>, each thinner than a human hair, laid side by side like frogspawn. Inside every capsule is clear fluid and two kinds of pigment: <b>white</b> particles that carry a positive charge, and <b>black</b> particles that carry a negative charge.</p>
    <p>Which pigment is on top decides what you see. If the white particles are nearest your eye, that dot looks white, because they scatter light like paper. If the black ones are on top, the dot looks black. Thousands of capsules make one dot of picture, and millions make a page.</p>
    <p>The particles only move when a field pushes them. Otherwise they jiggle a little, but they stay where they were put. That is the secret of the next chapters.</p>
    <p class="tip"><b>Try it:</b> switch to <b>The sheet</b>, then use the buttons to set the capsules. Tilt the view to the side to see that every dot is a row of capsules, each showing white or black to you.</p>
    <p class="note">Not to scale: a real capsule holds far more particles than the 12 or so of each shown here.</p>`,
  terms: [
    { t: 'Microcapsule', d: 'A tiny sealed bubble, thinner than a hair, filled with fluid and pigment particles.' },
    { t: 'Pigment particle', d: 'A speck of white (titanium dioxide) or black (carbon black) pigment that carries an electric charge.' },
    { t: 'Reflective display', d: 'A screen that makes its picture by reflecting room light, as paper does, instead of making its own light.' },
  ],
  defaults: { scale: 'one', jitter: 1, charges: true },
  onChange(s, key) { if (key === 'scale' && stageRef) stageRef.setView(VIEWS[s.scale].pos, VIEWS[s.scale].target, 1.1); },
  controls: [
    { key: 'scale', type: 'seg', label: 'Zoom', options: [{ v: 'one', label: 'One capsule' }, { v: 'sheet', label: 'The sheet' }] },
    { key: 'set', type: 'buttons', label: 'Set the capsules', items: [
      { label: 'All white', act: (s, i) => i.set('white') }, { label: 'All black', act: (s, i) => i.set('black') },
      { label: 'Checkerboard', act: (s, i) => i.set('checker') }, { label: 'Draw an e', act: (s, i) => i.set('e') }, { label: 'Grey', act: (s, i) => i.set('grey') }] },
    { key: 'jitter', type: 'range', label: 'Jiggle', min: 0, max: 1, step: 0.01, fmt: (v) => (v < 0.05 ? 'Still' : Math.round(v * 100) + '%') },
    { key: 'charges', type: 'toggle', label: 'Show the charges' },
  ],
  quiz: [
    { q: 'What is inside an e-ink microcapsule?', options: ['Tiny LEDs', 'Clear fluid with white and black charged particles', 'Liquid crystal and a backlight', 'Coloured ink that is squirted out'], answer: 1, why: 'Positively charged white and negatively charged black particles float in clear fluid.' },
    { q: 'What decides whether a dot looks white or black?', options: ['Which particles are nearest the viewer', 'How hot the screen is', 'The brightness of a backlight', 'The size of the capsule'], answer: 0, why: 'White particles on top scatter light like paper; black ones on top absorb it.' },
    { q: 'Where does the light you see come from?', options: ['A backlight inside the screen', 'The room (or sun) reflecting off the white particles', 'The black particles glowing', 'The battery'], answer: 1, why: 'E-ink is a reflective display. It shows a picture the way printed paper does.' },
  ],
  reel: [
    { ms: 5000, caption: 'Inside an e-ink screen: capsules thinner than a hair, full of clear fluid.', set: { scale: 'one', charges: true }, act: (s, i) => i.set('white'), view: { pos: [3.2, 2.8, 6.6], target: [0, 1.7, 0] }, spin: 0.6 },
    { ms: 5000, caption: 'Thousands of capsules, each showing white or black, draw a letter.', set: { scale: 'sheet', charges: false }, act: (s, i) => i.set('e'), view: VIEWS.sheet, spin: 0 },
  ],
  build({ stage, s }) {
    stageRef = stage; stage.floor.visible = false;
    const root = new THREE.Group(); stage.root.add(root);
    // the single big capsule
    const bigPop = new Pop(14, 7);
    const big = new CapsuleView(bigPop, 1.5, { seed: 9 }); big.obj.position.y = 1.7; root.add(big.obj);
    const fluidLbl = stage.label('clear fluid', [1.85, 2.9, 0], root);
    const shellLbl = stage.label('capsule wall', [-1.9, 0.5, 0], root);
    const wLbl = stage.label('<b>+</b> white particles', [-2.6, 2.6, 0], root, 'hot');
    const bLbl = stage.label('<b>−</b> black particles', [2.7, 1.0, 0], root, 'hot');
    const marks = [stage.label('+', [0, 0, 0], big.obj, 'hot'), stage.label('−', [0, 0, 0], big.obj, 'hot')];
    // the sheet: one layer of small capsules seen from above
    const sheet = new THREE.Group(); root.add(sheet);
    const cells = [];
    const plate = new THREE.Mesh(new THREE.BoxGeometry(COLS * SP + 0.3, 0.1, ROWS * SP + 0.3), M.matte(0x565d70)); plate.position.y = -0.45; sheet.add(plate);
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const p = new Pop(10, 100 + r * COLS + c), v = new CapsuleView(p, SP * 0.47, { seed: r * 31 + c, size: 0.26 });
      v.obj.position.set((c - (COLS - 1) / 2) * SP, 0, (r - (ROWS - 1) / 2) * SP); sheet.add(v.obj);
      cells.push({ p, v, k: 0.5, target: 0.5, c, r });
    }
    const pat = (name, c, r) => {
      if (name === 'white') return 1; if (name === 'black') return 0; if (name === 'grey') return 0.5;
      if (name === 'checker') return (c + r) % 2 ? 1 : 0;
      if (name === 'e') { const ec = c - 1, er = r; return ec >= 0 && ec < 9 && E[er][ec] === '#' ? 0 : 1; }
      return 0.5;
    };
    let single = 0.5, singleT = 0.5, tt = 0;
    const set = (name) => { cells.forEach((q) => { q.target = pat(name, q.c, q.r); }); singleT = name === 'white' ? 1 : name === 'black' ? 0 : name === 'grey' ? 0.5 : name === 'checker' ? 0.3 : 0.75; };
    set('mix'); cells.forEach((q, i) => { q.target = q.k = ((i * 37) % 11) / 10; });
    return {
      set,
      update(dt, st, time) {
        tt = time;
        const one = st.scale === 'one';
        big.obj.visible = one; sheet.visible = !one;
        [fluidLbl, shellLbl, wLbl, bLbl].forEach((l) => { l.visible = one; });
        marks.forEach((m) => { m.visible = one && st.charges; });
        single = approach(single, singleT, 3, dt); bigPop.snap(single); big.place(time, st.jitter);
        const wi = [0, 1].map((k) => big.at(k * bigPop.n, time, st.jitter));
        marks[0].position.set(wi[0][0], wi[0][1] + 0.22, wi[0][2] + 0.1); marks[1].position.set(wi[1][0], wi[1][1] + 0.22, wi[1][2] + 0.1);
        if (!one) cells.forEach((q) => { q.k = approach(q.k, q.target, 4, dt); q.p.snap(q.k); q.v.place(time, st.jitter); q.v.setShell(true); });
      },
      readout: (st) => st.scale === 'one'
        ? `<div class="big">One capsule</div><p class="r-say">${singleT > 0.9 ? 'White particles on top: this dot looks white.' : singleT < 0.1 ? 'Black particles on top: this dot looks black.' : 'Both kinds near the top: this dot looks grey.'}</p><div class="row"><span>Looks</span><b>${Math.round(100 * single)}% white</b></div>`
        : `<div class="big">${COLS * ROWS} capsules</div><p class="r-say">Looking down, each capsule shows whichever pigment is on top. Together they make the picture.</p>`,
    };
  },
};
