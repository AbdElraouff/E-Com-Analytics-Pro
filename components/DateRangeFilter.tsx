import React, { useState, useEffect } from 'react';
import { CalendarDays, ChevronDown, ChevronRight, ChevronLeft } from 'lucide-react';
import { 
  subDays, subMonths, startOfMonth, endOfMonth, 
  format, startOfYear, eachDayOfInterval, 
  isSameMonth, isSameDay, isWithinInterval, 
  addMonths, startOfWeek, endOfWeek, parseISO 
} from 'date-fns';
import { arSA } from 'date-fns/locale';
import { DateRangePreset } from '../types';

interface Props {
  startDate: string;
  endDate: string;
  onRangeChange: (start: string, end: string, preset: DateRangePreset) => void;
  activePreset: DateRangePreset;
}

export const DateRangeFilter: React.FC<Props> = ({ startDate, endDate, onRangeChange, activePreset }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Local state for selecting custom ranges before applying
  const [tempStart, setTempStart] = useState<Date | null>(parseISO(startDate));
  const [tempEnd, setTempEnd] = useState<Date | null>(parseISO(endDate));

  // Sync state when props change
  useEffect(() => {
    setTempStart(parseISO(startDate));
    setTempEnd(parseISO(endDate));
  }, [startDate, endDate]);

  const presets: { label: string; value: DateRangePreset; getRange: () => [Date, Date] }[] = [
    { 
      label: 'اليوم', 
      value: 'today', 
      getRange: () => [new Date(), new Date()] 
    },
    { 
      label: 'أمس', 
      value: 'yesterday', 
      getRange: () => [subDays(new Date(), 1), subDays(new Date(), 1)] 
    },
    { 
      label: 'آخر 7 أيام', 
      value: 'last7', 
      getRange: () => [subDays(new Date(), 6), new Date()] 
    },
    { 
      label: 'آخر 30 يوم', 
      value: 'last30', 
      getRange: () => [subDays(new Date(), 29), new Date()] 
    },
    { 
      label: 'هذا الشهر', 
      value: 'thisMonth', 
      getRange: () => [startOfMonth(new Date()), new Date()] 
    },
    { 
      label: 'الشهر السابق', 
      value: 'lastMonth', 
      getRange: () => [startOfMonth(subMonths(new Date(), 1)), endOfMonth(subMonths(new Date(), 1))] 
    },
    { 
        label: 'منذ بداية العام', 
        value: 'custom', 
        getRange: () => [startOfYear(new Date()), new Date()] 
    },
  ];

  const handlePresetClick = (preset: typeof presets[0]) => {
    const [start, end] = preset.getRange();
    onRangeChange(
      format(start, 'yyyy-MM-dd'),
      format(end, 'yyyy-MM-dd'),
      preset.value
    );
    setIsOpen(false);
  };

  const handleDayClick = (day: Date) => {
    if (!tempStart || (tempStart && tempEnd)) {
      // Start a new range
      setTempStart(day);
      setTempEnd(null);
    } else {
      // Complete the range
      if (day < tempStart) {
        setTempEnd(tempStart);
        setTempStart(day);
      } else {
        setTempEnd(day);
      }
    }
  };

  const applyCustomRange = () => {
    if (tempStart && tempEnd) {
      onRangeChange(
        format(tempStart, 'yyyy-MM-dd'),
        format(tempEnd, 'yyyy-MM-dd'),
        'custom'
      );
      setIsOpen(false);
    }
  };

  // Generate Calendar Days
  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 6 }), // Start on Saturday
    end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 6 })
  });

  const weekDays = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors text-slate-700 font-medium text-sm w-full md:w-auto justify-between group"
      >
        <div className="flex items-center gap-2">
          <CalendarDays size={18} className="text-indigo-600 group-hover:text-indigo-700" />
          <span dir="ltr" className="text-right">
             {activePreset !== 'custom' 
               ? presets.find(p => p.value === activePreset)?.label 
               : `${startDate} -> ${endDate}`
             }
          </span>
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-[600px] max-w-[90vw] bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-fade-in flex flex-col md:flex-row">
          
          {/* Sidebar Presets */}
          <div className="w-full md:w-48 bg-slate-50 border-l border-slate-100 p-2 grid grid-cols-2 md:grid-cols-1 gap-1 h-auto md:h-full">
             {presets.map(preset => (
               <button
                 key={preset.value}
                 onClick={() => handlePresetClick(preset)}
                 className={`text-right px-3 py-2 text-sm rounded-lg transition-colors ${
                   activePreset === preset.value 
                   ? 'bg-indigo-100 text-indigo-700 font-bold' 
                   : 'text-slate-600 hover:bg-white hover:shadow-sm'
                 }`}
               >
                 {preset.label}
               </button>
             ))}
          </div>
          
          {/* Calendar Area */}
          <div className="flex-1 p-4">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-slate-100 rounded-full">
                <ChevronRight size={20} className="text-slate-500" />
              </button>
              <span className="font-bold text-slate-800">
                {format(currentMonth, 'MMMM yyyy', { locale: arSA })}
              </span>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-slate-100 rounded-full">
                <ChevronLeft size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-xs font-medium text-slate-400 py-1">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {daysInMonth.map((day, idx) => {
                const isSelectedStart = tempStart && isSameDay(day, tempStart);
                const isSelectedEnd = tempEnd && isSameDay(day, tempEnd);
                const isInRange = tempStart && tempEnd && isWithinInterval(day, { start: tempStart, end: tempEnd });
                const isCurrentMonth = isSameMonth(day, currentMonth);

                return (
                  <button
                    key={idx}
                    onClick={() => handleDayClick(day)}
                    className={`
                      h-9 w-full rounded-md flex items-center justify-center text-sm transition-all relative
                      ${!isCurrentMonth ? 'text-slate-300' : 'text-slate-700'}
                      ${isSelectedStart ? 'bg-indigo-600 text-white font-bold rounded-l-md z-10' : ''}
                      ${isSelectedEnd ? 'bg-indigo-600 text-white font-bold rounded-r-md z-10' : ''}
                      ${(isInRange && !isSelectedStart && !isSelectedEnd) ? 'bg-indigo-50 text-indigo-700' : ''}
                      ${(!isSelectedStart && !isSelectedEnd && !isInRange && isCurrentMonth) ? 'hover:bg-slate-100' : ''}
                    `}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="text-xs text-slate-500">
                   {tempStart && <span dir="ltr">{format(tempStart, 'yyyy-MM-dd')}</span>}
                   {tempStart && tempEnd && ' - '}
                   {tempEnd && <span dir="ltr">{format(tempEnd, 'yyyy-MM-dd')}</span>}
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="px-3 py-1.5 text-slate-500 text-sm hover:text-slate-700"
                    >
                        إلغاء
                    </button>
                    <button 
                        onClick={applyCustomRange}
                        disabled={!tempStart || !tempEnd}
                        className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        تطبيق
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};