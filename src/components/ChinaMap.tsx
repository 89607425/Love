"use client";

import { useCallback, useEffect, useRef } from "react";
import { groupByCity } from "@/lib/cities";
import type { Memory } from "@/lib/db";

type EChartsInstance = {
  setOption: (option: Record<string, unknown>, notMerge?: boolean) => void;
  resize: () => void;
  dispose: () => void;
  on: (event: string, handler: (params: any) => void) => void;
  off: (event: string, handler: (params: any) => void) => void;
};

let geoJsonCache: Promise<unknown> | null = null;
let hasGeo = false;

function loadGeoJson() {
  if (!geoJsonCache) {
    geoJsonCache = fetch("/china.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("geo 加载失败"))))
      .catch((err) => {
        geoJsonCache = null;
        throw err;
      });
  }
  return geoJsonCache;
}

function buildOption(
  memories: Memory[],
  highlightCity: string | null,
  el: HTMLElement
) {
  const width = el.clientWidth || 1;
  const height = el.clientHeight || 1;
  const aspect = width / height;
  const landscape = aspect > 1.15;

  const groups = groupByCity(memories);

  const provCount: Record<string, number> = {};
  groups.forEach((g) => {
    if (!g.coord || !g.province) return;
    provCount[g.province] = (provCount[g.province] || 0) + 1;
  });

  const scatterData = groups
    .filter((g) => g.coord)
    .map((g) => {
      const coords = g.coord!;
      const active = highlightCity === g.city;
      return {
        name: g.city,
        value: [coords[0], coords[1], g.memories.length],
        itemStyle: active ? { color: "#9f1239" } : undefined,
        symbolSize: active
          ? landscape
            ? [32, 44]
            : [34, 48]
          : landscape
            ? [26, 36]
            : [28, 40],
      };
    });

  const regions = Object.keys(provCount).map((prov) => ({
    name: prov,
    itemStyle: { areaColor: "#fda4af" },
    label: { show: true, fontSize: 10, color: "#be123c" },
  }));

  const showLabels = landscape || scatterData.length <= 12;

  const scatterSeries = scatterData.length
    ? {
        type: "effectScatter",
        data: scatterData,
        coordinateSystem: hasGeo ? "geo" : undefined,
        symbol: "pin",
        symbolSize: landscape ? [26, 36] : [28, 40],
        showEffectOn: "render",
        rippleEffect: { brushType: "stroke", scale: landscape ? 2 : 2.5 },
        itemStyle: { color: "#e11d48" },
        label: {
          show: showLabels,
          formatter: "{b}",
          position: "bottom",
          distance: landscape ? 14 : 18,
          fontSize: landscape ? 11 : 10,
          color: "#1f2937",
          fontWeight: "bold",
        },
        labelLayout: { hideOverlap: true },
        emphasis: { scale: 1.5, itemStyle: { color: "#be123c" } },
      }
    : undefined;

  const option: Record<string, unknown> = {
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

  if (hasGeo) {
    option.geo = {
      map: "china",
      roam: true,
      zoom: landscape ? Math.min(2.4, Math.max(1.7, aspect * 1.45)) : 1.2,
      scaleLimit: { min: 1, max: 8 },
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

  return option;
}

export interface ChinaMapProps {
  memories: Memory[];
  highlightCity?: string | null;
  onSelectCity: (city: string, mems: Memory[]) => void;
  className?: string;
  style?: React.CSSProperties;
}

export default function ChinaMap({
  memories,
  highlightCity = null,
  onSelectCity,
  className,
  style,
}: ChinaMapProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<EChartsInstance | null>(null);
  const memoriesRef = useRef(memories);
  const highlightRef = useRef(highlightCity);
  const callbackRef = useRef(onSelectCity);

  memoriesRef.current = memories;
  highlightRef.current = highlightCity;
  callbackRef.current = onSelectCity;

  const render = useCallback(() => {
    const el = chartRef.current;
    const instance = chartInstance.current;
    if (!el || !instance) return;
    instance.resize();
    instance.setOption(buildOption(memoriesRef.current, highlightRef.current, el), true);
  }, []);

  useEffect(() => {
    let disposed = false;
    let ro: ResizeObserver | null = null;
    let rafId = 0;

    const handleClick = (params: any) => {
      if (params.seriesType !== "effectScatter" || !params.data) return;
      const city = params.name;
      const hit = groupByCity(memoriesRef.current).find((g) => g.city === city);
      callbackRef.current(city, hit?.memories ?? []);
    };

    (async () => {
      if (!chartRef.current) return;
      const echarts = await import("echarts");
      if (disposed || !chartRef.current) return;

      const instance = echarts.init(chartRef.current, undefined, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      }) as unknown as EChartsInstance;
      chartInstance.current = instance;

      try {
        const geoJson = await loadGeoJson();
        if (disposed) return;
        (echarts as any).registerMap("china", geoJson);
        hasGeo = true;
      } catch {
        console.warn("中国地图 GeoJSON 加载失败，使用简化视图");
      }
      if (disposed) return;

      instance.on("click", handleClick);
      instance.setOption(
        buildOption(memoriesRef.current, highlightRef.current, chartRef.current),
        true
      );

      const schedule = () => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          rafId = 0;
          if (disposed) return;
          render();
        });
      };

      ro = new ResizeObserver(schedule);
      ro.observe(chartRef.current);
      window.addEventListener("resize", schedule);
      window.addEventListener("orientationchange", schedule);
      (instance as any).__cleanup = () => {
        ro?.disconnect();
        window.removeEventListener("resize", schedule);
        window.removeEventListener("orientationchange", schedule);
      };
    })();

    return () => {
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      (chartInstance.current as any)?.__cleanup?.();
      chartInstance.current?.off("click", handleClick);
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [render]);

  useEffect(() => {
    if (!chartInstance.current) return;
    render();
  }, [memories, highlightCity, render]);

  return <div ref={chartRef} className={className} style={style} />;
}
