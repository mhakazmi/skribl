import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="text-sm font-bold text-ink font-ui">{label}</label>
      )}
      <input
        {...props}
        className={`
          w-full px-4 py-3 rounded-xl bg-white font-ui font-semibold text-ink
          border-2 border-ink placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-1
          transition-all duration-100
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-brand-red' : ''}
          ${className}
        `}
        style={{ boxShadow: error ? '3px 3px 0 #9E1A3A' : '3px 3px 0 #1A1A2E' }}
      />
      {error && <span className="text-xs text-brand-red font-bold font-ui">{error}</span>}
    </div>
  );
}
