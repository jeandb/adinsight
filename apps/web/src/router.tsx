import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { LoginPage } from './features/auth/LoginPage'
import { SetupPage } from './features/auth/SetupPage'
import { ActivatePage } from './features/auth/ActivatePage'
import { AppShell } from './components/layout/AppShell'
import { UsersPage } from './features/admin/users/UsersPage'
import { PlatformsPage } from './features/admin/platforms/PlatformsPage'
import { useAuthStore } from './stores/auth.store'
import { authApi } from './features/auth/auth.api'
import { UserRole } from '@adinsight/shared-types'

function DashboardPlaceholder() {
  const user = useAuthStore((s) => s.user)
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      <p className="text-muted-foreground">
        Bem-vindo, <strong>{user?.name}</strong>. Etapa 4 implementará o dashboard completo.
      </p>
      <div className="mt-4 p-4 rounded-lg border border-border bg-card text-sm text-muted-foreground">
        Role atual: <strong className="text-foreground">{user?.role}</strong>
      </div>
    </div>
  )
}

function RequireAuth({ children, roles }: { children: React.ReactNode; roles?: UserRole[] }) {
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)

  if (!user || !accessToken) {
    return <Navigate to="/login" replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function SetupGuard() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    authApi
      .checkSetup()
      .then(({ needsSetup }) => {
        if (!needsSetup) navigate('/login', { replace: true })
      })
      .catch(() => navigate('/login', { replace: true }))
      .finally(() => setChecking(false))
  }, [navigate])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return <SetupPage />
}

function BootstrapCheck({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    authApi
      .checkSetup()
      .then(({ needsSetup }) => {
        if (needsSetup) navigate('/setup', { replace: true })
      })
      .finally(() => setChecked(true))
  }, [navigate])

  if (!checked && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}

export function Router() {
  return (
    <BrowserRouter>
      <BootstrapCheck>
        <Routes>
          <Route path="/setup" element={<SetupGuard />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/activate" element={<ActivatePage />} />

          <Route
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route path="/dashboard" element={<DashboardPlaceholder />} />
            <Route
              path="/admin/users"
              element={
                <RequireAuth roles={[UserRole.ADMIN]}>
                  <UsersPage />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/platforms"
              element={
                <RequireAuth roles={[UserRole.ADMIN]}>
                  <PlatformsPage />
                </RequireAuth>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BootstrapCheck>
    </BrowserRouter>
  )
}
