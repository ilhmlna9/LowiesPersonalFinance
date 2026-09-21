/**
 * Mock Data for Lowies Personal Finance (Development Mode)
 * This data is used when VITE_USE_MOCK=true or backend is disconnected.
 */

export const mockUserProfile = {
  id: 'usr_01',
  name: 'Lowie Alexander',
  email: 'lowie@example.com',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  currency: 'IDR',
  telegramConnected: false,
  telegramUsername: null,
  notificationsEnabled: true,
  dailyReminder: true,
  budgetAlerts: true,
  createdAt: '2026-01-15T08:00:00Z'
};

export const mockDashboardSummary = {
  month: '2026-09',
  totalBalance: 18450000,
  totalIncome: 12500000,
  totalExpenses: 5850000,
  remainingBudget: 3150000,
  totalBudgetLimit: 9000000,
  budgetUsedPercentage: 65,
};

export const mockTransactions = [
  {
    id: 'tx_101',
    type: 'income',
    amount: 10000000,
    category: 'Gaji Utama',
    account: 'Bank BCA',
    description: 'Gaji Bulanan PT Tech Utama',
    date: '2026-09-01',
    createdAt: '2026-09-01T09:00:00Z'
  },
  {
    id: 'tx_102',
    type: 'income',
    amount: 2500000,
    category: 'Freelance & Sampingan',
    account: 'Bank Mandiri',
    description: 'Project UI Design Client',
    date: '2026-09-05',
    createdAt: '2026-09-05T14:30:00Z'
  },
  {
    id: 'tx_103',
    type: 'expense',
    amount: 1800000,
    category: 'Makanan & Minuman',
    account: 'GoPay',
    description: 'Belanja Bulanan & Kebutuhan Dapur',
    date: '2026-09-03',
    createdAt: '2026-09-03T11:15:00Z'
  },
  {
    id: 'tx_104',
    type: 'expense',
    amount: 850000,
    category: 'Tagihan & Tagihan Listrik',
    account: 'Bank BCA',
    description: 'Listrik PLN & WiFi Indihome',
    date: '2026-09-07',
    createdAt: '2026-09-07T10:00:00Z'
  },
  {
    id: 'tx_105',
    type: 'expense',
    amount: 1200000,
    category: 'Belanja',
    account: 'ShopeePay',
    description: 'Beli Pakaian & Perlengkapan Kerja',
    date: '2026-09-10',
    createdAt: '2026-09-10T16:20:00Z'
  },
  {
    id: 'tx_106',
    type: 'expense',
    amount: 600000,
    category: 'Transportasi',
    account: 'OVO',
    description: 'Isi Bensin Pertamax & Tol',
    date: '2026-09-12',
    createdAt: '2026-09-12T08:45:00Z'
  },
  {
    id: 'tx_107',
    type: 'expense',
    amount: 900000,
    category: 'Hiburan',
    account: 'GoPay',
    description: 'Nonton Bioskop & Langganan Streaming',
    date: '2026-09-15',
    createdAt: '2026-09-15T19:30:00Z'
  },
  {
    id: 'tx_108',
    type: 'expense',
    amount: 500000,
    category: 'Kesehatan',
    account: 'Tunai / Dompet',
    description: 'Beli Vitamin & Pemeriksaan Rutin',
    date: '2026-09-18',
    createdAt: '2026-09-18T13:10:00Z'
  }
];

export const mockBudgets = [
  {
    id: 'bg_01',
    category: 'Makanan & Minuman',
    limitAmount: 2500000,
    spentAmount: 1800000,
    month: '2026-09',
    icon: 'Utensils'
  },
  {
    id: 'bg_02',
    category: 'Belanja',
    limitAmount: 1500000,
    spentAmount: 1200000,
    month: '2026-09',
    icon: 'ShoppingBag'
  },
  {
    id: 'bg_03',
    category: 'Tagihan & Tagihan Listrik',
    limitAmount: 1000000,
    spentAmount: 850000,
    month: '2026-09',
    icon: 'Receipt'
  },
  {
    id: 'bg_04',
    category: 'Transportasi',
    limitAmount: 1000000,
    spentAmount: 600000,
    month: '2026-09',
    icon: 'Car'
  },
  {
    id: 'bg_05',
    category: 'Hiburan',
    limitAmount: 1000000,
    spentAmount: 900000,
    month: '2026-09',
    icon: 'Gamepad2'
  },
  {
    id: 'bg_06',
    category: 'Kesehatan',
    limitAmount: 1000000,
    spentAmount: 500000,
    month: '2026-09',
    icon: 'HeartPulse'
  }
];

export const mockMonthlyTrends = [
  { month: 'Mei', income: 11000000, expense: 6200000 },
  { month: 'Jun', income: 11500000, expense: 5900000 },
  { month: 'Jul', income: 12000000, expense: 6500000 },
  { month: 'Agt', income: 12000000, expense: 5400000 },
  { month: 'Sep', income: 12500000, expense: 5850000 }
];

export const mockCategoryExpenses = [
  { name: 'Makanan & Minuman', value: 1800000, color: '#f59e0b' },
  { name: 'Belanja', value: 1200000, color: '#a855f7' },
  { name: 'Hiburan', value: 900000, color: '#ec4899' },
  { name: 'Tagihan', value: 850000, color: '#f43f5e' },
  { name: 'Transportasi', value: 600000, color: '#3b82f6' },
  { name: 'Kesehatan', value: 500000, color: '#10b981' }
];
