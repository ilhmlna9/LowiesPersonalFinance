import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import csvParse from 'csv-parse/sync';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';

const router = Router();
const prisma = new PrismaClient();

// ============ CONFIG ============
const REPORTS_DIR = path.join(process.cwd(), 'reports');
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// ============ HELPER: Generate CSV ============
function generateCSV(transactions) {
  const headers = ['Tanggal', 'Deskripsi', 'Kategori', 'Akun', 'Tipe', 'Jumlah'];
  const rows = [headers];

  transactions.forEach((tx) => {
    const date = tx.date ? new Date(tx.date).toLocaleDateString('id-ID') : '';
    const description = tx.description || '-';
    const category = tx.category?.name || '-';
    const account = tx.account || '-';
    const type = tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
    const amount = tx.amount.toString(); // Already in IDR format

    rows.push([date, description, category, account, type, amount]);
  });

  return rows.map((row) => row.map((field) => {
    // Escape CSV fields
    const fieldStr = String(field || '');
    if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
      return `"${fieldStr.replace(/"/g, '""')}"`;
    }
    return fieldStr;
  })).join('\n');
}

// ============ EXPORT CSV ============
router.get('/export/csv', async (req, res) => {
  try {
    const { month, dateFrom, dateTo, type } = req.query;

    // Build where clause
    const where = { userId: req.user.id };

    if (month) {
      where.date = {
        gte: new Date(`${month}-01`),
        lte: new Date(`${month}-${getDaysInMonth(month)}`),
      };
    }

    if (dateFrom) {
      where.date = where.date
        ? { ...where.date, gte: new Date(dateFrom) }
        : { gte: new Date(dateFrom) };
    }

    if (dateTo) {
      where.date = where.date
        ? { ...where.date, lte: new Date(dateTo) }
        : { lte: new Date(dateTo) };
    }

    if (type && type !== 'all') {
      where.type = type;
    }

    // Fetch transactions
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: {
          select: { name: true, color: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Generate CSV
    const csvContent = generateCSV(transactions);
    const filename = `laporan-${req.user.id}-${new Date().toISOString().slice(0, 10)}.csv`;
    const filePath = path.join(REPORTS_DIR, filename);

    // Write file
    fs.writeFileSync(filePath, csvContent);

    // Set headers for download
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: 'Gagal mengunduh laporan' });
      }
      // Clean up file after download
      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }, 300000); // 5 minutes
    });
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ error: 'Gagal mengekspor CSV' });
  }
});

// ============ EXPORT PDF (Placeholder) ============
router.get('/export/pdf', async (req, res) => {
  try {
    const { month, dateFrom, dateTo, type } = req.query;

    // Build where clause (same as CSV)
    const where = { userId: req.user.id };

    if (month) {
      where.date = {
        gte: new Date(`${month}-01`),
        lte: new Date(`${month}-${getDaysInMonth(month)}`),
      };
    }

    if (dateFrom) {
      where.date = where.date
        ? { ...where.date, gte: new Date(dateFrom) }
        : { gte: new Date(dateFrom) };
    }

    if (dateTo) {
      where.date = where.date
        ? { ...where.date, lte: new Date(dateTo) }
        : { lte: new Date(dateTo) };
    }

    if (type && type !== 'all') {
      where.type = type;
    }

    // Fetch transactions
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: {
          select: { name: true, color: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    // TODO: Implement PDF generation with PDFKit or similar
    // For now, return success with info message
    res.json({
      success: true,
      data: {
        message: 'Export PDF akan tersedia setelah integrasi library PDF.',
        transactionCount: transactions.length,
      },
      message: 'Export PDF akan tersedia setelah integrasi backend',
    });
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ error: 'Gagal mengekspor PDF' });
  }
});

// ============ GET REPORT LOGS ============
router.get('/logs', async (req, res) => {
  try {
    const logs = await prisma.reportExport.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error('Get report logs error:', error);
    res.status(500).json({ error: 'Gagal memuat log ekspor' });
  }
});

// ============ HELPER: GET DAYS IN MONTH ============
function getDaysInMonth(monthYear) {
  const [year, month] = monthYear.split('-').map(Number);
  return new Date(year, month, 0).getDate();
}

export default router;