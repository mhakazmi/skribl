import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'green' | 'blue' | 'yellow' | 'red' | 'white';
  size?: 'sm' | 'md' | 'lg';
  children?: ReactNode;
}

const variants = {
  green:  'btn btn-green',
  blue:   'btn btn-blue',
  yellow: 'btn btn-yellow',
  red:    'btn btn-red',
  white:  'btn btn-white',
};

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export default function Button({
  variant = 'green',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}
