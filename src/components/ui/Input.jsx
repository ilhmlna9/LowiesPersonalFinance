import { cn } from '../../lib/cn';

export const Input = ({ label, error, leftIcon, rightIcon, className = '', id, ...props }) => {
  const inputId = id || `input-${label?.replace(/\s+/g, '-')?.toLowerCase() || Math.random().toString(36).slice(2, 6)}`;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          className={cn(
            'w-full h-11 rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-150',
            error ? 'border-rose-300 dark:border-rose-800 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800',
            leftIcon ? 'pl-10' : '',
            rightIcon ? 'pr-10' : '',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3.5 flex items-center">
            {rightIcon}
          </span>
        )}
      </div>
      {error && (
        <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>
      )}
    </div>
  );
};
