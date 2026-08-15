import React from 'react';
import { triggerHaptic } from '../../core/utils';
import { Icons } from '../icons/Icons';

interface EditorHeaderProps {
  title?: string;
  onCancel: () => void;
  onSave: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  children?: React.ReactNode;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  title,
  onCancel,
  onSave,
  saveLabel = 'Sauver',
  cancelLabel = 'Annuler',
  children,
}) => (
  <div className="flex justify-between items-center px-2 py-4 mb-2">
    <button
      onClick={() => {
        triggerHaptic('click');
        onCancel();
      }}
      className="flex items-center gap-1 text-secondary hover:text-white transition-colors py-2 active:scale-95"
    >
      <Icons.ChevronLeft size={18} />
      <span className="text-xs font-bold uppercase tracking-wide">{cancelLabel}</span>
    </button>

    <div className="flex-1 text-center min-w-0 px-4">
      {children || <h2 className="text-lg font-black italic uppercase leading-tight truncate">{title}</h2>}
    </div>

    <button
      onClick={() => {
        triggerHaptic('click');
        onSave();
      }}
      className="flex items-center gap-1 text-primary hover:text-white transition-colors py-2 active:scale-95"
    >
      <span className="text-xs font-bold uppercase tracking-wide">{saveLabel}</span>
      <Icons.Check size={18} />
    </button>
  </div>
);
