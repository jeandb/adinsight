import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, MoreVertical, Mail, ShieldCheck } from 'lucide-react'
import { usersApi, type UserItem } from './users.api'
import { UserRole } from '@adinsight/shared-types'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Admin',
  TRAFFIC_MANAGER: 'Gestor de Tráfego',
  DIRECTOR: 'Diretora',
  VIEWER: 'Visualizador',
}

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  TRAFFIC_MANAGER: 'bg-blue-100 text-blue-700',
  DIRECTOR: 'bg-amber-100 text-amber-700',
  VIEWER: 'bg-gray-100 text-gray-600',
}

export function UsersPage() {
  const qc = useQueryClient()
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
  })

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.VIEWER)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')

  const invite = useMutation({
    mutationFn: () => usersApi.invite(inviteEmail, inviteRole),
    onSuccess: () => {
      setInviteSuccess(`Convite enviado para ${inviteEmail}`)
      setInviteEmail('')
      setInviteRole(UserRole.VIEWER)
      qc.invalidateQueries({ queryKey: ['users'] })
      setTimeout(() => { setInviteOpen(false); setInviteSuccess('') }, 2000)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message
      setInviteError(msg ?? 'Erro ao enviar convite')
    },
  })

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) => usersApi.updateRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      active ? usersApi.reactivate(id) : usersApi.deactivate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Usuários</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie os acessos ao AdInsight
          </p>
        </div>

        <Dialog open={inviteOpen} onOpenChange={(o) => { setInviteOpen(o); setInviteError(''); setInviteSuccess('') }}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              <UserPlus className="w-4 h-4" />
              Convidar usuário
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convidar usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => { setInviteEmail(e.target.value); setInviteError('') }}
                  placeholder="usuario@email.com"
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Perfil de acesso</label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as UserRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.values(UserRole).map((r) => (
                      <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {inviteError && (
                <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{inviteError}</p>
              )}
              {inviteSuccess && (
                <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{inviteSuccess}</p>
              )}
              <div className="flex gap-2 pt-1">
                <DialogClose asChild>
                  <button className="flex-1 py-2 px-4 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors">
                    Cancelar
                  </button>
                </DialogClose>
                <button
                  onClick={() => invite.mutate()}
                  disabled={!inviteEmail || invite.isPending}
                  className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {invite.isPending ? 'Enviando...' : 'Enviar convite'}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Carregando...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Usuário</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Perfil</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Último acesso</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onRoleChange={(role) => updateRole.mutate({ id: user.id, role })}
                  onToggleActive={() => toggleActive.mutate({ id: user.id, active: !user.is_active })}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function UserRow({
  user,
  onRoleChange,
  onToggleActive,
}: {
  user: UserItem
  onRoleChange: (role: UserRole) => void
  onToggleActive: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <tr className={cn('hover:bg-muted/20 transition-colors', !user.is_active && 'opacity-50')}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Mail className="w-3 h-3" />{user.email}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <Select value={user.role} onValueChange={(v) => onRoleChange(v as UserRole)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(UserRole).map((r) => (
              <SelectItem key={r} value={r}>
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', ROLE_COLORS[r])}>
                  {ROLE_LABELS[r]}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="px-4 py-3">
        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
          user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        )}>
          <ShieldCheck className="w-3 h-3" />
          {user.is_active ? 'Ativo' : 'Desativado'}
        </span>
      </td>
      <td className="px-4 py-3 text-muted-foreground text-xs">
        {user.last_login_at
          ? new Date(user.last_login_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'Nunca'}
      </td>
      <td className="px-4 py-3">
        <div className="relative flex justify-end">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-muted-foreground" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-10 bg-card border border-border rounded-lg shadow-md py-1 w-36"
              onBlur={() => setMenuOpen(false)}>
              <button
                onClick={() => { onToggleActive(); setMenuOpen(false) }}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors text-foreground"
              >
                {user.is_active ? 'Desativar' : 'Reativar'}
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}
