import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { db } from './client'

async function status() {
  const migrationsDir = path.join(__dirname, 'migrations')

  const { rows } = await db.query<{ version: string; applied_at: string }>(
    'SELECT version, applied_at FROM schema_migrations ORDER BY version',
  ).catch(() => ({ rows: [] as { version: string; applied_at: string }[] }))

  const applied = new Set(rows.map((r) => r.version))
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()

  console.log('\nStatus das migrações:\n')
  for (const file of files) {
    const version = file.replace('.sql', '')
    const row = rows.find((r) => r.version === version)
    const status = applied.has(version) ? `✅ aplicada em ${row?.applied_at}` : '⏳ pendente'
    console.log(`  ${file} — ${status}`)
  }
  console.log()

  await db.end()
}

status().catch((err) => {
  console.error('Erro:', err.message)
  process.exit(1)
})
