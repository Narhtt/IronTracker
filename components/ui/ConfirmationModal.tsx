import React, { useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { triggerHaptic } from '../../core/utils';
import { Icons } from '../icons/Icons';

export const ConfirmationModal: React.FC = () => {
  const confirmation = useStore((s) => s.confirmation);
  const closeConfirmation = useStore((s) => s.closeConfirmation);
  const modalId = useRef(`confirm_${Date.now()}`).current;
  const historyPushed = useRef(false);

  // Gestion du Back Button Android
  useEffect(() => {
    if (!confirmation) return;

    // Push state quand la modale s'ouvre
    try {
      window.history.pushState({ modalId }, '', window.location.href);
      historyPushed.current = true;
    } catch {
      console.debug('History API restricted');
    }

    const handlePopState = () => {
      if (confirmation.onCancel) confirmation.onCancel();
      closeConfirmation();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // Si on ferme via bouton (Confirm/Cancel), on doit nettoyer l'historique
      if (historyPushed.current) {
        try {
          if (window.history.state?.modalId === modalId) {
            window.history.back();
          }
        } catch {
          // Ignore security errors
        }
      }
      historyPushed.current = false;
    };
  }, [confirmation, closeConfirmation, modalId]); // Re-run si confirmation change (mount/unmount virtuel)

  if (!confirmation) return null;

  const {
    title,
    message,
    subMessage,
    confirmLabel = 'Confirmer',
    cancelLabel = 'Annuler',
    variant = 'primary',
    onConfirm,
    onCancel,
  } = confirmation;

  const isDanger = variant === 'danger';

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface border border-border p-6 rounded-[2rem] w-full max-w-sm shadow-2xl space-y-5 animate-zoom-in">
        <div className="flex flex-col items-center gap-2">
          {isDanger && <Icons.TrendUp className="text-warning rotate-180" size={32} />}
          <h3 className={`text-xl font-black italic uppercase text-center ${isDanger ? 'text-foreground' : 'text-foreground'}`}>
            {title || 'Confirmation'}
          </h3>
        </div>

        <div className="space-y-2 text-center">
          <div className={`font-bold text-sm ${isDanger ? 'text-warning' : 'text-foreground'}`}>
            {isDanger && '⚠️ '}
            {message}
          </div>
          {subMessage && <div className="text-xs text-secondary whitespace-pre-wrap">{subMessage}</div>}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => {
              triggerHaptic('click');
              if (onCancel) onCancel();
              // Ici on ferme manuellement, le cleanup fera le history.back() si nécessaire
              closeConfirmation();
            }}
            className="py-3.5 bg-surface2 rounded-xl text-xs font-bold uppercase text-secondary hover:text-foreground hover:bg-surface2/80 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              triggerHaptic(isDanger ? 'success' : 'success');
              onConfirm();
              closeConfirmation();
            }}
            className={`py-3.5 rounded-xl text-xs font-bold uppercase text-black shadow-lg transition-transform active:scale-95 ${isDanger ? 'bg-warning shadow-warning/20' : 'bg-success shadow-success/20'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
