import api from './api';
import { mockUserProfile } from '../data/mockData';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const DEMO_EMAILS = ['demo@lowies.com', 'lowie@example.com'];
function isDemoEmail(email) {
  return DEMO_EMAILS.includes(String(email || '').toLowerCase());
}
const MOCK_USERS_MAP_KEY = 'lowies_mock_users_map';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}
function hashEmailToId(email) {
  const n = normalizeEmail(email);
  let h = 0;
  for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
  return 'usr_' + h.toString(36) + '_' + n.split('@')[0].slice(0, 12).replace(/[^a-z0-9]/g, '');
}
function loadMockUsersMap() {
  try {
    const raw = localStorage.getItem(MOCK_USERS_MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function saveMockUsersMap(map) {
  try { localStorage.setItem(MOCK_USERS_MAP_KEY, JSON.stringify(map)); } catch {}
}

export const authService = {
  async login(email, password) {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      if (!email) throw new Error('Email atau password tidak valid');
      const norm = normalizeEmail(email);
      if (isDemoEmail(email)) {
        const user = { ...mockUserProfile, email: norm };
        const mockResponse = { user, token: 'mock_jwt_token_lowies_finance_' + Date.now() };
        localStorage.setItem('auth_token', mockResponse.token);
        localStorage.setItem('user_info', JSON.stringify(mockResponse.user));
        return mockResponse;
      }
      // Persist per-email agar transaksi/anggaran tidak hilang saat login ulang
      const map = loadMockUsersMap();
      let user = map[norm];
      if (!user) {
        user = {
          id: hashEmailToId(norm),
          name: String(norm).split('@')[0],
          email: norm,
          avatarUrl: null,
          currency: 'IDR',
          whatsappConnected: false,
          whatsappPhone: null,
          notificationsEnabled: true,
          dailyReminder: true,
          budgetAlerts: true,
          createdAt: new Date().toISOString(),
        };
        map[norm] = user;
        saveMockUsersMap(map);
        // inisialisasi storage kosong per-user (jika belum ada)
        try {
          if (!localStorage.getItem(`mock_transactions_${user.id}`)) localStorage.setItem(`mock_transactions_${user.id}`, JSON.stringify([]));
          if (!localStorage.getItem(`mock_budgets_${user.id}`)) localStorage.setItem(`mock_budgets_${user.id}`, JSON.stringify([]));
        } catch {}
      }
      const mockResponse = { user, token: 'mock_jwt_token_lowies_finance_' + Date.now() };
      localStorage.setItem('auth_token', mockResponse.token);
      localStorage.setItem('user_info', JSON.stringify(mockResponse.user));
      return mockResponse;
    }

    // Backend Integration
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user_info', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async register(name, email, password) {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const norm = normalizeEmail(email);
      const newUser = {
        id: hashEmailToId(norm),
        name: name || String(norm).split('@')[0],
        email: norm,
        avatarUrl: null,
        currency: 'IDR',
        whatsappConnected: false,
        whatsappPhone: null,
        notificationsEnabled: true,
        dailyReminder: true,
        budgetAlerts: true,
        createdAt: new Date().toISOString(),
      };
      const map = loadMockUsersMap();
      map[norm] = newUser;
      saveMockUsersMap(map);
      try {
        if (!localStorage.getItem(`mock_transactions_${newUser.id}`)) localStorage.setItem(`mock_transactions_${newUser.id}`, JSON.stringify([]));
        if (!localStorage.getItem(`mock_budgets_${newUser.id}`)) localStorage.setItem(`mock_budgets_${newUser.id}`, JSON.stringify([]));
        localStorage.removeItem('lowies_notifications_v1');
        localStorage.removeItem('lowies_last_budget_check');
        localStorage.removeItem('whatsapp_settings');
      } catch {}
      const mockResponse = { user: newUser, token: 'mock_jwt_token_lowies_finance_' + Date.now() };
      localStorage.setItem('auth_token', mockResponse.token);
      localStorage.setItem('user_info', JSON.stringify(newUser));
      return mockResponse;
    }

    const response = await api.post('/auth/register', { name, email, password });
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user_info', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async getCurrentUser() {
    if (USE_MOCK) {
      const stored = localStorage.getItem('user_info');
      return stored ? JSON.parse(stored) : mockUserProfile;
    }
    const response = await api.get('/auth/me');
    return response.data.user;
  },

  async updateProfile(profileData) {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const stored = localStorage.getItem('user_info');
      const currentUser = stored ? JSON.parse(stored) : mockUserProfile;
      const updated = { ...currentUser, ...profileData };
      localStorage.setItem('user_info', JSON.stringify(updated));
      // sinkron ke map agar email tetap konsisten
      try {
        const norm = normalizeEmail(updated.email);
        const map = loadMockUsersMap();
        if (norm && map[norm]) { map[norm] = { ...map[norm], ...updated }; saveMockUsersMap(map); }
      } catch {}
      return updated;
    }
    const response = await api.put('/auth/profile', profileData);
    return response.data.user;
  },

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
  },
};
