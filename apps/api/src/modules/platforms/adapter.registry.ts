import type { PlatformAdapter } from './platforms.adapter.types'
import { metaAdapter } from './meta/meta.adapter'
import { googleAdapter } from './google/google.adapter'
import { tiktokAdapter } from './tiktok/tiktok.adapter'
import { pinterestAdapter } from './pinterest/pinterest.adapter'
import type { PlatformType } from './platforms.types'

const registry: Record<PlatformType, PlatformAdapter> = {
  META:      metaAdapter,
  GOOGLE:    googleAdapter,
  TIKTOK:    tiktokAdapter,
  PINTEREST: pinterestAdapter,
}

export function getAdapter(type: PlatformType): PlatformAdapter {
  return registry[type]
}
