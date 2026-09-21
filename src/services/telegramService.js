/**
 * Telegram Integration Service (Frontend Mock + Backend Ready)
 * - VITE_USE_MOCK=true  -> simpan lokal di localStorage + update user profile
 * - VITE_USE_MOCK=false -> panggil backend /api/telegram/*
 */
import api from './api';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const STORAGE_KEY = 'telegram_settings';
const MOCK_DELAY = 500;
const delay = (ms = MOCK_DELAY) => new Promise((r) => setTimeout(r, ms));

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function saveSettings(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}
function saveUserTelegram(patch) {
  try {
    const raw = localStorage.getItem('user_info');
    const user = raw ? JSON.parse(raw) : {};
    const next = { ...user, ...patch };
    localStorage.setItem('user_info', JSON.stringify(next));
    return next;
  } catch { return null; }
}

export const telegramService = {
  async getStatus() {
    if (USE_MOCK) {
      await delay();
      const s = loadSettings();
      const userRaw = localStorage.getItem('user_info');
      const user = userRaw ? JSON.parse(userRaw) : {};
      return {
        telegramConnected: !!user.telegramConnected,
        telegramUsername: user.telegramUsername || s?.username || null,
        chatId: s?.chatId || null,
        isConnected: !!user.telegramConnected,
        username: user.telegramUsername || s?.username || null,
      };
    }
    const res = await api.get('/telegram/settings');
    return res.data.data ?? res.data;
  },

  async connect({ username, chatId }) {
    const cleanUsername = String(username || '').trim().replace(/^@/, '');
    if (!cleanUsername) throw new Error('Username Telegram wajib diisi');
    if (cleanUsername.length < 3) throw new Error('Username minimal 3 karakter');
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) throw new Error('Username hanya boleh huruf, angka, dan underscore');

    if (USE_MOCK) {
      await delay(700);
      const chat = chatId || String(Math.floor(100000000 + Math.random() * 900000000));
      const settings = { username: cleanUsername, chatId: chat, connectedAt: new Date().toISOString(), isConnected: true };
      saveSettings(settings);
      saveUserTelegram({ telegramConnected: true, telegramUsername: cleanUsername, telegramId: chat });
      return { telegramConnected: true, telegramUsername: cleanUsername, telegramId: chat, ...settings, message: 'Telegram berhasil terhubung' };
    }
    const res = await api.post('/telegram/connect', { chatId: chatId || cleanUsername });
    return res.data.data ?? res.data;
  },

  async disconnect() {
    if (USE_MOCK) {
      await delay();
      saveSettings({ isConnected: false, username: null, chatId: null });
      saveUserTelegram({ telegramConnected: false, telegramUsername: null, telegramId: null });
      return { message: 'Telegram berhasil diputus' };
    }
    const res = await api.post('/telegram/disconnect');
    return res.data;
  },

  async sendTest() {
    if (USE_MOCK) {
      await delay(600);
      const s = loadSettings();
      const userRaw = localStorage.getItem('user_info');
      const user = userRaw ? JSON.parse(userRaw) : {};
      if (!user.telegramConnected && !s?.isConnected) throw new Error('Telegram belum terhubung');
      return { message: 'Pesan uji berhasil dikirim ke Telegram' };
    }
    const res = await api.post('/telegram/test');
    return res.data;
  },

  // Dipakai NotificationContext untuk kirim alert anggaran (mock -> tambah notifikasi lokal)
  async sendBudgetAlert({ category, percentage, spent, limit }) {
    if (USE_MOCK) {
      await delay(300);
      return { sent: true, category, percentage };
    }
    // backend akan broadcast via bot; endpoint opsional
    try { await api.post('/telegram/alerts/budget', { category, percentage, spent, limit }); } catch {}
    return { sent: true };
  },
};
