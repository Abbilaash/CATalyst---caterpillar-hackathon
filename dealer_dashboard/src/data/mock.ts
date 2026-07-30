// Centralized mock data for CAT Rental Operations Brain.
// Realistic Caterpillar equipment names, sites, operators, and fleet metrics.

export type Status = 'working' | 'idle' | 'critical' | 'maintenance' | 'transit';
export type Priority = 'high' | 'medium' | 'low';

export interface Equipment {
  id: string;
  name: string;
  model: string;
  category: 'Excavator' | 'Dozer' | 'Loader' | 'Grader' | 'Truck' | 'Compactor';
  image: string;
  site: string;
  operator: string;
  health: number;
  engineHours: number;
  idleHours: number;
  rentalRemainingDays: number;
  status: Status;
  riskScore: number;
}

export interface Site {
  id: string;
  name: string;
  location: string;
  machines: number;
  operators: number;
  utilization: number;
  upcomingDemand: string;
  weather: string;
  weatherTemp: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  aiAction: string;
}

export interface Operator {
  id: string;
  name: string;
  avatar: string;
  efficiency: number;
  safetyScore: number;
  assignedEquipment: string;
  experienceYears: number;
  lateReturns: number;
  rank: number;
}

export interface Recommendation {
  id: string;
  equipment: string;
  equipmentId: string;
  recommendation: string;
  reason: string;
  savings: number;
  confidence: number;
  priority: Priority;
  category: 'Relocation' | 'Maintenance' | 'Rental' | 'Utilization';
}

export interface ActivityEvent {
  id: string;
  type: 'assign' | 'start' | 'extend' | 'ai' | 'maintenance' | 'alert';
  title: string;
  detail: string;
  time: string;
}

export const KPIs = {
  fleetUtilization: { value: 87.4, delta: +2.1, trend: 'up' as const },
  revenueAtRisk: { value: 48200, delta: -3.2, trend: 'down' as const, currency: true },
  idleEquipment: { value: 14, delta: +1, trend: 'up' as const },
  activeRentals: { value: 126, delta: +4, trend: 'up' as const },
  rentalExpiring: { value: 9, delta: 0, trend: 'flat' as const },
  safetyAlerts: { value: 3, delta: -1, trend: 'down' as const },
};

export const executiveBrief = {
  greeting: 'Good Morning, Dealer',
  fleetHealth: 92,
  potentialSavings: 12400,
  criticalDecisions: 4,
  demandTomorrow: 'Excavators',
  demandTrend: 'up' as const,
  topRecommendation: {
    text: 'Move CAT 320 Excavator to Site Bravo',
    confidence: 97,
  },
};

export const recommendations: Recommendation[] = [
  {
    id: 'rec-1',
    equipment: 'CAT 320 Excavator',
    equipmentId: 'eq-1',
    recommendation: 'Relocate to Site Bravo',
    reason:
      'Idle for 14 hours while Site Bravo requires an excavator tomorrow for a new foundation pour.',
    savings: 2400,
    confidence: 97,
    priority: 'high',
    category: 'Relocation',
  },
  {
    id: 'rec-2',
    equipment: 'CAT 980 Loader',
    equipmentId: 'eq-3',
    recommendation: 'Schedule preventive maintenance',
    reason:
      'Engine hours approaching service interval (1,980/2,000). Risk of unplanned downtime increases 34% past threshold.',
    savings: 5800,
    confidence: 91,
    priority: 'high',
    category: 'Maintenance',
  },
  {
    id: 'rec-3',
    equipment: 'CAT 631 Scraper',
    equipmentId: 'eq-7',
    recommendation: 'Extend rental agreement',
    reason:
      'Customer project extended by 3 weeks. Renewing now avoids $1,200 re-mobilization fee and redeployment gap.',
    savings: 1200,
    confidence: 88,
    priority: 'medium',
    category: 'Rental',
  },
  {
    id: 'rec-4',
    equipment: 'CAT D6 Dozer',
    equipmentId: 'eq-2',
    recommendation: 'Reassign operator',
    reason:
      'Current operator efficiency at 71%. Operator Marcus Reed available with 94% efficiency on similar terrain.',
    savings: 1900,
    confidence: 84,
    priority: 'medium',
    category: 'Utilization',
  },
  {
    id: 'rec-5',
    equipment: 'CAT 14M Grader',
    equipmentId: 'eq-5',
    recommendation: 'Redeploy to Site Delta',
    reason:
      'Site Alpha grading complete 2 days early. Site Delta roadwork starts Thursday and has no grader assigned.',
    savings: 3100,
    confidence: 79,
    priority: 'low',
    category: 'Relocation',
  },
];

export const equipment: Equipment[] = [
  {
    id: 'eq-1',
    name: 'CAT 320 Excavator',
    model: '320 GC',
    category: 'Excavator',
    image:
      'https://images.unsplash.com/photo-1581094288338-2314dddb7a14?w=800&q=80',
    site: 'Site Alpha',
    operator: 'Marcus Reed',
    health: 94,
    engineHours: 1842,
    idleHours: 14,
    rentalRemainingDays: 22,
    status: 'idle',
    riskScore: 18,
  },
  {
    id: 'eq-2',
    name: 'CAT D6 Dozer',
    model: 'D6 XE',
    category: 'Dozer',
    image:
      'https://images.unsplash.com/photo-1504917595217-d4dc1ebe0120?w=800&q=80',
    site: 'Site Alpha',
    operator: 'Sarah Lin',
    health: 78,
    engineHours: 2210,
    idleHours: 2,
    rentalRemainingDays: 8,
    status: 'working',
    riskScore: 42,
  },
  {
    id: 'eq-3',
    name: 'CAT 980 Loader',
    model: '980 GC',
    category: 'Loader',
    image:
      'https://images.unsplash.com/photo-1565514020179-0a0f9b7d7e8b?w=800&q=80',
    site: 'Site Bravo',
    operator: 'Diego Alvarez',
    health: 81,
    engineHours: 1980,
    idleHours: 1,
    rentalRemainingDays: 31,
    status: 'working',
    riskScore: 38,
  },
  {
    id: 'eq-4',
    name: 'CAT 336 Excavator',
    model: '336F',
    category: 'Excavator',
    image:
      'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80',
    site: 'Site Charlie',
    operator: 'Yuki Tanaka',
    health: 63,
    engineHours: 3120,
    idleHours: 6,
    rentalRemainingDays: 4,
    status: 'critical',
    riskScore: 71,
  },
  {
    id: 'eq-5',
    name: 'CAT 14M Grader',
    model: '14M3',
    category: 'Grader',
    image:
      'https://images.unsplash.com/photo-1597844808175-1b4ee0c0a6e9?w=800&q=80',
    site: 'Site Alpha',
    operator: 'Amara Okafor',
    health: 88,
    engineHours: 1450,
    idleHours: 3,
    rentalRemainingDays: 18,
    status: 'working',
    riskScore: 24,
  },
  {
    id: 'eq-6',
    name: 'CAT CB13 Compactor',
    model: 'CB13',
    category: 'Compactor',
    image:
      'https://images.unsplash.com/photo-1517089596422-934f4513a30b?w=800&q=80',
    site: 'Site Bravo',
    operator: 'Liam OConnor',
    health: 90,
    engineHours: 980,
    idleHours: 0,
    rentalRemainingDays: 27,
    status: 'working',
    riskScore: 12,
  },
  {
    id: 'eq-7',
    name: 'CAT 631 Scraper',
    model: '631G',
    category: 'Truck',
    image:
      'https://images.unsplash.com/photo-1605152279758-8b3e6d8e6c7a?w=800&q=80',
    site: 'Site Charlie',
    operator: 'Noor Hassan',
    health: 72,
    engineHours: 2640,
    idleHours: 8,
    rentalRemainingDays: 12,
    status: 'idle',
    riskScore: 49,
  },
  {
    id: 'eq-8',
    name: 'CAT 966 Loader',
    model: '966 XE',
    category: 'Loader',
    image:
      'https://images.unsplash.com/photo-1581094794329-1c8f5c9b7d2a?w=800&q=80',
    site: 'Site Delta',
    operator: 'Elena Petrova',
    health: 55,
    engineHours: 3480,
    idleHours: 11,
    rentalRemainingDays: 6,
    status: 'maintenance',
    riskScore: 66,
  },
];

export const sites: Site[] = [
  {
    id: 'site-1',
    name: 'Site Alpha',
    location: 'Phoenix, AZ',
    machines: 8,
    operators: 6,
    utilization: 91,
    upcomingDemand: 'Excavator +1',
    weather: 'Sunny',
    weatherTemp: 98,
    riskLevel: 'Low',
    aiAction: 'Maintain current allocation. Next review in 48h.',
  },
  {
    id: 'site-2',
    name: 'Site Bravo',
    location: 'Dallas, TX',
    machines: 11,
    operators: 9,
    utilization: 78,
    upcomingDemand: 'Excavator +1 (Tomorrow)',
    weather: 'Partly Cloudy',
    weatherTemp: 88,
    riskLevel: 'Medium',
    aiAction: 'Relocate CAT 320 from Site Alpha to meet demand.',
  },
  {
    id: 'site-3',
    name: 'Site Charlie',
    location: 'Denver, CO',
    machines: 6,
    operators: 5,
    utilization: 64,
    upcomingDemand: 'Grader +1',
    weather: 'Rain',
    weatherTemp: 61,
    riskLevel: 'High',
    aiAction: 'Critical health on CAT 336. Schedule maintenance now.',
  },
  {
    id: 'site-4',
    name: 'Site Delta',
    location: 'Seattle, WA',
    machines: 4,
    operators: 3,
    utilization: 82,
    upcomingDemand: 'Grader +1 (Thu)',
    weather: 'Overcast',
    weatherTemp: 64,
    riskLevel: 'Medium',
    aiAction: 'Redeploy CAT 14M grader from Alpha before Thursday.',
  },
];

export const operators: Operator[] = [
  {
    id: 'op-1',
    name: 'Marcus Reed',
    avatar: 'MR',
    efficiency: 94,
    safetyScore: 98,
    assignedEquipment: 'CAT 320 Excavator',
    experienceYears: 12,
    lateReturns: 0,
    rank: 1,
  },
  {
    id: 'op-2',
    name: 'Diego Alvarez',
    avatar: 'DA',
    efficiency: 91,
    safetyScore: 95,
    assignedEquipment: 'CAT 980 Loader',
    experienceYears: 9,
    lateReturns: 1,
    rank: 2,
  },
  {
    id: 'op-3',
    name: 'Amara Okafor',
    avatar: 'AO',
    efficiency: 89,
    safetyScore: 97,
    assignedEquipment: 'CAT 14M Grader',
    experienceYears: 7,
    lateReturns: 0,
    rank: 3,
  },
  {
    id: 'op-4',
    name: 'Sarah Lin',
    avatar: 'SL',
    efficiency: 86,
    safetyScore: 92,
    assignedEquipment: 'CAT D6 Dozer',
    experienceYears: 6,
    lateReturns: 1,
    rank: 4,
  },
  {
    id: 'op-5',
    name: 'Yuki Tanaka',
    avatar: 'YT',
    efficiency: 79,
    safetyScore: 88,
    assignedEquipment: 'CAT 336 Excavator',
    experienceYears: 5,
    lateReturns: 2,
    rank: 5,
  },
  {
    id: 'op-6',
    name: 'Noor Hassan',
    avatar: 'NH',
    efficiency: 74,
    safetyScore: 85,
    assignedEquipment: 'CAT 631 Scraper',
    experienceYears: 4,
    lateReturns: 3,
    rank: 6,
  },
];

export const activityTimeline: ActivityEvent[] = [
  {
    id: 'act-1',
    type: 'ai',
    title: 'AI Recommendation Generated',
    detail: 'Relocate CAT 320 Excavator to Site Bravo (97% confidence)',
    time: '2 min ago',
  },
  {
    id: 'act-2',
    type: 'maintenance',
    title: 'Maintenance Completed',
    detail: 'CAT 966 Loader — hydraulic system serviced',
    time: '24 min ago',
  },
  {
    id: 'act-3',
    type: 'start',
    title: 'Machine Started',
    detail: 'CAT 980 Loader began shift at Site Bravo',
    time: '1 hr ago',
  },
  {
    id: 'act-4',
    type: 'assign',
    title: 'Operator Assigned',
    detail: 'Marcus Reed assigned to CAT 320 Excavator',
    time: '2 hr ago',
  },
  {
    id: 'act-5',
    type: 'extend',
    title: 'Rental Extended',
    detail: 'CAT CB13 Compactor extended 14 days at Site Bravo',
    time: '3 hr ago',
  },
  {
    id: 'act-6',
    type: 'alert',
    title: 'Safety Alert',
    detail: 'CAT 336 Excavator — engine temp elevated at Site Charlie',
    time: '4 hr ago',
  },
];

// Demand forecast — 7 days, by category
export const demandForecast = [
  { day: 'Mon', Excavators: 14, Dozers: 8, Loaders: 11, Graders: 5 },
  { day: 'Tue', Excavators: 16, Dozers: 9, Loaders: 12, Graders: 6 },
  { day: 'Wed', Excavators: 18, Dozers: 10, Loaders: 13, Graders: 7 },
  { day: 'Thu', Excavators: 21, Dozers: 11, Loaders: 14, Graders: 9 },
  { day: 'Fri', Excavators: 19, Dozers: 10, Loaders: 13, Graders: 8 },
  { day: 'Sat', Excavators: 12, Dozers: 6, Loaders: 9, Graders: 4 },
  { day: 'Sun', Excavators: 8, Dozers: 4, Loaders: 6, Graders: 3 },
];

export const revenueTrend = [
  { month: 'Jan', revenue: 1240, target: 1100 },
  { month: 'Feb', revenue: 1380, target: 1200 },
  { month: 'Mar', revenue: 1510, target: 1300 },
  { month: 'Apr', revenue: 1490, target: 1400 },
  { month: 'May', revenue: 1680, target: 1500 },
  { month: 'Jun', revenue: 1820, target: 1600 },
  { month: 'Jul', revenue: 1960, target: 1700 },
];

export const utilizationTrend = [
  { week: 'W1', utilization: 72, idle: 28 },
  { week: 'W2', utilization: 78, idle: 22 },
  { week: 'W3', utilization: 81, idle: 19 },
  { week: 'W4', utilization: 84, idle: 16 },
  { week: 'W5', utilization: 87, idle: 13 },
  { week: 'W6', utilization: 85, idle: 15 },
];

export const rentalTrends = [
  { month: 'Jan', new: 18, expiring: 6, renewed: 12 },
  { month: 'Feb', new: 22, expiring: 8, renewed: 15 },
  { month: 'Mar', new: 26, expiring: 10, renewed: 18 },
  { month: 'Apr', new: 24, expiring: 9, renewed: 16 },
  { month: 'May', new: 30, expiring: 11, renewed: 22 },
  { month: 'Jun', new: 34, expiring: 9, renewed: 26 },
];

export const downtimeData = [
  { week: 'W1', scheduled: 12, unplanned: 8 },
  { week: 'W2', scheduled: 14, unplanned: 5 },
  { week: 'W3', scheduled: 10, unplanned: 11 },
  { week: 'W4', scheduled: 16, unplanned: 3 },
  { week: 'W5', scheduled: 13, unplanned: 6 },
  { week: 'W6', scheduled: 18, unplanned: 2 },
];

export const idleAnalysis = [
  { category: 'Excavators', hours: 142, cost: 8400 },
  { category: 'Dozers', hours: 88, cost: 5200 },
  { category: 'Loaders', hours: 64, cost: 3800 },
  { category: 'Graders', hours: 52, cost: 3100 },
  { category: 'Trucks', hours: 96, cost: 5700 },
];

// Live ops map markers (percentage positions on placeholder map)
export const mapMarkers = [
  { id: 'm1', x: 28, y: 35, status: 'working' as Status, label: 'CAT 980 Loader', site: 'Site Bravo' },
  { id: 'm2', x: 52, y: 42, status: 'idle' as Status, label: 'CAT 320 Excavator', site: 'Site Alpha' },
  { id: 'm3', x: 41, y: 58, status: 'critical' as Status, label: 'CAT 336 Excavator', site: 'Site Charlie' },
  { id: 'm4', x: 68, y: 30, status: 'working' as Status, label: 'CAT D6 Dozer', site: 'Site Alpha' },
  { id: 'm5', x: 74, y: 52, status: 'maintenance' as Status, label: 'CAT 966 Loader', site: 'Site Delta' },
  { id: 'm6', x: 33, y: 70, status: 'working' as Status, label: 'CAT CB13 Compactor', site: 'Site Bravo' },
  { id: 'm7', x: 60, y: 68, status: 'idle' as Status, label: 'CAT 631 Scraper', site: 'Site Charlie' },
  { id: 'm8', x: 80, y: 40, status: 'working' as Status, label: 'CAT 14M Grader', site: 'Site Delta' },
];

export const copilotSuggestions = [
  'Which assets are wasting money?',
  'Recommend relocations.',
  "Summarize today's fleet.",
  'Which rentals expire tomorrow?',
];

export const copilotMockReply = (q: string): string => {
  const map: Record<string, string> = {
    'Which assets are wasting money?':
      'Three assets are bleeding revenue right now:\n\n1. CAT 336 Excavator — 6 idle hrs, critical health, $1,800/day at risk\n2. CAT 631 Scraper — 8 idle hrs, $960/day at risk\n3. CAT 966 Loader — 11 idle hrs + maintenance, $2,200/day at risk\n\nTotal daily exposure: ~$4,960. Approve the maintenance recommendation to recover $5,800.',
    'Recommend relocations.':
      'Top relocation opportunity:\n\n• Move CAT 320 Excavator from Site Alpha to Site Bravo\n  Reason: idle 14 hrs, Bravo needs excavator tomorrow\n  Savings: $2,400 | Confidence: 97%\n\nSecondary: Redeploy CAT 14M Grader from Alpha to Delta before Thursday roadwork. Savings $3,100, confidence 79%.',
    "Summarize today's fleet.":
      "Fleet snapshot — 126 active rentals, 87.4% utilization (+2.1 pts). 14 units idle, 3 safety alerts. Fleet health 92%. $48,200 revenue at risk, mostly concentrated at Site Charlie. 4 critical decisions pending your approval — total potential savings $12,400.",
    'Which rentals expire tomorrow?':
      'Rentals expiring within 24h:\n\n• CAT 336 Excavator — Site Charlie (4 days remain, but customer flagged early return)\n• CAT 966 Loader — Site Delta (6 days, in maintenance)\n• CAT D6 Dozer — Site Alpha (8 days)\n\nRecommend proactive renewal outreach on the 336 and 966.',
  };
  return map[q] ?? "I can analyze fleet utilization, recommend relocations, flag revenue at risk, and surface expiring rentals. Try one of the suggested prompts above.";
};
