import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import NetInfo from '@react-native-community/netinfo';
import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useEffect, useState } from 'react';
import {
    Dimensions, Platform, Pressable, RefreshControl,
    SafeAreaView, ScrollView, StyleSheet, Text, ToastAndroid,
    TouchableOpacity, View
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import CustomDrawer from '../../components/CustomDrawer';

const screenWidth = Dimensions.get('window').width;
const API_URL = 'https://indxoapp.onrender.com/spindle-data';
const machineList = ['Machine 01', 'Machine 02', 'Machine 03'];

export default function SpindleChart() {
  const [selectedMachine, setSelectedMachine] = useState(machineList[0]);
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [landscape, setLandscape] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dataSource, setDataSource] = useState<'online' | 'offline'>('offline');
  const [spindleData, setSpindleData] = useState<any[]>([]);

  const toggleDrawer = () => setDrawerOpen(!drawerOpen);
  const closeDrawer = () => setDrawerOpen(false);

  const getStorageKey = (machine: string, date: string) =>
    `spindle_logs_${machine}_${date}`;

  const fetchSpindleData = async () => {
    const formattedDate = date.toISOString().split('T')[0];
    const net = await NetInfo.fetch();
    const isConnected = net.isConnected && net.isInternetReachable;

    if (isConnected) {
      try {
        const res = await fetch(`${API_URL}?name=${selectedMachine}&date=${formattedDate}`);
        const data = await res.json();
        const valid = data.filter((d: any) => typeof d.speed === 'number');

        setSpindleData(valid);
        setLastUpdated(new Date());
        setDataSource('online');
        await AsyncStorage.setItem(getStorageKey(selectedMachine, formattedDate), JSON.stringify(valid));
      } catch (err) {
        showOfflineFallback();
      }
    } else {
      showOfflineFallback();
    }

    async function showOfflineFallback() {
      const stored = await AsyncStorage.getItem(getStorageKey(selectedMachine, formattedDate));
      if (stored) {
        const parsed = JSON.parse(stored);
        setSpindleData(parsed);
        setDataSource('offline');
        ToastAndroid.show('📴 Loaded offline data', ToastAndroid.SHORT);
      } else {
        setSpindleData([]);
        ToastAndroid.show('❌ No offline data found', ToastAndroid.SHORT);
      }
    }
  };

  useEffect(() => {
    let prev: boolean | null = null;

    const init = async () => await fetchSpindleData();
    init();

    const unsubscribe = NetInfo.addEventListener(state => {
      const isConnected = state.isConnected && state.isInternetReachable;
      if (isConnected !== prev) {
        prev = isConnected;
        fetchSpindleData();
      }
    });

    return () => unsubscribe();
  }, [selectedMachine, date]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSpindleData();
    setRefreshing(false);
  };

  const toggleOrientation = async () => {
    try {
      const lock = landscape
        ? ScreenOrientation.OrientationLock.PORTRAIT_UP
        : ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT;
      await ScreenOrientation.lockAsync(lock);
      setLandscape(!landscape);
    } catch (err) {
      console.warn('Orientation error:', err);
    }
  };

  const timeLabels = spindleData.map((item, i) => {
    const t = new Date(item.timestamp);
    return i % 10 === 0 ? `${t.getHours()}:${t.getMinutes().toString().padStart(2, '0')}` : '';
  });

  const speedValues = spindleData.map((item) => item.speed);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerWithMenu}>
        <TouchableOpacity onPress={toggleDrawer}>
          <Ionicons name="menu" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>🌀 Spindle Chart</Text>
        <TouchableOpacity onPress={toggleOrientation} style={{ paddingRight: 20 }}>
          <Ionicons name="phone-portrait-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.filterRow}>
          <TouchableOpacity style={styles.dropdownButton} onPress={() => setDropdownVisible(!dropdownVisible)}>
            <Text style={styles.dropdownText}>{selectedMachine}</Text>
            <Ionicons name="chevron-down" color="#fff" size={16} />
          </TouchableOpacity>

          {dropdownVisible && (
            <View style={styles.dropdownList}>
              {machineList.map((machine) => (
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

          <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.dateButton}>
            <Text style={styles.dateText}>{date.toDateString()}</Text>
          </TouchableOpacity>
        </View>

        {showPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(_, selectedDate) => {
              setShowPicker(false);
              if (selectedDate) setDate(selectedDate);
            }}
          />
        )}

        <Text style={styles.chartTitle}>Speed Over Time</Text>
        {spindleData.length > 0 ? (
          <ScrollView horizontal>
            <LineChart
              data={{ labels: timeLabels, datasets: [{ data: speedValues }] }}
              width={Math.max(speedValues.length * 20, screenWidth)}
              height={250}
              chartConfig={{
                backgroundColor: '#1F2937',
                backgroundGradientFrom: '#1F2937',
                backgroundGradientTo: '#111827',
                color: () => '#10B981',
                labelColor: () => '#ccc',
                decimalPlaces: 0,
                propsForDots: { r: '2', strokeWidth: '1', stroke: '#10B981' },
              }}
              withInnerLines
              bezier
              style={{ marginHorizontal: 20, borderRadius: 16 }}
            />
          </ScrollView>
        ) : (
          <Text style={{ color: '#ccc', textAlign: 'center', marginVertical: 20 }}>No data available</Text>
        )}

        <Text style={styles.metaText}>📡 Source: <Text style={{ color: '#22c55e' }}>{dataSource}</Text></Text>
        {lastUpdated && (
          <Text style={styles.metaText}>⏱️ Last Updated: {lastUpdated.toLocaleTimeString()}</Text>
        )}
      </ScrollView>

      {drawerOpen && (
        <Pressable style={styles.drawerOverlay} onPress={closeDrawer}>
          <CustomDrawer onClose={closeDrawer} />
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  headerWithMenu: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 50 : 60, paddingHorizontal: 15, paddingBottom: 20,
  },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 20, marginBottom: 16 },
  dropdownButton: {
    backgroundColor: '#1F2937', borderRadius: 8, padding: 10, flexDirection: 'row', alignItems: 'center',
  },
  dropdownText: { color: '#fff', fontSize: 16 },
  dropdownList: { backgroundColor: '#1F2937', borderRadius: 8, marginTop: 4 },
  dropdownItem: { padding: 10 },
  dropdownItemText: { color: '#fff' },
  dateButton: { backgroundColor: '#1F2937', borderRadius: 8, padding: 10 },
  dateText: { color: '#fff' },
  chartTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 20, marginBottom: 10 },
  metaText: { color: '#aaa', textAlign: 'center', marginTop: 6 },
  drawerOverlay: {
    position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 1000,
  },
});
