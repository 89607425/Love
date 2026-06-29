export const TAG_PRESETS = [
  { tag: "纪念日", emoji: "🎉", bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", activeBg: "bg-amber-100" },
  { tag: "开心", emoji: "😊", bg: "bg-green-50", text: "text-green-600", border: "border-green-200", activeBg: "bg-green-100" },
  { tag: "难过", emoji: "😢", bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", activeBg: "bg-blue-100" },
  { tag: "爱你", emoji: "❤️", bg: "bg-rose-50", text: "text-rose-500", border: "border-rose-200", activeBg: "bg-rose-100" },
  { tag: "讨厌你", emoji: "😤", bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200", activeBg: "bg-purple-100" },
  { tag: "想你", emoji: "💭", bg: "bg-pink-50", text: "text-pink-600", border: "border-pink-200", activeBg: "bg-pink-100" },
] as const;

export function getTagStyle(tag: string) {
  const preset = TAG_PRESETS.find((p) => p.tag === tag);
  return preset || { emoji: "🏷️", bg: "bg-rose-50", text: "text-rose-500" };
}
