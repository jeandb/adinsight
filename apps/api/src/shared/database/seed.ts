import 'dotenv/config'
import { db } from './client'

const CHANNELS = [
  {
    name: 'Loja das Profs',
    description: 'Campanhas de tráfego e conversão para lojadasprofs.com.br',
    color: '#10B981',
    keywords: ['loja', 'lojadasprofs', 'loja-profs', 'loja das profs'],
  },
  {
    name: 'Clube das Profs',
    description: 'Campanhas de assinatura anual do Clube das Profs',
    color: '#6366F1',
    keywords: ['clube', 'clubedasprofs', 'clube-profs', 'assinatura'],
  },
  {
    name: 'Tudo de Prof',
    description: 'Campanhas do marketplace Tudo de Prof',
    color: '#F59E0B',
    keywords: ['tudodeprof', 'tudo de prof', 'marketplace', 'tdp'],
  },
  {
    name: 'Mentoria Do Giz ao Digital',
    description: 'Campanhas de captação para a mentoria Do Giz ao Digital',
    color: '#EC4899',
    keywords: ['mentoria', 'giz', 'digital', 'dgd', 'giz ao digital'],
  },
  {
    name: 'Lançamentos',
    description: 'Canais temporários criados por evento de lançamento',
    color: '#8B5CF6',
    keywords: ['lancamento', 'lançamento', 'evento', 'curso'],
  },
]

async function seed() {
  console.log('🌱 Iniciando seed...\n')

  for (const channel of CHANNELS) {
    const { rows } = await db.query(
      `SELECT id FROM business_channels WHERE name = $1`,
      [channel.name],
    )

    if (rows.length > 0) {
      console.log(`  ⏭️  Canal "${channel.name}" já existe, ignorando`)
      continue
    }

    await db.query(
      `INSERT INTO business_channels (name, description, color, keywords)
       VALUES ($1, $2, $3, $4)`,
      [channel.name, channel.description, channel.color, channel.keywords],
    )
    console.log(`  ✅ Canal "${channel.name}" criado`)
  }

  console.log('\n✅ Seed concluído')
  await db.end()
}

seed().catch((err) => {
  console.error('❌ Erro no seed:', err)
  process.exit(1)
})
