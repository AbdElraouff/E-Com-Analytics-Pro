import React, { useState } from 'react';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { CampaignMetrics } from '../types';
import { analyzeCampaignData } from '../services/geminiService';

interface Props {
  data: CampaignMetrics[];
}

export const AIInsights: React.FC<Props> = ({ data }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const result = await analyzeCampaignData(data);
    setInsight(result);
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-yellow-300" size={24} />
            <h3 className="text-xl font-bold">محلل الذكاء الاصطناعي</h3>
          </div>
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            {insight ? 'تحديث التحليل' : 'تحليل البيانات'}
          </button>
        </div>

        {!insight && !loading && (
          <div className="text-indigo-100 text-sm leading-relaxed opacity-90">
            اضغط على الزر أعلاه للسماح لنموذج Gemini بتحليل أداء حملاتك وتقديم توصيات لتحسين العائد على الاستثمار وتقليل التكاليف.
          </div>
        )}

        {loading && (
          <div className="py-8 text-center text-indigo-100">
            جاري تحليل {data.length} حملة إعلانية...
          </div>
        )}

        {insight && (
          <div className="prose prose-invert prose-sm max-w-none bg-white/10 rounded-xl p-4 backdrop-blur-sm animate-fade-in">
             <div className="whitespace-pre-line leading-relaxed font-light">
               {insight}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
