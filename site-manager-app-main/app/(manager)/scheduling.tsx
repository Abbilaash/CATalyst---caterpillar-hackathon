import { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TextInput, Alert, ActivityIndicator, Switch } from 'react-native';
import { Calendar, Users, Boxes, Plus, AlertTriangle, CheckCircle2, Clock, Shield, Briefcase, ChevronRight, X, Trash2, Cpu, Sparkles } from 'lucide-react-native';
import { PALETTE, RADIUS, SPACING, SHADOW, FONT } from '@/theme/tokens';
import { Screen } from '@/components/Screen';
import { ManagerShell } from '@/components/ManagerShell';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { Avatar } from '@/components/Avatar';
import { API_BASE_URL } from '@/constant/api';
import { useSession } from '@/context/SessionContext';

// Helper to determine if an operator is certified for a specific machine asset type
const isOperatorCertified = (op: any, assetType: string): boolean => {
  const certs = (op.certified_equipment_types || []).map((c: string) => c.toLowerCase());
  const type = assetType.toLowerCase();
  
  if (type.includes('excavator')) return certs.includes('excavator');
  if (type.includes('dozer')) return certs.includes('dozer');
  if (type.includes('loader')) return certs.includes('loader');
  if (type.includes('grader')) return certs.includes('grader');
  if (type.includes('scraper')) return certs.includes('scraper');
  if (type.includes('truck')) return certs.includes('truck') || certs.includes('scraper');
  if (type.includes('compactor')) return certs.includes('compactor');
  
  return certs.some((c: string) => type.includes(c));
};

const EQUIPMENT_OPTIONS = ['Excavator', 'Dozer', 'Wheel Loader', 'Backhoe Loader', 'Motor Grader'];

export default function ManagerScheduling() {
  const { managerId } = useSession();
  const [activeSiteId, setActiveSiteId] = useState('site-01');
  const [sites, setSites] = useState<any[]>([]);
  const [allOperators, setAllOperators] = useState<any[]>([]);
  const [rentedAssets, setRentedAssets] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [queuedTasks, setQueuedTasks] = useState<any[]>([]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [autoModalVisible, setAutoModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  // Manual Form State
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedOperatorId, setSelectedOperatorId] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [totalHours, setTotalHours] = useState('8');

  // Batch Auto-Scheduling Form & draft State
  const [batchTasks, setBatchTasks] = useState<any[]>([]);
  const [proposedAssignments, setProposedAssignments] = useState<any[]>([]);
  const [unassignedTasks, setUnassignedTasks] = useState<any[]>([]);
  const [previewing, setPreviewing] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<'any' | 'fcfs'>('any');

  // Draft Task inputs
  const [draftEqType, setDraftEqType] = useState('Excavator');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDate, setDraftDate] = useState(new Date().toISOString().split('T')[0]);
  const [draftTime, setDraftTime] = useState('08:00');
  const [draftHours, setDraftHours] = useState('8');
  const [draftImportance, setDraftImportance] = useState<'high' | 'medium' | 'low'>('medium');
  const [draftPriority, setDraftPriority] = useState(false);

  // Generate dynamic 28-hour timeline intervals starting from today 8:00 AM (8 slots of 4h)
  const timelineIntervals = useMemo(() => {
    const intervals = [];
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0);
    for (let i = 0; i < 8; i++) {
      const d = new Date(start.getTime() + i * 4 * 60 * 60 * 1000);
      let hours = d.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const timeStr = `${hours}:00 ${ampm}`;
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      intervals.push({ label: `${timeStr}\n${dateStr}`, time: d });
    }
    return intervals;
  }, []);

  const timelineStart = timelineIntervals[0].time;
  const timelineEnd = timelineIntervals[timelineIntervals.length - 1].time;
  const timelineTotalMinutes = 28 * 60;

  // Fetch queued tasks
  const loadQueue = async () => {
    try {
      const resolvedManagerId = managerId || 'mgr-01';
      const res = await fetch(`${API_BASE_URL}/api/v1/manager/auto-assign/queue/${resolvedManagerId}`);
      if (res.ok) {
        const data = await res.json();
        setQueuedTasks(data || []);
      }
    } catch (e) {
      console.warn("Failed to load queue backlog", e);
    }
  };

  // Fetch scheduling data from backend
  const loadData = async () => {
    try {
      setLoading(true);
      const resolvedManagerId = managerId || 'mgr-01';
      const res = await fetch(`${API_BASE_URL}/api/v1/manager/scheduling-data/${resolvedManagerId}`);
      if (res.ok) {
        const data = await res.json();
        
        // Map Sites
        if (data.sites && data.sites.length > 0) {
          const mappedSites = data.sites.map((s: any) => ({
            id: s.site_id,
            name: s.site_name,
            location: s.location || 'Unknown Location'
          }));
          setSites(mappedSites);
          if (!mappedSites.some((s: any) => s.id === activeSiteId)) {
            setActiveSiteId(mappedSites[0].id);
          }
        }

        // Map Operators
        if (data.all_operators) {
          const mappedOps = data.all_operators.map((o: any) => ({
            id: o.operator_id,
            name: o.name,
            email: o.email,
            licenseNumber: o.license_number,
            experienceYears: o.experience_years,
            assignedSiteId: o.assigned_site_id,
            status: o.status,
            certified_equipment_types: o.certified_equipment_types || [],
            safetyScore: 95,
            availability: o.status === 'available' ? 'available' : 'busy'
          }));
          setAllOperators(mappedOps);
        }

        // Map Assets (Global view - all manager's rented assets)
        if (data.rented_assets) {
          const mappedAssets = data.rented_assets.map((a: any) => ({
            id: a.asset_id,
            name: a.asset_name,
            machineId: a.asset_id,
            assetType: a.equipment_type || 'Machinery',
            imageSeed: (a.equipment_type || '').toLowerCase().includes('excavator') ? 'excavator' : 'loader',
            status: a.current_status,
            siteId: a.current_site_id,
            totalEngineHours: a.total_engine_hours
          }));
          setRentedAssets(mappedAssets);
        }

        // Map Assignments
        if (data.existing_assignments) {
          const mappedAssigns = data.existing_assignments.map((asg: any) => ({
            id: asg.assignment_id,
            assetId: asg.asset_id,
            assetName: asg.asset_name,
            assetType: asg.asset_type,
            operatorId: asg.operator_id,
            operatorName: asg.operator_name,
            jobTitle: asg.job_title,
            startTime: asg.start_time,
            endTime: asg.end_time,
            status: asg.status,
            siteId: asg.site_id
          }));
          setAssignments(mappedAssigns);
        }
      }
      await loadQueue();
    } catch (err) {
      console.warn('Backend connection failed, scheduling dashboard offline.', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [managerId]);

  // Global assets view (Shows all manager's rented assets across all pages)
  const siteAssets = rentedAssets;

  const siteOperators = useMemo(() => {
    return allOperators.filter(op => {
      return op.assignedSiteId === activeSiteId || op.status === 'available' || op.availability === 'available';
    });
  }, [allOperators, activeSiteId]);

  // Filters out assets that are already scheduled/busy during the selected time window
  const availableAssetsForForm = useMemo(() => {
    if (!startDate || !startTime || !totalHours) return siteAssets;
    try {
      const startMs = new Date(`${startDate}T${startTime}:00`).getTime();
      const durationMs = parseFloat(totalHours) * 60 * 60 * 1000;
      const endMs = startMs + durationMs;
      
      return siteAssets.filter(asset => {
        const overlaps = assignments.some(asg => {
          if (asg.assetId !== asset.id) return false;
          if (asg.status === 'completed' || asg.status === 'cancelled') return false;
          const asgStart = new Date(asg.startTime).getTime();
          const asgEnd = new Date(asg.endTime).getTime();
          return startMs < asgEnd && endMs > asgStart;
        });
        return !overlaps;
      });
    } catch (e) {
      return siteAssets;
    }
  }, [siteAssets, startDate, startTime, totalHours, assignments]);

  const selectedAsset = useMemo(() => {
    return rentedAssets.find(a => a.id === selectedAssetId);
  }, [rentedAssets, selectedAssetId]);

  const selectedOperator = useMemo(() => {
    return allOperators.find(o => o.id === selectedOperatorId);
  }, [allOperators, selectedOperatorId]);

  const certificationStatus = useMemo(() => {
    if (!selectedAsset || !selectedOperator) return null;
    const certified = isOperatorCertified(selectedOperator, selectedAsset.assetType);
    return {
      certified,
      message: certified 
        ? `Certified to operate ${selectedAsset.assetType}` 
        : `NOT certified to operate ${selectedAsset.assetType}. Requires: ${selectedAsset.assetType}.`
    };
  }, [selectedAsset, selectedOperator]);

  const handleCreateAssignment = async () => {
    if (!selectedAssetId || !selectedOperatorId || !jobTitle || !startDate || !startTime || !totalHours) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    const hours = parseFloat(totalHours);
    if (isNaN(hours) || hours <= 0) {
      Alert.alert('Error', 'Please enter a valid duration in hours.');
      return;
    }

    if (certificationStatus && !certificationStatus.certified) {
      Alert.alert('Invalid Operator', `Operator ${selectedOperator?.name} does not hold a certification for ${selectedAsset?.assetType}.`);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/manager/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: selectedAssetId,
          operator_id: selectedOperatorId,
          job_title: jobTitle,
          start_date: startDate,
          start_time: startTime,
          total_hours: hours
        })
      });

      if (response.ok) {
        Alert.alert('Success', 'Operator scheduled and assigned successfully.');
        setModalVisible(false);
        loadData();
      } else {
        const errJson = await response.json();
        Alert.alert('Scheduling Conflict', errJson.detail || 'Failed to create assignment.');
      }
    } catch (err) {
      console.log('Error saving assignment:', err);
      Alert.alert('Connection Error', 'Could not save assignment to server.');
    } finally {
      setSelectedAssetId('');
      setSelectedOperatorId('');
      setJobTitle('');
    }
  };

  // Add draft task to batch list
  const addDraftTask = () => {
    if (!draftTitle.trim() || !draftDate || !draftTime || !draftHours) {
      Alert.alert('Error', 'Please enter task description, date, and hours.');
      return;
    }
    const hours = parseFloat(draftHours);
    if (isNaN(hours) || hours <= 0) {
      Alert.alert('Error', 'Duration must be a positive number.');
      return;
    }
    const newTask = {
      id: Math.random().toString(),
      equipment_type: draftEqType,
      job_title: draftTitle.trim(),
      start_date: draftDate,
      start_time: draftTime,
      total_hours: hours,
      importance: draftImportance,
      priority: draftPriority
    };
    setBatchTasks(prev => [...prev, newTask]);
    setDraftTitle('');
    setDraftPriority(false);
  };

  const removeDraftTask = (id: string) => {
    setBatchTasks(prev => prev.filter(t => t.id !== id));
  };

  // Run Optimization / FCFS Solver in backend
  const runAutoScheduling = async (strategy: 'any' | 'fcfs') => {
    if (batchTasks.length === 0) {
      Alert.alert('Error', 'Add at least one task to run auto-assignment.');
      return;
    }
    try {
      const resolvedManagerId = managerId || 'mgr-01';
      const response = await fetch(`${API_BASE_URL}/api/v1/manager/auto-assign/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manager_id: resolvedManagerId,
          tasks: batchTasks,
          strategy: strategy
        })
      });
      if (response.ok) {
        const data = await response.json();
        setProposedAssignments(data.assignments || []);
        setUnassignedTasks(data.unassigned_tasks || []);
        setPreviewing(true);
      } else {
        const err = await response.json();
        Alert.alert('Optimization Error', err.detail || 'Solver failed to run.');
      }
    } catch (err) {
      console.warn('Solver request failed:', err);
      Alert.alert('Connection Error', 'Failed to connect to the scheduling solver.');
    }
  };

  // Commit proposed assignments to database
  const commitAutoScheduling = async () => {
    try {
      const resolvedManagerId = managerId || 'mgr-01';
      const response = await fetch(`${API_BASE_URL}/api/v1/manager/auto-assign/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manager_id: resolvedManagerId,
          assignments: proposedAssignments
        })
      });
      if (response.ok) {
        Alert.alert('Success', `Successfully scheduled ${proposedAssignments.length} optimal tasks!`);
        setAutoModalVisible(false);
        setBatchTasks([]);
        setProposedAssignments([]);
        setUnassignedTasks([]);
        setPreviewing(false);
        loadData();
      } else {
        Alert.alert('Error', 'Failed to commit assignments to database.');
      }
    } catch (err) {
      Alert.alert('Connection Error', 'Could not save auto-allotments to server.');
    }
  };

  // Queue a single unassigned task from conflicts
  const handleQueueTask = async (task: any) => {
    try {
      const resolvedManagerId = managerId || 'mgr-01';
      const response = await fetch(`${API_BASE_URL}/api/v1/manager/auto-assign/queue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manager_id: resolvedManagerId,
          tasks: [{
            equipment_type: task.equipment_type,
            job_title: task.job_title,
            job_description: task.job_description || '',
            start_date: task.start_date,
            start_time: task.start_time,
            total_hours: task.total_hours,
            importance: task.importance || 'medium',
            priority: task.priority || false
          }]
        })
      });
      if (response.ok) {
        Alert.alert('Queued', `Task "${task.job_title}" added to the backlog queue.`);
        setUnassignedTasks(prev => prev.filter(t => t.job_title !== task.job_title));
        loadQueue();
      } else {
        Alert.alert('Error', 'Failed to add task to database queue.');
      }
    } catch (err) {
      Alert.alert('Error', 'Could not connect to database queue.');
    }
  };

  // Queue all unassigned tasks at once
  const handleQueueAllConflicts = async () => {
    try {
      const resolvedManagerId = managerId || 'mgr-01';
      const tasksToQueue = unassignedTasks.map(u => {
        const dt = new Date(u.start_time);
        const start_date = dt.toISOString().split('T')[0];
        const start_time = dt.toTimeString().split(' ')[0].substring(0, 5);
        const total_hours = (new Date(u.end_time).getTime() - dt.getTime()) / 3600000;
        return {
          equipment_type: u.equipment_type,
          job_title: u.job_title,
          job_description: '',
          start_date,
          start_time,
          total_hours,
          importance: 'medium',
          priority: false
        };
      });

      const response = await fetch(`${API_BASE_URL}/api/v1/manager/auto-assign/queue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manager_id: resolvedManagerId,
          tasks: tasksToQueue
        })
      });
      if (response.ok) {
        Alert.alert('Success', `Queued ${tasksToQueue.length} conflict tasks to backlog.`);
        setUnassignedTasks([]);
        loadQueue();
      } else {
        Alert.alert('Error', 'Failed to batch queue conflict tasks.');
      }
    } catch (err) {
      Alert.alert('Error', 'Could not connect to database queue.');
    }
  };

  // Cancel/delete an item from the queue backlog
  const handleDeleteQueuedTask = async (queueId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/manager/auto-assign/queue/${queueId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        Alert.alert('Success', 'Queued task cancelled successfully.');
        loadQueue();
      } else {
        Alert.alert('Error', 'Failed to cancel queued task.');
      }
    } catch (err) {
      Alert.alert('Error', 'Could not connect to queue API.');
    }
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PALETTE.catYellow} />
          <Text style={styles.loadingText}>Loading scheduling dashboard...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ManagerShell active="scheduling">
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} stickyHeaderIndices={[0]}>
          <View style={styles.stickyHeader}>
            <AppHeader title="Scheduling" subtitle="Maximize asset utilization & safety" onBell={() => {}} />
            
            {/* Site Switcher */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.siteTabRow}>
              {sites.map(s => (
                <Pressable
                  key={s.id}
                  onPress={() => setActiveSiteId(s.id)}
                  style={[styles.siteTab, activeSiteId === s.id && styles.siteTabActive]}
                >
                  <Text style={[styles.siteTabText, activeSiteId === s.id && styles.siteTabTextActive]}>{s.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Visualization 1: Gantt Chart/Timeline */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Asset Allocation Timeline</Text>
                <Text style={styles.cardSubtitle}>Shift assignments & time intersections (28h view)</Text>
              </View>
              <View style={styles.headerBtnRow}>
                <Pressable style={styles.autoButton} onPress={() => setAutoModalVisible(true)}>
                  <Sparkles size={13} color={PALETTE.catYellow} strokeWidth={2.5} />
                  <Text style={styles.autoButtonText}>Auto-Schedule</Text>
                </Pressable>
                <Pressable style={styles.addButton} onPress={() => setModalVisible(true)}>
                  <Plus size={14} color={PALETTE.bg} strokeWidth={2.5} />
                  <Text style={styles.addButtonText}>Assign</Text>
                </Pressable>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.ganttContainer}>
                {/* Timeline Header Row */}
                <View style={styles.ganttHeaderRow}>
                  <View style={styles.ganttAssetCol}><Text style={styles.headerText}>Asset</Text></View>
                  {timelineIntervals.map((interval, idx) => (
                    <View key={idx} style={styles.ganttTimeCol}>
                      <Text style={[styles.headerText, { textAlign: 'center', fontSize: 10, lineHeight: 14 }]}>
                        {interval.label}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Rows for each asset */}
                {siteAssets.map(asset => {
                  const assetAssignments = assignments.filter(a => a.assetId === asset.id);
                  const timelineAssigns = assetAssignments.filter(asg => {
                    const sTime = new Date(asg.startTime).getTime();
                    const eTime = new Date(asg.endTime).getTime();
                    return eTime > timelineStart.getTime() && sTime < timelineEnd.getTime();
                  });

                  const sortedAssigns = [...timelineAssigns].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
                  
                  const lanes: any[][] = [];
                  sortedAssigns.forEach(item => {
                    let placed = false;
                    const itemStart = new Date(item.startTime).getTime();
                    const itemEnd = new Date(item.endTime).getTime();

                    for (let i = 0; i < lanes.length; i++) {
                      const lane = lanes[i];
                      const hasOverlap = lane.some(placedItem => {
                        const pStart = new Date(placedItem.startTime).getTime();
                        const pEnd = new Date(placedItem.endTime).getTime();
                        return itemStart < pEnd && itemEnd > pStart;
                      });

                      if (!hasOverlap) {
                        lane.push(item);
                        placed = true;
                        break;
                      }
                    }
                    if (!placed) {
                      lanes.push([item]);
                    }
                  });

                  const trackHeight = lanes.length > 0 ? lanes.length * 48 + 8 : 42;

                  return (
                    <View key={asset.id} style={[styles.ganttRow, { alignItems: 'flex-start' }]}>
                      <View style={[styles.ganttAssetCol, { minHeight: trackHeight, justifyContent: 'center' }]}>
                        <Text style={styles.assetNameText}>{asset.name}</Text>
                        <Text style={styles.assetTypeText}>{asset.assetType}</Text>
                      </View>

                      <View style={[styles.timelineTrack, { height: trackHeight }]}>
                        {lanes.length === 0 ? (
                          <View style={styles.idleBlock}>
                            <Text style={styles.idleText}>Available</Text>
                          </View>
                        ) : (
                          lanes.map((lane, laneIdx) => 
                            lane.map(assign => {
                              const asgStart = new Date(assign.startTime).getTime();
                              const asgEnd = new Date(assign.endTime).getTime();

                              const displayStart = Math.max(timelineStart.getTime(), asgStart);
                              const displayEnd = Math.min(timelineEnd.getTime(), asgEnd);

                              const leftMinutes = (displayStart - timelineStart.getTime()) / 60000;
                              const widthMinutes = (displayEnd - displayStart) / 60000;

                              const leftPercent = (leftMinutes / timelineTotalMinutes) * 100;
                              const widthPercent = Math.max(5, (widthMinutes / timelineTotalMinutes) * 100);

                              return (
                                <View 
                                  key={assign.id} 
                                  style={[
                                    styles.assignmentBlock, 
                                    { 
                                      left: `${leftPercent}%`, 
                                      width: `${widthPercent - 1}%`, 
                                      top: laneIdx * 48 + 4,
                                      height: 42
                                    }
                                  ]}
                                >
                                  <Text style={styles.assignmentBlockTitle} numberOfLines={1}>{assign.jobTitle}</Text>
                                  <Text style={styles.assignmentBlockOp} numberOfLines={1}>{assign.operatorName}</Text>
                                </View>
                              );
                            })
                          )
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </Card>

          {/* Queue Manager Panel */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Queued Tasks Backlog ({queuedTasks.length})</Text>
            <Text style={styles.cardSubtitle}>Tasks awaiting operator or machine release to auto-schedule</Text>
            
            <View style={styles.queueList}>
              {queuedTasks.map(q => (
                <View key={q.queue_id} style={styles.queueItem}>
                  <View style={styles.queueIconCol}>
                    <Clock size={16} color={PALETTE.warning} />
                    {q.priority && <View style={styles.priorityDot} />}
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.queueTitleText}>{q.job_title}</Text>
                    <Text style={styles.queueDetailsText}>
                      {q.equipment_type} · {q.total_hours}h · Importance: <Text style={{ textTransform: 'capitalize', fontFamily: FONT.semibold }}>{q.importance}</Text>
                    </Text>
                    <Text style={styles.queueTimeText}>
                      Target: {new Date(q.start_time).toLocaleDateString()} @ {new Date(q.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <Pressable onPress={() => handleDeleteQueuedTask(q.queue_id)} style={styles.cancelQueueIconBtn}>
                    <X size={16} color={PALETTE.danger} />
                  </Pressable>
                </View>
              ))}
              {queuedTasks.length === 0 && (
                <Text style={styles.emptyDraftText}>No tasks currently waiting in queue.</Text>
              )}
            </View>
          </Card>

          {/* Operator Lists */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Operators & Certifications</Text>
            <Text style={styles.cardSubtitle}>Qualified equipment types for active operators</Text>

            <View style={styles.operatorList}>
              {siteOperators.map(op => (
                <View key={op.id} style={styles.opItem}>
                  <Avatar name={op.name} size={40} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.opNameText}>{op.name}</Text>
                    <View style={styles.certRow}>
                      {(op.certified_equipment_types || []).map((cert: string) => (
                        <Chip key={cert} label={cert} color={PALETTE.info} soft={`${PALETTE.info}22`} />
                      ))}
                      {(op.certified_equipment_types || []).length === 0 && (
                        <Text style={styles.noCertText}>No certifications registered</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.badgeCol}>
                    <View style={styles.badgeRow}>
                      <Shield size={12} color={PALETTE.warning} />
                      <Text style={styles.badgeText}>{op.safetyScore || 95}</Text>
                    </View>
                    <View style={styles.badgeRow}>
                      <Briefcase size={12} color={PALETTE.success} />
                      <Text style={styles.badgeText}>{op.experienceYears}y</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        </ScrollView>

        {/* Modal: Schedule & Assign Task */}
        <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Schedule Asset Assignment</Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <X size={20} color={PALETTE.textSecondary} />
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={styles.form}>
                {/* Select Equipment (Only showing available ones in chosen slot) */}
                <Text style={styles.inputLabel}>Select Equipment *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.assetPicker}>
                  {availableAssetsForForm.map(asset => (
                    <Pressable
                      key={asset.id}
                      onPress={() => setSelectedAssetId(asset.id)}
                      style={[styles.pickerItem, selectedAssetId === asset.id && styles.pickerItemActive]}
                    >
                      <Boxes size={16} color={selectedAssetId === asset.id ? PALETTE.catYellow : PALETTE.textSecondary} />
                      <Text style={[styles.pickerText, selectedAssetId === asset.id && styles.pickerTextActive]}>{asset.name}</Text>
                    </Pressable>
                  ))}
                  {availableAssetsForForm.length === 0 && (
                    <Text style={styles.errorTextSmall}>No machinery is available during this time slot.</Text>
                  )}
                </ScrollView>

                {/* Select Operator */}
                <Text style={styles.inputLabel}>Select Operator *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.assetPicker}>
                  {siteOperators.map(op => (
                    <Pressable
                      key={op.id}
                      onPress={() => setSelectedOperatorId(op.id)}
                      style={[styles.pickerItem, selectedOperatorId === op.id && styles.pickerItemActive]}
                    >
                      <Users size={16} color={selectedOperatorId === op.id ? PALETTE.catYellow : PALETTE.textSecondary} />
                      <Text style={[styles.pickerText, selectedOperatorId === op.id && styles.pickerTextActive]}>{op.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>

                {certificationStatus && (
                  <View style={[styles.validationBanner, certificationStatus.certified ? styles.validBanner : styles.invalidBanner]}>
                    {certificationStatus.certified ? (
                      <CheckCircle2 size={16} color={PALETTE.success} />
                    ) : (
                      <AlertTriangle size={16} color={PALETTE.danger} />
                    )}
                    <Text style={[styles.validationText, certificationStatus.certified ? styles.validText : styles.invalidText]}>
                      {certificationStatus.message}
                    </Text>
                  </View>
                )}

                <Text style={styles.inputLabel}>Task Description *</Text>
                <TextInput
                  style={styles.textInput}
                  value={jobTitle}
                  onChangeText={setJobTitle}
                  placeholder="e.g. Trench Excavation Sector A"
                  placeholderTextColor={PALETTE.textTertiary}
                />

                <Text style={styles.inputLabel}>Task Date & Shift Hours *</Text>
                <View style={styles.timeRow}>
                  <View style={{ flex: 1.5 }}>
                    <Text style={styles.subInputLabel}>Start Date</Text>
                    <TextInput
                      style={styles.textInput}
                      value={startDate}
                      onChangeText={setStartDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={PALETTE.textTertiary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subInputLabel}>Start Time</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={startTime}
                      onChangeText={setStartTime}
                      placeholder="20:00"
                      placeholderTextColor={PALETTE.textTertiary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subInputLabel}>Hours</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={totalHours}
                      onChangeText={setTotalHours}
                      placeholder="10"
                      keyboardType="numeric"
                      placeholderTextColor={PALETTE.textTertiary}
                    />
                  </View>
                </View>

                <Pressable
                  style={[
                    styles.submitButton, 
                    (!certificationStatus || !certificationStatus.certified) && styles.submitButtonDisabled
                  ]}
                  onPress={handleCreateAssignment}
                >
                  <Text style={styles.submitButtonText}>Assign Operator</Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal: Batch Auto-Scheduler */}
        <Modal animationType="slide" transparent={true} visible={autoModalVisible} onRequestClose={() => setAutoModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <Sparkles size={18} color={PALETTE.catYellow} />
                  <Text style={styles.modalTitle}>Batch Auto-Scheduler</Text>
                </View>
                <Pressable onPress={() => { setAutoModalVisible(false); setPreviewing(false); setBatchTasks([]); }}>
                  <X size={20} color={PALETTE.textSecondary} />
                </Pressable>
              </View>

              {!previewing ? (
                <ScrollView contentContainerStyle={styles.form}>
                  <Text style={styles.sectionLabel}>Add Tasks to Backlog</Text>
                  
                  <View style={styles.autoTaskForm}>
                    <Text style={styles.subInputLabel}>Required Machinery Type</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                      {EQUIPMENT_OPTIONS.map(opt => (
                        <Pressable 
                          key={opt} 
                          onPress={() => setDraftEqType(opt)} 
                          style={[styles.pickerItem, draftEqType === opt && styles.pickerItemActive]}
                        >
                          <Text style={[styles.pickerText, draftEqType === opt && styles.pickerTextActive]}>{opt}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>

                    <Text style={[styles.subInputLabel, { marginTop: 10 }]}>Task Title / Job Description</Text>
                    <TextInput
                      style={styles.textInput}
                      value={draftTitle}
                      onChangeText={setDraftTitle}
                      placeholder="e.g. Stockpile load sector C"
                      placeholderTextColor={PALETTE.textTertiary}
                    />

                    <View style={[styles.timeRow, { marginTop: 10 }]}>
                      <View style={{ flex: 1.5 }}>
                        <Text style={styles.subInputLabel}>Start Date</Text>
                        <TextInput
                          style={styles.textInput}
                          value={draftDate}
                          onChangeText={setDraftDate}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.subInputLabel}>Start Time</Text>
                        <TextInput
                          style={styles.timeInput}
                          value={draftTime}
                          onChangeText={setDraftTime}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.subInputLabel}>Hours</Text>
                        <TextInput
                          style={styles.timeInput}
                          value={draftHours}
                          onChangeText={setDraftHours}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>

                    <View style={styles.toggleRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.subInputLabel}>Importance Level</Text>
                        <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                          {['low', 'medium', 'high'].map(i => (
                            <Pressable 
                              key={i} 
                              onPress={() => setDraftImportance(i as any)}
                              style={[styles.smallPill, draftImportance === i && { backgroundColor: PALETTE.catYellowSoft, borderColor: PALETTE.catYellow }]}
                            >
                              <Text style={[styles.smallPillText, draftImportance === i && { color: PALETTE.textPrimary, fontFamily: FONT.bold }]}>{i}</Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.subInputLabel}>Priority Rank</Text>
                        <Switch
                          value={draftPriority}
                          onValueChange={setDraftPriority}
                          trackColor={{ false: PALETTE.border, true: PALETTE.catYellow }}
                          thumbColor={PALETTE.surface}
                        />
                      </View>
                    </View>

                    <Pressable style={styles.addBatchBtn} onPress={addDraftTask}>
                      <Plus size={16} color={PALETTE.textInverse} />
                      <Text style={styles.addBatchBtnText}>Add to Draft List</Text>
                    </Pressable>
                  </View>

                  <Text style={[styles.sectionLabel, { marginTop: 15 }]}>Draft Tasks ({batchTasks.length})</Text>
                  <View style={styles.draftList}>
                    {batchTasks.map(t => (
                      <View key={t.id} style={styles.draftItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.draftTitle}>{t.job_title}</Text>
                          <Text style={styles.draftSubtitle}>{t.equipment_type} · {t.start_date} @ {t.start_time} · {t.total_hours}h</Text>
                          <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                            <Chip label={t.importance} color={PALETTE.info} soft={`${PALETTE.info}15`} />
                            {t.priority && <Chip label="Priority" color={PALETTE.error} soft={`${PALETTE.error}15`} />}
                          </View>
                        </View>
                        <Pressable onPress={() => removeDraftTask(t.id)} style={styles.deleteDraftBtn}>
                          <Trash2 size={16} color={PALETTE.error} />
                        </Pressable>
                      </View>
                    ))}
                    {batchTasks.length === 0 && (
                      <Text style={styles.emptyDraftText}>No draft tasks added yet.</Text>
                    )}
                  </View>

                  <View style={styles.strategyRow}>
                    <Text style={styles.subInputLabel}>Allotment Strategy</Text>
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                      <Pressable 
                        onPress={() => setSelectedStrategy('any')}
                        style={[styles.strategyPill, selectedStrategy === 'any' && styles.strategyPillActive]}
                      >
                        <Text style={[styles.strategyText, selectedStrategy === 'any' && styles.strategyTextActive]}>Optimize Order & Runtime</Text>
                      </Pressable>
                      <Pressable 
                        onPress={() => setSelectedStrategy('fcfs')}
                        style={[styles.strategyPill, selectedStrategy === 'fcfs' && styles.strategyPillActive]}
                      >
                        <Text style={[styles.strategyText, selectedStrategy === 'fcfs' && styles.strategyTextActive]}>First-Come-First-Serve</Text>
                      </Pressable>
                    </View>
                  </View>

                  <Pressable style={styles.solveBtn} onPress={() => runAutoScheduling(selectedStrategy)}>
                    <Sparkles size={16} color={PALETTE.bg} />
                    <Text style={styles.solveBtnText}>Find Optimal Allotments</Text>
                  </Pressable>
                </ScrollView>
              ) : (
                <ScrollView contentContainerStyle={styles.form}>
                  <Text style={styles.sectionLabel}>Optimal Assignment Plan Preview</Text>
                  <Text style={styles.cardSubtitle}>Review matched drivers, equipment, and runtimes below.</Text>

                  <View style={styles.proposedPlan}>
                    {proposedAssignments.map((p, idx) => (
                      <View key={idx} style={styles.proposedItem}>
                        <CheckCircle2 size={16} color={PALETTE.success} />
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={styles.proposedTitle}>{p.job_title}</Text>
                          <Text style={styles.proposedSubtitle}>
                            {p.asset_name} $\rightarrow$ <Text style={{ fontFamily: FONT.bold }}>{p.operator_name}</Text>
                          </Text>
                          <Text style={styles.proposedTime}>
                            {new Date(p.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(p.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                          </Text>
                        </View>
                      </View>
                    ))}
                    {proposedAssignments.length === 0 && (
                      <Text style={styles.emptyDraftText}>No assignments could be planned.</Text>
                    )}
                  </View>

                  {unassignedTasks.length > 0 && (
                    <>
                      <Text style={[styles.sectionLabel, { color: PALETTE.error }]}>Resource Conflicts ({unassignedTasks.length})</Text>
                      <Text style={styles.conflictInfoSub}> short on resources. Queue unassigned tasks to auto-schedule them later, or cancel.</Text>
                      <View style={styles.proposedPlan}>
                        {unassignedTasks.map((u, idx) => (
                          <View key={idx} style={[styles.proposedItem, { borderColor: PALETTE.error + '44', flexDirection: 'column', alignItems: 'stretch', gap: 8 }]}>
                            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                              <AlertTriangle size={16} color={PALETTE.error} />
                              <View style={{ flex: 1 }}>
                                <Text style={styles.proposedTitle}>{u.job_title} ({u.equipment_type})</Text>
                                <Text style={styles.conflictReason}>{u.reason}</Text>
                              </View>
                            </View>
                            <View style={styles.actionBtnRowSmall}>
                              <Pressable style={styles.queueItemBtn} onPress={() => handleQueueTask({
                                equipment_type: u.equipment_type,
                                job_title: u.job_title,
                                job_description: '',
                                start_date: new Date(u.start_time).toISOString().split('T')[0],
                                start_time: new Date(u.start_time).toTimeString().split(' ')[0].substring(0, 5),
                                total_hours: (new Date(u.end_time).getTime() - new Date(u.start_time).getTime()) / 3600000,
                                importance: 'medium',
                                priority: false
                              })}>
                                <Text style={styles.queueItemBtnText}>Queue Task</Text>
                              </Pressable>
                              <Pressable style={styles.cancelItemBtn} onPress={() => {
                                setUnassignedTasks(prev => prev.filter(t => t.job_title !== u.job_title));
                              }}>
                                <Text style={styles.cancelItemBtnText}>Cancel</Text>
                              </Pressable>
                            </View>
                          </View>
                        ))}
                      </View>
                      
                      <Pressable style={styles.queueAllBtn} onPress={handleQueueAllConflicts}>
                        <Text style={styles.queueAllBtnText}>Queue All Conflicts</Text>
                      </Pressable>
                    </>
                  )}

                  <View style={styles.btnRow}>
                    <Pressable style={styles.backDraftBtn} onPress={() => setPreviewing(false)}>
                      <Text style={styles.backDraftBtnText}>Back to Drafts</Text>
                    </Pressable>
                    <Pressable style={styles.confirmCommitBtn} onPress={commitAutoScheduling}>
                      <Text style={styles.confirmCommitBtnText}>Confirm & Commit</Text>
                    </Pressable>
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </ManagerShell>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: PALETTE.bg },
  loadingText: { marginTop: SPACING.md, fontFamily: FONT.medium, fontSize: 14, color: PALETTE.textSecondary },
  content: { paddingBottom: SPACING.xxl },
  stickyHeader: { backgroundColor: PALETTE.bg, paddingBottom: SPACING.sm, paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, gap: SPACING.md },
  siteTabRow: { gap: SPACING.sm, paddingBottom: SPACING.xs },
  siteTab: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg, borderRadius: RADIUS.pill, backgroundColor: PALETTE.surface, borderWidth: 1, borderColor: PALETTE.border },
  siteTabActive: { backgroundColor: PALETTE.catYellowSoft, borderColor: PALETTE.catYellowBorder },
  siteTabText: { fontFamily: FONT.medium, fontSize: 12, color: PALETTE.textSecondary },
  siteTabTextActive: { color: PALETTE.catYellow },
  card: { marginHorizontal: SPACING.lg, marginTop: SPACING.md, padding: SPACING.lg, gap: SPACING.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  cardTitle: { fontFamily: FONT.bold, fontSize: 17, color: PALETTE.textPrimary },
  cardSubtitle: { fontFamily: FONT.regular, fontSize: 12, color: PALETTE.textSecondary },
  headerBtnRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: PALETTE.catYellow, paddingVertical: 10, paddingHorizontal: 12, borderRadius: RADIUS.md },
  addButtonText: { fontFamily: FONT.bold, fontSize: 11, color: PALETTE.bg },
  autoButton: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: PALETTE.surface, paddingVertical: 10, paddingHorizontal: 12, borderRadius: RADIUS.md, borderWidth: 1, borderColor: PALETTE.catYellowBorder },
  autoButtonText: { fontFamily: FONT.bold, fontSize: 11, color: PALETTE.catYellow },
  ganttContainer: { paddingVertical: SPACING.sm },
  ganttHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: PALETTE.border, paddingBottom: SPACING.sm },
  ganttAssetCol: { width: 140, justifyContent: 'center' },
  ganttTimeCol: { width: 80, alignItems: 'center', justifyContent: 'center' },
  headerText: { fontFamily: FONT.bold, fontSize: 11, color: PALETTE.textTertiary },
  ganttRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: PALETTE.border, paddingVertical: SPACING.md },
  assetNameText: { fontFamily: FONT.bold, fontSize: 13, color: PALETTE.textPrimary },
  assetTypeText: { fontFamily: FONT.regular, fontSize: 10, color: PALETTE.textSecondary },
  timelineTrack: { flex: 1, flexDirection: 'row', width: 560, position: 'relative', height: 42, backgroundColor: PALETTE.surfaceOverlay, borderRadius: RADIUS.sm, overflow: 'hidden' },
  idleBlock: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  idleText: { fontFamily: FONT.medium, fontSize: 11, color: PALETTE.success },
  assignmentBlock: { position: 'absolute', borderRadius: RADIUS.sm, backgroundColor: PALETTE.catYellowSoft, borderLeftWidth: 3, borderLeftColor: PALETTE.catYellow, paddingHorizontal: SPACING.sm, justifyContent: 'center' },
  assignmentBlockTitle: { fontFamily: FONT.bold, fontSize: 10, color: PALETTE.textPrimary },
  assignmentBlockOp: { fontFamily: FONT.regular, fontSize: 8, color: PALETTE.textSecondary },
  operatorList: { gap: SPACING.md, marginTop: SPACING.sm },
  opItem: { flexDirection: 'row', gap: SPACING.md, alignItems: 'center', backgroundColor: PALETTE.surfaceOverlay, padding: SPACING.md, borderRadius: RADIUS.md },
  opNameText: { fontFamily: FONT.bold, fontSize: 14, color: PALETTE.textPrimary },
  certRow: { flexDirection: 'row', gap: SPACING.xs, flexWrap: 'wrap', marginTop: 2 },
  noCertText: { fontFamily: FONT.regular, fontSize: 11, color: PALETTE.textTertiary, italic: true },
  badgeCol: { alignItems: 'flex-end', gap: 4 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  badgeText: { fontFamily: FONT.semibold, fontSize: 11, color: PALETTE.textPrimary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: PALETTE.bg, borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg, padding: SPACING.lg, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: PALETTE.border, paddingBottom: SPACING.md },
  modalTitle: { fontFamily: FONT.bold, fontSize: 18, color: PALETTE.textPrimary },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  form: { gap: SPACING.md, marginTop: SPACING.md, paddingBottom: SPACING.xl },
  inputLabel: { fontFamily: FONT.bold, fontSize: 12, color: PALETTE.textSecondary, textTransform: 'uppercase', tracking: 0.5 },
  subInputLabel: { fontFamily: FONT.medium, fontSize: 11, color: PALETTE.textSecondary, marginBottom: 4 },
  sectionLabel: { fontFamily: FONT.bold, fontSize: 13, color: PALETTE.textPrimary, textTransform: 'uppercase', marginTop: SPACING.sm },
  assetPicker: { gap: SPACING.sm, paddingBottom: SPACING.xs },
  pickerItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: RADIUS.md, backgroundColor: PALETTE.surface, borderWidth: 1, borderColor: PALETTE.border },
  pickerItemActive: { borderColor: PALETTE.catYellow, backgroundColor: PALETTE.catYellowSoft },
  pickerText: { fontFamily: FONT.medium, fontSize: 13, color: PALETTE.textSecondary },
  pickerTextActive: { color: PALETTE.textPrimary, fontFamily: FONT.bold },
  textInput: { height: 48, borderRadius: RADIUS.md, backgroundColor: PALETTE.surface, borderWidth: 1, borderColor: PALETTE.border, paddingHorizontal: SPACING.md, color: PALETTE.textPrimary, fontFamily: FONT.regular },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  timeInput: { height: 48, borderRadius: RADIUS.md, backgroundColor: PALETTE.surface, borderWidth: 1, borderColor: PALETTE.border, paddingHorizontal: SPACING.md, color: PALETTE.textPrimary, fontFamily: FONT.semibold, textAlign: 'center' },
  validationBanner: { flexDirection: 'row', gap: SPACING.sm, padding: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center' },
  validBanner: { backgroundColor: PALETTE.success + '15' },
  invalidBanner: { backgroundColor: PALETTE.danger + '15' },
  validationText: { flex: 1, fontFamily: FONT.medium, fontSize: 12 },
  validText: { color: PALETTE.success },
  invalidText: { color: PALETTE.danger },
  submitButton: { height: 50, borderRadius: RADIUS.md, backgroundColor: PALETTE.catYellow, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.md },
  submitButtonDisabled: { backgroundColor: PALETTE.surface, opacity: 0.6 },
  submitButtonText: { fontFamily: FONT.bold, fontSize: 15, color: PALETTE.bg },
  errorTextSmall: { fontFamily: FONT.medium, fontSize: 11, color: PALETTE.error, marginVertical: 6 },
  
  // Auto assignment styles
  autoTaskForm: { backgroundColor: PALETTE.surfaceOverlay, borderRadius: RADIUS.md, padding: SPACING.md, gap: 4 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: SPACING.xs },
  smallPill: { paddingVertical: 4, paddingHorizontal: SPACING.md, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: PALETTE.border, backgroundColor: PALETTE.surface },
  smallPillText: { fontSize: 11, color: PALETTE.textSecondary, fontFamily: FONT.medium, textTransform: 'capitalize' },
  addBatchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: PALETTE.info, height: 44, borderRadius: RADIUS.md, marginTop: SPACING.md },
  addBatchBtnText: { fontFamily: FONT.bold, fontSize: 13, color: PALETTE.textInverse },
  draftList: { gap: SPACING.sm, minHeight: 60 },
  draftItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: PALETTE.surface, borderWidth: 1, borderColor: PALETTE.border, padding: SPACING.md, borderRadius: RADIUS.md },
  draftTitle: { fontFamily: FONT.bold, fontSize: 13, color: PALETTE.textPrimary },
  draftSubtitle: { fontFamily: FONT.regular, fontSize: 11, color: PALETTE.textSecondary, marginTop: 2 },
  deleteDraftBtn: { padding: SPACING.sm, marginLeft: 'auto' },
  emptyDraftText: { fontFamily: FONT.regular, fontSize: 12, color: PALETTE.textTertiary, textAlign: 'center', marginVertical: 12, italic: true },
  strategyRow: { marginTop: SPACING.sm },
  strategyPill: { flex: 1, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, borderColor: PALETTE.border, backgroundColor: PALETTE.surface, alignItems: 'center' },
  strategyPillActive: { borderColor: PALETTE.catYellow, backgroundColor: PALETTE.catYellowSoft },
  strategyText: { fontFamily: FONT.medium, fontSize: 11, color: PALETTE.textSecondary, textAlign: 'center' },
  strategyTextActive: { fontFamily: FONT.bold, color: PALETTE.textPrimary },
  solveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: PALETTE.catYellow, height: 50, borderRadius: RADIUS.md, marginTop: SPACING.md },
  solveBtnText: { fontFamily: FONT.bold, fontSize: 14, color: PALETTE.bg },
  proposedPlan: { gap: SPACING.sm },
  proposedItem: { flexDirection: 'row', gap: SPACING.md, alignItems: 'center', backgroundColor: PALETTE.surface, borderWidth: 1, borderColor: PALETTE.border, padding: SPACING.md, borderRadius: RADIUS.md },
  proposedTitle: { fontFamily: FONT.bold, fontSize: 13, color: PALETTE.textPrimary },
  proposedSubtitle: { fontFamily: FONT.regular, fontSize: 11, color: PALETTE.textSecondary },
  proposedTime: { fontFamily: FONT.medium, fontSize: 10, color: PALETTE.textTertiary },
  conflictReason: { fontFamily: FONT.medium, fontSize: 11, color: PALETTE.error, marginTop: 2 },
  btnRow: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.lg },
  backDraftBtn: { flex: 1, height: 48, borderRadius: RADIUS.md, borderWidth: 1, borderColor: PALETTE.borderStrong, alignItems: 'center', justifyContent: 'center' },
  backDraftBtnText: { fontFamily: FONT.semibold, fontSize: 13, color: PALETTE.textPrimary },
  confirmCommitBtn: { flex: 1.5, height: 48, borderRadius: RADIUS.md, backgroundColor: PALETTE.success, alignItems: 'center', justifyContent: 'center' },
  confirmCommitBtnText: { fontFamily: FONT.bold, fontSize: 13, color: PALETTE.textInverse },
  
  // Backlog Queue styles
  queueList: { gap: SPACING.sm, marginTop: SPACING.xs },
  queueItem: { flexDirection: 'row', gap: SPACING.md, alignItems: 'center', backgroundColor: PALETTE.surfaceOverlay, borderWidth: 1, borderColor: PALETTE.border, padding: SPACING.md, borderRadius: RADIUS.md },
  queueIconCol: { position: 'relative', width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  priorityDot: { position: 'absolute', top: -2, right: -2, width: 6, height: 6, borderRadius: 3, backgroundColor: PALETTE.danger },
  queueTitleText: { fontFamily: FONT.bold, fontSize: 13, color: PALETTE.textPrimary },
  queueDetailsText: { fontFamily: FONT.regular, fontSize: 11, color: PALETTE.textSecondary },
  queueTimeText: { fontFamily: FONT.medium, fontSize: 10, color: PALETTE.textTertiary },
  cancelQueueIconBtn: { padding: SPACING.xs, marginLeft: 'auto' },
  actionBtnRowSmall: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs },
  queueItemBtn: { backgroundColor: PALETTE.warningSoft, borderWidth: 1, borderColor: PALETTE.warningBorder, paddingVertical: 6, paddingHorizontal: 12, borderRadius: RADIUS.sm },
  queueItemBtnText: { fontFamily: FONT.bold, fontSize: 11, color: PALETTE.warning },
  cancelItemBtn: { backgroundColor: PALETTE.surface, borderWidth: 1, borderColor: PALETTE.borderStrong, paddingVertical: 6, paddingHorizontal: 12, borderRadius: RADIUS.sm },
  cancelItemBtnText: { fontFamily: FONT.medium, fontSize: 11, color: PALETTE.textSecondary },
  queueAllBtn: { height: 44, borderRadius: RADIUS.md, backgroundColor: PALETTE.warning, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.md },
  queueAllBtnText: { fontFamily: FONT.bold, fontSize: 13, color: PALETTE.bg },
  conflictInfoSub: { fontFamily: FONT.medium, fontSize: 11, color: PALETTE.textSecondary, marginBottom: SPACING.xs }
});
