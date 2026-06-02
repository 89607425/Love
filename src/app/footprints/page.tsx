"use client";

import { useState, useEffect, useRef } from "react";
import Nav from "@/components/Nav";
import { Memory } from "@/lib/db";
import { CITY_COORDS } from "@/lib/cities";

let echartsPromise: Promise<any> | null = null;

async function loadECharts() {
  if (echartsPromise) return echartsPromise;

  echartsPromise = (async () => {
    const echarts = await import("echarts");

    try {
      const res = await fetch(
        "https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json"
      );
      const geoJson = await res.json();
      echarts.registerMap("china", geoJson);
    } catch {
      console.warn("Failed to load China map geo data");
    }

    return echarts;
  })();

  return echartsPromise;
}

export default function FootprintsPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [cityMemories, setCityMemories] = useState<Memory[]>([]);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    fetch("/api/memories?locationsOnly=true")
      .then((r) => r.json())
      .then((locations: string[]) => {
        if (locations.length > 0) {
          const params = new URLSearchParams();
          params.set("locationsOnly", "1");
          return fetch("/api/memories");
        }
        return fetch("/api/memories");
      })
      .then((r) => r.json())
      .then((allMemories: Memory[]) => {
        const withLocation = allMemories.filter((m) => m.location);
        setMemories(withLocation);
        return withLocation;
      })
      .then((withLocation) => {
        initChart(withLocation);
      });
  }, []);

  const initChart = async (data: Memory[]) => {
    if (!chartRef.current || data.length === 0) return;

    const echarts = await loadECharts();

    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    const cityMap = new Map<string, Memory[]>();
    data.forEach((m) => {
      if (!cityMap.has(m.location)) cityMap.set(m.location, []);
      cityMap.get(m.location)!.push(m);
    });

    const scatterData = Array.from(cityMap.entries()).map(([city, mems]) => {
      const coords = CITY_COORDS[city] || [121.48, 31.22];
      return {
        name: city,
        value: [...coords, mems.length],
        memories: mems,
      };
    });

    chartInstance.current = echarts.init(chartRef.current);
    chartInstance.current.setOption({
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        formatter: (params: any) => {
          if (params.seriesType === "scatter" || params.seriesType === "effectScatter") {
            return `${params.name}<br/>📝 ${params.value[2]} 条回忆`;
          }
          return params.name;
        },
      },
      geo: {
        map: "china",
        roam: true,
        zoom: 1.2,
        center: [104.0, 35.0],
        label: { show: false },
        itemStyle: {
          areaColor: "#fdf2f8",
          borderColor: "#f9a8d4",
        },
        emphasis: {
          itemStyle: {
            areaColor: "#fce7f3",
          },
        },
      },
      series: [
        {
          type: "effectScatter",
          coordinateSystem: "geo",
          data: scatterData.map((d) => ({
            name: d.name,
            value: d.value,
          })),
          symbolSize: (val: number[]) => Math.min(val[2] * 8 + 8, 40),
          showEffectOn: "render",
          rippleEffect: {
            brushType: "stroke",
            scale: 3,
          },
          itemStyle: {
            color: "#f43f5e",
          },
          label: {
            show: true,
            formatter: "{b}",
            position: "right",
            fontSize: 11,
            color: "#374151",
          },
          emphasis: {
            scale: 2,
          },
        },
      ],
    });

    chartInstance.current.on("click", (params: any) => {
      if (params.seriesType === "effectScatter" && params.data) {
        const city = params.name;
        const item = scatterData.find((d) => d.name === city);
        if (item) {
          setSelectedCity(city);
          setCityMemories(item.memories);
        }
      }
    });
  };

  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
      }
    };
  }, []);

  const cities = (() => {
    const map = new Map<string, Memory[]>();
    memories.forEach((m) => {
      if (!map.has(m.location)) map.set(m.location, []);
      map.get(m.location)!.push(m);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  })();

  return (
    <div className="flex flex-col flex-1 pb-20 min-h-screen relative">
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed opacity-10 pointer-events-none"
        style={{ backgroundImage: "url(/backgrounds/one.PNG)" }}
      />

      <div className="relative z-10">
        <header className="text-center pt-8 pb-4 px-4">
          <h1 className="text-2xl font-bold text-gray-800">🗺️ 我们的足迹</h1>
          <p className="text-xs text-gray-400 mt-1">
            一起走过 {cities.length} 座城市
          </p>
        </header>

        <div className="px-4">
          <div
            ref={chartRef}
            className="w-full rounded-2xl border border-rose-100 shadow-sm bg-white"
            style={{ height: "420px" }}
          />

          {memories.length === 0 && (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🗺️</p>
              <p className="text-gray-400 text-sm">还没有去过的地方</p>
              <p className="text-gray-400 text-sm">记录回忆时添加地点，就会出现在这里</p>
            </div>
          )}
        </div>

        {selectedCity && cityMemories.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[80vh] overflow-y-auto p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  📍 {selectedCity}
                </h3>
                <button
                  onClick={() => {
                    setSelectedCity(null);
                    setCityMemories([]);
                  }}
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
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-rose-500">{m.date}</span>
                        <span className="text-xs font-medium text-rose-400 bg-white px-2 py-0.5 rounded-full">
                          {m.author === "他" ? "💙 他" : "💗 她"}
                        </span>
                      </div>
                      {m.tags.length > 0 && (
                        <div className="flex gap-1">
                          {m.tags.map((t) => (
                            <span
                              key={t}
                              className="text-[10px] text-rose-400 bg-white px-1.5 py-0.5 rounded-full"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {m.content && (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
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

        {cities.length > 0 && (
          <div className="px-4 mt-6">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">
              🏙️ 走过的城市
            </h3>
            <div className="space-y-2">
              {cities.map(([city, mems]) => (
                <button
                  key={city}
                  onClick={() => {
                    setSelectedCity(city);
                    setCityMemories(mems);
                  }}
                  className="w-full flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-rose-100 hover:bg-rose-50 transition-colors"
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

      <Nav />
    </div>
  );
}
