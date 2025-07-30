'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { format, startOfMonth, addMonths, subMonths, startOfWeek, addDays, isSameDay, isSameMonth } from 'date-fns';

export default function MiniCalendar({ selectedDate, onChange }: {
  selectedDate: Date;
  onChange: (date: Date) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate));

  const startDate = startOfWeek(currentMonth, { weekStartsOn: 0 });

  const days = Array.from({ length: 42 }, (_, i) => addDays(startDate, i));

  const isToday = (date: Date) =>
    isSameDay(date, new Date());

  const isSelected = (date: Date) =>
    isSameDay(date, selectedDate);

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 w-72">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="w-5 h-5 text-gray-500 hover:text-black" />
        </button>
        <h2 className="text-lg font-semibold text-gray-800">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="w-5 h-5 text-gray-500 hover:text-black" />
        </button>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 text-center text-sm text-gray-400 mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={`${d}-${i}`}>{d}</div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {days.map((day, i) => {
          const inMonth = isSameMonth(day, currentMonth);
          const isSel = isSelected(day);
          const isTod = isToday(day);

          const baseClasses = `p-2 rounded-full transition cursor-pointer ${inMonth ? 'text-gray-800' : 'text-gray-300'
            }`;

          const bg = isSel
            ? 'bg-blue-100 text-blue-800 font-semibold'
            : isTod
              ? 'border border-blue-400 text-blue-600'
              : '';

          return (
            <div
              key={i}
              className={`${baseClasses} ${bg} hover:bg-gray-100`}
              onClick={() => onChange(day)}
            >
              {day.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
