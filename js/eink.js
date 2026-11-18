// Shared parts for EreaderClear: a drawn microcapsule whose particles follow a Pop (see pop.js), colours,
// and a few small helpers.
import { THREE, M, swarm, clamp, lerp, smooth, approach } from './kit.js';
import { Pop, rng } from './pop.js';

export { THREE, M, clamp, lerp, smooth, approach, Pop, rng };
export { box, canvasTexture, swarm, arrow, beam } from './kit.js';
export const COL = { white: 0xf2f4fa, black: 0x34384a, pos: 0xffb547, neg: 0x8ef0ff, cyan: 0x8ef0ff, amber: 0xffb547, coral: 0xff7a59, lime: 0xa3e635, violet: 0xc49bff };
export const grey = (v) => { const c = Math.round(clamp(v, 0, 1) * 255); return `rgb(${c},${c},${c})`; };

// A capsule of radius R. Pass a Pop; call place(t, jitter) every frame.
export class CapsuleView {
  constructor(pop, R = 1, { shell = true, seed = 3, size } = {}) {
    this.pop = pop; this.R = R;
    this.obj = new THREE.Group();
    const n = pop.n, pr = R * (size ?? (n > 20 ? 0.085 : 0.11));
    this.pr = pr;
    if (shell) {
      const fluid = new THREE.Mesh(new THREE.SphereGeometry(R, 40, 24), M.clear(0xcfe8ff, 0.14, { roughness: 0.05 }));
      const wall = new THREE.Mesh(new THREE.SphereGeometry(R * 1.01, 40, 24), new THREE.MeshBasicMaterial({ color: 0x8ef0ff, wireframe: true, transparent: true, opacity: 0.1, depthWrite: false }));
      this.obj.add(fluid, wall); this.fluid = fluid; this.wall = wall;
    }
    this.W = swarm(n, new THREE.SphereGeometry(pr, 14, 10), M.plastic(COL.white, { roughness: 0.4 }));
    this.B = swarm(n, new THREE.SphereGeometry(pr, 14, 10), M.plastic(COL.black, { roughness: 0.3, emissive: 0x1c1e28 }));
    this.W.castShadow = this.B.castShadow = false;
    this.obj.add(this.W, this.B);
    const r = rng(seed);
    this.ang = new Float32Array(n * 2); this.rad = new Float32Array(n * 2); this.ph = new Float32Array(n * 2);
    for (let i = 0; i < n * 2; i++) { this.ang[i] = r() * Math.PI * 2; this.rad[i] = Math.sqrt(r()); this.ph[i] = r() * 6.28; }
    this.place(0, 0);
  }
  // world position of particle i (relative to the capsule centre)
  at(i, t, jit) {
    const R = this.R, y = this.pop.y[i], py = y * R * 0.9;
    const rmax = Math.sqrt(Math.max(0.0004, (R * 0.9) ** 2 - py * py)) - this.pr * 0.6;
    const a = this.ang[i] + Math.sin(t * 0.7 + this.ph[i]) * 0.35 * jit;
    const rr = this.rad[i] * Math.max(0, rmax);
    return [Math.cos(a) * rr + Math.sin(t * 2.1 + this.ph[i] * 3) * 0.02 * R * jit, py + Math.cos(t * 1.7 + this.ph[i]) * 0.025 * R * jit, Math.sin(a) * rr];
  }
  place(t, jit = 1) {
    const n = this.pop.n;
    for (let i = 0; i < n; i++) { this.W.place(i, this.at(i, t, jit)); this.B.place(i, this.at(i + n, t, jit)); }
    this.W.done(); this.B.done();
  }
  setShell(on) { if (this.fluid) this.fluid.visible = this.wall.visible = on; }
}

// Draw a short run of pseudo-text lines (grey bars) onto a 2D canvas context.
export function pseudoText(g, x, y, w, h, fg, bg, seed = 5) {
  g.fillStyle = bg; g.fillRect(x, y, w, h);
  const r = rng(seed); g.fillStyle = fg;
  const lh = Math.max(5, h / 9);
  for (let ly = y + lh * 0.8; ly < y + h - lh; ly += lh * 1.45) {
    let lx = x + w * 0.07; const end = x + w * (ly > y + h - lh * 3 ? 0.55 : 0.93);
    while (lx < end) { const ww = Math.min(end - lx, lh * (1.2 + r() * 3.4)); g.fillRect(lx, ly, ww, lh * 0.5); lx += ww + lh * 0.7; }
  }
}
