import { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Calendar, Users, Boxes, Plus, AlertTriangle, CheckCircle2, Clock, Shield, Briefcase, ChevronRight, X } from 'lucide-react-native';
import { PALETTE, RADIUS, SPACING, SHADOW, FONT } from '@/theme/tokens';
import { Screen } from '@/components/Screen';
import { ManagerShell } from '@/components/ManagerShell';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { Avatar } from '@/components/Avatar';
import { SITES, OPERATORS, ASSETS, TASKS } from '@/data/mock';
import equipmentTypes from '@/constant/equipment_type.json';
import { API_BASE_URL } from '@/constant/api';
import { useSession } from '@/context/SessionContext';

const HOURS = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];

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

export default function ManagerScheduling() {
  const { managerId } = useSession();
  const [activeSiteId, setActiveSiteId] = useState('site-01');
  const [sites, setSites] = useState<any[]>(SITES);
  const [allOperators, setAllOperators] = useState<any[]>(OPERATORS);
  const [rentedAssets, setRentedAssets] = useState<any[]>(ASSETS);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedOperatorId, setSelectedOperatorId] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('16:00');

  const timeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 480;
    const parts = timeStr.split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return 480;
    return h * 60 + m;
  };

  // Fetch scheduling data from backend
  const loadData = async () => {
    try {
      setLoading(true);
      const resolvedManagerId = managerId || 'mgr-01';
      const res = await fetch(`${API_BASE_URL}/api/v1/manager/scheduling-data/${resolvedManagerId}`, {
        headers: { 'Content-Type': 'application/json' }
      });
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
          // Set first site active if current one doesn't exist
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
            safetyScore: 95, // Fallback placeholder metric
            availability: o.status === 'available' ? 'available' : 'busy'
          }));
          setAllOperators(mappedOps);
        }

        // Map Assets
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
    } catch (err) {
      console.log('Backend not reachable, running with mock data fallback.', err);
      // fallback initialization
      setSites(SITES);
      setAllOperators(OPERATORS);
      setRentedAssets(ASSETS);
      const initialAssignments = TASKS.map(t => {
        const asset = ASSETS.find(a => a.machineId === t.machineId);
        const op = OPERATORS.find(o => o.id === t.operatorId);
        return {
          id: t.id,
          assetId: asset?.id || '',
          assetName: asset?.name || 'Unknown Asset',
          assetType: asset?.assetType || 'Unknown',
          operatorId: t.operatorId,
          operatorName: op?.name || 'Unknown Operator',
          jobTitle: t.name,
          startTime: t.dueTime.localeCompare('12:00') < 0 ? '08:00' : '12:00',
          endTime: t.dueTime.localeCompare('16:00') < 0 ? '16:00' : '20:00',
          status: t.status,
          siteId: t.siteId
        };
      });
      setAssignments(initialAssignments);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [managerId]);

  const siteAssets = useMemo(() => {
    return rentedAssets.filter(a => a.siteId === activeSiteId);
  }, [rentedAssets, activeSiteId]);

  const siteOperators = useMemo(() => {
    return allOperators.filter(op => {
      return op.assignedSiteId === activeSiteId || op.status === 'available' || op.availability === 'available';
    });
  }, [allOperators, activeSiteId]);

  const selectedAsset = useMemo(() => {
    return rentedAssets.find(a => a.id === selectedAssetId);
  }, [rentedAssets, selectedAssetId]);

  const selectedOperator = useMemo(() => {
    return allOperators.find(o => o.id === selectedOperatorId);
  }, [allOperators, selectedOperatorId]);

  // Operator certification status check
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
    if (!selectedAssetId || !selectedOperatorId || !jobTitle) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    if (certificationStatus && !certificationStatus.certified) {
      Alert.alert(
        'Invalid Operator', 
        `Operator ${selectedOperator?.name} does not hold a certification for ${selectedAsset?.assetType}.`
      );
      return;
    }

    try {
      // Calculate ISO strings for today's date
      const now = new Date();
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      
      const startDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, startMin, 0);
      const endDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endHour, endMin, 0);

      // Perform POST request to backend
      const response = await fetch(`${API_BASE_URL}/api/v1/manager/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: selectedAssetId,
          operator_id: selectedOperatorId,
          job_title: jobTitle,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString()
        })
      });

      if (response.ok) {
        Alert.alert('Success', 'Operator scheduled and assigned to asset successfully.');
        setModalVisible(false);
        // Refresh scheduling data dynamically from server
        loadData();
      } else {
        const errJson = await response.json();
        Alert.alert('Server Error', errJson.detail || 'Failed to create assignment on server.');
      }
    } catch (err) {
      console.log('Error saving assignment:', err);
      Alert.alert('Error', 'Could not save assignment to server.');
    } finally {
      // Reset Form
      setSelectedAssetId('');
      setSelectedOperatorId('');
      setJobTitle('');
      setStartTime('08:00');
      setEndTime('16:00');
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
              <View>
                <Text style={styles.cardTitle}>Asset Allocation Timeline</Text>
                <Text style={styles.cardSubtitle}>Shift assignments & time intersections</Text>
              </View>
              <Pressable style={styles.addButton} onPress={() => setModalVisible(true)}>
                <Plus size={16} color={PALETTE.bg} strokeWidth={2.5} />
                <Text style={styles.addButtonText}>Assign</Text>
              </Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.ganttContainer}>
                {/* Timeline Header Row */}
                <View style={styles.ganttHeaderRow}>
                  <View style={styles.ganttAssetCol}><Text style={styles.headerText}>Asset</Text></View>
                  {HOURS.map(h => (
                    <View key={h} style={styles.ganttTimeCol}><Text style={styles.headerText}>{h}</Text></View>
                  ))}
                </View>

                {/* Rows for each asset */}
                {siteAssets.map(asset => {
                  const assetAssignments = assignments.filter(a => a.assetId === asset.id && a.siteId === activeSiteId);
                  
                  // Compute non-overlapping lanes dynamically for this asset
                  const sortedAssigns = [...assetAssignments].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
                  const lanes: any[][] = [];
                  sortedAssigns.forEach(item => {
                    let placed = false;
                    const itemStart = timeToMinutes(item.startTime);
                    const itemEnd = timeToMinutes(item.endTime);

                    for (let i = 0; i < lanes.length; i++) {
                      const lane = lanes[i];
                      const hasOverlap = lane.some(placedItem => {
                        const pStart = timeToMinutes(placedItem.startTime);
                        const pEnd = timeToMinutes(placedItem.endTime);
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

                  const trackHeight = lanes.length > 0 ? lanes.length * 44 + 8 : 42;

                  return (
                    <View key={asset.id} style={[styles.ganttRow, { alignItems: 'flex-start' }]}>
                      {/* Asset Column */}
                      <View style={[styles.ganttAssetCol, { minHeight: trackHeight, justifyContent: 'center' }]}>
                        <Text style={styles.assetNameText}>{asset.name}</Text>
                        <Text style={styles.assetTypeText}>{asset.assetType}</Text>
                      </View>

                      {/* Time Slots & Assignment Blocks */}
                      <View style={[styles.timelineTrack, { height: trackHeight }]}>
                        {lanes.length === 0 ? (
                          <View style={styles.idleBlock}>
                            <Text style={styles.idleText}>Available</Text>
                          </View>
                        ) : (
                          lanes.map((lane, laneIdx) => 
                            lane.map(assign => {
                              const startMin = Math.max(480, Math.min(1200, timeToMinutes(assign.startTime)));
                              const endMin = Math.max(480, Math.min(1200, timeToMinutes(assign.endTime)));
                              const leftPercent = ((startMin - 480) / 720) * 100;
                              const widthPercent = Math.max(5, ((endMin - startMin) / 720) * 100);

                              return (
                                <View 
                                  key={assign.id} 
                                  style={[
                                    styles.assignmentBlock, 
                                    { 
                                      left: `${leftPercent}%`, 
                                      width: `${widthPercent - 1}%`, 
                                      top: laneIdx * 44 + 4,
                                      height: 38
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

          {/* Visualization 2: Certifications and Operators List */}
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
                {/* 1. SELECT ASSET */}
                <Text style={styles.inputLabel}>Select Equipment *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.assetPicker}>
                  {siteAssets.map(asset => (
                    <Pressable
                      key={asset.id}
                      onPress={() => setSelectedAssetId(asset.id)}
                      style={[styles.pickerItem, selectedAssetId === asset.id && styles.pickerItemActive]}
                    >
                      <Boxes size={16} color={selectedAssetId === asset.id ? PALETTE.catYellow : PALETTE.textSecondary} />
                      <Text style={[styles.pickerText, selectedAssetId === asset.id && styles.pickerTextActive]}>{asset.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>

                {/* 2. SELECT OPERATOR */}
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

                {/* Certification Validation Indicator */}
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

                {/* 3. TASK NAME */}
                <Text style={styles.inputLabel}>Task Description *</Text>
                <TextInput
                  style={styles.textInput}
                  value={jobTitle}
                  onChangeText={setJobTitle}
                  placeholder="e.g. Trench Excavation Sector A"
                  placeholderTextColor={PALETTE.textTertiary}
                />

                {/* 4. TIME WINDOW */}
                <Text style={styles.inputLabel}>Time Window</Text>
                <View style={styles.timeRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subInputLabel}>Start Time</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={startTime}
                      onChangeText={setStartTime}
                      placeholder="08:00"
                      placeholderTextColor={PALETTE.textTertiary}
                    />
                  </View>
                  <ChevronRight size={18} color={PALETTE.textTertiary} style={{ marginTop: 24 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subInputLabel}>End Time</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={endTime}
                      onChangeText={setEndTime}
                      placeholder="16:00"
                      placeholderTextColor={PALETTE.textTertiary}
                    />
                  </View>
                </View>

                {/* SUBMIT BUTTON */}
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontFamily: FONT.bold, fontSize: 17, color: PALETTE.textPrimary },
  cardSubtitle: { fontFamily: FONT.regular, fontSize: 12, color: PALETTE.textSecondary },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: PALETTE.catYellow, paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md, borderRadius: RADIUS.md },
  addButtonText: { fontFamily: FONT.bold, fontSize: 12, color: PALETTE.bg },
  ganttContainer: { paddingVertical: SPACING.sm },
  ganttHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: PALETTE.border, paddingBottom: SPACING.sm },
  ganttAssetCol: { width: 140, justifyContent: 'center' },
  ganttTimeCol: { width: 80, alignItems: 'center', justifyContent: 'center' },
  headerText: { fontFamily: FONT.bold, fontSize: 11, color: PALETTE.textTertiary },
  ganttRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: PALETTE.border, paddingVertical: SPACING.md },
  assetNameText: { fontFamily: FONT.bold, fontSize: 13, color: PALETTE.textPrimary },
  assetTypeText: { fontFamily: FONT.regular, fontSize: 10, color: PALETTE.textSecondary },
  timelineTrack: { flex: 1, flexDirection: 'row', width: 560, position: 'relative', height: 42, backgroundColor: PALETTE.surfaceOverlay, borderRadius: RADIUS.sm, overflow: 'hidden' },
  idleBlock: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  idleText: { fontFamily: FONT.medium, fontSize: 11, color: PALETTE.success },
  assignmentBlock: { position: 'absolute', top: 4, height: 34, borderRadius: RADIUS.sm, backgroundColor: PALETTE.catYellowSoft, borderLeftWidth: 3, borderLeftColor: PALETTE.catYellow, paddingHorizontal: SPACING.sm, justifyContent: 'center' },
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
  form: { gap: SPACING.md, marginTop: SPACING.md, paddingBottom: SPACING.xl },
  inputLabel: { fontFamily: FONT.bold, fontSize: 12, color: PALETTE.textSecondary, textTransform: 'uppercase', tracking: 0.5 },
  subInputLabel: { fontFamily: FONT.medium, fontSize: 11, color: PALETTE.textSecondary, marginBottom: 4 },
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
});
