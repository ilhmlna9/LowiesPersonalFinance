import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ============ GET BUDGETS ============
router.get('/', async (req, res) => {
  try {
    const { month } = req.query;

    const where = { userId: req.user.id };

    if (month) {
      where.month = month;
    }

    const budgets = await prisma.budget.findMany({
      where,
      include: {
        category: {
          select: { name: true, color: true, icon: true, type: true },
        },
      },
      orderBy: { month: 'desc', sortOrder: 'asc' },
    });

    // Calculate summary
    const totalLimit = budgets.reduce((sum, b) => sum + (b.limitAmount || 0), 0);
    const totalSpent = budgets.reduce((sum, b) => sum + (b.spentAmount || 0), 0);
    const totalRemaining = totalLimit - totalSpent;

    res.json({
      success: true,
      data: {
        budgets,
        summary: {
          totalLimit,
          totalSpent,
          totalRemaining,
          usedPercentage: totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0,
        },
      },
    });
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ error: 'Gagal memuat anggaran' });
  }
});

// ============ CREATE BUDGET ============
router.post('/', async (req, res) => {
  try {
    const { categoryId, month, limitAmount } = req.body;

    // Validation
    if (!categoryId) {
      return res.status(400).json({ error: 'Kategori wajib dipilih' });
    }

    if (!month) {
      return res.status(400).json({ error: 'Bulan wajib dipilih' });
    }

    if (!limitAmount || Number(limitAmount) <= 0) {
      return res.status(400).json({ error: 'Limit anggaran harus lebih dari 0' });
    }

    // Validate month format YYYY-MM
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      return res.status(400).json({ error: 'Format bulan tidak valid (harus YYYY-MM)' });
    }

    // Check if budget already exists for this category and month
    const existing = await prisma.budget.findFirst({
      where: {
        userId: req.user.id,
        categoryId,
        month,
      },
    });

    if (existing) {
      return res.status(409).json({ error: 'Anggaran untuk kategori dan bulan ini sudah ada' });
    }

    // Validate category type (budgets are typically for expenses)
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return res.status(404).json({ error: 'Kategori tidak ditemukan' });
    }

    // Create budget
    const budget = await prisma.budget.create({
      data: {
        userId: req.user.id,
        categoryId,
        month,
        limitAmount: Number(limitAmount),
        spentAmount: 0,
        periodStart: new Date(`${month}-01`),
        periodEnd: new Date(`${month}-${getDaysInMonth(month)}`),
      },
      include: {
        category: {
          select: { name: true, color: true, icon: true, type: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: budget,
      message: 'Anggaran berhasil dibuat',
    });
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({ error: 'Gagal membuat anggaran' });
  }
});

// ============ UPDATE BUDGET ============
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { limitAmount } = req.body;

    // Check if budget exists
    const existing = await prisma.budget.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Anggaran tidak ditemukan' });
    }

    // Validate limit amount
    if (limitAmount !== undefined && (Number(limitAmount) <= 0 || isNaN(Number(limitAmount)))) {
      return res.status(400).json({ error: 'Limit anggaran harus lebih dari 0' });
    }

    // Update budget
    const budget = await prisma.budget.update({
      where: { id },
      data: limitAmount !== undefined ? { limitAmount: Number(limitAmount) } : {},
      include: {
        category: {
          select: { name: true, color: true, icon: true, type: true },
        },
      },
    });

    res.json({
      success: true,
      data: budget,
      message: 'Anggaran berhasil diperbarui',
    });
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({ error: 'Gagal memperbarui anggaran' });
  }
});

// ============ DELETE BUDGET ============
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if budget exists
    const existing = await prisma.budget.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Anggaran tidak ditemukan' });
    }

    await prisma.budget.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Anggaran berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ error: 'Gagal menghapus anggaran' });
  }
});

// ============ HELPER: GET DAYS IN MONTH ============
function getDaysInMonth(monthYear) {
  const [year, month] = monthYear.split('-').map(Number);
  return new Date(year, month, 0).getDate();
}

// ============ GET BUDGET SUMMARY ============
router.get('/summary', async (req, res) => {
  try {
    const { month } = req.query;

    const where = { userId: req.user.id };

    if (month) {
      where.month = month;
    }

    const budgets = await prisma.budget.findMany({
      where,
      include: { category: { select: { name: true, type: true } } },
    });

    const totalLimit = budgets.reduce((sum, b) => sum + (b.limitAmount || 0), 0);
    const totalSpent = budgets.reduce((sum, b) => sum + (b.spentAmount || 0), 0);
    const totalRemaining = totalLimit - totalSpent;

    // Per-category breakdown
    const categoryBreakdown = budgets.map((b) => ({
      category: b.category?.name || 'General',
      limit: b.limitAmount,
      spent: b.spentAmount,
      remaining: b.limitAmount - b.spentAmount,
      variant: b.spentAmount >= b.limitAmount * 0.8 ? 'warning' : 'success',
    }));

    res.json({
      success: true,
      data: {
        totalLimit,
        totalSpent,
        totalRemaining,
        usedPercentage: totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0,
        categoryBreakdown,
      },
    });
  } catch (error) {
    console.error('Get budget summary error:', error);
    res.status(500).json({ error: 'Gagal memuat ringkasan anggaran' });
  }
});

export default router;