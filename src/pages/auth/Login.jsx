import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function Login() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({ email: '', password: '', rememberMe: false });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    const next = {};
    if (!form.email.trim()) {
      next.email = 'Email wajib diisi';
    } else if (!isValidEmail(form.email.trim())) {
      next.email = 'Format email tidak valid';
    }
    if (!form.password) {
      next.password = 'Kata sandi wajib diisi';
    } else if (form.password.length < 6) {
      next.password = 'Kata sandi minimal 6 karakter';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await login(form.email.trim(), form.password);
      if (form.rememberMe) {
        localStorage.setItem('remember_email', form.email.trim());
      } else {
        localStorage.removeItem('remember_email');
      }
      toast.success('Berhasil masuk. Selamat datang kembali!');
      navigate('/', { replace: true });
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Gagal masuk. Periksa kembali data Anda.';
      toast.error(message);
    }
  };

  const handleGoogleLogin = () => {
    toast.info('Fitur Google Login akan tersedia setelah integrasi backend');
  };

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Masuk ke Akun Anda</h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Kelola keuangan pribadi Anda dengan mudah</p>
      </div>

      <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          {/* Mock hint */}
          <div className="mb-5 flex gap-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 px-3.5 py-3">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
              Mode pengembangan: gunakan email apa saja untuk masuk
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
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
              aria-describedby={errors.email ? 'error-email' : undefined}
            />

            <Input
              label="Kata Sandi"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Masukkan kata sandi"
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

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={form.rememberMe}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 focus:ring-2 bg-white dark:bg-slate-900"
                />
                <span className="text-sm text-slate-600 dark:text-slate-300">Ingat saya</span>
              </label>

              <Link
                to="/forgot-password"
                className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
              >
                Lupa kata sandi?
              </Link>
            </div>

            <Button type="submit" loading={loading} className="w-full mt-1" size="lg">
              Masuk
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
            aria-label="Masuk dengan Google"
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
            Masuk dengan Google
          </Button>

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            Belum punya akun?{' '}
            <Link
              to="/register"
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              Daftar sekarang
            </Link>
          </p>
        </Card>
    </div>
  );
}
