// src/utils/motionShim.ts
// Always provides defined exports; hot-swaps to real Framer Motion if it loads.
const Noop = (p) => p?.children ?? null;
function makeMotionFallback() {
    const base = Noop;
    return new Proxy(base, {
        get: () => Noop, // motion.div / motion.span / etc.
        apply: (_t, _this, args) => Noop(args?.[0]),
    });
}
// Live ESM bindings (consumers see updates after async import)
export let motion = makeMotionFallback();
export let AnimatePresence = Noop;
export let useInView = () => false;
export let useMotionValue = (v) => ({
    get: () => v,
    set: () => { },
    on: () => ({ unsubscribe: () => { } }),
});
// Attempt to import real Framer Motion on the client
(async () => {
    if (typeof window === 'undefined')
        return;
    try {
        const fm = await import('framer-motion');
        motion = fm.motion ?? motion;
        AnimatePresence = fm.AnimatePresence ?? AnimatePresence;
        useInView = fm.useInView ?? useInView;
        useMotionValue = fm.useMotionValue ?? useMotionValue;
    }
    catch (err) {
        console.warn('Framer Motion dynamic import failed; using no-op shim', err);
    }
})();
