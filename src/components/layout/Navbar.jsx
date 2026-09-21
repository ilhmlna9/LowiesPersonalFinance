import { Menu, Bell, Moon, Sun, LogOut, User, CheckCheck, Trash2, ExternalLink, AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function timeAgo(iso) {
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'baru saja';
    if (m < 60) return `${m} mnt lalu`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} jam lalu`;
    const days = Math.floor(h / 24);
    if (days === 1) return 'kemarin';
    return `${days} hari lalu`;
  } catch { return ''; }
}

function typeIcon(type) {
  if (type === 'danger') return <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
  if (type === 'warning') return <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
  if (type === 'success') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
  return <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />;
}

export const Navbar = ({ onMenuClick }) => {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { items, unreadCount, markRead, markAllRead, clearAll, removeOne } = useNotifications();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const menuRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-[64px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Buka menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:block">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Halo, {user?.name?.split(' ')[0] || 'Pengguna'} 👋
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Kelola keuanganmu hari ini</p>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          aria-label="Ganti tema"
          title={isDark ? 'Mode Terang' : 'Mode Gelap'}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifikasi Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(v => !v)}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition relative"
            aria-label="Notifikasi"
            aria-expanded={notifOpen}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-white leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-[360px] max-w-[92vw] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[70vh]">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2 shrink-0">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifikasi</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Tidak ada yang belum dibaca'}</p>
                </div>
                <div className="flex items-center gap-1">
                  {items.length > 0 && (
                    <>
                      <button onClick={markAllRead} title="Tandai semua dibaca" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                        <CheckCheck className="w-4 h-4" />
                      </button>
                      <button onClick={clearAll} title="Hapus semua" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="overflow-y-auto flex-1">
                {items.length === 0 ? (
                  <div className="py-10 px-6 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center mx-auto text-slate-400">
                      <Bell className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-3">Belum ada notifikasi</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pengingat harian & peringatan anggaran akan muncul di sini.</p>
                    <button onClick={() => { setNotifOpen(false); navigate('/settings'); }} className="mt-4 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1">
                      Buka Pengaturan <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {items.slice(0, 20).map(n => (
                      <li key={n.id} className={`px-4 py-3 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition ${!n.read ? 'bg-indigo-50/40 dark:bg-indigo-500/5' : ''}`}>
                        <div className="mt-0.5">{typeIcon(n.type)}</div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">{n.title}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">{n.message}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[11px] text-slate-400 dark:text-slate-500">{timeAgo(n.createdAt)}</span>
                            {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />}
                            {n.link && (
                              <button onClick={() => { markRead(n.id); setNotifOpen(false); navigate(n.link); }} className="ml-auto text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1">
                                Lihat <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <button onClick={() => removeOne(n.id)} className="self-start p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 shrink-0" aria-label="Hapus notifikasi">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {items.length > 0 && (
                <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between shrink-0">
                  <button onClick={() => { setNotifOpen(false); navigate('/settings'); }} className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400">Pengaturan notifikasi</button>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{items.length} notifikasi</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 sm:gap-3 pl-1 pr-1 sm:pr-3 py-1 rounded-full sm:rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition ml-1"
          >
            <img
              src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=6366f1&color=fff`}
              alt={user?.name || 'User'}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover"
            />
            <span className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
              {user?.name || 'Pengguna'}
            </span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl py-2 z-50 overflow-hidden">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { setMenuOpen(false); navigate('/settings'); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left"
              >
                <User className="w-4 h-4" /> Profil & Pengaturan
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-left"
              >
                <LogOut className="w-4 h-4" /> Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
