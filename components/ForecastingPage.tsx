import React, { useMemo, useState } from 'react';
import { DailyLog, AppSettings } from '../types';
import { 
  ComposedChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { addDays, format, parseISO } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { TrendingUp, Calendar, Sliders } from 'lucide-react';

// أهم تعديل هنا
import { GoogleGenerativeAI } from "@google/generative-ai";

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
  const [budgetGrowth, setBudgetGrowth] = useState(0);
  const [roasChange, setRoasChange] = useState(0);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // ------------------------------------------
  // 1. Historical Data Processing
  // ------------------------------------------
  const historicalData = useMemo(() => {
    const sortedLogs = [...allLogs].sort((a, b) => a.date.localeCompare(b.date));

    const dailyMap = sortedLogs.reduce((acc, curr) => {
      if (!acc[curr.date]) {
        acc[curr.date] = { date: curr.date, spend: 0, revenue: 0, roas: 0 };
      }
      acc[curr.date].spend += curr.spend;
      acc[curr.date].revenue += curr.purchaseValue;
      return acc;
    }, {} as Record<string, DailyAggregated>);

    const values = Object.values(dailyMap);
    values.forEach(day => {
      day.roas = day.spend > 0 ? day.revenue / day.spend : 0;
    });

    return values.sort((a, b) => a.date.localeCompare(b.date));
  }, [allLogs]);

  // ------------------------------------------
  // 2. Baselines
  // ------------------------------------------
  const baselines = useMemo(() => {
    if (historicalData.length === 0) return { avgSpend: 0, avgRoas: 0 };

    const recentData = historicalData.slice(-30);
    const totalSpend = recentData.reduce((s, d) => s + d.spend, 0);
    const totalRevenue = recentData.reduce((s, d) => s + d.revenue, 0);

    const avgSpend = totalSpend / recentData.length;
    const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    return { avgSpend, avgRoas };
  }, [historicalData]);

  // ------------------------------------------
  // 3. Forecast Data
  // ------------------------------------------
  const forecastData = useMemo(() => {
    if (historicalData.length === 0) return [];

    const lastDate = parseISO(historicalData[historicalData.length - 1].date);
    const output = [];

    for (let i = 1; i <= forecastDays; i++) {
      const nextDate = addDays(lastDate, i);

      const spend = baselines.avgSpend * (1 + budgetGrowth / 100);
      const roas = baselines.avgRoas * (1 + roasChange / 100);
      const revenue = spend * roas;

      output.push({
        date: format(nextDate, "yyyy-MM-dd"),
        displayDate: format(nextDate, "MMM dd", { locale: arSA }),
        spend,
        revenue,
        roas,
        isForecast: true,
        historicalRevenue: null,
        forecastRevenue: revenue
      });
    }

    return output;
  }, [historicalData, baselines, forecastDays, budgetGrowth, roasChange]);

  // ------------------------------------------
  // 4. Chart Data
  // ------------------------------------------
  const chartData = useMemo(() => {
    const history = historicalData.map(d => ({
      ...d,
      displayDate: format(parseISO(d.date), "MMM dd", { locale: arSA }),
      isForecast: false,
      historicalRevenue: d.revenue,
      forecastRevenue: null
    }));

    return [...history.slice(-30), ...forecastData];
  }, [historicalData, forecastData]);

  const totalForecastedSpend = forecastData.reduce((s, d) => s + d.spend, 0);
  const totalForecastedRevenue = forecastData.reduce((s, d) => s + d.revenue, 0);
  const forecastedRoas =
    totalForecastedSpend > 0 ? totalForecastedRevenue / totalForecastedSpend : 0;

  // ------------------------------------------
  // 5. AI Analysis Function (الإصلاح الكامل)
  // ------------------------------------------
  const generateAiForecast = async () => {
    setLoadingAi(true);

    const prompt = `
      تحليل سيناريو متقدم:

      - متوسط الإنفاق اليومي: ${baselines.avgSpend.toFixed(2)}
      - متوسط ROAS الحالي: ${baselines.avgRoas.toFixed(2)}
      - تغيير الميزانية: ${budgetGrowth}%
      - تغيير ROAS: ${roasChange}%
      - مدة التوقع: ${forecastDays} يوم

      النتائج المتوقعة:
      - إجمالي الإنفاق: ${totalForecastedSpend.toFixed(2)}
      - إجمالي العائد: ${totalForecastedRevenue.toFixed(2)}

      قدم تحليلًا من 3 نقاط بلهجة احترافية.
    `;

    try {
      const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
      const ai = new GoogleGenerativeAI(apiKey);

      const model = ai.getGenerativeModel({ model: "gemini-pro" });

      const result = await model.generateContent(prompt);
      const response = await result.response;

      setAiAnalysis(response.text() || "لم يتمكن النموذج من تقديم تحليل.");
    } catch (err) {
      console.error(err);
      setAiAnalysis("حدث خطأ أثناء الاتصال بنموذج الذكاء الاصطناعي.");
    } finally {
      setLoadingAi(false);
    }
  };

  // ------------------------------------------
  // Render JSX (بدون تغيير أي تصميم)
  // ------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">

      {/* HEADER */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200 text-white">
          <TrendingUp size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">توقعات الأداء (Forecasting)</h2>
          <p className="text-slate-500">
            محاكاة النتائج المستقبلية بناءً على البيانات التاريخية وسيناريوهات النمو.
          </p>
        </div>
      </div>

      {/* LAYOUT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* CONTROLS CARD */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-6 text-slate-800 font-bold border-b border-slate-100 pb-4">
              <Sliders size={20} className="text-indigo-600" />
              <span>إعدادات السيناريو</span>
            </div>

            {/* SLIDERS */}
            <div className="space-y-8">

              {/* Forecast Days */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">فترة التوقع (أيام)</label>
                  <span className="text-indigo-600 font-bold">{forecastDays} يوم</span>
                </div>
                <input
                  type="range"
                  min="7"
                  max="90"
                  step="1"
                  value={forecastDays}
                  onChange={(e) => setForecastDays(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg accent-indigo-600"
                />
              </div>

              {/* Budget Change */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">
                    تغيير الميزانية المتوقع
                  </label>
                  <span
                    className={`${
                      budgetGrowth > 0
                        ? "text-green-600"
                        : budgetGrowth < 0
                        ? "text-red-600"
                        : "text-slate-600"
                    } font-bold`}
                  >
                    {budgetGrowth > 0 ? "+" : ""}{budgetGrowth}%
                  </span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="100"
                  step="5"
                  value={budgetGrowth}
                  onChange={(e) => setBudgetGrowth(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg accent-indigo-600"
                />
              </div>

              {/* ROAS Change */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">
                    تحسن / تراجع ROAS
                  </label>
                  <span
                    className={`${
                      roasChange > 0
                        ? "text-green-600"
                        : roasChange < 0
                        ? "text-red-600"
                        : "text-slate-600"
                    } font-bold`}
                  >
                    {roasChange > 0 ? "+" : ""}{roasChange}%
                  </span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  step="1"
                  value={roasChange}
                  onChange={(e) => setRoasChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg accent-indigo-600"
                />
              </div>
            </div>

            {/* AI BUTTON */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <button
                onClick={generateAiForecast}
                disabled={loadingAi}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3 rounded-xl font-medium hover:opacity-90 transition disabled:opacity-70"
              >
                {loadingAi ? "جاري التحليل..." : "تحليل السيناريو بالذكاء الاصطناعي"}
                {!loadingAi && <TrendingUp size={18} />}
              </button>

              {aiAnalysis && (
                <div className="mt-4 p-4 bg-indigo-50 rounded-xl text-sm text-indigo-900 border border-indigo-100">
                  <h4 className="font-bold mb-2 flex items-center gap-2">
                    <span className="text-xl">🤖</span> رأي المستشار الذكي:
                  </h4>
                  <div className="whitespace-pre-line">{aiAnalysis}</div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* RIGHT SIDE: STATS + CHART */}
        <div className="lg:col-span-2 space-y-6">

          {/* STATS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <div className="text-slate-500 text-sm font-medium mb-1">الإنفاق المتوقع</div>
              <div className="text-2xl font-bold text-slate-800">
                {settings.currency} {totalForecastedSpend.toLocaleString()}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border relative border-slate-200">
              <div className="text-slate-500 text-sm mb-1">العائد المتوقع</div>
              <div className="text-2xl font-bold text-green-600">
                {settings.currency} {totalForecastedRevenue.toLocaleString()}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <div className="text-slate-500 text-sm mb-1">ROAS المتوقع</div>
              <div
                className={`text-2xl font-bold ${
                  forecastedRoas >= settings.targetRoas ? "text-green-600" : "text-slate-800"
                }`}
              >
                {forecastedRoas.toFixed(2)}x
              </div>
            </div>
          </div>

          {/* MAIN CHART */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-[450px]">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Calendar size={18} className="text-indigo-500" />
              المسار التاريخي vs التوقعات
            </h3>

            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="history" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>

                  <linearGradient id="forecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

                <XAxis dataKey="displayDate" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />

                <Tooltip />

                <Legend />

                <Area
                  type="monotone"
                  dataKey="historicalRevenue"
                  name="العائد الفعلي"
                  fill="url(#history)"
                  stroke="#6366f1"
                  strokeWidth={3}
                />

                <Area
                  type="monotone"
                  dataKey="forecastRevenue"
                  name="العائد المتوقع"
                  fill="url(#forecast)"
                  stroke="#22c55e"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

        </div>

      </div>
    </div>
  );
};
