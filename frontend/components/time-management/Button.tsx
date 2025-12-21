import React from 'react';
import { ChevronRight } from 'lucide-react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export default function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  type = 'button',
  disabled = false,
  className = '',
  icon
}: ButtonProps) {
  const baseClasses = 'relative group px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  
  if (variant === 'primary') {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`${baseClasses} ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-xl blur-sm group-hover:blur-md transition-all" />
        <div className="relative px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-xl flex items-center gap-2">
          {icon || children}
          {icon && children}
          {!icon && <ChevronRight className="w-4 h-4" />}
        </div>
      </button>
    );
  }

  if (variant === 'secondary') {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2 ${className}`}
      >
        {icon}
        {children}
      </button>
    );
  }

  if (variant === 'danger') {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`px-6 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 transition-all flex items-center gap-2 ${className}`}
      >
        {icon}
        {children}
      </button>
    );
  }

  return null;
}


