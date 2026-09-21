import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart2,
  PieChart as PieChartIcon,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  AlertCircle,
  BarChart3,
  Activity,
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
  AreaChart,
  Area,
} from 'recharts';
import { formatIDR } from '../utils/formatters.js';
import { MONTH_OPTIONS } from '../utils/constants.js';
import { getAnalyticsData } from '../services/dashboardService.js';
import { getBudgets } from '../services/budgetService.js';
import { getTransactions } from '../services/transactionService.js';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Select } from '../components/ui/Select.jsx';
import { Button } from '../components/ui/Button.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { PageLoader } from '../components/ui/LoadingSpinner.jsx';
import { ProgressBar } from '../components/ui/ProgressBar.jsx';

const PIE_COLORS = ['#f59e0b', '#a855f7', '#ec4899', '#f43f5e', '#3b82f6', '#10b981', '#6366f1', '#14b8a6', '#f97316', '#06b6d4'];

function getBudgetVariant(percentage) {
  if (percentage >= 100) return 'danger';
  if (percentage > 80) return 'warning';
  return 'success';
}

export default function Analytics() {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(MONTH_OPTIONS[0]?.value ?? '2026-09');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({ summary: null, monthlyTrends: [], categoryExpenses: [] });
  const [budgets, setBudgets] = useState([]);

  const fetchAnalytics = useCallback(async (month) => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsData, budgetData] = await Promise.all([
        getAnalyticsData(month),
        getBudgets(month),
        // getTransactions is available if needed for additional insight; fetching silently for completeness
        getTransactions({ page: 1, limit: 5, sort: 'date_desc' }).catch(() => ({ data: [] })),
      ]);
      setAnalytics({
        summary: analyticsData.summary ?? analyticsData ?? null,
        monthlyTrends: analyticsData.monthlyTrends ?? [],
        categoryExpenses: analyticsData.categoryExpenses ?? [],
      });
      setBudgets(Array.isArray(budgetData) ? budgetData : []);
    } catch (err) {
      setError(err?.message || 'Gagal memuat data analitik. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(selectedMonth);
  }, [selectedMonth, fetchAnalytics]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analitik" description="Visualisasi keuangan dan tren pengeluaran Anda" />
        <PageLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Analitik"
          description="Visualisasi keuangan dan tren pengeluaran Anda"
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
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Gagal memuat analitik</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">{error}</p>
          <Button className="mt-5" onClick={() => fetchAnalytics(selectedMonth)}>Coba Lagi</Button>
        </Card>
      </div>
    );
  }

  const summary = analytics.summary;
  const hasNoData =
    analytics.monthlyTrends.length === 0 &&
    analytics.categoryExpenses.length === 0 &&
    budgets.length === 0 &&
    !summary?.totalIncome &&
    !summary?.totalExpenses;

  if (hasNoData) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Analitik"
          description="Visualisasi keuangan dan tren pengeluaran Anda"
          action={
            <Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-44">
              {MONTH_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          }
        />
        <EmptyState
          icon={<BarChart3 className="w-6 h-6" />}
          title="Belum ada data analitik"
          description="Data analitik akan muncul setelah Anda memiliki transaksi. Mulai catat pemasukan dan pengeluaran untuk melihat grafik."
          action={
            <Button onClick={() => navigate('/transactions')}>Tambah Transaksi</Button>
          }
        />
      </div>
    );
  }

  const totalIncome = summary?.totalIncome ?? analytics.monthlyTrends.find((t) => t.month?.toLowerCase().includes('sep'))?.income ?? 0;
  const totalExpense = summary?.totalExpenses ?? analytics.categoryExpenses.reduce((s, c) => s + (Number(c.value) || 0), 0) ?? 0;
  // Fallback to monthlyTrends last entry if summary missing
  const fallbackIncome = analytics.monthlyTrends.length ? analytics.monthlyTrends[analytics.monthlyTrends.length - 1]?.income ?? 0 : 0;
  const fallbackExpense = analytics.monthlyTrends.length ? analytics.monthlyTrends[analytics.monthlyTrends.length - 1]?.expense ?? 0 : 0;
  const displayIncome = summary?.totalIncome ?? fallbackIncome;
  const displayExpense = summary?.totalExpenses ?? fallbackExpense;
  const displayRemaining = summary?.remainingBudget ?? summary?.totalBalance ?? (displayIncome - displayExpense);
  const monthLabel = MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label ?? selectedMonth;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analitik"
        description="Visualisasi keuangan dan tren pengeluaran Anda"
        action={
          <Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-44" aria-label="Pilih bulan">
            {MONTH_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Pemasukan</p>
            <p className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1 truncate">{formatIDR(displayIncome)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{monthLabel}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center shrink-0">
            <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Pengeluaran</p>
            <p className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1 truncate">{formatIDR(displayExpense)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{monthLabel}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${displayRemaining < 0 ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20' : 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20'}`}>
            <Wallet className={`w-5 h-5 ${displayRemaining < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-400'}`} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Sisa / Saldo</p>
            <p className={`text-base font-bold mt-1 truncate ${displayRemaining < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}>{formatIDR(displayRemaining)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {displayIncome > 0 ? `${Math.round((displayExpense / displayIncome) * 100)}% dari pemasukan terpakai` : 'Ringkasan bulan ini'}
            </p>
          </div>
        </Card>
      </div>

      {/* Charts Row 1: Pie + Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center">
                <PieChartIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle>Pengeluaran per Kategori</CardTitle>
                <CardDescription>Distribusi pengeluaran {monthLabel}</CardDescription>
              </div>
            </div>
          </CardHeader>
          {analytics.categoryExpenses.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-10">Belum ada data kategori</p>
          ) : (
            <div className="h-[320px] w-full">
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

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center">
                <BarChart2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <CardTitle>Pemasukan vs Pengeluaran</CardTitle>
                <CardDescription>Perbandingan 5 bulan terakhir</CardDescription>
              </div>
            </div>
          </CardHeader>
          {analytics.monthlyTrends.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-10">Belum ada data tren</p>
          ) : (
            <div className="h-[320px] w-full">
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
      </div>

      {/* Charts Row 2: Area + Budget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center">
                <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle>Tren Pengeluaran Bulanan</CardTitle>
                <CardDescription>Pergerakan pengeluaran dari bulan ke bulan</CardDescription>
              </div>
            </div>
          </CardHeader>
          {analytics.monthlyTrends.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-10">Belum ada data tren pengeluaran</p>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                  <Tooltip
                    formatter={(value) => formatIDR(value)}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    name="Pengeluaran"
                    stroke="#f43f5e"
                    fill="#f43f5e"
                    fillOpacity={0.15}
                    strokeWidth={2.5}
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#f43f5e' }}
                    activeDot={{ r: 6, fill: '#f43f5e' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 flex items-center justify-center">
                <PiggyBank className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle>Sisa Anggaran per Kategori</CardTitle>
                <CardDescription>Progres pemakaian anggaran {monthLabel}</CardDescription>
              </div>
            </div>
          </CardHeader>
          {budgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">Belum ada anggaran untuk bulan ini</p>
              <Button variant="secondary" size="sm" className="mt-4" onClick={() => navigate('/budgets')}>Kelola Anggaran</Button>
            </div>
          ) : (
            <div className="space-y-5">
              {budgets.map((budget) => {
                const limit = Number(budget.limitAmount) || 0;
                const spent = Number(budget.spentAmount) || 0;
                const remaining = limit - spent;
                const rawPct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
                const clamped = Math.min(rawPct, 100);
                const variant = getBudgetVariant(rawPct);
                return (
                  <div key={budget.id}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate pr-2">{budget.category}</p>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
                        {formatIDR(spent)} / {formatIDR(limit)}
                      </span>
                    </div>
                    <ProgressBar value={clamped} max={100} variant={variant} size="md" />
                    <div className="flex items-center justify-between mt-1.5">
                      <span className={`text-xs font-medium ${variant === 'danger' ? 'text-rose-600 dark:text-rose-400' : variant === 'warning' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        {rawPct}% terpakai · Sisa {formatIDR(remaining)}
                      </span>
                      {variant === 'danger' && <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Melebihi</span>}
                      {variant === 'warning' && <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Hampir habis</span>}
                    </div>
                  </div>
                );
              })}
              {/* Alternative BarChart for remaining budget visual */}
              {budgets.length > 1 && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-3">Visual sisa anggaran</p>
                  <div className="h-[160px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={budgets.map((b) => ({
                          category: b.category.length > 12 ? b.category.slice(0, 12) + '…' : b.category,
                          sisa: Math.max((Number(b.limitAmount) || 0) - (Number(b.spentAmount) || 0), 0),
                          terpakai: Number(b.spentAmount) || 0,
                        }))}
                        layout="vertical"
                        margin={{ left: 10, right: 16 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`} />
                        <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={90} />
                        <Tooltip formatter={(value) => formatIDR(value)} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Bar dataKey="terpakai" name="Terpakai" stackId="a" fill="#f43f5e" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="sisa" name="Sisa" stackId="a" fill="#10b981" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Bottom summary text */}
      {summary && (
        <Card className="bg-slate-50/60 dark:bg-slate-800/40">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-slate-500" />
            Ringkasan {monthLabel}
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
            Pada bulan <span className="font-medium text-slate-900 dark:text-slate-100">{monthLabel}</span>, Anda memiliki pemasukan sebesar{' '}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatIDR(displayIncome)}</span> dan pengeluaran sebesar{' '}
            <span className="font-semibold text-rose-600 dark:text-rose-400">{formatIDR(displayExpense)}</span>.{' '}
            {displayRemaining >= 0 ? (
              <>Sisa anggaran tersisa <span className="font-semibold text-indigo-600 dark:text-indigo-400">{formatIDR(displayRemaining)}</span> yang dapat dialokasikan untuk tabungan atau kebutuhan lain.</>
            ) : (
              <>Anda melebihi anggaran sebesar <span className="font-semibold text-rose-600 dark:text-rose-400">{formatIDR(Math.abs(displayRemaining))}</span>. Pertimbangkan untuk menyesuaikan pengeluaran bulan depan.</>
            )}
          </p>
        </Card>
      )}
    </div>
  );
}
