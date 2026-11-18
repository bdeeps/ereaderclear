// Chapter 4: sunlight and bistability. An e-ink page is lit by the room, like paper, so its contrast stays the
// same however bright the light, while an emissive screen (LCD with backlight, OLED) has to out-shine the glare
// bouncing off its own glass. And because the particles stay where the field left them, the page needs no
// power to stay on screen; power is spent only when it changes (E Ink: "bistable", updates only when changed).
// The numbers below are illustrative round figures, not measurements: glass reflects about 5% of the light,
// the LCD and OLED white is 300 nits, e-paper white reflects 40% and black 5%, LCD black is 0.3 nits.
// Power is in made-up relative units to show the shape of the curves, not real watts.
import { THREE, M, canvasTexture, box, clamp, lerp, grey, pseudoText } from '../eink.js';

const SPEED = 6;                       // model seconds per real second for the power graph
const KINDS = [
  { id: 'eink', name: 'E-ink', x: -3.5 },
  { id: 'lcd', name: 'LCD + backlight', x: 0 },
  { id: 'oled', name: 'OLED', x: 3.5 },
];
const lum = (id, E) => {
  const glare = 0.05 * E / Math.PI;
  if (id === 'eink') return [0.4 * E / Math.PI, 0.05 * E / Math.PI];
  if (id === 'lcd') return [300 + glare, 0.3 + glare];
  return [300 + glare, glare];
};
const vis = (L) => clamp(Math.log10(L / 0.02) / 2.6, 0, 1);
const luxName = (v) => (v < 5 ? 'Dark room' : v < 150 ? 'Dim room' : v < 1500 ? 'Lit room' : v < 10000 ? 'Overcast day' : v < 40000 ? 'Bright shade' : 'Direct sun');
const PERIOD = (rate) => 60 / rate;

export default {
  id: 'sun',
  short: 'Sunlight and standby',
  title: 'Why it reads in the sun, and sips power',
  subtitle: 'Reflective versus glowing, and a picture that stays without electricity.',
  view: { pos: [0, 3.3, 13.5], target: [0, 2.3, 0] },
  learn: `<p>A phone or tablet makes its own light. In dim rooms that is fine, but in sunlight the glare off the glass adds the same amount of light to the white <em>and</em> the black, so the contrast collapses and the screen washes out. An e-ink page behaves like <b>paper</b>: it reflects the light that falls on it, so white is bright and black is dark however much light there is. More sun makes it <em>easier</em> to read.</p>
    <p>The price is the dark. With no light on it, an e-ink page is just as unreadable as paper, which is why many readers add a frontlight (next chapter).</p>
    <p>The second trick is <b>bistability</b>. A backlit LCD or an OLED must be fed power to keep the picture. An e-ink particle stays where the field left it, held by the fluid and its own stickiness. The page needs power only to <em>change</em>: a short spike at each page turn, then nothing. That is why a reader can last for weeks and why a page can survive the battery dying.</p>
    <p class="tip"><b>Try it:</b> slide the light from a dark room to direct sun, then switch the power off.</p>
    <p class="note">Brightness numbers and power units here are illustrative round figures, not measurements.</p>`,
  terms: [
    { t: 'Reflective', d: 'Showing a picture by bouncing room light back to the eye, as paper does.' },
    { t: 'Emissive', d: 'Showing a picture by making its own light, as an LCD backlight or an OLED does.' },
    { t: 'Bistable', d: 'Stable in two states with no power: an e-ink dot stays white or black until a new pulse changes it.' },
    { t: 'Contrast ratio', d: 'How many times brighter the white is than the black. Glare on glass shrinks it.' },
  ],
  defaults: { lux: 400, power: true, rate: 3 },
  controls: [
    { key: 'lux', type: 'log', label: 'Light falling on the screen', min: 0.5, max: 100000, fmt: (v) => `${luxName(v)} · ${v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 0 : 1) + 'k' : Math.round(v)} lux` },
    { key: 'power', type: 'toggle', label: 'Battery connected' },
    { key: 'rate', type: 'range', label: 'Page turns per minute', min: 0, max: 6, step: 1, fmt: (v) => (v === 0 ? 'None, just staring' : v) },
  ],
  quiz: [
    { q: 'Why does an LCD wash out in direct sun?', options: ['Its backlight turns off', 'Glare adds the same light to its white and black, shrinking the contrast', 'The glass heats up', 'The pixels run out of colour'], answer: 1, why: 'The reflected glare is added to both the bright and dark parts, so the ratio between them falls toward 1.' },
    { q: 'Why does e-ink get easier to read in bright light?', options: ['It makes its own light', 'It reflects the light, so more light means a brighter white and the same contrast', 'It has a polarising filter', 'It switches to a larger font'], answer: 1, why: 'A reflective page scales with the light falling on it, as a printed page does.' },
    { q: 'What does bistable mean for an e-reader?', options: ['It has two screens', 'The page stays on screen with no power; power is only used to change it', 'It can be read from two sides', 'It has two batteries'], answer: 1, why: 'The particles hold their positions with no field, so only page turns draw power.' },
  ],
  reel: [
    { ms: 5600, caption: 'In bright sun the glare washes out a phone screen. An e-ink page just gets easier to read.', set: { lux: 300, power: true, rate: 2 }, anim: { lux: [300, 80000, true] }, view: { pos: [0, 3.3, 12.5], target: [0, 2.3, 0] }, spin: 0 },
    { ms: 5000, caption: 'Pull the plug and the e-ink page stays put. The others go dark.', set: { lux: 600, power: false, rate: 0 }, view: { pos: [0, 3.2, 12], target: [0, 2.3, 0] }, spin: 0 },
  ],
  build({ stage, s }) {
    stage.floor.visible = false;
    const root = new THREE.Group(); stage.root.add(root);
    const panels = KINDS.map((k) => {
      const frameMesh = box(2.9, 3.7, 0.22, M.plastic(0x1b1e29, { roughness: 0.5 })); frameMesh.position.set(k.x, 2.5, -0.12); root.add(frameMesh);
      const tx = canvasTexture(256, 330, () => {});
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.35), new THREE.MeshBasicMaterial({ map: tx.tex, toneMapped: false })); scr.position.set(k.x, 2.5, 0.0); root.add(scr);
      stage.label(k.name, [k.x, 0.52, 0.1], root, k.id === 'eink' ? 'hot' : '');
      return { ...k, tx, g: tx.canvas.getContext('2d'), key: '' };
    });
    // sun
    const sun = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffd36b, toneMapped: false })); sun.position.set(6.4, 6.2, -1); root.add(sun);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(0.9, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffd36b, transparent: true, opacity: 0.2, depthWrite: false })); halo.position.copy(sun.position); root.add(halo);
    const sunLbl = stage.label('light', [6.4, 7.2, -1], root);
    // power graph
    const pg = canvasTexture(960, 190, () => {});
    const gp = new THREE.Mesh(new THREE.PlaneGeometry(10.4, 2.06), new THREE.MeshBasicMaterial({ map: pg.tex, toneMapped: false })); gp.position.set(0, -0.9, 0); root.add(gp);
    const pgc = pg.canvas.getContext('2d');
    const hist = { eink: [], lcd: [], oled: [] };
    let clock = 0, lastTurn = -1e9, energy = { eink: 0, lcd: 0, oled: 0 }, gtick = 0, flash = 0, lastPower = true;
    const powerNow = (id, st, tm) => {
      if (!st.power) return 0;
      if (id === 'lcd') return 25;
      if (id === 'oled') return 20;
      return tm < 1 ? 60 : 0.3;
    };
    const drawPanel = (p, st, inv) => {
      const [Lw, Lb] = lum(p.id, st.lux);
      let bg = vis(Lw), fg = bg * Math.pow(Lb / Lw, 0.45);
      const on = p.id === 'eink' || st.power;
      if (!on) { bg = 0.03; fg = 0.03; }
      if (inv && p.id === 'eink') [bg, fg] = [fg + 0.02, bg];
      const key = [bg.toFixed(3), fg.toFixed(3), on].join();
      if (key === p.key) return; p.key = key;
      const g = p.g; const tint = p.id === 'eink' ? [0.97, 0.98, 0.93] : [0.96, 0.98, 1];
      const col = (v) => { const c = (a) => Math.round(clamp(v * a, 0, 1) * 255); return `rgb(${c(tint[0])},${c(tint[1])},${c(tint[2])})`; };
      g.fillStyle = col(bg); g.fillRect(0, 0, 256, 330);
      if (on) {
        pseudoText(g, 14, 18, 228, 40, col(fg), col(bg), 3);
        g.fillStyle = col(fg); g.fillRect(16, 74, 130, 7);
        pseudoText(g, 14, 96, 228, 220, col(fg), col(bg), 7);
        g.fillStyle = col(fg); g.fillRect(14, 306, 60, 6);
      } else { g.fillStyle = 'rgba(255,255,255,.06)'; g.font = '14px sans-serif'; g.fillText('off', 112, 170); }
      if (p.id !== 'eink' && on) { const ga = clamp(Math.log10(st.lux / 100) / 3, 0, 0.6); const gr = g.createLinearGradient(0, 0, 256, 330); gr.addColorStop(0.2, `rgba(255,255,255,0)`); gr.addColorStop(0.5, `rgba(255,255,255,${ga})`); gr.addColorStop(0.8, `rgba(255,255,255,0)`); g.fillStyle = gr; g.fillRect(0, 0, 256, 330); }
      p.tx.tex.needsUpdate = true;
    };
    const drawGraph = (st) => {
      const g = pgc; g.fillStyle = '#10131b'; g.fillRect(0, 0, 960, 190);
      g.font = '14px sans-serif';
      const rows = [['eink', 'E-ink', '#8ef0ff'], ['lcd', 'LCD', '#ff7a59'], ['oled', 'OLED', '#ffb547']];
      rows.forEach(([id, name, c], r) => {
        const y0 = 56 + r * 50 - 0, h = 36;
        g.fillStyle = 'rgba(255,255,255,.55)'; g.fillText(name, 10, y0 - 12);
        g.strokeStyle = 'rgba(255,255,255,.15)'; g.beginPath(); g.moveTo(80, y0); g.lineTo(950, y0); g.stroke();
        g.strokeStyle = c; g.lineWidth = 2.5; g.beginPath();
        const H = hist[id];
        H.forEach((pt, i) => { const x = 80 + ((pt.t - (clock - 60)) / 60) * 870; const y = y0 - Math.min(1, pt.p / 60) * h; if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); });
        g.stroke();
      });
      g.fillStyle = 'rgba(255,255,255,.5)'; g.fillText('relative power over the last minute of model time (illustrative units)', 340, 14);
      pg.tex.needsUpdate = true;
    };
    return {
      update(dt, st, time) {
        const dm = dt * SPEED; clock += dm;
        if (st.rate > 0 && clock - lastTurn >= PERIOD(st.rate)) { lastTurn = clock; flash = 0.35; }
        if (st.rate === 0) lastTurn = Math.min(lastTurn, clock - 1e6);
        flash = Math.max(0, flash - dt);
        KINDS.forEach((k) => {
          const pw = powerNow(k.id, st, clock - lastTurn);
          energy[k.id] += pw * dm;
          const H = hist[k.id]; const last = H[H.length - 1];
          if (!last || clock - last.t > 0.25) H.push({ t: clock, p: pw });
          while (H.length && H[0].t < clock - 62) H.shift();
        });
        panels.forEach((p) => drawPanel(p, st, flash > 0 && st.power));
        drawGraph(st);
        const k = clamp(Math.log10(st.lux / 0.5) / Math.log10(2e5), 0, 1);
        sun.scale.setScalar(0.7 + k * 0.9); halo.scale.setScalar(1 + k * 1.8); halo.material.opacity = 0.08 + 0.3 * k;
        sunLbl.element.textContent = luxName(st.lux);
      },
      readout(st) {
        const c = (id) => { const [w, b] = lum(id, st.lux); return w / b; };
        const fmt = (v) => (v > 99 ? Math.round(v) : v.toFixed(1)) + ':1';
        const tot = energy.lcd || 1;
        return `<div class="big">${luxName(st.lux)}</div>
          <div class="row"><span>E-ink contrast</span><b class="${st.lux < 3 ? 'no' : 'ok'}">${st.lux < 3 ? 'too dark to read' : fmt(c('eink'))}</b></div>
          <div class="row"><span>LCD contrast</span><b class="${c('lcd') < 3 ? 'no' : 'ok'}">${fmt(c('lcd'))}</b></div>
          <div class="row"><span>OLED contrast</span><b class="${c('oled') < 3 ? 'no' : 'ok'}">${fmt(c('oled'))}</b></div>
          <div class="row"><span>Energy used so far</span><b>${energy.lcd < 400 ? 'measuring…' : 'E-ink ' + Math.round(100 * energy.eink / tot) + '% of LCD'}</b></div>`;
      },
    };
  },
};
