"use client";

import { Check, X } from "lucide-react";
import { createContext, useCallback, useContext, useState } from "react";

interface ToastState {
  id: number;
  message: string;
  tone: "success" | "error";
}

const ToastContext = createContext<{
  notify: (message: string, tone?: ToastState["tone"]) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const notify = useCallback((message: string, tone: ToastState["tone"] = "success") => {
    const id = Date.now();
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="toast-region" aria-live="polite">
        {toasts.map((toast) => (
          <div className={`toast toast-${toast.tone}`} key={toast.id}>
            <span className="toast-icon">
              {toast.tone === "success" ? <Check size={15} /> : <X size={15} />}
            </span>
            <span>{toast.message}</span>
            <button
              aria-label="Dismiss notification"
              onClick={() =>
                setToasts((current) => current.filter((entry) => entry.id !== toast.id))
              }
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast must be used inside ToastProvider");
  return value;
}
