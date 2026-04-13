'use client';

import { useEffect, useState } from 'react';
import {
  User, Bell, CreditCard, Shield, Link2, Check,
  Building2, Mail, Phone, Globe, Lock, ChevronRight,
  Zap, AlertCircle
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import clsx from 'clsx';
import { useSession } from 'next-auth/react';

const TABS = [
  { id: 'profile', label: 'Profil', icon: User },
  { id: 'integrations', label: 'Entegrasyonlar', icon: Link2 },
  { id: 'notifications', label: 'Bildirimler', icon: Bell },
  { id: 'billing', label: 'Faturalama', icon: CreditCard },
  { id: 'security', label: 'Güvenlik', icon: Shield },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'stripe' | 'iyzico' | 'paytr'>('bank_transfer');
  const [bankModal, setBankModal] = useState<null | {
    referenceCode: string;
    planName: string;
    amountWithVat: number;
    iban: string;
    bankName: string;
    accountName: string;
    description: string;
  }>(null);

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    website: '',
  });

  const [notifications, setNotifications] = useState({
    campaignReports: true,
    budgetAlerts: true,
    aiSuggestions: true,
    weeklyDigest: false,
    marketingEmails: false,
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch('/api/user/profile');
        const data = await response.json();
        if (!response.ok) {
          return;
        }

        setProfile((prev) => ({
          ...prev,
          name: data.user?.name || '',
          email: data.user?.email || '',
          company: data.user?.businessName || '',
          phone: data.user?.phone || '',
        }));
      } catch (error) {
        console.error('Profile load error:', error);
      }
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    try {
      setSaveError('');
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Profil kaydedilemedi');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Profil kaydedilemedi';
      setSaveError(message);
    }
  };

  const startIyzicoPayment = async (planType: 'starter' | 'pro') => {
    try {
      setPaymentError('');
      setProcessingPlan(planType);

      if (!(session?.user as any)?.id) {
        throw new Error('Ödeme için önce giriş yapmalısınız');
      }

      const response = await fetch('/api/payment/iyzico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Ödeme başlatılamadı');
      }

      if (data.paymentPageUrl) {
        window.location.href = data.paymentPageUrl;
        return;
      }

      if (data.checkoutFormContent) {
        const newWindow = window.open('', '_self');
        if (newWindow) {
          newWindow.document.open();
          newWindow.document.write(data.checkoutFormContent);
          newWindow.document.close();
          return;
        }
      }

      throw new Error('Iyzico ödeme sayfası açılamadı');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ödeme başlatılamadı';
      setPaymentError(message);
    } finally {
      setProcessingPlan(null);
    }
  };

  const startStripePayment = async (planType: 'starter' | 'pro') => {
    try {
      setPaymentError('');
      setProcessingPlan(planType);

      const userId = (session?.user as any)?.id;
      if (!userId) throw new Error('Ödeme için önce giriş yapmalısınız');

      const response = await fetch('/api/payment/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType, userId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Stripe ödeme başlatılamadı');

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ödeme başlatılamadı';
      setPaymentError(message);
    } finally {
      setProcessingPlan(null);
    }
  };

  const startPaytrPayment = async (planType: 'starter' | 'pro') => {
    try {
      setPaymentError('');
      setProcessingPlan(planType);

      const response = await fetch('/api/payment/paytr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'PayTR ödeme başlatılamadı');

      if (data.iframeUrl) {
        window.location.href = data.iframeUrl;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ödeme başlatılamadı';
      setPaymentError(message);
    } finally {
      setProcessingPlan(null);
    }
  };

  const startBankTransferPayment = async (planType: 'starter' | 'pro') => {
    try {
      setPaymentError('');
      setProcessingPlan(planType);
      const response = await fetch('/api/payment/bank-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'İşlem başlatılamadı');
      setBankModal({
        referenceCode: data.referenceCode,
        planName: data.planName,
        amountWithVat: data.amountWithVat,
        iban: data.bankDetails.iban,
        bankName: data.bankDetails.bankName,
        accountName: data.bankDetails.accountName,
        description: data.bankDetails.description,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'İşlem başlatılamadı';
      setPaymentError(message);
    } finally {
      setProcessingPlan(null);
    }
  };

  const handlePlanPayment = (planType: 'starter' | 'pro') => {
    if (paymentMethod === 'bank_transfer') {
      startBankTransferPayment(planType);
    } else if (paymentMethod === 'paytr') {
      startPaytrPayment(planType);
    } else if (paymentMethod === 'stripe') {
      startStripePayment(planType);
    } else {
      startIyzicoPayment(planType);
    }
  };

  const INTEGRATIONS = [
    {
      id: 'meta',
      name: 'Meta Business',
      desc: 'Facebook ve Instagram reklamlarını yönetin',
      icon: '🔵',
      status: 'pending',
      badge: 'Bağlantı Bekliyor',
    },
    {
      id: 'google',
      name: 'Google Ads',
      desc: 'Google arama ve görüntülü reklam ağı',
      icon: '🔴',
      status: 'pending',
      badge: 'Bağlantı Bekliyor',
    },
    {
      id: 'openai',
      name: 'OpenAI',
      desc: 'AI reklam önerileri için GPT-4 entegrasyonu',
      icon: '🤖',
      status: 'mock',
      badge: 'Mock Mod',
    },
    {
      id: 'n8n',
      name: 'n8n Otomasyon',
      desc: 'İş akışı otomasyonu ve API entegrasyonu',
      icon: '⚡',
      status: 'mock',
      badge: 'Mock Mod',
    },
    {
      id: 'iyzico',
      name: 'Iyzico',
      desc: 'Ödeme işlemleri ve fatura yönetimi',
      icon: '💳',
      status: 'connected',
      badge: 'Aktif',
    },
  ];

  return (
    <div>
      <Header
        title="Ayarlar"
        subtitle="Hesap ve uygulama ayarlarınızı yönetin"
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Yan Menü */}
          <aside className="w-full lg:w-52 flex-shrink-0">
            <nav className="flex lg:block gap-2 lg:space-y-1 overflow-x-auto pb-1 lg:pb-0">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={clsx(
                    'flex lg:w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left whitespace-nowrap',
                    activeTab === id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </button>
              ))}
            </nav>
          </aside>

          {/* İçerik */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Profil */}
            {activeTab === 'profile' && (
              <>
                <Card>
                  <CardHeader title="Kişisel Bilgiler" subtitle="Hesap bilgilerinizi güncelleyin" icon={<User className="w-4 h-4" />} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    <Input
                      label="Ad Soyad"
                      value={profile.name}
                      onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                      prefix={<User className="w-4 h-4" />}
                    />
                    <Input
                      label="E-posta"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))}
                      prefix={<Mail className="w-4 h-4" />}
                    />
                    <Input
                      label="İşletme Adı"
                      value={profile.company}
                      onChange={(e) => setProfile(p => ({ ...p, company: e.target.value }))}
                      prefix={<Building2 className="w-4 h-4" />}
                    />
                    <Input
                      label="Telefon"
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))}
                      prefix={<Phone className="w-4 h-4" />}
                    />
                    <Input
                      label="Web Sitesi"
                      type="url"
                      value={profile.website}
                      onChange={(e) => setProfile(p => ({ ...p, website: e.target.value }))}
                      prefix={<Globe className="w-4 h-4" />}
                    />
                  </div>
                </Card>

                {/* Plan */}
                <Card>
                  <CardHeader title="Mevcut Plan" icon={<Zap className="w-4 h-4" />} />
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-blue-900">Starter Plan</p>
                        <Badge variant="blue">Aktif</Badge>
                      </div>
                      <p className="text-sm text-blue-700">Aylık ₺499 · 5 kampanya · 3 kullanıldı</p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => startIyzicoPayment('pro')}
                      disabled={processingPlan !== null}
                    >
                      {processingPlan === 'pro' ? 'Yönlendiriliyor...' : 'Plan Yükselt'}
                    </Button>
                  </div>
                </Card>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSave}
                    icon={saved ? <Check className="w-4 h-4" /> : undefined}
                    variant={saved ? 'success' : 'primary'}
                  >
                    {saved ? 'Kaydedildi!' : 'Değişiklikleri Kaydet'}
                  </Button>
                </div>
                {saveError && <p className="text-sm text-red-600 text-right">{saveError}</p>}
              </>
            )}

            {/* Entegrasyonlar */}
            {activeTab === 'integrations' && (
              <Card>
                <CardHeader
                  title="API Entegrasyonları"
                  subtitle="Reklam platformlarını ve servisleri bağlayın"
                  icon={<Link2 className="w-4 h-4" />}
                />
                <div className="mt-2 p-3.5 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-2.5 mb-5">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Demo Mod Aktif</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Şu an mock veriyle çalışıyorsunuz. Gerçek entegrasyonlar yakında eklenecek. n8n webhook bağlantısı için .env.local dosyasını güncelleyin.
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {INTEGRATIONS.map((integration) => (
                    <div
                      key={integration.id}
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{integration.icon}</span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{integration.name}</p>
                          <p className="text-xs text-slate-500">{integration.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            integration.status === 'connected' ? 'green' :
                            integration.status === 'mock' ? 'blue' :
                            integration.status === 'coming' ? 'slate' : 'yellow'
                          }
                        >
                          {integration.badge}
                        </Badge>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={integration.status === 'coming'}
                        >
                          {integration.status === 'connected' ? 'Bağlantıyı Kes' :
                           integration.status === 'coming' ? 'Yakında' : 'Bağlan'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Bildirimler */}
            {activeTab === 'notifications' && (
              <Card>
                <CardHeader title="Bildirim Ayarları" subtitle="Hangi bildirimleri almak istediğinizi seçin" icon={<Bell className="w-4 h-4" />} />
                <div className="space-y-4 mt-2">
                  {[
                    { key: 'campaignReports', label: 'Kampanya Raporları', desc: 'Günlük ve haftalık performans raporları' },
                    { key: 'budgetAlerts', label: 'Bütçe Uyarıları', desc: 'Bütçeniz %80 dolduğunda bildirim al' },
                    { key: 'aiSuggestions', label: 'AI Önerileri', desc: 'Yeni optimizasyon önerileri geldiğinde' },
                    { key: 'weeklyDigest', label: 'Haftalık Özet', desc: 'Pazartesi günü haftalık özet e-postası' },
                    { key: 'marketingEmails', label: 'Pazarlama E-postaları', desc: 'Ürün güncellemeleri ve haberler' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{label}</p>
                        <p className="text-xs text-slate-500">{desc}</p>
                      </div>
                      <button
                        onClick={() => setNotifications(prev => ({ ...prev, [key]: !prev[key as keyof typeof notifications] }))}
                        className={clsx(
                          'relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0',
                          notifications[key as keyof typeof notifications] ? 'bg-blue-600' : 'bg-slate-300'
                        )}
                        style={{ width: '40px', height: '22px' }}
                      >
                        <span
                          className={clsx(
                            'absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform',
                          )}
                          style={{
                            width: '18px',
                            height: '18px',
                            left: notifications[key as keyof typeof notifications] ? '19px' : '2px',
                            transition: 'left 0.2s',
                          }}
                        />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex justify-end">
                  <Button onClick={handleSave} variant={saved ? 'success' : 'primary'}>
                    {saved ? 'Kaydedildi!' : 'Kaydet'}
                  </Button>
                </div>
              </Card>
            )}

            {/* Faturalama */}
            {activeTab === 'billing' && (
              <Card>
                <CardHeader title="Faturalama" subtitle="Plan ve ödeme yönetimi" icon={<CreditCard className="w-4 h-4" />} />
                <div className="space-y-4 mt-2">

                  {/* Ödeme Yöntemi Seçimi */}
                  <div>
                    <p className="text-sm font-semibold text-slate-800 mb-2">Ödeme Yöntemi</p>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      {[
                        { id: 'bank_transfer', label: 'EFT / Havale', desc: 'Garanti, Ziraat, İş Bankası...', icon: '🏦' },
                        { id: 'paytr', label: 'PayTR', desc: 'Türkiye Kart Ödeme', icon: '🧾' },
                        { id: 'iyzico', label: 'Iyzico', desc: 'Türk Bankası Kartı & 3D Secure', icon: '🇹🇷' },
                        { id: 'stripe', label: 'Stripe', desc: 'Uluslararası Kart', icon: '💳' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setPaymentMethod(m.id as 'bank_transfer' | 'stripe' | 'iyzico' | 'paytr')}
                          className={clsx(
                            'flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all',
                            paymentMethod === m.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300'
                          )}
                        >
                          <span className="text-2xl">{m.icon}</span>
                          <div>
                            <p className={clsx('font-semibold text-sm', paymentMethod === m.id ? 'text-blue-700' : 'text-slate-800')}>{m.label}</p>
                            <p className="text-xs text-slate-500">{m.desc}</p>
                          </div>
                          {paymentMethod === m.id && <Check className="w-4 h-4 text-blue-600 ml-auto flex-shrink-0" />}
                        </button>
                      ))}
                    </div>
                    {paymentMethod === 'bank_transfer' && (
                      <div className="mt-2 p-3 bg-green-50 rounded-xl border border-green-100 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-green-700">Plan seçtikten sonra IBAN ve açıklama kodu gösterilir. Ödeme yapınca admin onaylar, planınız aktif olur.</p>
                      </div>
                    )}
                  </div>

                  {/* Plan */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { name: 'Ücretsiz', price: '₺0', period: '/ay', campaigns: '1 kampanya', active: false },
                      { name: 'Starter', price: '₺499', period: '/ay', campaigns: '5 kampanya', active: true },
                      { name: 'Pro', price: '₺1799', period: '/ay', campaigns: 'Sınırsız', active: false },
                    ].map((plan) => (
                      <div
                        key={plan.name}
                        className={clsx(
                          'p-4 rounded-xl border-2 text-center transition-all',
                          plan.active ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                        )}
                      >
                        <p className={clsx('font-bold', plan.active ? 'text-blue-700' : 'text-slate-800')}>{plan.name}</p>
                        <p className={clsx('text-2xl font-bold mt-1', plan.active ? 'text-blue-600' : 'text-slate-900')}>
                          {plan.price}
                          <span className="text-sm font-normal text-slate-500">{plan.period}</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{plan.campaigns}</p>
                        {plan.active ? (
                          <Badge variant="blue" size="sm">Mevcut Plan</Badge>
                        ) : plan.name === 'Ücretsiz' ? (
                          <Button variant="secondary" size="sm" className="mt-2 w-full" disabled>Mevcut Seviye</Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="mt-2 w-full"
                            onClick={() => handlePlanPayment(plan.name === 'Pro' ? 'pro' : 'starter')}
                            disabled={processingPlan !== null}
                          >
                            {processingPlan === (plan.name === 'Pro' ? 'pro' : 'starter')
                              ? (paymentMethod === 'bank_transfer' ? 'Oluşturuluyor...' : 'Yönlendiriliyor...')
                              : 'Seç'}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  {paymentError && (
                    <div className="p-3 rounded-xl border border-red-200 bg-red-50">
                      <p className="text-xs text-red-700">{paymentError}</p>
                    </div>
                  )}

                  {/* Fatura */}
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-slate-800 mb-3">Son Faturalar</p>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-xs text-slate-500">Ödeme geçmişiniz burada görünecek.</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* EFT / Havale Modal */}
            {bankModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setBankModal(null)}>
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-slate-900">Banka Havalesi Bilgileri</h2>
                    <button onClick={() => setBankModal(null)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
                  </div>

                  <div className="p-3.5 bg-green-50 rounded-xl border border-green-100 mb-4">
                    <p className="text-xs text-green-700 font-medium">Plan: {bankModal.planName}</p>
                    <p className="text-xl font-bold text-green-700 mt-1">₺{bankModal.amountWithVat.toFixed(2)} <span className="text-xs font-normal text-green-600">(KDV dahil)</span></p>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { label: 'Banka', value: bankModal.bankName },
                      { label: 'Hesap Sahibi', value: bankModal.accountName },
                      { label: 'IBAN', value: bankModal.iban },
                      { label: 'Açıklama (Zorunlu)', value: bankModal.description },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-xs text-slate-500 w-28 flex-shrink-0">{label}</span>
                        <span className="text-sm font-semibold text-slate-800 text-right break-all">{value}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(value)}
                          className="ml-2 text-blue-500 hover:text-blue-700 text-xs flex-shrink-0"
                          title="Kopyala"
                        >Kopyala</button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-xs text-amber-700">Havaleyi yaptıktan sonra açıklama kodunu mutlaka yazın. Ödemeniz onaylandıktan sonra planınız otomatik aktif olur (genellikle 1-2 saat içinde).</p>
                  </div>

                  <Button className="w-full mt-4" onClick={() => setBankModal(null)}>Tamam, Anladım</Button>
                </div>
              </div>
            )}

            {/* Güvenlik */}
            {activeTab === 'security' && (
              <Card>
                <CardHeader title="Güvenlik" subtitle="Hesap güvenliği ve şifre ayarları" icon={<Shield className="w-4 h-4" />} />
                <div className="space-y-5 mt-2">
                  <Input label="Mevcut Şifre" type="password" placeholder="••••••••" prefix={<Lock className="w-4 h-4" />} />
                  <Input label="Yeni Şifre" type="password" placeholder="En az 8 karakter" prefix={<Lock className="w-4 h-4" />} />
                  <Input label="Yeni Şifre (Tekrar)" type="password" placeholder="Şifrenizi doğrulayın" prefix={<Lock className="w-4 h-4" />} />
                  <Button>Şifreyi Güncelle</Button>

                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-sm font-semibold text-slate-800 mb-3">İki Faktörlü Doğrulama</p>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-slate-800">2FA Kimlik Doğrulama</p>
                        <p className="text-xs text-slate-500">Hesabınızı ekstra güvenlik katmanıyla koruyun</p>
                      </div>
                      <Badge variant="slate">Pasif</Badge>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
