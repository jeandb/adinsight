import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { db } from './client'

async function migrate() {
  const migrationsDir = path.join(__dirname, 'migrations')

  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version     TEXT PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  const { rows: applied } = await db.query<{ version: string }>(
    'SELECT version FROM schema_migrations ORDER BY version',
  )
  const appliedVersions = new Set(applied.map((r) => r.version))

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  let ran = 0
  for (const file of files) {
    const version = file.replace('.sql', '')
    if (appliedVersions.has(version)) continue

    console.log(`Aplicando migration: ${file}`)
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
    const upSection = sql.split('-- Down')[0]
    await db.query(upSection)
    ran++
    console.log(`✅ ${file} aplicada`)
  }

  if (ran === 0) console.log('Nenhuma migration pendente.')
  else console.log(`${ran} migration(s) aplicada(s).`)

  await db.end()
}

migrate().catch((err) => {
  console.error('Erro na migration:', err)
  process.exit(1)
})
