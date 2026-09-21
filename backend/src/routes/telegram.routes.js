import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { getTelegramBot, sendTelegramMessage } from '../telegram/bot.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/telegram/settings
router.get('/settings', async (req, res) => {
  try {
    let settings = await prisma.telegramSetting.findUnique({ where: { userId: req.user.id } });
    if (!settings) settings = await prisma.telegramSetting.create({ data: { userId: req.user.id } });
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Get telegram settings error:', error);
    res.status(500).json({ error: 'Gagal memuat pengaturan Telegram' });
  }
});

// POST /api/telegram/connect  { chatId? , username? } -> hubungkan via chatId atau username bot
// Frontend mock mengirim { username } atau { chatId }; backend terima keduanya.
router.post('/connect', async (req, res) => {
  const chatIdRaw = req.body?.chatId ?? req.body?.username ?? req.body?.chat_id;
  const chatId = chatIdRaw != null ? String(chatIdRaw).trim() : '';
  if (!chatId) return res.status(400).json({ error: 'Chat ID / username wajib diisi' });

  try {
    const bot = getTelegramBot();
    // chatId numerik -> verifikasi getChat, username -> cukup simpan (user harus start bot dulu)
    if (/^-?\d+$/.test(chatId)) {
      await bot.getChat(chatId);
    }
    const settings = await prisma.telegramSetting.upsert({
      where: { userId: req.user.id },
      update: { isConnected: true, chatId, lastSentAt: new Date() },
      create: { userId: req.user.id, isConnected: true, chatId },
    });
    res.json({ success: true, data: settings, message: 'Telegram berhasil terhubung' });
  } catch (error) {
    res.status(400).json({ error: 'Gagal terhubung ke Telegram: ' + (error.message || String(error)) });
  }
});

// POST /api/telegram/disconnect
router.post('/disconnect', async (req, res) => {
  try {
    const settings = await prisma.telegramSetting.update({
      where: { userId: req.user.id },
      data: { isConnected: false, chatId: null, lastSentAt: null },
    });
    res.json({ success: true, data: settings, message: 'Telegram berhasil diputus' });
  } catch (error) {
    console.error('Disconnect telegram error:', error);
    res.status(500).json({ error: 'Gagal memutus Telegram' });
  }
});

// POST /api/telegram/test  -> kirim pesan uji ke chatId tersimpan
router.post('/test', async (req, res) => {
  try {
    const settings = await prisma.telegramSetting.findUnique({ where: { userId: req.user.id } });
    if (!settings?.chatId || !settings?.isConnected) {
      return res.status(400).json({ error: 'Telegram belum terhubung. Hubungkan dulu di Pengaturan.' });
    }
    const msg = '🧪 <b>Lowies Personal Finance</b>\n\nJika kamu menerima pesan ini, koneksi Telegram berhasil ✅';
    await sendTelegramMessage(settings.chatId, msg);
    await prisma.telegramSetting.update({ where: { userId: req.user.id }, data: { lastSentAt: new Date() } });
    res.json({ success: true, message: 'Pesan uji berhasil dikirim ke Telegram' });
  } catch (error) {
    console.error('Send test message error:', error);
    res.status(500).json({ error: error.message || 'Gagal mengirim pesan uji' });
  }
});

// POST /api/telegram/webhook  -> dipanggil Telegram saat ada update (setWebhook URL backend)
router.post('/webhook', async (req, res) => {
  try {
    const update = req.body;
    const msg = update?.message;
    if (!msg?.chat?.id) return res.json({ ok: true });
    const chatId = String(msg.chat.id);
    const text = String(msg.text || '').trim().toLowerCase();
    const bot = getTelegramBot();

    if (text.startsWith('/start')) {
      await bot.sendMessage(chatId, `Halo! 👋\n\nID chat kamu: <code>${chatId}</code>\n\nSalin ID ini lalu tempel di Lowies → Pengaturan → Telegram → Hubungkan (mode backend).\n\nPerintah: /help`);
    } else if (text.startsWith('/help')) {
      await bot.sendMessage(chatId, `Lowies Bot — perintah:\n/start — tampilkan ID chat\n/help — bantuan ini\n\nHubungkan: Pengaturan → Telegram → tempel ID chat → Simpan → Kirim Tes.`);
    } else if (text.startsWith('/id') || text === 'id') {
      await bot.sendMessage(chatId, `ID chat: <code>${chatId}</code>`);
    }
    res.json({ ok: true });
  } catch (e) {
    console.error('Telegram webhook error', e);
    res.json({ ok: true });
  }
});

// GET /api/telegram/alerts/budget?month=YYYY-MM
router.get('/alerts/budget', async (req, res) => {
  try {
    const where = { userId: req.user.id };
    if (req.query.month) where.month = String(req.query.month);
    else {
      const now = new Date();
      where.month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    const budgets = await prisma.budget.findMany({ where, include: { category: { select: { name: true } } } });
    const alerts = [];
    for (const b of budgets) {
      const pct = b.limitAmount ? Math.round((Number(b.spentAmount) / Number(b.limitAmount)) * 100) : 0;
      if (pct < 80) continue;
      alerts.push({
        category: b.category?.name || b.categoryId || 'Tanpa kategori',
        spent: b.spentAmount,
        limit: b.limitAmount,
        percentage: pct,
        type: pct >= 100 ? 'danger' : 'warning',
        message: pct >= 100 ? 'Anggaran melebihi batas' : 'Hampir habis — sisa anggaran minimal',
      });
    }
    res.json({ success: true, data: { alerts, totalBudgets: budgets.length } });
  } catch (error) {
    console.error('Get budget alerts error:', error);
    res.status(500).json({ error: 'Gagal memuat alert anggaran' });
  }
});

export default router;
