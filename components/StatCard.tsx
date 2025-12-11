import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon: React.ReactNode;
  description?: string;
  colorClass?: string;
  currency?: string;
  isCurrency?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subValue, 
  trend, 
  trendValue, 
  icon,
  description,
  colorClass = "bg-white",
  currency = "$",
  isCurrency = false
}) => {
  return (
    <div className={`${colorClass} rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between transition-all hover:shadow-md`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center text-sm font-medium ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-500'
          }`}>
            {trendValue && <span className="ml-1">{trendValue}</span>}
            {trend === 'up' && <ArrowUpRight size={18} />}
            {trend === 'down' && <ArrowDownRight size={18} />}
            {trend === 'neutral' && <Minus size={18} />}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
        <div className="flex items-baseline gap-1">
           {isCurrency && <span className="text-lg font-medium text-slate-400">{currency}</span>}
           <span className="text-2xl font-bold text-slate-900">{typeof value === 'number' ? value.toLocaleString() : value}</span>
           {subValue && <span className="text-sm text-slate-400 font-normal mr-2">{subValue}</span>}
        </div>
        {description && <p className="text-xs text-slate-400 mt-2">{description}</p>}
      </div>
    </div>
  );
};