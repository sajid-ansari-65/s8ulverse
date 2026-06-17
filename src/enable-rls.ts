import 'dotenv/config'
import { Pool } from 'pg'

// RLS audit/fix. Supabase flags public tables without Row-Level Security because
// the anon-key Data API (PostgREST) could read/write them. This app never uses
// that API (it connects via the postgres role over the pooler), and that role has
// BYPASSRLS — so enabling RLS closes the anon exposure WITHOUT breaking the app.
//
//   npx tsx src/enable-rls.ts            → check only (read-only)
//   npx tsx src/enable-rls.ts --apply    → ENABLE RLS on every public table missing it

const apply = process.argv.includes('--apply')

const run = async () => {
  const pool = new Pool({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    max: 2,
  })

  const who = await pool.query(
    `select current_user,
            (select rolbypassrls from pg_roles where rolname = current_user) as bypassrls`,
  )
  console.log('connected as:', who.rows[0])

  const tables = await pool.query(
    `select c.relname as table, c.relrowsecurity as rls_enabled
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'
      order by c.relname`,
  )
  const missing = tables.rows.filter((t) => !t.rls_enabled)
  console.log(`\npublic tables: ${tables.rows.length} | RLS missing on: ${missing.length}`)
  console.log(missing.map((t) => '  · ' + t.table).join('\n') || '  (none — all protected)')

  if (apply && missing.length) {
    console.log('\nEnabling RLS…')
    for (const t of missing) {
      await pool.query(`ALTER TABLE public."${t.table}" ENABLE ROW LEVEL SECURITY`)
      console.log('  ✓ ' + t.table)
    }
    console.log('✅ RLS enabled on all public tables.')
  } else if (!apply) {
    console.log('\n(read-only — re-run with --apply to enable RLS)')
  }

  await pool.end()
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
