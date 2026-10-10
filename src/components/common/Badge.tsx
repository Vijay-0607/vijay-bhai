import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  icon,
}) => {
  const variantStyles = {
    primary: 'bg-[#1E5E3A]/10 text-[#1E5E3A] border-[#1E5E3A]/30 dark:bg-[#2ECC71]/20 dark:text-[#2ECC71] dark:border-[#2ECC71]/40',
    secondary: 'bg-[#E8A317]/15 text-[#9C6B00] border-[#E8A317]/40 dark:bg-[#F1C40F]/20 dark:text-[#F1C40F] dark:border-[#F1C40F]/40',
    success: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40',
    warning: 'bg-amber-500/15 text-amber-800 border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40',
    danger: 'bg-rose-500/15 text-rose-700 border-rose-500/30 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40',
    info: 'bg-sky-500/15 text-sky-700 border-sky-500/30 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/40',
    neutral: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3 py-1.5 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {icon && <span className="inline-block shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
