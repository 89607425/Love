"use client";

import { useState, useEffect, useMemo } from "react";
import { Memory } from "@/lib/db";
import Nav from "@/components/Nav";

type ViewMode = "timeline" | "gallery";

export default function TimelinePage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [filterTag, setFilterTag] = useState("");
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/memories")
      .then((r) => r.json())
      .then(setMemories);
  }, []);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    memories.forEach((m) => m.tags.forEach((t) => tags.add(t)));
    return Array.from(tags);
  }, [memories]);

  const filtered = useMemo(() => {
    if (!filterTag) return memories;
    return memories.filter((m) => m.tags.includes(filterTag));
  }, [memories, filterTag]);

  const allImages = useMemo(() => {
    const imgs: { src: string; date: string; id: number }[] = [];
    filtered.forEach((m) =>
      m.images.forEach((img) => imgs.push({ src: img, date: m.date, id: m.id }))
    );
    return imgs;
  }, [filtered]);

  // Group by month for timeline view
  const grouped = useMemo(() => {
    const groups: Record<string, Memory[]> = {};
    filtered.forEach((m) => {
      const key = m.date.slice(0, 7); // YYYY-MM
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  return (
    <div className="flex flex-col flex-1 pb-20">
      <header className="text-center pt-8 pb-4 px-4">
        <h1 className="text-2xl font-bold text-gray-800">🖼️ 时光轴</h1>
      </header>

      <div className="px-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => setViewMode("timeline")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              viewMode === "timeline"
                ? "bg-rose-500 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            📋 时间线
          </button>
          <button
            onClick={() => setViewMode("gallery")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              viewMode === "gallery"
                ? "bg-rose-500 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            🏞️ 照片墙
          </button>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilterTag("")}
              className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                !filterTag
                  ? "bg-rose-500 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              全部
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setFilterTag(tag === filterTag ? "" : tag)}
                className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                  tag === filterTag
                    ? "bg-rose-500 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-4">
        {viewMode === "timeline" ? (
          <div className="space-y-6">
            {grouped.map(([monthKey, monthMemories]) => (
              <div key={monthKey}>
                <h3 className="text-sm font-semibold text-gray-500 mb-3 sticky top-0 bg-rose-50/90 backdrop-blur-sm py-1 px-3 rounded-lg inline-block">
                  {monthKey.replace("-", "年")}月
                </h3>
                <div className="space-y-3">
                  {monthMemories.map((m) => (
                    <div
                      key={m.id}
                      className="flex gap-3 bg-white rounded-2xl p-4 shadow-sm border border-rose-100"
                    >
                      <div className="text-center min-w-[3rem]">
                        <div className="text-lg font-bold text-rose-400">
                          {m.date.slice(8)}
                        </div>
                        <div className="text-[10px] text-gray-400">日</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-rose-400 bg-rose-50 px-2 py-0.5 rounded-full">
                            {m.author === "我" ? "💙 我" : "💗 她"}
                          </span>
                        </div>
                        {m.content && (
                          <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">
                            {m.content}
                          </p>
                        )}
                        {m.images.length > 0 && (
                          <div className="flex gap-1.5 mt-2 overflow-x-auto">
                            {m.images.map((img, i) => (
                              <img
                                key={i}
                                src={img}
                                alt=""
                                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-gray-400 py-16">还没有回忆记录</p>
            )}
          </div>
        ) : (
          <div className="columns-2 gap-2 space-y-2">
            {allImages.map((img, i) => (
              <img
                key={i}
                src={img.src}
                alt=""
                onClick={() => setLightboxImg(img.src)}
                className="w-full rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
              />
            ))}
            {allImages.length === 0 && (
              <p className="text-center text-gray-400 py-16 col-span-2">还没有照片</p>
            )}
          </div>
        )}
      </div>

      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <img
            src={lightboxImg}
            alt=""
            className="max-w-full max-h-[80vh] object-contain rounded-lg"
          />
        </div>
      )}

      <Nav />
    </div>
  );
}
