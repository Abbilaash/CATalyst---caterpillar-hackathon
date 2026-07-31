export interface Equipment {
  id: string;
  name: string;
  model: string;
  category: string;
  site: string;
  operator: string;
  health: number;
  idleHours: number;
  rentalRemainingDays: number;
  status: 'working' | 'idle' | 'critical' | 'maintenance' | 'transit' | string;
  image?: string;
  telemetry?: Record<string, any>;
}
