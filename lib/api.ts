// ============================================
// ADPANEL - API Katmanı
// N8N yerine OpenAI API kullanılıyor
// ============================================

import { AdFormData, AdSuggestion, N8nAdPayload, N8nWebhookResponse } from './types';
import { generateMockSuggestion } from './mockData';
import OpenAI from 'openai';

const IS_MOCK = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
const N8N_BASE_URL = process.env.N8N_WEBHOOK_URL || '';

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// =============================================
// OpenAI ile reklam önerisi al
// =============================================
export async function getAdSuggestion(formData: AdFormData): Promise<AdSuggestion> {
  if (IS_MOCK) {
    // Mock mod: 1 saniyelik gecikme ile sahte öneri döndür
    await new Promise((r) => setTimeout(r, 1200));
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
4. **Hedef Kitle Önerisi:** Bu işletme için uygun hedef kitle
5. **Reklam Metin Örnekleri:** 2-3 farklı reklam metni örneği

YANIT FORMATI (JSON):
{
  "message": "Başarı mesajı",
  "recommendation": "Detaylı öneri metni",
  "budget_split": {
    "meta": sayı,
    "google": sayı,
    "tiktok": sayı
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
      target_audience: data.target_audience || 'Hedef kitle belirlenemedi',
      ad_examples: data.ad_examples || []
    };

  } catch (error) {
    console.error('OpenAI API hatası:', error);
    // Fallback olarak mock öneri döndür
    return generateMockSuggestion(formData);
  }
}
