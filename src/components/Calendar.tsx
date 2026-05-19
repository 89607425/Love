"use client";

import { useState } from "react";

interface Props {
  year: number;
  month: number;
  datesWithMemories: string[];
  onSelectDate: (date: string) => void;
  onMonthChange: (year: number, month: number) => void;
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
const MONTHS = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

export default function Calendar({
  year,
  month,
  datesWithMemories,
  onSelectDate,
  onMonthChange,
}: Props) {
  const [selectedDate, setSelectedDate] = useState("");

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const prevMonth = () => {
    const d = new Date(year, month - 2, 1);
    onMonthChange(d.getFullYear(), d.getMonth() + 1);
  };

  const nextMonth = () => {
    const d = new Date(year, month, 1);
    onMonthChange(d.getFullYear(), d.getMonth() + 1);
  };

  const getDateStr = (day: number) =>
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const hasMemory = (day: number) => datesWithMemories.includes(getDateStr(day));

  const handleDateClick = (day: number) => {
    const dateStr = getDateStr(day);
    setSelectedDate(dateStr);
    onSelectDate(dateStr);
  };

  const cells: React.ReactNode[] = [];

  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = getDateStr(day);
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === selectedDate;
    const hasMem = hasMemory(day);

    cells.push(
      <button
        key={day}
        onClick={() => handleDateClick(day)}
        className={`relative w-full aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all ${
          isSelected
            ? "bg-rose-500 text-white shadow-lg shadow-rose-200 scale-105"
            : isToday
            ? "bg-rose-100 text-rose-600 font-bold"
            : "hover:bg-rose-50 text-gray-700"
        }`}
      >
        <span>{day}</span>
        {hasMem && (
          <span
            className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${
              isSelected ? "bg-white" : "bg-rose-400"
            }`}
          />
        )}
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-rose-100">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-rose-50 text-gray-500 transition-colors"
        >
          ‹
        </button>
        <h3 className="font-semibold text-gray-800">
          {year}年 {MONTHS[month - 1]}
        </h3>
        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-rose-50 text-gray-500 transition-colors"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">{cells}</div>
    </div>
  );
}
