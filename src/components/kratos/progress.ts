export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** normalized 0..1 progress inside a sub-range of the master timeline */
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));

export const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** rises 0->1 then falls back to 0 across the window, with a hold in the middle */
export const pulse = (t: number, inEnd = 0.25, outStart = 0.75) => {
  if (t < inEnd) return easeOut(t / inEnd);
  if (t > outStart) return 1 - easeInOut((t - outStart) / (1 - outStart));
  return 1;
};

export const ACTS = {
  awaken: [0.0, 0.14],
  technical: [0.14, 0.31],
  spark: [0.31, 0.46],
  online: [0.46, 0.6],
  playground: [0.6, 0.73],
  hackathon: [0.73, 0.86],
  hero: [0.86, 1.0],
} as const;
