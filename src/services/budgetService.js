import api from './api';
import { mockBudgets } from '../data/mockData';
import { mockTransactions } from '../data/mockData';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const TX_STORAGE_KEY = 'mock_transactions'; // legacy fallback, real key per-user via transactionService
const MOCK_DELAY = 400;

const delay = (ms = MOCK_DELAY) => new Promise((resolve) => setTimeout(resolve, ms));

function getBudgetUserId() {
  try {
    const raw = localStorage.getItem('user_info');
    const u = raw ? JSON.parse(raw) : null;
    return u?.id || 'anon';
  } catch { return 'anon'; }
}
function getBudgetUserEmail() {
  try {
    const raw = localStorage.getItem('user_info');
    const u = raw ? JSON.parse(raw) : null;
    return String(u?.email || '').toLowerCase();
  } catch { return ''; }
}
function isBudgetDemo() {
  const id = getBudgetUserId();
  const email = getBudgetUserEmail();
  return id === 'usr_01' || email === 'demo@lowies.com' || email === 'lowie@example.com';
}
function getBudgetStorageKey() {
  return `mock_budgets_${getBudgetUserId()}`;
}

function loadMockBudgets() {
  try {
    const raw = localStorage.getItem(getBudgetStorageKey());
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return isBudgetDemo() ? [...mockBudgets] : [];
}

function saveMockBudgets(data) {
  try {
    localStorage.setItem(getBudgetStorageKey(), JSON.stringify(data));
  } catch {
    // ignore
  }
}

function loadMockTransactionsForBudget() {
  // pakai key per-user yg sama dengan transactionService agar hitung tepat per akun
  function getTxUserId() {
    try { const u = JSON.parse(localStorage.getItem('user_info') || 'null'); return u?.id || 'anon'; } catch { return 'anon'; }
  }
  function isTxDemo() {
    try {
      const u = JSON.parse(localStorage.getItem('user_info') || 'null');
      const id = u?.id || 'anon';
      const email = String(u?.email || '').toLowerCase();
      return id === 'usr_01' || email === 'demo@lowies.com' || email === 'lowie@example.com';
    } catch { return false; }
  }
  const key = `mock_transactions_${getTxUserId()}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) { const p = JSON.parse(raw); if (Array.isArray(p)) return p; }
    // fallback migrasi dari key lama global jika ada (khusus demo)
    const legacy = localStorage.getItem(TX_STORAGE_KEY);
    if (legacy) { const p = JSON.parse(legacy); if (Array.isArray(p) && isTxDemo()) return p; }
  } catch {}
  return isTxDemo() ? [...mockTransactions] : [];
}

function getMonthKey(dateStr) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  } catch { return null; }
}

function recalcSpent(budgets) {
  const txs = loadMockTransactionsForBudget();
  return budgets.map((b) => {
    const total = txs
      .filter((t) => t.type === 'expense' && t.category === b.category && getMonthKey(t.date) === b.month)
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    return { ...b, spentAmount: total };
  });
}

export async function getBudgets(month) {
  if (USE_MOCK) {
    await delay();
    let all = loadMockBudgets();
    // Selalu hitung ulang terpakai dari transaksi agar sinkron
    all = recalcSpent(all);
    // Simpan hasil recalc agar konsisten (tanpa loop tak berujung)
    saveMockBudgets(all);
    if (month) {
      return all.filter((b) => b.month === month);
    }
    return all;
  }
  const params = month ? `?month=${encodeURIComponent(month)}` : '';
  const response = await api.get(`/budgets${params}`);
  return response.data.data ?? response.data;
}

export async function createBudget(data) {
  if (USE_MOCK) {
    await delay();
    const all = loadMockBudgets();
    const newBudget = {
      id: `bg_${Date.now()}`,
      category: data.category,
      month: data.month,
      icon: data.icon || 'Wallet',
      ...data,
      limitAmount: Number(data.limitAmount),
      spentAmount: Number(data.spentAmount ?? 0),
    };
    all.push(newBudget);
    saveMockBudgets(all);
    return newBudget;
  }
  const response = await api.post('/budgets', data);
  return response.data.data ?? response.data;
}

export async function updateBudget(id, data) {
  if (USE_MOCK) {
    await delay();
    const all = loadMockBudgets();
    const idx = all.findIndex((b) => String(b.id) === String(id));
    if (idx === -1) throw new Error('Anggaran tidak ditemukan');
    const updated = {
      ...all[idx],
      ...data,
      id: all[idx].id,
      limitAmount: data.limitAmount !== undefined ? Number(data.limitAmount) : all[idx].limitAmount,
      spentAmount: data.spentAmount !== undefined ? Number(data.spentAmount) : all[idx].spentAmount,
    };
    all[idx] = updated;
    saveMockBudgets(all);
    return updated;
  }
  const response = await api.put(`/budgets/${id}`, data);
  return response.data.data ?? response.data;
}

export async function deleteBudget(id) {
  if (USE_MOCK) {
    await delay();
    const all = loadMockBudgets();
    const idx = all.findIndex((b) => String(b.id) === String(id));
    if (idx === -1) throw new Error('Anggaran tidak ditemukan');
    all.splice(idx, 1);
    saveMockBudgets(all);
    return { message: 'Anggaran berhasil dihapus' };
  }
  const response = await api.delete(`/budgets/${id}`);
  return response.data;
}
