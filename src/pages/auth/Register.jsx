import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function Register() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const validate = () => {
    const next = {};
    if (!form.name.trim()) {
      next.name = 'Nama wajib diisi';
    }
    if (!form.email.trim()) {
      next.email = 'Email wajib diisi';
    } else if (!isValidEmail(form.email.trim())) {
      next.email = 'Format email tidak valid';
    }
    if (!form.password) {
      next.password = 'Kata sandi wajib diisi';
    } else if (form.password.length < 8) {
      next.password = 'Kata sandi minimal 8 karakter';
    }
    if (!form.confirmPassword) {
      next.confirmPassword = 'Konfirmasi kata sandi wajib diisi';
    } else if (form.password !== form.confirmPassword) {
      next.confirmPassword = 'Konfirmasi kata sandi tidak cocok';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      toast.success('Akun berhasil dibuat. Selamat datang!');
      navigate('/', { replace: true });
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Gagal mendaftar. Coba lagi.';
      toast.error(message);
    }
  };

  const handleGoogleLogin = () => {
    toast.info('Fitur Google Login akan tersedia setelah integrasi backend');
  };

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Buat Akun Baru</h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Mulai kelola keuangan Anda hari ini</p>
      </div>

      <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <Input
              label="Nama Lengkap"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Masukkan nama lengkap"
              value={form.name}
              onChange={handleChange}
              error={errors.name}
              leftIcon={<User className="w-4 h-4" />}
              aria-invalid={!!errors.name}
            />

            <Input
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="nama@email.com"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              leftIcon={<Mail className="w-4 h-4" />}
              aria-invalid={!!errors.email}
            />

            <Input
              label="Kata Sandi"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Minimal 8 karakter"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              aria-invalid={!!errors.password}
            />

            <Input
              label="Konfirmasi Kata Sandi"
              name="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Ulangi kata sandi"
              value={form.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  aria-label={showConfirm ? 'Sembunyikan konfirmasi kata sandi' : 'Tampilkan konfirmasi kata sandi'}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              aria-invalid={!!errors.confirmPassword}
            />

            <Button type="submit" loading={loading} className="w-full mt-1" size="lg">
              Daftar
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">atau</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            size="lg"
            onClick={handleGoogleLogin}
            aria-label="Daftar dengan Google"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Daftar dengan Google
          </Button>

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            Sudah punya akun?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
              Masuk di sini
            </Link>
          </p>
        </Card>
    </div>
  );
}
