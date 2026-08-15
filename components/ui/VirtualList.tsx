import React, { useRef, useState, useLayoutEffect, useMemo } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number; // Hauteur fixe d'un élément (en px)
  renderItem: (item: T, index: number) => React.ReactNode;
  gap?: number; // Espacement entre les éléments
  className?: string;
  buffer?: number; // Nombre d'éléments à pré-charger hors écran
  emptyMessage?: React.ReactNode;
}

export const VirtualList = <T,>({
  items,
  itemHeight,
  renderItem,
  gap = 8,
  className = '',
  buffer = 4,
  emptyMessage = 'Aucun élément.',
}: VirtualListProps<T>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Mesure la hauteur du conteneur au montage et redimensionnement
  useLayoutEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);

    // Double check après un court délai pour les animations d'entrée qui pourraient fausser la mesure initiale
    const timeout = setTimeout(updateHeight, 100);

    return () => {
      window.removeEventListener('resize', updateHeight);
      clearTimeout(timeout);
    };
  }, []);

  // Gestion du scroll optimisée
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollTop = e.currentTarget.scrollTop;
    // Utilisation de requestAnimationFrame pour ne pas spammer le state
    requestAnimationFrame(() => {
      setScrollTop(currentScrollTop);
    });
  };

  // Calculs de virtualisation
  const totalHeight = items.length * (itemHeight + gap) - gap;
  const effectiveItemHeight = itemHeight + gap;

  const startIndex = Math.max(0, Math.floor(scrollTop / effectiveItemHeight) - buffer);
  const endIndex = Math.min(items.length, Math.ceil((scrollTop + containerHeight) / effectiveItemHeight) + buffer);

  const visibleItems = useMemo(() => {
    const visibleNodeList = [];
    // Correction pour les listes vides ou très petites
    const safeEndIndex = Math.min(items.length, endIndex);

    for (let i = startIndex; i < safeEndIndex; i++) {
      visibleNodeList.push({
        index: i,
        top: i * effectiveItemHeight,
        item: items[i],
      });
    }
    return visibleNodeList;
  }, [items, startIndex, endIndex, effectiveItemHeight]);

  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full w-full ${className}`}>
        {typeof emptyMessage === 'string' ? <span className="text-secondary text-sm italic">{emptyMessage}</span> : emptyMessage}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto no-scrollbar relative h-full w-full will-change-transform ${className}`}
      onScroll={handleScroll}
      // Optimisation plus sûre que 'strict' qui causait le collapse à 0px
      style={{ contain: 'layout' }}
    >
      <div style={{ height: `${Math.max(0, totalHeight)}px`, position: 'relative', width: '100%' }}>
        {visibleItems.map(({ index, top, item }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${itemHeight}px`,
              transform: `translateY(${top}px)`,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
};
