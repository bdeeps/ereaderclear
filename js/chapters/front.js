// Chapter 5: the stack, a frontlight, colour and the trade-offs. An e-reader panel is a stack: a frontlight
// (an edge-lit light guide that shines down onto the page, not at your eyes), the ink film, and a thin-film
// transistor backplane that addresses each pixel. Colour comes either from a colour-filter layer over a
// black-and-white film (E Ink Kaleido, announced Dec 2019; Kindle Colorsoft 2024: 300 ppi black-and-white,
// 150 ppi colour) or from four pigments in each capsule (Advanced Color ePaper: cyan, magenta, yellow and
// white; Gallery). The speed, ghosting and detail ratings are a rough qualitative guide, not measurements.
import { THREE, M, canvasTexture, box, swarm, clamp, lerp, rng } from '../eink.js';

const COLS = 14, ROWS = 9, SP = 0.43;
const YC = [1.55, 1.45, 1.35, 1.25], YE = [4.5, 3.3, 2.1, 0.9];
const MODES = {
  mono: { name: 'Black and white', speed: 3, clean: 3, detail: 3, say: 'One black and one white pigment per capsule. The sharpest, fastest and cleanest option, with 16 shades of grey on current readers.' },
  filter: { name: 'Colour filter', speed: 3, clean: 3, detail: 2, say: 'The same black and white film, with a tiny red, green and blue filter over each dot. Kindle Colorsoft is 300 ppi in black and white but 150 ppi in colour, and the filter makes whites a little dimmer.' },
  acep: { name: 'Four pigments', speed: 1, clean: 2, detail: 3, say: 'Cyan, magenta, yellow and white particles in every capsule, mixed by careful pulses. Full resolution colour, but each update takes longer and flashes more.' },
};
const bars = (n) => `<span style="display:inline-block;width:${n * 22}px;height:8px;border-radius:2px;background:var(--c)"></span><span style="display:inline-block;width:${(3 - n) * 22}px;height:8px;border-radius:2px;background:rgba(255,255,255,.12)"></span>`;

export default {
  id: 'front',
  short: 'Light, colour, trade-offs',
  title: 'The stack, the frontlight and colour',
  subtitle: 'What sits above and below the ink, and what colour costs.',
  view: { pos: [6.5, 4.4, 9.2], target: [0, 2.5, 0] },
  learn: `<p>Pull a reader apart and you find a stack. On top is the <b>frontlight</b>: a clear plastic sheet lit from its edge by LEDs, with microscopic dots that scatter light downward. It shines on the page, not into your eyes, which is why it feels like reading by a lamp. Under it is the ink film, and under that a <b>backplane</b> of tiny transistors that gives each pixel its voltage.</p>
    <p>Colour is a trade. A <b>colour filter</b> over the black-and-white film is simple and fast, but it spreads each colour over several dots, so colour is blurrier than black and white, and the filter dims the whites. Putting <b>four pigments</b> in every capsule gives sharper colour, but moving them to the right mix takes longer, so colour pages refresh slowly.</p>
    <p>Every choice trades speed, clean updates and detail against each other. That is why e-readers are great for books and poor for video.</p>
    <p class="tip"><b>Try it:</b> turn off the room light and slide the frontlight up, spread the layers apart, then compare the three kinds of panel.</p>`,
  terms: [
    { t: 'Frontlight', d: 'An edge-lit sheet over the screen that lights the page from the front, unlike a backlight that shines through.' },
    { t: 'Backplane', d: 'The layer of thin-film transistors that applies a voltage to each pixel.' },
    { t: 'Colour filter array', d: 'A grid of red, green and blue filters over each dot, so a black-and-white film can show colour.' },
  ],
  defaults: { panel: 'mono', room: true, light: 0.6, explode: 0.7 },
  controls: [
    { key: 'panel', type: 'seg', label: 'Kind of panel', options: [{ v: 'mono', label: 'Black & white' }, { v: 'filter', label: 'Colour filter' }, { v: 'acep', label: 'Four pigments' }] },
    { key: 'room', type: 'toggle', label: 'Room light on' },
    { key: 'light', type: 'range', label: 'Frontlight', min: 0, max: 1, step: 0.01, fmt: (v) => (v < 0.02 ? 'Off' : Math.round(v * 100) + '%') },
    { key: 'explode', type: 'range', label: 'Spread the layers', min: 0, max: 1, step: 0.01, fmt: (v) => (v < 0.05 ? 'Together' : Math.round(v * 100) + '%') },
  ],
  quiz: [
    { q: 'How is a frontlight different from a backlight?', options: ['It is brighter', 'It lights the page from the front, like a lamp, instead of shining through the screen', 'It uses a different battery', 'It is always on'], answer: 1, why: 'An e-reader frontlight shines down onto the reflective page; a backlight shines up through a transmissive screen.' },
    { q: 'What does a colour filter over an e-ink film cost you?', options: ['Nothing', 'Colour is blurrier than black and white, and whites get dimmer', 'The ink stops being bistable', 'It needs a bigger battery'], answer: 1, why: 'Each colour uses several dots and the filter absorbs some light.' },
    { q: 'Why do e-readers suit books better than video?', options: ['Their screens are small', 'The particles take a noticeable fraction of a second to move and flashes clean up ghosts', 'They have no processor', 'Video needs sound'], answer: 1, why: 'Particles drifting through fluid are slower than liquid crystals or OLEDs, so e-ink trades speed for paper-like reading.' },
  ],
  reel: [
    { ms: 5600, caption: 'Take the screen apart. The frontlight lights the page from the front, like a lamp.', set: { panel: 'mono', room: false, light: 0.7, explode: 0.85 }, view: { pos: [6.5, 4.4, 9.2], target: [0, 2.5, 0] }, spin: 0.35 },
  ],
  build({ stage, s }) {
    stage.floor.visible = false;
    const root = new THREE.Group(); stage.root.add(root);
    const W = COLS * SP + 0.3, D = ROWS * SP + 0.3;
    const mk = (obj, name, cls) => { root.add(obj); obj.userData.lbl = stage.label(name, [-W / 2 - 0.3, 0, D / 2 + 0.2], obj, cls); return obj; };
    const guide = new THREE.Group(); guide.add(new THREE.Mesh(new THREE.BoxGeometry(W, 0.1, D), M.clear(0xdff0ff, 0.28, { roughness: 0.05 })));
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, D * 0.92), new THREE.MeshBasicMaterial({ color: 0xfff1c9, toneMapped: false })); strip.position.x = -W / 2 - 0.02; guide.add(strip);
    const ftx = canvasTexture(256, 256, (g) => { const r = rng(4); g.clearRect(0, 0, 256, 256); g.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 160; i++) g.fillRect(r() * 256, r() * 256, 2, 2); });
    const dots = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshBasicMaterial({ map: ftx.tex, transparent: true, opacity: 0.6, depthWrite: false })); dots.rotation.x = -Math.PI / 2; dots.position.y = 0.06; guide.add(dots);
    const filt = new THREE.Group();
    const ctx = canvasTexture(192, 128, (g) => { for (let x = 0; x < 192; x += 3) { g.fillStyle = ['#ff3b3b', '#3bff6b', '#3b6bff'][(x / 3) % 3]; g.fillRect(x, 0, 3, 128); } });
    ctx.tex.wrapS = ctx.tex.wrapT = THREE.RepeatWrapping;
    const fm = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshBasicMaterial({ map: ctx.tex, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide })); fm.rotation.x = -Math.PI / 2; filt.add(fm);
    const film = new THREE.Group(); const filmBase = box(W, 0.06, D, M.matte(0x2b2f3b)); film.add(filmBase);
    const caps = swarm(COLS * ROWS, new THREE.SphereGeometry(0.19, 14, 10), M.matte(0xffffff, { roughness: 0.9 }));
    caps.castShadow = false; film.add(caps); caps.position.y = 0.2;
    const cols = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { caps.place(r * COLS + c, [(c - (COLS - 1) / 2) * SP, 0, (r - (ROWS - 1) / 2) * SP]); cols.push([r, c]); caps.setColorAt(r * COLS + c, new THREE.Color(1, 1, 1)); }
    caps.done();
    const back = new THREE.Group(); back.add(box(W, 0.12, D, M.matte(0x1a2030)));
    const btx = canvasTexture(256, 192, (g) => { g.fillStyle = '#1a2030'; g.fillRect(0, 0, 256, 192); g.strokeStyle = 'rgba(142,240,255,.35)'; g.lineWidth = 1; for (let x = 0; x <= 256; x += 18) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 192); g.stroke(); } for (let y = 0; y <= 192; y += 18) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); } });
    const bp = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshBasicMaterial({ map: btx.tex })); bp.rotation.x = -Math.PI / 2; bp.position.y = 0.07; back.add(bp);
    const layers = [mk(guide, 'frontlight guide', 'hot'), mk(filt, 'colour filter'), mk(film, 'ink film (the capsules)'), mk(back, 'transistor backplane')];
    // rays from the guide down to the film
    const rayGeo = new THREE.BufferGeometry(); const rp = new Float32Array(60 * 6); rayGeo.setAttribute('position', new THREE.BufferAttribute(rp, 3));
    const rr = rng(8); const rx = Array.from({ length: 60 }, () => [(rr() - 0.5) * W * 0.9, (rr() - 0.5) * D * 0.9]);
    const rays = new THREE.LineSegments(rayGeo, new THREE.LineBasicMaterial({ color: 0xfff1c9, transparent: true, opacity: 0.5 })); root.add(rays);
    const pat = (r, c) => Math.sin(c * 1.3 + r * 0.4) * Math.cos(r * 1.7 - c * 0.2) > 0.1;
    let lastKey = '';
    const paintCaps = (st, base) => {
      const key = [st.panel, base.toFixed(2)].join(); if (key === lastKey) return; lastKey = key;
      const C = new THREE.Color(); const pal = [[0.05, 0.85, 0.95], [0.95, 0.15, 0.6], [1, 0.9, 0.1], [1, 1, 1], [0.1, 0.1, 0.12]];
      cols.forEach(([r, c], i) => {
        if (st.panel === 'acep') { const p = pal[Math.floor(Math.abs(Math.sin(r * 12.9898 + c * 78.233) * 43758.5453) % 1 * 5)]; C.setRGB(p[0] * base, p[1] * base, p[2] * base); }
        else { const w = pat(r, c); const v = (w ? 0.95 : 0.05) * base * (st.panel === 'filter' && w ? 0.8 : 1); C.setRGB(v, v, v * 0.97); }
        caps.setColorAt(i, C);
      });
      caps.instanceColor.needsUpdate = true;
    };
    return {
      update(dt, st) {
        const k = st.explode, vf = st.panel === 'filter';
        layers.forEach((L, i) => { L.position.y = lerp(YC[i], YE[i], k); });
        layers[1].visible = vf;
        layers.forEach((L, i) => { L.userData.lbl.visible = k > 0.25 && (i !== 1 || vf); });
        const ambient = st.room ? 1 : 0.07, base = clamp(ambient + st.light * (st.room ? 0.35 : 0.9), 0.05, 1) * (st.room ? 1 : 1);
        paintCaps(st, base);
        strip.material.color.setRGB(0.3 + st.light * 0.7, 0.28 + st.light * 0.65, 0.2 + st.light * 0.55);
        const y0 = layers[0].position.y - 0.05, y1 = layers[2].position.y + 0.3; let n = 0;
        rx.forEach(([x, z]) => { rp.set([x, y0, z, x, y1, z], n); n += 6; });
        rayGeo.attributes.position.needsUpdate = true;
        rays.visible = st.light > 0.02; rays.material.opacity = 0.15 + 0.6 * st.light;
        ctx.tex.repeat.set(1, 1);
      },
      readout(st) {
        const m = MODES[st.panel];
        return `<div class="big">${m.name}</div><p class="r-say">${m.say}</p>
          <div class="row"><span>Update speed</span>${bars(m.speed)}</div><div class="row"><span>Clean updates</span>${bars(m.clean)}</div><div class="row"><span>Detail</span>${bars(m.detail)}</div>
          <p class="r-say" style="margin-bottom:0">Rough guide, not measurements.${!st.room && st.light < 0.05 ? ' <b class="no">Dark room, no frontlight: nothing to read.</b>' : ''}</p>`;
      },
    };
  },
};
