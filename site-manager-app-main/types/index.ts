// Domain types for CAT Rental Operations

export type Role = 'operator' | 'manager';

export type EquipmentStatus =
  | 'working'
  | 'idle'
  | 'maintenance'
  | 'rented'
  | 'available';

export type RentalStatus = 'active' | 'upcoming' | 'completed' | 'overdue';

export type Priority = 'high' | 'medium' | 'low';

export type TaskStatus = 'pending' | 'in_progress' | 'paused' | 'completed';

export type ShiftStatus = 'on_duty' | 'off_duty' | 'break';

export type ChecklistStatus = 'pending' | 'passed' | 'failed';

export interface Site {
  id: string;
  name: string;
  location: string;
}

export interface Operator {
  id: string;
  name: string;
  employeeId: string;
  role: Role;
  avatarSeed: string;
  assignedMachine?: string;
  currentTask?: string;
  shiftStatus: ShiftStatus;
  experienceYears: number;
  safetyScore: number;
  availability: 'available' | 'busy' | 'off';
  completedTasks: number;
  hoursWorked: number;
  achievements: string[];
}

export interface Asset {
  id: string;
  name: string;
  machineId: string;
  assetType: string;
  imageSeed: string;
  rentalId?: string;
  rentalStatus: RentalStatus;
  status: EquipmentStatus;
  siteId: string;
  assignedOperatorId?: string;
  healthScore: number;
  idleHours: number;
  engineHours: number;
}

export interface Task {
  id: string;
  name: string;
  machineId: string;
  operatorId: string;
  priority: Priority;
  dueTime: string;
  status: TaskStatus;
  progress: number;
  siteId: string;
}

export interface ActivityItem {
  id: string;
  type: 'assigned' | 'rental_started' | 'task_completed' | 'issue_reported' | 'maintenance_scheduled';
  title: string;
  detail: string;
  timestamp: string;
}

export interface Operation {
  id: string;
  task: string;
  machineId: string;
  operatorId: string;
  priority: Priority;
  status: TaskStatus;
  progress: number;
  expectedCompletion: string;
}
