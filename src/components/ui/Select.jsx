import { cn } from '../../lib/cn';
import { ChevronDown } from 'lucide-react';

export const Select = ({ label, error, children, className = '', id, ...props }) => {
  const selectId = id || `select-${label?.replace(/\s+/g, '-')?.toLowerCase() || Math.random().toString(36).slice(2, 6)}`;
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={cn(
            'w-full h-11 rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm px-4 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-150',
            error ? 'border-rose-300 dark:border-rose-800' : 'border-slate-200 dark:border-slate-800',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
      {error && <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
};
