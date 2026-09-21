import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Moon,
  Sun,
  Palette,
  Bell,
  Send,
  LogOut,
  Shield,
  Smartphone,
  AlertCircle,
  Check,
  Settings2,
  Monitor,
  Coins,
  Unplug,
  MessageCircle,
} from 'lucide-react';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { whatsappService } from '../services/whatsappService.js';
import { useNotifications } from '../context/NotificationContext.jsx';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getInitials(name) {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function Toggle({ enabled, onChange, label, description, disabled = false }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</p>
        {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        disabled={disabled}
        onClick={() => !disabled && onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed ${
          enabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
        }`}
      >
        <span
          className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

const TABS = [
  { id: 'profil', label: 'Profil', icon: User },
  { id: 'tampilan', label: 'Tampilan', icon: Palette },
  { id: 'notifikasi', label: 'Notifikasi & WhatsApp', icon: Bell },
  { id: 'preferensi', label: 'Preferensi', icon: Settings2 },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export default function Settings() {
  const navigate = useNavigate();
  const { user, updateProfile, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('profil');

  // Profil form state
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);

  // Notifikasi state (local, synced with user)
  const [dailyReminder, setDailyReminder] = useState(user?.dailyReminder ?? true);
  const [budgetAlerts, setBudgetAlerts] = useState(user?.budgetAlerts ?? true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(user?.notificationsEnabled ?? true);
  const [togglingNotif, setTogglingNotif] = useState(false);

  // Logout modal
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // WhatsApp state
  const [whatsappPhone, setWhatsappPhone] = useState(user?.whatsappPhone || user?.whatsappNumber || '');
  const [whatsappConnected, setWhatsappConnected] = useState(!!user?.whatsappConnected);
  const [waInput, setWaInput] = useState('');
  const [waError, setWaError] = useState('');
  const [waLoading, setWaLoading] = useState(false);
  const [showWaModal, setShowWaModal] = useState(false);
  const [showWaDisconnectModal, setShowWaDisconnectModal] = useState(false);
  const { addNotification, requestBrowserPermission } = useNotifications();

  useEffect(() => {
    if (activeTab === 'notifikasi') {
      whatsappService.getStatus().then(s => {
        const phone = s.whatsappPhone || s.phoneNumber || '';
        setWhatsappConnected(!!(s.whatsappConnected ?? s.isConnected));
        setWhatsappPhone(phone);
        if (phone) setWaInput(phone);
      }).catch(() => {});
    }
  }, [activeTab]);

  useEffect(() => {
    if (user) {
      setFormData({ name: user.name || '', email: user.email || '' });
      setDailyReminder(user.dailyReminder ?? true);
      setBudgetAlerts(user.budgetAlerts ?? true);
      setNotificationsEnabled(user.notificationsEnabled ?? true);
    }
  }, [user]);

  const validateProfile = () => {
    const errs = {};
    if (!formData.name || !String(formData.name).trim()) {
      errs.name = 'Nama wajib diisi';
    } else if (String(formData.name).trim().length < 2) {
      errs.name = 'Nama minimal 2 karakter';
    }
    if (!formData.email || !String(formData.email).trim()) {
      errs.email = 'Email wajib diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(formData.email).trim())) {
      errs.email = 'Format email tidak valid';
    }
    return errs;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const errs = validateProfile();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }
    setFormErrors({});
    setSavingProfile(true);
    try {
      await updateProfile({
        name: String(formData.name).trim(),
        email: String(formData.email).trim(),
      });
      toast.success('Profil berhasil diperbarui');
    } catch (err) {
      toast.error(err?.message || 'Gagal memperbarui profil');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleNotifToggle = async (key, value) => {
    // Optimistic update
    if (key === 'dailyReminder') setDailyReminder(value);
    if (key === 'budgetAlerts') setBudgetAlerts(value);
    if (key === 'notificationsEnabled') setNotificationsEnabled(value);
    setTogglingNotif(true);
    try {
      await updateProfile({ [key]: value });
      toast.success('Preferensi notifikasi diperbarui');
    } catch (err) {
      // Revert on failure
      if (key === 'dailyReminder') setDailyReminder((prev) => !prev);
      if (key === 'budgetAlerts') setBudgetAlerts((prev) => !prev);
      if (key === 'notificationsEnabled') setNotificationsEnabled((prev) => !prev);
      toast.error(err?.message || 'Gagal memperbarui notifikasi');
    } finally {
      setTogglingNotif(false);
    }
  };

  const handleWhatsappConnect = () => {
    setWaError('');
    setWaInput(whatsappPhone || '');
    setShowWaModal(true);
  };
  const handleWhatsappSubmit = async (e) => {
    e.preventDefault();
    const err = whatsappService.validatePhone(waInput);
    if (err) { setWaError(err); return; }
    setWaLoading(true);
    try {
      const res = await whatsappService.connect({ phoneNumber: waInput });
      const phone = res.whatsappPhone || res.phoneNumber || whatsappService.normalizePhone(waInput);
      setWhatsappConnected(true);
      setWhatsappPhone(phone);
      await updateProfile({ whatsappConnected: true, whatsappPhone: phone, whatsappNumber: phone });
      toast.success('WhatsApp berhasil terhubung');
      addNotification({ title: 'WhatsApp terhubung', message: `Nomor ${phone} berhasil dihubungkan.`, type: 'success' });
      setShowWaModal(false);
    } catch (err) {
      setWaError(err.message || 'Gagal menghubungkan WhatsApp');
    } finally { setWaLoading(false); }
  };
  const handleWhatsappDisconnect = async () => {
    setWaLoading(true);
    try {
      await whatsappService.disconnect();
      setWhatsappConnected(false);
      setWhatsappPhone('');
      setWaInput('');
      await updateProfile({ whatsappConnected: false, whatsappPhone: null, whatsappNumber: null });
      toast.success('Koneksi WhatsApp diputus');
      addNotification({ title: 'WhatsApp diputus', message: 'Notifikasi WhatsApp tidak akan dikirim lagi.', type: 'info' });
      setShowWaDisconnectModal(false);
    } catch (err) { toast.error(err.message || 'Gagal memutus WhatsApp'); }
    finally { setWaLoading(false); }
  };
  const handleWhatsappTest = async () => {
    setWaLoading(true);
    try { await whatsappService.sendTest(); toast.success('Pesan uji terkirim ke WhatsApp'); addNotification({ title: 'Tes WhatsApp', message: 'Pesan uji berhasil dikirim.', type: 'success' }); }
    catch (err) { toast.error(err.message || 'Gagal kirim pesan uji'); }
    finally { setWaLoading(false); }
  };

  const handleLogout = () => {
    logout();
    setShowLogoutModal(false);
    toast.success('Berhasil keluar');
    navigate('/login');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan"
        description="Kelola profil, tampilan, notifikasi, dan preferensi akun Anda"
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border whitespace-nowrap transition ${
                isActive
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Profil */}
      {activeTab === 'profil' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-500/20">
              {getInitials(user?.name)}
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-4">{user?.name || 'Pengguna'}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 justify-center">
              <Mail className="w-3.5 h-3.5" />
              {user?.email || '-'}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Badge variant="info">{user?.currency || 'IDR'}</Badge>
              {(user?.whatsappConnected ?? whatsappConnected) ? (
                <Badge variant="income">WhatsApp terhubung</Badge>
              ) : (
                <Badge variant="default">WhatsApp belum terhubung</Badge>
              )}
            </div>
            <div className="w-full mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">ID Pengguna</span>
                <span className="text-xs font-mono text-slate-700 dark:text-slate-300">{user?.id || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Bergabung</span>
                <span className="text-xs text-slate-700 dark:text-slate-300">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</span>
              </div>
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center">
                <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Informasi Profil</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Perbarui nama dan email Anda</p>
              </div>
            </div>
            <form onSubmit={handleProfileSubmit} className="space-y-4" noValidate>
              <Input
                label="Nama Lengkap"
                placeholder="Masukkan nama lengkap"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                error={formErrors.name}
                leftIcon={<User className="w-4 h-4" />}
              />
              <Input
                label="Email"
                type="email"
                placeholder="nama@email.com"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                error={formErrors.email}
                leftIcon={<Mail className="w-4 h-4" />}
              />
              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" loading={savingProfile} leftIcon={!savingProfile ? <Check className="w-4 h-4" /> : undefined}>
                  Simpan Perubahan
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setFormData({ name: user?.name || '', email: user?.email || '' });
                    setFormErrors({});
                  }}
                  disabled={savingProfile}
                >
                  Batal
                </Button>
              </div>
            </form>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
              Perubahan akan tersimpan lokal saat mode mock aktif dan disinkronkan setelah backend terhubung.
            </p>
          </Card>
        </div>
      )}

      {/* Tampilan */}
      {activeTab === 'tampilan' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center">
                {isDark ? <Moon className="w-4 h-4 text-amber-600 dark:text-amber-400" /> : <Sun className="w-4 h-4 text-amber-600" />}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Tema Tampilan</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Pilih tema terang atau gelap</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}>
                  {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{isDark ? 'Mode Gelap' : 'Mode Terang'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Tema saat ini: {theme}</p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={toggleTheme}
                leftIcon={isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              >
                {isDark ? 'Ganti ke Terang' : 'Ganti ke Gelap'}
              </Button>
            </div>

            <div className="mt-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 p-3.5 flex gap-3">
              <Monitor className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                Tema mengikuti preferensi sistem saat pertama kali dibuka. Perubahan Anda akan disimpan di perangkat ini.
              </p>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center">
                <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Mata Uang</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Format tampilan nominal</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Rupiah Indonesia</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Semua nominal ditampilkan dalam format IDR (Rp)</p>
                </div>
                <Badge variant="default" className="text-sm px-3 py-1">IDR</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-slate-500 dark:text-slate-400">Contoh</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100 mt-1">Rp 5.000.000</p>
                </div>
                <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-slate-500 dark:text-slate-400">Format</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100 mt-1">id-ID</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Notifikasi & WhatsApp */}
      {activeTab === 'notifikasi' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center">
                <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifikasi</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Atur pengingat dan peringatan anggaran</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <Toggle
                enabled={notificationsEnabled}
                onChange={(v) => handleNotifToggle('notificationsEnabled', v)}
                label="Notifikasi Umum"
                description="Aktifkan untuk menerima notifikasi di aplikasi"
                disabled={togglingNotif}
              />
              <Toggle
                enabled={dailyReminder}
                onChange={(v) => handleNotifToggle('dailyReminder', v)}
                label="Pengingat Harian"
                description="Pengingat untuk mencatat transaksi setiap hari"
                disabled={togglingNotif || !notificationsEnabled}
              />
              <Toggle
                enabled={budgetAlerts}
                onChange={(v) => handleNotifToggle('budgetAlerts', v)}
                label="Peringatan Anggaran"
                description="Notifikasi saat pengeluaran mendekati batas anggaran"
                disabled={togglingNotif || !notificationsEnabled}
              />
            </div>

            {!notificationsEnabled && (
              <div className="mt-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-3 flex gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">Notifikasi umum nonaktif — pengingat dan peringatan tidak akan dikirim.</p>
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">WhatsApp</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Hubungkan nomor untuk notifikasi via WhatsApp</p>
              </div>
            </div>

            <div className={`rounded-2xl border p-4 ${whatsappConnected ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${whatsappConnected ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {whatsappConnected ? 'Terhubung' : 'Belum terhubung'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {whatsappConnected && whatsappPhone ? whatsappPhone : 'Hubungkan nomor WhatsApp untuk ringkasan harian & alert anggaran'}
                    </p>
                  </div>
                </div>
                {whatsappConnected ? <Badge variant="income">Aktif</Badge> : <Badge variant="default">Tidak aktif</Badge>}
              </div>

              {whatsappConnected ? (
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <Button variant="secondary" size="sm" leftIcon={<MessageCircle className="w-4 h-4" />} onClick={handleWhatsappTest} loading={waLoading}>Kirim Tes</Button>
                  <Button variant="secondary" size="sm" leftIcon={<Unplug className="w-4 h-4" />} onClick={() => setShowWaDisconnectModal(true)} className="!text-rose-600 dark:!text-rose-400">Putus</Button>
                  <Button className="col-span-2" size="sm" leftIcon={<Smartphone className="w-4 h-4" />} onClick={handleWhatsappConnect}>Ganti Nomor</Button>
                </div>
              ) : (
                <Button className="w-full mt-4" leftIcon={<Smartphone className="w-4 h-4" />} onClick={handleWhatsappConnect}>Hubungkan WhatsApp</Button>
              )}

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center leading-relaxed">
                {whatsappConnected ? 'Alert anggaran & pengingat harian akan dikirim ke WhatsApp (mock di mode pengembangan, API nyata saat backend terhubung).' : 'Nomor aman dan dapat diputus kapan saja.'}
              </p>
            </div>

            <div className="mt-4 space-y-2">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 p-3 flex gap-2">
                <Shield className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Nomor disimpan lokal saat <span className="font-medium">Mock Mode</span> aktif dan akan disinkron ke <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px]">/api/whatsapp</code> setelah backend siap.
                </p>
              </div>
              <div className="rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 p-3 flex gap-2">
                <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-indigo-900 dark:text-indigo-200">Notifikasi browser</p>
                  <p className="text-xs text-indigo-700/70 dark:text-indigo-300/70 mt-1">Aktifkan agar pengingat muncul walau tab tidak fokus.</p>
                  <Button variant="secondary" size="sm" className="mt-2" onClick={async () => { const r = await requestBrowserPermission(); if (r === 'granted') toast.success('Notifikasi browser diaktifkan'); else if (r === 'denied') toast.error('Izin notifikasi ditolak di browser'); else if (r === 'unsupported') toast.error('Browser tidak mendukung notifikasi'); else toast.info(`Status izin: ${r}`); }}>Minta Izin Notifikasi</Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Preferensi */}
      {activeTab === 'preferensi' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                <Settings2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Preferensi Akun</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Kelola sesi dan keamanan akun</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-500" />
                  Keamanan
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Keluar dari akun akan menghapus sesi lokal dan mengharuskan login ulang. Pastikan Anda mengingat email dan password.
                </p>
              </div>

              <Button
                variant="danger"
                className="w-full"
                leftIcon={<LogOut className="w-4 h-4" />}
                onClick={() => setShowLogoutModal(true)}
              >
                Keluar dari Akun
              </Button>

              <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                Masuk sebagai <span className="font-medium text-slate-700 dark:text-slate-300">{user?.email}</span>
              </p>
            </div>
          </Card>

          <Card className="bg-slate-50/60 dark:bg-slate-800/40">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Tentang Lowies Personal Finance</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              Aplikasi pencatat keuangan pribadi dengan dukungan multi-akun, anggaran bulanan, analitik visual, dan ekspor laporan. Dibangun untuk membantu Anda mengelola pemasukan dan pengeluaran dengan lebih terstruktur.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="default">v0.0.0</Badge>
              <Badge variant="info">IDR</Badge>
              <Badge variant="default">Mock Mode {import.meta.env.VITE_USE_MOCK === 'true' ? 'Aktif' : 'Nonaktif'}</Badge>
            </div>
          </Card>
        </div>
      )}

      {/* Logout Confirmation */}
      <Modal
        open={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Konfirmasi Keluar"
        description="Yakin ingin keluar dari akun?"
        size="sm"
      >
        <div className="space-y-5">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user?.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{user?.email}</p>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Anda akan dialihkan ke halaman login dan perlu masuk kembali untuk melanjutkan.</p>
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowLogoutModal(false)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleLogout} leftIcon={<LogOut className="w-4 h-4" />}>
              Keluar
            </Button>
          </div>
        </div>
      </Modal>

      {/* WhatsApp Connect Modal */}
      <Modal open={showWaModal} onClose={() => !waLoading && setShowWaModal(false)} title="Hubungkan WhatsApp" description="Masukkan nomor WhatsApp aktif" size="sm">
        <form onSubmit={handleWhatsappSubmit} className="space-y-4" noValidate>
          <Input label="Nomor WhatsApp" placeholder="contoh: 081234567890" value={waInput} onChange={e => { setWaInput(e.target.value); if (waError) setWaError(''); }} error={waError} leftIcon={<Smartphone className="w-4 h-4" />} />
          <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">Format: 08xxxxxxxxxx atau 628xxxxxxxxxx. Akan dinormalisasi ke 62.</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowWaModal(false)} disabled={waLoading}>Batal</Button>
            <Button type="submit" loading={waLoading} leftIcon={!waLoading ? <Check className="w-4 h-4" /> : undefined}>Simpan & Hubungkan</Button>
          </div>
        </form>
      </Modal>

      {/* WhatsApp Disconnect Confirm */}
      <Modal open={showWaDisconnectModal} onClose={() => !waLoading && setShowWaDisconnectModal(false)} title="Putus Koneksi WhatsApp" description={`Yakin putus koneksi ${whatsappPhone || ''}?`} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">Notifikasi anggaran & pengingat harian tidak akan dikirim lagi ke WhatsApp.</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowWaDisconnectModal(false)} disabled={waLoading}>Batal</Button>
            <Button variant="danger" loading={waLoading} onClick={handleWhatsappDisconnect} leftIcon={!waLoading ? <Unplug className="w-4 h-4" /> : undefined}>Putus Koneksi</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
