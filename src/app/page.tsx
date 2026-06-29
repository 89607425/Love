"use client";

import { useState } from "react";

export default function LoginPage() {
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = () => {
    if (answer === "0509") {
      document.cookie = "auth=0509; path=/; max-age=31536000";
      window.location.href = "/calendar";
    } else {
      setError(true);
      setAnswer("");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center px-6"
      style={{ backgroundImage: "url(/backgrounds/two.PNG)" }}
    >
      <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <p className="text-4xl mb-3">💕</p>
          <h1 className="text-xl font-bold text-gray-800">欢迎回来</h1>
        </div>

        <p className="text-sm text-gray-600 mb-4 text-center leading-relaxed">
          请问我们是哪一天在一起的？
          <br />
          <span className="text-xs text-gray-400">（0101 表示一月一日）</span>
        </p>

        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value.replace(/\D/g, "").slice(0, 4));
            setError(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && answer.length === 4) handleSubmit();
          }}
          placeholder="请输入四位数字"
          className={`w-full px-4 py-3 rounded-xl border-2 text-center text-lg tracking-widest outline-none transition-colors ${
            error
              ? "border-red-300 bg-red-50 text-red-500"
              : "border-gray-200 focus:border-rose-300 text-gray-700"
          }`}
        />

        {error && (
          <p className="text-xs text-red-400 text-center mt-2">答案不对，再想想哦～</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={answer.length !== 4}
          className="w-full mt-4 py-3 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          确认
        </button>
      </div>
    </div>
  );
}
