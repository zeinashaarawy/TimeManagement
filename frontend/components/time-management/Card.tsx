import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: string;
  onClick?: () => void;
}

export default function Card({ children, className = '', gradient, onClick }: CardProps) {
  return (
    <div 
      className={`group relative cursor-pointer ${onClick ? '' : 'cursor-default'}`}
      onClick={onClick}
    >
      {gradient && (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} blur-xl rounded-3xl opacity-0 group-hover:opacity-30 transition-all`} />
      )}
      <div className={`relative bg-white/5 border border-white/10 backdrop-blur-xl p-6 rounded-3xl hover:border-white/20 transition-all ${onClick ? 'hover:-translate-y-2' : ''} ${className}`}>
        {children}
      </div>
    </div>
  );
}


