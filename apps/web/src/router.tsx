import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { LoginPage } from './features/auth/LoginPage'
import { SetupPage } from './features/auth/SetupPage'
import { ActivatePage } from './features/auth/ActivatePage'
import { AppShell } from './components/layout/AppShell'
import { UsersPage } from './features/admin/users/UsersPage'
import { PlatformsPage } from './features/admin/platforms/PlatformsPage'
import { ChannelsPage } from './features/admin/channels/ChannelsPage'
import { ReviewQueuePage } from './features/admin/campaigns/ReviewQueuePage'
import { AlertsPage } from './features/admin/alerts/AlertsPage'
import { WooStoresPage } from './features/admin/woo-stores/WooStoresPage'
import { AiProvidersPage } from './features/admin/ai-providers/AiProvidersPage'
import { ReportsPage } from './features/admin/reports/ReportsPage'
import { RevenuePage } from './features/revenue/RevenuePage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { PrivacyPolicyPage } from './features/legal/PrivacyPolicyPage'
import { useAuthStore } from './stores/auth.store'
import { authApi } from './features/auth/auth.api'
import { UserRole } from '@adinsight/shared-types'

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
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

          <Route
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/revenue"   element={<RevenuePage />} />
            <Route path="/alerts"    element={<AlertsPage />} />
            <Route
              path="/dashboard/executive"
              element={
                <RequireAuth roles={[UserRole.DIRECTOR]}>
                  <div className="p-6 text-muted-foreground text-sm">
                    Visão Executiva — Etapa 4b
                  </div>
                </RequireAuth>
              }
            />
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
            <Route
              path="/admin/channels"
              element={
                <RequireAuth roles={[UserRole.ADMIN, UserRole.TRAFFIC_MANAGER]}>
                  <ChannelsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/campaigns"
              element={
                <RequireAuth roles={[UserRole.ADMIN, UserRole.TRAFFIC_MANAGER]}>
                  <ReviewQueuePage />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/woo-stores"
              element={
                <RequireAuth roles={[UserRole.ADMIN]}>
                  <WooStoresPage />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/ai-providers"
              element={
                <RequireAuth roles={[UserRole.ADMIN]}>
                  <AiProvidersPage />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <RequireAuth roles={[UserRole.ADMIN]}>
                  <ReportsPage />
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
