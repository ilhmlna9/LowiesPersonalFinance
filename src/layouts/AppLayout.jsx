import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Navbar } from '../components/layout/Navbar';

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-[280px] flex flex-col min-h-screen">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>
        <footer className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            © 2026 Lowies Personal Finance • Dibuat dengan ❤️ untuk portofolio profesional
          </p>
        </footer>
      </div>
    </div>
  );
};
