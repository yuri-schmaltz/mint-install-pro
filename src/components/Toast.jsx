// Toast simples (auto-dismiss). Substitui window.alert() em todo o app.
// Resolve débito #11 do gauntlet loop 1.3.2.

import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ICONS = {
  success: { Icon: CheckCircle2, className: 'text-[#87cf3e]' },
  error: { Icon: AlertCircle, className: 'text-rose-400' },
  info: { Icon: Info, className: 'text-sky-400' }
};

let _push = null;

export function pushToast(message, type = 'info', durationMs = 3000) {
  if (_push) _push({ id: Date.now() + Math.random(), message, type, durationMs });
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((t) => {
    setToasts((prev) => [...prev, t]);
  }, []);

  useEffect(() => {
    _push = push;
    return () => { _push = null; };
  }, [push]);

  // Auto-dismiss
  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) =>
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, t.durationMs)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => {
        const { Icon, className } = ICONS[t.type] || ICONS.info;
        return (
          <div
            key={t.id}
            className="bg-[#2a2d32] border border-[#3c4149] rounded-lg shadow-2xl px-4 py-3 flex items-start space-x-3 max-w-sm pointer-events-auto animate-in slide-in-from-right-2 fade-in duration-150"
          >
            <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${className}`} />
            <p className="text-xs text-[#e0e0e0] flex-1 leading-snug">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="text-[#7d828a] hover:text-white flex-shrink-0"
              aria-label="Fechar notificação"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
