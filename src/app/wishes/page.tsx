"use client";

import { useState, useEffect } from "react";
import { Wish } from "@/lib/db";
import Nav from "@/components/Nav";

export default function WishesPage() {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("他");
  const [submitting, setSubmitting] = useState(false);

  const fetchWishes = async () => {
    const res = await fetch("/api/wishes");
    setWishes(await res.json());
  };

  useEffect(() => {
    fetchWishes();
  }, []);

  useEffect(() => {
    if (!showForm) return;
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, [showForm]);

  const handleCreate = async () => {
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    await fetch("/api/wishes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), description, author }),
    });
    setTitle("");
    setDescription("");
    setShowForm(false);
    setSubmitting(false);
    fetchWishes();
  };

  const handleToggle = async (wish: Wish) => {
    await fetch(`/api/wishes/${wish.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: wish.completed ? 0 : 1 }),
    });
    fetchWishes();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除这个愿望吗？")) return;
    await fetch(`/api/wishes/${id}`, { method: "DELETE" });
    fetchWishes();
  };

  const pending = wishes.filter((w) => !w.completed);
  const done = wishes.filter((w) => w.completed);

  return (
    <div className="flex flex-col flex-1 pb-20 min-h-screen relative">
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed opacity-15 pointer-events-none"
        style={{ backgroundImage: "url(/backgrounds/four.PNG)" }}
      />

      <div className="relative z-10">
        <header className="text-center pt-8 pb-4 px-4">
          <h1 className="text-2xl font-bold text-gray-800">⭐ 愿望清单</h1>
          <p className="text-xs text-gray-400 mt-1">
            一起想去的地方、想做的事
          </p>
        </header>

        <div className="px-4 mb-4">
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-3 border-2 border-dashed border-rose-300 text-rose-500 rounded-2xl text-sm font-medium hover:bg-rose-50 transition-colors"
          >
            + 添加愿望
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">添加愿望</h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    谁的想法
                  </label>
                  <div className="flex gap-2">
                    {[
                      { who: "他", name: "侯竣译" },
                      { who: "她", name: "盛雨轩" },
                    ].map(({ who, name }) => (
                      <button
                        key={who}
                        type="button"
                        onClick={() => setAuthor(who)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                          author === who
                            ? "bg-rose-500 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {who === "他" ? "💙 " : "💗 "}{name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    愿望标题
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="比如：一起去海边看日出"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    备注（选填）
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="详细描述..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 outline-none resize-none text-sm"
                  />
                </div>
                <button
                  onClick={handleCreate}
                  disabled={!title.trim() || submitting}
                  className="w-full py-3 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors disabled:opacity-50"
                >
                  {submitting ? "添加中..." : "✨ 添加愿望"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="px-4 space-y-6">
          {pending.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 mb-3">
                📋 待完成 ({pending.length})
              </h2>
              <div className="space-y-2">
                {pending.map((wish) => (
                  <WishCard
                    key={wish.id}
                    wish={wish}
                    onToggle={() => handleToggle(wish)}
                    onDelete={() => handleDelete(wish.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {done.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 mb-3">
                ✅ 已完成 ({done.length})
              </h2>
              <div className="space-y-2">
                {done.map((wish) => (
                  <WishCard
                    key={wish.id}
                    wish={wish}
                    onToggle={() => handleToggle(wish)}
                    onDelete={() => handleDelete(wish.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {wishes.length === 0 && (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">⭐</p>
              <p className="text-gray-400 text-sm">还没有愿望</p>
              <p className="text-gray-400 text-sm">快添加你们想一起去做的事吧</p>
            </div>
          )}
        </div>
      </div>

      <Nav />
    </div>
  );
}

function WishCard({
  wish,
  onToggle,
  onDelete,
}: {
  wish: Wish;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-2xl transition-colors ${
        wish.completed
          ? "bg-gray-50 border border-gray-100 opacity-60"
          : "bg-white border border-rose-100 shadow-sm"
      }`}
    >
      <button
        onClick={onToggle}
        className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          wish.completed
            ? "bg-emerald-500 border-emerald-500"
            : "border-gray-300 hover:border-emerald-400"
        }`}
      >
        {wish.completed && <span className="text-white text-xs">✓</span>}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className={`text-sm font-medium ${
              wish.completed ? "text-gray-400 line-through" : "text-gray-800"
            }`}
          >
            {wish.title}
          </span>
          <span className="text-[10px] font-medium text-rose-400 bg-rose-50 px-1.5 py-0.5 rounded-full shrink-0">
            {wish.author === "他" ? "💙" : "💗"}
          </span>
        </div>
        {wish.description && (
          <p className="text-xs text-gray-400">{wish.description}</p>
        )}
      </div>
      <button
        onClick={onDelete}
        className="text-gray-300 hover:text-red-400 text-sm shrink-0 transition-colors"
      >
        ✕
      </button>
    </div>
  );
}
