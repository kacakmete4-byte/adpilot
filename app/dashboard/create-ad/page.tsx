'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, Globe, MessageCircle, Instagram,
  DollarSign, MapPin, Target, Check, ChevronRight, ChevronLeft,
  Megaphone, Zap
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AdFormData, Platform } from '@/lib/types';
import { SECTOR_OPTIONS, AD_GOAL_OPTIONS, PLATFORM_OPTIONS } from '@/lib/mockData';
import { getAdSuggestion } from '@/lib/api';
import clsx from 'clsx';

const STEPS = [
  { id: 1, label: 'İşletme Bilgileri', icon: Building2 },
  { id: 2, label: 'Kampanya Hedefi', icon: Target },
  { id: 3, label: 'Platform Seçimi', icon: Megaphone },
  { id: 4, label: 'Onay & Oluştur', icon: Zap },
];

const EMPTY_FORM: AdFormData = {
  businessName: '',
  sector: '',
  website: '',
  whatsapp: '',
  instagram: '',
  dailyBudget: 200,
  targetLocation: 'Türkiye',
  adGoal: '',
  selectedPlatforms: ['meta'],
};

export default function CreateAdPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<AdFormData>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof AdFormData, string>>>({});

  const update = (field: keyof AdFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const togglePlatform = (platform: Platform) => {
    setForm((prev) => ({
      ...prev,
      selectedPlatforms: prev.selectedPlatforms.includes(platform)
        ? prev.selectedPlatforms.filter((p) => p !== platform)
        : [...prev.selectedPlatforms, platform],
    }));
  };

  const validateStep = () => {
    const newErrors: Partial<Record<keyof AdFormData, string>> = {};
    if (step === 1) {
      if (!form.businessName.trim()) newErrors.businessName = 'İşletme adı zorunludur';
      if (!form.sector) newErrors.sector = 'Sektör seçimi zorunludur';
    }
    if (step === 2) {
      if (!form.adGoal) newErrors.adGoal = 'Reklam amacı seçimi zorunludur';
      if (!form.dailyBudget || form.dailyBudget < 50)
        newErrors.dailyBudget = 'Minimum günlük bütçe 50₺ olmalıdır';
    }
    if (step === 3) {
      if (form.selectedPlatforms.length === 0)
        newErrors.selectedPlatforms = 'En az bir platform seçmelisiniz' as never;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, 4));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitError('');
    setLoading(true);
    
    try {
      console.log('Form submit başladı, OpenAI analizi başlatılıyor...', form);
      
      // OpenAI ile analiz yap
      const data = await getAdSuggestion(form);
      const saveResponse = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData: form, suggestion: data }),
      });

      const saveData = await saveResponse.json();
      if (!saveResponse.ok) {
        throw new Error(saveData?.error || 'Kampanya kaydedilemedi');
      }
      
      console.log('OpenAI analizi tamamlandı:', data);

      sessionStorage.setItem('adFormData', JSON.stringify(form));
      sessionStorage.setItem('n8nWebhookResponse', JSON.stringify(data));
      sessionStorage.setItem('campaignId', String(saveData?.campaignId || ''));

      console.log('Veriler sessionStorage\'a kaydedildi, results sayfasına yönlendiriliyor...');
      router.push('/dashboard/results');
    } catch (err: unknown) {
      console.error('handleSubmit hatası:', err);
      let message = 'Bilinmeyen bir hata oluştu.';
      
      if (err instanceof TypeError) {
        if (err.message.includes('fetch')) {
          message = `OpenAI API ulaşılamıyor: ${err.message}`;
        } else {
          message = err.message;
        }
      } else if (err instanceof Error) {
        message = err.message;
      }
      
      setSubmitError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header
        title="Reklam Oluştur"
        subtitle="Birkaç adımda AI destekli reklam kampanyanızı oluşturun"
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Adım Göstergesi */}
        <div className="flex items-center mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isDone = step > s.id;
            const isActive = step === s.id;
            return (
              <div key={s.id} className="flex items-center">
                <div className="flex items-center gap-2.5">
                  <div
                    className={clsx(
                      'w-9 h-9 rounded-xl flex items-center justify-center transition-all',
                      isDone && 'bg-emerald-500 text-white',
                      isActive && 'bg-blue-600 text-white shadow-lg shadow-blue-200',
                      !isDone && !isActive && 'bg-slate-100 text-slate-400'
                    )}
                  >
                    {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <div className="hidden sm:block">
                    <p className={clsx('text-xs font-medium', isActive ? 'text-blue-600' : isDone ? 'text-emerald-600' : 'text-slate-400')}>
                      Adım {s.id}
                    </p>
                    <p className={clsx('text-sm font-semibold', isActive ? 'text-slate-900' : isDone ? 'text-slate-700' : 'text-slate-400')}>
                      {s.label}
                    </p>
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={clsx('h-px flex-1 mx-4', step > s.id ? 'bg-emerald-300' : 'bg-slate-200')} />
                )}
              </div>
            );
          })}
        </div>

        <div className="max-w-2xl mx-auto">

          {/* Adım 1: İşletme Bilgileri */}
          {step === 1 && (
            <Card className="animate-fade-in-up">
              <h2 className="text-lg font-bold text-slate-900 mb-1">İşletme Bilgileri</h2>
              <p className="text-sm text-slate-500 mb-6">AI'ın size özel reklam önerileri üretmesi için işletmenizi tanıyalım.</p>

              <div className="space-y-5">
                <Input
                  label="İşletme Adı"
                  value={form.businessName}
                  onChange={update('businessName')}
                  placeholder="Yılmaz Tekstil A.Ş."
                  required
                  error={errors.businessName}
                  prefix={<Building2 className="w-4 h-4" />}
                />
                <Select
                  label="Sektör / İş Türü"
                  value={form.sector}
                  onChange={update('sector')}
                  options={SECTOR_OPTIONS}
                  placeholder="Sektörünüzü seçin"
                  required
                  error={errors.sector}
                />
                <Input
                  label="Web Sitesi"
                  type="url"
                  value={form.website}
                  onChange={update('website')}
                  placeholder="https://isletmeniz.com"
                  prefix={<Globe className="w-4 h-4" />}
                  hint="Varsa web sitenizi girin (zorunlu değil)"
                />
                <Input
                  label="WhatsApp Numarası"
                  type="tel"
                  value={form.whatsapp}
                  onChange={update('whatsapp')}
                  placeholder="+90 555 123 4567"
                  prefix={<MessageCircle className="w-4 h-4" />}
                  hint="WhatsApp Business numaranız"
                />
                <Input
                  label="Instagram Kullanıcı Adı"
                  value={form.instagram}
                  onChange={update('instagram')}
                  placeholder="@isletmeniz"
                  prefix={<Instagram className="w-4 h-4" />}
                />
              </div>
            </Card>
          )}

          {/* Adım 2: Kampanya Hedefi */}
          {step === 2 && (
            <Card className="animate-fade-in-up">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Kampanya Hedefi</h2>
              <p className="text-sm text-slate-500 mb-6">Reklam amacınızı ve bütçenizi belirleyin.</p>

              <div className="space-y-6">
                {/* Reklam Amacı */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Reklam Amacı <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {AD_GOAL_OPTIONS.map((goal) => {
                      const isSelected = form.adGoal === goal.value;
                      return (
                        <button
                          key={goal.value}
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({ ...prev, adGoal: goal.value as AdFormData['adGoal'] }));
                            setErrors((prev) => ({ ...prev, adGoal: '' }));
                          }}
                          className={clsx(
                            'flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all',
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          )}
                        >
                          <div className={clsx(
                            'w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all',
                            isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                          )}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div>
                            <p className={clsx('text-sm font-semibold', isSelected ? 'text-blue-700' : 'text-slate-800')}>
                              {goal.label}
                            </p>
                            <p className="text-xs text-slate-500">{goal.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {errors.adGoal && <p className="text-xs text-red-500">{errors.adGoal}</p>}
                </div>

                {/* Günlük Bütçe */}
                <div className="space-y-2">
                  <Input
                    label="Günlük Bütçe (₺)"
                    type="number"
                    value={form.dailyBudget.toString()}
                    onChange={(e) => setForm((prev) => ({ ...prev, dailyBudget: Number(e.target.value) }))}
                    placeholder="200"
                    required
                    error={errors.dailyBudget}
                    prefix={<DollarSign className="w-4 h-4" />}
                    hint="Minimum günlük bütçe: 50₺"
                  />
                  {/* Bütçe hızlı seçim */}
                  <div className="flex gap-2 flex-wrap">
                    {[100, 200, 500, 1000, 2000].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, dailyBudget: b }))}
                        className={clsx(
                          'px-3 py-1 rounded-lg text-xs font-medium transition-all',
                          form.dailyBudget === b
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        )}
                      >
                        ₺{b.toLocaleString('tr-TR')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hedef Konum */}
                <Input
                  label="Hedef Ülke / Şehir"
                  value={form.targetLocation}
                  onChange={update('targetLocation')}
                  placeholder="İstanbul, Türkiye"
                  prefix={<MapPin className="w-4 h-4" />}
                  hint="Reklamlarınızın gösterileceği bölge"
                />
              </div>
            </Card>
          )}

          {/* Adım 3: Platform Seçimi */}
          {step === 3 && (
            <Card className="animate-fade-in-up">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Platform Seçimi</h2>
              <p className="text-sm text-slate-500 mb-6">Reklamlarınızın yayınlanacağı platformları seçin. Birden fazla seçebilirsiniz.</p>

              <div className="space-y-3">
                {PLATFORM_OPTIONS.map((platform) => {
                  const isSelected = form.selectedPlatforms.includes(platform.id);
                  return (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => platform.available && togglePlatform(platform.id)}
                      disabled={!platform.available}
                      className={clsx(
                        'w-full flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all',
                        !platform.available && 'opacity-50 cursor-not-allowed',
                        isSelected && platform.available
                          ? 'border-blue-500 bg-blue-50'
                          : platform.available
                          ? 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          : 'border-slate-200 bg-slate-50'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={clsx(
                          'w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all',
                          isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                        )}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div>
                          <p className={clsx(
                            'text-sm font-semibold',
                            isSelected ? 'text-blue-700' : 'text-slate-800'
                          )}>
                            {platform.name}
                          </p>
                          <p className="text-xs text-slate-500">{platform.desc}</p>
                        </div>
                      </div>
                      {!platform.available && (
                        <span className="text-xs bg-slate-200 text-slate-500 px-2.5 py-1 rounded-lg font-medium">
                          Yakında
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {(errors as any).selectedPlatforms && (
                <p className="text-xs text-red-500 mt-2">{(errors as any).selectedPlatforms}</p>
              )}

              <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-xs text-amber-700">
                  <strong>Öneri:</strong> Meta + Google kombinasyonu en geniş kitleye ulaşmak için idealdir. AI, seçimlerinize göre bütçe dağılımını otomatik hesaplar.
                </p>
              </div>
            </Card>
          )}

          {/* Adım 4: Onay */}
          {step === 4 && (
            <Card className="animate-fade-in-up">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Her şey hazır!</h2>
                <p className="text-sm text-slate-500 mt-1">AI reklam önerinizi oluşturmak için aşağıdaki bilgileri onaylayın</p>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'İşletme', value: form.businessName },
                  { label: 'Sektör', value: SECTOR_OPTIONS.find(s => s.value === form.sector)?.label || '-' },
                  { label: 'Reklam Amacı', value: AD_GOAL_OPTIONS.find(g => g.value === form.adGoal)?.label || '-' },
                  { label: 'Günlük Bütçe', value: `₺${form.dailyBudget.toLocaleString('tr-TR')}` },
                  { label: 'Hedef Konum', value: form.targetLocation },
                  {
                    label: 'Platformlar',
                    value: form.selectedPlatforms.map(p =>
                      PLATFORM_OPTIONS.find(o => o.id === p)?.name.split(' ')[0]
                    ).join(', ')
                  },
                  form.website && { label: 'Web Sitesi', value: form.website },
                  form.whatsapp && { label: 'WhatsApp', value: form.whatsapp },
                  form.instagram && { label: 'Instagram', value: form.instagram },
                ].filter(Boolean).map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2.5 border-b border-slate-100 last:border-0">
                    <span className="text-sm text-slate-500">{(item as any).label}</span>
                    <span className="text-sm font-semibold text-slate-900">{(item as any).value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-sm text-blue-800">
                  <strong>Ne olacak?</strong> AI modelimiz işletmenizi analiz edip size özel reklam metinleri, başlıklar, CTA önerileri ve platform bazlı bütçe dağılımı oluşturacak.
                </p>
              </div>
            </Card>
          )}

          {/* Navigasyon Butonları */}
          <div className="flex justify-between items-center mt-6">
            <Button
              variant="secondary"
              onClick={prevStep}
              disabled={step === 1}
              icon={<ChevronLeft className="w-4 h-4" />}
            >
              Geri
            </Button>

            <span className="text-sm text-slate-400">{step} / {STEPS.length}</span>

            {step < 4 ? (
              <Button onClick={nextStep} icon={<ChevronRight className="w-4 h-4" />}>
                Devam Et
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                loading={loading}
                variant="success"
                size="lg"
                icon={<Zap className="w-4 h-4" />}
              >
                {loading ? 'AI Analiz Ediyor...' : 'Reklam Önerisi Al'}
              </Button>
            )}
          </div>
          {submitError && (
            <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3 max-w-2xl mx-auto">
              {submitError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
