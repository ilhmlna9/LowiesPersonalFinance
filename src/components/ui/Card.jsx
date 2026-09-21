import { cn } from '../../lib/cn';

export const Card = ({ className = '', children, padding = true, ...props }) => {
  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl shadow-sm',
        padding ? 'p-5 sm:p-6' : '',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ className = '', children, ...props }) => (
  <div className={cn('flex flex-col gap-1.5 mb-4', className)} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className = '', children, ...props }) => (
  <h3 className={cn('text-base font-semibold text-slate-900 dark:text-slate-100 leading-none', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ className = '', children, ...props }) => (
  <p className={cn('text-sm text-slate-500 dark:text-slate-400', className)} {...props}>
    {children}
  </p>
);
