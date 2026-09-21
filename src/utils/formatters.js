/**
 * Format number to Indonesian Rupiah (IDR) currency format.
 * Example: 5000000 -> "Rp 5.000.000"
 * Handles negative numbers cleanly: -150000 -> "-Rp 150.000"
 */
export const formatIDR = (amount) => {
  const numericValue = Number(amount) || 0;
  const absoluteValue = Math.abs(numericValue);
  
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(absoluteValue);

  return numericValue < 0 ? `-${formatted}` : formatted;
};

/**
 * Format date string (YYYY-MM-DD or ISO) to Indonesian localized date format.
 * Example: "2026-09-21" -> "21 Sep 2026"
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const defaultOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options
  };

  return new Intl.DateTimeFormat('id-ID', defaultOptions).format(date);
};

/**
 * Format month key "YYYY-MM" to readable Indonesian month & year.
 * Example: "2026-09" -> "September 2026"
 */
export const formatMonthYear = (monthKey) => {
  if (!monthKey) return '';
  const [year, month] = monthKey.split('-');
  if (!year || !month) return monthKey;

  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);
};

/**
 * Get current year-month string "YYYY-MM"
 */
export const getCurrentMonthKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Calculate percentage safely
 */
export const calculatePercentage = (used, total) => {
  if (!total || total <= 0) return 0;
  const pct = Math.round((used / total) * 100);
  return Math.min(pct, 100);
};

/**
 * Format angka input dengan titik ribuan (id-ID) untuk mencegah salah input.
 * Contoh: "1500000" -> "1.500.000" , "" -> ""
 */
export const formatAmountDots = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * Parse kembali nilai bertitik ke digit murni untuk disimpan.
 * Contoh: "1.500.000" -> "1500000"
 */
export const parseAmountDots = (value) => String(value ?? '').replace(/\./g, '').replace(/\D/g, '');

/**
 * Ambil angka numerik dari value bertitik (untuk validasi/submit)
 */
export const parseAmountNumber = (value) => {
  const digits = parseAmountDots(value);
  return digits ? Number(digits) : NaN;
};
