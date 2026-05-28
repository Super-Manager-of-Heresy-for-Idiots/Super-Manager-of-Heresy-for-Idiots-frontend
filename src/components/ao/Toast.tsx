import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Rune } from './Rune';

/* ── Types ── */

type ToastType = 'success' | 'error' | 'info';

interface ToastData {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

/* ── Internal state ── */

let toastId = 0;
let addToastFn: ((toast: ToastData) => void) | null = null;

/* ── Public API ── */

export function showToast(
  message: string,
  options?: { type?: ToastType; duration?: number }
) {
  const toast: ToastData = {
    id: ++toastId,
    message,
    type: options?.type ?? 'info',
    duration: options?.duration ?? 3500,
  };
  if (addToastFn) {
    addToastFn(toast);
  }
}

showToast.success = (msg: string, duration?: number) =>
  showToast(msg, { type: 'success', duration });
showToast.error = (msg: string, duration?: number) =>
  showToast(msg, { type: 'error', duration });
showToast.info = (msg: string, duration?: number) =>
  showToast(msg, { type: 'info', duration });

/* ── Single Toast ── */

interface ToastItemProps {
  toast: ToastData;
  onDismiss: (id: number) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, toast.duration);
    return () => clearTimeout(timerRef.current);
  }, [toast.id, toast.duration, onDismiss]);

  const glyphMap: Record<ToastType, string> = {
    success: 'check',
    error: 'x',
    info: 'diamond',
  };

  return (
    <div
      className={`ao-toast ao-toast--${toast.type} ${exiting ? 'ao-toast--exit' : ''}`}
      role="alert"
    >
      <Rune kind={glyphMap[toast.type]} size={16} />
      <span className="ao-toast__msg">{toast.message}</span>
      <button
        className="ao-toast__close"
        onClick={() => {
          setExiting(true);
          setTimeout(() => onDismiss(toast.id), 300);
        }}
        type="button"
      >
        <Rune kind="x" size={12} />
      </button>
    </div>
  );
}

/* ── Toast Container (mount once at app root) ── */

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((toast: ToastData) => {
    setToasts((prev) => [...prev, toast]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => {
      addToastFn = null;
    };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return ReactDOM.createPortal(
    <div className="ao-toast-container">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />
      ))}
    </div>,
    document.body
  );
}
