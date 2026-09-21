import { Outlet } from 'react-router-dom';
import { Sparkles, ShieldCheck, BarChart3, Wallet } from 'lucide-react';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white dark:bg-slate-950">
      {/* Left - Brand / Visual */}
      <div className="hidden lg:flex flex-col justify-between bg-slate-900 dark:bg-slate-900 relative overflow-hidden p-10">
        {/* Decorative */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-violet-600/20 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">Lowies</p>
              <p className="text-xs text-slate-400 leading-none mt-1">Personal Finance</p>
            </div>
          </div>
        </div>

        <div className="relative space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white leading-tight">
              Kelola keuangan<br />lebih cerdas.
            </h1>
            <p className="text-sm text-slate-400 mt-3 leading-relaxed max-w-sm">
              Dasbor keuangan pribadi yang bersih, modern, dan siap untuk integrasi backend Node.js + MySQL.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 max-w-sm">
            {[
              { icon: Wallet, title: 'Anggaran harian', desc: 'Pantau pengeluaran per kategori' },
              { icon: BarChart3, title: 'Analitik visual', desc: 'Grafik interaktif berbasis Recharts' },
              { icon: ShieldCheck, title: 'Aman & terstruktur', desc: 'Siap untuk autentikasi backend' },
            ].map((item) => (
              <div key={item.title} className="flex gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
                  <item.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-slate-500">© 2026 Lowies Personal Finance</p>
      </div>

      {/* Right - Form */}
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
          <div className="w-full max-w-md">
            {/* Mobile brand */}
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">Lowies Personal Finance</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Kelola keuangan pribadi</p>
              </div>
            </div>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};
