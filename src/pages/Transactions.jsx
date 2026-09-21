import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  FilterX,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from '../services/transactionService.js';
import { formatIDR, formatDate, formatAmountDots, parseAmountDots, parseAmountNumber } from '../utils/formatters.js';
import { CATEGORIES, ACCOUNTS } from '../utils/constants.js';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Select } from '../components/ui/Select.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { PageLoader } from '../components/ui/LoadingSpinner.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';

// ---------------------------------------------------------------------------
// TransactionForm - reusable inline component to avoid duplicate logic
// ---------------------------------------------------------------------------
function TransactionForm({ formData, setFormData, errors, onSubmit, submitting, isEdit }) {
  const filteredCategories = formData.type
    ? CATEGORIES.filter((c) => c.type === formData.type)
    : CATEGORIES;

  const handleChange = (field, value) => {
    if (field === 'amount') {
      value = formatAmountDots(parseAmountDots(value));
    }
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'type' && value) {
        const validForType = CATEGORIES.filter((c) => c.type === value).map((c) => c.name);
        if (next.category && !validForType.includes(next.category)) {
          next.category = '';
        }
      }
      return next;
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {/* Tipe */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Tipe Transaksi <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleChange('type', 'income')}
            className={`h-11 rounded-xl border text-sm font-medium transition flex items-center justify-center gap-2 ${
              formData.type === 'income'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            Pemasukan
          </button>
          <button
            type="button"
            onClick={() => handleChange('type', 'expense')}
            className={`h-11 rounded-xl border text-sm font-medium transition flex items-center justify-center gap-2 ${
              formData.type === 'expense'
                ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/30 text-rose-700 dark:text-rose-400'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            Pengeluaran
          </button>
        </div>
        {errors.type && <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{errors.type}</p>}
      </div>

      <Input
        label="Jumlah"
        type="text"
        inputMode="numeric"
        placeholder="Contoh: 500.000"
        value={formData.amount}
        onChange={(e) => handleChange('amount', e.target.value)}
        error={errors.amount}
        leftIcon={<span className="text-xs font-semibold text-slate-400">Rp</span>}
      />
      {formData.amount ? (
        <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">
          Terbaca: {formatIDR(parseAmountNumber(formData.amount) || 0)}
        </p>
      ) : null}

      <Select
        label="Kategori"
        value={formData.category}
        onChange={(e) => handleChange('category', e.target.value)}
        error={errors.category}
      >
        <option value="">Pilih kategori</option>
        {filteredCategories.map((cat) => (
          <option key={cat.id} value={cat.name}>
            {cat.name}
          </option>
        ))}
      </Select>

      <Select
        label="Akun / Dompet"
        value={formData.account}
        onChange={(e) => handleChange('account', e.target.value)}
        error={errors.account}
      >
        <option value="">Pilih akun</option>
        {ACCOUNTS.map((acc) => (
          <option key={acc.id} value={acc.name}>
            {acc.name}
          </option>
        ))}
      </Select>

      <Input
        label="Deskripsi"
        placeholder="Contoh: Belanja bulanan di supermarket"
        value={formData.description}
        onChange={(e) => handleChange('description', e.target.value)}
        error={errors.description}
      />
      <p className="text-xs text-slate-400 -mt-2">Opsional, minimal 3 karakter jika diisi.</p>

      <Input
        label="Tanggal"
        type="date"
        value={formData.date}
        onChange={(e) => handleChange('date', e.target.value)}
        error={errors.date}
        leftIcon={<Calendar className="w-4 h-4" />}
      />

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="submit" loading={submitting} className="w-full sm:w-auto">
          {isEdit ? 'Simpan Perubahan' : 'Tambah Transaksi'}
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const LIMIT = 10;

const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Terbaru' },
  { value: 'date_asc', label: 'Terlama' },
  { value: 'amount_desc', label: 'Jumlah Tertinggi' },
  { value: 'amount_asc', label: 'Jumlah Terendah' },
];

const emptyForm = {
  type: '',
  amount: '',
  category: '',
  account: '',
  description: '',
  date: new Date().toISOString().slice(0, 10),
};

function validateForm(data) {
  const errs = {};
  if (!data.type) errs.type = 'Tipe transaksi wajib dipilih';
  {
    const n = parseAmountNumber(data.amount);
    if (data.amount === '' || data.amount === null || data.amount === undefined) {
      errs.amount = 'Jumlah wajib diisi';
    } else if (isNaN(n) || n <= 0) {
      errs.amount = 'Jumlah harus lebih dari 0';
    }
  }
  if (!data.category) errs.category = 'Kategori wajib dipilih';
  if (!data.account) errs.account = 'Akun wajib dipilih';
  if (!data.date) {
    errs.date = 'Tanggal wajib diisi';
  } else {
    const d = new Date(data.date);
    if (isNaN(d.getTime())) errs.date = 'Tanggal tidak valid';
  }
  if (data.description && data.description.trim().length > 0 && data.description.trim().length < 3) {
    errs.description = 'Deskripsi minimal 3 karakter';
  }
  return errs;
}

function getPageNumbers(current, total) {
  const pages = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }
  let start = Math.max(1, current - 2);
  let end = Math.min(total, start + 4);
  if (end - start < 4) start = Math.max(1, end - 4);
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function Transactions() {
  const { toast } = useToast();
  const { checkBudgets } = useNotifications();

  // List state
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sort, setSort] = useState('date_desc');

  // Form modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTx, setDeletingTx] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce search input -> search param
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTransactions({
        page,
        limit: LIMIT,
        search,
        type: filterType !== 'all' ? filterType : '',
        category: filterCategory !== 'all' ? filterCategory : '',
        dateFrom,
        dateTo,
        sort,
      });
      setTransactions(Array.isArray(res.data) ? res.data : []);
      setTotal(res.total ?? 0);
      setTotalPages(res.totalPages ?? 1);
      // Safety: if page exceeds totalPages after filter, correct handled by service, sync state
      if (res.page && res.page !== page) setPage(res.page);
    } catch (err) {
      setError(err?.message || 'Gagal memuat transaksi. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterType, filterCategory, dateFrom, dateTo, sort]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleFilterTypeChange = (val) => {
    setFilterType(val);
    setPage(1);
  };
  const handleFilterCategoryChange = (val) => {
    setFilterCategory(val);
    setPage(1);
  };
  const handleSortChange = (val) => {
    setSort(val);
    setPage(1);
  };
  const handleDateFromChange = (val) => {
    setDateFrom(val);
    setPage(1);
  };
  const handleDateToChange = (val) => {
    setDateTo(val);
    setPage(1);
  };

  const handleResetFilter = () => {
    setSearchInput('');
    setSearch('');
    setFilterType('all');
    setFilterCategory('all');
    setDateFrom('');
    setDateTo('');
    setSort('date_desc');
    setPage(1);
  };

  const hasActiveFilter =
    search || filterType !== 'all' || filterCategory !== 'all' || dateFrom || dateTo || sort !== 'date_desc';

  // Open add
  const openAddModal = () => {
    setEditingTx(null);
    setFormData({ ...emptyForm, date: new Date().toISOString().slice(0, 10) });
    setFormErrors({});
    setShowFormModal(true);
  };

  // Open edit
  const openEditModal = (tx) => {
    setEditingTx(tx);
    setFormData({
      type: tx.type || '',
      amount: formatAmountDots(String(tx.amount ?? '')),
      category: tx.category || '',
      account: tx.account || '',
      description: tx.description || '',
      date: tx.date ? String(tx.date).slice(0, 10) : new Date().toISOString().slice(0, 10),
    });
    setFormErrors({});
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    if (submitting) return;
    setShowFormModal(false);
    setEditingTx(null);
    setFormErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateForm(formData);
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }
    setFormErrors({});
    setSubmitting(true);
    const payload = {
      type: formData.type,
      amount: parseAmountNumber(formData.amount),
      category: formData.category,
      account: formData.account,
      description: formData.description.trim(),
      date: formData.date,
    };
    try {
      if (editingTx) {
        await updateTransaction(editingTx.id, payload);
        toast.success('Transaksi berhasil diperbarui');
      } else {
        await createTransaction(payload);
        toast.success('Transaksi berhasil ditambahkan');
      }
      setShowFormModal(false);
      setEditingTx(null);
      // Bersihkan throttle per-user agar notifikasi bisa langsung muncul
      try {
        const uid = JSON.parse(localStorage.getItem('user_info') || 'null')?.id || 'anon';
        localStorage.removeItem('lowies_last_budget_check');
        localStorage.removeItem(`lowies_last_budget_check_${uid}`);
      } catch {}
      try { await checkBudgets(true); } catch {}
      // After create, go to first page to see newest
      if (!editingTx) setPage(1);
      await fetchList();
    } catch (err) {
      toast.error(err?.message || 'Gagal menyimpan transaksi');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete
  const openDeleteModal = (tx) => {
    setDeletingTx(tx);
    setShowDeleteModal(true);
  };
  const closeDeleteModal = () => {
    if (deleting) return;
    setShowDeleteModal(false);
    setDeletingTx(null);
  };
  const handleConfirmDelete = async () => {
    if (!deletingTx) return;
    setDeleting(true);
    try {
      await deleteTransaction(deletingTx.id);
      toast.success('Transaksi berhasil dihapus');
      setShowDeleteModal(false);
      setDeletingTx(null);
      // If last item on page and not first page, go back one page
      const isLastOnPage = transactions.length === 1 && page > 1;
      if (isLastOnPage) setPage((p) => p - 1);
      else await fetchList();
    } catch (err) {
      toast.error(err?.message || 'Gagal menghapus transaksi');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transaksi"
        description="Kelola dan pantau semua pemasukan serta pengeluaran Anda"
        action={
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
            Tambah Transaksi
          </Button>
        }
      />

      {/* Filters */}
      <Card className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            placeholder="Cari deskripsi..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
          <Select
            value={filterType}
            onChange={(e) => handleFilterTypeChange(e.target.value)}
            aria-label="Filter tipe"
          >
            <option value="all">Semua Tipe</option>
            <option value="income">Pemasukan</option>
            <option value="expense">Pengeluaran</option>
          </Select>
          <Select
            value={filterCategory}
            onChange={(e) => handleFilterCategoryChange(e.target.value)}
            aria-label="Filter kategori"
          >
            <option value="all">Semua Kategori</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </Select>
          <Select value={sort} onChange={(e) => handleSortChange(e.target.value)} aria-label="Urutkan">
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Dari Tanggal"
            type="date"
            value={dateFrom}
            onChange={(e) => handleDateFromChange(e.target.value)}
          />
          <Input
            label="Sampai Tanggal"
            type="date"
            value={dateTo}
            onChange={(e) => handleDateToChange(e.target.value)}
          />
          <div className="flex items-end">
            {hasActiveFilter ? (
              <Button variant="secondary" size="md" onClick={handleResetFilter} leftIcon={<FilterX className="w-4 h-4" />} className="w-full">
                Reset Filter
              </Button>
            ) : (
              <div className="hidden sm:block h-11" />
            )}
          </div>
        </div>
        {total > 0 && !loading && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Menampilkan {transactions.length} dari {total} transaksi
            {search ? ` untuk pencarian "${search}"` : ''}
          </p>
        )}
      </Card>

      {/* Content */}
      {loading ? (
        <PageLoader />
      ) : error ? (
        <Card className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Gagal memuat transaksi</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">{error}</p>
          <Button className="mt-5" onClick={fetchList}>
            Coba Lagi
          </Button>
        </Card>
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-6 h-6" />}
          title="Belum ada transaksi"
          description={
            hasActiveFilter
              ? 'Tidak ada transaksi yang sesuai dengan filter. Coba ubah pencarian atau reset filter.'
              : 'Mulai catat keuangan Anda dengan menambahkan transaksi pertama.'
          }
          action={
            hasActiveFilter ? (
              <Button variant="secondary" onClick={handleResetFilter}>
                Reset Filter
              </Button>
            ) : (
              <Button leftIcon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
                Tambah Transaksi
              </Button>
            )
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
                    <th className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300 text-center">Aksi</th>
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
                        <p className="font-medium text-slate-900 dark:text-slate-100 line-clamp-1">
                          {tx.description || '-'}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{tx.category}</td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{tx.account}</td>
                      <td className="px-5 py-4">
                        <Badge variant={tx.type === 'income' ? 'income' : 'expense'}>
                          {tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                        </Badge>
                      </td>
                      <td className={`px-5 py-4 text-right font-semibold whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {tx.type === 'income' ? '+' : '-'}
                        {formatIDR(tx.amount)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditModal(tx)}
                            className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 dark:text-slate-400 transition"
                            aria-label={`Edit ${tx.description || tx.category}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(tx)}
                            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 dark:text-slate-400 transition"
                            aria-label={`Hapus ${tx.description || tx.category}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-2 line-clamp-2">
                      {tx.description || tx.category}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {tx.category} · {tx.account}
                    </p>
                  </div>
                  <span className={`text-sm font-bold shrink-0 ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {tx.type === 'income' ? '+' : '-'}
                    {formatIDR(tx.amount)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => openEditModal(tx)} leftIcon={<Pencil className="w-3.5 h-3.5" />}>
                    Edit
                  </Button>
                  <Button variant="secondary" size="sm" className="flex-1 !text-rose-600 dark:!text-rose-400" onClick={() => openDeleteModal(tx)} leftIcon={<Trash2 className="w-3.5 h-3.5" />}>
                    Hapus
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 order-2 sm:order-1">
                Halaman {page} dari {totalPages} · Total {total} transaksi
              </p>
              <div className="flex items-center gap-1.5 order-1 sm:order-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  Prev
                </Button>
                <div className="flex items-center gap-1">
                  {getPageNumbers(page, totalPages).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`min-w-9 h-8 rounded-lg text-sm font-medium border transition ${
                        p === page
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={showFormModal}
        onClose={closeFormModal}
        title={editingTx ? 'Edit Transaksi' : 'Tambah Transaksi'}
        description={editingTx ? 'Perbarui detail transaksi Anda' : 'Catat pemasukan atau pengeluaran baru'}
        size="md"
      >
        <TransactionForm
          formData={formData}
          setFormData={setFormData}
          errors={formErrors}
          onSubmit={handleSubmit}
          submitting={submitting}
          isEdit={!!editingTx}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onClose={closeDeleteModal}
        title="Konfirmasi Hapus"
        description="Yakin hapus transaksi ini?"
        size="sm"
      >
        {deletingTx && (
          <div className="space-y-5">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-2">
                {deletingTx.description || deletingTx.category}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {deletingTx.category} · {formatDate(deletingTx.date)} · {formatIDR(deletingTx.amount)}
              </p>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Tindakan ini tidak dapat dibatalkan. Data transaksi akan dihapus permanen.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={closeDeleteModal} disabled={deleting}>
                Batal
              </Button>
              <Button variant="danger" onClick={handleConfirmDelete} loading={deleting}>
                Hapus
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
