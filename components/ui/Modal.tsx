import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { triggerHaptic } from '../../core/utils';
import { Icons } from '../icons/Icons';

interface ModalProps {
  title: string;
  onClose: () => void;
  children?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleManualClose = () => {
    triggerHaptic('click');
    onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop - Utilisation de bg-background pour supporter le thème clair (laitier) ou sombre */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={handleManualClose} />

      {/* Content */}
      <div className="bg-surface border border-border w-full max-w-lg rounded-[2rem] shadow-2xl flex flex-col max-h-[85vh] relative z-10 animate-zoom-in overflow-hidden">
        <div className="p-5 border-b border-border flex justify-between items-center bg-surface2/20 flex-shrink-0">
          <h3 className="text-lg font-black italic uppercase text-foreground truncate pr-4">{title}</h3>
          <button
            onClick={handleManualClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface2/50 text-secondary hover:text-foreground transition-colors active:scale-90"
          >
            <Icons.Close size={18} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto overflow-x-hidden no-scrollbar text-foreground">{children}</div>
      </div>
    </div>,
    document.body
  );
};
