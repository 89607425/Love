"use client";

import { useRef } from "react";

export interface ReplyPreview {
  author: string;
  content: string;
}

interface Props {
  content: string;
  author: string;
  created_at: string;
  replyTo?: ReplyPreview | null;
  onLongPress: () => void;
}

/** 微信式引用块：点击可跳回原留言（由父层处理），这里只负责展示 */
function QuoteBlock({ replyTo }: { replyTo: ReplyPreview }) {
  return (
    <div className="mb-1.5 rounded-lg bg-black/5 px-2.5 py-1.5 border-l-2 border-current/30">
      <p className="text-[11px] font-medium opacity-70">
        {replyTo.author === "她" ? "💗 盛雨轩" : "💙 侯竣译"}
      </p>
      <p className="text-[11px] opacity-60 line-clamp-2 break-all">
        {replyTo.content}
      </p>
    </div>
  );
}

export default function MessageBubble({
  content,
  author,
  created_at,
  replyTo,
  onLongPress,
}: Props) {
  // created_at 是 UTC ISO 字符串（服务端时区），必须做时区转换再显示；
  // 固定 Asia/Shanghai，不跟随设备时区，两人在哪看都是北京时间
  const tz = { timeZone: "Asia/Shanghai" } as const;
  const date =
    new Date(created_at).toLocaleDateString("en-CA", tz) + // "2026-11-14"
    " " +
    new Date(created_at).toLocaleTimeString("zh-CN", {
      ...tz,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
  const isHer = author === "她";
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startPress = () => {
    timer.current = setTimeout(() => onLongPress(), 500);
  };
  const cancelPress = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  return (
    <div className={`flex ${isHer ? "justify-end" : "justify-start"} mb-3`}>
      <div className="max-w-[75%]">
        <div
          className={`flex items-center gap-1.5 mb-1 px-1 ${
            isHer ? "justify-end" : "justify-start"
          }`}
        >
          <span className="text-[10px] font-medium text-gray-500">
            {isHer ? "💗 盛雨轩" : "💙 侯竣译"}
          </span>
          <span className="text-[10px] text-gray-400">{date}</span>
        </div>
        {/* 长按 500ms 弹出操作菜单；桌面端右键等效；select-none 防止长按触发系统选字 */}
        <div
          onPointerDown={startPress}
          onPointerUp={cancelPress}
          onPointerLeave={cancelPress}
          onPointerCancel={cancelPress}
          onContextMenu={(e) => {
            e.preventDefault();
            onLongPress();
          }}
          className={`relative px-4 py-2.5 rounded-2xl text-sm select-none cursor-pointer active:scale-[0.98] transition-transform ${
            isHer
              ? "bg-pink-100 text-pink-800 rounded-br-md"
              : "bg-blue-100 text-blue-800 rounded-bl-md"
          }`}
        >
          {replyTo && <QuoteBlock replyTo={replyTo} />}
          <p className="whitespace-pre-wrap break-words">{content}</p>
        </div>
      </div>
    </div>
  );
}
