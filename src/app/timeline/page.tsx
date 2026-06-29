"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Memory } from "@/lib/db";
import Nav from "@/components/Nav";
import ExportButton from "@/components/ExportButton";
import MemoryForm from "@/components/MemoryForm";
import { getTagStyle } from "@/lib/tags";

type ViewMode = "timeline" | "gallery";

export default function TimelinePage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [filterTag, setFilterTag] = useState("");
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const fetchMemories = useCallback(() => {
    fetch("/api/memories")
      .then((r) => r.json())
      .then(setMemories);
  }, []);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const handleSave = useCallback(
    async (data: {
      date: string;
      content: string;
      images: string[];
      tags: string[];
      author: string;
      location: string;
      id?: number;
    }) => {
      const body = {
        date: data.date,
        content: data.content,
        images: data.images,
        tags: data.tags,
        author: data.author,
        location: data.location,
      };
      if (data.id) {
        const res = await fetch(`/api/memories/${data.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("保存失败");
      }
      setShowEditForm(false);
      setEditingMemory(null);
      setSelectedMemory(null);
      fetchMemories();
    },
    [fetchMemories]
  );

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除这条回忆吗？")) return;
    await fetch(`/api/memories/${id}`, { method: "DELETE" });
    setSelectedMemory(null);
    fetchMemories();
  };

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

  const grouped = useMemo(() => {
    const groups: Record<string, Memory[]> = {};
    filtered.forEach((m) => {
      const key = m.date.slice(0, 7);
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  return (
    <div className="h-dvh flex flex-col relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed opacity-15 pointer-events-none"
        style={{ backgroundImage: "url(/backgrounds/two.PNG)" }}
      />

      <div className="flex-1 overflow-y-auto relative z-10 pb-16">
        <header className="text-center pt-8 pb-4 px-4">
          <h1 className="text-2xl font-bold text-gray-800">🖼️ 时光轴</h1>
        </header>

        <div className="px-4 mb-4 space-y-3">
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
              {allTags.map((tag) => {
                const style = getTagStyle(tag);
                return (
                <button
                  key={tag}
                  onClick={() => setFilterTag(tag === filterTag ? "" : tag)}
                  className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                    tag === filterTag
                      ? "bg-rose-500 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {style.emoji} {tag}
                </button>
                );
              })}
            </div>
          )}

          <ExportButton />
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
                        onClick={() => setSelectedMemory(m)}
                        className="flex gap-3 bg-white rounded-2xl p-4 shadow-sm border border-rose-100 cursor-pointer hover:shadow-md hover:border-rose-200 active:scale-[0.98] transition-all"
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
                              {m.author === "他" ? "💙 他" : "💗 她"}
                            </span>
                            {m.location && (
                              <span className="text-xs text-gray-400">📍 {m.location}</span>
                            )}
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

      {selectedMemory && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedMemory(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl shadow-xl animate-slide-up"
            style={{ overscrollBehavior: "contain" }}
          >
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-5 py-4 border-b border-gray-100 flex items-center justify-between z-10">
              <div>
                <div className="text-lg font-semibold text-gray-800">
                  {selectedMemory.date}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-rose-400 bg-rose-50 px-2 py-0.5 rounded-full">
                    {selectedMemory.author === "他" ? "💙 他" : "💗 她"}
                  </span>
                  {selectedMemory.location && (
                    <span className="text-xs text-gray-400">📍 {selectedMemory.location}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingMemory(selectedMemory);
                    setShowEditForm(true);
                  }}
                  className="text-xs text-gray-400 hover:text-rose-500 px-2 py-1 transition-colors"
                >
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(selectedMemory.id)}
                  className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 transition-colors"
                >
                  删除
                </button>
                <button
                  onClick={() => setSelectedMemory(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl leading-none p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="px-5 py-4 space-y-4">
              {selectedMemory.content && (
                <div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {selectedMemory.content}
                  </p>
                </div>
              )}

              {selectedMemory.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {selectedMemory.images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt=""
                      onClick={() => {
                        setSelectedMemory(null);
                        setLightboxImg(img);
                      }}
                      className="w-full aspect-square object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                    />
                  ))}
                </div>
              )}

              {selectedMemory.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedMemory.tags.map((tag) => {
                    const style = getTagStyle(tag);
                    return (
                      <span
                        key={tag}
                        className={`text-xs px-2.5 py-1 rounded-full ${style.bg} ${style.text}`}
                      >
                        {style.emoji} {tag}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showEditForm && editingMemory && (
        <MemoryForm
          date={editingMemory.date}
          memory={editingMemory}
          onSave={handleSave}
          onClose={() => {
            setShowEditForm(false);
            setEditingMemory(null);
          }}
        />
      )}

      <Nav />
    </div>
  );
}
