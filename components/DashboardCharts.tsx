import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { CampaignMetrics } from '../types';
import { PLATFORM_LABELS } from '../constants';

interface ChartProps {
  data: CampaignMetrics[];
  currency: string;
}

export const PlatformPerformanceChart: React.FC<ChartProps> = ({ data, currency }) => {
  // Aggregate data by platform
  const aggregated = data.reduce((acc, curr) => {
    const existing = acc.find(item => item.platform === curr.platform);
    if (existing) {
      existing.spend += curr.spend;
      existing.purchaseValue += curr.purchaseValue;
      existing.roas = existing.purchaseValue / existing.spend; // Recalculate
    } else {
      acc.push({ ...curr });
    }
    return acc;
  }, [] as CampaignMetrics[]);

  const chartData = aggregated.map(item => ({
    name: PLATFORM_LABELS[item.platform],
    spend: item.spend,
    return: item.purchaseValue,
    roas: parseFloat(item.roas.toFixed(2))
  }));

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-96">
      <h3 className="text-lg font-bold text-slate-800 mb-6">الأداء حسب المنصة (الإنفاق vs العائد)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
          <Tooltip 
            cursor={{fill: '#f8fafc'}}
            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
            formatter={(value: number) => [`${currency} ${value.toLocaleString()}`, '']}
          />
          <Legend wrapperStyle={{paddingTop: '20px'}} />
          <Bar name="الإنفاق" dataKey="spend" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
          <Bar name="العائد" dataKey="return" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={30} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const FunnelChart: React.FC<ChartProps> = ({ data }) => {
  // Calculate total funnel metrics
  const funnel = {
    impressions: data.reduce((sum, item) => sum + item.impressions, 0),
    clicks: data.reduce((sum, item) => sum + item.uniqueLinkClicks, 0),
    viewContent: data.reduce((sum, item) => sum + item.contentViews, 0),
    addToCart: data.reduce((sum, item) => sum + item.addToCarts, 0),
    initiateCheckout: data.reduce((sum, item) => sum + item.addPaymentInfo, 0),
    purchase: data.reduce((sum, item) => sum + item.purchases, 0),
  };

  const chartData = [
    { name: 'الظهور', value: funnel.impressions, fill: '#6366f1' }, // Indigo 500
    { name: 'النقرات', value: funnel.clicks, fill: '#818cf8' }, // Indigo 400
    { name: 'مشاهدة المحتوى', value: funnel.viewContent, fill: '#a5b4fc' }, // Indigo 300
    { name: 'إضافة للسلة', value: funnel.addToCart, fill: '#c7d2fe' }, // Indigo 200
    { name: 'الدفع', value: funnel.initiateCheckout, fill: '#e0e7ff' }, // Indigo 100
    { name: 'الشراء', value: funnel.purchase, fill: '#4ade80' }, // Green 400 (Success)
  ];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-96">
      <h3 className="text-lg font-bold text-slate-800 mb-6">قمع التحويل (Conversion Funnel)</h3>
      <div className="flex flex-col h-full justify-between pb-8">
        {chartData.map((stage, index) => {
             const maxVal = Math.max(...chartData.map(d => Math.log(d.value || 1)));
             const currentVal = Math.log(stage.value || 1);
             const widthPercentage = (currentVal / maxVal) * 100;
             
             return (
               <div key={stage.name} className="flex items-center gap-4 group">
                 <div className="w-32 text-sm font-medium text-slate-600">{stage.name}</div>
                 <div className="flex-1 h-8 bg-slate-50 rounded-full overflow-hidden relative">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end px-3 text-xs font-bold text-white shadow-sm"
                      style={{ width: `${Math.max(widthPercentage, 5)}%`, backgroundColor: stage.fill }}
                    >
                    </div>
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-700">
                        {stage.value.toLocaleString()}
                    </span>
                 </div>
               </div>
             )
        })}
      </div>
    </div>
  );
};