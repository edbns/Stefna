import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { X, CheckCircle2, AlertTriangle, Loader2, Play, ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "../../utils/motionShim";
const ToastContext = createContext(null);
export const useToasts = () => {
    const ctx = useContext(ToastContext);
    if (!ctx)
        throw new Error("useToasts must be used within <ToastProvider/>");
    return ctx;
};
// ---------------------------------------------
// Toast Provider
// ---------------------------------------------
const MAX_VISIBLE = 3;
const AUTO_DISMISS_MS = 4200;
export function ToastProvider({ children }) {
    const [visible, setVisible] = useState([]);
    const queue = useRef([]);
    const timeouts = useRef({});
    // Motion components are always available from motionShim
    const removeToast = useCallback((id) => {
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
                const t = queue.current.shift();
                next.push(t);
            }
            return next;
        });
    }, []);
    const enqueue = useCallback((toast) => {
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
    const notifyQueue = useCallback(({ title = "Added to queue", message = "We'll start processing shortly." } = {}) => {
        enqueue({ id: crypto.randomUUID(), kind: "queue", title, message });
    }, [enqueue]);
    const notifyReady = useCallback(({ title = "Your media is ready", message = "Tap to open", thumbUrl, onClickThumb } = {}) => {
        enqueue({ id: crypto.randomUUID(), kind: "ready", title, message, thumbUrl, onClickThumb });
    }, [enqueue]);
    const notifyError = useCallback(({ title = "Something went wrong", message = "Please try again." }) => {
        enqueue({ id: crypto.randomUUID(), kind: "error", title, message });
    }, [enqueue]);
    const value = useMemo(() => ({ notifyQueue, notifyReady, notifyError }), [notifyQueue, notifyReady, notifyError]);
    return (_jsxs(ToastContext.Provider, { value: value, children: [children, _jsx("div", { className: "fixed z-[100] right-4 top-16 flex w-[min(92vw,380px)] flex-col gap-2", children: _jsx(AnimatePresence, { initial: false, children: visible.map((t) => (_jsx(motion.div, { initial: { opacity: 0, y: -12, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -10, scale: 0.98 }, transition: { type: "spring", stiffness: 400, damping: 28 }, children: _jsx(ToastCard, { toast: t, onClose: () => removeToast(t.id) }) }, t.id))) }) })] }));
}
// ---------------------------------------------
// Toast UI
// ---------------------------------------------
function ToastCard({ toast, onClose }) {
    const tone = toast.kind;
    const toneClasses = tone === "queue"
        ? "border-white/20"
        : tone === "ready"
            ? "border-white/20"
            : "border-white/20";
    return (_jsx("div", { className: `relative overflow-hidden rounded-2xl border shadow-lg backdrop-blur ${toneClasses}`, style: { backgroundColor: '#333333' }, children: _jsxs("div", { className: "flex items-center gap-3 p-3", children: [_jsxs("div", { className: "shrink-0", children: [toast.kind === "queue" && _jsx(Loader2, { className: "h-5 w-5 animate-spin" }), toast.kind === "ready" && _jsx(CheckCircle2, { className: "h-5 w-5" }), toast.kind === "error" && _jsx(AlertTriangle, { className: "h-5 w-5" })] }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("div", { className: "truncate text-sm font-semibold", children: toast.title }), toast.message && _jsx("div", { className: "truncate text-xs opacity-70", children: toast.message })] }), toast.thumbUrl ? (_jsxs("button", { onClick: toast.onClickThumb, className: "group relative h-12 w-16 overflow-hidden rounded-lg border bg-white/50 shadow-inner", "aria-label": "Open media", children: [_jsx("img", { src: toast.thumbUrl, alt: "thumbnail", className: "h-full w-full object-cover" }), _jsx("div", { className: "absolute inset-0 hidden place-items-center bg-black/20 group-hover:grid", children: _jsx(Play, { className: "h-5 w-5 text-white" }) })] })) : null, _jsx("button", { onClick: onClose, className: "rounded-full p-1 transition hover:bg-black/10", "aria-label": "Close", children: _jsx(X, { className: "h-4 w-4" }) })] }) }));
}
export function MediaCard({ src, kind, status, onClick, label, }) {
    return (_jsxs("div", { className: "relative aspect-video w-full overflow-hidden rounded-2xl border bg-neutral-100 dark:bg-neutral-900", children: [src ? (_jsx("img", { src: src, alt: label || "media", className: "h-full w-full object-cover" })) : (_jsx("div", { className: "grid h-full w-full place-items-center text-neutral-400", children: _jsx(ImageIcon, { className: "h-8 w-8" }) })), status === "processing" && (_jsx("div", { className: "absolute inset-0 grid place-items-center bg-black/30", children: _jsx("div", { className: "grid place-items-center", children: _jsx("div", { className: "h-14 w-14 animate-spin rounded-full border-2 border-white/40 border-t-white" }) }) })), _jsx("button", { onClick: onClick, className: "absolute inset-0", "aria-label": "Open media" })] }));
}
// ---------------------------------------------
// Example wiring (you can delete this section in production)
// ---------------------------------------------
export default function Demo() {
    return (_jsx(ToastProvider, { children: _jsx(DemoContent, {}) }));
}
function DemoContent() {
    const { notifyQueue, notifyReady, notifyError } = useToasts();
    const [status, setStatus] = useState("processing");
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
        }
        else {
            setStatus("failed");
            notifyError({ message: "The model failed to render. Try again." });
        }
    };
    return (_jsxs("div", { className: "mx-auto grid max-w-3xl gap-4 p-4", children: [_jsx("div", { className: "text-xl font-semibold", children: "Stefna Notifications & MediaCard Demo" }), _jsx(MediaCard, { kind: "video", status: status, src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop", onClick: () => alert("Open media viewer") }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { className: "rounded-xl bg-black px-4 py-2 text-white", onClick: simulate, children: "Simulate generation" }), _jsx("button", { className: "rounded-xl bg-neutral-200 px-4 py-2", onClick: () => notifyQueue({}), children: "Add to queue" }), _jsx("button", { className: "rounded-xl bg-emerald-600 px-4 py-2 text-white", onClick: () => notifyReady({
                            thumbUrl: "https://images.unsplash.com/photo-1520975922324-7c0a18f2f42f?q=80&w=800&auto=format&fit=crop",
                            onClickThumb: () => alert("Open completed media detail/viewer"),
                        }), children: "Ready toast" }), _jsx("button", { className: "rounded-xl bg-amber-600 px-4 py-2 text-white", onClick: () => notifyError({}), children: "Error toast" })] })] }));
}
