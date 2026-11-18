// Chapter 3: greys, flashes and ghosts. A real panel has a driver that sends each pixel a voltage waveform;
// grey comes from a pulse that stops the particles part way (dose = field x time), and a "full refresh" flashes
// the whole screen black and white first so every pixel starts from the same, known state. Skip the flash and
// pixels start from wherever they were, so slightly different particle mobility and stiction leave a faint
// ghost of the previous page. See pop.js for the cartoon physics. Real drive schemes are far more elaborate
// (waveform tables per temperature, per grey-to-grey pair) and are tuned by the panel maker.
import { THREE, M, CapsuleView, Pop, COL, clamp, lerp, grey, approach } from '../eink.js';
import { doseFor } from '../pop.js';
import { canvasTexture, box, beam } from '../kit.js';

const W = 48, H = 27, T = 0.3, PW = 6.4, PH = PW * H / W, SX = 1.1, SY = 3.3;
const PROBE = [14, 18];
const FLASH = [{ F: -1, dur: 1.6, name: 'Flash: every pixel to black' }, { F: 1, dur: 1.6, name: 'Flash: every pixel to white' }];

// two test pages, as grey values 0..1
function makeImages() {
  const mk = (draw) => { const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); draw(g); const d = g.getImageData(0, 0, W, H).data; const a = new Float32Array(W * H); for (let i = 0; i < W * H; i++) a[i] = d[i * 4] / 255; return a; };
  const A = mk((g) => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
    const gr = g.createLinearGradient(2, 0, W - 2, 0); gr.addColorStop(0, '#000'); gr.addColorStop(1, '#fff'); g.fillStyle = gr; g.fillRect(2, 2, W - 4, 7);
    g.fillStyle = '#000'; g.beginPath(); g.arc(14, 18, 7, 0, 7); g.fill();
    g.fillStyle = '#000'; g.fillRect(28, 12, 16, 3); g.fillRect(28, 18, 16, 3); g.fillRect(28, 24, 16, 2);
  });
  const B = mk((g) => {
    g.fillStyle = '#ddd'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#808080'; g.fillRect(3, 11, 22, 13);
    g.fillStyle = '#000'; g.font = 'bold 9px sans-serif'; g.textBaseline = 'top'; g.fillText('e-ink', 3, 1);
    g.fillRect(28, 3, 17, 2); g.fillRect(28, 8, 17, 2); g.fillRect(28, 13, 12, 2);
    g.fillStyle = '#fff'; g.fillRect(28, 18, 17, 6);
  });
  return [A, B];
}

export default {
  id: 'grey',
  short: 'Grey, flash and ghosts',
  title: 'Greys, flashes and ghosts',
  subtitle: 'How a page of pulses is drawn, why the screen blinks, and where the faint ghost of the last page comes from.',
  view: { pos: [-0.2, 3.1, 11.5], target: [-0.4, 2.4, 0] },
  learn: `<p>To draw a page, the screen's driver sends each pixel its own voltage <b>waveform</b>. A long pulse sends the particles all the way: white or black. A short pulse stops them half way, and the dot looks <b>grey</b>. Early e-readers could hold 4 shades; later ones hold 16.</p>
    <p>But the driver cannot see the particles. It only knows what it <em>asked</em> them to do last time. Some particles are a little sluggish, and some stick to the electrode before they break free. After many quick updates, pixels that were black stay slightly darker than pixels that were white, even where the new page says they should match. That is <b>ghosting</b>.</p>
    <p>The cure is the flash. A <b>full refresh</b> slams every pixel to black, then white, then draws the new page from that known white start. It looks like a blink, but it wipes the slate clean. Fast <b>partial</b> refreshes skip the flash and let ghosts build up.</p>
    <p class="tip"><b>Try it:</b> press <b>Show the next page</b> a few times on Fast, then turn on <b>Show only the ghost</b>. Raise the stickiness to make it worse, then switch to Full refresh.</p>`,
  terms: [
    { t: 'Waveform', d: 'The voltage-against-time pattern the driver sends to one pixel to change it from one shade to another.' },
    { t: 'Full refresh', d: 'An update that flashes the screen black and white first, so every pixel starts from a known state.' },
    { t: 'Ghosting', d: 'A faint trace of a previous image left behind because the particles did not end up quite where the driver expected.' },
  ],
  defaults: { refresh: 'partial', levels: 16, sticky: 0.7, speed: 0.5, ghostView: false },
  controls: [
    { key: 'go', type: 'buttons', label: 'Change the page', items: [{ label: 'Show the next page', act: (s, i) => i.next() }] },
    { key: 'refresh', type: 'seg', label: 'Refresh', options: [{ v: 'partial', label: 'Fast (partial)' }, { v: 'full', label: 'Full (flash)' }] },
    { key: 'levels', type: 'seg', label: 'Shades of grey', options: [{ v: 2, label: '2' }, { v: 4, label: '4' }, { v: 16, label: '16' }] },
    { key: 'sticky', type: 'range', label: 'Particle stickiness', min: 0, max: 1, step: 0.01, fmt: (v) => (v < 0.15 ? 'Ideal' : v < 0.55 ? 'Mild' : v < 0.85 ? 'Typical' : 'Worn') },
    { key: 'ghostView', type: 'toggle', label: 'Show only the ghost', hint: 'Mid grey means no error. Lighter or darker means the pixel missed its target.' },
    { key: 'speed', type: 'log', label: 'Playback speed', min: 0.1, max: 1, fmt: (v) => (v > 0.9 ? 'Normal' : `${Math.round(1 / v)}× slower`) },
  ],
  quiz: [
    { q: 'How does the screen make a grey?', options: ['A grey pigment', 'A pulse that stops the particles part way', 'A dimmer backlight', 'Mixing in coloured filters'], answer: 1, why: 'Dose (voltage times time) sets how far the particles move, so a short pulse leaves a mix.' },
    { q: 'Why does an e-reader flash when it does a full refresh?', options: ['The backlight resets', 'It drives every pixel black then white to start from a known state', 'It is checking the battery', 'The page is loading'], answer: 1, why: 'Flashing to black and white puts every particle at an electrode, so the new page starts from the same state everywhere.' },
    { q: 'What causes ghosting?', options: ['Dust under the screen', 'Pixels that did not quite reach the shade the driver aimed for, depending on their history', 'The frontlight', 'Too much sunlight'], answer: 1, why: 'The driver cannot see the particles; sluggish or sticky ones end up off target, leaving a trace of the old picture.' },
  ],
  reel: [
    { ms: 5000, caption: 'Update fast and ghosts build up: pixels remember the last page.', set: { refresh: 'partial', ghostView: true, sticky: 0.9, speed: 1 }, act: (s, i) => i.next(true), view: { pos: [-0.2, 3.1, 10.5], target: [-0.4, 2.4, 0] }, spin: 0 },
    { ms: 5600, caption: 'The flash resets every pixel to black and white first, so the new page starts clean.', set: { refresh: 'full', ghostView: false, sticky: 0.7, speed: 0.8 }, act: (s, i) => i.next(), view: { pos: [-0.2, 3.1, 10.5], target: [-0.4, 2.4, 0] }, spin: 0 },
  ],
  build({ stage, s }) {
    stage.floor.visible = false;
    const root = new THREE.Group(); stage.root.add(root);
    const imgs = makeImages();
    const pops = Array.from({ length: W * H }, (_, i) => new Pop(10, 500 + i));
    const nominal = new Float32Array(W * H), dT = new Float32Array(W * H), tgt = new Float32Array(W * H), dur = new Float32Array(W * H), dir = new Float32Array(W * H);
    const quant = (g, L) => Math.round(g * (L - 1)) / (L - 1);
    const goal = (img, L, i) => 0.03 + 0.94 * quant(imgs[img][i], L);
    let cur = 0;
    for (let i = 0; i < W * H; i++) { tgt[i] = goal(0, 16, i); dT[i] = doseFor(tgt[i]); nominal[i] = dT[i]; pops[i].snap(dT[i]); }
    // screen
    const bezel = box(PW + 0.5, PH + 0.5, 0.2, M.matte(0x151821)); bezel.position.set(SX, SY, -0.14); root.add(bezel);
    const sc = canvasTexture(W, H, () => {}); sc.tex.magFilter = THREE.NearestFilter; sc.tex.minFilter = THREE.LinearFilter; sc.tex.generateMipmaps = false;
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshBasicMaterial({ map: sc.tex, toneMapped: false })); screen.position.set(SX, SY, 0); root.add(screen);
    const g2 = sc.canvas.getContext('2d'), imgData = g2.createImageData(W, H);
    const pxPos = (px, py) => [SX - PW / 2 + (px + 0.5) / W * PW, SY + PH / 2 - (py + 0.5) / H * PH, 0.02];
    const pp = pxPos(...PROBE), ps = PW / W * 1.5;
    const frame = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, y]) => new THREE.Vector3(pp[0] + x * ps / 2, pp[1] + y * ps / 2, 0.03))), new THREE.LineBasicMaterial({ color: COL.amber }));
    root.add(frame);
    // the probe pixel's capsule
    const probe = pops[PROBE[1] * W + PROBE[0]];
    const capPos = [-4.3, 2.5, 0.5];
    const cap = new CapsuleView(probe, 1.0, { seed: 12 }); cap.obj.position.set(...capPos); root.add(cap.obj);
    const lead = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(pp[0], pp[1], 0.03), new THREE.Vector3(capPos[0] + 0.9, capPos[1] + 0.3, capPos[2])]), new THREE.LineBasicMaterial({ color: COL.amber, transparent: true, opacity: 0.5 }));
    root.add(lead);
    stage.label('one pixel, zoomed in', [capPos[0], capPos[1] + 1.35, capPos[2]], root, 'hot');
    // waveform plot
    const wf = canvasTexture(640, 150, () => {});
    const plot = new THREE.Mesh(new THREE.PlaneGeometry(PW, PW * 150 / 640), new THREE.MeshBasicMaterial({ map: wf.tex, toneMapped: false })); plot.position.set(SX, 0.6, 0); root.add(plot);
    const wg = wf.canvas.getContext('2d');
    let seq = null, plotSegs = [], elapsed = 0, ghost = 0, started = false, dirty = true;

    const start = () => {
      cur ^= 1; const L = s.levels; const full = s.refresh === 'full';
      pops.forEach((p) => { p.sticky = s.sticky; });
      for (let i = 0; i < W * H; i++) { tgt[i] = goal(cur, L, i); dT[i] = doseFor(tgt[i]); }
      const phases = [];
      let nom = nominal;
      if (full) { FLASH.forEach((f) => phases.push({ ...f, all: true })); nom = new Float32Array(W * H).fill(1); }
      let maxd = 0.05;
      for (let i = 0; i < W * H; i++) {
        const dd = dT[i] - nom[i], rail = nom[i] < 0.02 || nom[i] > 0.98;
        const comp = rail && Math.abs(dd) > 0.004 ? 0.2 * s.sticky * (full ? 1 : 0.45) : 0;
        dur[i] = Math.abs(dd) > 0.004 ? Math.abs(dd) + comp : 0; dir[i] = Math.sign(dd); maxd = Math.max(maxd, dur[i]);
      }
      phases.push({ all: false, dur: maxd, name: full ? 'Draw the new page from white' : 'Draw only what changed' });
      const pi = PROBE[1] * W + PROBE[0];
      let t = 0; plotSegs = [];
      phases.forEach((ph) => { if (ph.all) plotSegs.push({ t0: t, t1: t + ph.dur, F: ph.F }); else if (dur[pi] > 0) plotSegs.push({ t0: t, t1: t + dur[pi], F: dir[pi] }); t += ph.dur; });
      seq = { phases, pi: 0, t: 0, total: t }; elapsed = 0; started = true;
      pops.forEach((p) => p.resetKick());
    };
    const finish = () => {
      for (let i = 0; i < W * H; i++) nominal[i] = dT[i];
      let e = 0; for (let i = 0; i < W * H; i++) e += Math.abs(pops[i].refl() - tgt[i]); ghost = e / (W * H);
      seq = null; dirty = true;
    };
    const advance = (dd) => {
      let rem = dd;
      while (rem > 1e-9 && seq) {
        const ph = seq.phases[seq.pi], step = Math.min(rem, ph.dur - seq.t);
        if (ph.all) for (let i = 0; i < pops.length; i++) pops[i].drive(ph.F, step);
        else { const lo = seq.t, hi = lo + step; for (let i = 0; i < pops.length; i++) { const d = dur[i]; if (!d) continue; const a = Math.min(hi, d) - Math.min(lo, d); if (a > 0) pops[i].drive(dir[i], a); } }
        seq.t += step; elapsed += step; rem -= step;
        if (seq.t >= ph.dur - 1e-9) { seq.pi++; seq.t = 0; pops.forEach((p) => p.resetKick()); if (seq.pi >= seq.phases.length) finish(); }
      }
    };
    const paint = (ghostView) => {
      const d = imgData.data;
      for (let i = 0; i < W * H; i++) {
        const r = pops[i].refl(); let v;
        if (ghostView) { v = clamp(0.5 + 4 * (r - tgt[i]), 0, 1); d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 40 + v * 190; }
        else { v = r; d[i * 4] = 26 + v * 188; d[i * 4 + 1] = 28 + v * 188; d[i * 4 + 2] = 32 + v * 172; }
        d[i * 4 + 3] = 255;
      }
      g2.putImageData(imgData, 0, 0); sc.tex.needsUpdate = true;
    };
    const drawPlot = () => {
      wg.fillStyle = '#10131b'; wg.fillRect(0, 0, 640, 150);
      wg.strokeStyle = 'rgba(255,255,255,.2)'; wg.lineWidth = 1; wg.beginPath(); wg.moveTo(40, 75); wg.lineTo(630, 75); wg.stroke();
      wg.fillStyle = 'rgba(255,255,255,.55)'; wg.font = '13px sans-serif'; wg.fillText('white to front', 6, 22); wg.fillText('black to front', 6, 140); wg.fillText('voltage on the boxed pixel, over time →', 300, 144);
      const tot = seq ? seq.total : (plotSegs.length ? plotSegs[plotSegs.length - 1].t1 : 1), x = (t) => 44 + (t / Math.max(0.5, tot)) * 580;
      wg.strokeStyle = '#ffb547'; wg.lineWidth = 3; wg.beginPath(); wg.moveTo(44, 75);
      plotSegs.forEach((sg) => { wg.lineTo(x(sg.t0), 75); wg.lineTo(x(sg.t0), 75 - sg.F * 50); wg.lineTo(x(sg.t1), 75 - sg.F * 50); wg.lineTo(x(sg.t1), 75); });
      wg.lineTo(620, 75); wg.stroke();
      if (seq) { wg.strokeStyle = '#8ef0ff'; wg.lineWidth = 2; wg.beginPath(); wg.moveTo(x(elapsed), 10); wg.lineTo(x(elapsed), 128); wg.stroke(); }
      wf.tex.needsUpdate = true;
    };
    paint(false); drawPlot();
    return {
      next(instant) { if (seq) return; start(); if (instant) { advance(1e3); } dirty = true; },
      update(dt, st, time) {
        if (seq) { advance(dt * st.speed / T); dirty = true; }
        if (dirty || seq || st.ghostView !== this._gv) { paint(st.ghostView); drawPlot(); dirty = false; this._gv = st.ghostView; }
        cap.place(time, 0.6);
      },
      readout(st) {
        const pi = PROBE[1] * W + PROBE[0], r = probe.refl();
        const phase = seq ? seq.phases[seq.pi].name : started ? 'Done' : 'Press the button to change the page';
        const ge = Math.round(ghost * 100);
        return `<div class="big">${phase}</div><div class="row"><span>Boxed pixel: aimed for</span><b>${Math.round(100 * (tgt[pi] - 0.03) / 0.94)}% white</b></div><div class="row"><span>It reached</span><b>${Math.round(100 * (r - 0.03) / 0.94)}% white</b></div>${started ? `<div class="row"><span>Average error on the page</span><b class="${ge > 5 ? 'no' : 'ok'}">${ge}%</b></div>` : ''}`;
      },
    };
  },
};
