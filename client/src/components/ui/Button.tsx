import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const variants = {
  primary: 'bg-brand-blue hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20',
  secondary: 'bg-navy-700 hover:bg-navy-600 text-white border border-white/10',
  danger: 'bg-brand-red hover:bg-red-500 text-white',
  ghost: 'bg-transparent hover:bg-white/10 text-white/80',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-8 py-3.5 text-lg',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={`
        font-ui font-bold rounded-full transition-all duration-150 select-none
        active:scale-95 hover:-translate-y-0.5 hover:shadow-lg
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
        ${variants[variant]} ${sizes[size]} ${className}
      `}
    >
      {children}
    </button>
  );
}
