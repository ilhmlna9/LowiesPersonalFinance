import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { getWhatsAppAdapter, sendWhatsAppMessage } from '../whatsapp/adapter.js';

const router = Router();
const prisma = new PrismaClient();

function normalizePhone(raw) {
  let s = String(raw || '').trim().replace(/[\s\-\(\)]/g, '');
  if (!s) return '';
  if (s.startsWith('+')) s = s.slice(1);
  if (s.startsWith('0')) s = '62' + s.slice(1);
  s = s.replace(/\D/g, '');
  return s;
}
function validatePhone(raw) {
  const p = normalizePhone(raw);
  if (!p) return 'Nomor WhatsApp wajib diisi';
  if (!/^62\d{8,13}$/.test(p)) return 'Format nomor tidak valid. Contoh: 0812xxxxxxx atau 62812xxxxxxx';
  return null;
}

// GET /api/whatsapp/settings
router.get('/settings', async (req, res) => {
  try {
    let settings = await prisma.whatsappSetting.findUnique({ where: { userId: req.user.id } });
    if (!settings) settings = await prisma.whatsappSetting.create({ data: { userId: req.user.id } });
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Get whatsapp settings error:', error);
    res.status(500).json({ error: 'Gagal memuat pengaturan WhatsApp' });
  }
});

// POST /api/whatsapp/connect { phoneNumber }
router.post('/connect', async (req, res) => {
  const raw = req.body?.phoneNumber ?? req.body?.phone ?? req.body?.phone_number ?? '';
  const err = validatePhone(raw);
  if (err) return res.status(400).json({ error: err });
  const phoneNumber = normalizePhone(raw);
  try {
    // opsional verifikasi provider (mock aman)
    // const adapter = getWhatsAppAdapter(); await adapter.verifyNumber(phoneNumber);
    const settings = await prisma.whatsappSetting.upsert({
      where: { userId: req.user.id },
      update: { isConnected: true, phoneNumber, lastSentAt: new Date() },
      create: { userId: req.user.id, isConnected: true, phoneNumber },
    });
    res.json({ success: true, data: settings, message: 'WhatsApp berhasil terhubung' });
  } catch (error) {
    res.status(400).json({ error: 'Gagal terhubung ke WhatsApp: ' + (error.message || String(error)) });
  }
});

// POST /api/whatsapp/disconnect
router.post('/disconnect', async (req, res) => {
  try {
    const settings = await prisma.whatsappSetting.update({
      where: { userId: req.user.id },
      data: { isConnected: false, phoneNumber: null, lastSentAt: null },
    });
    res.json({ success: true, data: settings, message: 'WhatsApp berhasil diputus' });
  } catch (error) {
    console.error('Disconnect whatsapp error:', error);
    res.status(500).json({ error: 'Gagal memutus WhatsApp' });
  }
});

// POST /api/whatsapp/test -> kirim pesan uji
router.post('/test', async (req, res) => {
  try {
    const settings = await prisma.whatsappSetting.findUnique({ where: { userId: req.user.id } });
    if (!settings?.phoneNumber || !settings?.isConnected) {
      return res.status(400).json({ error: 'WhatsApp belum terhubung. Hubungkan dulu di Pengaturan.' });
    }
    const msg = '🧪 Lowies Personal Finance\n\nJika kamu menerima pesan ini, koneksi WhatsApp berhasil ✅';
    await sendWhatsAppMessage(settings.phoneNumber, msg);
    await prisma.whatsappSetting.update({ where: { userId: req.user.id }, data: { lastSentAt: new Date() } });
    res.json({ success: true, message: 'Pesan uji berhasil dikirim ke WhatsApp' });
  } catch (error) {
    console.error('Send whatsapp test error:', error);
    res.status(500).json({ error: error.message || 'Gagal mengirim pesan uji' });
  }
});

// POST /api/whatsapp/webhook (compat untuk uji manual, Meta Cloud webhook asli di-verify terpisah jika dipakai)
router.post('/webhook', async (req, res) => {
  // untuk mock/local: hanya ack
  res.json({ ok: true });
});
router.get('/webhook', async (req, res) => {
  // Meta Cloud verify: hub.verify_token
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;
  if (mode === 'subscribe' && expected && token === expected) return res.send(challenge);
  // jika tidak pakai Meta Cloud, tetap ack
  if (mode === 'subscribe' && !expected) return res.send(challenge || 'ok');
  res.status(403).json({ error: 'Verify token mismatch' });
});

// POST /api/whatsapp/alerts/budget
router.post('/alerts/budget', async (req, res) => {
  try {
    const settings = await prisma.whatsappSetting.findUnique({ where: { userId: req.user.id } });
    if (!settings?.phoneNumber || !settings?.isConnected) return res.status(400).json({ error: 'WhatsApp belum terhubung' });
    const { category, percentage } = req.body || {};
    const text = `⚠️ Lowies: Anggaran ${category || 'kategori'} sudah ${percentage ?? '-'}% terpakai. Cek aplikasi.`;
    await sendWhatsAppMessage(settings.phoneNumber, text);
    res.json({ success: true, message: 'Alert dikirim' });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Gagal kirim alert' });
  }
});

// POST /api/whatsapp/alerts/daily — pengingat harian ke WhatsApp
router.post('/alerts/daily', async (req, res) => {
  try {
    const settings = await prisma.whatsappSetting.findUnique({ where: { userId: req.user.id } });
    if (!settings?.phoneNumber || !settings?.isConnected) return res.status(400).json({ error: 'WhatsApp belum terhubung' });
    const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const text = `⏰ Lowies Pengingat Harian — ${todayStr}\n\nBelum ada transaksi hari ini. Yuk catat pemasukan/pengeluaran sekarang di Lowies Personal Finance agar laporan tetap akurat.`;
    await sendWhatsAppMessage(settings.phoneNumber, text);
    res.json({ success: true, message: 'Pengingat harian terkirim' });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Gagal kirim pengingat harian' });
  }
});

// GET /api/whatsapp/alerts/budget?month=YYYY-MM (mirror Telegram)
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
    console.error('Get whatsapp budget alerts error:', error);
    res.status(500).json({ error: 'Gagal memuat alert anggaran' });
  }
});

export default router;
