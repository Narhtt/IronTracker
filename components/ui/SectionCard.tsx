import React from 'react';

interface SectionCardProps {
  children?: React.ReactNode;
  className?: string;
  radius?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({ children, className = '', radius = 'rounded-[2rem]' }) => (
  <div className={`glass shadow-sm ${radius} ${className}`}>{children}</div>
);
