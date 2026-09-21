export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
};

export const CATEGORIES = [
  { id: 'cat_food', name: 'Makanan & Minuman', type: 'expense', icon: 'Utensils', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  { id: 'cat_transport', name: 'Transportasi', type: 'expense', icon: 'Car', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  { id: 'cat_shopping', name: 'Belanja', type: 'expense', icon: 'ShoppingBag', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  { id: 'cat_bills', name: 'Tagihan & Tagihan Listrik', type: 'expense', icon: 'Receipt', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
  { id: 'cat_entertainment', name: 'Hiburan', type: 'expense', icon: 'Gamepad2', color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20' },
  { id: 'cat_health', name: 'Kesehatan', type: 'expense', icon: 'HeartPulse', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  { id: 'cat_education', name: 'Pendidikan', type: 'expense', icon: 'GraduationCap', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
  { id: 'cat_salary', name: 'Gaji Utama', type: 'income', icon: 'Wallet', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  { id: 'cat_freelance', name: 'Freelance & Sampingan', type: 'income', icon: 'Briefcase', color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' },
  { id: 'cat_investment', name: 'Investasi & Dividen', type: 'income', icon: 'TrendingUp', color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' },
  { id: 'cat_other_income', name: 'Pemasukan Lainnya', type: 'income', icon: 'PlusCircle', color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' },
  { id: 'cat_other_expense', name: 'Pengeluaran Lainnya', type: 'expense', icon: 'MinusCircle', color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20' },
];

export const ACCOUNTS = [
  { id: 'acc_cash', name: 'Tunai / Dompet' },
  { id: 'acc_bca', name: 'Bank BCA' },
  { id: 'acc_mandiri', name: 'Bank Mandiri' },
  { id: 'acc_gopay', name: 'GoPay' },
  { id: 'acc_ovo', name: 'OVO' },
  { id: 'acc_shopeepay', name: 'ShopeePay' },
];

export const MONTH_OPTIONS = [
  { value: '2026-09', label: 'September 2026' },
  { value: '2026-08', label: 'Agustus 2026' },
  { value: '2026-07', label: 'Juli 2026' },
  { value: '2026-06', label: 'Juni 2026' },
];
