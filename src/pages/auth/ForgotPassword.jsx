import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function ForgotPassword() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    if (!email.trim()) {
      setError('Email wajib diisi');
      return false;
    }
    if (!isValidEmail(email.trim())) {
      setError('Format email tidak valid');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    // Mock: simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 700));
    setLoading(false);
    setSubmitted(true);
    toast.success('Jika email terdaftar, tautan reset telah dikirim');
  };

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Lupa Kata Sandi</h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          Masukkan email Anda untuk menerima tautan reset kata sandi
        </p>
      </div>

      <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          {submitted ? (
            <div className="flex flex-col items-center text-center py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Periksa email Anda</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Jika email terdaftar, tautan reset telah dikirim
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">
                Periksa kotak masuk atau folder spam Anda.
              </p>
              <div className="mt-6 flex flex-col gap-3 w-full">
                <Button variant="secondary" className="w-full" onClick={() => setSubmitted(false)}>
                  Kirim ulang
                </Button>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Kembali ke halaman masuk
                </Link>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  error={error}
                  leftIcon={<Mail className="w-4 h-4" />}
                  aria-invalid={!!error}
                />

                <Button type="submit" loading={loading} className="w-full mt-1" size="lg">
                  Kirim Tautan Reset
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Kembali ke halaman masuk
                </Link>
              </div>
            </>
          )}
        </Card>
    </div>
  );
}
