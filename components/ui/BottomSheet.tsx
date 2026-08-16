import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { triggerHaptic } from '../../core/utils';
import { Icons } from '../icons/Icons';

interface BottomSheetProps {
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  title,
  subtitle,
  isOpen,
  onClose,
  children,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const handleClose = () => {
    triggerHaptic('click');
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Sheet Container */}
      <div className="bg-surface border border-border w-full max-w-lg rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl flex flex-col max-h-[80vh] relative z-10 animate-slide-up sm:animate-zoom-in overflow-hidden">
        {/* Header with Grab Bar */}
        <div className="p-4 border-b border-border flex flex-col items-center justify-center relative bg-surface2/20 flex-shrink-0">
          <div className="w-10 h-1 bg-white/20 rounded-full mb-3 sm:hidden" />
          <div className="w-full flex justify-between items-center px-1">
            <div className="truncate pr-4">
              <h3 className="text-base font-black italic uppercase text-foreground truncate">{title}</h3>
              {subtitle && <p className="text-[10px] text-secondary font-medium truncate">{subtitle}</p>}
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-surface2/50 text-secondary hover:text-foreground transition-colors active:scale-90 flex-shrink-0"
            >
              <Icons.Close size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto no-scrollbar text-foreground">{children}</div>
      </div>
    </div>,
    document.body
  );
};
