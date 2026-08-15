import React from 'react';

export const LoadingScreen: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-[60vh] w-full animate-fade-in space-y-4">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 rounded-full border-4 border-surface2"></div>
      <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
    </div>
    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary/50 animate-pulse">Chargement</div>
  </div>
);
