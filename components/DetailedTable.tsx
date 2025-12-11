import React from 'react';
import { CampaignMetrics, AppSettings } from '../types';
import { PLATFORM_CONFIG, PLATFORMS } from '../constants';
import { Trophy, Medal, AlertCircle } from 'lucide-react';
import { PlatformIcon } from './PlatformIcon';

interface Props {
  data: CampaignMetrics[];
  settings: AppSettings;
}

export const DetailedTable: React.FC<Props> = ({ data, settings }) => {
  
  // Find top 3 campaigns based on ROAS if enabled
  const topPerformers = settings.highlightWinners ? [...data]
    .filter(c => c.spend > 0)
    .sort((a, b) => b.roas - a.roas)
    .slice(0, 3)
    .map(c => c.id) : [];

  const getRankIcon = (id: string) => {
    if (!settings.highlightWinners) return null;
    const index = topPerformers.indexOf(id);
    if (index === 0) return <Trophy className="text-yellow-500 fill-yellow-500" size={16} />;
    if (index === 1) return <Medal className="text-slate-400 fill-slate-400" size={16} />;
    if (index === 2) return <Medal className="text-amber-700 fill-amber-700" size={16} />;
    return null;
  };

  const getRowClass = (id: string) => {
    if (!settings.highlightWinners) return "";
    const index = topPerformers.indexOf(id);
    if (index === 0) return "bg-yellow-50/50 border-yellow-100";
    if (index === 1) return "bg-slate-50/50 border-slate-100";
    if (index === 2) return "bg-amber-50/50 border-amber-100";
    return "";
  };

  return (
    <div className="space-y-8">
      {PLATFORMS.map((platformKey) => {
        const platformData = data.filter(d => d.platform === platformKey);
        
        if (platformData.length === 0) return null;

        const totalSpend = platformData.reduce((a,b) => a + b.spend, 0);
        const totalReturn = platformData.reduce((a,b) => a + b.purchaseValue, 0);
        const avgRoas = totalSpend > 0 ? totalReturn / totalSpend : 0;

        return (
          <div key={platformKey} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             {/* Platform Header */}
            <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
              <div className="p-1.5 bg-white rounded-lg shadow-sm">
                <PlatformIcon platform={platformKey} size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">{PLATFORM_CONFIG[platformKey].label}</h3>
              <div className="mr-auto flex items-center gap-4 text-sm">
                 <span className="text-slate-500">
                    ROAS: <strong className={avgRoas >= settings.targetRoas ? 'text-green-600' : 'text-slate-700'}>{avgRoas.toFixed(2)}</strong>
                 </span>
                 <span className="text-xs px-2 py-1 bg-slate-200 rounded-full text-slate-600 font-medium">
                    {platformData.length} حملات
                 </span>
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm text-right whitespace-nowrap">
                <thead className="bg-white text-slate-500 font-medium border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 sticky right-0 bg-white z-10 min-w-[200px] text-slate-400 font-normal">الحملة</th>
                    <th className="px-4 py-3 bg-red-50 text-red-900">الإنفاق</th>
                    <th className="px-4 py-3 bg-green-50 text-green-900 border-r border-green-100">ROAS</th>
                    <th className="px-4 py-3 bg-green-50 text-green-900">المبيعات ({settings.currency})</th>
                    <th className="px-4 py-3 bg-green-50 text-green-900">CPA</th>
                    <th className="px-4 py-3">تحويل %</th>
                    <th className="px-4 py-3">إضافة للسلة</th>
                    <th className="px-4 py-3">تكلفة إضافة</th>
                    <th className="px-4 py-3">قيمة السلة</th>
                    <th className="px-4 py-3">CPM</th>
                    {settings.showImpressions && <th className="px-4 py-3">الظهور</th>}
                    <th className="px-4 py-3">CTR</th>
                    <th className="px-4 py-3">نقرات</th>
                    <th className="px-4 py-3">CPC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {platformData.map((row) => (
                    <tr key={row.id} className={`hover:bg-indigo-50/30 transition-colors ${getRowClass(row.id)}`}>
                      <td className="px-4 py-3 font-medium text-slate-900 sticky right-0 bg-white hover:bg-indigo-50/30 border-l border-slate-100 z-10 flex items-center gap-2">
                        {getRankIcon(row.id)}
                        <span className="truncate max-w-[180px]" title={row.campaignName}>{row.campaignName}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{settings.currency} {row.spend.toLocaleString()}</td>
                      
                      {/* KPI Columns */}
                      <td className={`px-4 py-3 font-bold border-r border-slate-100 ${
                          row.roas >= settings.targetRoas ? 'text-green-600' : 
                          row.roas <= settings.warningRoas ? 'text-red-500' : 'text-yellow-600'
                      }`}>
                        {row.roas.toFixed(2)}x
                        {row.roas <= settings.warningRoas && <AlertCircle size={12} className="inline mr-1 text-red-400" />}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <div>{settings.currency} {row.purchaseValue.toLocaleString()}</div>
                        <div className="text-xs text-slate-400">({row.purchases})</div>
                      </td>
                      <td className={`px-4 py-3 ${row.costPerPurchase > settings.targetCpa ? 'text-red-500 font-medium' : 'text-slate-700'}`}>
                        {settings.currency} {row.costPerPurchase.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{row.conversionRate.toFixed(2)}%</td>
                      
                      {/* Secondary Metrics */}
                      <td className="px-4 py-3 text-slate-600">{row.addToCarts}</td>
                      <td className="px-4 py-3 text-slate-600">{settings.currency} {row.costPerAddToCart.toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-600">{settings.currency} {row.addToCartValue.toLocaleString()}</td>
                      
                      {/* Top Funnel */}
                      <td className="px-4 py-3 text-slate-500">{settings.currency} {row.cpm.toFixed(2)}</td>
                      {settings.showImpressions && <td className="px-4 py-3 text-slate-500">{row.impressions.toLocaleString()}</td>}
                      <td className="px-4 py-3 text-slate-500">{row.ctr.toFixed(2)}%</td>
                      <td className="px-4 py-3 text-slate-500">{row.uniqueLinkClicks.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-500">{settings.currency} {row.costPerUniqueLinkClick.toFixed(2)}</td>
                    </tr>
                  ))}
                  {/* Subtotal Row */}
                  <tr className="bg-slate-50 font-bold text-slate-800">
                    <td className="px-4 py-3 sticky right-0 bg-slate-50 z-10 border-l border-slate-200">الإجمالي</td>
                    <td className="px-4 py-3">{settings.currency} {totalSpend.toLocaleString()}</td>
                    <td className="px-4 py-3 border-r border-slate-200 text-indigo-600">
                        {avgRoas.toFixed(2)}x
                    </td>
                    <td className="px-4 py-3">{settings.currency} {totalReturn.toLocaleString()}</td>
                    <td colSpan={10} className="px-4 py-3 text-left text-xs text-slate-400 font-normal">
                      
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};