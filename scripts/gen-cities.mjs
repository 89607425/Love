/**
 * 生成全国地级行政区坐标表。
 *
 * 数据源：阿里云 DataV.GeoAtlas 行政区划（https://geo.datav.aliyun.com/areas_v3/bound/{adcode}_full.json）
 * 产物：src/lib/cities.generated.ts
 *
 * 用法：node scripts/gen-cities.mjs
 *
 * 说明：
 * - 只取 level === "city" 且 adcode % 100 === 0 的条目 —— 后者用于剔除海南、甘肃等
 *   省直辖县级行政区（它们同样被标成 city，但不是地级）。
 * - 台湾省接口返回 404，需要手工清单。
 * - 直辖市子级 level 是 district（区），因此单独用省级 center 补 4 条。
 * - scripts/legacy-cities.json 是旧版手写表的固化快照，必须并入，保证新表是旧表的父集。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pinyin } from "pinyin-pro";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const PROVINCES = [
  [110000, "北京市"],
  [120000, "天津市"],
  [130000, "河北省"],
  [140000, "山西省"],
  [150000, "内蒙古自治区"],
  [210000, "辽宁省"],
  [220000, "吉林省"],
  [230000, "黑龙江省"],
  [310000, "上海市"],
  [320000, "江苏省"],
  [330000, "浙江省"],
  [340000, "安徽省"],
  [350000, "福建省"],
  [360000, "江西省"],
  [370000, "山东省"],
  [410000, "河南省"],
  [420000, "湖北省"],
  [430000, "湖南省"],
  [440000, "广东省"],
  [450000, "广西壮族自治区"],
  [460000, "海南省"],
  [500000, "重庆市"],
  [510000, "四川省"],
  [520000, "贵州省"],
  [530000, "云南省"],
  [540000, "西藏自治区"],
  [610000, "陕西省"],
  [620000, "甘肃省"],
  [630000, "青海省"],
  [640000, "宁夏回族自治区"],
  [650000, "新疆维吾尔自治区"],
  [710000, "台湾省"],
  [810000, "香港特别行政区"],
  [820000, "澳门特别行政区"],
];

// 接口拿不到或不需要单列亲子关系的补充条目
const MANUAL = [
  { name: "台北", full: "台北市", province: "台湾省", adcode: 710000, coord: [121.52, 25.03] },
  { name: "新北", full: "新北市", province: "台湾省", adcode: 710000, coord: [121.46, 25.01] },
  { name: "桃园", full: "桃园市", province: "台湾省", adcode: 710000, coord: [121.22, 24.99] },
  { name: "台中", full: "台中市", province: "台湾省", adcode: 710000, coord: [120.64, 24.15] },
  { name: "台南", full: "台南市", province: "台湾省", adcode: 710000, coord: [120.2, 22.99] },
  { name: "高雄", full: "高雄市", province: "台湾省", adcode: 710000, coord: [120.3, 22.63] },
  { name: "基隆", full: "基隆市", province: "台湾省", adcode: 710000, coord: [121.74, 25.13] },
  { name: "新竹", full: "新竹市", province: "台湾省", adcode: 710000, coord: [120.97, 24.8] },
  { name: "嘉义", full: "嘉义市", province: "台湾省", adcode: 710000, coord: [120.45, 23.48] },
  { name: "宜兰", full: "宜兰县", province: "台湾省", adcode: 710000, coord: [121.83, 24.75] },
  { name: "彰化", full: "彰化县", province: "台湾省", adcode: 710000, coord: [120.55, 24.05] },
  { name: "屏东", full: "屏东县", province: "台湾省", adcode: 710000, coord: [120.49, 22.67] },
  { name: "花莲", full: "花莲县", province: "台湾省", adcode: 710000, coord: [121.6, 23.99] },
  { name: "台东", full: "台东县", province: "台湾省", adcode: 710000, coord: [121.15, 22.76] },
  { name: "苗栗", full: "苗栗县", province: "台湾省", adcode: 710000, coord: [120.9, 24.57] },
  { name: "南投", full: "南投县", province: "台湾省", adcode: 710000, coord: [120.69, 23.91] },
  { name: "云林", full: "云林县", province: "台湾省", adcode: 710000, coord: [120.54, 23.71] },
  { name: "香港", full: "香港特别行政区", province: "香港特别行政区", adcode: 810000, coord: [114.17, 22.32] },
  { name: "澳门", full: "澳门特别行政区", province: "澳门特别行政区", adcode: 820000, coord: [113.55, 22.19] },
];

// 56 个民族的词干，用于剥离自治地方的民族部分（长词干排前面，避免被短词干抢先匹配）
const ETHNIC_STEMS = [
  "维吾尔", "哈萨克", "柯尔克孜", "乌孜别克", "塔吉克", "达斡尔", "鄂温克", "鄂伦春", "塔塔尔",
  "布依", "朝鲜", "土家", "哈尼", "傈僳", "拉祜", "纳西", "景颇", "仫佬", "撒拉", "毛南",
  "仡佬", "阿昌", "普米", "布朗", "德昂", "独龙", "门巴", "珞巴", "基诺", "裕固", "保安",
  "东乡", "俄罗斯", "赫哲", "锡伯", "高山", "蒙古", "回", "藏", "苗", "彝", "壮", "满",
  "侗", "瑶", "白", "傣", "黎", "佤", "畲", "水", "羌", "怒", "土", "京",
].sort((a, b) => b.length - a.length);

const AUTONOMOUS_RE = new RegExp(
  `(?:(?:${ETHNIC_STEMS.join("|")})族?)+(?:自治州|自治县|自治旗)$`
);

/** 全称 -> 简称。「西双版纳傣族自治州」->「西双版纳」、「神农架林区」->「神农架」 */
function shortName(full) {
  let name = full.replace(AUTONOMOUS_RE, "");
  name = name.replace(
    /(?:自治州|自治县|自治旗|地区|盟|市|县|旗|林区|新区|特别行政区)$/,
    ""
  );
  return name || full;
}

const pinyinOf = (str) =>
  pinyin(str, { toneType: "none", type: "array" }).join("");
const initialsOf = (str) =>
  pinyin(str, { pattern: "first", toneType: "none", type: "array" }).join("");

async function fetchProvinceChildren(adcode) {
  const url = `https://geo.datav.aliyun.com/areas_v3/bound/${adcode}_full.json`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const text = await res.text();
  if (!text.trim().startsWith("{")) return null;
  return JSON.parse(text);
}

async function buildStandard() {
  const list = [];
  const failures = [];

  for (const [adcode, province] of PROVINCES) {
    const json = await fetchProvinceChildren(adcode);
    if (!json || !json.features) {
      failures.push(adcode);
      continue;
    }
    for (const f of json.features) {
      const p = f.properties || {};
      if (p.level !== "city") continue;
      if (p.adcode % 100 !== 0) continue; // 剔除省直辖县级行政区
      const full = p.name;
      const name = shortName(full);
      if (!p.center) {
        failures.push(`${full}(无 center)`);
        continue;
      }
      list.push({
        name,
        full,
        province,
        adcode: p.adcode,
        coord: [round(p.center[0]), round(p.center[1])],
      });
    }
  }

  return { list, failures };
}

// 直辖市：省下面就是区，用省级 center 补 1 条
async function buildMunicipalities() {
  const china = JSON.parse(fs.readFileSync(path.join(root, "public/china.json"), "utf8"));
  const targets = ["北京市", "天津市", "上海市", "重庆市"];
  return china.features
    .filter((f) => targets.includes(f.properties.name))
    .map((f) => ({
      name: shortName(f.properties.name),
      full: f.properties.name,
      province: f.properties.name,
      adcode: f.properties.adcode,
      coord: [round(f.properties.center[0]), round(f.properties.center[1])],
    }));
}

const round = (n) => Math.round(n * 10000) / 10000;

async function main() {
  const { list: standard, failures } = await buildStandard();
  const municipalities = await buildMunicipalities();
  const legacy = JSON.parse(
    fs.readFileSync(path.join(root, "scripts/legacy-cities.json"), "utf8")
  );

  // 以「简称」为键去重，标准数据优先
  const byName = new Map();
  const extra = [];

  const put = (entry) => {
    if (byName.has(entry.name)) return;
    byName.set(entry.name, entry);
  };

  for (const e of [...municipalities, ...standard, ...MANUAL]) put(e);

  // 旧表里没被标准表覆盖的（如凤凰、平遥这类景区/县级地名）必须保留
  for (const l of legacy) {
    if (byName.has(l.name)) continue;
    if (byName.has(shortName(l.name))) continue;
    put({
      name: l.name,
      full: l.name,
      province: l.province,
      adcode: 0,
      coord: [round(l.coord[0]), round(l.coord[1])],
      scenic: true,
    });
    extra.push(l.name);
  }

  const all = [...byName.values()].sort((a, b) => a.adcode - b.adcode || a.name.localeCompare(b.name, "zh"));

  // 校验：省份必须在省级 GeoJSON 里存在，否则地图高亮会静默失效
  const china = JSON.parse(fs.readFileSync(path.join(root, "public/china.json"), "utf8"));
  const validProvinces = new Set(china.features.map((f) => f.properties.name));
  const badProvince = all.filter((e) => !validProvinces.has(e.province));
  const badCoord = all.filter(
    (e) =>
      !Array.isArray(e.coord) ||
      e.coord.length !== 2 ||
      e.coord[0] < 73 ||
      e.coord[0] > 136 ||
      e.coord[1] < 3 ||
      e.coord[1] > 54
  );
  const dupAug = all.length !== new Set(all.map((e) => e.name)).size;

  if (badProvince.length || badCoord.length || dupAug) {
    console.error("校验失败：");
    if (badProvince.length) console.error("  省份名非法：", badProvince.map((e) => `${e.name}->${e.province}`).join(", "));
    if (badCoord.length) console.error("  坐标越界：", badCoord.map((e) => e.name).join(", "));
    if (dupAug) console.error("  存在重名");
    process.exit(1);
  }

  const lines = all.map((e) => {
    const pinyinFull = pinyinOf(e.name);
    const initials = initialsOf(e.name);
    return `  { n: "${e.name}", f: "${e.full}", p: "${e.province}", a: ${e.adcode}, c: [${e.coord[0]}, ${e.coord[1]}], py: "${pinyinFull}", ip: "${initials}"${e.scenic ? ", s: 1" : ""} },`;
  });

  const file = `// 自动生成，请勿手改。重新生成：node scripts/gen-cities.mjs
// 数据源：阿里云 DataV.GeoAtlas 行政区划
export interface GeneratedCity {
  n: string;   // 简称，用于显示与搜索，如 "沈阳"
  f: string;   // 官方全称，如 "沈阳市"
  p: string;   // 所属省级行政区，取值与 public/china.json 一致
  a: number;   // 行政区划代码
  c: [number, number];
  py: string;  // 全拼
  ip: string;  // 拼音首字母
  s?: 1;       // 非地级行政区（旧表中的景区/县级地名）
}

export const GENERATED_CITIES: GeneratedCity[] = [
${lines.join("\n")}
];
`;

  fs.writeFileSync(path.join(root, "src/lib/cities.generated.ts"), file);

  console.log(`生成完成：${all.length} 条`);
  console.log(`  标准地级：${all.length - extra.length - MANUAL.length}`);
  console.log(`  手工补充（台港澳）：${MANUAL.length}`);
  console.log(`  旧表遗留（景区等）：${extra.length}${extra.length ? " -> " + extra.join(",") : ""}`);
  if (failures.length) console.log(`  拉取失败（已用其他来源兜底）：${failures.join(",")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
