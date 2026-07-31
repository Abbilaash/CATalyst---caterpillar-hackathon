import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';

// ============================================================================
// TELEMETRY PACKET INTERFACE (EXACT REQUESTED SCHEMA)
// ============================================================================

export interface TelemetryPacket {
  asset_id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  altitude: number;
  heading: number;
  speed_kmph: number;
  engine_status: 'ON' | 'OFF';
  ignition_status: 'ON' | 'OFF';
  engine_rpm: number;
  engine_hours: number;
  idle_hours: number;
  fuel_level_percent: number;
  fuel_remaining_liters: number;
  fuel_consumption_lph: number;
  engine_temperature: number;
  coolant_temperature: number;
  hydraulic_oil_temperature: number;
  hydraulic_pressure: number;
  payload_tons: number;
  bucket_position_percent: number;
  boom_height: number;
  battery_voltage: number;
  operating_mode: 'Idle' | 'Working' | 'Travelling' | 'Parked';
}

export interface Machine {
  id: string;
  name: string;
  model: string;
  equipmentType: string;
  fuelCapacity: number;
  initialEngineHours: number;
  startLat: number;
  startLon: number;
}

const AVAILABLE_MACHINES: Machine[] = [
  {
    id: 'CAT-EXC-349',
    name: 'CAT 349 Hydraulic Excavator',
    model: '349 UHD',
    equipmentType: 'Hydraulic Excavator',
    fuelCapacity: 350,
    initialEngineHours: 1245.80,
    startLat: 40.712800,
    startLon: -74.006000,
  },
  {
    id: 'CAT-DOZ-D11',
    name: 'CAT D11 Mining Dozer',
    model: 'D11 Heavy Tractor',
    equipmentType: 'Track-Type Tractor',
    fuelCapacity: 500,
    initialEngineHours: 3820.50,
    startLat: 40.713500,
    startLon: -74.008200,
  },
  {
    id: 'CAT-TRK-797F',
    name: 'CAT 797F Mining Truck',
    model: '797F Off-Highway',
    equipmentType: 'Off-Highway Truck',
    fuelCapacity: 700,
    initialEngineHours: 5100.25,
    startLat: 40.711200,
    startLon: -74.004100,
  },
];

const formatOperatingTime = (totalSeconds: number): string => {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Immediate Database Ingestion API helper
const pushToDatabase = (payload: any) => {
  try {
    fetch('http://localhost:8085/refuel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch (e) {}
};

// Publisher control endpoint helper
const controlPublisher = (asset_id: string, command: string, amount: number = 0) => {
  try {
    fetch('http://localhost:8086', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asset_id, command, amount }),
    }).catch(() => {});
  } catch (e) {}
};

export default function CaterpillarMobileApp() {
  const [assignedMachine, setAssignedMachine] = useState<Machine | null>(null);
  const [shiftStarted, setShiftStarted] = useState<boolean>(false);
  const [operatingSeconds, setOperatingSeconds] = useState<number>(0);

  // Numeric Fuel Entry State
  const [fuelInput, setFuelInput] = useState<string>('');
  const [fuelError, setFuelError] = useState<string>('');

  // Persistent Telemetry State
  const [telemetry, setTelemetry] = useState<TelemetryPacket>({
    asset_id: '',
    timestamp: new Date().toISOString(),
    latitude: 40.712800,
    longitude: -74.006000,
    altitude: 320.0,
    heading: 180.0,
    speed_kmph: 0.0,
    engine_status: 'OFF',
    ignition_status: 'OFF',
    engine_rpm: 0,
    engine_hours: 0,
    idle_hours: 120.5,
    fuel_level_percent: 80.0,
    fuel_remaining_liters: 280.0,
    fuel_consumption_lph: 0.0,
    engine_temperature: 35.0,
    coolant_temperature: 33.0,
    hydraulic_oil_temperature: 30.0,
    hydraulic_pressure: 25.0,
    payload_tons: 0.0,
    bucket_position_percent: 0.0,
    boom_height: 0.0,
    battery_voltage: 24.0,
    operating_mode: 'Parked',
  });

  const telemetryRef = useRef<TelemetryPacket>(telemetry);
  const fuelCapacityRef = useRef<number>(350);

  // Poll Database for Live Stored Telemetry (Includes dynamic GPS Latitude & Longitude)
  useEffect(() => {
    let intervalId: any;
    if (shiftStarted && telemetry.engine_status === 'ON') {
      intervalId = setInterval(() => {
        fetch('http://localhost:8085/')
          .then((res) => res.json())
          .then((data) => {
            if (data && data.asset_id === telemetryRef.current.asset_id) {
              setTelemetry((prev) => ({
                ...prev,
                latitude: data.latitude ?? prev.latitude,
                longitude: data.longitude ?? prev.longitude,
                speed_kmph: data.speed_kmph ?? prev.speed_kmph,
                engine_rpm: data.engine_rpm ?? prev.engine_rpm,
                fuel_remaining_liters: data.fuel_remaining_liters ?? prev.fuel_remaining_liters,
                fuel_level_percent: data.fuel_level_percent ?? prev.fuel_level_percent,
                engine_temperature: data.engine_temperature ?? prev.engine_temperature,
                hydraulic_pressure: data.hydraulic_pressure ?? prev.hydraulic_pressure,
                operating_mode: data.operating_mode ?? prev.operating_mode,
                engine_hours: data.engine_hours ?? prev.engine_hours,
              }));
            }
          })
          .catch(() => {});
      }, 2000);
    }
    return () => clearInterval(intervalId);
  }, [shiftStarted, telemetry.engine_status]);

  // Operating Time Counter (Increments every second while Engine is ON)
  useEffect(() => {
    let timer: any;
    if (shiftStarted && telemetry.engine_status === 'ON') {
      timer = setInterval(() => {
        setOperatingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [shiftStarted, telemetry.engine_status]);

  // Control 1: Assign Machine
  const handleSelectMachine = (machine: Machine) => {
    setAssignedMachine(machine);
    fuelCapacityRef.current = machine.fuelCapacity;

    const updated: TelemetryPacket = {
      ...telemetryRef.current,
      asset_id: machine.id,
      engine_hours: machine.initialEngineHours,
      latitude: machine.startLat,
      longitude: machine.startLon,
      fuel_remaining_liters: Math.min(telemetryRef.current.fuel_remaining_liters, machine.fuelCapacity),
      fuel_level_percent: Math.round((Math.min(telemetryRef.current.fuel_remaining_liters, machine.fuelCapacity) / machine.fuelCapacity) * 100),
      timestamp: new Date().toISOString(),
    };

    telemetryRef.current = updated;
    setTelemetry(updated);
    pushToDatabase(updated);
  };

  // Control 2: Start Shift
  const handleStartShift = () => {
    if (!assignedMachine) return;
    setShiftStarted(true);
  };

  // Control 3: Start Engine (Starts MQTT Telemetry ONLY for selected machine)
  const handleStartEngine = () => {
    if (!assignedMachine) return;
    const updated: TelemetryPacket = {
      ...telemetryRef.current,
      engine_status: 'ON',
      ignition_status: 'ON',
      operating_mode: 'Idle',
      engine_rpm: 700,
      timestamp: new Date().toISOString(),
    };
    telemetryRef.current = updated;
    setTelemetry(updated);
    pushToDatabase(updated);

    controlPublisher(assignedMachine.id, 'START_ENGINE');
  };

  // Control 4: Stop Engine (Halts MQTT Telemetry & freezes values)
  const handleStopEngine = () => {
    if (!assignedMachine) return;
    const updated: TelemetryPacket = {
      ...telemetryRef.current,
      engine_status: 'OFF',
      ignition_status: 'OFF',
      operating_mode: 'Parked',
      engine_rpm: 0,
      speed_kmph: 0.0,
      fuel_consumption_lph: 0.0,
      timestamp: new Date().toISOString(),
    };
    telemetryRef.current = updated;
    setTelemetry(updated);
    pushToDatabase(updated);

    controlPublisher(assignedMachine.id, 'STOP_ENGINE');
  };

  // Control 5: End Shift
  const handleEndShift = () => {
    handleStopEngine();
    setShiftStarted(false);
  };

  // Fuel Management: Numeric Input Box Submit
  const handleAddFuelSubmit = () => {
    setFuelError('');

    const liters = parseFloat(fuelInput);
    if (isNaN(liters) || liters <= 0) {
      setFuelError('Please enter a valid positive number of liters.');
      return;
    }

    const maxCap = assignedMachine ? assignedMachine.fuelCapacity : fuelCapacityRef.current;
    const currentFuel = telemetryRef.current.fuel_remaining_liters;

    if (currentFuel + liters > maxCap) {
      setFuelError(`Cannot exceed tank capacity of ${maxCap} L. Max addable: ${(maxCap - currentFuel).toFixed(1)} L.`);
      return;
    }

    const newFuel = Math.min(maxCap, Math.round((currentFuel + liters) * 100) / 100);
    const newPct = Math.round((newFuel / maxCap) * 10000) / 100;
    const refuelDelta = Math.round((newFuel - currentFuel) * 100) / 100;

    const updated: TelemetryPacket = {
      ...telemetryRef.current,
      fuel_remaining_liters: newFuel,
      fuel_level_percent: newPct,
      timestamp: new Date().toISOString(),
    };

    setTelemetry(updated);
    telemetryRef.current = updated;
    setFuelInput('');

    pushToDatabase(updated);
    if (assignedMachine) {
      controlPublisher(assignedMachine.id, 'ADD_FUEL', refuelDelta);
    }
  };

  if (!shiftStarted) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#111111" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerBanner}>
            <Text style={styles.brandTitle}>CATERPILLAR</Text>
            <Text style={styles.headerSubtitle}>Operator Shift Initialization</Text>
          </View>

          <Text style={styles.sectionHeader}>Select Machine for Shift</Text>

          {AVAILABLE_MACHINES.map((machine) => {
            const isSelected = assignedMachine?.id === machine.id;
            return (
              <TouchableOpacity
                key={machine.id}
                style={[styles.machineCard, isSelected && styles.machineCardSelected]}
                onPress={() => handleSelectMachine(machine)}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.machineName}>{machine.name}</Text>
                  <Text style={styles.assetBadge}>{machine.id}</Text>
                </View>
                <Text style={styles.machineModel}>{machine.model}</Text>
                <View style={styles.cardDetailRow}>
                  <Text style={styles.cardDetailText}>Tank: {machine.fuelCapacity} L</Text>
                  <Text style={styles.cardDetailText}>Hours: {machine.initialEngineHours} hrs</Text>
                </View>
                {isSelected && <Text style={styles.selectedIndicator}>✓ Machine Selected</Text>}
              </TouchableOpacity>
            );
          })}

          <View style={styles.assignmentStatusBox}>
            <Text style={styles.statusBoxLabel}>Selection Status:</Text>
            <Text style={styles.statusBoxValue}>
              {assignedMachine ? `Selected: ${assignedMachine.name} (${assignedMachine.id})` : 'No Machine Selected'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, !assignedMachine && styles.disabledButton]}
            disabled={!assignedMachine}
            onPress={handleStartShift}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>START SHIFT</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const isEngineOn = telemetry.engine_status === 'ON';
  const maxCap = assignedMachine ? assignedMachine.fuelCapacity : 350;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111111" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.shiftHeader}>
          <View>
            <Text style={styles.shiftMachineName}>{assignedMachine?.name}</Text>
            <Text style={styles.shiftAssetId}>Asset ID: {telemetry.asset_id}</Text>
          </View>
          <View style={[styles.statusBadge, isEngineOn ? styles.statusBadgeOn : styles.statusBadgeOff]}>
            <Text style={styles.statusBadgeText}>ENGINE {telemetry.engine_status}</Text>
          </View>
        </View>

        {/* Engine Controls: Start Engine / Stop Engine */}
        <View style={styles.engineControlsRow}>
          <TouchableOpacity
            style={[styles.engineButton, styles.startEngineButton, isEngineOn && styles.disabledButton]}
            disabled={isEngineOn}
            onPress={handleStartEngine}
            activeOpacity={0.8}
          >
            <Text style={styles.engineButtonText}>▶ START ENGINE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.engineButton, styles.stopEngineButton, !isEngineOn && styles.disabledButton]}
            disabled={!isEngineOn}
            onPress={handleStopEngine}
            activeOpacity={0.8}
          >
            <Text style={styles.engineButtonText}>⏹ STOP ENGINE</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionHeader}>Live Telemetry (Database Source of Truth)</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Operating Time (Runtime)</Text>
            <Text style={[styles.metricValue, styles.metricHighlight]}>{formatOperatingTime(operatingSeconds)}</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Operating Mode</Text>
            <Text style={styles.metricValue}>{telemetry.operating_mode}</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Engine Speed</Text>
            <Text style={styles.metricValue}>{telemetry.engine_rpm} <Text style={styles.unitText}>RPM</Text></Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Ground Speed</Text>
            <Text style={styles.metricValue}>{telemetry.speed_kmph} <Text style={styles.unitText}>km/h</Text></Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Engine Temp</Text>
            <Text style={styles.metricValue}>{telemetry.engine_temperature} <Text style={styles.unitText}>°C</Text></Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Hydraulic Pressure</Text>
            <Text style={styles.metricValue}>{telemetry.hydraulic_pressure} <Text style={styles.unitText}>bar</Text></Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Engine Hours</Text>
            <Text style={styles.metricValue}>{telemetry.engine_hours.toFixed(2)} <Text style={styles.unitText}>hrs</Text></Text>
          </View>
        </View>

        {/* Dynamic Changing GPS Location (Latitude & Longitude) Card */}
        <View style={styles.gpsCard}>
          <Text style={styles.metricLabel}>Live GPS Location (Latitude & Longitude)</Text>
          <Text style={styles.gpsValueText}>
            Lat: {Number(telemetry.latitude).toFixed(6)} | Lon: {Number(telemetry.longitude).toFixed(6)}
          </Text>
        </View>

        {/* Fuel Management: Numeric Input Box */}
        <View style={styles.fuelCard}>
          <View style={styles.fuelHeaderRow}>
            <Text style={styles.fuelTitle}>Fuel Remaining</Text>
            <Text style={styles.fuelValueText}>{telemetry.fuel_remaining_liters} L ({telemetry.fuel_level_percent}%) <Text style={styles.maxFuelText}>/ {maxCap} L</Text></Text>
          </View>

          <View style={styles.fuelBarTrack}>
            <View style={[styles.fuelBarFill, { width: `${Math.min(100, telemetry.fuel_level_percent)}%` }]} />
          </View>

          <Text style={styles.refuelLabel}>Add Fuel (Liters):</Text>
          <View style={styles.fuelInputRow}>
            <TextInput
              style={styles.fuelTextInput}
              keyboardType="numeric"
              placeholder="e.g. 35"
              placeholderTextColor="#777777"
              value={fuelInput}
              onChangeText={setFuelInput}
            />
            <TouchableOpacity style={styles.addFuelBtn} onPress={handleAddFuelSubmit}>
              <Text style={styles.addFuelBtnText}>Add Fuel</Text>
            </TouchableOpacity>
          </View>
          {fuelError ? <Text style={styles.errorText}>{fuelError}</Text> : null}
        </View>

        {/* Control: End Shift */}
        <TouchableOpacity style={styles.endShiftButton} onPress={handleEndShift}>
          <Text style={styles.endShiftButtonText}>END SHIFT</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  headerBanner: { backgroundColor: '#1E1E1E', padding: 18, borderRadius: 12, borderLeftWidth: 6, borderLeftColor: '#FFCD00', marginBottom: 20 },
  brandTitle: { fontSize: 24, fontWeight: '900', color: '#FFCD00', letterSpacing: 2 },
  headerSubtitle: { fontSize: 14, color: '#AAAAAA', marginTop: 4 },
  sectionHeader: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginTop: 18, marginBottom: 12 },
  machineCard: { backgroundColor: '#1E1E1E', padding: 16, borderRadius: 10, borderWidth: 1, borderColor: '#333333', marginBottom: 12 },
  machineCardSelected: { borderColor: '#FFCD00', backgroundColor: '#262419' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  machineName: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  assetBadge: { fontSize: 12, fontWeight: '600', color: '#FFCD00', backgroundColor: '#332B00', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  machineModel: { fontSize: 13, color: '#888888', marginTop: 4 },
  cardDetailRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#2A2A2A' },
  cardDetailText: { fontSize: 13, color: '#CCCCCC' },
  selectedIndicator: { fontSize: 13, fontWeight: '700', color: '#FFCD00', marginTop: 10 },
  assignmentStatusBox: { backgroundColor: '#1A1A1A', padding: 14, borderRadius: 8, marginVertical: 16, borderWidth: 1, borderColor: '#2C2C2C' },
  statusBoxLabel: { fontSize: 12, color: '#888888' },
  statusBoxValue: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', marginTop: 2 },
  primaryButton: { backgroundColor: '#FFCD00', paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  primaryButtonText: { fontSize: 16, fontWeight: '800', color: '#111111', letterSpacing: 1 },
  disabledButton: { opacity: 0.4 },
  shiftHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E1E1E', padding: 16, borderRadius: 12, marginBottom: 16 },
  shiftMachineName: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  shiftAssetId: { fontSize: 13, color: '#888888', marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusBadgeOn: { backgroundColor: '#1B432C' },
  statusBadgeOff: { backgroundColor: '#4A1D1D' },
  statusBadgeText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
  engineControlsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  engineButton: { flex: 0.48, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  startEngineButton: { backgroundColor: '#28A745' },
  stopEngineButton: { backgroundColor: '#DC3545' },
  engineButtonText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  metricCard: { width: '48%', backgroundColor: '#1E1E1E', padding: 14, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#2A2A2A' },
  metricLabel: { fontSize: 12, color: '#888888', marginBottom: 4 },
  metricValue: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  metricHighlight: { color: '#FFCD00', fontFamily: 'monospace', fontSize: 18 },
  unitText: { fontSize: 12, fontWeight: '400', color: '#AAAAAA' },
  gpsCard: { backgroundColor: '#1E1E1E', padding: 14, borderRadius: 10, marginVertical: 4, borderWidth: 1, borderColor: '#2A2A2A' },
  gpsValueText: { fontSize: 14, fontWeight: '700', color: '#FFCD00', fontFamily: 'monospace', marginTop: 4 },
  fuelCard: { backgroundColor: '#1E1E1E', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#2A2A2A', marginVertical: 16 },
  fuelHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  fuelTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  fuelValueText: { fontSize: 16, fontWeight: '800', color: '#FFCD00' },
  maxFuelText: { fontSize: 11, fontWeight: '400', color: '#888888' },
  fuelBarTrack: { height: 10, backgroundColor: '#333333', borderRadius: 5, overflow: 'hidden', marginBottom: 14 },
  fuelBarFill: { height: '100%', backgroundColor: '#FFCD00', borderRadius: 5 },
  refuelLabel: { fontSize: 13, fontWeight: '600', color: '#CCCCCC', marginBottom: 8 },
  fuelInputRow: { flexDirection: 'row', gap: 10 },
  fuelTextInput: { flex: 1, backgroundColor: '#2A2A2A', color: '#FFFFFF', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, fontWeight: '600', borderWidth: 1, borderColor: '#444444' },
  addFuelBtn: { backgroundColor: '#FFCD00', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  addFuelBtnText: { fontSize: 14, fontWeight: '800', color: '#111111' },
  errorText: { fontSize: 12, color: '#FF5555', marginTop: 6 },
  endShiftButton: { backgroundColor: '#333333', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  endShiftButtonText: { fontSize: 14, fontWeight: '700', color: '#FF5555' },
});
