'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, ArrowRight, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        router.push('/login?message=Kayıt başarılı, giriş yapabilirsiniz');
      } else {
        setError(result.error || 'Kayıt başarısız');
      }
    } catch {
      setError('Bir hata oluştu, lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl">Advara</span>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Hesap Oluştur</h2>
            <p className="text-slate-500 mt-1 text-sm">14 gün ücretsiz deneyin, kart gerekmez</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              label="Ad Soyad"
              type="text"
              value={form.name}
              onChange={update('name')}
              placeholder="Ahmet Yılmaz"
              required
            />
            <Input
              label="İşletme Adı"
              type="text"
              value={form.company}
              onChange={update('company')}
              placeholder="Şirket Adı A.Ş."
              prefix={<Building2 className="w-4 h-4" />}
            />
            <Input
              label="E-posta Adresi"
              type="email"
              value={form.email}
              onChange={update('email')}
              placeholder="isletme@email.com"
              required
            />
            <Input
              label="Şifre"
              type="password"
              value={form.password}
              onChange={update('password')}
              placeholder="En az 6 karakter"
              required
              hint="Büyük harf, küçük harf ve rakam içersin"
            />

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <p className="text-xs text-slate-400">
              Devam ederek{' '}
              <a href="#" className="text-blue-600 hover:underline">Kullanım Koşulları</a>
              {' '}ve{' '}
              <a href="#" className="text-blue-600 hover:underline">Gizlilik Politikası</a>
              'nı kabul etmiş olursunuz.
            </p>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Ücretsiz Başla
              {!loading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>

          {/* Plan kartları */}
          <div className="mt-6 grid grid-cols-3 gap-2">
            {[
              { name: 'Ücretsiz', price: '₺0', campaigns: '1 kampanya' },
              { name: 'Starter', price: '₺499', campaigns: '5 kampanya', highlight: true },
              { name: 'Pro', price: '₺1799', campaigns: 'Sınırsız' },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`p-2.5 rounded-xl text-center border ${
                  plan.highlight
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-slate-100 bg-slate-50'
                }`}
              >
                <p className={`text-xs font-bold ${plan.highlight ? 'text-blue-700' : 'text-slate-700'}`}>
                  {plan.name}
                </p>
                <p className={`text-sm font-bold mt-0.5 ${plan.highlight ? 'text-blue-600' : 'text-slate-900'}`}>
                  {plan.price}
                </p>
                <p className="text-xs text-slate-500">{plan.campaigns}</p>
              </div>
            ))}
          </div>

          <p className="mt-5 text-center text-sm text-slate-500">
            Zaten hesabınız var mı?{' '}
            <Link href="/login" className="text-blue-600 font-medium hover:text-blue-700">
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
