import { cn } from '../../lib/cn';
import { Card } from './Card';
import { formatIDR } from '../../utils/formatters';

export const StatCard = ({ title, value, subtitle, icon, trend, variant = 'default', className = '', loading = false, ...props }) => {
  const iconBg =
    variant === 'income' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
    variant === 'expense' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' :
    variant === 'budget' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
    'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';

  return (
    <Card className={cn('relative overflow-hidden', className)} {...props}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400 uppercase">{title}</p>
          <p className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
            {typeof value === 'number' ? formatIDR(value) : value}
          </p>
          {subtitle && <p className="mt-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{subtitle}</p>}
          {trend && <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">{trend}</p>}
        </div>
        {icon && (
          <div className={cn('w-10 h-10 rounded-xl border flex items-center justify-center shrink-0', iconBg)}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};
