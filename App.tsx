import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  ShoppingBag, 
  MousePointerClick, 
  CreditCard,
  Table2,
  AlertTriangle,
  CheckCircle2,
  Settings,
  TrendingUp,
} from 'lucide-react';

import { MOCK_DAILY_LOGS, DEFAULT_SETTINGS } from './constants';
import { StatCard } from './components/StatCard';
import { PlatformPerformanceChart, FunnelChart } from './components/DashboardCharts';
import { DetailedTable } from './components/DetailedTable';
import { AIInsights } from './components/AIInsights';
import { DataEntrySheet } from './components/DataEntrySheet';
import { DateRangeFilter } from './components/DateRangeFilter';
import { SettingsPage } from './components/SettingsPage';
import { ForecastingPage } from './components/ForecastingPage';
import { CampaignMetrics, DailyLog, AppSettings, DateRangePreset } from './types';

// Utility to calculate derived metrics
const calculateMetrics = (log: DailyLog): CampaignMetrics => {
  return {
    ...log,
    cpm: log.impressions > 0 ? (log.spend / log.impressions) * 1000 : 0,
    costPerUniqueLinkClick: log.uniqueLinkClicks > 0 ? log.spend / log.uniqueLinkClicks : 0,
    ctr: log.impressions > 0 ? (log.uniqueLinkClicks / log.impressions) * 100 : 0,
    costPerLandingPageView: log.landingPageViews > 0 ? log.spend / log.landingPageViews : 0,
    costPerContentView: log.contentViews > 0 ? log.spend / log.contentViews : 0,
    costPerAddToCart: log.addToCarts > 0 ? log.spend / log.addToCarts : 0,
    costPerAddPaymentInfo: log.addPaymentInfo > 0 ? log.spend / log.addPaymentInfo : 0,
    costPerPurchase: log.purchases > 0 ? log.spend / log.purchases : 0,
    conversionRate: log.uniqueLinkClicks > 0 ? (log.purchases / log.uniqueLinkClicks) * 100 : 0,
    roas: log.spend > 0 ? log.purchaseValue / log.spend : 0,
  };
};

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'entry' | 'settings' | 'forecast'>('dashboard');
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>(MOCK_DAILY_LOGS);
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  
  // Date Filtering State
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeDatePreset, setActiveDatePreset] = useState<DateRangePreset>('today');

  const handleDateRangeChange = (start: string, end: string, preset: DateRangePreset) => {
    setStartDate(start);
    setEndDate(end);
    setActiveDatePreset(preset);
  };

  // Aggregate Data based on Date Range
  const aggregatedData = useMemo(() => {
    // 1. Filter Logs by Date
    const filteredLogs = dailyLogs.filter(log => log.date >= startDate && log.date <= endDate);

    // 2. Group by Campaign Name + Platform
    const grouped = filteredLogs.reduce((acc, curr) => {
      const key = `${curr.campaignName}-${curr.platform}`;
      if (!acc[key]) {
        acc[key] = { ...curr, id: key }; // Create base
      } else {
        // Sum up metrics
        acc[key].spend += curr.spend;
        acc[key].impressions += curr.impressions;
        acc[key].uniqueLinkClicks += curr.uniqueLinkClicks;
        acc[key].landingPageViews += curr.landingPageViews;
        acc[key].contentViews += curr.contentViews;
        acc[key].addToCarts += curr.addToCarts;
        acc[key].addToCartValue += curr.addToCartValue;
        acc[key].addPaymentInfo += curr.addPaymentInfo;
        acc[key].addPaymentInfoValue += curr.addPaymentInfoValue;
        acc[key].purchases += curr.purchases;
        acc[key].purchaseValue += curr.purchaseValue;
      }
      return acc;
    }, {} as Record<string, DailyLog>);

    // 3. Convert to Array and Calculate Derived Metrics
    return Object.values(grouped).map(calculateMetrics);
  }, [dailyLogs, startDate, endDate]);

  // Calculate Totals for Top Cards
  const totals = useMemo(() => {
    return aggregatedData.reduce((acc, curr) => ({
      spend: acc.spend + curr.spend,
      impressions: acc.impressions + curr.impressions,
      purchases: acc.purchases + curr.purchases,
      revenue: acc.revenue + curr.purchaseValue,
      clicks: acc.clicks + curr.uniqueLinkClicks,
    }), { spend: 0, impressions: 0, purchases: 0, revenue: 0, clicks: 0 });
  }, [aggregatedData]);

  const overallRoas = totals.spend > 0 ? totals.revenue / totals.spend : 0;
  const overallCpa = totals.purchases > 0 ? totals.spend / totals.purchases : 0;
  const overallCtr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;

  // Alerts Logic based on Settings
  const highPerformers = aggregatedData.filter(c => c.roas >= appSettings.targetRoas).length;
  const lowPerformers = aggregatedData.filter(c => c.spend > 50 && c.roas <= appSettings.warningRoas).length;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50/50">
      {/* Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
              <LayoutDashboard className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight hidden sm:block">
              E-Com <span className="text-indigo-600">Analytics</span> Pro
            </h1>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 bg-slate-100 p-1 rounded-xl overflow-x-auto">
             <button
               onClick={() => setView('dashboard')}
               className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                 view === 'dashboard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
               }`}
             >
               <LayoutDashboard size={16} />
               التقارير
             </button>
             <button
               onClick={() => setView('entry')}
               className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                 view === 'entry' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
               }`}
             >
               <Table2 size={16} />
               إدخال
             </button>
             <button
               onClick={() => setView('forecast')}
               className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                 view === 'forecast' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
               }`}
             >
               <TrendingUp size={16} />
               توقعات الأداء
             </button>
             <button
               onClick={() => setView('settings')}
               className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                 view === 'settings' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
               }`}
             >
               <Settings size={16} />
               إعدادات
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-slate-50">
        {view === 'dashboard' ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
            
            {/* Filters & Alerts Bar */}
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
              
              <DateRangeFilter 
                startDate={startDate}
                endDate={endDate}
                activePreset={activeDatePreset}
                onRangeChange={handleDateRangeChange}
              />

              {/* Performance Alerts */}
              <div className="flex gap-4 flex-1 justify-end flex-wrap">
                {lowPerformers > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg border border-red-100 text-sm font-medium animate-pulse">
                    <AlertTriangle size={16} />
                    <span>{lowPerformers} حملات أقل من {appSettings.warningRoas}x ROAS</span>
                  </div>
                )}
                {highPerformers > 0 && (
                   <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-100 text-sm font-medium">
                    <CheckCircle2 size={16} />
                    <span>{highPerformers} حملات أعلى من {appSettings.targetRoas}x ROAS</span>
                  </div>
                )}
              </div>
            </div>

            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="إجمالي الإنفاق" 
                value={totals.spend} 
                icon={<Wallet size={20} />}
                trend="neutral"
                description="إجمالي المصروفات للفترة المحددة"
                isCurrency
                currency={appSettings.currency}
              />
              <StatCard 
                title="العائد الكلي (ROAS)" 
                value={`${overallRoas.toFixed(2)}x`}
                subValue={`Rev: ${appSettings.currency} ${totals.revenue.toLocaleString()}`}
                icon={<CreditCard size={20} />}
                trend={overallRoas >= appSettings.targetRoas ? 'up' : overallRoas <= appSettings.warningRoas ? 'down' : 'neutral'}
                trendValue={overallRoas >= appSettings.targetRoas ? 'ممتاز' : 'متوسط'}
                colorClass={overallRoas >= appSettings.targetRoas ? 'bg-green-50 border-green-200' : 'bg-white'}
              />
              <StatCard 
                title="المبيعات (Purchases)" 
                value={totals.purchases.toLocaleString()} 
                subValue={`CPA: ${appSettings.currency} ${overallCpa.toFixed(2)}`}
                icon={<ShoppingBag size={20} />}
                trend="up"
              />
              <StatCard 
                title="نسبة النقر (CTR)" 
                value={`${overallCtr.toFixed(2)}%`}
                subValue={`${totals.clicks.toLocaleString()} نقرة`}
                icon={<MousePointerClick size={20} />}
              />
            </div>

            {/* AI Section */}
            <AIInsights data={aggregatedData} />

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PlatformPerformanceChart data={aggregatedData} currency={appSettings.currency} />
              <FunnelChart data={aggregatedData} currency={appSettings.currency} />
            </div>

            {/* Detailed Table (Grouped by Platform) */}
            <DetailedTable data={aggregatedData} settings={appSettings} />
          </div>
        ) : view === 'entry' ? (
          <div className="h-[calc(100vh-64px)] p-6 animate-fade-in">
             <DataEntrySheet data={dailyLogs} onUpdate={setDailyLogs} />
          </div>
        ) : view === 'forecast' ? (
           <ForecastingPage allLogs={dailyLogs} settings={appSettings} />
        ) : (
          <SettingsPage settings={appSettings} onSave={setAppSettings} />
        )}
      </main>
    </div>
  );
};

export default App;