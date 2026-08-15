import React, { useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { Icons } from '../icons/Icons';

const AUTO_DISMISS_MS = 6000;

const STYLES: Record<string, string> = {
  error: 'bg-danger/10 border-danger/30 text-danger',
  success: 'bg-success/10 border-success/30 text-success',
  info: 'bg-surface2 border-white/10 text-foreground',
};

export const ToastHost: React.FC = () => {
  const toasts = useStore((s) => s.toasts);
  const dismissToast = useStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 inset-x-0 z-[200] flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} id={t.id} type={t.type} message={t.message} onDismiss={dismissToast} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ id: string; type: string; message: string; onDismiss: (id: string) => void }> = ({
  id,
  type,
  message,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  return (
    <div
      role="alert"
      className={`pointer-events-auto w-full max-w-sm rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-sm flex items-start gap-3 animate-fade-in ${STYLES[type] || STYLES.info}`}
    >
      <span className="text-sm font-bold leading-snug flex-1">{message}</span>
      <button onClick={() => onDismiss(id)} className="opacity-70 hover:opacity-100 shrink-0">
        <Icons.Close size={16} />
      </button>
    </div>
  );
};
