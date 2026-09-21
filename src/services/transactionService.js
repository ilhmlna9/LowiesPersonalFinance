import api from './api';
import { mockTransactions } from '../data/mockData';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const MOCK_DELAY = 400;

const delay = (ms = MOCK_DELAY) => new Promise((resolve) => setTimeout(resolve, ms));

function getCurrentUserId() {
  try {
    const raw = localStorage.getItem('user_info');
    const u = raw ? JSON.parse(raw) : null;
    return u?.id || 'anon';
  } catch { return 'anon'; }
}
function getCurrentUserEmail() {
  try {
    const raw = localStorage.getItem('user_info');
    const u = raw ? JSON.parse(raw) : null;
    return String(u?.email || '').toLowerCase();
  } catch { return ''; }
}
function isDemoUser() {
  const id = getCurrentUserId();
  const email = getCurrentUserEmail();
  return id === 'usr_01' || email === 'demo@lowies.com' || email === 'lowie@example.com';
}
function getStorageKey() {
  return `mock_transactions_${getCurrentUserId()}`;
}

function loadMockTransactions() {
  try {
    const raw = localStorage.getItem(getStorageKey());
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore parse error
  }
  // Akun baru -> kosong agar tiap orang isi sendiri; akun demo tetap ada data contoh
  return isDemoUser() ? [...mockTransactions] : [];
}

function saveMockTransactions(data) {
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(data));
  } catch {
    // ignore storage error
  }
}

function cloneTransactions() {
  return loadMockTransactions();
}

// Helper: apply filters, search, sort, paginate
function applyQuery(transactions, { search, type, category, dateFrom, dateTo, sort }) {
  let result = [...transactions];

  if (type && type !== 'all') {
    result = result.filter((t) => t.type === type);
  }

  if (category && category !== 'all') {
    result = result.filter((t) => t.category === category);
  }

  if (search) {
    const q = search.toLowerCase().trim();
    result = result.filter(
      (t) =>
        t.description?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q) ||
        t.account?.toLowerCase().includes(q) ||
        String(t.amount).includes(q)
    );
  }

  if (dateFrom) {
    const from = new Date(dateFrom);
    if (!isNaN(from.getTime())) {
      result = result.filter((t) => new Date(t.date) >= from);
    }
  }

  if (dateTo) {
    const to = new Date(dateTo);
    if (!isNaN(to.getTime())) {
      // include the whole day
      to.setHours(23, 59, 59, 999);
      result = result.filter((t) => new Date(t.date) <= to);
    }
  }

  // Sorting
  const sortKey = sort || 'date_desc';
  result.sort((a, b) => {
    switch (sortKey) {
      case 'date_asc':
        return new Date(a.date) - new Date(b.date);
      case 'amount_desc':
        return b.amount - a.amount;
      case 'amount_asc':
        return a.amount - b.amount;
      case 'date_desc':
      default:
        return new Date(b.date) - new Date(a.date);
    }
  });

  return result;
}

export async function getTransactions({
  page = 1,
  limit = 10,
  search = '',
  type = '',
  category = '',
  dateFrom = '',
  dateTo = '',
  sort = 'date_desc',
} = {}) {
  if (USE_MOCK) {
    await delay();
    const all = cloneTransactions();
    const filtered = applyQuery(all, { search, type, category, dateFrom, dateTo, sort });
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(Math.max(1, Number(page) || 1), totalPages);
    const start = (safePage - 1) * limit;
    const data = filtered.slice(start, start + limit);
    return { data, total, page: safePage, totalPages };
  }

  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (search) params.set('search', search);
  if (type) params.set('type', type);
  if (category) params.set('category', category);
  if (dateFrom) params.set('dateFrom', dateFrom);
  if (dateTo) params.set('dateTo', dateTo);
  if (sort) params.set('sort', sort);

  const response = await api.get(`/transactions?${params.toString()}`);
  return response.data;
}

export async function getTransactionById(id) {
  if (USE_MOCK) {
    await delay();
    const all = cloneTransactions();
    const found = all.find((t) => String(t.id) === String(id));
    if (!found) throw new Error('Transaksi tidak ditemukan');
    return found;
  }
  const response = await api.get(`/transactions/${id}`);
  return response.data.data ?? response.data;
}

export async function createTransaction(data) {
  if (USE_MOCK) {
    await delay();
    const all = cloneTransactions();
    const newTx = {
      id: `tx_${Date.now()}`,
      type: data.type,
      category: data.category,
      account: data.account,
      description: data.description || '',
      date: data.date || new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      ...data,
      amount: Number(data.amount),
    };
    all.unshift(newTx);
    saveMockTransactions(all);
    return newTx;
  }
  const response = await api.post('/transactions', data);
  return response.data.data ?? response.data;
}

export async function updateTransaction(id, data) {
  if (USE_MOCK) {
    await delay();
    const all = cloneTransactions();
    const idx = all.findIndex((t) => String(t.id) === String(id));
    if (idx === -1) throw new Error('Transaksi tidak ditemukan');
    const updated = {
      ...all[idx],
      ...data,
      id: all[idx].id,
      amount: data.amount !== undefined ? Number(data.amount) : all[idx].amount,
    };
    all[idx] = updated;
    saveMockTransactions(all);
    return updated;
  }
  const response = await api.put(`/transactions/${id}`, data);
  return response.data.data ?? response.data;
}

export async function deleteTransaction(id) {
  if (USE_MOCK) {
    await delay();
    const all = cloneTransactions();
    const idx = all.findIndex((t) => String(t.id) === String(id));
    if (idx === -1) throw new Error('Transaksi tidak ditemukan');
    all.splice(idx, 1);
    saveMockTransactions(all);
    return { message: 'Transaksi berhasil dihapus' };
  }
  const response = await api.delete(`/transactions/${id}`);
  return response.data;
}
