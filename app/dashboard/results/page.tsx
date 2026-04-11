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
    target_audience?: string;
    ad_examples?: string[];
  } | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    // SessionStorage'dan verileri al
    const savedForm = sessionStorage.getItem('adFormData');
    const savedWebhook = sessionStorage.getItem('n8nWebhookResponse');

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
        title="AI Reklam Analizi Sonucu"
        subtitle={`${formData.businessName} için OpenAI analizi`}
        action={
          <Link href="/dashboard/create-ad">
            <Button size="sm" icon={<PlusCircle className="w-4 h-4" />}>
              Yeni Analiz
            </Button>
          </Link>
        }
      />

      <div className="px-8 py-8 space-y-6">

        {/* Form Özeti */}
        <Card className="animate-fade-in-up">
          <CardHeader
            title="Gönderilen Form Verileri"
            subtitle="n8n webhook'una gönderilen bilgiler"
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

        {/* OpenAI Analizi Sonucu */}
        <Card className="animate-fade-in-up">
          <CardHeader
            title="OpenAI Analizi Sonucu"
            subtitle="AI'dan gelen reklam önerisi ve bütçe dağılımı"
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
            {webhookResponse.budget_split && (
              <div>
                <p className="text-sm text-slate-500">Bütçe Dağılımı</p>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {Object.entries(webhookResponse.budget_split).map(([platform, amount]) => (
                    <div key={platform} className="p-3 rounded-xl bg-white border border-slate-200">
                      <p className="text-sm text-slate-500 capitalize">{platform}</p>
                      <p className="text-lg font-bold text-slate-900">₺{amount}</p>
                    </div>
                  ))}
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
                          size="xs"
                          variant="outline"
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
