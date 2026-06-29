"use client";

import { useState, useRef, useMemo } from "react";
import { Memory } from "@/lib/db";
import { CHINA_CITIES } from "@/lib/cities";
import { TAG_PRESETS } from "@/lib/tags";

interface Props {
  date: string;
  memory?: Memory | null;
  onSave: (data: {
    date: string;
    content: string;
    images: string[];
    tags: string[];
    author: string;
    location: string;
    id?: number;
  }) => void;
  onClose: () => void;
}

const MAX_SIZE = 20 * 1024 * 1024;
const IMAGE_MAX_DIMENSION = 1200;
const IMAGE_QUALITY = 0.75;

function compressImage(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > IMAGE_MAX_DIMENSION || height > IMAGE_MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * IMAGE_MAX_DIMENSION) / width);
          width = IMAGE_MAX_DIMENSION;
        } else {
          width = Math.round((width * IMAGE_MAX_DIMENSION) / height);
          height = IMAGE_MAX_DIMENSION;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas 不可用")); return; }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", IMAGE_QUALITY));
    };
    img.onerror = () => reject(new Error("图片加载失败"));
    img.src = dataUrl;
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_SIZE) {
      reject(new Error(`图片 ${file.name} 超过 20MB，请选择更小的图片`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      compressImage(reader.result as string).then(resolve).catch(reject);
    };
    reader.onerror = () => reject(new Error("读取图片失败"));
    reader.readAsDataURL(file);
  });
}

export default function MemoryForm({ date, memory, onSave, onClose }: Props) {
  const [content, setContent] = useState(memory?.content || "");
  const [existingImages, setExistingImages] = useState<string[]>(memory?.images || []);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [tags, setTags] = useState<string[]>(memory?.tags || []);
  const [author, setAuthor] = useState(memory?.author || "他");
  const [location, setLocation] = useState(memory?.location || "");
  const [locationInput, setLocationInput] = useState(memory?.location || "");
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);

  const locationSuggestions = useMemo(() => {
    if (!locationInput.trim()) return [] as string[];
    const q = locationInput.trim().toLowerCase();
    return CHINA_CITIES.filter((c) => c.toLowerCase().includes(q)).slice(0, 8);
  }, [locationInput]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setPendingFiles((prev) => [...prev, ...Array.from(files)]);
    e.target.value = "";
  };

  const removeExistingImage = (idx: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const removePendingFile = (idx: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const selectLocation = (city: string) => {
    setLocation(city);
    setLocationInput(city);
    setShowLocationSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    let newImageUrls: string[] = [];

    if (pendingFiles.length > 0) {
      try {
        const results = await Promise.all(pendingFiles.map(fileToDataUrl));
        newImageUrls = results;
      } catch (err) {
        setError(err instanceof Error ? err.message : "图片处理失败");
        setSubmitting(false);
        return;
      }
    }

    onSave({
      date,
      content,
      images: [...existingImages, ...newImageUrls],
      tags,
      author,
      location: location || locationInput,
      id: memory?.id,
    });

    setSubmitting(false);
  };

  const pendingPreviews = pendingFiles.map((f) => URL.createObjectURL(f));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-2xl max-h-[80vh] overflow-y-auto p-6 animate-slide-up"
        style={{ overscrollBehavior: "contain" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {memory ? "编辑回忆" : "记录回忆"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-rose-500 mb-4">{date}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              记录人
            </label>
            <div className="flex gap-2">
              {["侯竣译", "盛雨轩"].map((name, i) => {
                const who = i === 0 ? "他" : "她";
                return (
                  <button
                    key={who}
                    type="button"
                    onClick={() => setAuthor(who)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      author === who
                        ? "bg-rose-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {who === "他" ? "💙 " : "💗 "}{name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              回忆内容
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="记录今天的美好..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 outline-none resize-none text-sm"
            />
          </div>

          <div className="relative" ref={locationRef}>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              📍 地点
            </label>
            <input
              value={locationInput}
              onChange={(e) => {
                setLocationInput(e.target.value);
                setLocation("");
                setShowLocationSuggestions(true);
              }}
              onFocus={() => setShowLocationSuggestions(true)}
              onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
              placeholder="选择或输入城市名称..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 outline-none text-sm"
            />
            {showLocationSuggestions && locationSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                {locationSuggestions.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onMouseDown={() => selectLocation(city)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                  >
                    📍 {city}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              图片
            </label>
            {(existingImages.length > 0 || pendingFiles.length > 0) && (
              <div className="flex flex-wrap gap-2 mb-2">
                {existingImages.map((img, idx) => (
                  <div key={`existing-${idx}`} className="relative">
                    <img
                      src={img}
                      alt=""
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(idx)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {pendingPreviews.map((preview, idx) => (
                  <div key={`pending-${idx}`} className="relative">
                    <img
                      src={preview}
                      alt=""
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removePendingFile(idx)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-rose-300 hover:text-rose-500 transition-colors"
            >
              📷 点击选择图片 (已选 {pendingFiles.length} 张，自动压缩)
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              标签（多选）
            </label>
            <div className="flex flex-wrap gap-2">
              {TAG_PRESETS.map((preset) => {
                const selected = tags.includes(preset.tag);
                return (
                  <button
                    key={preset.tag}
                    type="button"
                    onClick={() => toggleTag(preset.tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95 ${
                      selected
                        ? `${preset.bg} ${preset.text} ${preset.border} shadow-sm`
                        : "bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {preset.emoji} {preset.tag}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors disabled:opacity-50"
          >
            {submitting ? "保存中..." : memory ? "💾 保存修改" : "💕 记录这一刻"}
          </button>
        </form>
      </div>
    </div>
  );
}
