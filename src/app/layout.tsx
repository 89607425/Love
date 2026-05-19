import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "我们的回忆",
  description: "专属我们的美好回忆",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full bg-rose-50/30 text-gray-800 antialiased">
        <div className="max-w-lg mx-auto min-h-screen bg-white/60 backdrop-blur-sm shadow-sm">
          {children}
        </div>
      </body>
    </html>
  );
}
