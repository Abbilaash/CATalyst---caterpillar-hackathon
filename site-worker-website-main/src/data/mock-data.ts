import {
  Pickaxe,
  Truck,
  Loader,
  Tractor,
  Cog,
  Wrench,
  Fuel,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
} from 'lucide-react';

export type EquipmentCategory =
  | 'Excavator'
  | 'Dump Truck'
  | 'Wheel Loader'
  | 'Bulldozer'
  | 'Motor Grader'
  | 'Backhoe Loader'
  | 'Articulated Truck';

export type RentalStatus = 'Active' | 'Idle' | 'On Maintenance' | 'Transport' | 'Available';

export type MachineStatus = 'Working' | 'Idle' | 'Maintenance' | 'Transport' | 'Offline';

export type TaskStatus = 'In Progress' | 'Pending' | 'Completed' | 'Delayed' | 'On Hold';

export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';

export type ShiftStatus = 'On Shift' | 'Off Shift' | 'Break' | 'Off Sick';

export type MaintenanceStatus = 'Scheduled' | 'Overdue' | 'In Progress' | 'Completed' | 'Requested';

export type ActivityType =
  | 'equipment_assigned'
  | 'task_started'
  | 'task_completed'
  | 'issue_reported'
  | 'maintenance_scheduled'
  | 'rental_extended';

export interface Site {
  id: string;
  name: string;
  location: string;
  weather: { temp: number; condition: string; high: number; low: number; wind: number };
}

export interface Operator {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  avatar: string;
  assignedMachineId: string | null;
  currentTask: string | null;
  shift: ShiftStatus;
  experienceYears: number;
  safetyScore: number;
  availability: 'Available' | 'On Task' | 'Unavailable';
  hoursThisWeek: number;
  hoursTotal: number;
  phone: string;
  certifications: string[];
  hireDate: string;
  completedTasks: number;
  openTasks: number;
  performance: number;
}

export interface MaintenanceRecord {
  id: string;
  machineId: string;
  type: string;
  description: string;
  date: string;
  hours: number;
  technician: string;
  status: MaintenanceStatus;
  cost: number;
  priority: Priority;
}

export interface Machine {
  id: string;
  machineId: string;
  name: string;
  category: EquipmentCategory;
  image: string;
  rentalStatus: RentalStatus;
  status: MachineStatus;
  currentSiteId: string;
  assignedOperatorId: string | null;
  healthScore: number;
  engineHours: number;
  idleHours: number;
  fuelLevel: number;
  currentTask: string | null;
  rentalStart: string;
  rentalEnd: string;
  dailyRate: number;
  serialNumber: string;
  year: number;
  issues: { id: string; title: string; severity: 'Low' | 'Medium' | 'High'; reportedDate: string }[];
  maintenanceHistory: MaintenanceRecord[];
  upcomingMaintenance: { id: string; type: string; date: string; hours: number }[];
}

export interface Task {
  id: string;
  title: string;
  machineId: string;
  operatorId: string | null;
  siteId: string;
  priority: Priority;
  status: TaskStatus;
  progress: number;
  startTime: string;
  expectedCompletion: string;
  description: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  actor: string;
}

export interface MaintenanceRequest {
  id: string;
  machineId: string;
  machineName: string;
  requestType: string;
  description: string;
  priority: Priority;
  status: MaintenanceStatus;
  requestedBy: string;
  requestedDate: string;
  estimatedCost: number;
}

// ---------- Sites ----------
export const sites: Site[] = [
  {
    id: 'site-01',
    name: 'Highland Ridge Quarry',
    location: 'Bakersfield, CA',
    weather: { temp: 94, condition: 'Sunny', high: 97, low: 72, wind: 8 },
  },
  {
    id: 'site-02',
    name: 'Cedar Creek Dam Project',
    location: 'Boise, ID',
    weather: { temp: 78, condition: 'Partly Cloudy', high: 82, low: 61, wind: 12 },
  },
  {
    id: 'site-03',
    name: 'Summit Highway Expansion',
    location: 'Denver, CO',
    weather: { temp: 71, condition: 'Clear', high: 75, low: 55, wind: 6 },
  },
];

export const currentSite = sites[0];

// ---------- Operators (10) ----------
export const operators: Operator[] = [
  {
    id: 'op-01',
    employeeId: 'EMP-1042',
    name: 'Marcus Whitfield',
    role: 'Lead Heavy Equipment Operator',
    avatar: 'https://i.pravatar.cc/150?img=11',
    assignedMachineId: 'mac-01',
    currentTask: 'Primary bench excavation',
    shift: 'On Shift',
    experienceYears: 14,
    safetyScore: 98,
    availability: 'On Task',
    hoursThisWeek: 42,
    hoursTotal: 18420,
    phone: '(555) 210-8841',
    certifications: ['Class A CDL', 'OSHA 30', 'Heavy Equipment Level III'],
    hireDate: '2011-03-14',
    completedTasks: 12,
    openTasks: 1,
    performance: 94,
  },
  {
    id: 'op-02',
    employeeId: 'EMP-1043',
    name: 'Dale Cooper',
    role: 'Excavator Operator',
    avatar: 'https://i.pravatar.cc/150?img=12',
    assignedMachineId: 'mac-02',
    currentTask: 'Trenching — Sector B',
    shift: 'On Shift',
    experienceYears: 9,
    safetyScore: 95,
    availability: 'On Task',
    hoursThisWeek: 38,
    hoursTotal: 11200,
    phone: '(555) 210-8842',
    certifications: ['Class B CDL', 'OSHA 30'],
    hireDate: '2016-08-02',
    completedTasks: 9,
    openTasks: 1,
    performance: 88,
  },
  {
    id: 'op-03',
    employeeId: 'EMP-1044',
    name: 'Raymond Holt',
    role: 'Bulldozer Operator',
    avatar: 'https://i.pravatar.cc/150?img=13',
    assignedMachineId: 'mac-04',
    currentTask: 'Rough grading — North pad',
    shift: 'On Shift',
    experienceYears: 21,
    safetyScore: 99,
    availability: 'On Task',
    hoursThisWeek: 44,
    hoursTotal: 24300,
    phone: '(555) 210-8843',
    certifications: ['Class A CDL', 'OSHA 30', 'Heavy Equipment Level III', 'Rigger Level I'],
    hireDate: '2004-01-22',
    completedTasks: 15,
    openTasks: 1,
    performance: 96,
  },
  {
    id: 'op-04',
    employeeId: 'EMP-1045',
    name: 'Terry Jeffords',
    role: 'Wheel Loader Operator',
    avatar: 'https://i.pravatar.cc/150?img=14',
    assignedMachineId: 'mac-03',
    currentTask: 'Stockpile loading — Plant 3',
    shift: 'Break',
    experienceYears: 11,
    safetyScore: 92,
    availability: 'On Task',
    hoursThisWeek: 36,
    hoursTotal: 15800,
    phone: '(555) 210-8844',
    certifications: ['Class B CDL', 'OSHA 10'],
    hireDate: '2013-09-18',
    completedTasks: 8,
    openTasks: 1,
    performance: 85,
  },
  {
    id: 'op-05',
    employeeId: 'EMP-1046',
    name: 'Jake Peralta',
    role: 'Articulated Truck Driver',
    avatar: 'https://i.pravatar.cc/150?img=15',
    assignedMachineId: 'mac-06',
    currentTask: 'Haul route Alpha — haul cycle',
    shift: 'On Shift',
    experienceYears: 6,
    safetyScore: 88,
    availability: 'On Task',
    hoursThisWeek: 40,
    hoursTotal: 7400,
    phone: '(555) 210-8845',
    certifications: ['Class A CDL', 'OSHA 10'],
    hireDate: '2018-11-05',
    completedTasks: 7,
    openTasks: 1,
    performance: 82,
  },
  {
    id: 'op-06',
    employeeId: 'EMP-1047',
    name: 'Amy Santiago',
    role: 'Motor Grader Operator',
    avatar: 'https://i.pravatar.cc/150?img=16',
    assignedMachineId: 'mac-05',
    currentTask: 'Roadway fine grading',
    shift: 'On Shift',
    experienceYears: 8,
    safetyScore: 97,
    availability: 'On Task',
    hoursThisWeek: 41,
    hoursTotal: 9600,
    phone: '(555) 210-8846',
    certifications: ['Class B CDL', 'OSHA 30', 'Heavy Equipment Level II'],
    hireDate: '2017-04-29',
    completedTasks: 10,
    openTasks: 1,
    performance: 91,
  },
  {
    id: 'op-07',
    employeeId: 'EMP-1048',
    name: 'Rosa Diaz',
    role: 'Backhoe Operator',
    avatar: 'https://i.pravatar.cc/150?img=17',
    assignedMachineId: 'mac-07',
    currentTask: 'Utility trench — Line 4',
    shift: 'Off Shift',
    experienceYears: 12,
    safetyScore: 94,
    availability: 'Available',
    hoursThisWeek: 32,
    hoursTotal: 13900,
    phone: '(555) 210-8847',
    certifications: ['Class B CDL', 'OSHA 30'],
    hireDate: '2012-06-11',
    completedTasks: 11,
    openTasks: 0,
    performance: 90,
  },
  {
    id: 'op-08',
    employeeId: 'EMP-1049',
    name: 'Charles Boyle',
    role: 'Dump Truck Driver',
    avatar: 'https://i.pravatar.cc/150?img=18',
    assignedMachineId: 'mac-08',
    currentTask: null,
    shift: 'Off Shift',
    experienceYears: 7,
    safetyScore: 90,
    availability: 'Available',
    hoursThisWeek: 28,
    hoursTotal: 6800,
    phone: '(555) 210-8848',
    certifications: ['Class A CDL', 'OSHA 10'],
    hireDate: '2019-02-14',
    completedTasks: 6,
    openTasks: 0,
    performance: 79,
  },
  {
    id: 'op-09',
    employeeId: 'EMP-1050',
    name: 'Gina Linetti',
    role: 'Excavator Operator',
    avatar: 'https://i.pravatar.cc/150?img=19',
    assignedMachineId: 'mac-09',
    currentTask: null,
    shift: 'Off Sick',
    experienceYears: 5,
    safetyScore: 85,
    availability: 'Unavailable',
    hoursThisWeek: 12,
    hoursTotal: 4200,
    phone: '(555) 210-8849',
    certifications: ['Class B CDL', 'OSHA 10'],
    hireDate: '2020-07-23',
    completedTasks: 4,
    openTasks: 0,
    performance: 74,
  },
  {
    id: 'op-10',
    employeeId: 'EMP-1051',
    name: 'Norm Scully',
    role: 'Relief Operator',
    avatar: 'https://i.pravatar.cc/150?img=20',
    assignedMachineId: null,
    currentTask: null,
    shift: 'On Shift',
    experienceYears: 18,
    safetyScore: 93,
    availability: 'Available',
    hoursThisWeek: 22,
    hoursTotal: 20100,
    phone: '(555) 210-8850',
    certifications: ['Class A CDL', 'OSHA 30', 'Heavy Equipment Level II'],
    hireDate: '2006-10-30',
    completedTasks: 13,
    openTasks: 0,
    performance: 87,
  },
];

// helper to build image URL via pravatar is used for operator avatars; machine images use picsum-style placeholders seeded by id
const machineImg = (seed: string) => `https://picsum.photos/seed/cat-${seed}/600/400`;

// ---------- Machines (15) ----------
export const machines: Machine[] = [
  {
    id: 'mac-01',
    machineId: 'CAT-395F-001',
    name: 'CAT 395F Long Reach Excavator',
    category: 'Excavator',
    image: machineImg('395f'),
    rentalStatus: 'Active',
    status: 'Working',
    currentSiteId: 'site-01',
    assignedOperatorId: 'op-01',
    healthScore: 96,
    engineHours: 8420,
    idleHours: 980,
    fuelLevel: 78,
    currentTask: 'Primary bench excavation',
    rentalStart: '2026-06-01',
    rentalEnd: '2026-09-30',
    dailyRate: 2850,
    serialNumber: 'CAT395F0A1042',
    year: 2023,
    issues: [],
    maintenanceHistory: [
      {
        id: 'mh-001-1',
        machineId: 'mac-01',
        type: 'Engine Service',
        description: '250-hour engine oil and filter service',
        date: '2026-07-12',
        hours: 8200,
        technician: 'Field Service Team A',
        status: 'Completed',
        cost: 1240,
        priority: 'Medium',
      },
      {
        id: 'mh-001-2',
        machineId: 'mac-01',
        type: 'Hydraulic Inspection',
        description: 'Hydraulic line pressure test and cylinder inspection',
        date: '2026-06-04',
        hours: 7900,
        technician: 'Field Service Team A',
        status: 'Completed',
        cost: 680,
        priority: 'Low',
      },
    ],
    upcomingMaintenance: [
      { id: 'um-001-1', type: '500-Hour Service', date: '2026-08-20', hours: 8700 },
    ],
  },
  {
    id: 'mac-02',
    machineId: 'CAT-336-002',
    name: 'CAT 336 Hydraulic Excavator',
    category: 'Excavator',
    image: machineImg('336'),
    rentalStatus: 'Active',
    status: 'Working',
    currentSiteId: 'site-01',
    assignedOperatorId: 'op-02',
    healthScore: 91,
    engineHours: 6210,
    idleHours: 1120,
    fuelLevel: 64,
    currentTask: 'Trenching — Sector B',
    rentalStart: '2026-05-15',
    rentalEnd: '2026-08-15',
    dailyRate: 2100,
    serialNumber: 'CAT3360B2210',
    year: 2022,
    issues: [{ id: 'iss-002-1', title: 'Hydraulic temp sensor intermittent', severity: 'Low', reportedDate: '2026-07-26' }],
    maintenanceHistory: [
      {
        id: 'mh-002-1',
        machineId: 'mac-02',
        type: 'Track Service',
        description: 'Track tension adjustment and undercarriage inspection',
        date: '2026-07-18',
        hours: 6100,
        technician: 'Field Service Team B',
        status: 'Completed',
        cost: 540,
        priority: 'Low',
      },
    ],
    upcomingMaintenance: [
      { id: 'um-002-1', type: '250-Hour Service', date: '2026-08-10', hours: 6400 },
    ],
  },
  {
    id: 'mac-03',
    machineId: 'CAT-988K-003',
    name: 'CAT 988K Wheel Loader',
    category: 'Wheel Loader',
    image: machineImg('988k'),
    rentalStatus: 'Active',
    status: 'Idle',
    currentSiteId: 'site-01',
    assignedOperatorId: 'op-04',
    healthScore: 84,
    engineHours: 11200,
    idleHours: 2100,
    fuelLevel: 45,
    currentTask: 'Stockpile loading — Plant 3',
    rentalStart: '2026-04-01',
    rentalEnd: '2026-10-01',
    dailyRate: 2400,
    serialNumber: 'CAT988K0C3305',
    year: 2021,
    issues: [{ id: 'iss-003-1', title: 'Bucket cylinder slow return', severity: 'Medium', reportedDate: '2026-07-27' }],
    maintenanceHistory: [
      {
        id: 'mh-003-1',
        machineId: 'mac-03',
        type: 'Transmission Service',
        description: 'Transmission fluid and filter change',
        date: '2026-06-22',
        hours: 10800,
        technician: 'Field Service Team A',
        status: 'Completed',
        cost: 1820,
        priority: 'High',
      },
    ],
    upcomingMaintenance: [
      { id: 'um-003-1', type: '500-Hour Service', date: '2026-08-05', hours: 11400 },
    ],
  },
  {
    id: 'mac-04',
    machineId: 'CAT-D10T2-004',
    name: 'CAT D10T2 Track-Type Tractor',
    category: 'Bulldozer',
    image: machineImg('d10t2'),
    rentalStatus: 'Active',
    status: 'Working',
    currentSiteId: 'site-01',
    assignedOperatorId: 'op-03',
    healthScore: 94,
    engineHours: 9750,
    idleHours: 760,
    fuelLevel: 82,
    currentTask: 'Rough grading — North pad',
    rentalStart: '2026-05-01',
    rentalEnd: '2026-11-01',
    dailyRate: 2600,
    serialNumber: 'CATD10T0D4018',
    year: 2023,
    issues: [],
    maintenanceHistory: [
      {
        id: 'mh-004-1',
        machineId: 'mac-04',
        type: 'Undercarriage Service',
        description: 'Track shoe inspection and segment replacement',
        date: '2026-07-01',
        hours: 9400,
        technician: 'Field Service Team B',
        status: 'Completed',
        cost: 3200,
        priority: 'High',
      },
    ],
    upcomingMaintenance: [
      { id: 'um-004-1', type: '1000-Hour Service', date: '2026-09-15', hours: 10000 },
    ],
  },
  {
    id: 'mac-05',
    machineId: 'CAT-140K-005',
    name: 'CAT 140K Motor Grader',
    category: 'Motor Grader',
    image: machineImg('140k'),
    rentalStatus: 'Active',
    status: 'Working',
    currentSiteId: 'site-02',
    assignedOperatorId: 'op-06',
    healthScore: 89,
    engineHours: 5400,
    idleHours: 640,
    fuelLevel: 70,
    currentTask: 'Roadway fine grading',
    rentalStart: '2026-06-10',
    rentalEnd: '2026-09-10',
    dailyRate: 1750,
    serialNumber: 'CAT140K0E5512',
    year: 2022,
    issues: [{ id: 'iss-005-1', title: 'Moldboard edge wear approaching limit', severity: 'Low', reportedDate: '2026-07-24' }],
    maintenanceHistory: [
      {
        id: 'mh-005-1',
        machineId: 'mac-05',
        type: 'Blade Service',
        description: 'Moldboard edge rotation and circle lube',
        date: '2026-06-28',
        hours: 5100,
        technician: 'Field Service Team A',
        status: 'Completed',
        cost: 410,
        priority: 'Low',
      },
    ],
    upcomingMaintenance: [
      { id: 'um-005-1', type: '250-Hour Service', date: '2026-08-18', hours: 5600 },
    ],
  },
  {
    id: 'mac-06',
    machineId: 'CAT-730-006',
    name: 'CAT 730 Articulated Truck',
    category: 'Articulated Truck',
    image: machineImg('730'),
    rentalStatus: 'Active',
    status: 'Working',
    currentSiteId: 'site-02',
    assignedOperatorId: 'op-05',
    healthScore: 87,
    engineHours: 7800,
    idleHours: 1450,
    fuelLevel: 58,
    currentTask: 'Haul route Alpha — haul cycle',
    rentalStart: '2026-06-20',
    rentalEnd: '2026-10-20',
    dailyRate: 1950,
    serialNumber: 'CAT7300F6617',
    year: 2021,
    issues: [{ id: 'iss-006-1', title: 'Suspension warning — rear axle', severity: 'Medium', reportedDate: '2026-07-28' }],
    maintenanceHistory: [
      {
        id: 'mh-006-1',
        machineId: 'mac-06',
        type: 'Brake Service',
        description: 'Brake fluid flush and pad inspection',
        date: '2026-07-08',
        hours: 7600,
        technician: 'Field Service Team B',
        status: 'Completed',
        cost: 980,
        priority: 'Medium',
      },
    ],
    upcomingMaintenance: [
      { id: 'um-006-1', type: '500-Hour Service', date: '2026-08-22', hours: 8000 },
    ],
  },
  {
    id: 'mac-07',
    machineId: 'CAT-420F2-007',
    name: 'CAT 420F2 Backhoe Loader',
    category: 'Backhoe Loader',
    image: machineImg('420f2'),
    rentalStatus: 'Active',
    status: 'Idle',
    currentSiteId: 'site-03',
    assignedOperatorId: 'op-07',
    healthScore: 92,
    engineHours: 3200,
    idleHours: 380,
    fuelLevel: 66,
    currentTask: null,
    rentalStart: '2026-07-01',
    rentalEnd: '2026-10-01',
    dailyRate: 1100,
    serialNumber: 'CAT420F0G7720',
    year: 2023,
    issues: [],
    maintenanceHistory: [
      {
        id: 'mh-007-1',
        machineId: 'mac-07',
        type: 'Engine Service',
        description: '250-hour service and coolant check',
        date: '2026-07-15',
        hours: 3050,
        technician: 'Field Service Team A',
        status: 'Completed',
        cost: 520,
        priority: 'Low',
      },
    ],
    upcomingMaintenance: [
      { id: 'um-007-1', type: '500-Hour Service', date: '2026-09-01', hours: 3500 },
    ],
  },
  {
    id: 'mac-08',
    machineId: 'CAT-CT660-008',
    name: 'CAT CT660 On-Highway Dump Truck',
    category: 'Dump Truck',
    image: machineImg('ct660'),
    rentalStatus: 'Available',
    status: 'Idle',
    currentSiteId: 'site-03',
    assignedOperatorId: 'op-08',
    healthScore: 78,
    engineHours: 14800,
    idleHours: 3200,
    fuelLevel: 40,
    currentTask: null,
    rentalStart: '2026-03-01',
    rentalEnd: '2026-12-01',
    dailyRate: 980,
    serialNumber: 'CATCT660H8833',
    year: 2020,
    issues: [
      { id: 'iss-008-1', title: 'DPF regeneration required', severity: 'High', reportedDate: '2026-07-25' },
      { id: 'iss-008-2', title: 'Tire wear — front right', severity: 'Medium', reportedDate: '2026-07-21' },
    ],
    maintenanceHistory: [
      {
        id: 'mh-008-1',
        machineId: 'mac-08',
        type: 'Emissions Service',
        description: 'DPF cleaning and sensor replacement',
        date: '2026-05-30',
        hours: 14200,
        technician: 'Field Service Team B',
        status: 'Completed',
        cost: 2400,
        priority: 'High',
      },
    ],
    upcomingMaintenance: [
      { id: 'um-008-1', type: 'Emissions Service', date: '2026-08-02', hours: 14900 },
    ],
  },
  {
    id: 'mac-09',
    machineId: 'CAT-320-009',
    name: 'CAT 320 Hydraulic Excavator',
    category: 'Excavator',
    image: machineImg('320'),
    rentalStatus: 'On Maintenance',
    status: 'Maintenance',
    currentSiteId: 'site-01',
    assignedOperatorId: 'op-09',
    healthScore: 62,
    engineHours: 13400,
    idleHours: 2800,
    fuelLevel: 30,
    currentTask: null,
    rentalStart: '2026-02-01',
    rentalEnd: '2026-11-01',
    dailyRate: 1650,
    serialNumber: 'CAT3200I9904',
    year: 2019,
    issues: [{ id: 'iss-009-1', title: 'Engine overheating under load', severity: 'High', reportedDate: '2026-07-22' }],
    maintenanceHistory: [
      {
        id: 'mh-009-1',
        machineId: 'mac-09',
        type: 'Engine Overhaul',
        description: 'Cooling system overhaul — thermostat and water pump',
        date: '2026-07-29',
        hours: 13400,
        technician: 'Field Service Team A',
        status: 'In Progress',
        cost: 4100,
        priority: 'High',
      },
    ],
    upcomingMaintenance: [
      { id: 'um-009-1', type: 'Post-Overhaul Inspection', date: '2026-08-12', hours: 13450 },
    ],
  },
  {
    id: 'mac-10',
    machineId: 'CAT-966M-010',
    name: 'CAT 966M Wheel Loader',
    category: 'Wheel Loader',
    image: machineImg('966m'),
    rentalStatus: 'Active',
    status: 'Working',
    currentSiteId: 'site-02',
    assignedOperatorId: null,
    healthScore: 90,
    engineHours: 6700,
    idleHours: 880,
    fuelLevel: 72,
    currentTask: 'Aggregate stockpile management',
    rentalStart: '2026-06-05',
    rentalEnd: '2026-10-05',
    dailyRate: 1850,
    serialNumber: 'CAT966M0J1005',
    year: 2022,
    issues: [],
    maintenanceHistory: [
      {
        id: 'mh-010-1',
        machineId: 'mac-10',
        type: 'Engine Service',
        description: '250-hour oil and filter service',
        date: '2026-07-03',
        hours: 6500,
        technician: 'Field Service Team A',
        status: 'Completed',
        cost: 690,
        priority: 'Low',
      },
    ],
    upcomingMaintenance: [
      { id: 'um-010-1', type: '500-Hour Service', date: '2026-08-28', hours: 6900 },
    ],
  },
  {
    id: 'mac-11',
    machineId: 'CAT-D6K2-011',
    name: 'CAT D6K2 Track-Type Tractor',
    category: 'Bulldozer',
    image: machineImg('d6k2'),
    rentalStatus: 'Active',
    status: 'Working',
    currentSiteId: 'site-03',
    assignedOperatorId: null,
    healthScore: 88,
    engineHours: 4900,
    idleHours: 520,
    fuelLevel: 68,
    currentTask: 'Slope finishing — embankment',
    rentalStart: '2026-07-10',
    rentalEnd: '2026-11-10',
    dailyRate: 1900,
    serialNumber: 'CATD6K20K1120',
    year: 2022,
    issues: [{ id: 'iss-011-1', title: 'Ripper tooth wear', severity: 'Low', reportedDate: '2026-07-23' }],
    maintenanceHistory: [
      {
        id: 'mh-011-1',
        machineId: 'mac-11',
        type: 'Undercarriage Service',
        description: 'Track inspection and tension',
        date: '2026-06-18',
        hours: 4600,
        technician: 'Field Service Team B',
        status: 'Completed',
        cost: 720,
        priority: 'Low',
      },
    ],
    upcomingMaintenance: [
      { id: 'um-011-1', type: '250-Hour Service', date: '2026-08-15', hours: 5100 },
    ],
  },
  {
    id: 'mac-12',
    machineId: 'CAT-349F2-012',
    name: 'CAT 349F2 Hydraulic Excavator',
    category: 'Excavator',
    image: machineImg('349f2'),
    rentalStatus: 'Transport',
    status: 'Transport',
    currentSiteId: 'site-01',
    assignedOperatorId: null,
    healthScore: 93,
    engineHours: 4100,
    idleHours: 300,
    fuelLevel: 50,
    currentTask: null,
    rentalStart: '2026-07-20',
    rentalEnd: '2026-12-20',
    dailyRate: 2300,
    serialNumber: 'CAT349F0L1231',
    year: 2023,
    issues: [],
    maintenanceHistory: [
      {
        id: 'mh-012-1',
        machineId: 'mac-12',
        type: 'Pre-Delivery Inspection',
        description: 'PDI before mobilization to Highland Ridge',
        date: '2026-07-19',
        hours: 4080,
        technician: 'Field Service Team A',
        status: 'Completed',
        cost: 350,
        priority: 'Low',
      },
    ],
    upcomingMaintenance: [
      { id: 'um-012-1', type: '250-Hour Service', date: '2026-09-05', hours: 4400 },
    ],
  },
  {
    id: 'mac-13',
    machineId: 'CAT-14M3-013',
    name: 'CAT 14M3 Motor Grader',
    category: 'Motor Grader',
    image: machineImg('14m3'),
    rentalStatus: 'Active',
    status: 'Idle',
    currentSiteId: 'site-02',
    assignedOperatorId: null,
    healthScore: 81,
    engineHours: 9100,
    idleHours: 1700,
    fuelLevel: 48,
    currentTask: null,
    rentalStart: '2026-04-15',
    rentalEnd: '2026-10-15',
    dailyRate: 1680,
    serialNumber: 'CAT14M30M1342',
    year: 2020,
    issues: [{ id: 'iss-013-1', title: 'Circle wear — grading precision drift', severity: 'Medium', reportedDate: '2026-07-20' }],
    maintenanceHistory: [
      {
        id: 'mh-013-1',
        machineId: 'mac-13',
        type: 'Hydraulic Service',
        description: 'Hydraulic cylinder seal replacement',
        date: '2026-05-12',
        hours: 8700,
        technician: 'Field Service Team B',
        status: 'Completed',
        cost: 1450,
        priority: 'Medium',
      },
    ],
    upcomingMaintenance: [
      { id: 'um-013-1', type: '1000-Hour Service', date: '2026-08-09', hours: 9300 },
    ],
  },
  {
    id: 'mac-14',
    machineId: 'CAT-745-014',
    name: 'CAT 745 Articulated Truck',
    category: 'Articulated Truck',
    image: machineImg('745'),
    rentalStatus: 'Active',
    status: 'Working',
    currentSiteId: 'site-01',
    assignedOperatorId: null,
    healthScore: 86,
    engineHours: 8600,
    idleHours: 1200,
    fuelLevel: 55,
    currentTask: 'Overburden haul — Pit 2',
    rentalStart: '2026-05-25',
    rentalEnd: '2026-11-25',
    dailyRate: 2200,
    serialNumber: 'CAT7450N1453',
    year: 2021,
    issues: [],
    maintenanceHistory: [
      {
        id: 'mh-014-1',
        machineId: 'mac-14',
        type: 'Transmission Service',
        description: 'Transmission service and retarder check',
        date: '2026-06-15',
        hours: 8300,
        technician: 'Field Service Team A',
        status: 'Completed',
        cost: 1620,
        priority: 'High',
      },
    ],
    upcomingMaintenance: [
      { id: 'um-014-1', type: '500-Hour Service', date: '2026-08-25', hours: 8800 },
    ],
  },
  {
    id: 'mac-15',
    machineId: 'CAT-950GC-015',
    name: 'CAT 950GC Wheel Loader',
    category: 'Wheel Loader',
    image: machineImg('950gc'),
    rentalStatus: 'Available',
    status: 'Idle',
    currentSiteId: 'site-03',
    assignedOperatorId: null,
    healthScore: 95,
    engineHours: 1200,
    idleHours: 80,
    fuelLevel: 90,
    currentTask: null,
    rentalStart: '2026-07-25',
    rentalEnd: '2027-01-25',
    dailyRate: 1450,
    serialNumber: 'CAT950GO1564',
    year: 2024,
    issues: [],
    maintenanceHistory: [
      {
        id: 'mh-015-1',
        machineId: 'mac-15',
        type: 'Pre-Delivery Inspection',
        description: 'New unit PDI — commissioning',
        date: '2026-07-24',
        hours: 50,
        technician: 'Field Service Team A',
        status: 'Completed',
        cost: 280,
        priority: 'Low',
      },
    ],
    upcomingMaintenance: [
      { id: 'um-015-1', type: '250-Hour Service', date: '2026-10-01', hours: 1500 },
    ],
  },
];

// ---------- Tasks (20) ----------
export const tasks: Task[] = [
  { id: 'tsk-01', title: 'Primary bench excavation', machineId: 'mac-01', operatorId: 'op-01', siteId: 'site-01', priority: 'High', status: 'In Progress', progress: 62, startTime: '2026-07-30T06:00', expectedCompletion: '2026-07-30T16:00', description: 'Excavate primary bench to elevation 240 across grid A-4.' },
  { id: 'tsk-02', title: 'Trenching — Sector B', machineId: 'mac-02', operatorId: 'op-02', siteId: 'site-01', priority: 'High', status: 'In Progress', progress: 48, startTime: '2026-07-30T06:30', expectedCompletion: '2026-07-30T15:30', description: '2.1m trench for drainage along Sector B.' },
  { id: 'tsk-03', title: 'Rough grading — North pad', machineId: 'mac-04', operatorId: 'op-03', siteId: 'site-01', priority: 'Medium', status: 'In Progress', progress: 75, startTime: '2026-07-30T05:30', expectedCompletion: '2026-07-30T13:00', description: 'Rough grade North pad to ±50mm tolerance.' },
  { id: 'tsk-04', title: 'Stockpile loading — Plant 3', machineId: 'mac-03', operatorId: 'op-04', siteId: 'site-01', priority: 'Medium', status: 'On Hold', progress: 30, startTime: '2026-07-30T07:00', expectedCompletion: '2026-07-30T14:00', description: 'Load aggregate from Plant 3 stockpile to haul trucks.' },
  { id: 'tsk-05', title: 'Haul route Alpha — haul cycle', machineId: 'mac-06', operatorId: 'op-05', siteId: 'site-02', priority: 'High', status: 'In Progress', progress: 55, startTime: '2026-07-30T06:15', expectedCompletion: '2026-07-30T17:00', description: 'Continuous haul cycle on Alpha route, 8m³ per trip.' },
  { id: 'tsk-06', title: 'Roadway fine grading', machineId: 'mac-05', operatorId: 'op-06', siteId: 'site-02', priority: 'Medium', status: 'In Progress', progress: 68, startTime: '2026-07-30T06:45', expectedCompletion: '2026-07-30T15:45', description: 'Final grade of access road, 300m segment.' },
  { id: 'tsk-07', title: 'Utility trench — Line 4', machineId: 'mac-07', operatorId: 'op-07', siteId: 'site-03', priority: 'Low', status: 'Completed', progress: 100, startTime: '2026-07-29T07:00', expectedCompletion: '2026-07-29T12:00', description: 'Utility trench excavation and backfill — Line 4 complete.' },
  { id: 'tsk-08', title: 'Aggregate stockpile management', machineId: 'mac-10', operatorId: null, siteId: 'site-02', priority: 'Low', status: 'In Progress', progress: 40, startTime: '2026-07-30T08:00', expectedCompletion: '2026-07-30T16:00', description: 'Manage and rotate aggregate stockpiles.' },
  { id: 'tsk-09', title: 'Slope finishing — embankment', machineId: 'mac-11', operatorId: null, siteId: 'site-03', priority: 'Medium', status: 'In Progress', progress: 51, startTime: '2026-07-30T07:30', expectedCompletion: '2026-07-30T17:30', description: 'Finish slope face on west embankment.' },
  { id: 'tsk-10', title: 'Overburden haul — Pit 2', machineId: 'mac-14', operatorId: null, siteId: 'site-01', priority: 'High', status: 'In Progress', progress: 44, startTime: '2026-07-30T06:00', expectedCompletion: '2026-07-30T18:00', description: 'Haul overburden from Pit 2 to spoil area.' },
  { id: 'tsk-11', title: 'Bench extension — grid C', machineId: 'mac-01', operatorId: 'op-01', siteId: 'site-01', priority: 'Medium', status: 'Pending', progress: 0, startTime: '2026-07-31T06:00', expectedCompletion: '2026-07-31T14:00', description: 'Extend bench into grid C after primary bench.' },
  { id: 'tsk-12', title: 'Drainage channel clearing', machineId: 'mac-02', operatorId: 'op-02', siteId: 'site-01', priority: 'Low', status: 'Pending', progress: 0, startTime: '2026-07-31T07:00', expectedCompletion: '2026-07-31T11:00', description: 'Clear sediment from drainage channel D-2.' },
  { id: 'tsk-13', title: 'Final pad compaction', machineId: 'mac-04', operatorId: 'op-03', siteId: 'site-01', priority: 'Medium', status: 'Pending', progress: 0, startTime: '2026-07-31T13:00', expectedCompletion: '2026-07-31T17:00', description: 'Final compaction pass on North pad.' },
  { id: 'tsk-14', title: 'Haul route Bravo — haul cycle', machineId: 'mac-06', operatorId: 'op-05', siteId: 'site-02', priority: 'High', status: 'Pending', progress: 0, startTime: '2026-07-31T06:00', expectedCompletion: '2026-07-31T17:00', description: 'Begin haul cycle on Bravo route.' },
  { id: 'tsk-15', title: 'Shoulder grading — north access', machineId: 'mac-05', operatorId: 'op-06', siteId: 'site-02', priority: 'Low', status: 'Pending', progress: 0, startTime: '2026-07-31T08:00', expectedCompletion: '2026-07-31T15:00', description: 'Grade shoulders along north access road.' },
  { id: 'tsk-16', title: 'Ramp construction — Pit 1', machineId: 'mac-14', operatorId: null, siteId: 'site-01', priority: 'Critical', status: 'Delayed', progress: 20, startTime: '2026-07-29T06:00', expectedCompletion: '2026-07-30T12:00', description: 'Construct haul ramp in Pit 1 — delayed by ground water.' },
  { id: 'tsk-17', title: 'Plant 4 feed setup', machineId: 'mac-10', operatorId: null, siteId: 'site-02', priority: 'Medium', status: 'Pending', progress: 0, startTime: '2026-08-01T07:00', expectedCompletion: '2026-08-01T15:00', description: 'Set up feed to Plant 4 from stockpile.' },
  { id: 'tsk-18', title: 'Sediment basin excavation', machineId: 'mac-02', operatorId: 'op-02', siteId: 'site-01', priority: 'High', status: 'Completed', progress: 100, startTime: '2026-07-28T07:00', expectedCompletion: '2026-07-28T16:00', description: 'Excavate sediment basin SB-3 to design depth.' },
  { id: 'tsk-19', title: 'Access road widening', machineId: 'mac-11', operatorId: null, siteId: 'site-03', priority: 'Medium', status: 'Completed', progress: 100, startTime: '2026-07-28T06:30', expectedCompletion: '2026-07-28T15:30', description: 'Widen north access road by 1.5m each side.' },
  { id: 'tsk-20', title: 'Topsoil stripping — Sector A', machineId: 'mac-04', operatorId: 'op-03', siteId: 'site-01', priority: 'Low', status: 'Completed', progress: 100, startTime: '2026-07-27T07:00', expectedCompletion: '2026-07-27T13:00', description: 'Strip and stockpile topsoil in Sector A.' },
];

// ---------- Maintenance Requests (5) ----------
export const maintenanceRequests: MaintenanceRequest[] = [
  { id: 'mr-01', machineId: 'mac-09', machineName: 'CAT 320 Hydraulic Excavator', requestType: 'Engine Repair', description: 'Engine overheating under load — cooling system overhaul in progress.', priority: 'High', status: 'In Progress', requestedBy: 'Marcus Whitfield', requestedDate: '2026-07-22', estimatedCost: 4100 },
  { id: 'mr-02', machineId: 'mac-08', machineName: 'CAT CT660 On-Highway Dump Truck', requestType: 'Emissions Service', description: 'DPF regeneration required plus front tire replacement.', priority: 'Medium', status: 'Requested', requestedBy: 'Charles Boyle', requestedDate: '2026-07-25', estimatedCost: 3100 },
  { id: 'mr-03', machineId: 'mac-03', machineName: 'CAT 988K Wheel Loader', requestType: 'Hydraulic Repair', description: 'Bucket cylinder slow return — possible valve issue.', priority: 'Medium', status: 'Requested', requestedBy: 'Terry Jeffords', requestedDate: '2026-07-27', estimatedCost: 1450 },
  { id: 'mr-04', machineId: 'mac-06', machineName: 'CAT 730 Articulated Truck', requestType: 'Suspension Inspection', description: 'Rear axle suspension warning — inspect and replace struts if needed.', priority: 'Medium', status: 'Requested', requestedBy: 'Jake Peralta', requestedDate: '2026-07-28', estimatedCost: 2200 },
  { id: 'mr-05', machineId: 'mac-13', machineName: 'CAT 14M3 Motor Grader', requestType: 'Circle Repair', description: 'Circle wear causing grading precision drift — regrind circle.', priority: 'Low', status: 'Requested', requestedBy: 'Amy Santiago', requestedDate: '2026-07-20', estimatedCost: 1800 },
];

// ---------- Activity Timeline ----------
export const activities: Activity[] = [
  { id: 'act-01', type: 'equipment_assigned', title: 'Equipment Assigned', description: 'CAT 349F2 Excavator assigned to Highland Ridge Quarry', timestamp: '2026-07-30T07:42', actor: 'System' },
  { id: 'act-02', type: 'task_started', title: 'Task Started', description: 'Primary bench excavation began on CAT 395F', timestamp: '2026-07-30T06:00', actor: 'Marcus Whitfield' },
  { id: 'act-03', type: 'issue_reported', title: 'Issue Reported', description: 'Suspension warning reported on CAT 730 Articulated Truck', timestamp: '2026-07-30T08:15', actor: 'Jake Peralta' },
  { id: 'act-04', type: 'maintenance_scheduled', title: 'Maintenance Scheduled', description: '500-Hour Service scheduled for CAT 988K on Aug 5', timestamp: '2026-07-30T07:30', actor: 'Site Manager' },
  { id: 'act-05', type: 'task_completed', title: 'Task Completed', description: 'Utility trench — Line 4 completed by Rosa Diaz', timestamp: '2026-07-29T12:04', actor: 'Rosa Diaz' },
  { id: 'act-06', type: 'rental_extended', title: 'Rental Extended', description: 'CAT D10T2 rental extended to Nov 1, 2026', timestamp: '2026-07-29T15:20', actor: 'Site Manager' },
  { id: 'act-07', type: 'task_completed', title: 'Task Completed', description: 'Sediment basin excavation completed by Dale Cooper', timestamp: '2026-07-28T16:10', actor: 'Dale Cooper' },
  { id: 'act-08', type: 'issue_reported', title: 'Issue Reported', description: 'Engine overheating reported on CAT 320 Excavator', timestamp: '2026-07-22T09:05', actor: 'Gina Linetti' },
  { id: 'act-09', type: 'maintenance_scheduled', title: 'Maintenance Scheduled', description: 'Cooling system overhaul scheduled for CAT 320', timestamp: '2026-07-28T10:00', actor: 'Site Manager' },
  { id: 'act-10', type: 'equipment_assigned', title: 'Equipment Assigned', description: 'CAT 950GC Wheel Loader assigned to Summit Highway', timestamp: '2026-07-24T13:45', actor: 'System' },
];

// ---------- Reports chart data ----------
export const fleetUtilizationData = [
  { name: 'Mon', working: 9, idle: 4, maintenance: 2 },
  { name: 'Tue', working: 10, idle: 3, maintenance: 2 },
  { name: 'Wed', working: 11, idle: 2, maintenance: 2 },
  { name: 'Thu', working: 10, idle: 3, maintenance: 2 },
  { name: 'Fri', working: 8, idle: 4, maintenance: 3 },
  { name: 'Sat', working: 6, idle: 6, maintenance: 3 },
  { name: 'Sun', working: 3, idle: 9, maintenance: 3 },
];

export const downtimeData = [
  { name: 'mac-01', hours: 4, label: '395F' },
  { name: 'mac-02', hours: 8, label: '336' },
  { name: 'mac-03', hours: 22, label: '988K' },
  { name: 'mac-08', hours: 18, label: 'CT660' },
  { name: 'mac-09', hours: 36, label: '320' },
  { name: 'mac-13', hours: 14, label: '14M3' },
];

export const operatorProductivityData = operators
  .map((o) => ({ name: o.name.split(' ')[0], performance: o.performance, safety: o.safetyScore }));

export const completedTasksData = [
  { name: 'Wk 1', tasks: 18 },
  { name: 'Wk 2', tasks: 22 },
  { name: 'Wk 3', tasks: 19 },
  { name: 'Wk 4', tasks: 26 },
];

export const maintenanceCostData = [
  { name: 'Jun', cost: 8200 },
  { name: 'Jul', cost: 14630 },
  { name: 'Aug', cost: 9800 },
];

export const rentalPerformanceData = [
  { name: 'Highland', revenue: 18400, days: 30 },
  { name: 'Cedar Creek', revenue: 14200, days: 30 },
  { name: 'Summit Hwy', revenue: 9600, days: 30 },
];

// ---------- Helper accessors ----------
export const getOperator = (id: string | null) => operators.find((o) => o.id === id) ?? null;
export const getMachine = (id: string | null) => machines.find((m) => m.id === id) ?? null;
export const getSite = (id: string | null) => sites.find((s) => s.id === id) ?? null;

// ---------- Icon mapping ----------
export const categoryIcon = (category: EquipmentCategory) => {
  switch (category) {
    case 'Excavator':
      return Pickaxe;
    case 'Dump Truck':
    case 'Articulated Truck':
      return Truck;
    case 'Wheel Loader':
    case 'Backhoe Loader':
      return Loader;
    case 'Bulldozer':
      return Tractor;
    case 'Motor Grader':
      return Cog;
    default:
      return Cog;
  }
};

export const activityIcon = (type: ActivityType) => {
  switch (type) {
    case 'equipment_assigned':
      return Loader;
    case 'task_started':
      return Clock;
    case 'task_completed':
      return CheckCircle2;
    case 'issue_reported':
      return AlertTriangle;
    case 'maintenance_scheduled':
      return Wrench;
    case 'rental_extended':
      return Fuel;
    default:
      return User;
  }
};
