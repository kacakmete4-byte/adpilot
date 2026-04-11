// ============================================
// ADVARA - Tip Tanımlamaları
// ============================================

// --- Kullanıcı ---
export interface User {
  id: string;
  name: string;
  email: string;
  company?: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  createdAt: string;
}

// --- Platform ---
export type Platform = 'meta' | 'google' | 'instagram' | 'tiktok' | 'youtube';

export interface PlatformOption {
  id: Platform;
  name: string;
  icon: string;
  color: string;
  available: boolean;
}

// --- İş Türü / Sektör ---
export type Sector =
  | 'ecommerce'
  | 'restaurant'
  | 'retail'
  | 'manufacturing'
  | 'healthcare'
  | 'education'
  | 'realEstate'
  | 'automotive'
  | 'beauty'
  | 'technology'
  | 'other';

// --- Reklam Amacı ---
export type AdGoal =
  | 'awareness'
  | 'traffic'
  | 'leads'
  | 'sales'
  | 'engagement'
  | 'appInstalls';

// --- Reklam Formu ---
export interface AdFormData {
  // İşletme Bilgileri
  businessName: string;
  sector: Sector | '';
  website: string;
  whatsapp: string;
  instagram: string;

  // Kampanya Ayarları
  dailyBudget: number;
  targetLocation: string;
  adGoal: AdGoal | '';

  // Platform
  selectedPlatforms: Platform[];
}

// --- AI Reklam Önerisi ---
export interface AdSuggestion {
  message?: string;
  recommendation?: string;
  budget_split?: Record<string, number>;
  target_audience?: string;
  ad_examples?: string[];
  notes?: string[];
  headlines?: string[];
  primaryText?: string;
  callToAction?: string;
  description?: string;
  budgetDistribution?: BudgetDistribution[];
  estimatedReach?: {
    min: number;
    max: number;
  };
  estimatedClicks?: {
    min: number;
    max: number;
  };
  estimatedConversions?: {
    min: number;
    max: number;
  };
  roas?: number;
}

// --- Bütçe Dağılımı ---
export interface BudgetDistribution {
  platform: Platform;
  percentage: number;
  dailyAmount: number;
  reason: string;
}

// --- Kampanya ---
export interface Campaign {
  id: string;
  userId: string;
  formData: AdFormData;
  suggestion: AdSuggestion;
  status: 'draft' | 'active' | 'paused' | 'completed';
  createdAt: string;
  updatedAt: string;
}

// --- Analytics / Rapor ---
export interface DailyAnalytics {
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  ctr: number; // Click-through rate
  cpc: number; // Cost per click
}

export interface CampaignReport {
  campaignId: string;
  campaignName: string;
  platform: Platform;
  status: 'active' | 'paused' | 'completed';
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  avgCtr: number;
  avgCpc: number;
  roas: number;
  startDate: string;
  endDate?: string;
  dailyData: DailyAnalytics[];
}

// --- Dashboard Stats ---
export interface DashboardStats {
  todayBudget: number;
  totalSpendThisMonth: number;
  totalImpressions: number;
  totalClicks: number;
  activeCampaigns: number;
  avgRoas: number;
  bestPlatform: Platform;
  topRecommendation: string;
}

// --- n8n Webhook Payload (Yarın bağlanacak) ---
export interface N8nAdPayload {
  userId: string;
  formData: AdFormData;
  timestamp: string;
  source: 'advara_web';
  // n8n bu payload'ı alıp OpenAI'a gönderecek
}

export interface N8nWebhookResponse {
  success: boolean;
  executionId?: string;
  suggestion?: AdSuggestion;
  error?: string;
}
