const SKILL_KEYWORDS: Record<string, string[]> = {
  'campaign-performance-analyst': [
    'campanha', 'campanhas', 'roas', 'cpl', 'cpc', 'ctr', 'cpm', 'impressões',
    'cliques', 'leads', 'conversão', 'conversões', 'performance', 'desempenho',
    'resultado', 'resultados', 'métrica', 'métricas', 'taxa', 'custo',
    'pior', 'melhor', 'top', 'ranking',
  ],
  'budget-optimizer': [
    'orçamento', 'budget', 'investimento', 'escalar', 'escala', 'aumentar',
    'reduzir', 'pausar', 'distribuição', 'realocação', 'quanto investir',
    'onde investir', 'verba', 'gasto',
  ],
  'period-comparator': [
    'comparar', 'comparação', 'período', 'semana passada', 'mês passado',
    'vs', 'versus', 'anterior', 'variação', 'crescimento', 'queda',
    'tendência', 'evoluição',
  ],
  'cross-data-analyst': [
    'faturamento', 'receita', 'vendas', 'roas real', 'woocommerce',
    'loja', 'clube', 'tudo de prof', 'retorno real', 'atribuição',
    'quanto vendeu',
  ],
  'creative-analyzer': [
    'criativo', 'criativos', 'anúncio', 'anúncios', 'imagem', 'vídeo',
    'copy', 'texto do anúncio', 'formato', 'fadiga criativa',
  ],
  'copy-reviewer': [
    'copy', 'texto', 'headline', 'chamada', 'legenda', 'revisar texto',
    'melhorar copy', 'reescrever',
  ],
  'report-generator': [
    'relatório', 'report', 'resumo', 'sumário', 'apresentação',
    'gerar relatório', 'exportar análise',
  ],
}

export const intentDetector = {
  detectSkills(message: string): string[] {
    const lower = message.toLowerCase()
    const detected = new Set<string>()

    for (const [skill, keywords] of Object.entries(SKILL_KEYWORDS)) {
      if (keywords.some((kw) => lower.includes(kw))) {
        detected.add(skill)
      }
    }

    return [...detected]
  },

  hasDataIntent(message: string): boolean {
    const lower = message.toLowerCase()
    return Object.values(SKILL_KEYWORDS).some((kws) => kws.some((kw) => lower.includes(kw)))
  },
}
