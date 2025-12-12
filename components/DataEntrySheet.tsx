import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DailyLog } from '../types';
import { PLATFORM_CONFIG, PLATFORMS, DEFAULT_SETTINGS } from '../constants';
import { Plus, Trash2, Calendar, Copy, Clock, Loader2, CheckCircle2, History } from 'lucide-react';
import { PlatformIcon } from './PlatformIcon';
import { format, subDays } from 'date-fns';

interface Props {
  data: DailyLog[];
  onUpdate: (newData: DailyLog[]) => void;
}

export const DataEntrySheet: React.FC<Props> = ({ data, onUpdate }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [rows, setRows] = useState<DailyLog[]>([]);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('saved');
  
  // Ref to track if the update is coming from local editing
  const isEditingRef = useRef(false);

  // 1. Load rows for the selected date ONLY when date changes
  // We avoid adding 'data' to dependency to prevent loop with auto-save
  useEffect(() => {
    const dailyData = data.filter(d => d.date === selectedDate);
    setRows(dailyData);
    setSaveStatus('saved');
    isEditingRef.current = false;
  }, [selectedDate]);

  // 2. Auto-Save Logic with Debounce
  useEffect(() => {
    if (!isEditingRef.current) return;

    setSaveStatus('saving');
    const timer = setTimeout(() => {
      const otherData = data.filter(d => d.date !== selectedDate);
      // We pass the new full dataset to parent
      onUpdate([...otherData, ...rows]);
      setSaveStatus('saved');
      isEditingRef.current = false;
    }, 1000); // Wait 1 second after last keystroke

    return () => clearTimeout(timer);
  }, [rows, selectedDate]); // Trigger save when rows change

  // 3. Get Unique Campaign Names for Autocomplete
  const uniqueCampaignNames = useMemo(() => {
    const names = new Set(data.map(d => d.campaignName));
    return Array.from(names).filter(Boolean);
  }, [data]);

  const handleInputChange = (id: string, field: keyof DailyLog, value: any) => {
    isEditingRef.current = true; // Mark as user edit
    setRows(prev => prev.map(row => {
      if (row.id === id) {
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  const setDateToToday = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const setDateToYesterday = () => {
    setSelectedDate(format(subDays(new Date(), 1), 'yyyy-MM-dd'));
  };

  const addNewRow = () => {
    isEditingRef.current = true;
    const newRow: DailyLog = {
      id: Math.random().toString(36).substr(2, 9),
      date: selectedDate,
      campaignName: '',
      platform: 'google',
      spend: 0,
      impressions: 0,
      uniqueLinkClicks: 0,
      landingPageViews: 0,
      contentViews: 0,
      addToCarts: 0,
      addToCartValue: 0,
      addPaymentInfo: 0,
      addPaymentInfoValue: 0,
      purchases: 0,
      purchaseValue: 0,
    };
    setRows([...rows, newRow]);
  };

  const duplicateRow = (row: DailyLog) => {
    isEditingRef.current = true;
    const newRow = { ...row, id: Math.random().toString(36).substr(2, 9) };
    setRows([...rows, newRow]);
  };

  const deleteRow = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الصف؟')) {
        isEditingRef.current = true;
        setRows(rows.filter(r => r.id !== id));
    }
  };

  // Feature: Import structure from yesterday
  const importFromYesterday = () => {
      const yesterday = format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd');
      const yesterdaysLogs = data.filter(d => d.date === yesterday);

      if (yesterdaysLogs.length === 0) {
          alert('لا توجد بيانات ليوم أمس للنسخ منها.');
          return;
      }

      if (rows.length > 0) {
          if (!window.confirm('سيتم إضافة حملات الأمس إلى القائمة الحالية. هل تريد المتابعة؟')) return;
      }

      isEditingRef.current = true;
      const newRows = yesterdaysLogs.map(log => ({
          ...log,
          id: Math.random().toString(36).substr(2, 9),
          date: selectedDate,
          // Reset Metrics to 0
          spend: 0,
          impressions: 0,
          uniqueLinkClicks: 0,
          landingPageViews: 0,
          contentViews: 0,
          addToCarts: 0,
          addToCartValue: 0,
          addPaymentInfo: 0,
          addPaymentInfoValue: 0,
          purchases: 0,
          purchaseValue: 0,
      }));

      setRows(prev => [...prev, ...newRows]);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full animate-fade-in">
      
      {/* Hidden Datalist for Autocomplete */}
      <datalist id="campaign-suggestions">
        {uniqueCampaignNames.map(name => (
            <option key={name} value={name} />
        ))}
      </datalist>

      {/* Toolbar */}
      <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 justify-between items-center bg-slate-50">
        
        {/* Date Selection Section */}
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 px-3 border-l border-slate-100">
             <Calendar size={18} className="text-indigo-600" />
             <span className="text-xs font-bold text-slate-500">تاريخ الإدخال</span>
          </div>
          
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="outline-none text-slate-700 font-semibold bg-transparent text-sm cursor-pointer hover:text-indigo-600 transition-colors"
          />

          <div className="flex gap-1 pr-2 border-r border-slate-100">
             <button 
               onClick={setDateToToday}
               className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 transition font-medium"
             >
               اليوم
             </button>
             <button 
               onClick={setDateToYesterday}
               className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition font-medium"
             >
               أمس
             </button>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex-1 flex justify-end px-4">
            {saveStatus === 'saving' && (
                <div className="flex items-center gap-2 text-indigo-600 text-sm font-medium animate-pulse">
                    <Loader2 size={16} className="animate-spin" />
                    جاري الحفظ تلقائياً...
                </div>
            )}
            {saveStatus === 'saved' && (
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium transition-all duration-500">
                    <CheckCircle2 size={16} />
                    تم الحفظ
                </div>
            )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
           <button 
            onClick={importFromYesterday}
            title="إضافة الحملات التي عملت عليها بالأمس (مع تصفير الأرقام)"
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-colors text-sm font-medium"
          >
            <History size={16} />
            <span className="hidden sm:inline">نسخ هيكل الأمس</span>
          </button>
          <button 
            onClick={addNewRow}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm shadow-indigo-200"
          >
            <Plus size={16} />
            إضافة صف جديد
          </button>
        </div>
      </div>

      {/* Spreadsheet */}
      <div className="overflow-x-auto flex-1 custom-scrollbar bg-slate-50">
        <table className="w-full text-sm text-right border-collapse">
          <thead className="bg-white text-slate-600 font-semibold sticky top-0 z-20 shadow-sm">
            <tr>
              <th className="p-3 min-w-[60px] sticky right-0 bg-white z-30 text-center">أدوات</th>
              <th className="p-3 min-w-[220px] sticky right-[60px] bg-white z-30 border-l border-slate-100">
                  اسم الحملة
                  <span className="block text-[10px] text-slate-400 font-normal mt-0.5">اكتب للاقتراح من السجل</span>
              </th>
              <th className="p-3 min-w-[140px]">المنصة</th>
              <th className="p-3 min-w-[120px] bg-red-50 text-red-900 border-r border-red-100">الإنفاق ({DEFAULT_SETTINGS.currency})</th>
              <th className="p-3 min-w-[110px]">الظهور</th>
              <th className="p-3 min-w-[110px]">نقرات (Clicks)</th>
              <th className="p-3 min-w-[110px]">Landing Views</th>
              <th className="p-3 min-w-[110px]">Content Views</th>
              <th className="p-3 min-w-[110px] bg-blue-50 text-blue-900 border-r border-blue-100">إضافة سلة #</th>
              <th className="p-3 min-w-[120px] bg-blue-50 text-blue-900">قيمة السلة</th>
              <th className="p-3 min-w-[110px]">إضافة دفع #</th>
              <th className="p-3 min-w-[120px]">قيمة الدفع</th>
              <th className="p-3 min-w-[110px] bg-green-50 text-green-900 border-r border-green-100">الشراء #</th>
              <th className="p-3 min-w-[120px] bg-green-50 text-green-900">قيمة الشراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50 transition-colors group">
                <td className="p-2 sticky right-0 bg-white group-hover:bg-slate-50 z-20 border-l border-slate-100 flex gap-1 justify-center">
                  <button 
                    onClick={() => duplicateRow(row)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
                    title="تكرار الصف"
                  >
                    <Copy size={14} />
                  </button>
                  <button 
                    onClick={() => deleteRow(row.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors"
                    title="حذف"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
                <td className="p-2 sticky right-[60px] bg-white group-hover:bg-slate-50 z-20 border-l border-slate-100">
                  <input 
                    type="text" 
                    list="campaign-suggestions"
                    autoComplete="off"
                    value={row.campaignName}
                    onChange={(e) => handleInputChange(row.id, 'campaignName', e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 focus:border-indigo-500 rounded-md bg-transparent focus:bg-white transition-all outline-none"
                    placeholder="اسم الحملة..."
                  />
                </td>
                <td className="p-2">
                  <div className="relative">
                    <select 
                        value={row.platform}
                        onChange={(e) => handleInputChange(row.id, 'platform', e.target.value)}
                        className="w-full pl-2 pr-8 py-1.5 border border-slate-200 focus:border-indigo-500 rounded-md bg-transparent focus:bg-white transition-all outline-none text-xs font-medium appearance-none"
                    >
                        {PLATFORMS.map(p => (
                        <option key={p} value={p}>{PLATFORM_CONFIG[p].label}</option>
                        ))}
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                        <PlatformIcon platform={row.platform} size={14} />
                    </div>
                  </div>
                </td>
                
                {/* Number Inputs */}
                {[
                  'spend', 'impressions', 'uniqueLinkClicks', 'landingPageViews', 
                  'contentViews', 'addToCarts', 'addToCartValue', 'addPaymentInfo', 
                  'addPaymentInfoValue', 'purchases', 'purchaseValue'
                ].map((field) => (
                  <td key={field} className={`p-2 ${(field === 'spend' || field.includes('purchase') || field.includes('Cart')) ? 'font-medium' : ''}`}>
                    <input 
                      type="number" 
                      min="0"
                      step="0.01"
                      onWheel={(e) => e.currentTarget.blur()} 
                      value={row[field as keyof DailyLog] as number}
                      onChange={(e) => handleInputChange(row.id, field as keyof DailyLog, parseFloat(e.target.value) || 0)}
                      className={`w-full px-2 py-1.5 border border-slate-200 focus:border-indigo-500 rounded-md bg-transparent focus:bg-white transition-all outline-none text-left ${
                          field === 'spend' ? 'text-red-700 bg-red-50/30' : 
                          field.includes('purchase') ? 'text-green-700 bg-green-50/30' : 'text-slate-700'
                      }`}
                    />
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={14} className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                         <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <Clock size={32} />
                         </div>
                         <p className="text-lg font-medium text-slate-600 mb-2">لا توجد بيانات ليوم <span dir="ltr">{selectedDate}</span></p>
                         <p className="text-sm mb-6 max-w-xs mx-auto text-slate-400">
                             لتوفير الوقت، يمكنك نسخ هيكل الحملات من يوم أمس (الأسماء والمنصات) ثم تعبئة الأرقام فقط.
                         </p>
                         <div className="flex gap-3">
                           <button onClick={importFromYesterday} className="bg-white border border-slate-300 text-slate-700 px-5 py-2 rounded-lg hover:bg-slate-50 transition flex items-center gap-2">
                               <History size={16} />
                               نسخ من أمس
                           </button>
                           <button onClick={addNewRow} className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2">
                               <Plus size={16} />
                               إضافة يدوية
                           </button>
                         </div>
                    </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};