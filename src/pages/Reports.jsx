import { useEffect, useState, useCallback } from 'react';
import { Download, FileSpreadsheet, FileText, AlertCircle, Calendar, FilterX, Receipt } from 'lucide-react';
import { getTransactions } from '../services/transactionService.js';
import { formatIDR, formatDate } from '../utils/formatters.js';
import { MONTH_OPTIONS } from '../utils/constants.js';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Select } from '../components/ui/Select.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { PageLoader } from '../components/ui/LoadingSpinner.jsx';
import { useToast } from '../context/ToastContext.jsx';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

function toCSV(rows) {
  const headers = ['Tanggal', 'Deskripsi', 'Kategori', 'Akun', 'Tipe', 'Jumlah'];
  const escape = (val) => {
    const s = String(val ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers.map(escape).join(',')];
  for (const r of rows) {
    lines.push(
      [
        escape(r.date),
        escape(r.description || r.category),
        escape(r.category),
        escape(r.account),
        escape(r.type === 'income' ? 'Pemasukan' : 'Pengeluaran'),
        escape(r.amount),
      ].join(',')
    );
  }
  return lines.join('\n');
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const { toast } = useToast();

  // Filter state
  const [selectedMonth, setSelectedMonth] = useState(MONTH_OPTIONS[0]?.value ?? '2026-09');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [exportFormat, setExportFormat] = useState('csv');

  // Data state
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  const fetchPreview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTransactions({
        page: 1,
        limit: 50,
        type: filterType !== 'all' ? filterType : '',
        dateFrom,
        dateTo,
        sort: 'date_desc',
      });
      // If month selected and no explicit date range, filter client-side by month
      let data = Array.isArray(res.data) ? res.data : [];
      let filteredTotal = res.total ?? data.length;
      if (!dateFrom && !dateTo && selectedMonth) {
        const monthFiltered = data.filter((tx) => String(tx.date || '').startsWith(selectedMonth));
        // If we have date filtering via month, use that; otherwise show server result
        // Only apply month filter when no date range is set, to respect MONTH_OPTIONS intent
        if (monthFiltered.length > 0 || data.length > 0) {
          // Prefer monthFiltered when it yields results, but keep fallback to all if month has no data
          // To keep consistent, show monthFiltered when selectedMonth is set
          data = monthFiltered;
          filteredTotal = monthFiltered.length;
        }
      }
      setTransactions(data);
      setTotal(filteredTotal);
    } catch (err) {
      setError(err?.message || 'Gagal memuat laporan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, dateFrom, dateTo, filterType]);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  const handleReset = () => {
    setSelectedMonth(MONTH_OPTIONS[0]?.value ?? '2026-09');
    setDateFrom('');
    setDateTo('');
    setFilterType('all');
    setExportFormat('csv');
  };

  const handleExport = async () => {
    if (exportFormat === 'pdf') {
      toast.info('Export PDF akan tersedia setelah integrasi backend');
      return;
    }

    if (transactions.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    setExporting(true);
    try {
      // Simulate network delay
      await new Promise((r) => setTimeout(r, 600));

      if (USE_MOCK) {
        const csv = toCSV(transactions);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const monthLabel = selectedMonth || 'laporan';
        const filename = `laporan-${monthLabel}-${new Date().toISOString().slice(0, 10)}.csv`;
        triggerDownload(blob, filename);
        toast.success('Laporan berhasil diunduh');
      } else {
        // Future backend export: placeholder still triggers CSV from current data
        const csv = toCSV(transactions);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const filename = `laporan-${selectedMonth || 'export'}.csv`;
        triggerDownload(blob, filename);
        toast.success('Laporan berhasil diunduh');
      }
    } catch (err) {
      toast.error(err?.message || 'Gagal mengekspor laporan');
    } finally {
      setExporting(false);
    }
  };

  const hasActiveFilter = selectedMonth !== (MONTH_OPTIONS[0]?.value ?? '2026-09') || dateFrom || dateTo || filterType !== 'all';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan"
        description="Filter, pratinjau, dan ekspor laporan transaksi Anda"
        action={
          <Button
            onClick={handleExport}
            loading={exporting}
            leftIcon={!exporting ? <Download className="w-4 h-4" /> : undefined}
            disabled={loading || transactions.length === 0}
          >
            Ekspor Laporan
          </Button>
        }
      />

      {/* Filter Card */}
      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center">
            <FileSpreadsheet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Filter Laporan</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Atur periode dan jenis transaksi untuk pratinjau</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select
            label="Bulan"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {MONTH_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>

          <Input
            label="Dari Tanggal"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />

          <Input
            label="Sampai Tanggal"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />

          <Select
            label="Tipe Transaksi"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">Semua Tipe</option>
            <option value="income">Pemasukan</option>
            <option value="expense">Pengeluaran</option>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select
            label="Format Ekspor"
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
          >
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
          </Select>

          <div className="flex items-end gap-2 sm:col-span-1">
            {hasActiveFilter ? (
              <Button variant="secondary" size="md" onClick={handleReset} leftIcon={<FilterX className="w-4 h-4" />} className="w-full">
                Reset Filter
              </Button>
            ) : (
              <div className="hidden sm:block h-11" />
            )}
          </div>

          <div className="flex items-end sm:col-span-2">
            <div className="w-full rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {exportFormat === 'csv' ? <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> : <FileText className="w-4 h-4 text-rose-600" />}
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {exportFormat === 'csv' ? 'Siap ekspor CSV' : 'Pratinjau PDF (coming soon)'}
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">{total} transaksi</span>
            </div>
          </div>
        </div>

        {(dateFrom || dateTo || selectedMonth) && !loading && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pratinjau {transactions.length} transaksi {selectedMonth ? `· Bulan ${MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label ?? selectedMonth}` : ''} {dateFrom ? `· Dari ${formatDate(dateFrom)}` : ''} {dateTo ? `· Sampai ${formatDate(dateTo)}` : ''}
          </p>
        )}
      </Card>

      {/* Preview */}
      {loading ? (
        <PageLoader />
      ) : error ? (
        <Card className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Gagal memuat laporan</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">{error}</p>
          <Button className="mt-5" onClick={fetchPreview}>Coba Lagi</Button>
        </Card>
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-6 h-6" />}
          title="Tidak ada transaksi untuk filter ini"
          description="Coba ubah rentang tanggal, bulan, atau tipe transaksi untuk melihat pratinjau laporan."
          action={
            <Button variant="secondary" onClick={handleReset}>Reset Filter</Button>
          }
        />
      ) : (
        <>
          {/* Desktop Table */}
          <Card padding={false} className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-left">
                    <th className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">Tanggal</th>
                    <th className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300">Deskripsi</th>
                    <th className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300">Kategori</th>
                    <th className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300">Akun</th>
                    <th className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300">Tipe</th>
                    <th className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300 text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="px-5 py-4 whitespace-nowrap text-slate-700 dark:text-slate-300">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(tx.date)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-900 dark:text-slate-100 line-clamp-1">{tx.description || '-'}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{tx.category}</td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{tx.account}</td>
                      <td className="px-5 py-4">
                        <Badge variant={tx.type === 'income' ? 'income' : 'expense'}>
                          {tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                        </Badge>
                      </td>
                      <td className={`px-5 py-4 text-right font-semibold whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatIDR(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400">Menampilkan {transactions.length} transaksi pratinjau (maks 50)</p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Total {total} transaksi sesuai filter</p>
            </div>
          </Card>

          {/* Mobile Cards */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {transactions.map((tx) => (
              <Card key={tx.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={tx.type === 'income' ? 'income' : 'expense'}>
                        {tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                      </Badge>
                      <span className="text-xs text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(tx.date)}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-2 line-clamp-2">{tx.description || tx.category}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{tx.category} · {tx.account}</p>
                  </div>
                  <span className={`text-sm font-bold shrink-0 ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatIDR(tx.amount)}
                  </span>
                </div>
              </Card>
            ))}
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">Menampilkan {transactions.length} transaksi pratinjau</p>
          </div>
        </>
      )}
    </div>
  );
}
