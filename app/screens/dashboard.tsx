import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import NetInfo from '@react-native-community/netinfo';
import React, { useEffect, useRef, useState } from 'react';
import {
    Dimensions, Image, Linking, Platform, Pressable, RefreshControl,
    SafeAreaView, ScrollView, StyleSheet, Text, ToastAndroid, TouchableOpacity, View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { Circle, G, Svg, Line as SvgLine, Text as SvgText } from 'react-native-svg';
import CustomDrawer from '../../components/CustomDrawer';
import { useTheme } from '../../context/ThemeContext';
import { getMachineDataOffline, saveMachineDataOffline, setupMachineDB } from '../../utils/machineDB';

const screenWidth = Dimensions.get('window').width;
const BASE_URL = 'https://indxoapp.onrender.com';
const API_URL = `${BASE_URL}/machines/latest`;
const logo = require('../../assets/images/Logo.png');

const AnimatedSvgLine = Animated.createAnimatedComponent(SvgLine);
const machineList = ['Machine 01', 'Machine 02', 'Machine 03'];

const Gauge = ({ value }: { value: number }) => {
  const radius = 60;
  const needleValue = useSharedValue(0);

  useEffect(() => {
    needleValue.value = withTiming(value, { duration: 1000 });
  }, [value]);

  const animatedProps = useAnimatedProps(() => {
    const angle = Math.min(Math.max((needleValue.value / 6000) * 180, 0), 180);
    const rotation = (angle - 90) * (Math.PI / 180);
    const needleX = radius + radius * Math.cos(rotation);
    const needleY = radius + radius * Math.sin(rotation);
    return { x2: needleX, y2: needleY };
  });

  return (
    <Svg width={2 * radius + 20} height={radius + 40}>
      <G x={10} y={20}>
        <Circle cx={radius} cy={radius} r={radius} stroke="#3d5875" strokeWidth={10} fill="none" />
        <AnimatedSvgLine animatedProps={animatedProps} x1={radius} y1={radius} stroke="#00e0ff" strokeWidth={4} />
        <SvgText x={radius} y={radius - 25} textAnchor="middle" fontSize="16" fill="#ffffff" fontWeight="bold">
          {`${value} RPM`}
        </SvgText>
      </G>
    </Svg>
  );
};

export default function Dashboard() {
  const { theme } = useTheme();
  const [selectedMachine, setSelectedMachine] = useState('Machine 01');
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [machineData, setMachineData] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [usedOfflineData, setUsedOfflineData] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isMounted = useRef(true);
  const [prevConnection, setPrevConnection] = useState<boolean | null>(null);

  const showToast = (msg: string) => {
    ToastAndroid.showWithGravity(msg, ToastAndroid.SHORT, ToastAndroid.TOP);
  };

  const saveLastSyncTime = async (machine: string, date: string) => {
    const key = `sync_${machine}_${date}`;
    await AsyncStorage.setItem(key, new Date().toISOString());
  };

  const getLastSyncTime = async (machine: string, date: string) => {
    const key = `sync_${machine}_${date}`;
    const stored = await AsyncStorage.getItem(key);
    return stored ? new Date(stored) : null;
  };

  const fetchMachineData = async () => {
    const formattedDate = date.toISOString().split('T')[0];
    try {
      const res = await fetch(`${API_URL}?name=${encodeURIComponent(selectedMachine)}&date=${formattedDate}`);
      const data = await res.json();

      if (data && data.id) {
        await saveMachineDataOffline(data.name, formattedDate, data.spindle_speed, data.rest_time, data.power_consumption, data.status);
        await saveLastSyncTime(data.name, formattedDate);
        setMachineData(data);
        setUsedOfflineData(false);
        showToast('✅ Online data loaded');
      } else {
        setMachineData(null);
      }

      const syncedAt = await getLastSyncTime(selectedMachine, formattedDate);
      if (syncedAt) setLastUpdated(syncedAt);
    } catch (err) {
      const fallback = await getMachineDataOffline(selectedMachine, formattedDate);
      if (fallback) {
        setMachineData(fallback);
        setUsedOfflineData(true);
        showToast('📴 Offline data loaded');
      } else {
        setMachineData(null);
        showToast('❌ No offline data found');
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMachineData();
    setRefreshing(false);
  };

  useEffect(() => {
    setupMachineDB();
    fetchMachineData();

    const unsubscribe = NetInfo.addEventListener(async state => {
      const isConnected = state.isConnected && state.isInternetReachable;
      if (prevConnection !== isConnected) {
        setPrevConnection(isConnected);
        await fetchMachineData();
      }
    });

    return () => {
      isMounted.current = false;
      unsubscribe();
    };
  }, [selectedMachine, date]);

  const spindleSpeed = Number(machineData?.spindle_speed) || 0;
  const powerConsumption = Number(machineData?.power_consumption) || 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Running': return '#00B386';
      case 'Idle': return '#fbbf24';
      case 'Error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#0D0D0D' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setDrawerOpen(!drawerOpen)} style={styles.menuButton}>
          <Ionicons name="menu" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => Linking.openURL('https://indxo.ai')}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
          </TouchableOpacity>
          <Ionicons
            name={usedOfflineData ? 'cloud-offline-outline' : 'cloud-done-outline'}
            size={24}
            color={usedOfflineData ? 'orange' : '#00FFAA'}
            style={{ marginLeft: 12 }}
          />
        </View>
      </View>

      <Text style={styles.title}>Dashboard</Text>
      {lastUpdated && <Text style={styles.lastUpdated}>Last sync: {lastUpdated.toLocaleString()}</Text>}
      {usedOfflineData && <Text style={{ color: 'orange', fontSize: 12, marginLeft: 16 }}>Viewing offline data</Text>}

      <ScrollView
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00e0ff" />}
      >
        <View style={styles.filterRow}>
          <View style={{ flex: 1 }}>
            <TouchableOpacity style={styles.dropdownButton} onPress={() => setDropdownVisible(!dropdownVisible)}>
              <Text style={styles.dropdownText}>{selectedMachine}</Text>
              <Ionicons name="chevron-down" color="#fff" size={18} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
            {dropdownVisible && (
              <View style={styles.dropdownList}>
                {machineList.map(machine => (
                  <TouchableOpacity
                    key={machine}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedMachine(machine);
                      setDropdownVisible(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{machine}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.dateButton}>
            <Text style={styles.dateText}>{date.toDateString()}</Text>
          </TouchableOpacity>
        </View>

        {showPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_event, selectedDate) => {
              setShowPicker(false);
              if (selectedDate) setDate(selectedDate);
            }}
          />
        )}

        {machineData ? (
          <>
            <View style={styles.rowHeader}>
              <Text style={styles.machineName}>{machineData.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(machineData.status) }]}>
                <Text style={styles.statusText}>{machineData.status.toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.metricRow}>
              <View style={styles.metricCard}>
                <Text style={styles.label}>SPINDLE SPEED</Text>
                <Text style={styles.value}>{spindleSpeed} RPM</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.label}>POWER</Text>
                <Text style={styles.value}>{powerConsumption} kW</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.label}>REST TIME</Text>
                <Text style={styles.value}>
                  {Math.floor(machineData.rest_time / 60).toString().padStart(2, '0')}:
                  {(machineData.rest_time % 60).toString().padStart(2, '0')}
                </Text>
              </View>
            </View>

            <View style={styles.utilizationContainer}>
              <Gauge value={spindleSpeed} />
              <Text style={styles.utilizationLabel}>Spindle Gauge</Text>
            </View>

            <Text style={styles.chartTitle}>Spindle Speed / Power</Text>
            <LineChart
              data={{
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                datasets: [
                  { data: [3000, 3100, 2900, 3300, 3200, spindleSpeed], color: () => '#4F46E5', strokeWidth: 2 },
                  { data: [3.1, 3.3, 3.0, 3.6, 3.4, powerConsumption], color: () => '#10B981', strokeWidth: 2 },
                ],
                legend: ['Spindle', 'Power'],
              }}
              width={screenWidth - 40}
              height={220}
              chartConfig={{
                backgroundColor: '#1F2937',
                backgroundGradientFrom: '#1F2937',
                backgroundGradientTo: '#111827',
                color: () => '#fff',
                labelColor: () => '#9CA3AF',
                decimalPlaces: 1,
              }}
              bezier
              style={{ borderRadius: 16, marginHorizontal: 20 }}
            />
          </>
        ) : (
          <Text style={{ color: '#aaa', marginTop: 20, alignSelf: 'center' }}>
            No data found.
          </Text>
        )}
      </ScrollView>

      {drawerOpen && (
        <Pressable style={styles.drawerOverlay} onPress={() => setDrawerOpen(false)}>
          <CustomDrawer onClose={() => setDrawerOpen(false)} />
        </Pressable>
      )}
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 15,
    backgroundColor: '#0D0D0D',
    justifyContent: 'space-between',
  },
  logo: { width: 120, height: 40 },
  menuButton: { padding: 6 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 16,
    marginBottom: 4,
  },
  lastUpdated: {
    color: '#aaa',
    fontSize: 12,
    marginLeft: 16,
    marginBottom: 4,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  dropdownButton: {
    backgroundColor: '#1F2937',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownText: { color: '#fff', fontSize: 16 },
  dropdownList: {
    backgroundColor: '#1F2937',
    borderRadius: 10,
    marginTop: 6,
    overflow: 'hidden',
  },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 16 },
  dropdownItemText: { color: '#fff', fontSize: 16 },
  dateButton: {
    backgroundColor: '#1F2937',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateText: { color: '#fff', fontSize: 16 },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 10,
  },
  machineName: { fontSize: 20, color: '#fff', fontWeight: 'bold' },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusText: { color: '#fff', fontWeight: 'bold' },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  metricCard: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 90,
  },
  label: { color: '#9CA3AF', fontSize: 12 },
  value: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 6 },
  utilizationContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  utilizationLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 8,
  },
  chartTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    marginLeft: 20,
  },
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 999,
  },
});
