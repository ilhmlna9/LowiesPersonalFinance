import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';

export const LoadingSpinner = ({ size = 24, className = '', label = 'Memuat...' }) => (
  <div className={cn('inline-flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400', className)} role="status" aria-label={label}>
    <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" style={{ width: size, height: size }} />
    {label && <span className="text-sm font-medium">{label}</span>}
  </div>
);

export const PageLoader = () => (
  <div className="flex flex-col items-center justify-center py-24 gap-3">
    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Memuat data...</p>
  </div>
);
