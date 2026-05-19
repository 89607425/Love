"use client";

import { useState, useEffect } from "react";
import Nav from "@/components/Nav";
import ExportButton from "@/components/ExportButton";

export default function SettingsPage() {
  const [startDate, setStartDate] = useState("");
  const [myName, setMyName] = useState("");
  const [herName, setHerName] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setStartDate(data.start_date);
        setMyName(data.my_name);
        setHerName(data.her_name);
      });
  }, []);

  const handleSave = async () => {
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start_date: startDate, my_name: myName, her_name: herName }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col flex-1 pb-20">
      <header className="text-center pt-8 pb-4 px-4">
        <h1 className="text-2xl font-bold text-gray-800">⚙️ 设置</h1>
      </header>

      <div className="px-4 space-y-6 max-w-md mx-auto w-full">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            💕 在一起的纪念日
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            💙 我的昵称
          </label>
          <input
            type="text"
            value={myName}
            onChange={(e) => setMyName(e.target.value)}
            placeholder="我"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            💗 她的昵称
          </label>
          <input
            type="text"
            value={herName}
            onChange={(e) => setHerName(e.target.value)}
            placeholder="她"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 outline-none text-sm"
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors"
        >
          {saved ? "✅ 已保存" : "💾 保存设置"}
        </button>

        <div className="pt-4 border-t border-gray-100">
          <p className="text-sm font-medium text-gray-600 mb-3">📦 数据管理</p>
          <div className="space-y-3">
            <ExportButton />
          </div>
        </div>
      </div>

      <Nav />
    </div>
  );
}
