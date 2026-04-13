'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, ArrowRight, Building2, Clock3, ShieldCheck, Sparkles } from 'lucide-react';
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
            <p className="text-slate-500 mt-1 text-sm">Kendi reklamını kendin yönet, bütçeni daha akıllı kullan</p>
          </div>

          <div className="mb-5 p-3 rounded-xl border border-emerald-200 bg-emerald-50 flex items-start gap-2.5">
            <Clock3 className="w-4 h-4 text-emerald-700 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-emerald-800 leading-relaxed">
              Kurulum kısa sürer. Kayıttan sonra hedefini girip dakikalar içinde ilk kampanya planını çıkarabilirsin.
            </p>
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

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { icon: ShieldCheck, title: 'Güven', text: 'Karar süreci şeffaf ve anlaşılır' },
              { icon: Sparkles, title: 'Hız', text: 'Karmaşık panel yok, net adımlar var' },
              { icon: Clock3, title: 'Tasarruf', text: 'Deneme-yanılmayı azaltır' },
            ].map((item) => (
              <div key={item.title} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                <item.icon className="w-4 h-4 text-blue-600" />
                <p className="text-xs font-semibold text-slate-800 mt-2">{item.title}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>

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

          <div className="mt-6 space-y-2.5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Hakkımızda</p>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Advara, işletmelerin reklam kararlarını dışarıya tamamen bağımlı kalmadan alabilmesi için geliştirilen
                AI destekli bir karar ve yönetim panelidir.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Ne İşe Yarar?</p>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Hedefini ve bütçeni analiz eder, hangi platforma neden bütçe ayrıldığını şeffaf biçimde açıklar,
                uygulamayı adım adım yönlendirir. Böylece deneme-yanılma ve gereksiz reklam harcaması azalır.
              </p>
            </div>
          </div>

          <p className="mt-5 text-center text-sm text-slate-500">
            Zaten hesabınız var mı?{' '}
            <Link href="/login" className="text-blue-600 font-medium hover:text-blue-700">
              Giriş Yap
            </Link>
          </p>

          <p className="mt-3 text-center text-xs text-slate-400">
            Reklam bütçeni başkasına teslim etmeden, kendi stratejini kendin yönet.
          </p>
        </div>
      </div>
    </div>
  );
}
