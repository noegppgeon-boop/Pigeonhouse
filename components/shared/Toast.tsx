"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, AlertTriangle, X, Info, Flame, ExternalLink } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info" | "burn";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  txSig?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (type: ToastType, title: string, opts?: { message?: string; txSig?: string; duration?: number }) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const icons: Record<ToastType, typeof Check> = {
  success: Check,
  error: X,
  warning: AlertTriangle,
  info: Info,
  burn: Flame,
};

const styles: Record<ToastType, { border: string; iconColor: string; titleColor: string }> = {
  success: { border: "border-teal/25", iconColor: "text-teal", titleColor: "text-teal" },
  error:   { border: "border-crimson/25", iconColor: "text-crimson", titleColor: "text-crimson" },
  warning: { border: "border-amber/25", iconColor: "text-amber", titleColor: "text-amber" },
  info:    { border: "border-bronze/25", iconColor: "text-bronze", titleColor: "text-bronze" },
  burn:    { border: "border-crimson/25", iconColor: "text-crimson", titleColor: "text-crimson" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, title: string, opts?: { message?: string; txSig?: string; duration?: number }) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev.slice(-4), { id, type, title, message: opts?.message, txSig: opts?.txSig, duration: opts?.duration ?? 5000 }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-20 md:bottom-6 right-4 z-[100] flex flex-col gap-2 max-w-[340px] w-full pointer-events-none" role="status" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const Icon = icons[toast.type];
  const style = styles[toast.type];

  useEffect(() => {
    const timer = setTimeout(onDismiss, toast.duration || 5000);
    return () => clearTimeout(timer);
  }, [toast.duration, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg border bg-bg-card shadow-md cursor-pointer ${style.border}`}
      onClick={onDismiss}
    >
      <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5 ${style.iconColor}`} style={{ background: "var(--bg-elevated)" }}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[12px] font-semibold ${style.titleColor}`}>{toast.title}</p>
        {toast.message && <p className="text-[11px] text-txt-muted mt-0.5">{toast.message}</p>}
        {toast.txSig && (
          <a href={`https://solscan.io/tx/${toast.txSig}`} target="_blank" rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[10px] text-teal hover:underline mt-1">
            View on Explorer <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
      </div>
      {/* Auto-dismiss progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden rounded-b-lg">
        <motion.div
          className={`h-full ${toast.type === "error" ? "bg-crimson/30" : toast.type === "success" ? "bg-teal/30" : "bg-bronze/30"}`}
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: (toast.duration || 5000) / 1000, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
}
