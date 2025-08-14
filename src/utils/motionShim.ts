// src/utils/motionShim.ts
// Always provides defined exports; hot-swaps to real Framer Motion if it loads.

type FC = (props: any) => any;
const Noop: FC = (p) => p?.children ?? null;

function makeMotionFallback() {
  const base: any = Noop;
  return new Proxy(base, {
    get: () => Noop,                // motion.div / motion.span / etc.
    apply: (_t, _this, args) => Noop(args?.[0]),
  });
}

// Live ESM bindings (consumers see updates after async import)
export let motion: any = makeMotionFallback();
export let AnimatePresence: any = Noop;
export let useInView: any = () => false;
export let useMotionValue: any = (v?: any) => ({
  get: () => v,
  set: () => {},
  on: () => ({ unsubscribe: () => {} }),
});

// Attempt to import real Framer Motion on the client
(async () => {
  if (typeof window === 'undefined') return;
  try {
    const fm: any = await import('framer-motion');
    motion = fm.motion ?? motion;
    AnimatePresence = fm.AnimatePresence ?? AnimatePresence;
    useInView = fm.useInView ?? useInView;
    useMotionValue = fm.useMotionValue ?? useMotionValue;
  } catch (err) {
    console.warn('Framer Motion dynamic import failed; using no-op shim', err);
  }
})();
