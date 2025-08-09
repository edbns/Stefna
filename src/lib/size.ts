export type Size = { w: number; h: number };

export function mp({ w, h }: Size): number {
  return (w * h) / 1_000_000;
}

export function clampImageToHardMax(
  src: Size, 
  caps: { maxW: number; maxH: number; maxMP: number }
): Size {
  const { w, h } = src;
  
  // If under caps, keep exact size
  if (w <= caps.maxW && h <= caps.maxH && mp(src) <= caps.maxMP) {
    return { w, h };
  }
  
  const sw = caps.maxW / w;
  const sh = caps.maxH / h;
  const s = Math.min(sw, sh, Math.sqrt((caps.maxMP * 1_000_000) / (w * h)));
  
  return { 
    w: Math.floor(w * s), 
    h: Math.floor(h * s) 
  };
}

export function clampVideoToHardMax(
  src: { w: number; h: number; duration?: number; fps?: number },
  caps: { maxW: number; maxH: number; maxSeconds: number; maxFPS: number }
): { w: number; h: number; duration: number; fps: number } {
  return {
    w: Math.min(src.w, caps.maxW),
    h: Math.min(src.h, caps.maxH),
    duration: Math.min(src.duration || 10, caps.maxSeconds),
    fps: Math.min(src.fps || 30, caps.maxFPS)
  };
}
