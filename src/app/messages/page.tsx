"use client";

import { useState, useEffect, useRef } from "react";
import { Message } from "@/lib/db";
import MessageBubble from "@/components/MessageBubble";
import Nav from "@/components/Nav";

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("他");
  const [submitting, setSubmitting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const res = await fetch("/api/messages");
    setMessages(await res.json());
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.trim(), author }),
    });
    setContent("");
    setSubmitting(false);
    fetchMessages();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除这条留言吗？")) return;
    await fetch(`/api/messages/${id}`, { method: "DELETE" });
    fetchMessages();
  };

  return (
    <div className="h-dvh flex flex-col relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed opacity-15 pointer-events-none"
        style={{ backgroundImage: "url(/backgrounds/three.PNG)" }}
      />

      <div className="relative z-10 flex flex-col flex-1">
        <header className="text-center pt-8 pb-4 px-4 shrink-0">
          <h1 className="text-2xl font-bold text-gray-800">💌 留言板</h1>
          <p className="text-xs text-gray-400 mt-1">给对方写张小纸条吧</p>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-2 pb-16">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-4xl mb-3">💌</p>
              <p className="text-gray-400 text-sm">还没有留言</p>
              <p className="text-gray-400 text-sm">在下方写下第一句话吧</p>
            </div>
          ) : (
            messages.map((m) => (
              <MessageBubble
                key={m.id}
                content={m.content}
                author={m.author}
                created_at={m.created_at}
                onDelete={() => handleDelete(m.id)}
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <div className="shrink-0 px-4 py-3 bg-white/90 border-t border-rose-100">
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setAuthor("他")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                author === "他"
                  ? "bg-rose-100 text-rose-600"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              💙 侯竣译
            </button>
            <button
              onClick={() => setAuthor("她")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                author === "她"
                  ? "bg-rose-100 text-rose-600"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              💗 盛雨轩
            </button>
          </div>
          <div className="flex gap-2">
            <input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="写点什么..."
              className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 outline-none text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!content.trim() || submitting}
              className="px-5 py-2.5 bg-rose-500 text-white rounded-full font-medium hover:bg-rose-600 transition-colors disabled:opacity-50 shrink-0"
            >
              {submitting ? "📨" : "发送"}
            </button>
          </div>
        </div>
      </div>

      <Nav />
    </div>
  );
}
