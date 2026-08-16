import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Icons } from '../icons/Icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    // If it's a dynamic import failure (chunk load error), clear cache and reload
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isChunkError =
        this.state.error?.message?.includes('dynamically imported module') ||
        this.state.error?.message?.includes('Failed to fetch') ||
        this.state.error?.name === 'ChunkLoadError';

      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center text-danger mb-4 shadow-lg shadow-danger/10">
            <Icons.AlertTriangle size={28} />
          </div>
          <h2 className="text-xl font-black text-foreground uppercase tracking-tight mb-2">
            {isChunkError ? 'Mise à jour détectée' : 'Une erreur est survenue'}
          </h2>
          <p className="text-xs text-secondary max-w-xs mb-6">
            {isChunkError
              ? 'Une nouvelle version de l’application est disponible ou un module doit être rechargé.'
              : this.state.error?.message || 'Un problème inattendu est survenu.'}
          </p>
          <button
            onClick={this.handleReload}
            className="px-5 py-3 bg-primary text-background font-black uppercase text-xs tracking-wider rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <Icons.Reset size={14} strokeWidth={2.5} />
            <span>Recharger l’application</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
