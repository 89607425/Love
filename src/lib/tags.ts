export const TAG_PRESETS = [
  { tag: "纪念日", emoji: "🎉", bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", activeBg: "bg-amber-100", calendarBg: "bg-orange-200", calendarText: "text-orange-700" },
  { tag: "开心", emoji: "😊", bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200", activeBg: "bg-rose-100", calendarBg: "bg-rose-200", calendarText: "text-rose-700" },
  { tag: "难过", emoji: "😢", bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", activeBg: "bg-blue-100", calendarBg: "bg-blue-100", calendarText: "text-blue-700" },
  { tag: "爱你", emoji: "❤️", bg: "bg-pink-100", text: "text-pink-600", border: "border-pink-200", activeBg: "bg-pink-200", calendarBg: "bg-rose-300", calendarText: "text-rose-800" },
  { tag: "讨厌你", emoji: "😤", bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200", activeBg: "bg-purple-100", calendarBg: "bg-purple-100", calendarText: "text-purple-700" },
  { tag: "想你", emoji: "💭", bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200", activeBg: "bg-gray-100", calendarBg: "bg-gray-200", calendarText: "text-gray-700" },
] as const;

export function getTagStyle(tag: string) {
  const preset = TAG_PRESETS.find((p) => p.tag === tag);
  return preset || { emoji: "🏷️", bg: "bg-rose-50", text: "text-rose-500" };
}

const TAG_PRIORITY: Record<string, number> = { "讨厌你": 1, "难过": 2, "想你": 3, "开心": 4, "爱你": 5, "纪念日": 6 };

export function pickHighestPriorityTag(tags: string[]): string | null {
  if (tags.length === 0) return null;
  if (tags.length === 1) return tags[0];
  return tags.reduce((best, tag) =>
    (TAG_PRIORITY[tag] || 0) > (TAG_PRIORITY[best] || 0) ? tag : best
  );
}

export function getCalendarColor(tag: string | null | undefined): string {
  if (!tag) return "bg-rose-100 text-rose-600";
  const preset = TAG_PRESETS.find((p) => p.tag === tag);
  if (!preset) return "bg-rose-100 text-rose-600";
  return `${preset.calendarBg} ${preset.calendarText}`;
}
