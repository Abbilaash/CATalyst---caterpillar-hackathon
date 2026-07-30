import { PALETTE } from '@/theme/tokens';
import type {
  EquipmentStatus,
  RentalStatus,
  Priority,
  TaskStatus,
  ShiftStatus,
  ChecklistStatus,
} from '@/types';

export function statusColor(status: EquipmentStatus): string {
  switch (status) {
    case 'working':
      return PALETTE.success;
    case 'idle':
      return PALETTE.warning;
    case 'maintenance':
      return PALETTE.error;
    case 'rented':
      return PALETTE.info;
    case 'available':
      return PALETTE.textSecondary;
  }
}

export function statusLabel(status: EquipmentStatus): string {
  switch (status) {
    case 'working':
      return 'Working';
    case 'idle':
      return 'Idle';
    case 'maintenance':
      return 'Maintenance';
    case 'rented':
      return 'Rented';
    case 'available':
      return 'Available';
  }
}

export function rentalColor(status: RentalStatus): string {
  switch (status) {
    case 'active':
      return PALETTE.success;
    case 'upcoming':
      return PALETTE.info;
    case 'completed':
      return PALETTE.textSecondary;
    case 'overdue':
      return PALETTE.error;
  }
}

export function rentalLabel(status: RentalStatus): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'upcoming':
      return 'Upcoming';
    case 'completed':
      return 'Completed';
    case 'overdue':
      return 'Overdue';
  }
}

export function priorityColor(p: Priority): string {
  switch (p) {
    case 'high':
      return PALETTE.priorityHigh;
    case 'medium':
      return PALETTE.priorityMedium;
    case 'low':
      return PALETTE.priorityLow;
  }
}

export function prioritySoftColor(p: Priority): string {
  switch (p) {
    case 'high':
      return PALETTE.priorityHighSoft;
    case 'medium':
      return PALETTE.priorityMediumSoft;
    case 'low':
      return PALETTE.priorityLowSoft;
  }
}

export function priorityLabel(p: Priority): string {
  switch (p) {
    case 'high':
      return 'High';
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Low';
  }
}

export function taskStatusLabel(s: TaskStatus): string {
  switch (s) {
    case 'pending':
      return 'Pending';
    case 'in_progress':
      return 'In Progress';
    case 'paused':
      return 'Paused';
    case 'completed':
      return 'Completed';
  }
}

export function taskStatusColor(s: TaskStatus): string {
  switch (s) {
    case 'pending':
      return PALETTE.textSecondary;
    case 'in_progress':
      return PALETTE.info;
    case 'paused':
      return PALETTE.warning;
    case 'completed':
      return PALETTE.success;
  }
}

export function shiftLabel(s: ShiftStatus): string {
  switch (s) {
    case 'on_duty':
      return 'On Duty';
    case 'off_duty':
      return 'Off Duty';
    case 'break':
      return 'On Break';
  }
}

export function shiftColor(s: ShiftStatus): string {
  switch (s) {
    case 'on_duty':
      return PALETTE.success;
    case 'off_duty':
      return PALETTE.textSecondary;
    case 'break':
      return PALETTE.warning;
  }
}

export function checklistLabel(s: ChecklistStatus): string {
  switch (s) {
    case 'pending':
      return 'Pending';
    case 'passed':
      return 'Passed';
    case 'failed':
      return 'Failed';
  }
}

export function checklistColor(s: ChecklistStatus): string {
  switch (s) {
    case 'pending':
      return PALETTE.warning;
    case 'passed':
      return PALETTE.success;
    case 'failed':
      return PALETTE.error;
  }
}

export function healthColor(score: number): string {
  if (score >= 90) return PALETTE.success;
  if (score >= 75) return PALETTE.warning;
  return PALETTE.error;
}
