// app/screens/alarm.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import NetInfo from '@react-native-community/netinfo';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  LayoutAnimation,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import CustomDrawer from '../../components/CustomDrawer';

const API_URL = 'https://cncofflinemode.onrender.com/alarms';
const machines = ['Machine 01', 'Machine 02', 'Machine 03'];
const screenWidth = Dimensions.get('window').width;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  try {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  } catch {}
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function AlarmScreen() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [alarms, setAlarms] = useState<any[]>([]);
  const [selectedMachine, setSelectedMachine] = useState('Machine 01');
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [landscape, setLandscape] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const toggleDrawer = () => setDrawerOpen(!drawerOpen);
  const closeDrawer = () => setDrawerOpen(false);

  const toggleOrientation = async () => {
    const newOrientation = landscape
      ? ScreenOrientation.OrientationLock.PORTRAIT_UP
      : ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT;
    await ScreenOrientation.lockAsync(newOrientation);
    setLandscape(!landscape);
  };

  const sendNotification = async (message: string) => {
    if (!Device.isDevice) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚨 Machine Alert',
        body: message,
        data: { screen: 'alarm' },
      },
      trigger: null,
    });
  };

  const fetchAlarms = async (machine = selectedMachine, selectedDate = date) => {
    const netState = await NetInfo.fetch();
    const isConnected = netState.isConnected && netState.isInternetReachable;
    const formattedDate = selectedDate.toISOString().split('T')[0];

    setIsOffline(!isConnected);

    if (isConnected) {
      try {
        const res = await fetch(`${API_URL}?machine=${machine}&date=${formattedDate}`);
        const data = await res.json();

        const newAlerts = data.filter((item: any) =>
          ['Overheat', 'SpeedLimit'].includes(item.alarm_type)
        );
        newAlerts.forEach((alarm: any) => {
          sendNotification(`${alarm.machine_name}: ${alarm.message}`);
        });

        setAlarms(data);
        await AsyncStorage.setItem(`offline_alarms_${machine}_${formattedDate}`, JSON.stringify(data));
        setLastUpdated(new Date());
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
        return;
      } catch (err) {
        console.error('Error fetching alarms online:', err);
      }
    }

    // Fallback to offline
    const cached = await AsyncStorage.getItem(`offline_alarms_${machine}_${formattedDate}`);
    if (cached) {
      setAlarms(JSON.parse(cached));
    }
  };

  useEffect(() => {
    fetchAlarms();
  }, [selectedMachine, date]);

  useEffect(() => {
    const interval = setInterval(() => fetchAlarms(), 30000);
    return () => clearInterval(interval);
  }, [selectedMachine, date]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      if (response.notification.request.content.data.screen === 'alarm') {
        router.push('/screens/alarm');
      }
    });
    return () => subscription.remove();
  }, []);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAlarms();
    setRefreshing(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'Overheat': return '🔥';
      case 'SpeedLimit': return '⚠️';
      case 'UnexpectedStop': return '🛑';
      case 'PowerSurge': return '⚡';
      default: return '🔔';
    }
  };

  const alarmTypeCounts = alarms.reduce((acc: Record<string, number>, alarm: any) => {
    acc[alarm.alarm_type] = (acc[alarm.alarm_type] || 0) + 1;
    return acc;
  }, {});

  const barChartData = {
    labels: Object.keys(alarmTypeCounts),
    datasets: [{ data: Object.values(alarmTypeCounts) }],
  };

  const hourlyCounts: number[] = Array(24).fill(0);
  alarms.forEach((alarm: any) => {
    const hour = new Date(alarm.timestamp).getHours();
    hourlyCounts[hour]++;
  });

  const lineChartData = {
    labels: Array.from({ length: 24 }, (_, i) => i.toString()),
    datasets: [{ data: hourlyCounts }],
  };

  const groupedAlarms = alarms.reduce((acc: any, alarm) => {
    const hour = new Date(alarm.timestamp).getHours();
    if (!acc[hour]) acc[hour] = [];
    acc[hour].push(alarm);
    return acc;
  }, {});

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#121212' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleDrawer} style={styles.menuButton}>
          <Ionicons name="menu" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>🚨 Alarm Logs</Text>
        <TouchableOpacity onPress={toggleOrientation} style={styles.orientationButton}>
          <Ionicons name={landscape ? 'phone-landscape-outline' : 'phone-portrait-outline'} size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={styles.dropdownButton} onPress={() => setDropdownVisible(!dropdownVisible)}>
            <Text style={styles.dropdownText}>{selectedMachine}</Text>
            <Ionicons name="chevron-down" size={18} color="#fff" />
          </TouchableOpacity>
          {dropdownVisible && (
            <View style={styles.dropdownList}>
              {machines.map((m) => (
                <TouchableOpacity key={m} style={styles.dropdownItem} onPress={() => {
                  setSelectedMachine(m);
                  setDropdownVisible(false);
                }}>
                  <Text style={styles.dropdownItemText}>{m}</Text>
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
          onChange={handleDateChange}
        />
      )}

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={{ paddingHorizontal: 10 }}>
          <Text style={styles.chartTitle}>Alarms per Type</Text>
          <Text style={styles.lastUpdated}>
            {isOffline ? '🛑 Offline Mode' : '✅ Online'}
            {lastUpdated && ` | Last Updated: ${lastUpdated.toLocaleTimeString()}`}
          </Text>
          <ScrollView horizontal>
            <BarChart
              data={barChartData}
              width={Math.max(screenWidth, Object.keys(alarmTypeCounts).length * 100)}
              height={220}
              chartConfig={chartConfig}
              style={{ borderRadius: 10, marginRight: 10 }}
              fromZero
              showValuesOnTopOfBars
              yAxisLabel={''}
              yAxisSuffix={''}
            />
          </ScrollView>

          <Text style={styles.chartTitle}>Alarms per Hour</Text>
          <ScrollView horizontal>
            <LineChart
              data={lineChartData}
              width={screenWidth * 2}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={{ borderRadius: 10 }}
              fromZero
            />
          </ScrollView>
        </View>

        <Text style={styles.chartTitle}>Alarm Log</Text>
        {Object.keys(groupedAlarms).map((hour) => (
          <View key={hour} style={{ marginBottom: 16 }}>
            <Text style={styles.groupHeader}>{hour}:00</Text>
            {groupedAlarms[hour].map((alarm: any) => (
              <Animated.View key={alarm.id} style={[styles.alarmCard, { opacity: fadeAnim }]}>
                <Text style={styles.alarmMessage}>
                  {getIcon(alarm.alarm_type)} {alarm.message}
                </Text>
                <Text style={styles.alarmTime}>{new Date(alarm.timestamp).toLocaleString()}</Text>
                <Text style={styles.machineTag}>Machine: {alarm.machine_name}</Text>
              </Animated.View>
            ))}
          </View>
        ))}
      </ScrollView>

      {drawerOpen && (
        <Pressable style={styles.drawerOverlay} onPress={closeDrawer}>
          <CustomDrawer onClose={closeDrawer} />
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const chartConfig = {
  backgroundColor: '#1F2937',
  backgroundGradientFrom: '#1F2937',
  backgroundGradientTo: '#111827',
  color: () => '#10B981',
  labelColor: () => '#9CA3AF',
  decimalPlaces: 0,
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 40 : 50,
    paddingBottom: 10,
    paddingHorizontal: 15,
    justifyContent: 'space-between',
  },
  menuButton: { marginRight: 15 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', flex: 1 },
  orientationButton: { padding: 8, zIndex: 10 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
    alignItems: 'center',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 10,
    borderRadius: 10,
  },
  dropdownText: { color: '#fff', fontSize: 16, marginRight: 5 },
  dropdownList: {
    backgroundColor: '#1F2937',
    marginTop: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  dropdownItem: { padding: 12 },
  dropdownItemText: { color: '#fff' },
  dateButton: {
    backgroundColor: '#1F2937',
    padding: 10,
    borderRadius: 10,
  },
  dateText: { color: '#fff' },
  chartTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginLeft: 10,
  },
  lastUpdated: {
    color: '#aaa',
    fontSize: 12,
    marginLeft: 10,
    marginBottom: 4,
  },
  alarmCard: {
    backgroundColor: '#1F2937',
    padding: 14,
    borderRadius: 10,
    marginVertical: 4,
    marginHorizontal: 10,
  },
  alarmTime: { color: '#9CA3AF', fontSize: 12 },
  alarmMessage: { color: '#fff', fontSize: 16 },
  machineTag: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  groupHeader: { color: '#10B981', fontSize: 14, marginLeft: 12, marginTop: 16 },
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
