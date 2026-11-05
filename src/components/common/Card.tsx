import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  subtitle?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  badge,
  action,
  footer,
  hoverEffect = false,
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/80 shadow-card transition-all duration-200 ${
        hoverEffect ? 'hover:shadow-card-hover hover:border-slate-300' : ''
      } ${className}`}
    >
      {(title || subtitle || badge || action) && (
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              {typeof title === 'string' ? (
                <h3 className="font-semibold text-slate-900 text-base tracking-tight">{title}</h3>
              ) : (
                title
              )}
              {badge}
            </div>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
      {footer && <div className="px-5 py-3.5 bg-slate-50/60 border-t border-slate-100 rounded-b-2xl">{footer}</div>}
    </div>
  );
};

