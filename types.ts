export type Platform = 'google' | 'snapchat' | 'tiktok' | 'meta' | 'x';

export interface DailyLog {
  id: string;
  date: string; // YYYY-MM-DD
  campaignName: string;
  platform: Platform;
  
  // Inputs
  spend: number;
  impressions: number;
  uniqueLinkClicks: number;
  landingPageViews: number;
  contentViews: number;
  addToCarts: number;
  addToCartValue: number;
  addPaymentInfo: number;
  addPaymentInfoValue: number;
  purchases: number;
  purchaseValue: number;
}

// Interface for Aggregated/Calculated Data for display
export interface CampaignMetrics extends DailyLog {
  // Calculated
  cpm: number;
  costPerUniqueLinkClick: number; // CPC (Unique)
  ctr: number;
  costPerLandingPageView: number;
  costPerContentView: number;
  costPerAddToCart: number;
  costPerAddPaymentInfo: number;
  costPerPurchase: number; // CPA
  conversionRate: number;
  roas: number;
}

export interface SummaryMetrics {
  totalSpend: number;
  totalImpressions: number;
  totalPurchases: number;
  totalRevenue: number;
  overallRoas: number;
  overallCtr: number;
  totalAddToCart: number;
}

export interface GeminiInsight {
  title: string;
  description: string;
  type: 'positive' | 'negative' | 'neutral';
}

export interface AppSettings {
  currency: string;
  targetRoas: number;
  warningRoas: number;
  targetCpa: number;
  taxRate: number; // Percentage
  monthlyBudget: number;
  attributionWindow: string;
  showImpressions: boolean;
  themeColor: string;
  highlightWinners: boolean;
}

export type DateRangePreset = 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'custom';
