import { cn } from '../../lib/cn';

export const ProgressBar = ({ value = 0, max = 100, className = '', barClassName = '', size = 'md', showLabel = false, variant = 'default' }) => {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);

  const variantColor =
    variant === 'danger' ? 'bg-rose-500' :
    variant === 'warning' ? 'bg-amber-500' :
    variant === 'success' ? 'bg-emerald-500' :
    'bg-indigo-600';

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-2.5',
  };

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden', sizes[size] || sizes.md)}>
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', variantColor, barClassName)}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">{Math.round(pct)}% terpakai</p>
      )}
    </div>
  );
};
