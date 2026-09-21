import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ============ GET ANALYTICS DATA ============
router.get('/', async (req, res) => {
  try {
    const { month } = req.query;

    const where = {};
    if (month) {
      where.month = month;
    }

    // Get monthly summary
    const monthlySummaries = await prisma.monthlySummary.findMany({
      where: { userId: req.user.id },
      orderBy: { month: 'desc' },
      take: 12, // Last 12 months
    });

    // If no data, return empty structure
    if (monthlySummaries.length === 0) {
      return res.json({
        success: true,
        data: {
          summary: null,
          monthlyTrends: [],
          categoryExpenses: [],
        },
      });
    }

    // Get summary for requested month
    const currentMonthData = monthlySummaries.find((m) => m.month === month) || monthlySummaries[monthlySummaries.length - 1];

    // Get category expenses for current month
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: req.user.id,
        ...(month && { date: { gte: new Date(`${month}-01`), lte: new Date(`${month}-31`) } }),
      },
      include: { category: { select: { name: true, color: true, type: true } } },
    });

    // Calculate category expenses
    const categoryExpenses = [];
    const categoryMap = {};

    transactions.forEach((tx) => {
      const catName = tx.category.name;
      if (!categoryMap[catName]) {
        categoryMap[catName] = { name: catName, value: 0, color: tx.category.color, type: tx.category.type };
      }
      if (tx.type === 'expense') {
        categoryMap[catName].value += tx.amount;
      }
    });

    categoryExpenses.push(...Object.values(categoryMap));

    // Get monthly trends (last 6 months)
    const monthlyTrends = [];
    const trendMap = {};

    monthlySummaries.forEach((ms) => {
      const monthKey = ms.month;
      if (!trendMap[monthKey]) {
        trendMap[monthKey] = { month: monthKey, income: 0, expense: 0 };
      }
      if (ms.totalIncome) trendMap[monthKey].income += ms.totalIncome;
      if (ms.totalExpense) trendMap[monthKey].expense += ms.totalExpense;
    });

    // Sort by month descending and take last 6
    const sortedTrends = Object.values(trendMap)
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 6);

    sortedTrends.forEach((t) => {
      monthlyTrends.push({
        month: t.month,
        income: t.income,
        expense: t.expense,
      });
    });

    // If no trends found but we have transactions, derive from transactions
    if (monthlyTrends.length === 0 && transactions.length > 0) {
      // Simple derivation from recent transactions
      const recentMonths = [...new Set(transactions.map((tx) => tx.date.slice(0, 7)))];
      recentMonths.slice(0, 6).forEach((m) => {
        const monthTx = transactions.filter((tx) => tx.date.slice(0, 7) === m);
        monthlyTrends.push({
          month: m,
          income: recentMonths.reduce((sum, month) => sum + (transactions.filter((tx) => tx.date.slice(0, 7) === month && tx.type === 'income').reduce((s, tx) => s + tx.amount, 0) || 0), 0),
          expense: recentMonths.reduce((sum, month) => sum + (transactions.filter((tx) => tx.date.slice(0, 7) === month && tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0) || 0), 0),
        });
      });
    }

    // Get current month summary
    const summary = {
      totalIncome: currentMonthData?.totalIncome ?? 0,
      totalExpenses: currentMonthData?.totalExpense ?? 0,
      remainingBudget: currentMonthData?.netBalance ?? 0,
    };

    res.json({
      success: true,
      data: {
        summary,
        monthlyTrends,
        categoryExpenses,
      },
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Gagal memuat data analitik' });
  }
});

// ============ GET BUDGET ANALYTICS ============
router.get('/budget', async (req, res) => {
  try {
    const { month } = req.query;

    const where = { userId: req.user.id };
    if (month) {
      where.month = month;
    }

    const budgets = await prisma.budget.findMany({
      where,
      include: { category: { select: { name: true, color: true } } },
    });

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
    console.error('Get budget analytics error:', error);
    res.status(500).json({ error: 'Gagal memuat analisis anggaran' });
  }
});

// ============ UPDATE MONTHLY SUMMARY ============
router.post('/summary', async (req, res) => {
  try {
    const { month, totalIncome, totalExpense, netBalance } = req.body;

    if (!month) {
      return res.status(400).json({ error: 'Bulan wajib diisi' });
    }

    // Calculate transaction count for this month
    const transactionCount = await prisma.transaction.count({
      where: {
        userId: req.user.id,
        date: {
          gte: new Date(`${month}-01`),
          lte: new Date(`${month}-${getDaysInMonth(monthYear => new Date(monthYear.split('-')[0], monthYear.split('-')[1], 1).getDate()}`)},
        },
      },
    });

    const summary = await prisma.monthlySummary.upsert({
      where: {
        userId_month: {
          userId: req.user.id,
          month,
        },
      },
      update: {
        totalIncome: totalIncome !== undefined ? Number(totalIncome) : undefined,
        totalExpense: totalExpense !== undefined ? Number(totalExpense) : undefined,
        netBalance: netBalance !== undefined ? Number(netBalance) : undefined,
        transactionCount: transactionCount,
        updatedAt: new Date(),
      },
      create: {
        userId: req.user.id,
        month,
        totalIncome: Number(totalIncome) || 0,
        totalExpense: Number(totalExpense) || 0,
        netBalance: Number(netBalance) || 0,
        transactionCount,
      },
    });

    res.json({
      success: true,
      data: summary,
      message: 'Ringkasan bulan berhasil diperbarui',
    });
  } catch (error) {
    console.error('Update monthly summary error:', error);
    res.status(500).json({ error: 'Gagal memperbarui ringkasan' });
  }
});

// ============ HELPER: GET DAYS IN MONTH ============
function getDaysInMonth(monthYear) {
  const [year, month] = monthYear.split('-').map(Number);
  return new Date(year, month, 0).getDate();
}

export default router;