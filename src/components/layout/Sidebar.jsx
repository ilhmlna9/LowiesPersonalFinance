import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  BarChart3,
  FileText,
  Settings,
  X,
  Sparkles
} from 'lucide-react';
import { cn } from '../../lib/cn';

const navItems = [
  { to: '/', label: 'Dasbor', icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'Transaksi', icon: Receipt },
  { to: '/budgets', label: 'Anggaran', icon: Wallet },
  { to: '/analytics', label: 'Analitik', icon: BarChart3 },
  { to: '/reports', label: 'Laporan', icon: FileText },
  { to: '/settings', label: 'Pengaturan', icon: Settings },
];

export const Sidebar = ({ open, onClose }) => {
  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col w-[280px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-200 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between h-[64px] px-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-slate-900 dark:text-white leading-none">Lowies</p>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-none mt-0.5">Personal Finance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 -mr-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          <p className="px-3 mb-2 text-[11px] font-semibold tracking-widest text-slate-400 dark:text-slate-500 uppercase">Menu</p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                )
              }
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom card */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 p-4">
            <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">Butuh bantuan?</p>
            <p className="text-xs text-indigo-700/70 dark:text-indigo-300/70 mt-1 leading-relaxed">Kelola keuanganmu lebih cerdas dengan Lowies.</p>
            <p className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 mt-2">v1.0 • Mode Pengembangan</p>
          </div>
        </div>
      </aside>
    </>
  );
};
