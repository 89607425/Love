/**
 * 历史地点体检（只读，不做任何写库操作）。
 *
 * 用途：看看数据库里已有的 location 在新坐标表下分别解析成什么，
 *       哪些会从"地图上没有点"变成"有"，哪些仍然无法定位。
 *
 * 用法：
 *   vercel env pull .env.local        # 把 DATABASE_URL 拉到本地
 *   node scripts/dry-run-locations.mjs
 *
 * 依赖：需要能连上 Neon。脚本只执行 SELECT DISTINCT。
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);

function loadEnv() {
  const file = path.join(root, ".env.local");
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if (!m || line.trim().startsWith("#")) continue;
      const value = m[2].replace(/^["']|["']$/g, "");
      if (!process.env[m[1]]) process.env[m[1]] = value;
    }
  }
}

function compileCityLib() {
  const out = path.join(root, ".tmp-dryrun");
  try {
    execFileSync(
      "npx",
      [
        "tsc",
        "src/lib/cities.ts",
        "src/lib/cities.generated.ts",
        "--outDir",
        ".tmp-dryrun",
        "--module",
        "commonjs",
        "--target",
        "es2020",
        "--moduleResolution",
        "node",
        "--skipLibCheck",
      ],
      { cwd: root, stdio: "pipe" }
    );
  } catch {
    // db.ts 里的路径别名会报错，但不影响 cities 产物落地，继续
  }
  return path.join(out, "cities.js");
}

async function main() {
  loadEnv();
  if (!process.env.DATABASE_URL) {
    console.error("缺少 DATABASE_URL。先跑：vercel env pull .env.local");
    process.exit(1);
  }

  const compiled = compileCityLib();
  const { resolveCity, groupByCity } = require(compiled);

  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`SELECT DISTINCT location FROM memories WHERE location != '' ORDER BY location`;
  const locations = rows.map((r) => String(r.location));

  console.log(`库中去重地点：${locations.length} 个\n`);

  const newcomers = [];
  const aliased = [];
  const unresolved = [];

  for (const loc of locations) {
    const hit = resolveCity(loc);
    if (!hit) {
      unresolved.push(loc);
      continue;
    }
    if (hit.name === loc) continue;
    if (hit.full === loc) aliased.push([loc, hit.name]);
    else newcomers.push([loc, hit.name, hit.province]);
  }

  if (aliased.length) {
    console.log("① 写法不同但其实已在上图（新旧会合并到同一个点）：");
    aliased.forEach(([from, to]) => console.log(`   ${from}  →  ${to}`));
    console.log("");
  }

  if (newcomers.length) {
    console.log("② 以前没能打上点、现在能打上了：");
    newcomers.forEach(([from, to, prov]) =>
      console.log(`   ${from}  →  ${to}（${prov}）`)
    );
    console.log("");
  }

  if (unresolved.length) {
    console.log("③ 仍然定位不到（境外或过于具体的区县/景区）：");
    unresolved.forEach((loc) => console.log(`   ${loc}`));
    console.log("");
  }

  const all = await sql`SELECT id, location FROM memories WHERE location != ''`;
  const groups = groupByCity(all.map((r) => ({ id: r.id, location: String(r.location) })));
  console.log(`合并后地图上共 ${groups.filter((g) => g.coord).length} 个城市；`);
  console.log(`改名后受影响的记录数：${newcomers.length + aliased.length} 个地点`);
  console.log("\n本脚本为只读体检，未修改任何数据。");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
