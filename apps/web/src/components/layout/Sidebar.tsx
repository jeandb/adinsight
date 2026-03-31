import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Bell, BarChart3, Plug, Layers, ClipboardList, ShoppingBag, DollarSign } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { UserRole } from '@adinsight/shared-types'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/revenue',   icon: DollarSign,      label: 'Faturamento' },
  { to: '/reports',   icon: BarChart3,        label: 'Relatórios' },
  { to: '/alerts',    icon: Bell,             label: 'Alertas' },
  { to: '/admin/users',       icon: Users,        label: 'Usuários',        roles: [UserRole.ADMIN] },
  { to: '/admin/platforms',   icon: Plug,         label: 'Integrações',     roles: [UserRole.ADMIN] },
  { to: '/admin/woo-stores',  icon: ShoppingBag,  label: 'Lojas & Fatur.',  roles: [UserRole.ADMIN] },
  { to: '/admin/channels',    icon: Layers,       label: 'Canais',          roles: [UserRole.ADMIN, UserRole.TRAFFIC_MANAGER] },
  { to: '/admin/campaigns',   icon: ClipboardList, label: 'Fila de revisão', roles: [UserRole.ADMIN, UserRole.TRAFFIC_MANAGER] },
]

export function Sidebar() {
  const user = useAuthStore((s) => s.user)

  const visibleItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role)),
  )

  return (
    <aside className="w-60 border-r border-border bg-card flex flex-col">
      <div className="h-14 flex items-center px-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            AI
          </div>
          <span className="font-semibold text-foreground">AdInsight</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        <div className="px-3 py-2 rounded-lg bg-muted">
          <p className="text-xs font-medium text-foreground truncate">{user?.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
        </div>
      </div>
    </aside>
  )
}
