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
  const [actionTarget, setActionTarget] = useState<Message | null>(null);
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchMessages = async () => {
    const res = await fetch("/api/messages", { cache: "no-store" });
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
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          author,
          replyTo: replyTarget?.id ?? null,
        }),
      });
      if (res.ok) {
        const message: Message = await res.json();
        // 直接把返回的新消息追加进去，避免 GET 缓存导致新消息延迟出现
        setMessages((prev) =>
          prev.some((m) => m.id === message.id) ? prev : [...prev, message]
        );
        setContent("");
        setReplyTarget(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除这条留言吗？")) return;
    // 乐观更新：删除成功直接从本地移除，不等接口重新拉取
    setMessages((prev) => prev.filter((m) => m.id !== id));
    if (replyTarget?.id === id) setReplyTarget(null);
    const res = await fetch(`/api/messages/${id}`, { method: "DELETE" });
    if (!res.ok) {
      // 删失败了就重新拉一次，把那条放回来
      fetchMessages();
    }
  };

  // 被引用 ID → 原消息对象；原消息被删后（reply_to 置空）引用块随之消失
  const findMessage = (id?: number | null) =>
    id != null ? messages.find((m) => m.id === id) ?? null : null;

  const startReply = (m: Message) => {
    setReplyTarget(m);
    setActionTarget(null);
    inputRef.current?.focus();
  };

  return (
    <div className="h-dvh flex flex-col relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed opacity-15 pointer-events-none"
        style={{ backgroundImage: "url(/backgrounds/three.webp)" }}
      />

      {/* pb-16 给底部固定导航留出 64px，输入栏由此进入正常文档流，高度链条完整 */}
      <div className="relative z-10 flex flex-col flex-1 min-h-0 pb-16">
        <header className="text-center pt-8 pb-4 px-4 shrink-0">
          <h1 className="text-2xl font-bold text-gray-800">💌 留言板</h1>
          <p className="text-xs text-gray-400 mt-1">
            给对方写张小纸条吧 · 长按留言可回复
          </p>
        </header>

        {/* min-h-0 是关键：没有它 flex 子项会被内容撑开，overflow-y-auto 失效 */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-2">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-4xl mb-3">💌</p>
              <p className="text-gray-400 text-sm">还没有留言</p>
              <p className="text-gray-400 text-sm">在下方写下第一句话吧</p>
            </div>
          ) : (
            messages.map((m) => {
              const original = findMessage(m.reply_to);
              return (
                <MessageBubble
                  key={m.id}
                  content={m.content}
                  author={m.author}
                  created_at={m.created_at}
                  replyTo={
                    original
                      ? { author: original.author, content: original.content }
                      : null
                  }
                  onLongPress={() => setActionTarget(m)}
                />
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div className="shrink-0 px-4 py-3 bg-white/90 backdrop-blur-md border-t border-rose-100">
          {/* 微信式回复栏：回复谁一目了然，点 ✕ 取消 */}
          {replyTarget && (
            <div className="flex items-center justify-between gap-2 mb-2 pl-3 py-1.5 rounded-lg bg-rose-50 border-l-2 border-rose-400">
              <div className="min-w-0">
                <p className="text-[11px] text-rose-500 font-medium">
                  回复 {replyTarget.author === "她" ? "💗 盛雨轩" : "💙 侯竣译"}
                </p>
                <p className="text-[11px] text-gray-500 truncate">
                  {replyTarget.content}
                </p>
              </div>
              <button
                onClick={() => setReplyTarget(null)}
                className="shrink-0 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          )}
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
              ref={inputRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={replyTarget ? "写下你的回复..." : "写点什么..."}
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

      {/* 长按操作弹层（微信风格） */}
      {actionTarget && (
        <div
          className="fixed inset-0 z-40 bg-black/40 flex items-end"
          onClick={() => setActionTarget(null)}
        >
          <div
            className="w-full bg-white rounded-t-2xl pb-20 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-center text-xs text-gray-400 pt-4 pb-2 px-6 truncate">
              「{actionTarget.content}」
            </p>
            <button
              onClick={() => startReply(actionTarget)}
              className="w-full py-3.5 text-sm text-gray-800 active:bg-gray-50 flex items-center justify-center gap-2"
            >
              ↩︎ 回复
            </button>
            <div className="h-px bg-gray-100" />
            <button
              onClick={() => {
                const id = actionTarget.id;
                setActionTarget(null);
                handleDelete(id);
              }}
              className="w-full py-3.5 text-sm text-red-500 active:bg-red-50 flex items-center justify-center gap-2"
            >
              🗑 删除
            </button>
            <div className="h-2 bg-gray-50" />
            <button
              onClick={() => setActionTarget(null)}
              className="w-full py-3.5 text-sm text-gray-500 active:bg-gray-50"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <Nav />
    </div>
  );
}
