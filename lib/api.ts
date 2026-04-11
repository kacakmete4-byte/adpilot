// ============================================
// ADPANEL - API Katmanı
// N8N yerine OpenAI API kullanılıyor
// ============================================

import { AdFormData, AdSuggestion, N8nAdPayload, N8nWebhookResponse } from './types';
import { generateMockSuggestion } from './mockData';
import OpenAI from 'openai';

const IS_MOCK = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

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

// --- Analitik Verisi Al ---
// n8n bağlandığında: Meta Ads API + Google Ads API → n8n → Frontend
export async function getCampaignAnalytics(campaignId: string) {
  if (IS_MOCK || !N8N_BASE_URL) {
    await new Promise((r) => setTimeout(r, 800));
    // Mock: mockData.ts içindeki verileri döndür
    return null;
  }

  const response = await fetch(`${N8N_BASE_URL}/webhook/analytics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ campaignId, timestamp: new Date().toISOString() }),
  });

  return response.json();
}

// --- Kampanya Kaydet ---
// n8n bağlandığında: Frontend → n8n → Veritabanı (Airtable/Supabase/vb.)
export async function saveCampaign(formData: AdFormData, suggestion: AdSuggestion) {
  if (IS_MOCK || !N8N_BASE_URL) {
    await new Promise((r) => setTimeout(r, 500));
    return { success: true, campaignId: `camp_${Date.now()}` };
  }

  const response = await fetch(`${N8N_BASE_URL}/webhook/save-campaign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ formData, suggestion, timestamp: new Date().toISOString() }),
  });

  return response.json();
}

// --- Kullanıcı Girişi ---
// Sonra: JWT tabanlı auth veya NextAuth bağlanacak
export async function loginUser(email: string, password: string) {
  if (IS_MOCK) {
    await new Promise((r) => setTimeout(r, 800));
    if (email && password.length >= 6) {
      return {
        success: true,
        user: { id: 'usr_001', name: 'Ahmet Yılmaz', email, plan: 'starter' },
        token: 'mock_jwt_token_xxx',
      };
    }
    return { success: false, error: 'Geçersiz kullanıcı adı veya şifre' };
  }
  // TODO: Gerçek auth endpoint
  return { success: false, error: 'Auth sistemi henüz bağlanmadı' };
}

// --- Kullanıcı Kaydı ---
export async function registerUser(name: string, email: string, password: string, company: string) {
  if (IS_MOCK) {
    await new Promise((r) => setTimeout(r, 1000));
    return {
      success: true,
      user: { id: `usr_${Date.now()}`, name, email, company, plan: 'free' },
      token: 'mock_jwt_token_yyy',
    };
  }
  return { success: false, error: 'Auth sistemi henüz bağlanmadı' };
}
