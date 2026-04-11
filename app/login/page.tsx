'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { loginUser } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('demo@adpanel.com');
  const [password, setPassword] = useState('demo123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await loginUser(email, password);
      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error || 'Giriş başarısız');
      }
    } catch {
      setError('Bir hata oluştu, lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex">
      {/* Sol panel - Marka */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">AdPanel</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            İşletmenizi büyütmek<br />
            <span className="text-blue-400">hiç bu kadar kolay olmamıştı.</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-10">
            Yapay zeka destekli reklam yönetim panelinizle Meta, Google ve Instagram'da profesyonel kampanyalar oluşturun.
          </p>

          <div className="space-y-4">
            {[
              'Saniyeler içinde AI destekli reklam önerisi',
              'Otomatik bütçe optimizasyonu',
              'Gerçek zamanlı kampanya analizi',
              'Tüm platformları tek panelden yönetin',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <span className="text-slate-300 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-600 text-sm">© 2024 AdPanel. Tüm hakları saklıdır.</p>
      </div>

      {/* Sağ panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobil logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg">AdPanel</span>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Giriş Yap</h2>
              <p className="text-slate-500 mt-1 text-sm">Hesabınıza giriş yapın ve reklamlarınızı yönetin</p>
            </div>

            {/* Demo bilgisi */}
            <div className="mb-6 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs text-blue-700 font-medium">
                Demo mod aktif — herhangi bir e-posta ve en az 6 haneli şifre ile giriş yapabilirsiniz.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="E-posta Adresi"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="isletme@email.com"
                required
              />
              <Input
                label="Şifre"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-slate-300" />
                  <span className="text-slate-600">Beni hatırla</span>
                </label>
                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                  Şifremi unuttum
                </a>
              </div>

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Giriş Yap
                {!loading && <ArrowRight className="w-4 h-4" />}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Hesabınız yok mu?{' '}
              <Link href="/register" className="text-blue-600 font-medium hover:text-blue-700">
                Ücretsiz Kayıt Ol
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
