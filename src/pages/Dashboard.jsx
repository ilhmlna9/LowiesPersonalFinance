import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Plus,
  AlertCircle,
  CalendarDays,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatIDR, formatDate } from '../utils/formatters.js';
import { MONTH_OPTIONS } from '../utils/constants.js';
import { getDashboardSummary, getAnalyticsData } from '../services/dashboardService.js';
import { getBudgets } from '../services/budgetService.js';
import { getTransactions } from '../services/transactionService.js';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card.jsx';
import { StatCard } from '../components/ui/StatCard.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { ProgressBar } from '../components/ui/ProgressBar.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Select } from '../components/ui/Select.jsx';
import { Button } from '../components/ui/Button.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { PageLoader } from '../components/ui/LoadingSpinner.jsx';

const PIE_COLORS = ['#f59e0b', '#a855f7', '#ec4899', '#f43f5e', '#3b82f6', '#10b981', '#6366f1', '#14b8a6'];

function getBudgetVariant(percentage) {
  if (percentage >= 100) return 'danger';
  if (percentage > 80) return 'warning';
  return 'success';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(MONTH_OPTIONS[0]?.value ?? '2026-09');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState({ monthlyTrends: [], categoryExpenses: [] });
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const fetchDashboard = useCallback(async (month) => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, analyticsData, budgetData, txResult] = await Promise.all([
        getDashboardSummary(month),
        getAnalyticsData(month),
        getBudgets(month),
        getTransactions({ page: 1, limit: 5, sort: 'date_desc' }),
      ]);
      setSummary(summaryData);
      setAnalytics({
        monthlyTrends: analyticsData.monthlyTrends ?? [],
        categoryExpenses: analyticsData.categoryExpenses ?? [],
      });
      setBudgets(Array.isArray(budgetData) ? budgetData.slice(0, 3) : []);
      const txList = Array.isArray(txResult?.data) ? txResult.data : Array.isArray(txResult) ? txResult : [];
      setTransactions(txList);
    } catch (err) {
      setError(err?.message || 'Gagal memuat data dashboard. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard(selectedMonth);
  }, [selectedMonth, fetchDashboard]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Ringkasan keuangan Anda bulan ini" />
        <PageLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Ringkasan keuangan Anda bulan ini"
          action={
            <Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-44">
              {MONTH_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          }
        />
        <Card className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Gagal memuat data</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">{error}</p>
          <Button className="mt-5" onClick={() => fetchDashboard(selectedMonth)}>Coba Lagi</Button>
        </Card>
      </div>
    );
  }

  const isEmpty = transactions.length === 0 && !summary?.totalIncome && !summary?.totalExpenses;

  if (isEmpty) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Ringkasan keuangan Anda bulan ini"
          action={
            <Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-44">
              {MONTH_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          }
        />
        <EmptyState
          icon={<Wallet className="w-6 h-6" />}
          title="Belum ada transaksi"
          description="Mulai kelola keuangan Anda dengan menambahkan transaksi pertama. Dashboard akan menampilkan ringkasan setelah ada data."
          action={
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => navigate('/transactions')}>
              Tambah Transaksi Pertama
            </Button>
          }
        />
      </div>
    );
  }

  const displaySummary = summary ?? {
    totalBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    remainingBudget: 0,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Ringkasan keuangan dan aktivitas terbaru Anda"
        action={
          <div className="flex items-center gap-3">
            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-44"
              aria-label="Pilih bulan"
            >
              {MONTH_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => navigate('/transactions')}>
              Tambah Transaksi
            </Button>
          </div>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Saldo"
          value={displaySummary.totalBalance}
          subtitle="Saldo keseluruhan akun"
          variant="default"
          icon={<Wallet className="w-5 h-5" />}
        />
        <StatCard
          title="Total Pemasukan"
          value={displaySummary.totalIncome}
          subtitle="Bulan ini"
          variant="income"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatCard
          title="Total Pengeluaran"
          value={displaySummary.totalExpenses}
          subtitle="Bulan ini"
          variant="expense"
          icon={<TrendingDown className="w-5 h-5" />}
        />
        <StatCard
          title="Sisa Anggaran"
          value={displaySummary.remainingBudget}
          subtitle={`${displaySummary.budgetUsedPercentage ?? 0}% terpakai dari ${formatIDR(displaySummary.totalBudgetLimit ?? 0)}`}
          variant="budget"
          icon={<PiggyBank className="w-5 h-5" />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pemasukan vs Pengeluaran</CardTitle>
            <CardDescription>Tren bulanan 5 bulan terakhir</CardDescription>
          </CardHeader>
          {analytics.monthlyTrends.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-10">Belum ada data tren bulanan</p>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.monthlyTrends} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                  <Tooltip
                    formatter={(value) => formatIDR(value)}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                  <Bar dataKey="income" name="Pemasukan" fill="#10b981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expense" name="Pengeluaran" fill="#f43f5e" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pengeluaran per Kategori</CardTitle>
            <CardDescription>Distribusi pengeluaran bulan ini</CardDescription>
          </CardHeader>
          {analytics.categoryExpenses.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-10">Belum ada data pengeluaran</p>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.categoryExpenses}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                  >
                    {analytics.categoryExpenses.map((entry, idx) => (
                      <Cell key={entry.name} fill={entry.color || PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatIDR(value)}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: '12px', marginTop: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Recent Transactions + Budget Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Transaksi Terbaru</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">5 transaksi terakhir</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/transactions')}>Lihat Semua</Button>
          </div>
          {transactions.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="w-6 h-6" />}
              title="Belum ada transaksi"
              description="Transaksi Anda akan muncul di sini."
              className="py-8"
            />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.slice(0, 5).map((tx) => (
                <li key={tx.id} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{tx.description || tx.category}</p>
                      <Badge variant={tx.type === 'income' ? 'income' : 'expense'}>
                        {tx.type === 'income' ? 'Masuk' : 'Keluar'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {tx.category} · {tx.account} · {formatDate(tx.date)}
                    </p>
                  </div>
                  <span className={`text-sm font-semibold shrink-0 ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatIDR(tx.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Progres Anggaran</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Ringkasan anggaran bulan ini</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/budgets')}>Kelola</Button>
          </div>
          {budgets.length === 0 ? (
            <EmptyState
              icon={<PiggyBank className="w-6 h-6" />}
              title="Belum ada anggaran"
              description="Buat anggaran untuk memantau pengeluaran per kategori."
              action={
                <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => navigate('/budgets')}>
                  Buat Anggaran
                </Button>
              }
              className="py-8"
            />
          ) : (
            <div className="space-y-5">
              {budgets.map((budget) => {
                const percentage = Math.round(((budget.spentAmount ?? 0) / (budget.limitAmount || 1)) * 100);
                const clamped = Math.min(percentage, 100);
                const variant = getBudgetVariant(percentage);
                return (
                  <div key={budget.id}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate pr-2">{budget.category}</p>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
                        {formatIDR(budget.spentAmount)} / {formatIDR(budget.limitAmount)}
                      </span>
                    </div>
                    <ProgressBar value={clamped} max={100} variant={variant} size="md" />
                    <div className="flex items-center justify-between mt-1.5">
                      <span className={`text-xs font-medium ${variant === 'danger' ? 'text-rose-600 dark:text-rose-400' : variant === 'warning' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        {percentage}% terpakai
                      </span>
                      {variant === 'danger' && <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Melebihi anggaran</span>}
                      {variant === 'warning' && <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Hampir habis</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
