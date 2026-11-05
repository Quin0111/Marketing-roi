import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'warning' | 'danger' | 'success' | 'outline' | 'neutral';
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  className = '',
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs font-medium' : 'px-2.5 py-1 text-xs font-semibold';

  const variantClasses = {
    primary: 'bg-blue-50 text-blue-700 border border-blue-200',
    secondary: 'bg-navy-50 text-navy-800 border border-navy-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-300',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    outline: 'bg-transparent text-slate-700 border border-slate-300',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg transition-colors ${sizeClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

