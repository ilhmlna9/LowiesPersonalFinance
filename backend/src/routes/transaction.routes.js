import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ============ GET TRANSACTIONS ============
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      category,
      dateFrom,
      dateTo,
      sort = 'date_desc',
    } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const offset = (pageNum - 1) * limitNum;

    // Build where clause
    const where = {};

    if (type && type !== 'all') {
      where.type = type;
    }

    if (category && category !== 'all') {
      where.categoryId = category;
    }

    if (search) {
      where.description = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (dateFrom) {
      where.date = { ...where.date, gte: new Date(dateFrom) };
    }

    if (dateTo) {
      where.date = { ...where.date, lte: new Date(dateTo) };
    }

    // Apply sort
    const orderBy = {};
    switch (sort) {
      case 'date_asc':
        orderBy.date = 'asc';
        break;
      case 'amount_desc':
        orderBy.amount = 'desc';
        break;
      case 'amount_asc':
        orderBy.amount = 'asc';
        break;
      case 'date_desc':
      default:
        orderBy.date = 'desc';
    }

    // Fetch transactions with pagination
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          category: {
            select: { name: true, color: true, icon: true, type: true },
          },
        },
        orderBy,
        skip: offset,
        take: limitNum,
      }),
      prisma.transaction.count({ where }),
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        transactions,
        total,
        page: pageNum,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Gagal memuat transaksi' });
  }
});

// ============ GET SINGLE TRANSACTION ============
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        category: {
          select: { name: true, color: true, icon: true, type: true },
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Gagal memuat transaksi' });
  }
});

// ============ CREATE TRANSACTION ============
router.post('/', async (req, res) => {
  try {
    const {
      type,
      amount,
      categoryId,
      account,
      description,
      date,
    } = req.body;

    // Validation
    if (!type || !['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'Tipe transaksi invalid' });
    }

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Jumlah harus lebih dari 0' });
    }

    if (!categoryId) {
      return res.status(400).json({ error: 'Kategori wajib dipilih' });
    }

    // Validate category belongs to user and has correct type
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return res.status(404).json({ error: 'Kategori tidak ditemukan' });
    }

    if (category.type !== type) {
      return res.status(400).json({
        error: `Kategori "${category.name}" tipe ${category.type}, tidak cocok dengan ${type}`,
      });
    }

    // Parse date
    const transactionDate = date ? new Date(date) : new Date();
    if (isNaN(transactionDate.getTime())) {
      return res.status(400).json({ error: 'Tanggal tidak valid' });
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        type,
        amount: Number(amount),
        categoryId,
        account: account || '',
        description: description || '',
        date: transactionDate,
        userId: req.user.id, // Set by auth middleware
      },
      include: {
        category: {
          select: { name: true, color: true, icon: true, type: true },
        },
      },
    });

    // Update budget spent amount
    if (category.type === 'expense') {
      await updateBudgetSpent(categoryId, transactionDate, Number(amount));
    }

    res.status(201).json({
      success: true,
      data: transaction,
      message: 'Transaksi berhasil ditambahkan',
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Gagal membuat transaksi' });
  }
});

// ============ UPDATE TRANSACTION ============
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      type,
      amount,
      categoryId,
      account,
      description,
      date,
    } = req.body;

    // Check if transaction exists
    const existing = await prisma.transaction.findUnique({
      where: { id },
      include { category: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    }

    // Validate type if provided
    if (type && !['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'Tipe transaksi invalid' });
    }

    // Validate amount if provided
    if (amount !== undefined && (Number(amount) <= 0 || isNaN(Number(amount)))) {
      return res.status(400).json({ error: 'Jumlah harus lebih dari 0' });
    }

    // Validate category if provided
    let categoryToUse = existing.categoryId;
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        return res.status(404).json({ error: 'Kategori tidak ditemukan' });
      }

      if (type && category.type !== type) {
        return res.status(400).json({
          error: `Kategori "${category.name}" tipe ${category.type}, tidak cocok dengan ${type}`,
        });
      }

      categoryToUse = categoryId;
    }

    // Parse date if provided
    let transactionDate = existing.date;
    if (date !== undefined) {
      transactionDate = date ? new Date(date) : new Date();
      if (isNaN(transactionDate.getTime())) {
        return res.status(400).json({ error: 'Tanggal tidak valid' });
      }
    }

    // Calculate amount difference for budget update
    const amountDiff = existing.amount - (amount || 0);

    // Update transaction
    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        type: type || existing.type,
        amount: amount || existing.amount,
        categoryId: categoryToUse,
        account: account !== undefined ? account : existing.account,
        description: description !== undefined ? description : existing.description,
        date: transactionDate,
      },
      include: {
        category: {
          select: { name: true, color: true, icon: true, type: true },
        },
      },
    });

    // Update budget spent amounts (handle both old and new category)
    if (existing.category.type === 'expense') {
      await updateBudgetSpent(existing.categoryId, existing.date, -amountDiff);
    }
    if (categoryToUse !== existing.category.type && categoryToUse.type === 'expense') {
      await updateBudgetSpent(categoryToUse.id, transactionDate, Number(amount || 0));
    }

    res.json({
      success: true,
      data: transaction,
      message: 'Transaksi berhasil diperbarui',
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Gagal memperbarui transaksi' });
  }
});

// ============ DELETE TRANSACTION ============
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if transaction exists
    const existing = await prisma.transaction.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    }

    // Delete transaction
    await prisma.transaction.delete({
      where: { id },
    });

    // Update budget spent amount (reverse the addition)
    if (existing.category.type === 'expense') {
      await updateBudgetSpent(existing.categoryId, existing.date, -existing.amount);
    }

    res.json({
      success: true,
      message: 'Transaksi berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Gagal menghapus transaksi' });
  }
});

// ============ HELPER: UPDATE BUDGET SPENT ============
async function updateBudgetSpent(categoryId, date, amountChange) {
  try {
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    // Find or create budget for this category and month
    let budget = await prisma.budget.findFirst({
      where: {
        userId: req.user?.id,
        categoryId,
        month,
      },
    });

    if (!budget) {
      // Create new budget entry
      budget = await prisma.budget.create({
        data: {
          userId: req.user?.id,
          categoryId,
          month,
          limitAmount: 0,
          spentAmount: 0,
          periodStart: new Date(`${month}-01`),
          periodEnd: new Date(`${month}-31`),
        },
      });
    }

    // Update spent amount
    const newSpent = Math.max(0, (budget.spentAmount || 0) + amountChange);
    await prisma.budget.update({
      where: { id: budget.id },
      data: { spentAmount: newSpent },
    });
  } catch (error) {
    console.error('Update budget spent error:', error);
  }
}

// ============ GET CATEGORIES ============
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Gagal memuat kategori' });
  }
});

// ============ GET ACCOUNTS ============
router.get('/accounts', async (req, res) => {
  try {
    const accounts = await prisma.account.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Gagal memuat akun' });
  }
});

export default router;