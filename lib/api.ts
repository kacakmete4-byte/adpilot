// ============================================
// ADVARA - API Katmanı
// N8N yerine OpenAI API kullanılıyor
// ============================================

import { AdFormData, AdSuggestion, N8nAdPayload, N8nWebhookResponse } from './types';
import { generateMockSuggestion } from './mockData';
import OpenAI from 'openai';

const IS_MOCK = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
const N8N_BASE_URL = process.env.N8N_WEBHOOK_URL || '';

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// =============================================
// OpenAI ile reklam önerisi al
// =============================================
export async function getAdSuggestion(formData: AdFormData): Promise<AdSuggestion> {
  if (IS_MOCK) {
    // Mock mod: 1 saniyelik gecikme ile sahte öneri döndür
    await new Promise((r) => setTimeout(r, 1200));
    return generateMockSuggestion(formData);
  }

  const openai = getOpenAIClient();
  if (!openai) {
    return generateMockSuggestion(formData);
  }

  try {
    const prompt = `
Sen deneyimli bir dijital reklam uzmanısın. Aşağıdaki işletme bilgileri için kapsamlı bir reklam analizi ve öneri yap.

İŞLETME BİLGİLERİ:
- İşletme Adı: ${formData.businessName}
- Sektör: ${formData.sector}
- Web Sitesi: ${formData.website || 'Yok'}
- WhatsApp: ${formData.whatsapp || 'Yok'}
- Instagram: ${formData.instagram || 'Yok'}
- Günlük Bütçe: ${formData.dailyBudget}₺
- Hedef Konum: ${formData.targetLocation}
- Reklam Hedefi: ${formData.adGoal}
- Seçilen Platformlar: ${formData.selectedPlatforms.join(', ')}

ANALİZİN İÇERMESİ GEREKENLER:

1. **Kısa Mesaj:** İşletme için özelleştirilmiş başarı mesajı
2. **Reklam Önerisi:** Detaylı reklam stratejisi ve önerileri
3. **Bütçe Dağılımı:** Seçilen platformlara göre günlük bütçe dağılımı (toplam ${formData.dailyBudget}₺)
4. **Bütçe Açıklamaları:** Her platforma ayrılan bütçe için DETAYLI açıklama - neden o yüzde verildi, o platformun avantajları, müşteri potansiyeli vb.
5. **Hedef Kitle Önerisi:** Bu işletme için uygun hedef kitle
6. **Reklam Metin Örnekleri:** 2-3 farklı reklam metni örneği

ÖNEMLI: Bütçe açıklamalarında DETAYLI olun. Örnek:
- Google (700₺, %70): "Bu sektörde Google Search en yüksek müşteri dönüş oranına sahiptir çünkü arama yapan kişiler satın almaya hazırdır. Yüksek intent, düşük müşteri kazanım maliyeti. Örn: İmalatçı için 'üretim hizmeti' arayan müşteriler çok değerlidir."
- Meta (300₺, %30): "İkinci seviye olarak Meta (Facebook/Instagram) brand awareness ve uzun vadeli müşteri bilgisi için kullanılır. Daha geniş erişim ama daha düşük anlık dönüş. Retargeting için de çok etkili."

YANIT FORMATI (JSON):
{
  "message": "Başarı mesajı",
  "recommendation": "Detaylı öneri metni",
  "budget_split": {
    "meta": sayı,
    "google": sayı,
    "tiktok": sayı
  },
  "budget_explanations": {
    "meta": "Detaylı açıklama neden bu para verildi ve avantajları",
    "google": "Detaylı açıklama neden bu para verildi ve avantajları",
    "tiktok": "Detaylı açıklama neden bu para verildi ve avantajları"
  },
  "target_audience": "Hedef kitle açıklaması",
  "ad_examples": ["Örnek 1", "Örnek 2", "Örnek 3"]
}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Sen uzman bir dijital reklam danışmanısın. Türkçe yanıt ver ve JSON formatında dön.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI yanıtı boş');
    }

    // JSON parse et
    const data = JSON.parse(content);

    return {
      message: data.message || 'Analiz tamamlandı',
      recommendation: data.recommendation || 'Reklam önerisi hazır',
      budget_split: data.budget_split || { meta: formData.dailyBudget },
      budget_explanations: data.budget_explanations || {},
      target_audience: data.target_audience || 'Hedef kitle belirlenemedi',
      ad_examples: data.ad_examples || []
    };

  } catch (error) {
    console.error('OpenAI API hatası:', error);
    // Fallback olarak mock öneri döndür
    return generateMockSuggestion(formData);
  }
}
