// The physics of one microcapsule, as a cartoon. A capsule holds n white (positive) and n black (negative)
// particles. y runs from -1 (rear) to +1 (viewer). A field F in [-1, 1] pushes white up when F > 0 and
// black down; a negative field does the opposite. Distance moved = field x time ("dose") x mobility.
// Every particle has its own mobility (some are sluggish) and its own stiction: sitting against an
// electrode it needs a small push before it breaks free. Those two facts alone produce ghosting.
export const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

export const TRAVEL = 1.42;      // average rail-to-rail distance covered by one unit of dose
export const GREY_K = 2.5;       // how strongly the particles nearest the viewer dominate what you see
const sig = (x) => 1 / (1 + Math.exp(-x));
// The reflectance a driver expects after a nominal dose d (0 = fully black state, 1 = fully white state).
export const nominalRefl = (d) => sig(2 * GREY_K * TRAVEL * (d - 0.5));
export const doseFor = (g) => { g = Math.min(0.995, Math.max(0.005, g)); return Math.log(g / (1 - g)) / (2 * GREY_K * TRAVEL) + 0.5; };

export class Pop {
  constructor(n, seed = 1) {
    const r = rng(seed);
    this.n = n; const N = n * 2;
    this.y = new Float32Array(N); this.lim = new Float32Array(N); this.z = new Float32Array(N);
    this.u = new Float32Array(N); this.kick = new Float32Array(N); this.stuck = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      this.lim[i] = 0.5 + 0.42 * r();
      this.z[i] = Math.max(-1.5, Math.min(1.5, (r() + r() + r() - 1.5) * 1.6));
      this.u[i] = r();
    }
    this.sticky = 0.7;
    this.snap(0.5);
  }
  // Put every particle at fraction k of the way from the black state (0) to the white state (1).
  snap(k) {
    const n = this.n;
    for (let i = 0; i < n * 2; i++) {
      const w = i < n, l = this.lim[i], f = w ? k : 1 - k;
      this.y[i] = -l + 2 * l * f;
      this.stuck[i] = k <= 0.001 || k >= 0.999 ? 1 : 0; this.kick[i] = 0;
    }
  }
  resetKick() { this.kick.fill(0); }
  // Apply field F (signed, -1..1) for `dose` units of time.
  drive(F, dose) {
    if (!F || dose <= 0) return;
    const n = this.n, st = this.sticky, y = this.y, lim = this.lim;
    for (let i = 0; i < n * 2; i++) {
      let d = (i < n ? F : -F) * dose;
      if (this.stuck[i]) {
        const away = y[i] > 0 ? d < 0 : d > 0;
        if (!away) continue;
        this.kick[i] += Math.abs(d);
        const th = this.u[i] * st * 0.4;
        if (this.kick[i] < th) continue;
        d = Math.sign(d) * (this.kick[i] - th); this.kick[i] = 0; this.stuck[i] = 0;
      }
      const mu = Math.max(0.35, 1 + this.z[i] * 0.3 * st);
      let v = y[i] + d * mu * TRAVEL;
      if (v >= lim[i]) { v = lim[i]; this.stuck[i] = 1; this.kick[i] = 0; } else if (v <= -lim[i]) { v = -lim[i]; this.stuck[i] = 1; this.kick[i] = 0; }
      y[i] = v;
    }
  }
  // How bright the pixel looks: 0 black .. 1 white. Particles nearest the viewer count most.
  refl() {
    const n = this.n, y = this.y; let a = 0, b = 0;
    for (let i = 0; i < n; i++) { a += Math.exp(GREY_K * y[i]); b += Math.exp(GREY_K * y[i + n]); }
    return a / (a + b);
  }
}
