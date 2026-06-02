"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/calendar", label: "日历", icon: "📅" },
  { href: "/timeline", label: "时光轴", icon: "🖼️" },
  { href: "/messages", label: "留言板", icon: "💌" },
  { href: "/wishes", label: "愿望", icon: "⭐" },
  { href: "/footprints", label: "足迹", icon: "🗺️" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-rose-100 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
                isActive
                  ? "text-rose-500"
                  : "text-gray-400 hover:text-rose-400"
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
