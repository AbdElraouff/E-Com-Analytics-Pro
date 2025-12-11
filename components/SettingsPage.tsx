import React from 'react';
import { AppSettings } from '../types';
import { Save, AlertTriangle, Target, DollarSign, PieChart, Eye, Info } from 'lucide-react';

interface Props {
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

export const SettingsPage: React.FC<Props> = ({ settings, onSave }) => {
  const [formState, setFormState] = React.useState<AppSettings>(settings);

  const handleChange = (key: keyof AppSettings, value: any) => {
    setFormState(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formState);
    alert('تم حفظ الإعدادات بنجاح');
  };

  const settingSections = [
    {
      title: 'مؤشرات الأداء الرئيسية (KPIs)',
      icon: <Target className="text-indigo-600" size={20} />,
      fields: [
        { key: 'targetRoas', label: 'ROAS المستهدف (اللون الأخضر)', type: 'number', step: 0.1, help: 'سيتم تلوين القيم أعلى من هذا الرقم باللون الأخضر.' },
        { key: 'warningRoas', label: 'حد التحذير لـ ROAS (اللون الأحمر)', type: 'number', step: 0.1, help: 'سيتم تلوين القيم أقل من هذا الرقم باللون الأحمر.' },
        { key: 'targetCpa', label: 'سعر الشراء المستهدف (CPA)', type: 'number', step: 1, help: 'التكلفة القصوى المقبولة للتحويل.' },
      ]
    },
    {
      title: 'المالية والميزانية',
      icon: <DollarSign className="text-emerald-600" size={20} />,
      fields: [
        { key: 'currency', label: 'رمز العملة', type: 'text', help: 'مثال: ر.س، $، USD' },
        { key: 'monthlyBudget', label: 'الميزانية الشهرية الكلية', type: 'number', step: 1000 },
        { key: 'taxRate', label: 'نسبة الضريبة (%)', type: 'number', step: 1 },
      ]
    },
    {
        title: 'عرض التقارير',
        icon: <PieChart className="text-blue-600" size={20} />,
        fields: [
          { key: 'attributionWindow', label: 'نافذة الإحالة (Attribution)', type: 'select', options: ['7-day click', '1-day click', 'click + view'] },
          { key: 'showImpressions', label: 'إظهار أعمدة الظهور (Impressions)', type: 'checkbox' },
          { key: 'highlightWinners', label: 'تمييز أفضل 3 حملات تلقائياً', type: 'checkbox' },
        ]
      }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">إعدادات لوحة التحكم</h2>
                    <p className="text-slate-500 text-sm mt-1">تخصيص القواعد ومعايير الأداء للتقارير.</p>
                </div>
                <button 
                    onClick={handleSubmit}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-sm shadow-indigo-200"
                >
                    <Save size={18} />
                    حفظ التغييرات
                </button>
            </div>

            <form onSubmit={handleSubmit} className="divide-y divide-slate-100">
                {settingSections.map((section, idx) => (
                    <div key={idx} className="p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="p-2 bg-slate-100 rounded-lg">{section.icon}</div>
                            <h3 className="text-lg font-bold text-slate-700">{section.title}</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            {section.fields.map((field) => (
                                <div key={field.key as string} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-slate-700">{field.label}</label>
                                        {field.type === 'checkbox' ? (
                                             <input 
                                             type="checkbox" 
                                             checked={formState[field.key as keyof AppSettings] as boolean}
                                             onChange={(e) => handleChange(field.key as keyof AppSettings, e.target.checked)}
                                             className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                         />
                                        ) : null}
                                    </div>
                                    
                                    {field.type !== 'checkbox' && (
                                        field.type === 'select' ? (
                                            <select 
                                                value={formState[field.key as keyof AppSettings] as string}
                                                onChange={(e) => handleChange(field.key as keyof AppSettings, e.target.value)}
                                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 outline-none focus:border-indigo-500 transition-colors"
                                            >
                                                {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        ) : (
                                            <input 
                                                type={field.type}
                                                step={field.step}
                                                value={formState[field.key as keyof AppSettings] as string | number}
                                                onChange={(e) => handleChange(field.key as keyof AppSettings, field.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 outline-none focus:border-indigo-500 transition-colors"
                                            />
                                        )
                                    )}
                                    {field.help && (
                                        <div className="flex items-start gap-1.5 text-xs text-slate-400">
                                            <Info size={12} className="mt-0.5" />
                                            <span>{field.help}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </form>
            
            <div className="p-4 bg-yellow-50 border-t border-yellow-100 flex items-start gap-3">
                <AlertTriangle className="text-yellow-600 shrink-0" size={20} />
                <div className="text-sm text-yellow-800">
                    <p className="font-bold mb-1">تنبيه:</p>
                    تغيير "ROAS المستهدف" سيؤثر فوراً على كيفية تلوين البيانات في الجداول والرسوم البيانية. تغيير العملة سيغير الرمز فقط ولن يقوم بتحويل الأرقام فعلياً.
                </div>
            </div>
        </div>
    </div>
  );
};
