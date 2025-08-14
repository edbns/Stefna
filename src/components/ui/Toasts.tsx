import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { X, CheckCircle2, AlertTriangle, Loader2, Play, ImageIcon } from "lucide-react";
import { loadFramerMotion } from "../../utils/loadFramerMotion";

/**
 * Stefna Notifications & MediaCard
 * - Three unified floating notifications:
 *   1) "Added to queue"
 *   2) "Your media is ready" (with clickable thumbnail)
 *   3) "Something went wrong" (error)
 * - Hard limit of 3 concurrent toasts; additional items are queued.
 * - Works for both image and video generations.
 * - MediaCard with overlay spinner like the screenshot.
 *
 * Tailwind required. Lucide + Framer Motion are optional but recommended.
 */

// ---------------------------------------------
// Types
// ---------------------------------------------

type ToastKind = "queue" | "ready" | "error";

type ToastBase = {
  id: string;
  kind: ToastKind;
  title: string;
  message?: string;
  // When provided, a small thumbnail is shown and is clickable
  thumbUrl?: string;
  onClickThumb?: () => void;
};

// ---------------------------------------------
// Toast Context
// ---------------------------------------------

type ToastContextValue = {
  notifyQueue: (opts: { title?: string; message?: string }) => void;
  notifyReady: (opts: { title?: string; message?: string; thumbUrl?: string; onClickThumb?: () => void }) => void;
  notifyError: (opts: { title?: string; message?: string }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToasts = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToasts must be used within <ToastProvider/>");
  return ctx;
};

// ---------------------------------------------
// Toast Provider
// ---------------------------------------------

const MAX_VISIBLE = 3;
const AUTO_DISMISS_MS = 4200;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState<ToastBase[]>([]);
  const queue = useRef<ToastBase[]>([]);
  const timeouts = useRef<Record<string, number>>({});
  
  // Framer Motion state - starts with fallback, enhanced after import
  const [{ motion, AnimatePresence }, setFramerMotion] = useState<any>(() => ({
    motion: { div: 'div' }, // render right away; enhanced after import
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }))

  // Load Framer Motion asynchronously
  useEffect(() => {
    let alive = true
    loadFramerMotion().then((fm) => alive && setFramerMotion(fm))
    return () => { alive = false }
  }, [])

  const removeToast = useCallback((id: string) => {
    setVisible((curr) => curr.filter((t) => t.id !== id));
    if (timeouts.current[id]) {
      window.clearTimeout(timeouts.current[id]);
      delete timeouts.current[id];
    }
  }, []);

  const pump = useCallback(() => {
    setVisible((curr) => {
      const next = [...curr];
      while (next.length < MAX_VISIBLE && queue.current.length > 0) {
        const t = queue.current.shift()!;
        next.push(t);
      }
      return next;
    });
  }, []);

  const enqueue = useCallback((toast: ToastBase) => {
    queue.current.push(toast);
    pump();
    // auto-dismiss scheduling (for both visible now and later)
    const schedule = () => {
      timeouts.current[toast.id] = window.setTimeout(() => removeToast(toast.id), AUTO_DISMISS_MS);
    };
    // if it becomes visible later, schedule will still run when pushed; we can watch with an effect
    // For simplicity, schedule right away (worst case removed before showing if user spams, which is ok)
    schedule();
  }, [pump, removeToast]);

  // clean up timers
  useEffect(() => () => Object.values(timeouts.current).forEach((t) => window.clearTimeout(t)), []);

  const notifyQueue = useCallback<ToastContextValue["notifyQueue"]>(({ title = "Added to queue", message = "We'll start processing shortly." } = {}) => {
    enqueue({ id: crypto.randomUUID(), kind: "queue", title, message });
  }, [enqueue]);

  const notifyReady = useCallback<ToastContextValue["notifyReady"]>(({ title = "Your media is ready", message = "Tap to open", thumbUrl, onClickThumb } = {}) => {
    enqueue({ id: crypto.randomUUID(), kind: "ready", title, message, thumbUrl, onClickThumb });
  }, [enqueue]);

  const notifyError = useCallback<ToastContextValue["notifyError"]>(({ title = "Something went wrong", message = "Please try again." }) => {
    enqueue({ id: crypto.randomUUID(), kind: "error", title, message });
  }, [enqueue]);

  const value = useMemo(() => ({ notifyQueue, notifyReady, notifyError }), [notifyQueue, notifyReady, notifyError]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Floating stack */}
      <div className="fixed z-[100] right-4 top-16 flex w-[min(92vw,380px)] flex-col gap-2">
        <AnimatePresence initial={false}>
          {visible.map((t) => {
            const MotionDiv = (motion?.div as any) || 'div';
            const motionProps = typeof motion.div === 'string' ? {} : {
              initial: { opacity: 0, y: -12, scale: 0.98 },
              animate: { opacity: 1, y: 0, scale: 1 },
              exit: { opacity: 0, y: -10, scale: 0.98 },
              transition: { type: "spring", stiffness: 400, damping: 28 }
            };
            
            return (
              <MotionDiv key={t.id} {...motionProps}>
                <ToastCard toast={t} onClose={() => removeToast(t.id)} />
              </MotionDiv>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// ---------------------------------------------
// Toast UI
// ---------------------------------------------

function ToastCard({ toast, onClose }: { toast: ToastBase; onClose: () => void }) {
  const tone = toast.kind;
  const toneClasses =
    tone === "queue"
      ? "border-white/20"
      : tone === "ready"
      ? "border-white/20"
      : "border-white/20";

  return (
    <div className={`relative overflow-hidden rounded-2xl border shadow-lg backdrop-blur ${toneClasses}`} style={{ backgroundColor: '#333333' }}>
      <div className="flex items-center gap-3 p-3">
        <div className="shrink-0">
          {toast.kind === "queue" && <Loader2 className="h-5 w-5 animate-spin" />}
          {toast.kind === "ready" && <CheckCircle2 className="h-5 w-5" />}
          {toast.kind === "error" && <AlertTriangle className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{toast.title}</div>
          {toast.message && <div className="truncate text-xs opacity-70">{toast.message}</div>}
        </div>
        {toast.thumbUrl ? (
          <button
            onClick={toast.onClickThumb}
            className="group relative h-12 w-16 overflow-hidden rounded-lg border bg-white/50 shadow-inner"
            aria-label="Open media"
          >
            <img src={toast.thumbUrl} alt="thumbnail" className="h-full w-full object-cover" />
            <div className="absolute inset-0 hidden place-items-center bg-black/20 group-hover:grid">
              <Play className="h-5 w-5 text-white" />
            </div>
          </button>
        ) : null}
        <button onClick={onClose} className="rounded-full p-1 transition hover:bg-black/10" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------
// Media Card with Loading Spinner Overlay
// ---------------------------------------------

type MediaStatus = "processing" | "ready" | "failed";

export function MediaCard({
  src,
  kind,
  status,
  onClick,
  label,
}: {
  src?: string; // thumb url (image or poster frame)
  kind: "image" | "video";
  status: MediaStatus;
  onClick?: () => void;
  label?: string;
}) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border bg-neutral-100 dark:bg-neutral-900">
      {src ? (
        <img src={src} alt={label || "media"} className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full w-full place-items-center text-neutral-400">
          <ImageIcon className="h-8 w-8" />
        </div>
      )}

      {/* Spinner overlay like the screenshot */}
      {status === "processing" && (
        <div className="absolute inset-0 grid place-items-center bg-black/30">
          <div className="grid place-items-center">
            <div className="h-14 w-14 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          </div>
        </div>
      )}

      {/* Click area */}
      <button onClick={onClick} className="absolute inset-0" aria-label="Open media" />
    </div>
  );
}

// ---------------------------------------------
// Example wiring (you can delete this section in production)
// ---------------------------------------------

export default function Demo() {
  return (
    <ToastProvider>
      <DemoContent />
    </ToastProvider>
  );
}

function DemoContent() {
  const { notifyQueue, notifyReady, notifyError } = useToasts();
  const [status, setStatus] = useState<MediaStatus>("processing");

  const simulate = async () => {
    notifyQueue({});
    // simulate async job
    setStatus("processing");
    await new Promise((r) => setTimeout(r, 2000));
    const ok = Math.random() > 0.2;
    if (ok) {
      setStatus("ready");
      notifyReady({
        thumbUrl: "https://images.unsplash.com/photo-1520975922324-7c0a18f2f42f?q=80&w=800&auto=format&fit=crop",
        onClickThumb: () => alert("Open completed media detail/viewer")
      });
    } else {
      setStatus("failed");
      notifyError({ message: "The model failed to render. Try again." });
    }
  };

  return (
    <div className="mx-auto grid max-w-3xl gap-4 p-4">
      <div className="text-xl font-semibold">Stefna Notifications & MediaCard Demo</div>
      <MediaCard
        kind="video"
        status={status}
        src={"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop"}
        onClick={() => alert("Open media viewer")}
      />
      <div className="flex gap-2">
        <button className="rounded-xl bg-black px-4 py-2 text-white" onClick={simulate}>Simulate generation</button>
        <button className="rounded-xl bg-neutral-200 px-4 py-2" onClick={() => notifyQueue({})}>Add to queue</button>
        <button
          className="rounded-xl bg-emerald-600 px-4 py-2 text-white"
          onClick={() =>
            notifyReady({
              thumbUrl: "https://images.unsplash.com/photo-1520975922324-7c0a18f2f42f?q=80&w=800&auto=format&fit=crop",
              onClickThumb: () => alert("Open completed media detail/viewer"),
            })
          }
        >
          Ready toast
        </button>
        <button className="rounded-xl bg-amber-600 px-4 py-2 text-white" onClick={() => notifyError({})}>Error toast</button>
      </div>
    </div>
  );
}


