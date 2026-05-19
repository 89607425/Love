"use client";

import { useState, useEffect } from "react";
import Calendar from "@/components/Calendar";
import MemoryCard from "@/components/MemoryCard";
import MemoryForm from "@/components/MemoryForm";
import Nav from "@/components/Nav";
import { Memory } from "@/lib/db";

const now = new Date();

export default function CalendarPage() {
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [datesWithMemories, setDatesWithMemories] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [memories, setMemories] = useState<Memory[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);

  useEffect(() => {
    fetch(`/api/memories?datesOnly=true&year=${year}&month=${month}`)
      .then((r) => r.json())
      .then(setDatesWithMemories);
  }, [year, month]);

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    fetch(`/api/memories?date=${date}`)
      .then((r) => r.json())
      .then(setMemories);
  };

  const handleMonthChange = (y: number, m: number) => {
    setYear(y);
    setMonth(m);
    setSelectedDate("");
    setMemories([]);
  };

  const handleSave = async (data: {
    date: string;
    content: string;
    images: string[];
    tags: string[];
    author: string;
    id?: number;
  }) => {
    const body = {
      date: data.date,
      content: data.content,
      images: data.images,
      tags: data.tags,
      author: data.author,
    };

    if (data.id) {
      await fetch(`/api/memories/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    setShowForm(false);
    setEditingMemory(null);

    // Refresh
    fetch(`/api/memories?datesOnly=true&year=${year}&month=${month}`)
      .then((r) => r.json())
      .then(setDatesWithMemories);

    if (selectedDate) {
      fetch(`/api/memories?date=${selectedDate}`)
        .then((r) => r.json())
        .then(setMemories);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除这条回忆吗？")) return;
    await fetch(`/api/memories/${id}`, { method: "DELETE" });

    fetch(`/api/memories?datesOnly=true&year=${year}&month=${month}`)
      .then((r) => r.json())
      .then(setDatesWithMemories);

    if (selectedDate) {
      fetch(`/api/memories?date=${selectedDate}`)
        .then((r) => r.json())
        .then(setMemories);
    }
  };

  return (
    <div className="flex flex-col flex-1 pb-20">
      <header className="text-center pt-8 pb-4 px-4">
        <h1 className="text-2xl font-bold text-gray-800">📅 回忆日历</h1>
      </header>

      <div className="px-4 space-y-4">
        <Calendar
          year={year}
          month={month}
          datesWithMemories={datesWithMemories}
          onSelectDate={handleSelectDate}
          onMonthChange={handleMonthChange}
        />

        {selectedDate && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800">{selectedDate}</h2>
              <button
                onClick={() => {
                  setEditingMemory(null);
                  setShowForm(true);
                }}
                className="text-sm px-4 py-1.5 bg-rose-500 text-white rounded-full font-medium hover:bg-rose-600 transition-colors"
              >
                + 记录
              </button>
            </div>

            {memories.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">这一天还没有回忆</p>
            ) : (
              <div className="space-y-3">
                {memories.map((m) => (
                  <MemoryCard
                    key={m.id}
                    memory={m}
                    onEdit={(mem) => {
                      setEditingMemory(mem);
                      setShowForm(true);
                    }}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <MemoryForm
          date={selectedDate}
          memory={editingMemory}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingMemory(null);
          }}
        />
      )}

      <Nav />
    </div>
  );
}
