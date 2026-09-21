/**
 * WhatsApp Integration Service (Frontend Mock + Backend Ready)
 * - VITE_USE_MOCK=true  -> simpan lokal di localStorage + update user profile
 * - VITE_USE_MOCK=false -> panggil backend /api/whatsapp/*
 */
import api from './api';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const STORAGE_KEY = 'whatsapp_settings';
const MOCK_DELAY = 500;
const delay = (ms = MOCK_DELAY) => new Promise((r) => setTimeout(r, ms));

function getWhatsAppUserId() {
  try { const u = JSON.parse(localStorage.getItem('user_info') || 'null'); return u?.id || 'anon'; } catch { return 'anon'; }
}
function getWhatsAppStorageKey() {
  return `whatsapp_settings_${getWhatsAppUserId()}`;
}
function loadSettings() {
  try {
    const raw = localStorage.getItem(getWhatsAppStorageKey()) || localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function saveSettings(data) {
  try { localStorage.setItem(getWhatsAppStorageKey(), JSON.stringify(data)); localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}
function saveUserWhatsapp(patch) {
  try {
    const raw = localStorage.getItem('user_info');
    const user = raw ? JSON.parse(raw) : {};
    const next = { ...user, ...patch };
    localStorage.setItem('user_info', JSON.stringify(next));
    return next;
  } catch { return null; }
}

function normalizePhone(input) {
  let s = String(input || '').trim().replace(/[\s\-\(\)]/g, '');
  if (!s) return '';
  if (s.startsWith('+')) s = s.slice(1);
  if (s.startsWith('0')) s = '62' + s.slice(1);
  // keep digits only
  s = s.replace(/\D/g, '');
  return s;
}

function validatePhone(raw) {
  const p = normalizePhone(raw);
  if (!p) return 'Nomor WhatsApp wajib diisi';
  if (!/^62\d{8,13}$/.test(p)) return 'Format nomor tidak valid. Contoh: 0812xxxxxxx atau 62812xxxxxxx';
  if (p.length < 10 || p.length > 15) return 'Nomor harus 10-15 digit';
  return null;
}

export const whatsappService = {
  normalizePhone,
  validatePhone,

  async getStatus() {
    if (USE_MOCK) {
      await delay();
      const s = loadSettings();
      const userRaw = localStorage.getItem('user_info');
      const user = userRaw ? JSON.parse(userRaw) : {};
      const phone = user.whatsappPhone || user.whatsappNumber || s?.phoneNumber || null;
      const connected = !!(user.whatsappConnected ?? s?.isConnected);
      return {
        whatsappConnected: connected,
        whatsappPhone: phone,
        phoneNumber: phone,
        isConnected: connected,
        chatId: phone, // compat
      };
    }
    const res = await api.get('/whatsapp/settings');
    return res.data.data ?? res.data;
  },

  async connect({ phoneNumber, phone }) {
    const raw = phoneNumber ?? phone ?? '';
    const err = validatePhone(raw);
    if (err) throw new Error(err);
    const normalized = normalizePhone(raw);

    if (USE_MOCK) {
      await delay(700);
      const settings = { phoneNumber: normalized, isConnected: true, connectedAt: new Date().toISOString() };
      saveSettings(settings);
      saveUserWhatsapp({ whatsappConnected: true, whatsappPhone: normalized, whatsappNumber: normalized });
      return { whatsappConnected: true, whatsappPhone: normalized, phoneNumber: normalized, ...settings, message: 'WhatsApp berhasil terhubung' };
    }
    const res = await api.post('/whatsapp/connect', { phoneNumber: normalized });
    return res.data.data ?? res.data;
  },

  async disconnect() {
    if (USE_MOCK) {
      await delay();
      saveSettings({ isConnected: false, phoneNumber: null });
      try {
        localStorage.removeItem(getWhatsAppStorageKey());
        // keep legacy for compat
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ isConnected: false, phoneNumber: null }));
      } catch {}
      saveUserWhatsapp({ whatsappConnected: false, whatsappPhone: null, whatsappNumber: null });
      return { message: 'WhatsApp berhasil diputus' };
    }
    const res = await api.post('/whatsapp/disconnect');
    return res.data;
  },

  async sendTest() {
    if (USE_MOCK) {
      await delay(400);
      const s = loadSettings();
      const userRaw = localStorage.getItem('user_info');
      const user = userRaw ? JSON.parse(userRaw) : {};
      const connected = !!(user.whatsappConnected ?? s?.isConnected);
      const phone = user.whatsappPhone || user.whatsappNumber || s?.phoneNumber;
      if (!connected || !phone) throw new Error('WhatsApp belum terhubung');
      const token = import.meta.env.VITE_FONNTE_TOKEN;
      if (!token) throw new Error('VITE_FONNTE_TOKEN belum diisi di .env');
      const res = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: { Authorization: token },
        body: new URLSearchParams({ target: normalizePhone(phone), message: '🧪 Lowies Personal Finance\n\nJika kamu menerima pesan ini, koneksi WhatsApp berhasil ✅', countryCode: '62' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.status === false) throw new Error(data.reason || data.message || `Fonnte error ${res.status}`);
      return { message: 'Pesan uji berhasil dikirim ke WhatsApp' };
    }
    const res = await api.post('/whatsapp/test');
    return res.data;
  },

  async sendBudgetAlert({ category, percentage, spent, limit }) {
    if (USE_MOCK) {
      const raw = localStorage.getItem('user_info');
      const user = raw ? JSON.parse(raw) : {};
      const s = loadSettings();
      const phone = user.whatsappPhone || user.whatsappNumber || s?.phoneNumber;
      const token = import.meta.env.VITE_FONNTE_TOKEN;
      if (!phone || !token) return { sent: false };
      const connected = !!(user.whatsappConnected ?? s?.isConnected);
      if (!connected) return { sent: false };
      if (user?.notificationsEnabled === false || user?.budgetAlerts === false) return { sent: false };
      try {
        await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: { Authorization: token },
          body: new URLSearchParams({ target: normalizePhone(phone), message: `⚠️ Lowies: Anggaran ${category || 'kategori'} sudah ${percentage ?? '-'}% terpakai (${spent != null ? new Intl.NumberFormat('id-ID').format(spent) : ''}/${limit != null ? new Intl.NumberFormat('id-ID').format(limit) : ''}). Cek Anggaran.`, countryCode: '62' }),
        });
      } catch {}
      return { sent: true, category, percentage };
    }
    try { await api.post('/whatsapp/alerts/budget', { category, percentage, spent, limit }); } catch {}
    return { sent: true };
  },

  async sendDailyReminder() {
    if (USE_MOCK) {
      const raw = localStorage.getItem('user_info');
      const user = raw ? JSON.parse(raw) : {};
      const s = loadSettings();
      const phone = user.whatsappPhone || user.whatsappNumber || s?.phoneNumber;
      const token = import.meta.env.VITE_FONNTE_TOKEN;
      if (!phone || !token) return { sent: false, reason: 'no_phone_or_token' };
      const connected = !!(user.whatsappConnected ?? s?.isConnected);
      if (!connected) return { sent: false, reason: 'not_connected' };
      if (user?.notificationsEnabled === false || user?.dailyReminder === false) return { sent: false, reason: 'disabled' };
      try {
        const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: { Authorization: token },
          body: new URLSearchParams({
            target: normalizePhone(phone),
            message: `⏰ Lowies Pengingat Harian — ${todayStr}\n\nBelum ada transaksi hari ini. Yuk catat pemasukan/pengeluaran sekarang di Lowies Personal Finance agar laporan tetap akurat.`,
            countryCode: '62',
          }),
        });
      } catch {}
      return { sent: true };
    }
    try { await api.post('/whatsapp/alerts/daily'); } catch {}
    return { sent: true };
  },
};
