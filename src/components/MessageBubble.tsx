"use client";

import { useState } from "react";

interface Props {
  content: string;
  author: string;
  created_at: string;
  onDelete: () => void;
}

export default function MessageBubble({ content, author, created_at, onDelete }: Props) {
  const date = created_at.slice(0, 16).replace("T", " ");
  const isHer = author === "她";

  return (
    <div className={`flex ${isHer ? "justify-end" : "justify-start"} mb-3`}>
      <div className="max-w-[75%]">
        <div className={`flex items-center gap-1.5 mb-1 px-1 ${isHer ? "justify-end" : "justify-start"}`}>
          <span className="text-[10px] font-medium text-gray-500">
            {isHer ? "💗 盛雨轩" : "💙 侯竣译"}
          </span>
          <span className="text-[10px] text-gray-400">{date}</span>
        </div>
        <div
          className={`relative group px-4 py-2.5 rounded-2xl text-sm ${
            isHer
              ? "bg-pink-100 text-pink-800 rounded-br-md"
              : "bg-blue-100 text-blue-800 rounded-bl-md"
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{content}</p>
          <button
            onClick={onDelete}
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-400 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
