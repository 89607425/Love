"use client";

import { useState, useEffect } from "react";

interface Props {
  year: number;
  month: number;
  viewMode: "month" | "year";
  datesWithMemories: string[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onMonthChange: (year: number, month: number) => void;
  onViewModeChange: (mode: "month" | "year") => void;
  onYearChange: (year: number) => void;
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
const MONTHS = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

export default function Calendar({
  year,
  month,
  viewMode,
  datesWithMemories,
  selectedDate,
  onSelectDate,
  onMonthChange,
  onViewModeChange,
  onYearChange,
}: Props) {
  const [yearDatesWithMemories, setYearDatesWithMemories] = useState<string[]>([]);

  useEffect(() => {
    if (viewMode === "year") {
      fetch(`/api/memories?datesOnly=true&year=${year}`)
        .then((r) => r.json())
        .then(setYearDatesWithMemories);
    }
  }, [year, viewMode]);

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
    onSelectDate(getDateStr(day));
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
        className={`relative w-full aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
          isSelected
            ? "bg-rose-500 text-white shadow-lg shadow-rose-200 scale-105"
            : hasMem
            ? "bg-rose-200 text-rose-700 hover:bg-rose-300"
            : isToday
            ? "bg-rose-100 text-rose-600"
            : "hover:bg-rose-50 text-gray-700"
        }`}
      >
        {day}
      </button>
    );
  }

  const monthsWithMemories = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, "0");
    const count = yearDatesWithMemories.filter((d) => d.startsWith(`${year}-${m}`)).length;
    return { month: i + 1, count };
  });

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-rose-100">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={viewMode === "month" ? prevMonth : () => onYearChange(year - 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-rose-50 text-gray-500 transition-colors text-lg"
        >
          ‹
        </button>
        <h3 className="font-semibold text-gray-800">
          {viewMode === "month" ? `${year}年 ${MONTHS[month - 1]}` : `${year}年`}
        </h3>
        <button
          onClick={viewMode === "month" ? nextMonth : () => onYearChange(year + 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-rose-50 text-gray-500 transition-colors text-lg"
        >
          ›
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => onViewModeChange("month")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            viewMode === "month" ? "bg-rose-500 text-white" : "bg-gray-100 text-gray-500"
          }`}
        >
          月份
        </button>
        <button
          onClick={() => onViewModeChange("year")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            viewMode === "year" ? "bg-rose-500 text-white" : "bg-gray-100 text-gray-500"
          }`}
        >
          年份
        </button>
      </div>

      {viewMode === "month" ? (
        <>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">{cells}</div>
        </>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {monthsWithMemories.map(({ month: m, count }) => (
            <button
              key={m}
              onClick={() => {
                onMonthChange(year, m);
                onViewModeChange("month");
              }}
              className={`p-3 rounded-xl text-center transition-colors ${
                count > 0
                  ? "bg-rose-100 hover:bg-rose-200 text-rose-700"
                  : "bg-gray-50 hover:bg-gray-100 text-gray-500"
              }`}
            >
              <div className="text-sm font-medium">{MONTHS[m - 1]}</div>
              <div className="text-xs mt-0.5">
                {count > 0 ? `${count} 天有记录` : "暂无记录"}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
