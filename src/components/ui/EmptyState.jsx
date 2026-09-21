import { cn } from '../../lib/cn';
import { Inbox } from 'lucide-react';

export const EmptyState = ({ icon, title, description, action, className = '', ...props }) => {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-12 px-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40', className)} {...props}>
      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-4 text-slate-400 dark:text-slate-500">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      {title && <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h3>}
      {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};
