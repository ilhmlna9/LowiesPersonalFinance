import { cn } from '../../lib/cn';

export const Skeleton = ({ className = '', ...props }) => (
  <div className={cn('animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-800', className)} {...props} />
);

export const StatCardSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-5">
    <Skeleton className="h-4 w-28 mb-4" />
    <Skeleton className="h-7 w-36 mb-3" />
    <Skeleton className="h-3 w-20" />
  </div>
);
