import { db } from '../../shared/database/client'
import type { ChannelRow, CreateChannelInput, UpdateChannelInput } from './channels.types'

export const channelsRepository = {
  async findAll(): Promise<ChannelRow[]> {
    const { rows } = await db.query<ChannelRow>(
      `SELECT * FROM business_channels ORDER BY status ASC, name ASC`,
    )
    return rows
  },

  async findById(id: string): Promise<ChannelRow | null> {
    const { rows } = await db.query<ChannelRow>(
      `SELECT * FROM business_channels WHERE id = $1`,
      [id],
    )
    return rows[0] ?? null
  },

  async create(input: CreateChannelInput, createdBy: string): Promise<ChannelRow> {
    const { rows } = await db.query<ChannelRow>(
      `INSERT INTO business_channels (name, description, color, keywords, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [input.name, input.description ?? null, input.color, input.keywords, createdBy],
    )
    return rows[0]
  },

  async update(id: string, input: UpdateChannelInput): Promise<ChannelRow | null> {
    const fields: string[] = []
    const values: unknown[] = []
    let i = 1

    if (input.name !== undefined)        { fields.push(`name = $${i++}`);        values.push(input.name) }
    if (input.description !== undefined) { fields.push(`description = $${i++}`); values.push(input.description) }
    if (input.color !== undefined)       { fields.push(`color = $${i++}`);       values.push(input.color) }
    if (input.keywords !== undefined)    { fields.push(`keywords = $${i++}`);    values.push(input.keywords) }

    if (fields.length === 0) return channelsRepository.findById(id)

    values.push(id)
    const { rows } = await db.query<ChannelRow>(
      `UPDATE business_channels SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values,
    )
    return rows[0] ?? null
  },

  async setStatus(id: string, status: 'ACTIVE' | 'ARCHIVED'): Promise<ChannelRow | null> {
    const { rows } = await db.query<ChannelRow>(
      `UPDATE business_channels SET status = $1::channel_status WHERE id = $2 RETURNING *`,
      [status, id],
    )
    return rows[0] ?? null
  },
}
