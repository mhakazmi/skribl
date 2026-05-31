import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="text-sm font-semibold text-white/70 font-ui">{label}</label>
      )}
      <input
        {...props}
        className={`
          w-full px-4 py-3 rounded-xl bg-navy-700 border border-white/10
          text-white placeholder-white/30 font-ui
          focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent
          transition-all duration-150
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-brand-red ring-1 ring-brand-red' : ''}
          ${className}
        `}
      />
      {error && <span className="text-xs text-brand-red font-ui">{error}</span>}
    </div>
  );
}
