import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { whatsappService } from '../services/whatsappService.js';
import { getBudgets } from '../services/budgetService.js';
import { getTransactions } from '../services/transactionService.js';
import { getCurrentMonthKey } from '../utils/formatters.js';
import { MONTH_OPTIONS } from '../utils/constants.js';

const NotificationContext = createContext(null);

function getNotifUserId() {
  try { const u = JSON.parse(localStorage.getItem('user_info') || 'null'); return u?.id || 'anon'; } catch { return 'anon'; }
}
function getLsKey() {
  return `lowies_notifications_v1_${getNotifUserId()}`;
}
function getLastBudgetKey() {
  return `lowies_last_budget_check_${getNotifUserId()}`;
}
const LS_KEY = 'lowies_notifications_v1';
const LS_LAST_BUDGET_CHECK = 'lowies_last_budget_check';
const MAX_ITEMS = 50;

function loadStored() {
  try {
    const k = getLsKey();
    const r = localStorage.getItem(k) || localStorage.getItem(LS_KEY);
    return r ? JSON.parse(r) : [];
  } catch { return []; }
}
function persist(list) {
  try {
    localStorage.setItem(getLsKey(), JSON.stringify(list.slice(0, MAX_ITEMS)));
    localStorage.setItem(LS_KEY, JSON.stringify(list.slice(0, MAX_ITEMS)));
  } catch {}
}
function getLastBudgetTs() {
  try { return localStorage.getItem(getLastBudgetKey()) || localStorage.getItem(LS_LAST_BUDGET_CHECK); } catch { return null; }
}
function setLastBudgetTs(v) {
  try { localStorage.setItem(getLastBudgetKey(), String(v)); localStorage.setItem(LS_LAST_BUDGET_CHECK, String(v)); } catch {}
}

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [items, setItems] = useState(() => loadStored());
  const [unreadCount, setUnreadCount] = useState(() => loadStored().filter(n => !n.read).length);
  const intervalRef = useRef(null);
  const whatsappRef = useRef({ connected: false, phoneNumber: null });

  const addNotification = useCallback((notif) => {
    const entry = {
      id: `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: notif.title,
      message: notif.message,
      type: notif.type || 'info', // info | warning | danger | success
      category: notif.category || null,
      link: notif.link || null,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setItems(prev => {
      const next = [entry, ...prev].slice(0, MAX_ITEMS);
      persist(next);
      return next;
    });
    setUnreadCount(c => c + 1);
    // Browser Notification API (jika diizinkan)
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && user?.notificationsEnabled !== false) {
        new Notification(entry.title, { body: entry.message });
      }
    } catch {}
    return entry;
  }, [user]);

  const markAllRead = useCallback(() => {
    setItems(prev => { const n = prev.map(x => ({ ...x, read: true })); persist(n); return n; });
    setUnreadCount(0);
  }, []);
  const markRead = useCallback((id) => {
    setItems(prev => {
      const n = prev.map(x => x.id === id ? { ...x, read: true } : x);
      persist(n); return n;
    });
    setUnreadCount(c => Math.max(0, c - 1));
  }, []);
  const clearAll = useCallback(() => {
    setItems([]); persist([]); setUnreadCount(0);
  }, []);
  const removeOne = useCallback((id) => {
    setItems(prev => {
      const target = prev.find(x => x.id === id);
      const n = prev.filter(x => x.id !== id); persist(n);
      if (target && !target.read) setUnreadCount(c => Math.max(0, c - 1));
      return n;
    });
  }, []);

  const requestBrowserPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    try { return await Notification.requestPermission(); } catch { return Notification.permission; }
  }, []);

  // Sinkron status whatsapp saat user berubah
  useEffect(() => {
    if (!isAuthenticated) return;
    whatsappService.getStatus().then(s => {
      const phone = s.whatsappPhone || s.phoneNumber || null;
      whatsappRef.current = { connected: !!(s.whatsappConnected ?? s.isConnected), phoneNumber: phone };
    }).catch(() => {});
  }, [isAuthenticated, user?.whatsappConnected, user?.whatsappPhone, user?.whatsappNumber]);

  // Cek anggaran: warning >80%, danger >=100% -> push notifikasi in-app (+ whatsapp)
  // Dipanggil juga secara force setelah createTransaction agar langsung muncul tanpa tunggu interval
  const checkBudgets = useCallback(async (force = false) => {
    if (!isAuthenticated || user?.budgetAlerts === false) return;
    if (user?.notificationsEnabled === false) return;
    const month = getCurrentMonthKey();
    const label = MONTH_OPTIONS.find(m => m.value === month)?.label || month;
    try {
      const budgets = await getBudgets(month);
      const list = Array.isArray(budgets) ? budgets : (budgets?.budgets || []);
      // throttle 30 menit kecuali force=true
      const last = getLastBudgetTs();
      const now = Date.now();
      if (!force && last && now - Number(last) < 1000 * 60 * 30) return;
      setLastBudgetTs(now);

      for (const b of list) {
        const limit = Number(b.limitAmount) || 0;
        const spent = Number(b.spentAmount) || 0;
        if (!limit) continue;
        const pct = Math.round((spent / limit) * 100);
        if (pct >= 100) {
          const exists = loadStored().some(n => n.category === b.category && n.type === 'danger' && new Date(n.createdAt).toDateString() === new Date().toDateString());
          if (exists && !force) continue;
          addNotification({
            title: `Anggaran melebihi batas: ${b.category}`,
            message: `Terpakai ${pct}% (${label}). Segera sesuaikan pengeluaran.`,
            type: 'danger',
            category: b.category,
            link: '/budgets',
          });
          if (whatsappRef.current.connected) whatsappService.sendBudgetAlert({ category: b.category, percentage: pct, spent, limit }).catch(() => {});
        } else if (pct > 80) {
          const exists = loadStored().some(n => n.category === b.category && n.type === 'warning' && new Date(n.createdAt).toDateString() === new Date().toDateString());
          if (exists && !force) continue;
          addNotification({
            title: `Hampir habis: ${b.category}`,
            message: `${pct}% anggaran terpakai di ${label}. Sisa tipis.`,
            type: 'warning',
            category: b.category,
            link: '/budgets',
          });
          if (whatsappRef.current.connected) whatsappService.sendBudgetAlert({ category: b.category, percentage: pct, spent, limit }).catch(() => {});
        }
      }
    } catch {}
  }, [isAuthenticated, user?.budgetAlerts, addNotification]);

  // Pengingat harian: jika dailyReminder aktif dan hari ini belum ada transaksi -> WA juga
  const checkDailyReminder = useCallback(async () => {
    if (!isAuthenticated || user?.dailyReminder === false || user?.notificationsEnabled === false) return;
    const today = new Date().toISOString().slice(0, 10);
    const lastKey = `lowies_daily_reminder_${today}_${getNotifUserId()}`;
    if (localStorage.getItem(lastKey)) return;
    try {
      const res = await getTransactions({ page: 1, limit: 1, dateFrom: today, dateTo: today });
      const hasToday = (res?.data?.length || 0) > 0 || (res?.total || 0) > 0;
      if (!hasToday) {
        const hour = new Date().getHours();
        if (hour >= 9) {
          addNotification({
            title: 'Pengingat harian',
            message: 'Belum ada transaksi hari ini. Catat pemasukan/pengeluaran sekarang.',
            type: 'info',
            link: '/transactions',
          });
          localStorage.setItem(lastKey, '1');
          if (whatsappRef.current.connected) whatsappService.sendDailyReminder().catch(() => {});
        }
      } else {
        localStorage.setItem(lastKey, '1');
      }
    } catch {}
  }, [isAuthenticated, user?.dailyReminder, user?.notificationsEnabled, addNotification]);

  // Jadwalkan pengecekan periodik saat login
  useEffect(() => {
    if (!isAuthenticated) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    // initial run (delay kecil agar auth siap)
    const t = setTimeout(() => { checkBudgets(); checkDailyReminder(); }, 2500);
    // interval tiap 15 menit
    intervalRef.current = setInterval(() => { checkBudgets(); checkDailyReminder(); }, 15 * 60 * 1000);
    return () => { clearTimeout(t); if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isAuthenticated, checkBudgets, checkDailyReminder]);

  // Sinkron unreadCount saat items berubah eksternal (mis. whatsapp connect)
  useEffect(() => {
    setUnreadCount(items.filter(n => !n.read).length);
  }, [items]);

  const value = {
    items,
    unreadCount,
    addNotification,
    markRead,
    markAllRead,
    clearAll,
    removeOne,
    requestBrowserPermission,
    checkBudgets,
    checkDailyReminder,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications harus di dalam NotificationProvider');
  return ctx;
};
