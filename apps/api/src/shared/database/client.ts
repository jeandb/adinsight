import { Pool } from 'pg'
import { env } from '../../config/env'

export const db = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

db.on('error', (err) => {
  console.error('Erro inesperado no pool do PostgreSQL:', err)
})
