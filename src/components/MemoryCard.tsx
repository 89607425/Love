"use client";

import { Memory } from "@/lib/db";

interface Props {
  memory: Memory;
  onEdit?: (memory: Memory) => void;
  onDelete?: (id: number) => void;
}

export default function MemoryCard({ memory, onEdit, onDelete }: Props) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-rose-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-rose-400 bg-rose-50 px-2.5 py-1 rounded-full">
            {memory.author === "他" ? "💙 他" : "💗 她"}
          </span>
          {memory.location && (
            <span className="text-xs text-gray-400">📍 {memory.location}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit?.(memory)}
            className="text-xs text-gray-400 hover:text-rose-500 transition-colors"
          >
            编辑
          </button>
          <button
            onClick={() => onDelete?.(memory.id)}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            删除
          </button>
        </div>
      </div>

      {memory.content && (
        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap mb-3">
          {memory.content}
        </p>
      )}

      {memory.images.length > 0 && (
        <div className="grid gap-2 mb-3">
          {memory.images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt=""
              className="w-full rounded-xl object-cover max-h-64"
            />
          ))}
        </div>
      )}

      {memory.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {memory.tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
