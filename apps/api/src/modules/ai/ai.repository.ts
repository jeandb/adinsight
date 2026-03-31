import { db } from '../../shared/database/client'
import { encrypt } from '../../shared/crypto'
import type { AiProviderRow, AiScenarioRow, AiHistoryRow, SaveHistoryInput } from './ai.types'

export const aiRepository = {
  // Providers
  async listProviders(): Promise<AiProviderRow[]> {
    const { rows } = await db.query<AiProviderRow>(
      `SELECT id, name, provider, model, api_key_encrypted, max_tokens, is_active, created_at, updated_at
       FROM ai_providers ORDER BY created_at ASC`,
    )
    return rows
  },

  async findProviderById(id: string): Promise<AiProviderRow | null> {
    const { rows } = await db.query<AiProviderRow>(
      `SELECT * FROM ai_providers WHERE id = $1`,
      [id],
    )
    return rows[0] ?? null
  },

  async createProvider(input: {
    name: string
    provider: string
    model: string
    apiKey: string
    maxTokens: number
  }): Promise<AiProviderRow> {
    const encrypted = encrypt(input.apiKey)
    const { rows } = await db.query<AiProviderRow>(
      `INSERT INTO ai_providers (name, provider, model, api_key_encrypted, max_tokens)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [input.name, input.provider, input.model, encrypted, input.maxTokens],
    )
    return rows[0]
  },

  async updateProvider(
    id: string,
    input: { name?: string; model?: string; apiKey?: string; maxTokens?: number; isActive?: boolean },
  ): Promise<AiProviderRow | null> {
    const sets: string[] = []
    const params: unknown[] = []
    let i = 1

    if (input.name !== undefined)      { sets.push(`name = $${i++}`);              params.push(input.name) }
    if (input.model !== undefined)     { sets.push(`model = $${i++}`);             params.push(input.model) }
    if (input.apiKey !== undefined)    { sets.push(`api_key_encrypted = $${i++}`); params.push(encrypt(input.apiKey)) }
    if (input.maxTokens !== undefined) { sets.push(`max_tokens = $${i++}`);        params.push(input.maxTokens) }
    if (input.isActive !== undefined)  { sets.push(`is_active = $${i++}`);         params.push(input.isActive) }

    if (sets.length === 0) return this.findProviderById(id)

    params.push(id)
    const { rows } = await db.query<AiProviderRow>(
      `UPDATE ai_providers SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`,
      params,
    )
    return rows[0] ?? null
  },

  async deleteProvider(id: string): Promise<void> {
    await db.query(`DELETE FROM ai_providers WHERE id = $1`, [id])
  },

  // Scenario assignments
  async listScenarios(): Promise<AiScenarioRow[]> {
    const { rows } = await db.query<AiScenarioRow>(
      `SELECT sa.scenario, sa.provider_id, ap.name AS provider_name
       FROM ai_scenario_assignments sa
       LEFT JOIN ai_providers ap ON ap.id = sa.provider_id
       ORDER BY sa.scenario`,
    )
    return rows
  },

  async assignScenario(scenario: string, providerId: string | null): Promise<void> {
    await db.query(
      `UPDATE ai_scenario_assignments SET provider_id = $1, updated_at = NOW() WHERE scenario = $2`,
      [providerId, scenario],
    )
  },

  // History
  async saveHistory(input: SaveHistoryInput): Promise<string> {
    const { rows } = await db.query<{ id: string }>(
      `INSERT INTO ai_history
         (user_id, scenario, provider, model, messages, context_snapshot, tokens_input, tokens_output)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        input.userId,
        input.scenario,
        input.provider,
        input.model,
        JSON.stringify(input.messages),
        input.contextSnapshot ? JSON.stringify(input.contextSnapshot) : null,
        input.tokensInput ?? null,
        input.tokensOutput ?? null,
      ],
    )
    return rows[0].id
  },

  async listHistory(userId: string | null, limit = 20): Promise<AiHistoryRow[]> {
    const { rows } = await db.query<AiHistoryRow>(
      `SELECT id, scenario, provider, model, messages, tokens_input, tokens_output, created_at
       FROM ai_history
       WHERE ($1::uuid IS NULL OR user_id = $1)
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit],
    )
    return rows
  },
}
