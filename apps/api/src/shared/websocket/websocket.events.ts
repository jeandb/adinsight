export type WsEvent =
  | { type: 'sync:started';    payload: { platformType: string } }
  | { type: 'sync:completed';  payload: { platformType: string; campaignsUpdated: number; timestamp: string } }
  | { type: 'sync:failed';     payload: { platformType: string; error: string } }
  | { type: 'dashboard:refresh'; payload: { scope: 'campaigns' | 'all' } }
  | { type: 'alert:triggered'; payload: { eventId: string; ruleId: string; ruleName: string; message: string; triggeredAt: string } }
