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
  const isMe = author === "我";

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-3`}>
      <div className={`max-w-[75%] ${isMe ? "order-1" : "order-1"}`}>
        <div className="flex items-center gap-1.5 mb-1 px-1">
          <span className="text-[10px] font-medium text-gray-500">
            {isMe ? "💙 我" : "💗 她"}
          </span>
          <span className="text-[10px] text-gray-400">{date}</span>
        </div>
        <div
          className={`relative group px-4 py-2.5 rounded-2xl text-sm ${
            isMe
              ? "bg-rose-500 text-white rounded-br-md"
              : "bg-gray-100 text-gray-700 rounded-bl-md"
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
