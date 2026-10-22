import { GENERATED_CITIES } from "./cities.generated";
import type { Memory } from "./db";

/**
 * 城市数据对外接口。
 *
 * 真源是 cities.generated.ts（由 scripts/gen-cities.mjs 生成，勿手改）。
 * 这里负责归一化匹配、检索，以及兼容旧导出名。
 */

export interface CityInfo {
  name: string;
  full: string;
  province: string;
  adcode: number;
  coord: [number, number];
  scenic?: boolean;
  py: string;
  ip: string;
}

export const CITY_LIST: CityInfo[] = GENERATED_CITIES.map((c) => ({
  name: c.n,
  full: c.f,
  province: c.p,
  adcode: c.a,
  coord: c.c,
  scenic: c.s === 1,
  py: c.py,
  ip: c.ip,
}));

const ETHNIC_STEMS = [
  "维吾尔", "哈萨克", "柯尔克孜", "乌孜别克", "塔吉克", "达斡尔", "鄂温克", "鄂伦春", "塔塔尔",
  "布依", "朝鲜", "土家", "哈尼", "傈僳", "拉祜", "纳西", "景颇", "仫佬", "撒拉", "毛南",
  "仡佬", "阿昌", "普米", "布朗", "德昂", "独龙", "门巴", "珞巴", "基诺", "裕固", "保安",
  "东乡", "俄罗斯", "赫哲", "锡伯", "高山", "蒙古", "回", "藏", "苗", "彝", "壮", "满",
  "侗", "瑶", "白", "傣", "黎", "佤", "畲", "水", "羌", "怒", "土", "京",
].sort((a, b) => b.length - a.length);

const ETHNIC_RE = new RegExp(
  `(?:(?:${ETHNIC_STEMS.join("|")})族?)+(?:自治州|自治县|自治旗)$`
);
const SUFFIX_RE = /(?:自治州|自治县|自治旗|地区|盟|市|县|旗|林区|新区|特别行政区)$/;

/** 常见别称 / 口语写法 -> 标准名 */
const ALIASES: Record<string, string> = {
  呼市: "呼和浩特",
  青城: "呼和浩特",
  冰城: "哈尔滨",
  春城: "昆明",
  羊城: "广州",
  鹏城: "深圳",
  魔都: "上海",
  沪: "上海",
  京城: "北京",
  燕京: "北京",
  蓉城: "成都",
  榕城: "福州",
  泉城: "济南",
  岛城: "青岛",
  日光城: "拉萨",
  版纳: "西双版纳",
  阿坝州: "阿坝",
  甘孜州: "甘孜",
  凉山州: "凉山",
  延吉: "延边",
};

function normalizeKey(raw: string): string {
  let key = String(raw || "").trim();
  key = key.replace(/[\s\u3000]/g, "");
  key = key.replace(/[！-～]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
  );
  key = key.replace(ETHNIC_RE, "");
  key = key.replace(SUFFIX_RE, "");
  return key;
}

/** 索引：简称、全称、去后缀别名都指向同一条记录 */
const INDEX = new Map<string, CityInfo>();
const addKey = (key: string, city: CityInfo) => {
  if (!key || INDEX.has(key)) return;
  INDEX.set(key, city);
};

for (const city of CITY_LIST) {
  INDEX.set(city.name, city);
  if (city.full !== city.name) {
    addKey(city.full, city);
    addKey(normalizeKey(city.full), city);
  }
  addKey(normalizeKey(city.name), city);
  if (city.scenic) INDEX.set(city.name, city);
}

for (const [alias, target] of Object.entries(ALIASES)) {
  const city = INDEX.get(target);
  if (city) addKey(alias, city);
}

/** 兼容旧导出：简称与全称两种键都可查 */
export const CITY_COORDS: Record<string, [number, number]> = {};
export const CITY_PROVINCE: Record<string, string> = {};

for (const city of CITY_LIST) {
  CITY_COORDS[city.name] = city.coord;
  CITY_PROVINCE[city.name] = city.province;
  if (city.full !== city.name) {
    CITY_COORDS[city.full] = city.coord;
    CITY_PROVINCE[city.full] = city.province;
  }
}

/** 搜索候选：只列标准简称，避免下拉里同时出现「沈阳」和「沈阳市」 */
export const CHINA_CITIES: string[] = CITY_LIST.map((c) => c.name);

export function resolveCity(raw: string): CityInfo | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  const direct = INDEX.get(trimmed);
  if (direct) return direct;
  return INDEX.get(normalizeKey(trimmed)) ?? null;
}

export interface CityHit {
  city: CityInfo;
  score: number;
}

/** 支持汉字、全拼、拼音首字母三种输入 */
export function searchCities(query: string, limit = 8): CityHit[] {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return [];
  const hits: CityHit[] = [];

  for (const city of CITY_LIST) {
    const lower = city.name.toLowerCase();
    let score = Infinity;
    if (city.name === q || city.full === q) score = 0;
    else if (lower.startsWith(q)) score = 1;
    else if (city.ip === q) score = 2;
    else if (city.py.startsWith(q)) score = 3;
    else if (lower.includes(q)) score = 4;
    else if (city.full.toLowerCase().includes(q)) score = 5;
    if (score < Infinity) hits.push({ city, score });
  }

  hits.sort((a, b) => a.score - b.score || a.city.name.length - b.city.name.length);
  return hits.slice(0, limit);
}

export interface CityGroup {
  city: string;
  province: string;
  coord: [number, number] | null;
  memories: Memory[];
}

/**
 * 按「解析后的城市」分组合并：同一地点写成「沈阳」和「沈阳市」会合并为一组。
 * 无法解析的也会保留（coord 为 null），避免静默丢弃。
 */
export function groupByCity(memories: Memory[]): CityGroup[] {
  const map = new Map<string, CityGroup>();

  for (const m of memories) {
    if (!m.location) continue;
    const resolved = resolveCity(m.location);
    const key = resolved?.name ?? m.location;
    if (!map.has(key)) {
      map.set(key, {
        city: key,
        province: resolved?.province ?? "",
        coord: resolved?.coord ?? null,
        memories: [],
      });
    }
    map.get(key)!.memories.push(m);
  }

  return [...map.values()].sort((a, b) => b.memories.length - a.memories.length);
}
