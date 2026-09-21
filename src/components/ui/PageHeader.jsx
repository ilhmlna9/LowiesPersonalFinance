export const PageHeader = ({ title, description, action, children }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h1>
        {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed max-w-2xl">{description}</p>}
      </div>
      {(action || children) && (
        <div className="flex items-center gap-2 shrink-0">
          {action}
          {children}
        </div>
      )}
    </div>
  );
};
