export enum UserRole {
  ADMIN = 'ADMIN',
  TRAFFIC_MANAGER = 'TRAFFIC_MANAGER',
  DIRECTOR = 'DIRECTOR',
  VIEWER = 'VIEWER',
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface UserSession {
  id: string
  name: string
  email: string
  role: UserRole
}
