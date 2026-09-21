import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  PiggyBank,
  Wallet,
  AlertCircle,
  AlertTriangle,
  CalendarDays,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { getBudgets, createBudget, updateBudget, deleteBudget } from '../services/budgetService.js';
import { formatIDR, calculatePercentage, formatAmountDots, parseAmountDots, parseAmountNumber } from '../utils/formatters.js';
import { CATEGORIES, MONTH_OPTIONS } from '../utils/constants.js';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Select } from '../components/ui/Select.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { ProgressBar } from '../components/ui/ProgressBar.jsx';
import { PageLoader } from '../components/ui/LoadingSpinner.jsx';
import { useToast } from '../context/ToastContext.jsx';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const expenseCategories = CATEGORIES.filter((c) => c.type === 'expense');

function getCategoryMeta(categoryName) {
  return CATEGORIES.find((c) => c.name === categoryName) || null;
}

function getBudgetVariant(percentage) {
  if (percentage >= 100) return 'danger';
  if (percentage > 80) return 'warning';
  return 'success';
}

const emptyForm = {
  category: '',
  month: '',
  limitAmount: '',
};

function validateForm(data) {
  const errs = {};
  if (!data.category || !String(data.category).trim()) {
    errs.category = 'Kategori wajib dipilih';
  }
  if (!data.month || !String(data.month).trim()) {
    errs.month = 'Bulan wajib dipilih';
  }
  {
    const n = parseAmountNumber(data.limitAmount);
    if (data.limitAmount === '' || data.limitAmount === null || data.limitAmount === undefined) {
      errs.limitAmount = 'Batas anggaran wajib diisi';
    } else if (isNaN(n) || n <= 0) {
      errs.limitAmount = 'Batas anggaran harus lebih dari 0';
    }
  }
  return errs;
}

// ---------------------------------------------------------------------------
// BudgetForm (reusable)
// ---------------------------------------------------------------------------
function BudgetForm({ formData, setFormData, errors, onSubmit, submitting, isEdit, usedCategories }) {
  const handleChange = (field, value) => {
    if (field === 'limitAmount') value = formatAmountDots(parseAmountDots(value));
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Select
        label="Kategori"
        value={formData.category}
        onChange={(e) => handleChange('category', e.target.value)}
        error={errors.category}
      >
        <option value="">Pilih kategori</option>
        {expenseCategories.map((cat) => {
          const isUsed = usedCategories.includes(cat.name);
          return (
            <option key={cat.id} value={cat.name} disabled={isUsed}>
              {cat.name} {isUsed ? '(sudah ada)' : ''}
            </option>
          );
        })}
      </Select>

      <Select
        label="Bulan"
        value={formData.month}
        onChange={(e) => handleChange('month', e.target.value)}
        error={errors.month}
      >
        <option value="">Pilih bulan</option>
        {MONTH_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>

      <Input
        label="Batas Anggaran"
        type="text"
        inputMode="numeric"
        placeholder="Contoh: 2.000.000"
        value={formData.limitAmount}
        onChange={(e) => handleChange('limitAmount', e.target.value)}
        error={errors.limitAmount}
        leftIcon={<span className="text-xs font-semibold text-slate-400">Rp</span>}
      />
      {formData.limitAmount ? (
        <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">
          Terbaca: {formatIDR(parseAmountNumber(formData.limitAmount) || 0)}
        </p>
      ) : null}

      {isEdit && formData.spentAmount !== undefined && (
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Terpakai saat ini</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">{formatIDR(formData.spentAmount)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Jumlah terpakai diperbarui otomatis dari transaksi pengeluaran.</p>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="submit" loading={submitting} className="w-full sm:w-auto">
          {isEdit ? 'Simpan Perubahan' : 'Buat Anggaran'}
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function Budgets() {
  const { toast } = useToast();

  const [selectedMonth, setSelectedMonth] = useState(MONTH_OPTIONS[0]?.value ?? '2026-09');
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm, month: MONTH_OPTIONS[0]?.value ?? '2026-09' });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingBudget, setDeletingBudget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBudgets = useCallback(async (month) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBudgets(month);
      setBudgets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'Gagal memuat anggaran. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBudgets(selectedMonth);
  }, [selectedMonth, fetchBudgets]);

  // Keep form month in sync when selectedMonth changes and not editing
  useEffect(() => {
    if (!editingBudget && !showFormModal) {
      setFormData((prev) => ({ ...prev, month: selectedMonth }));
    }
  }, [selectedMonth, editingBudget, showFormModal]);

  // Summary
  const totalLimit = budgets.reduce((sum, b) => sum + (Number(b.limitAmount) || 0), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (Number(b.spentAmount) || 0), 0);
  const totalRemaining = totalLimit - totalSpent;
  const totalPercentage = calculatePercentage(totalSpent, totalLimit);

  const openCreateModal = () => {
    setEditingBudget(null);
    setFormData({ category: '', month: selectedMonth, limitAmount: '' });
    setFormErrors({});
    setShowFormModal(true);
  };

  const openEditModal = (budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category || '',
      month: budget.month || selectedMonth,
      limitAmount: formatAmountDots(String(budget.limitAmount ?? '')),
      spentAmount: budget.spentAmount ?? 0,
    });
    setFormErrors({});
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    if (submitting) return;
    setShowFormModal(false);
    setEditingBudget(null);
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

    // Duplicate check: kategori + bulan harus unik
    try {
      // Jika bulan form sama dengan bulan yang sedang ditampilkan, cek dari state
      // Jika berbeda, fetch anggaran bulan tersebut untuk validasi
      let budgetsToCheck = budgets;
      if (formData.month !== selectedMonth) {
        try {
          const otherMonthBudgets = await getBudgets(formData.month);
          budgetsToCheck = Array.isArray(otherMonthBudgets) ? otherMonthBudgets : [];
        } catch {
          budgetsToCheck = [];
        }
      }
      const duplicate = budgetsToCheck.some((b) => {
        if (editingBudget && String(b.id) === String(editingBudget.id)) return false;
        return b.category === formData.category && b.month === formData.month;
      });
      if (duplicate) {
        setFormErrors({ category: 'Anggaran untuk kategori dan bulan ini sudah ada' });
        return;
      }
    } catch {
      // ignore duplicate check failure, proceed to submit
    }

    setSubmitting(true);
    const payload = {
      category: formData.category,
      month: formData.month,
      limitAmount: parseAmountNumber(formData.limitAmount),
      // spentAmount tetap 0 saat create, tidak dikirim saat edit (agar tidak override)
      ...(editingBudget ? {} : { spentAmount: 0 }),
    };

    // Cari icon dari kategori untuk disimpan
    const meta = getCategoryMeta(formData.category);
    if (meta?.icon) payload.icon = meta.icon;

    try {
      if (editingBudget) {
        await updateBudget(editingBudget.id, payload);
        toast.success('Anggaran berhasil diperbarui');
      } else {
        await createBudget(payload);
        toast.success('Anggaran berhasil dibuat');
      }
      setShowFormModal(false);
      setEditingBudget(null);
      // Jika bulan form berbeda dengan selectedMonth, pindah ke bulan tersebut agar terlihat
      if (formData.month !== selectedMonth) {
        setSelectedMonth(formData.month);
      } else {
        await fetchBudgets(selectedMonth);
      }
    } catch (err) {
      toast.error(err?.message || 'Gagal menyimpan anggaran');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (budget) => {
    setDeletingBudget(budget);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setShowDeleteModal(false);
    setDeletingBudget(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingBudget) return;
    setDeleting(true);
    try {
      await deleteBudget(deletingBudget.id);
      toast.success('Anggaran berhasil dihapus');
      setShowDeleteModal(false);
      setDeletingBudget(null);
      await fetchBudgets(selectedMonth);
    } catch (err) {
      toast.error(err?.message || 'Gagal menghapus anggaran');
    } finally {
      setDeleting(false);
    }
  };

  // Used categories for current form month to disable options (only for create, or when editing keep current enabled)
  const usedCategoriesForFormMonth = (() => {
    const targetMonth = formData.month || selectedMonth;
    // Jika form month == selectedMonth, gunakan budgets state
    // Jika tidak, kita tidak tahu, jadi kosongkan
    if (targetMonth !== selectedMonth) return [];
    return budgets
      .filter((b) => (editingBudget ? String(b.id) !== String(editingBudget.id) : true))
      .map((b) => b.category);
  })();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Anggaran"
        description="Atur dan pantau batas pengeluaran per kategori setiap bulan"
        action={
          <div className="flex items-center gap-3">
            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-44"
              aria-label="Pilih bulan"
            >
              {MONTH_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
              Buat Anggaran
            </Button>
          </div>
        }
      />

      {/* Summary Card */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center">
            <PiggyBank className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Ringkasan Bulan Ini</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label ?? selectedMonth}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Anggaran</p>
              <Wallet className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-2">{formatIDR(totalLimit)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{budgets.length} kategori</p>
          </div>

          <div className="rounded-2xl bg-amber-50/60 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wide">Total Terpakai</p>
              <TrendingDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-2">{formatIDR(totalSpent)}</p>
            <div className="mt-2">
              <ProgressBar value={totalPercentage} max={100} variant={getBudgetVariant(totalPercentage)} size="sm" />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">{totalPercentage}% terpakai</p>
            </div>
          </div>

          <div className={`rounded-2xl border p-4 ${totalRemaining < 0 ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20' : 'bg-emerald-50/70 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'}`}>
            <div className="flex items-center justify-between">
              <p className={`text-xs font-medium uppercase tracking-wide ${totalRemaining < 0 ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>Sisa Anggaran</p>
              <TrendingUp className={`w-4 h-4 ${totalRemaining < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
            </div>
            <p className={`text-lg font-bold mt-2 ${totalRemaining < 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}>{formatIDR(totalRemaining)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {totalRemaining < 0 ? 'Melebihi total anggaran' : 'Tersisa untuk bulan ini'}
            </p>
          </div>
        </div>
      </Card>

      {/* Content */}
      {loading ? (
        <PageLoader />
      ) : error ? (
        <Card className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Gagal memuat anggaran</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">{error}</p>
          <Button className="mt-5" onClick={() => fetchBudgets(selectedMonth)}>
            Coba Lagi
          </Button>
        </Card>
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={<PiggyBank className="w-6 h-6" />}
          title="Belum ada anggaran"
          description={`Belum ada anggaran untuk ${MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label ?? selectedMonth}. Buat anggaran untuk mulai memantau pengeluaran per kategori.`}
          action={
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
              Buat Anggaran
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget) => {
            const limit = Number(budget.limitAmount) || 0;
            const spent = Number(budget.spentAmount) || 0;
            const remaining = limit - spent;
            const percentage = calculatePercentage(spent, limit);
            // calculatePercentage clamps to 100, but we need real percentage for warning logic
            const rawPercentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
            const variant = getBudgetVariant(rawPercentage);
            const isOver = rawPercentage >= 100;
            const isWarning = rawPercentage > 80 && rawPercentage < 100;

            return (
              <Card key={budget.id} className="flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${getCategoryMeta(budget.category)?.color ?? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
                      <PiggyBank className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{budget.category}</h4>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <CalendarDays className="w-3 h-3" />
                        {MONTH_OPTIONS.find((m) => m.value === budget.month)?.label ?? budget.month}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(budget)}
                      className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 dark:text-slate-400 transition"
                      aria-label={`Edit ${budget.category}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(budget)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 dark:text-slate-400 transition"
                      aria-label={`Hapus ${budget.category}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 flex-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Batas</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">{formatIDR(limit)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Terpakai</p>
                      <p className={`text-sm font-semibold mt-1 ${isOver ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}>{formatIDR(spent)}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Progress</p>
                      <Badge variant={variant === 'danger' ? 'expense' : variant === 'warning' ? 'warning' : 'default'} className="text-[11px] px-2 py-0.5">
                        {rawPercentage}%
                      </Badge>
                    </div>
                    <ProgressBar value={percentage} max={100} variant={variant} size="md" />
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs font-medium ${variant === 'danger' ? 'text-rose-600 dark:text-rose-400' : variant === 'warning' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        {isOver ? 'Melebihi anggaran' : isWarning ? 'Hampir habis' : `${rawPercentage}% terpakai`}
                      </span>
                      {isWarning && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                      {isOver && <AlertCircle className="w-3.5 h-3.5 text-rose-500" />}
                    </div>
                    {isWarning && !isOver && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg px-2.5 py-1.5">
                        Hampir habis — sisa {formatIDR(remaining)}
                      </p>
                    )}
                    {isOver && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 mt-1.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-lg px-2.5 py-1.5">
                        Melebihi anggaran sebesar {formatIDR(Math.abs(remaining))}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Sisa</p>
                    <p className={`text-sm font-bold mt-0.5 ${remaining < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {formatIDR(remaining)}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500">dari {formatIDR(limit)}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={showFormModal}
        onClose={closeFormModal}
        title={editingBudget ? 'Edit Anggaran' : 'Buat Anggaran'}
        description={editingBudget ? 'Perbarui batas anggaran untuk kategori ini' : 'Tambahkan anggaran baru untuk kategori pengeluaran'}
        size="md"
      >
        <BudgetForm
          formData={formData}
          setFormData={setFormData}
          errors={formErrors}
          onSubmit={handleSubmit}
          submitting={submitting}
          isEdit={!!editingBudget}
          usedCategories={usedCategoriesForFormMonth}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onClose={closeDeleteModal}
        title="Konfirmasi Hapus"
        description="Yakin hapus anggaran ini?"
        size="sm"
      >
        {deletingBudget && (
          <div className="space-y-5">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{deletingBudget.category}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {MONTH_OPTIONS.find((m) => m.value === deletingBudget.month)?.label ?? deletingBudget.month} · {formatIDR(deletingBudget.limitAmount)} · Terpakai {formatIDR(deletingBudget.spentAmount)}
              </p>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Tindakan ini tidak dapat dibatalkan. Anggaran akan dihapus permanen.
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
