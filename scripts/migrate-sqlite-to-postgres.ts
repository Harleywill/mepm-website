/**
 * One-off: copy every row from the old SQLite database into Postgres.
 *
 *   SQLITE_URL="file:/abs/path/to/dev.db" DATABASE_URL="postgresql://..." \
 *     npx tsx scripts/migrate-sqlite-to-postgres.ts [--wipe]
 *
 * Needs the frozen SQLite client first:
 *   npx prisma generate --schema prisma/sqlite-source.prisma
 *
 * - Table copy order is worked out from the schema's foreign keys (parents first).
 * - Reads with the frozen SQLite client (so DateTime/Boolean values are decoded exactly as
 *   the app saw them), writes with the normal Postgres client. IDs are kept. Batches of 500.
 * - Refuses to run if any Postgres table already holds rows (--wipe empties them first - only
 *   ever for a rehearsal database).
 * - Afterwards it resets every auto-increment counter and compares every row, field by field,
 *   between the two databases. Exits non-zero on any difference.
 */
import { PrismaClient } from "@prisma/client";

const wipe = process.argv.includes("--wipe");
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

type M = { name: string; table: string; delegate: string; serialPk: string | null; deps: string[] };

// The "prisma-client" generator does not expose Prisma.dmmf, but the client instance carries the
// parsed schema (models -> fields, relations, defaults) as _runtimeDataModel.
function planModels(client: any): M[] {
  const runtime = client._runtimeDataModel;
  if (!runtime?.models) throw new Error("cannot read the data model from the Prisma client");
  const models = Object.entries(runtime.models).map(([name, m]: [string, any]) => ({ name, dbName: m.dbName as string | null, fields: m.fields as any[] }));
  const byName = new Map<string, M>();
  for (const m of models) {
    const pk = m.fields.find((f) => f.isId);
    const serial = pk && (pk.default as any)?.name === "autoincrement" ? pk.name : null;
    const deps = m.fields
      .filter((f) => f.kind === "object" && (f.relationFromFields?.length ?? 0) > 0 && f.type !== m.name)
      .map((f) => f.type);
    byName.set(m.name, { name: m.name, table: m.dbName ?? m.name, delegate: lower(m.name), serialPk: serial, deps });
  }
  // Topological sort: a model comes after every model it holds a foreign key to.
  const out: M[] = [];
  const state = new Map<string, 0 | 1 | 2>();
  const visit = (n: string, trail: string[]) => {
    if (state.get(n) === 2) return;
    if (state.get(n) === 1) throw new Error(`foreign-key cycle: ${[...trail, n].join(" -> ")}`);
    state.set(n, 1);
    for (const d of byName.get(n)!.deps) visit(d, [...trail, n]);
    state.set(n, 2);
    out.push(byName.get(n)!);
  };
  for (const n of byName.keys()) visit(n, []);
  return out;
}

function norm(row: any) {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(row).sort()) {
    const v = row[k];
    out[k] = v instanceof Date ? v.toISOString() : v;
  }
  return JSON.stringify(out);
}

async function main() {
  if (!process.env.SQLITE_URL || !process.env.DATABASE_URL) throw new Error("set SQLITE_URL and DATABASE_URL");
  if (!process.env.DATABASE_URL.startsWith("postgres")) throw new Error("DATABASE_URL is not a postgres URL");

  // Path kept in a variable on purpose: that folder only exists after `prisma generate --schema
  // prisma/sqlite-source.prisma`, and a literal import would make `tsc`/`next build` fail on any
  // machine that has not generated it.
  const sqliteClientPath = "../.sqlite-client";
  const mod: any = await import(sqliteClientPath);
  const SqliteClient = mod.PrismaClient ?? mod.default?.PrismaClient;
  const src: any = new SqliteClient({ datasourceUrl: process.env.SQLITE_URL });
  const dst: any = new PrismaClient();
  try {
    const plan = planModels(dst);
    console.log("copy order:", plan.map((m) => m.name).join(" > "));

    // 1. Guard: destination must be empty.
    const nonEmpty: string[] = [];
    for (const m of plan) {
      const n = await dst[m.delegate].count();
      if (n > 0) nonEmpty.push(`${m.name}=${n}`);
    }
    if (nonEmpty.length && !wipe) {
      throw new Error(`Postgres already has data (${nonEmpty.join(", ")}). Refusing. Use --wipe only on a rehearsal DB.`);
    }
    if (nonEmpty.length && wipe) {
      console.log("--wipe: emptying Postgres tables first");
      await dst.$executeRawUnsafe(`TRUNCATE ${plan.map((m) => `"${m.table}"`).join(", ")} RESTART IDENTITY CASCADE`);
    }

    // 2. Copy, all in one transaction (all-or-nothing).
    await dst.$transaction(
      async (tx: any) => {
        for (const m of plan) {
          const rows = await src[m.delegate].findMany();
          for (let i = 0; i < rows.length; i += 500) await tx[m.delegate].createMany({ data: rows.slice(i, i + 500) });
          console.log(`copied ${m.name}: ${rows.length}`);
        }
      },
      { timeout: 300000, maxWait: 30000 }
    );

    // 3. Reset auto-increment counters so new rows don't collide with copied IDs.
    for (const m of plan) {
      if (!m.serialPk) continue;
      await dst.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('"${m.table}"', '${m.serialPk}'), COALESCE((SELECT MAX("${m.serialPk}") FROM "${m.table}"), 1), (SELECT MAX("${m.serialPk}") FROM "${m.table}") IS NOT NULL)`
      );
    }
    console.log("sequences reset");

    // 4. Verify every row, field by field.
    let bad = 0;
    for (const m of plan) {
      const a: any[] = await src[m.delegate].findMany();
      const b: any[] = await dst[m.delegate].findMany();
      if (a.length !== b.length) {
        console.error(`MISMATCH ${m.name}: sqlite ${a.length} rows vs postgres ${b.length}`);
        bad++;
        continue;
      }
      const sa = a.map(norm).sort();
      const sb = b.map(norm).sort();
      const diffs = sa.filter((x, i) => x !== sb[i]).length;
      if (diffs) {
        console.error(`MISMATCH ${m.name}: ${diffs} row(s) differ`);
        bad++;
      } else {
        console.log(`verified ${m.name}: ${a.length} row(s) identical`);
      }
    }
    if (bad) throw new Error(`${bad} table(s) failed verification`);
    console.log("ALL TABLES VERIFIED");
  } finally {
    await src.$disconnect();
    await dst.$disconnect();
  }
}

main().catch((e) => {
  console.error("FAILED:", e.message || e);
  process.exitCode = 1;
});
