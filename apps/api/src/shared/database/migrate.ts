import 'dotenv/config'
import { db } from './client'
import { runMigrations } from './migration-runner'

runMigrations()
  .then(() => db.end())
  .catch((err) => {
    console.error('Erro na migration:', err)
    process.exit(1)
  })
