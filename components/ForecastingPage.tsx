import React, { useMemo, useState } from 'react';
import { DailyLog, AppSettings } from '../types';
import { 
  ComposedChart, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { addDays, format, subDays, parseISO, compareAsc } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { TrendingUp, Calendar, DollarSign, Percent, Sliders, ArrowRight } from 'lucide-react';
import { StatCard } from './StatCard';
import { GoogleGenerativeAI } from "@google/generative-ai";
const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

interface Props {
  allLogs: DailyLog[];
  settings: AppSettings;
}

interface DailyAggregated {
  date: string;
  spend: number;
  revenue: number;
  roas: number;
}

export const ForecastingPage: React.FC<Props> = ({ allLogs, settings }) => {
  const [forecastDays, setForecastDays] = useState(30);
  const [budgetGrowth, setBudgetGrowth] = useState(0); // Percentage
  const [roasChange, setRoasChange] = useState(0); // Percentage
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // 1. Prepare Historical Data (Daily Aggregates)
  const historicalData = useMemo(() => {
    // Sort logs by date
    const sortedLogs = [...allLogs].sort((a, b) => a.date.localeCompare(b.date));
    
    // Group by date
    const dailyMap = sortedLogs.reduce((acc, curr) => {
      if (!acc[curr.date]) {
        acc[curr.date] = { date: curr.date, spend: 0, revenue: 0, roas: 0 };
      }
      acc[curr.date].spend += curr.spend;
      acc[curr.date].revenue += curr.purchaseValue;
      return acc;
    }, {} as Record<string, DailyAggregated>);

    // Calculate daily ROAS
    const values = Object.values(dailyMap) as DailyAggregated[];
    values.forEach(day => {
        day.roas = day.spend > 0 ? day.revenue / day.spend : 0;
    });

    return values.sort((a, b) => a.date.localeCompare(b.date));
  }, [allLogs]);

  // 2. Calculate Baselines (Last 30 Days Average)
  const baselines = useMemo(() => {
    if (historicalData.length === 0) return { avgSpend: 0, avgRoas: 0 };

    // Take last 30 days or available days
    const recentData = historicalData.slice(-30);
    const totalSpend = recentData.reduce((sum, d) => sum + d.spend, 0);
    const totalRevenue = recentData.reduce((sum, d) => sum + d.revenue, 0);
    
    const avgSpend = totalSpend / recentData.length;
    const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    return { avgSpend, avgRoas };
  }, [historicalData]);

  // 3. Generate Forecast Data
  const forecastData = useMemo(() => {
    if (historicalData.length === 0) return [];

    const lastDate = parseISO(historicalData[historicalData.length - 1].date);
    const futurePoints = [];
    
    let cumulativeRevenue = 0;
    let cumulativeSpend = 0;

    for (let i = 1; i <= forecastDays; i++) {
        const nextDate = addDays(lastDate, i);
        
        // Apply Scenarios
        const projectedDailySpend = baselines.avgSpend * (1 + (budgetGrowth / 100));
        const projectedRoas = baselines.avgRoas * (1 + (roasChange / 100));
        const projectedDailyRevenue = projectedDailySpend * projectedRoas;

        cumulativeSpend += projectedDailySpend;
        cumulativeRevenue += projectedDailyRevenue;

        futurePoints.push({
            date: format(nextDate, 'yyyy-MM-dd'),
            displayDate: format(nextDate, 'MMM dd', { locale: arSA }),
            spend: projectedDailySpend,
            revenue: projectedDailyRevenue,
            roas: projectedRoas,
            isForecast: true
        });
    }
    return futurePoints;
  }, [historicalData, baselines, forecastDays, budgetGrowth, roasChange]);

  // Combined Data for Chart
  const chartData = useMemo(() => {
      const history = historicalData.map(d => ({
          ...d,
          displayDate: format(parseISO(d.date), 'MMM dd', { locale: arSA }),
          isForecast: false,
          historicalRevenue: d.revenue,
          forecastRevenue: null
      }));

      const forecast = forecastData.map(d => ({
          ...d,
          historicalRevenue: null,
          forecastRevenue: d.revenue
      }));

      // Only show last 30 days of history + forecast to keep chart readable
      return [...history.slice(-30), ...forecast];
  }, [historicalData, forecastData]);

  const totalForecastedSpend = forecastData.reduce((sum, d) => sum + d.spend, 0);
  const totalForecastedRevenue = forecastData.reduce((sum, d) => sum + d.revenue, 0);
  const forecastedRoas = totalForecastedSpend > 0 ? totalForecastedRevenue / totalForecastedSpend : 0;

// AI Analysis Function
const generateAiForecast = async () => {
  setLoadingAi(true);

  const prompt = `
    بناءً على البيانات التاريخية وتوقعات السيناريو التالي:
    - متوسط الإنفاق اليومي الحالي: ${baselines.avgSpend.toFixed(2)}
    - متوسط العائد (ROAS) الحالي: ${baselines.avgRoas.toFixed(2)}
    - التغيير في الميزانية: ${budgetGrowth}%
    - تغيير ROAS المتوقع: ${roasChange}%
    - فترة التوقع: ${forecastDays} يوم

    النتائج:
    - إجمالي الإنفاق المتوقع: ${totalForecastedSpend.toFixed(2)}
    - إجمالي العائد المتوقع: ${totalForecastedRevenue.toFixed(2)}

    قدم تحليلًا استراتيجيًا من 3 نقاط.
  `;

  try {
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: "gemini-pro" });

    const result = await model.generateContent({
      contents: prompt
    });

    const response = await result.response;

    setAiAnalysis(response.text() || "لم يتمكن النموذج من تقديم تحليل.");
  } catch (error) {
    console.error(error);
    setAiAnalysis("حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.");
  } finally {
    setLoadingAi(false);
  }
};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200 text-white">
            <TrendingUp size={24} />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-slate-800">توقعات الأداء (Forecasting)</h2>
            <p className="text-slate-500">محاكاة النتائج المستقبلية بناءً على البيانات التاريخية وسيناريوهات النمو.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Controls Section */}
        <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 mb-6 text-slate-800 font-bold border-b border-slate-100 pb-4">
                    <Sliders size={20} className="text-indigo-600" />
                    <span>إعدادات السيناريو</span>
                </div>

                <div className="space-y-8">
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium text-slate-700">فترة التوقع (أيام)</label>
                            <span className="text-indigo-600 font-bold">{forecastDays} يوم</span>
                        </div>
                        <input 
                            type="range" min="7" max="90" step="1"
                            value={forecastDays}
                            onChange={(e) => setForecastDays(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                            <span>أسبوع</span>
                            <span>3 شهور</span>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium text-slate-700">تغيير الميزانية المتوقع</label>
                            <span className={`${budgetGrowth > 0 ? 'text-green-600' : budgetGrowth < 0 ? 'text-red-600' : 'text-slate-600'} font-bold`}>
                                {budgetGrowth > 0 ? '+' : ''}{budgetGrowth}%
                            </span>
                        </div>
                        <input 
                            type="range" min="-50" max="100" step="5"
                            value={budgetGrowth}
                            onChange={(e) => setBudgetGrowth(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <p className="text-xs text-slate-400 mt-2">
                            زيادة أو تقليل الصرف اليومي بناءً على المعدل الحالي ({settings.currency} {baselines.avgSpend.toFixed(0)}).
                        </p>
                    </div>

                    <div>
                         <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium text-slate-700">تحسن/تراجع ROAS</label>
                            <span className={`${roasChange > 0 ? 'text-green-600' : roasChange < 0 ? 'text-red-600' : 'text-slate-600'} font-bold`}>
                                {roasChange > 0 ? '+' : ''}{roasChange}%
                            </span>
                        </div>
                        <input 
                            type="range" min="-30" max="30" step="1"
                            value={roasChange}
                            onChange={(e) => setRoasChange(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                         <p className="text-xs text-slate-400 mt-2">
                            توقع تغير كفاءة الإعلانات مقارنة بالمعدل الحالي ({baselines.avgRoas.toFixed(2)}x).
                        </p>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100">
                    <button 
                        onClick={generateAiForecast}
                        disabled={loadingAi}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-70"
                    >
                        {loadingAi ? 'جاري التحليل...' : 'تحليل السيناريو بالذكاء الاصطناعي'}
                        {!loadingAi && <TrendingUp size={18} />}
                    </button>
                    {aiAnalysis && (
                        <div className="mt-4 p-4 bg-indigo-50 rounded-xl text-sm text-indigo-900 leading-relaxed border border-indigo-100 animate-fade-in">
                            <h4 className="font-bold mb-2 flex items-center gap-2">
                                <span className="text-xl">🤖</span> رأي المستشار الذكي:
                            </h4>
                            <div className="whitespace-pre-line">{aiAnalysis}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Charts & Stats Section */}
        <div className="lg:col-span-2 space-y-6">
            {/* Projected Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <div className="text-slate-500 text-sm font-medium mb-1">الإنفاق المتوقع</div>
                    <div className="text-2xl font-bold text-slate-800">{settings.currency} {totalForecastedSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    <div className="text-xs text-slate-400 mt-1">لـ {forecastDays} يوم قادمة</div>
                 </div>
                 <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-16 h-16 bg-green-50 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="text-slate-500 text-sm font-medium mb-1 relative z-10">العائد المتوقع (Revenue)</div>
                    <div className="text-2xl font-bold text-green-600 relative z-10">{settings.currency} {totalForecastedRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    <div className="text-xs text-slate-400 mt-1 relative z-10">بناءً على السيناريو المحدد</div>
                 </div>
                 <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <div className="text-slate-500 text-sm font-medium mb-1">ROAS المتوقع</div>
                    <div className={`text-2xl font-bold ${forecastedRoas >= settings.targetRoas ? 'text-green-600' : 'text-slate-800'}`}>
                        {forecastedRoas.toFixed(2)}x
                    </div>
                    <div className="text-xs text-slate-400 mt-1">مقارنة بـ {baselines.avgRoas.toFixed(2)}x حالياً</div>
                 </div>
            </div>

            {/* Main Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-[450px]">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Calendar size={18} className="text-indigo-500" />
                    المسار التاريخي vs التوقعات المستقبلية
                </h3>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorHistory" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="displayDate" tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} minTickGap={30} />
                        <YAxis tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} />
                        <Tooltip 
                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                            formatter={(value: number, name: string) => [
                                `${settings.currency} ${value.toLocaleString(undefined, {maximumFractionDigits: 0})}`,
                                name === 'historicalRevenue' ? 'العائد الفعلي' : name === 'forecastRevenue' ? 'العائد المتوقع' : name
                            ]}
                            labelStyle={{color: '#64748b', marginBottom: '0.5rem'}}
                        />
                        <Legend wrapperStyle={{paddingTop: '20px'}} />
                        
                        {/* Historical Revenue Area */}
                        <Area 
                            type="monotone" 
                            dataKey="historicalRevenue" 
                            name="العائد الفعلي"
                            stroke="#6366f1" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorHistory)" 
                            connectNulls
                        />

                        {/* Forecast Revenue Area (Dashed Line style implied by strokeDasharray usually, but Area is solid here for impact) */}
                        <Area 
                            type="monotone" 
                            dataKey="forecastRevenue" 
                            name="العائد المتوقع"
                            stroke="#22c55e" 
                            strokeWidth={3}
                            strokeDasharray="5 5"
                            fillOpacity={1} 
                            fill="url(#colorForecast)" 
                            connectNulls
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
            
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                    <TrendingUp className="text-indigo-600" size={20} />
                </div>
                <div>
                    <h4 className="font-bold text-indigo-900 text-sm">كيف يعمل هذا التوقع؟</h4>
                    <p className="text-indigo-700 text-xs mt-1 leading-relaxed">
                        نقوم بتحليل متوسط أدائك في آخر 30 يوماً كنقطة أساس. يمكنك استخدام أشرطة التمرير على اليمين لمحاكاة "ماذا لو" قمت بزيادة الميزانية أو تحسين جودة الإعلانات (ROAS). المنطقة الخضراء في الرسم البياني تمثل المستقبل بناءً على مدخلاتك.
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};