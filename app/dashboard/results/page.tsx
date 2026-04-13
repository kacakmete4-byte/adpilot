'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Download, PlusCircle,
  Target, MessageSquare
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AdFormData } from '@/lib/types';
import { SECTOR_OPTIONS, AD_GOAL_OPTIONS } from '@/lib/mockData';

export default function ResultsPage() {
  const [formData, setFormData] = useState<AdFormData | null>(null);
  const [webhookResponse, setWebhookResponse] = useState<{ 
    message?: string; 
    recommendation?: string; 
    budget_split?: Record<string, number>;
    budget_explanations?: Record<string, string>;
    target_audience?: string;
    ad_examples?: string[];
  } | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState('');
  const [publishResults, setPublishResults] = useState<Array<{ platform: string; success: boolean; queued?: boolean; message: string }>>([]);

  useEffect(() => {
    // SessionStorage'dan verileri al
    const savedForm = sessionStorage.getItem('adFormData');
    const savedWebhook = sessionStorage.getItem('adSuggestionResponse');

    if (savedForm) {
      setFormData(JSON.parse(savedForm));
    }

    if (savedWebhook) {
      try {
        setWebhookResponse(JSON.parse(savedWebhook));
      } catch {
        setWebhookResponse(null);
      }
    }
  }, []);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const publishCampaign = async () => {
    const campaignId = sessionStorage.getItem('campaignId');
    if (!campaignId) {
      setPublishMessage('Önce kampanya oluşturulmalı.');
      return;
    }

    try {
      setPublishing(true);
      setPublishMessage('');
      setPublishResults([]);

      const response = await fetch(`/api/campaigns/${campaignId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Yayın başlatılamadı');
      }

      setPublishMessage(data?.message || 'Yayın işlemi tamamlandı.');
      setPublishResults(Array.isArray(data?.results) ? data.results : []);
    } catch (error) {
      setPublishMessage(error instanceof Error ? error.message : 'Yayın işlemi başarısız.');
    } finally {
      setPublishing(false);
    }
  };

  if (!formData || !webhookResponse) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Reklam önerisi bulunamadı.</p>
          <p className="text-sm text-slate-400 mt-2">Lütfen önce reklam oluştur formunu doldurun.</p>
          <Link href="/dashboard/create-ad" className="inline-block mt-4">
            <Button>Reklam Oluştur</Button>
          </Link>
        </div>
      </div>
    );
  }

  const sectorLabel = SECTOR_OPTIONS.find(s => s.value === formData.sector)?.label || formData.sector;
  const goalLabel = AD_GOAL_OPTIONS.find(g => g.value === formData.adGoal)?.label || formData.adGoal;

  return (
    <div>
      <Header
        title="Reklam Analizi Sonucu"
        subtitle={`${formData.businessName} için kampanya analizi`}
        action={
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={publishCampaign} loading={publishing}>
              {publishing ? 'Yayınlanıyor...' : 'Mecra Hesaplarına Gönder'}
            </Button>
            <Link href="/dashboard/create-ad">
              <Button size="sm" icon={<PlusCircle className="w-4 h-4" />} variant="secondary">
                Yeni Analiz
              </Button>
            </Link>
          </div>
        }
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">

        {(publishMessage || publishResults.length > 0) && (
          <Card className="animate-fade-in-up">
            <CardHeader
              title="Yayın Durumu"
              subtitle="Kampanyanın mecralara gönderim sonucu"
              icon={<Download className="w-4 h-4" />}
            />
            <div className="p-4 space-y-3">
              {publishMessage && (
                <p className="text-sm text-slate-700">{publishMessage}</p>
              )}
              {publishResults.map((result) => (
                <div key={result.platform} className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <p className="text-sm font-semibold text-slate-900 capitalize">
                    {result.platform} - {result.queued ? 'Beklemede' : result.success ? 'Başarılı' : 'Başarısız'}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">{result.message}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Form Özeti */}
        <Card className="animate-fade-in-up">
          <CardHeader
            title="Gönderilen Form Verileri"
            subtitle="Analiz için gönderilen işletme ve kampanya bilgileri"
            icon={<Target className="w-4 h-4" />}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            <div>
              <p className="text-sm text-slate-500">İşletme Adı</p>
              <p className="text-base font-semibold text-slate-900">{formData.businessName}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Sektör</p>
              <p className="text-base font-semibold text-slate-900">{sectorLabel}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Bütçe</p>
              <p className="text-base font-semibold text-slate-900">₺{formData.dailyBudget}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Şehir</p>
              <p className="text-base font-semibold text-slate-900">{formData.targetLocation}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Hedef</p>
              <p className="text-base font-semibold text-slate-900">{goalLabel}</p>
            </div>
            {formData.website && (
              <div>
                <p className="text-sm text-slate-500">Web Sitesi</p>
                <p className="text-base font-semibold text-slate-900">{formData.website}</p>
              </div>
            )}
            {formData.whatsapp && (
              <div>
                <p className="text-sm text-slate-500">WhatsApp</p>
                <p className="text-base font-semibold text-slate-900">{formData.whatsapp}</p>
              </div>
            )}
            {formData.instagram && (
              <div>
                <p className="text-sm text-slate-500">Instagram</p>
                <p className="text-base font-semibold text-slate-900">{formData.instagram}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Analiz Sonucu */}
        <Card className="animate-fade-in-up">
          <CardHeader
            title="Kampanya Analizi Sonucu"
            subtitle="Önerilen reklam stratejisi ve bütçe dağılımı"
            icon={<MessageSquare className="w-4 h-4" />}
          />
          <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            {webhookResponse.message && (
              <div>
                <p className="text-sm text-slate-500">Başarı Mesajı</p>
                <p className="text-base font-semibold text-slate-900">{webhookResponse.message}</p>
              </div>
            )}
            {webhookResponse.recommendation && (
              <div>
                <p className="text-sm text-slate-500">Reklam Önerisi</p>
                <p className="text-base font-semibold text-slate-900 whitespace-pre-line">{webhookResponse.recommendation}</p>
              </div>
            )}
            {webhookResponse.target_audience && (
              <div>
                <p className="text-sm text-slate-500">Hedef Kitle Önerisi</p>
                <p className="text-base font-semibold text-slate-900">{webhookResponse.target_audience}</p>
              </div>
            )}

            {/* Bütçe Dağılımı Öncesi Açıklama */}
            {webhookResponse.budget_split && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-sm font-bold text-amber-900 mb-2">💡 Bütçe Dağılımı Hakkında</p>
                <p className="text-sm text-amber-800 leading-relaxed">
                  Aşağıda gösterilen bütçe dağılımı, yapay zeka tarafından {formData?.businessName}'nin sektörü, hedefi ve seçilen platformlar dikkate alınarak hesaplanmıştır. Her platform için <strong>detaylı açıklamalar</strong> mevcuttur. Sizin istemeniz durumunda bu dağılımı değiştirebilir veya farklı stratejiler deneyebilirsiniz.
                </p>
              </div>
            )}
            {webhookResponse.budget_split && (
              <div>
                <p className="text-sm text-slate-500 mb-4">Bütçe Dağılımı & Detaylı Açıklama</p>
                <div className="space-y-3">
                  {Object.entries(webhookResponse.budget_split).map(([platform, amount]) => {
                    const explanation = webhookResponse.budget_explanations?.[platform];
                    const totalBudget = Object.values(webhookResponse.budget_split || {}).reduce((a, b) => a + b, 0);
                    const percentage = totalBudget > 0 ? Math.round((amount / totalBudget) * 100) : 0;
                    
                    return (
                      <div key={platform} className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-sm font-bold text-slate-900 capitalize">{platform}</p>
                            <p className="text-2xl font-bold text-blue-600 mt-1">₺{amount}</p>
                            <p className="text-xs text-blue-600 font-semibold mt-1">{percentage}% Bütçeleme Oranı</p>
                          </div>
                          <div className="text-right text-xs text-slate-500">
                            <p>Günlük</p>
                            <p className="font-semibold text-slate-700">Ayrılan Bütçe</p>
                          </div>
                        </div>
                        
                        {explanation && (
                          <div className="mt-4 pt-4 border-t border-blue-200">
                            <p className="text-sm text-slate-750 leading-relaxed">
                              <span className="font-bold text-slate-900">Neden {percentage}%? </span>
                              {explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {webhookResponse.ad_examples && webhookResponse.ad_examples.length > 0 && (
              <div>
                <p className="text-sm text-slate-500">Reklam Metin Örnekleri</p>
                <div className="mt-2 space-y-2">
                  {webhookResponse.ad_examples.map((example, index) => (
                    <div key={index} className="p-3 rounded-xl bg-white border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-slate-500">Örnek {index + 1}</p>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => copyToClipboard(example, index)}
                        >
                          {copiedIndex === index ? 'Kopyalandı!' : 'Kopyala'}
                        </Button>
                      </div>
                      <p className="text-sm text-slate-700">{example}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(!webhookResponse.message && !webhookResponse.recommendation && !webhookResponse.target_audience && !webhookResponse.budget_split && (!webhookResponse.ad_examples || webhookResponse.ad_examples.length === 0)) && (
              <div className="text-center py-8">
                <p className="text-slate-500">AI analizi tamamlandı ama sonuçlar bulunamadı.</p>
                <p className="text-xs text-slate-400 mt-2">Console'da tam yanıtı kontrol edin.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
