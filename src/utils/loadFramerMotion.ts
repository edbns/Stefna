// ESM-safe loader with graceful fallback
export async function loadFramerMotion() {
  // SSR-safe guard
  if (typeof window === 'undefined') {
    return makeFallback();
  }
  try {
    const mod = await import('framer-motion');
    // What we actually use in the app:
    const { motion, AnimatePresence, useInView, useMotionValue } = mod as any;
    return { motion, AnimatePresence, useInView, useMotionValue };
  } catch (err) {
    console.warn('Framer Motion failed to import, using fallback animations:', err);
    return makeFallback();
  }
}

function makeFallback() {
  // Minimal no-op stubs that won't crash your JSX
  const Noop: any = (props: any) => props?.children ?? null;

  // `motion.div`, `motion.span`, etc.
  const motion = new Proxy(Noop, {
    get: () => Noop,
    apply: (_t, _this, args) => Noop(args[0]),
  });

  const AnimatePresence = Noop;
  const useInView = () => false;
  const useMotionValue = (v?: any) => ({
    get: () => v,
    set: () => {},
    on: () => ({ unsubscribe: () => {} }),
  });

  return { motion, AnimatePresence, useInView, useMotionValue };
}
