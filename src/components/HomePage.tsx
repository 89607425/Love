"use client";

import { useState, useEffect } from "react";
import { Memory } from "@/lib/db";
import MemoryForm from "@/components/MemoryForm";

export default function HomePage() {
  const [startDate, setStartDate] = useState("");
  const [daysTogether, setDaysTogether] = useState(0);
  const [randomQuote, setRandomQuote] = useState("");
  const [memories, setMemories] = useState<Memory[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [showSettingsHint, setShowSettingsHint] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setStartDate(data.start_date);
        if (!data.start_date) {
          setShowSettingsHint(true);
        }
      });

    fetch(`/api/memories?date=${today}`)
      .then((r) => r.json())
      .then(setMemories);
  }, []);

  useEffect(() => {
    if (startDate) {
      const start = new Date(startDate);
      const now = new Date();
      const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      setDaysTogether(diff);

      // Get random memory for daily quote
      fetch("/api/memories?" + new URLSearchParams())
        .then((r) => r.json())
        .then((all: Memory[]) => {
          const withContent = all.filter((m) => m.content);
          if (withContent.length > 0) {
            const random = withContent[Math.floor(Math.random() * withContent.length)];
            setRandomQuote(random.content.slice(0, 100));
          }
        });
    }
  }, [startDate]);

  const handleSave = async (data: Parameters<typeof fetch>[1] & { id?: number; date: string; content: string; images: string[]; tags: string[]; author: string }) => {
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
    const res = await fetch(`/api/memories?date=${today}`);
    setMemories(await res.json());
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除这条回忆吗？")) return;
    await fetch(`/api/memories/${id}`, { method: "DELETE" });
    const res = await fetch(`/api/memories?date=${today}`);
    setMemories(await res.json());
  };

  return (
    <div className="flex flex-col flex-1 pb-20">
      <header className="text-center pt-8 pb-4 px-4">
        <h1 className="text-2xl font-bold text-gray-800">💕 我们的回忆</h1>
        {startDate && (
          <p className="text-sm text-gray-500 mt-1">
            已经在一起 {daysTogether} 天啦
          </p>
        )}
      </header>

      {showSettingsHint && (
        <div className="mx-4 mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-700">
          💡 先去 <a href="/settings" className="underline font-medium">设置</a> 页面填写你们的纪念日吧～
        </div>
      )}

      {randomQuote && (
        <div className="mx-4 mb-4 p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl border border-rose-100">
          <p className="text-xs text-rose-400 mb-1">💌 今日甜言蜜语</p>
          <p className="text-sm text-gray-700 italic">&ldquo;{randomQuote}&rdquo;</p>
        </div>
      )}

      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">
            📝 今天 · {today}
          </h2>
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
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🌸</p>
            <p className="text-gray-400 text-sm">今天还没有记录</p>
            <p className="text-gray-400 text-sm">点击「记录」写下你们的回忆吧</p>
          </div>
        ) : (
          <div className="space-y-3">
            {memories.map((m) => (
              <div key={m.id} className="bg-white rounded-2xl p-4 shadow-sm border border-rose-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-rose-400 bg-rose-50 px-2.5 py-1 rounded-full">
                    {m.author === "我" ? "💙 我" : "💗 她"}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingMemory(m);
                        setShowForm(true);
                      }}
                      className="text-xs text-gray-400 hover:text-rose-500"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="text-xs text-gray-400 hover:text-red-500"
                    >
                      删除
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">{m.content}</p>
                {m.images.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {m.images.map((img, i) => (
                      <img key={i} src={img} className="w-24 h-24 object-cover rounded-xl" alt="" />
                    ))}
                  </div>
                )}
                {m.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {m.tags.map((t) => (
                      <span key={t} className="text-[11px] text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <MemoryForm
          date={today}
          memory={editingMemory}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingMemory(null);
          }}
        />
      )}
    </div>
  );
}
