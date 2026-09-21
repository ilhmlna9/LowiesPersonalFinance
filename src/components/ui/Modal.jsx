import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';

export const Modal = ({ open, onClose, title, description, children, size = 'md', className = '' }) => {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className={cn('relative w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-hidden flex flex-col animate-in', sizes[size] || sizes.md, className)}>
        {(title || description) && (
          <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-start justify-between gap-4">
              <div>
                {title && <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>}
                {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>}
              </div>
              <button onClick={onClose} className="p-2 -mr-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
        <div className="overflow-y-auto p-6 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};
