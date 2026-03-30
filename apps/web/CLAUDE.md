# AdInsight — Frontend (apps/web)

## Project Overview

AdInsight is an internal SaaS dashboard for Prof Jaque Mendes that centralizes
ad campaign performance data, WooCommerce revenue, and AI-powered analysis.

**Stack:** React + TypeScript + Vite + Tailwind CSS + Shadcn/UI + Recharts
**Monorepo path:** `apps/web/` (este arquivo)
**Companion app:** `apps/api/`
**Shared types:** `packages/shared-types/`
**PRD:** `PRD.md` (na raiz do monorepo)
**Root CLAUDE.md:** `CLAUDE.md` (leia primeiro — contém decisões globais)

---

## Directory Structure (within monorepo)

```
adinsight/apps/web/
├── src/
│   ├── features/                 # Feature modules — isolated domain logic
│   │   ├── auth/                 # Login, first-access setup
│   │   ├── admin/                # Admin panel (platforms, users, AI providers, alerts)
│   │   │   ├── platforms/        # Ad platform credential management
│   │   │   ├── woo-stores/       # WooCommerce store configuration
│   │   │   ├── ai-providers/     # LLM provider management + scenario mapping
│   │   │   ├── users/            # User management and roles
│   │   │   ├── channels/         # Business channel CRUD
│   │   │   └── alerts/           # Alert rule configuration
│   │   ├── dashboard/            # Main performance dashboard
│   │   │   ├── campaigns/        # Campaign table, filters, channel association
│   │   │   ├── charts/           # Feature-specific chart components
│   │   │   ├── kpi-cards/        # KPI card components
│   │   │   └── executive-view/   # Simplified view for the Diretora profile
│   │   ├── revenue/              # WooCommerce revenue dashboard
│   │   │   ├── stores/           # Per-store revenue breakdown
│   │   │   └── consolidated/     # Cross-store consolidated view
│   │   └── ai/                   # AI module UI
│   │       ├── chat/             # Persistent chat sidebar
│   │       ├── analysis/         # On-demand analysis panel
│   │       └── history/          # AI interaction history viewer
│   ├── components/               # Genuinely shared UI components
│   │   ├── ui/                   # Shadcn/UI base components (do not edit)
│   │   ├── layout/               # AppShell, Sidebar, TopBar, PageHeader
│   │   ├── data-display/         # Table, Badge, Stat, MetricDelta
│   │   ├── feedback/             # Toast, Alert, EmptyState, LoadingSkeleton
│   │   └── forms/                # Input, Select, DateRangePicker, FileUpload
│   ├── hooks/                    # Shared custom hooks
│   │   ├── use-auth.ts
│   │   ├── use-websocket.ts
│   │   ├── use-filters.ts        # URL-persisted filter state
│   │   └── use-date-range.ts
│   ├── stores/                   # Global state (Zustand)
│   │   ├── auth.store.ts
│   │   ├── filters.store.ts      # Active dashboard filters
│   │   └── websocket.store.ts
│   ├── lib/                      # Non-component utilities
│   │   ├── api/                  # API client, request helpers, endpoints
│   │   ├── websocket/            # WebSocket client and event handlers
│   │   ├── formatters/           # Currency, date, percentage formatters
│   │   └── constants/            # App-wide constants and enums
│   ├── types/                    # Global TypeScript interfaces
│   └── main.tsx                  # App entry point
├── .claude/
│   └── skills/                   # Dev skills for this app (not AI product skills)
├── public/
├── CLAUDE.md                     # This file
├── tailwind.config.ts
├── vite.config.ts
└── package.json
```

---

## Feature Module Internal Structure

Each feature follows the same internal pattern:

```
features/dashboard/campaigns/
├── index.ts                         # Public exports
├── CampaignsPage.tsx                # Page-level component (route target)
├── CampaignsTable.tsx               # Main feature component
├── CampaignRow.tsx                  # Sub-component
├── use-campaigns.ts                 # Feature-specific hook (data fetching)
├── campaigns.types.ts               # Feature-specific types
└── campaigns.api.ts                 # API calls specific to this feature
```

**Rules:**
- Feature components are not imported by other features — use `components/` for shared UI
- Each feature manages its own data fetching via a dedicated hook
- Feature-specific types stay in the feature folder, not in global `types/`

---

## File Naming Conventions

| Type | Convention | Example |
|---|---|---|
| React components | `PascalCase.tsx` | `KpiCard.tsx`, `CampaignTable.tsx` |
| Custom hooks | `use-[name].ts` | `use-campaigns.ts`, `use-auth.ts` |
| Utility files | `kebab-case.ts` | `date-formatters.ts`, `api-client.ts` |
| Type files | `[name].types.ts` | `campaigns.types.ts` |
| Store files | `[name].store.ts` | `auth.store.ts` |
| API files | `[name].api.ts` | `campaigns.api.ts` |
| Test files | `[name].test.tsx` | `KpiCard.test.tsx` |
| Page components | `[Name]Page.tsx` | `DashboardPage.tsx`, `LoginPage.tsx` |

---

## Shared Types

Import shared TypeScript interfaces from the monorepo package — never duplicate them locally:

```typescript
// ✅ CORRECT — use shared types package
import type { Campaign, CampaignStatus, UserRole } from '@adinsight/shared-types'

// ❌ WRONG — never redefine types that already exist in shared-types
interface Campaign { ... }
```

Shared types live in `adinsight/packages/shared-types/src/`.
When a type is needed in both apps/api and apps/web, it belongs in shared-types.
Feature-specific types that are only used in the frontend stay local in the feature folder.

---

## Component Naming and Structure

```typescript
// ✅ CORRECT — named export, typed props, descriptive name
interface KpiCardProps {
  label: string
  value: number
  delta?: number
  format?: 'currency' | 'percentage' | 'number'
  trend?: 'up' | 'down' | 'neutral'
}

export function KpiCard({ label, value, delta, format = 'number', trend }: KpiCardProps) {
  return (...)
}

// ❌ WRONG — default export, untyped, vague name
export default function Card(props: any) { ... }
```

**Rules:**
- Always use named exports for components (not default export)
- Always type props explicitly — no `any`
- Component name must match the filename exactly
- One component per file (sub-components can be in the same file if small)

---

## Styling Rules

This project uses **Tailwind CSS utility classes only**. No custom CSS files,
no CSS modules, no inline `style={{}}` objects unless absolutely necessary.

```tsx
// ✅ CORRECT
<div className="flex items-center gap-4 rounded-lg border border-border bg-card p-6">

// ❌ WRONG — no custom CSS
<div style={{ display: 'flex', gap: '16px' }}>

// ❌ WRONG — no arbitrary values when a Tailwind token exists
<div className="p-[24px] gap-[16px]">
```

**Shadcn/UI components** live in `src/components/ui/` and must not be modified
directly. To extend a Shadcn component, create a wrapper in the appropriate
`components/` subfolder.

```tsx
// ✅ CORRECT — wrapper with extensions
// src/components/data-display/MetricBadge.tsx
import { Badge } from '@/components/ui/badge'

export function MetricBadge({ value, trend }: MetricBadgeProps) {
  return (
    <Badge variant={trend === 'up' ? 'success' : 'destructive'}>
      {value}
    </Badge>
  )
}
```

---

## Data Fetching Pattern

All API calls go through the API client in `src/lib/api/`. Feature hooks handle
fetching, loading, and error state using React Query.

```typescript
// src/features/dashboard/campaigns/campaigns.api.ts
import { apiClient } from '@/lib/api'
import type { Campaign, CampaignFilters } from './campaigns.types'

export const campaignsApi = {
  list: (filters: CampaignFilters) =>
    apiClient.get<Campaign[]>('/campaigns', { params: filters }),
  updateChannel: (campaignId: string, channelId: string) =>
    apiClient.patch(`/campaigns/${campaignId}/channel`, { channelId }),
}

// src/features/dashboard/campaigns/use-campaigns.ts
import { useQuery } from '@tanstack/react-query'
import { campaignsApi } from './campaigns.api'

export function useCampaigns(filters: CampaignFilters) {
  return useQuery({
    queryKey: ['campaigns', filters],
    queryFn: () => campaignsApi.list(filters),
    staleTime: 5 * 60 * 1000,  // 5 min — aligns with sync interval
  })
}
```

---

## Filter Persistence in URL

Dashboard filters must persist in the URL so they can be shared and bookmarked.
Use the `use-filters.ts` hook — do not manage filter state with `useState` directly.

```typescript
// ✅ CORRECT — URL-persisted filters
const { filters, setFilter } = useFilters()
// URL becomes: /dashboard?channel=clube-das-profs&period=last-7-days&platform=meta

// ❌ WRONG — local state, lost on refresh
const [channel, setChannel] = useState('all')
```

---

## WebSocket Integration

Real-time updates from the backend arrive via WebSocket. The connection is
managed in `src/lib/websocket/` and exposed via `src/hooks/use-websocket.ts`.

```typescript
// Listening to sync updates in a component
const { on } = useWebSocket()

useEffect(() => {
  const unsubscribe = on('sync:completed', ({ platformId, timestamp }) => {
    queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    toast.success(`Dados de ${platformId} atualizados`)
  })
  return unsubscribe
}, [])
```

---

## Global State (Zustand)

Only three things live in global Zustand stores:
1. Auth state (current user, token)
2. Active filter state (shared across pages)
3. WebSocket connection state

Everything else is either local component state or React Query cache.

```typescript
// ❌ WRONG — don't put fetched data in Zustand
useCampaignsStore.setState({ campaigns: data })

// ✅ CORRECT — React Query manages server state
const { data: campaigns } = useCampaigns(filters)
```

---

## Number and Currency Formatting

Always use the formatters in `src/lib/formatters/` — never format inline.

```typescript
// ✅ CORRECT
import { formatCurrency, formatPercentage, formatROAS } from '@/lib/formatters'
formatCurrency(1234.56)     // "R$ 1.234,56"
formatPercentage(0.156)     // "15,6%"
formatROAS(3.2)             // "3,2x"

// ❌ WRONG — inconsistent formatting across components
`R$ ${value.toFixed(2)}`
```

---

## Chart Components (Recharts)

Charts are built with Recharts. Feature-specific charts live in their feature
folder. Reusable chart wrappers live in `src/components/data-display/`.

```typescript
// Standard chart configuration
const chartConfig = {
  colors: {
    meta: 'hsl(var(--chart-1))',
    google: 'hsl(var(--chart-2))',
    tiktok: 'hsl(var(--chart-3))',
    pinterest: 'hsl(var(--chart-4))',
  },
  tooltip: { formatter: formatCurrency },
}
```

Always use CSS variables for chart colors (defined in `tailwind.config.ts`)
so the theme system works correctly.

---

## Access Control

Page-level access is controlled by the user's role. Use the `useAuth` hook
to get the current user and check permissions:

```typescript
const { user } = useAuth()

// Role checks
user.role === 'admin'           // full access
user.role === 'traffic-manager' // operational access
user.role === 'director'        // executive view + AI chat
user.role === 'viewer'          // read-only, no AI access
```

Route guards live in the router configuration — do not implement
access control inside individual page components.

---

## What NOT to Do

- Do not import from one feature into another — use `components/` for shared UI
- Do not use `any` in TypeScript — always type props and return values
- Do not use `style={{}}` inline — use Tailwind classes
- Do not modify files in `src/components/ui/` — wrap instead
- Do not manage server state in Zustand — use React Query
- Do not format numbers or currencies inline — use `src/lib/formatters/`
- Do not hardcode colors — use Tailwind tokens or CSS variables
- Do not manage filter state with `useState` — use `use-filters.ts`
- Do not create default exports for components — always named exports
