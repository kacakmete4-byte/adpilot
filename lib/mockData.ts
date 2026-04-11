// ============================================
// ADPANEL - Mock Veri
// Yarın n8n bağlandığında bu dosya API çağrılarıyla değiştirilecek
// ============================================

import {
  AdSuggestion,
  Campaign,
  CampaignReport,
  DashboardStats,
  Platform,
  AdFormData,
} from './types';

// --- Mock Kullanıcı ---
export const MOCK_USER = {
  id: 'usr_001',
  name: 'Ahmet Yılmaz',
  email: 'ahmet@isletmem.com',
  company: 'Yılmaz Tekstil A.Ş.',
  plan: 'starter' as const,
  createdAt: '2024-01-15',
};

// --- Platform Renkleri ve İkonları ---
export const PLATFORM_CONFIG: Record<Platform, { name: string; color: string; bgColor: string; icon: string }> = {
  meta: { name: 'Meta (Facebook)', color: '#1877F2', bgColor: '#EBF5FF', icon: '🔵' },
  google: { name: 'Google Ads', color: '#4285F4', bgColor: '#E8F0FE', icon: '🔴' },
  instagram: { name: 'Instagram', color: '#E4405F', bgColor: '#FEE8EC', icon: '📸' },
  tiktok: { name: 'TikTok', color: '#000000', bgColor: '#F0F0F0', icon: '🎵' },
  youtube: { name: 'YouTube', color: '#FF0000', bgColor: '#FFE8E8', icon: '▶️' },
};

// --- Mock AI Reklam Önerisi ---
export function generateMockSuggestion(formData: AdFormData): AdSuggestion {
  const { dailyBudget, selectedPlatforms, adGoal, businessName, sector, targetLocation } = formData;

  const headlines = [
    `${businessName} ile Farkı Hissedin`,
    `Kaliteli Ürünler, Uygun Fiyatlar – ${businessName}`,
    `Türkiye'nin Tercihi: ${businessName}`,
    `Hemen Keşfet – ${businessName} Dünyası`,
    `${businessName}: Güvenilir, Hızlı, Kaliteli`,
  ];

  const ctaMap: Record<string, string> = {
    awareness: 'Daha Fazla Bilgi Al',
    traffic: 'Hemen Ziyaret Et',
    leads: 'Ücretsiz Teklif Al',
    sales: 'Şimdi Satın Al',
    engagement: 'Beğen ve Paylaş',
    appInstalls: 'Uygulamayı İndir',
  };

  const primaryTextMap: Record<string, string> = {
    ecommerce: `${businessName} olarak sizlere en kaliteli ürünleri en uygun fiyatlarla sunuyoruz. Binlerce müşterimiz gibi siz de alışverişin keyfini çıkarın. Hızlı teslimat, kolay iade garantisiyle güvende alışveriş yapın.`,
    manufacturing: `${businessName} olarak yıllarca biriken üretim deneyimimizle sektörün güvenilir ismi olmaya devam ediyoruz. Yüksek kalite standartları ve zamanında teslimat için bizimle iletişime geçin.`,
    restaurant: `${businessName}'da her lokma bir deneyim. Taze malzemeler, ustadan tarifler ve sıcak servis anlayışıyla mutfağın en iyi adresini keşfedin.`,
    retail: `${businessName}'da ihtiyacınız olan her şey tek çatı altında. Geniş ürün yelpazesi ve uygun fiyatlarla alışverişe başlayın.`,
    default: `${businessName} olarak müşterilerimize en iyi hizmeti sunmak için çalışıyoruz. Kalite ve güveni bir arada yaşamak için hemen iletişime geçin.`,
  };

  const primaryText = primaryTextMap[sector] || primaryTextMap.default;

  // Bütçe dağılımı - platforma göre
  const budgetDistribution = selectedPlatforms.map((platform, index) => {
    const platformPercentages: Record<Platform, number> = {
      meta: 40,
      google: 35,
      instagram: 15,
      youtube: 7,
      tiktok: 3,
    };

    const totalPercentage = selectedPlatforms.reduce(
      (sum, p) => sum + (platformPercentages[p] || 20),
      0
    );
    const pct = Math.round(((platformPercentages[platform] || 20) / totalPercentage) * 100);

    const reasons: Record<Platform, string> = {
      meta: 'Geniş kitle erişimi ve güçlü hedefleme özellikleri',
      google: 'Yüksek satın alma niyetli kullanıcılar',
      instagram: 'Görsel içerik için ideal, genç demografik',
      tiktok: 'Viral içerik potansiyeli, düşük maliyetli erişim',
      youtube: 'Video içerik ile güçlü marka bilinirliği',
    };

    return {
      platform,
      percentage: pct,
      dailyAmount: Math.round((dailyBudget * pct) / 100),
      reason: reasons[platform],
    };
  });

  const estimatedReachBase = dailyBudget * 150;
  const estimatedClicksBase = dailyBudget * 8;

  return {
    message: `${businessName} için etkili bir reklam kampanyası önerisi hazır.`,
    recommendation: `${businessName} için ${adGoal === 'sales' ? 'satış odaklı' : 'dönüşüm odaklı'} reklam stratejisi öneriyorum. Meta ve Google platformlarında günlük ${dailyBudget}₺ ile güçlü bir performans elde edebilirsiniz.`,
    budget_split: {
      meta: Math.round(dailyBudget * 0.6),
      google: Math.round(dailyBudget * 0.4),
      tiktok: Math.round(dailyBudget * 0.0),
    },
    target_audience: `${targetLocation} bölgesinde ${sector} sektöründe olan, ${adGoal === 'sales' ? 'satışa yönelik' : 'marka farkındalığına yönelik'} kullanıcılar.`,
    ad_examples: [
      `${businessName} ile şimdi alışveriş zamanı! Hemen web sitemizi ziyaret edin.`,
      `Sınırlı süreli kampanya: ${sector} ürünlerinde %10 indirim. Hemen tıklayın.`,
      `${targetLocation} için özel reklam: Kaliteli hizmet ve hızlı teslimat.`
    ],
    notes: [
      'Meta ve Instagram kombinasyonu bu sektörde en yüksek dönüşümü sağlar',
      'Görsel içerikler metin içerikten %30 daha iyi performans gösterir',
      'Hafta içi reklamlar hafta sonuna göre %20 daha düşük maliyetlidir',
      'Hedef kitlenizi daha iyi tanımlamak için A/B test önerilir',
    ],
  };
}

// --- Mock Dashboard İstatistikleri ---
export const MOCK_DASHBOARD_STATS: DashboardStats = {
  todayBudget: 450,
  totalSpendThisMonth: 8750,
  totalImpressions: 284600,
  totalClicks: 9840,
  activeCampaigns: 3,
  avgRoas: 3.8,
  bestPlatform: 'meta',
  topRecommendation: 'Meta kampanyanızın bütçesini %20 artırın – bu hafta CTR oranı rekor kırdı.',
};

// --- Mock Kampanyalar ---
export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp_001',
    userId: 'usr_001',
    formData: {
      businessName: 'Yılmaz Tekstil',
      sector: 'manufacturing',
      website: 'https://yilmaztekstil.com',
      whatsapp: '+905551234567',
      instagram: '@yilmaztekstil',
      dailyBudget: 200,
      targetLocation: 'İstanbul',
      adGoal: 'leads',
      selectedPlatforms: ['meta', 'google'],
    },
    suggestion: generateMockSuggestion({
      businessName: 'Yılmaz Tekstil',
      sector: 'manufacturing',
      website: '',
      whatsapp: '',
      instagram: '',
      dailyBudget: 200,
      targetLocation: 'İstanbul',
      adGoal: 'leads',
      selectedPlatforms: ['meta', 'google'],
    }),
    status: 'active',
    createdAt: '2024-03-01',
    updatedAt: '2024-04-07',
  },
  {
    id: 'camp_002',
    userId: 'usr_001',
    formData: {
      businessName: 'Yılmaz Tekstil Yaz Koleksiyonu',
      sector: 'retail',
      website: 'https://yilmaztekstil.com/yaz',
      whatsapp: '+905551234567',
      instagram: '@yilmaztekstil',
      dailyBudget: 150,
      targetLocation: 'Türkiye',
      adGoal: 'sales',
      selectedPlatforms: ['instagram', 'meta'],
    },
    suggestion: generateMockSuggestion({
      businessName: 'Yılmaz Tekstil Yaz Koleksiyonu',
      sector: 'retail',
      website: '',
      whatsapp: '',
      instagram: '',
      dailyBudget: 150,
      targetLocation: 'Türkiye',
      adGoal: 'sales',
      selectedPlatforms: ['instagram', 'meta'],
    }),
    status: 'paused',
    createdAt: '2024-02-15',
    updatedAt: '2024-03-20',
  },
];

// --- Mock Rapor Verisi ---
export const MOCK_REPORTS: CampaignReport[] = [
  {
    campaignId: 'camp_001',
    campaignName: 'Yılmaz Tekstil – Müşteri Adayı',
    platform: 'meta',
    status: 'active',
    totalSpend: 5200,
    totalImpressions: 186000,
    totalClicks: 6240,
    totalConversions: 148,
    avgCtr: 3.35,
    avgCpc: 0.83,
    roas: 4.1,
    startDate: '2024-03-01',
    dailyData: generateDailyData(30, 200),
  },
  {
    campaignId: 'camp_001_g',
    campaignName: 'Yılmaz Tekstil – Google Arama',
    platform: 'google',
    status: 'active',
    totalSpend: 3550,
    totalImpressions: 98600,
    totalClicks: 3600,
    totalConversions: 92,
    avgCtr: 3.65,
    avgCpc: 0.99,
    roas: 3.6,
    startDate: '2024-03-01',
    dailyData: generateDailyData(30, 130),
  },
];

function generateDailyData(days: number, dailyBudget: number) {
  const data = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const spend = dailyBudget * (0.85 + Math.random() * 0.3);
    const clicks = Math.round(spend * (7 + Math.random() * 3));
    const impressions = Math.round(clicks * (25 + Math.random() * 15));
    const conversions = Math.round(clicks * 0.024);
    data.push({
      date: date.toISOString().split('T')[0],
      impressions,
      clicks,
      spend: Math.round(spend),
      conversions,
      ctr: parseFloat((clicks / impressions * 100).toFixed(2)),
      cpc: parseFloat((spend / clicks).toFixed(2)),
    });
  }
  return data;
}

// --- Sektör Listesi ---
export const SECTOR_OPTIONS = [
  { value: 'ecommerce', label: 'E-ticaret / Online Mağaza' },
  { value: 'manufacturing', label: 'Üretim / İmalat' },
  { value: 'retail', label: 'Perakende / Mağaza' },
  { value: 'restaurant', label: 'Restoran / Kafe' },
  { value: 'healthcare', label: 'Sağlık / Klinik' },
  { value: 'education', label: 'Eğitim / Kurs' },
  { value: 'realEstate', label: 'Gayrimenkul' },
  { value: 'automotive', label: 'Otomotiv' },
  { value: 'beauty', label: 'Güzellik / Kozmetik' },
  { value: 'technology', label: 'Teknoloji / Yazılım' },
  { value: 'other', label: 'Diğer' },
];

// --- Reklam Amacı Listesi ---
export const AD_GOAL_OPTIONS = [
  { value: 'awareness', label: 'Marka Bilinirliği', desc: 'Daha fazla kişiye ulaşın' },
  { value: 'traffic', label: 'Web Sitesi Trafiği', desc: 'Web sitenize ziyaretçi çekin' },
  { value: 'leads', label: 'Müşteri Adayı', desc: 'İletişim bilgisi toplayın' },
  { value: 'sales', label: 'Satış', desc: 'Doğrudan satış artırın' },
  { value: 'engagement', label: 'Etkileşim', desc: 'Beğeni ve yorum artırın' },
];

// --- Platform Listesi ---
export const PLATFORM_OPTIONS = [
  { id: 'meta' as Platform, name: 'Meta (Facebook)', desc: 'Geniş kitle, güçlü hedefleme', available: true },
  { id: 'google' as Platform, name: 'Google Ads', desc: 'Arama ağı, yüksek niyet', available: true },
  { id: 'instagram' as Platform, name: 'Instagram', desc: 'Görsel içerik, genç kitle', available: true },
  { id: 'tiktok' as Platform, name: 'TikTok', desc: 'Video içerik, viral potansiyel', available: false },
  { id: 'youtube' as Platform, name: 'YouTube', desc: 'Video reklam, marka bilinirliği', available: false },
];
