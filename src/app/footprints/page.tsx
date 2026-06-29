"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Nav from "@/components/Nav";
import { Memory } from "@/lib/db";
import { CITY_COORDS, CITY_PROVINCE } from "@/lib/cities";

export default function FootprintsPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [cityMemories, setCityMemories] = useState<Memory[]>([]);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<any>(null);
  const hasGeoRef = useRef(false);
  const [geoReady, setGeoReady] = useState(false);
  const cityListRef = useRef<HTMLDivElement>(null);
  const [highlightCity, setHighlightCity] = useState<string | null>(null);

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
      `[data-city="${selectedCity.replace(/"/g, "\\\"")}"]`
    );
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedCity]);

  const handleCityClick = useCallback((city: string, mems: Memory[]) => {
    setSelectedCity(city);
    setCityMemories(mems);
    setHighlightCity(city);
  }, []);

  const handleModalClose = useCallback(() => {
    setSelectedCity(null);
    setCityMemories([]);
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    let cancelled = false;

    (async () => {
      const echarts = await import("echarts");
      if (cancelled || !chartRef.current) return;

      chartInstance.current = echarts.init(chartRef.current);

      try {
        const res = await fetch("/china.json");
        if (res.ok) {
          const geoJson = await res.json();
          echarts.registerMap("china", geoJson);
          hasGeoRef.current = true;
        }
      } catch {
        console.warn("中国地图 GeoJSON 加载失败，使用简化视图");
      }

      setGeoReady(true);

      chartInstance.current.on("click", (params: any) => {
        if (params.seriesType === "effectScatter" && params.data) {
          const city = params.name;
          const locMemories = memories.filter((m) => m.location === city);
          setSelectedCity(city);
          setCityMemories(locMemories);
          setHighlightCity(city);
        }
      });

      const handleResize = () => chartInstance.current?.resize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    })();

    return () => {
      cancelled = true;
      chartInstance.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (!chartInstance.current || !geoReady) return;

    const cityMap = new Map<string, Memory[]>();
    const provCount: Record<string, number> = {};
    memories.forEach((m) => {
      if (!cityMap.has(m.location)) cityMap.set(m.location, []);
      cityMap.get(m.location)!.push(m);
      const prov = CITY_PROVINCE[m.location];
      if (prov) provCount[prov] = (provCount[prov] || 0) + 1;
    });

    const scatterData = Array.from(cityMap.entries())
      .filter(([city]) => CITY_COORDS[city])
      .map(([city, mems]) => {
        const coords = CITY_COORDS[city];
        return { name: city, value: [...coords, mems.length] };
      });

    const regions = Object.keys(provCount).map((prov) => ({
      name: prov,
      itemStyle: { areaColor: "#fda4af" },
      label: { show: true, fontSize: 10, color: "#be123c" },
    }));

    const scatterSeries = scatterData.length > 0
      ? {
          type: "effectScatter",
          data: scatterData,
          coordinateSystem: hasGeoRef.current ? "geo" : undefined,
          symbol: "pin",
          symbolSize: [28, 40],
          showEffectOn: "render",
          rippleEffect: { brushType: "stroke", scale: 2.5 },
          itemStyle: { color: "#e11d48" },
          label: {
            show: true,
            formatter: "{b}",
            position: "bottom",
            distance: 18,
            fontSize: 10,
            color: "#1f2937",
            fontWeight: "bold",
          },
          emphasis: { scale: 1.5, itemStyle: { color: "#be123c" } },
        }
      : undefined;

    const option: any = {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        formatter: (params: any) => {
          if (params.seriesType === "effectScatter") {
            return `${params.name}<br/>📝 ${params.value[2]} 条回忆`;
          }
          return params.name;
        },
      },
      series: scatterSeries ? [scatterSeries] : [],
    };

    if (hasGeoRef.current) {
      option.geo = {
        map: "china",
        roam: true,
        zoom: 1.2,
        center: [104.0, 35.0],
        label: { show: false },
        itemStyle: { areaColor: "#f5f5f5", borderColor: "#e5e7eb" },
        emphasis: {
          label: { show: true, fontSize: 12, color: "#333" },
          itemStyle: { areaColor: "#fce7f3" },
        },
        regions,
      };
    }

    chartInstance.current.setOption(option, true);
  }, [memories, geoReady]);

  const cities = (() => {
    const map = new Map<string, Memory[]>();
    memories.forEach((m) => {
      if (!map.has(m.location)) map.set(m.location, []);
      map.get(m.location)!.push(m);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  })();

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
            ref={chartRef}
            className="w-full rounded-2xl border border-rose-100 shadow-sm bg-white"
            style={{ height: "420px" }}
          />
        </div>

        {cities.length > 0 && (
          <div className="px-4 mt-6" ref={cityListRef}>
            <h3 className="text-sm font-semibold text-gray-500 mb-3">
              🏙️ 走过的城市
            </h3>
            <div className="space-y-2">
              {cities.map(([city, mems]) => (
                <button
                  key={city}
                  data-city={city}
                  onClick={() => handleCityClick(city, mems)}
                  className={`w-full flex items-center justify-between rounded-xl p-4 shadow-sm border transition-all ${
                    highlightCity === city
                      ? "bg-rose-100 border-rose-300 ring-2 ring-rose-300"
                      : "bg-white border-rose-100 hover:bg-rose-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📍</span>
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-800">
                        {city}
                      </div>
                      <div className="text-xs text-gray-400">
                        {mems.map((m) => m.date).sort().join(" · ")}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-rose-500 bg-rose-50 px-2 py-1 rounded-full">
                    {mems.length} 条
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedCity && cityMemories.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
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
