import { DailyLog, Platform, AppSettings } from './types';

export const PLATFORMS: Platform[] = ['google', 'snapchat', 'tiktok', 'meta', 'x'];

export const PLATFORM_CONFIG = {
  google: { label: 'جوجل', color: '#4285F4' },
  snapchat: { label: 'سناب شات', color: '#FFFC00' },
  tiktok: { label: 'تيك توك', color: '#000000' },
  meta: { label: 'ميتا (FB/IG)', color: '#1877F2' },
  x: { label: 'إكس (تويتر)', color: '#000000' },
};

export const DEFAULT_SETTINGS: AppSettings = {
  currency: 'ر.س',
  targetRoas: 4.0,
  warningRoas: 1.5,
  targetCpa: 50,
  taxRate: 15,
  monthlyBudget: 50000,
  attributionWindow: '7-day click',
  showImpressions: true,
  themeColor: 'indigo',
  highlightWinners: true
};

// Helper to generate mock daily data
const generateId = () => Math.random().toString(36).substr(2, 9);
const today = new Date().toISOString().split('T')[0];

export const MOCK_DAILY_LOGS: DailyLog[] = [
  {
    id: generateId(),
    date: today,
    campaignName: 'حملة البحث - كلمات عامة',
    platform: 'google',
    spend: 450,
    impressions: 2500,
    uniqueLinkClicks: 200,
    landingPageViews: 180,
    contentViews: 150,
    addToCarts: 20,
    addToCartValue: 6000,
    addPaymentInfo: 10,
    addPaymentInfoValue: 3000,
    purchases: 5,
    purchaseValue: 1800,
  },
  {
    id: generateId(),
    date: today,
    campaignName: 'إعادة استهداف - فيديو',
    platform: 'snapchat',
    spend: 300,
    impressions: 15000,
    uniqueLinkClicks: 120,
    landingPageViews: 80,
    contentViews: 50,
    addToCarts: 5,
    addToCartValue: 1500,
    addPaymentInfo: 2,
    addPaymentInfoValue: 600,
    purchases: 1,
    purchaseValue: 360,
  },
  {
    id: generateId(),
    date: today,
    campaignName: 'تيك توك - تحدي الهاشتاق',
    platform: 'tiktok',
    spend: 750,
    impressions: 40000,
    uniqueLinkClicks: 800,
    landingPageViews: 600,
    contentViews: 500,
    addToCarts: 30,
    addToCartValue: 4500,
    addPaymentInfo: 8,
    addPaymentInfoValue: 1200,
    purchases: 3,
    purchaseValue: 750,
  },
  {
    id: generateId(),
    date: today,
    campaignName: 'ميتا - كونفيرجن',
    platform: 'meta',
    spend: 1125,
    impressions: 12000,
    uniqueLinkClicks: 350,
    landingPageViews: 300,
    contentViews: 280,
    addToCarts: 45,
    addToCartValue: 13500,
    addPaymentInfo: 25,
    addPaymentInfoValue: 7500,
    purchases: 18,
    purchaseValue: 6300,
  },
   {
    id: generateId(),
    date: today,
    campaignName: 'ميتا - ريتارجتنج',
    platform: 'meta',
    spend: 375,
    impressions: 5000,
    uniqueLinkClicks: 150,
    landingPageViews: 140,
    contentViews: 130,
    addToCarts: 15,
    addToCartValue: 4500,
    addPaymentInfo: 10,
    addPaymentInfoValue: 3000,
    purchases: 8,
    purchaseValue: 2850,
  },
  {
    id: generateId(),
    date: today,
    campaignName: 'إكس - تغريدات ترويجية',
    platform: 'x',
    spend: 250,
    impressions: 8000,
    uniqueLinkClicks: 90,
    landingPageViews: 70,
    contentViews: 60,
    addToCarts: 8,
    addToCartValue: 2000,
    addPaymentInfo: 3,
    addPaymentInfoValue: 900,
    purchases: 2,
    purchaseValue: 600,
  }
];

export const PLATFORM_COLORS = {
  google: '#4285F4',
  snapchat: '#FFFC00',
  tiktok: '#000000',
  meta: '#1877F2',
  x: '#000000',
};

export const PLATFORM_LABELS = {
  google: 'جوجل',
  snapchat: 'سناب شات',
  tiktok: 'تيك توك',
  meta: 'ميتا',
  x: 'إكس',
};