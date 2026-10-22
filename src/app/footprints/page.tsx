"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Nav from "@/components/Nav";
import ChinaMap from "@/components/ChinaMap";
import { groupByCity } from "@/lib/cities";
import { Memory } from "@/lib/db";

export default function FootprintsPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [cityMemories, setCityMemories] = useState<Memory[]>([]);
  const [highlightCity, setHighlightCity] = useState<string | null>(null);
  const [landscape, setLandscape] = useState(false);
  const [isPortrait, setIsPortrait] = useState(true);
  const cityListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/memories")
      .then((r) => r.json())
      .then((allMemories: Memory[]) => {
        setMemories(allMemories.filter((m) => m.location));
      });
  }, []);

  useEffect(() => {
    if (!selectedCity || !cityListRef.current) return;
    const el = cityListRef.current.querySelector(
      `[data-city="${selectedCity.replace(/"/g, '\\"')}"]`
    );
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedCity]);

  // 竖屏 / 横屏判定：用于决定横屏遮罩是否需要把内容旋转 90°
  useEffect(() => {
    const mq = window.matchMedia("(orientation: portrait)");
    const sync = () => setIsPortrait(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    window.addEventListener("resize", sync);
    return () => {
      mq.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  useEffect(() => {
    if (!landscape) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [landscape]);

  const handleCityClick = useCallback((city: string, mems: Memory[]) => {
    setSelectedCity(city);
    setCityMemories(mems);
    setHighlightCity(city);
  }, []);

  const handleModalClose = useCallback(() => {
    setSelectedCity(null);
    setCityMemories([]);
  }, []);

  const openLandscape = async () => {
    setLandscape(true);
    // 渐进增强：Android Chrome 支持，iOS Safari 会静默失败，不影响主流程
    try {
      await document.documentElement.requestFullscreen?.();
      await (screen.orientation as any)?.lock?.("landscape");
    } catch {
      /* 不支持则退化为页面内旋转 */
    }
  };

  const closeLandscape = async () => {
    setLandscape(false);
    try {
      (screen.orientation as any)?.unlock?.();
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      /* 忽略 */
    }
  };

  const cities = groupByCity(memories);
  const unmatched = cities.filter((c) => !c.coord);

  return (
    <div className="h-dvh flex flex-col relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed opacity-10 pointer-events-none"
        style={{ backgroundImage: "url(/backgrounds/one.PNG)" }}
      />

      <div className="flex-1 overflow-y-auto relative z-10 pb-16">
        <header className="text-center pt-8 pb-4 px-4">
          <h1 className="text-2xl font-bold text-gray-800">🗺️ 我们的足迹</h1>
          <p className="text-xs text-gray-400 mt-1">
            {cities.length > 0
              ? `一起走过 ${cities.length} 座城市`
              : "记录回忆时添加地点，就会出现在这里"}
          </p>
        </header>

        <div className="px-4">
          <div
            className="w-full rounded-2xl border border-rose-100 shadow-sm bg-white overflow-hidden"
            style={{ height: isPortrait ? "420px" : "min(70dvh, 520px)" }}
          >
            <ChinaMap
              memories={memories}
              highlightCity={highlightCity}
              onSelectCity={handleCityClick}
              className="w-full h-full"
            />
          </div>

          <div className="flex justify-end mt-2">
            <button
              onClick={openLandscape}
              className="flex items-center gap-1.5 text-xs text-rose-500 bg-white border border-rose-100 rounded-full px-3 py-1.5 shadow-sm active:scale-95 transition-transform"
            >
              <span className="text-sm leading-none">⛶</span>
              横屏放大地图
            </button>
          </div>
        </div>

        {cities.length > 0 && (
          <div className="px-4 mt-6" ref={cityListRef}>
            <h3 className="text-sm font-semibold text-gray-500 mb-3">
              🏙️ 走过的城市
            </h3>
            {unmatched.length > 0 && (
              <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">
                ⚠️ {unmatched.length} 个地点暂时无法在地图上定位（很可能不在中国）
                ，它们仍在下方列表中：{unmatched.map((c) => c.city).join("、")}
              </p>
            )}
            <div className="space-y-2">
              {cities.map((c) => (
                <button
                  key={c.city}
                  data-city={c.city}
                  onClick={() => handleCityClick(c.city, c.memories)}
                  className={`w-full flex items-center justify-between rounded-xl p-4 shadow-sm border transition-all ${
                    highlightCity === c.city
                      ? "bg-rose-100 border-rose-300 ring-2 ring-rose-300"
                      : "bg-white border-rose-100 hover:bg-rose-50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl">{c.coord ? "📍" : "❔"}</span>
                    <div className="text-left min-w-0">
                      <div className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                        {c.city}
                        {c.province && (
                          <span className="text-[10px] text-gray-400 font-normal">
                            {c.province}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {c.memories
                          .map((m) => m.date)
                          .sort()
                          .join(" · ")}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-rose-500 bg-rose-50 px-2 py-1 rounded-full flex-shrink-0">
                    {c.memories.length} 条
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {landscape && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-white">
          <div
            className="relative"
            style={{
              width: isPortrait ? "100dvh" : "100vw",
              height: isPortrait ? "100vw" : "100dvh",
              transform: isPortrait ? "rotate(90deg)" : "none",
            }}
          >
            {isPortrait && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 text-[11px] text-gray-400 bg-white/80 px-2 py-1 rounded-full">
                请把手机横过来
              </div>
            )}
            <button
              onClick={closeLandscape}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 border border-rose-100 shadow-sm text-gray-500 text-lg leading-none active:scale-95 transition-transform"
            >
              ✕
            </button>
            <ChinaMap
              memories={memories}
              highlightCity={highlightCity}
              onSelectCity={handleCityClick}
              className="w-full h-full"
            />
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] text-gray-400 bg-white/80 px-2 py-1 rounded-full">
              {cities.length > 0 ? `共 ${cities.length} 座城市 · 可双指缩放` : "暂无地点记录"}
            </div>
          </div>
        </div>
      )}

      {selectedCity && cityMemories.length > 0 && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-2xl max-h-[80vh] overflow-y-auto p-6 animate-slide-up m-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                📍 {selectedCity}
              </h3>
              <button
                onClick={handleModalClose}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              共 {cityMemories.length} 条回忆
            </p>
            <div className="space-y-3">
              {cityMemories.map((m) => (
                <div
                  key={m.id}
                  className="bg-rose-50 rounded-xl p-4 border border-rose-100"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-rose-500">{m.date}</span>
                    <span className="text-xs font-medium text-rose-400 bg-white px-2 py-0.5 rounded-full">
                      {m.author === "他" ? "💙 他" : "💗 她"}
                    </span>
                  </div>
                  {m.content && (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mb-2">
                      {m.content}
                    </p>
                  )}
                  {m.images.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {m.images.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt=""
                          className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Nav />
    </div>
  );
}
