import api from './api';
import {
  mockDashboardSummary,
  mockTransactions,
  mockBudgets,
  mockMonthlyTrends,
  mockCategoryExpenses,
} from '../data/mockData';
import { CATEGORIES } from '../utils/constants';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const MOCK_DELAY = 400;
const delay = (ms = MOCK_DELAY) => new Promise((resolve) => setTimeout(resolve, ms));

function getUid() {
  try {
    const u = JSON.parse(localStorage.getItem('user_info') || 'null');
    return u?.id || 'anon';
  } catch {
    return 'anon';
  }
}
function isDemo() {
  try {
    const u = JSON.parse(localStorage.getItem('user_info') || 'null');
    const uid = u?.id || 'anon';
    const email = String(u?.email || '').toLowerCase();
    return uid === 'usr_01' || email === 'demo@lowies.com' || email === 'lowie@example.com';
  } catch {
    return false;
  }
}
function getMonthKey(dateStr) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  } catch {
    return null;
  }
}
function getTransactionsForUser() {
  const uid = getUid();
  const demo = isDemo();
  try {
    const perUser = localStorage.getItem(`mock_transactions_${uid}`);
    if (perUser !== null) {
      const p = JSON.parse(perUser);
      if (Array.isArray(p)) return p;
    }
    const legacy = localStorage.getItem('mock_transactions');
    if (legacy !== null) {
      const p = JSON.parse(legacy);
      if (Array.isArray(p)) return demo ? p : [];
    }
  } catch {}
  return demo ? [...mockTransactions] : [];
}
function getBudgetsForUser() {
  const uid = getUid();
  const demo = isDemo();
  try {
    const perUser = localStorage.getItem(`mock_budgets_${uid}`);
    if (perUser !== null) {
      const p = JSON.parse(perUser);
      if (Array.isArray(p)) return p;
    }
    const legacy = localStorage.getItem('mock_budgets');
    if (legacy !== null) {
      const p = JSON.parse(legacy);
      if (Array.isArray(p) && demo) return p;
    }
  } catch {}
  return demo ? [...mockBudgets] : [];
}

function computeSummary(month) {
  const txs = getTransactionsForUser();
  const budgets = getBudgetsForUser();
  const targetMonth = month || new Date().toISOString().slice(0, 7);
  const monthTxs = txs.filter((t) => getMonthKey(t.date) === targetMonth);
  const totalIncome = monthTxs.filter((t) => t.type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const totalExpenses = monthTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const monthBudgets = budgets.filter((b) => b.month === targetMonth);
  const totalBudgetLimit = monthBudgets.reduce((s, b) => s + (Number(b.limitAmount) || 0), 0);
  const remainingBudget = totalBudgetLimit - totalExpenses;
  const budgetUsedPercentage = totalBudgetLimit > 0 ? Math.round((totalExpenses / totalBudgetLimit) * 100) : 0;
  const allIncome = txs.filter((t) => t.type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const allExpense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const totalBalance = allIncome - allExpense;
  return { month: targetMonth, totalBalance, totalIncome, totalExpenses, totalBudgetLimit, remainingBudget, budgetUsedPercentage };
}

function computeAnalytics(month) {
  const txs = getTransactionsForUser();
  const targetMonth = month || new Date().toISOString().slice(0, 7);
  const summary = computeSummary(targetMonth);
  const [y, m] = targetMonth.split('-').map(Number);
  const months = [];
  for (let i = 4; i >= 0; i--) {
    const d = new Date(y, (m - 1) - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('id-ID', { month: 'short' });
    const cap = label.charAt(0).toUpperCase() + label.slice(1);
    const mt = txs.filter((t) => getMonthKey(t.date) === key);
    months.push({
      month: cap,
      income: mt.filter((t) => t.type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0),
      expense: mt.filter((t) => t.type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0),
    });
  }
  const catMap = new Map();
  txs.filter((t) => t.type === 'expense' && getMonthKey(t.date) === targetMonth).forEach((t) => {
    catMap.set(t.category, (catMap.get(t.category) || 0) + (Number(t.amount) || 0));
  });
  const categoryExpenses = Array.from(catMap.entries())
    .map(([name, value]) => {
      const meta = CATEGORIES.find((c) => c.name === name);
      let color = '#6366f1';
      if (meta?.color) {
        const hexMatch = meta.color.match(/#[0-9a-fA-F]{3,6}/);
        if (hexMatch) color = hexMatch[0];
        else if (meta.color.includes('amber')) color = '#f59e0b';
        else if (meta.color.includes('blue')) color = '#3b82f6';
        else if (meta.color.includes('purple')) color = '#a855f7';
        else if (meta.color.includes('rose')) color = '#f43f5e';
        else if (meta.color.includes('pink')) color = '#ec4899';
        else if (meta.color.includes('emerald')) color = '#10b981';
        else if (meta.color.includes('indigo')) color = '#6366f1';
      }
      return { name, value, color };
    })
    .sort((a, b) => b.value - a.value);
  return { summary, monthlyTrends: months, categoryExpenses };
}

export async function getDashboardSummary(month) {
  if (USE_MOCK) {
    await delay();
    const uid = getUid();
    const hasPerUser =
      localStorage.getItem(`mock_transactions_${uid}`) !== null ||
      localStorage.getItem(`mock_budgets_${uid}`) !== null;
    if (!hasPerUser && isDemo()) {
      return { ...mockDashboardSummary, month: month || mockDashboardSummary.month };
    }
    return computeSummary(month);
  }
  const query = month ? `?month=${encodeURIComponent(month)}` : '';
  const response = await api.get(`/dashboard${query}`);
  return response.data.data ?? response.data;
}

export async function getAnalyticsData(month) {
  if (USE_MOCK) {
    await delay();
    const uid = getUid();
    const hasPerUser = localStorage.getItem(`mock_transactions_${uid}`) !== null;
    if (!hasPerUser && isDemo()) {
      return {
        summary: { ...mockDashboardSummary, month: month || mockDashboardSummary.month },
        monthlyTrends: mockMonthlyTrends,
        categoryExpenses: mockCategoryExpenses,
      };
    }
    return computeAnalytics(month);
  }
  const query = month ? `?month=${encodeURIComponent(month)}` : '';
  const response = await api.get(`/dashboard/analytics${query}`);
  return response.data.data ?? response.data;
}
