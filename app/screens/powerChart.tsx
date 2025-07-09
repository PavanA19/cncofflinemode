

// import { Ionicons } from '@expo/vector-icons';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import NetInfo from '@react-native-community/netinfo';
// import * as ScreenOrientation from 'expo-screen-orientation';
// import React, { useEffect, useState } from 'react';
// import {
//     Alert,
//     Dimensions,
//     Platform,
//     Pressable,
//     RefreshControl,
//     SafeAreaView,
//     ScrollView,
//     StyleSheet,
//     Text,
//     ToastAndroid,
//     TouchableOpacity,
//     View,
// } from 'react-native';
// import { LineChart } from 'react-native-chart-kit';
// import { AnimatedCircularProgress } from 'react-native-circular-progress';
// import RNHTMLtoPDF from 'react-native-html-to-pdf';
// import CustomDrawer from '../../components/CustomDrawer';
// import {
//     getPowerLogsFromSQLite,
//     savePowerLogsToSQLite,
//     setupPowerTable,
// } from '../../utils/powerDB';

// const screenWidth = Dimensions.get('window').width;
// const screenHeight = Dimensions.get('window').height;
// const API_URL = 'https://indxoapp.onrender.com/power-data';
// const machineList = ['Machine 01', 'Machine 02', 'Machine 03'];

// export default function PowerChart() {
//   const [selectedMachine, setSelectedMachine] = useState('Machine 01');
//   const [date, setDate] = useState(new Date());
//   const [showPicker, setShowPicker] = useState(false);
//   const [powerData, setPowerData] = useState<any[]>([]);
//   const [drawerOpen, setDrawerOpen] = useState(false);
//   const [dropdownVisible, setDropdownVisible] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);
//   const [landscape, setLandscape] = useState(false);
//   const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
//   const [dataSource, setDataSource] = useState<'online' | 'offline (AsyncStorage)' | 'offline (SQLite)'>('offline (SQLite)');

//   const toggleDrawer = () => setDrawerOpen(!drawerOpen);
//   const closeDrawer = () => setDrawerOpen(false);

//   const averagePower = () => {
//     if (powerData.length === 0) return 0;
//     const sum = powerData.reduce((acc, item) => acc + item.power_value, 0);
//     return +(sum / powerData.length).toFixed(2);
//   };

//   const fetchPowerData = async () => {
//     const formattedDate = date.toISOString().split('T')[0];
//     const cacheKey = `power_${selectedMachine}_${formattedDate}`;
//     const net = await NetInfo.fetch();
//     const isConnected = net.isConnected && net.isInternetReachable;

//     if (isConnected) {
//       try {
//         const res = await fetch(`${API_URL}?machine=${selectedMachine}&date=${formattedDate}`);
//         const data = await res.json();
//         setPowerData(data);
//         setLastUpdated(new Date());
//         setDataSource('online');
//         await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
//         savePowerLogsToSQLite(data);
//       } catch (err) {
//         console.error('Error fetching power data:', err);
//         showOfflineFallback();
//       }
//     } else {
//       showOfflineFallback();
//     }

//     async function showOfflineFallback() {
//       try {
//         const cached = await AsyncStorage.getItem(cacheKey);
//         if (cached) {
//           setPowerData(JSON.parse(cached));
//           setDataSource('offline (AsyncStorage)');
//           ToastAndroid.show('📴 Showing offline data (cache)', ToastAndroid.SHORT);
//         } else {
//           getPowerLogsFromSQLite(selectedMachine, formattedDate, (results) => {
//             if (results.length > 0) {
//               setPowerData(results);
//               setDataSource('offline (SQLite)');
//               ToastAndroid.show('📴 Showing offline data (SQLite)', ToastAndroid.SHORT);
//             } else {
//               setPowerData([]);
//               ToastAndroid.show('⚠️ No offline data found', ToastAndroid.SHORT);
//             }
//           });
//         }
//       } catch (error) {
//         console.error('❌ Offline fallback failed:', error);
//         setPowerData([]);
//       }
//     }
//   };

//   useEffect(() => {
//     setupPowerTable();
//     fetchPowerData();
//   }, [selectedMachine, date]);

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await fetchPowerData();
//     setRefreshing(false);
//   };

//   const timeLabels = powerData.map((item) => {
//     const date = new Date(item.timestamp);
//     return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
//   });

//   const powerValues = powerData.map((item) => item.power_value);

//   const toggleOrientation = async () => {
//     const orientation = landscape
//       ? ScreenOrientation.OrientationLock.PORTRAIT_UP
//       : ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT;
//     await ScreenOrientation.lockAsync(orientation);
//     setLandscape(!landscape);
//   };

//   const generatePDF = async () => {
//     if (powerData.length === 0) {
//       Alert.alert('No Data', 'There is no data to generate PDF');
//       return;
//     }

//     const rows = powerData
//       .map(
//         (d) =>
//           `<tr><td>${selectedMachine}</td><td>${new Date(d.timestamp).toLocaleString()}</td><td>${d.power_value}</td></tr>`
//       )
//       .join('');

//     const html = `
//       <h1>Power Report - ${selectedMachine}</h1>
//       <table border="1" style="width: 100%; border-collapse: collapse;">
//         <tr><th>Machine</th><th>Timestamp</th><th>Power (kW)</th></tr>
//         ${rows}
//       </table>
//     `;

//     const filename = `${selectedMachine.replace(/\s+/g, '_')}_power_${Date.now()}`;
//     try {
//       const pdf = await RNHTMLtoPDF.convert({
//         html,
//         fileName: filename,
//         directory: 'Download',
//         base64: false,
//       });
//       Alert.alert('✅ PDF Saved', `Saved to:\n${pdf.filePath}`);
//     } catch (err) {
//       Alert.alert('❌ Error', 'Failed to generate PDF');
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.headerWithMenu}>
//         <TouchableOpacity onPress={toggleDrawer} style={styles.menuButton}>
//           <Ionicons name="menu" size={28} color="#fff" />
//         </TouchableOpacity>
//         <Text style={styles.title}>🔌 Power Chart</Text>
//         <TouchableOpacity onPress={toggleOrientation} style={styles.orientationButton}>
//           <Ionicons name="phone-portrait-outline" size={22} color="#fff" />
//         </TouchableOpacity>
//       </View>

//       <ScrollView
//         contentContainerStyle={{ paddingBottom: 40 }}
//         refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00e0ff" />}
//       >
//         {/* Filters */}
//         <View style={styles.filterRow}>
//           <View style={{ flex: 1 }}>
//             <TouchableOpacity style={styles.dropdownButton} onPress={() => setDropdownVisible(!dropdownVisible)}>
//               <Text style={styles.dropdownText}>{selectedMachine}</Text>
//               <Ionicons name="chevron-down" color="#fff" size={18} style={{ marginLeft: 15 }} />
//             </TouchableOpacity>
//             {dropdownVisible && (
//               <View style={styles.dropdownList}>
//                 {machineList.map((machine) => (
//                   <TouchableOpacity
//                     key={machine}
//                     style={styles.dropdownItem}
//                     onPress={() => {
//                       setSelectedMachine(machine);
//                       setDropdownVisible(false);
//                     }}
//                   >
//                     <Text style={styles.dropdownItemText}>{machine}</Text>
//                   </TouchableOpacity>
//                 ))}
//               </View>
//             )}
//           </View>

//           <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.dateButton}>
//             <Text style={styles.dateText}>{date.toDateString()}</Text>
//           </TouchableOpacity>
//         </View>

//         {showPicker && (
//           <DateTimePicker
//             value={date}
//             mode="date"
//             display={Platform.OS === 'ios' ? 'spinner' : 'default'}
//             onChange={(_, selectedDate) => {
//               setShowPicker(false);
//               if (selectedDate) setDate(selectedDate);
//             }}
//           />
//         )}

//         {/* Circular Chart */}
//         <View style={styles.utilizationContainer}>
//           <AnimatedCircularProgress
//             size={120}
//             width={12}
//             fill={Math.min((averagePower() / 5) * 100, 100)}
//             tintColor="#00e0ff"
//             backgroundColor="#3d5875"
//           >
//             {(fill: number) => (
//               <Text style={styles.circularText}>{averagePower()} kW</Text>
//             )}
//           </AnimatedCircularProgress>
//           <Text style={styles.utilizationLabel}>Avg Power Usage</Text>
//         </View>

//         {/* Line Chart */}
//         <Text style={styles.chartTitle}>Power Consumption Over Time</Text>
//         {powerData.length > 0 ? (
//           <LineChart
//             data={{
//               labels: timeLabels,
//               datasets: [{ data: powerValues, color: () => '#10B981', strokeWidth: 2 }],
//             }}
//             width={(landscape ? screenHeight : screenWidth) - 40}
//             height={250}
//             chartConfig={{
//               backgroundColor: '#1F2937',
//               backgroundGradientFrom: '#1F2937',
//               backgroundGradientTo: '#111827',
//               color: () => '#fff',
//               labelColor: () => '#9CA3AF',
//               decimalPlaces: 2,
//               propsForLabels: {
//                 fontSize: 10,
//                 rotation: 45,
//               },
//               propsForDots: {
//                 r: '3',
//                 strokeWidth: '1',
//                 stroke: '#10B981',
//               },
//             }}
//             withInnerLines
//             withOuterLines
//             verticalLabelRotation={60}
//             bezier
//             style={{
//               borderRadius: 16,
//               marginHorizontal: 20,
//               paddingBottom: 20,
//               paddingTop: 10,
//             }}
//           />
//         ) : (
//           <Text style={{ color: '#aaa', textAlign: 'center', marginTop: 20 }}>
//             No data available
//           </Text>
//         )}

//         {/* Meta Info */}
//         <Text style={styles.metaText}>📡 Data Source: <Text style={{ color: '#10B981' }}>{dataSource}</Text></Text>
//         {lastUpdated && (
//           <Text style={styles.metaText}>⏱️ Last Updated: {lastUpdated.toLocaleTimeString()}</Text>
//         )}

//         {/* PDF Button */}
//         <TouchableOpacity onPress={generatePDF} style={styles.downloadBtn}>
//           <Text style={styles.downloadText}>⬇ Download PDF</Text>
//         </TouchableOpacity>
//       </ScrollView>

//       {drawerOpen && (
//         <Pressable style={styles.drawerOverlay} onPress={closeDrawer}>
//           <CustomDrawer onClose={closeDrawer} />
//         </Pressable>
//       )}
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#0D0D0D' },
//   headerWithMenu: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingTop: Platform.OS === 'android' ? 50 : 60,
//     paddingBottom: 20,
//     paddingHorizontal: 15,
//   },
//   menuButton: { marginRight: 15 },
//   title: { color: '#fff', fontSize: 22, fontWeight: 'bold', flex: 1 },
//   orientationButton: { padding: 10, marginRight: 8 },
//   filterRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     gap: 10,
//     marginBottom: 16,
//   },
//   dropdownButton: {
//     backgroundColor: '#1F2937',
//     borderRadius: 10,
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   dropdownText: { color: '#fff', fontSize: 16 },
//   dropdownList: {
//     backgroundColor: '#1F2937',
//     borderRadius: 10,
//     marginTop: 6,
//     overflow: 'hidden',
//   },
//   dropdownItem: { paddingVertical: 12, paddingHorizontal: 16 },
//   dropdownItemText: { color: '#fff', fontSize: 16 },
//   dateButton: {
//     backgroundColor: '#1F2937',
//     borderRadius: 10,
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   dateText: { color: '#fff', fontSize: 16 },
//   utilizationContainer: {
//     alignItems: 'center',
//     marginBottom: 30,
//   },
//   circularText: {
//     color: '#fff',
//     fontSize: 20,
//     fontWeight: 'bold',
//   },
//   utilizationLabel: {
//     color: '#9CA3AF',
//     fontSize: 14,
//     marginTop: 8,
//   },
//   chartTitle: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginBottom: 10,
//     marginLeft: 20,
//   },
//   downloadBtn: {
//     backgroundColor: '#2563eb',
//     padding: 14,
//     alignItems: 'center',
//     margin: 10,
//     borderRadius: 8,
//   },
//   downloadText: {
//     color: '#fff',
//     fontWeight: 'bold',
//   },
//   drawerOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     width: '100%',
//     height: '100%',
//     backgroundColor: 'rgba(0,0,0,0.3)',
//     zIndex: 999,
//   },
//   metaText: {
//     color: '#aaa',
//     fontSize: 12,
//     marginHorizontal: 20,
//     marginBottom: 4,
//     textAlign: 'center',
//   },
// });


import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import NetInfo from '@react-native-community/netinfo';
import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useEffect, useState } from 'react';
import {
    Alert, Dimensions, Platform, Pressable, RefreshControl,
    SafeAreaView, ScrollView, StyleSheet, Text, ToastAndroid,
    TouchableOpacity, View
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import CustomDrawer from '../../components/CustomDrawer';

const screenWidth = Dimensions.get('window').width;
const API_URL = 'https://indxoapp.onrender.com/power-data';
const machineList = ['Machine 01', 'Machine 02', 'Machine 03'];

export default function PowerChart() {
  const [selectedMachine, setSelectedMachine] = useState('Machine 01');
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [powerData, setPowerData] = useState<any[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [landscape, setLandscape] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dataSource, setDataSource] = useState<'online' | 'offline'>('offline');

  const toggleDrawer = () => setDrawerOpen(!drawerOpen);
  const closeDrawer = () => setDrawerOpen(false);

  const averagePower = () => {
    if (powerData.length === 0) return 0;
    const sum = powerData.reduce((acc, item) => acc + item.power_value, 0);
    return +(sum / powerData.length).toFixed(2);
  };

  const getStorageKey = (machine: string, date: string) => {
    return `power_logs_${machine}_${date}`;
  };

  const fetchPowerData = async () => {
    const formattedDate = date.toISOString().split('T')[0];
    const net = await NetInfo.fetch();
    const isConnected = net.isConnected && net.isInternetReachable;

    if (isConnected) {
      try {
        const res = await fetch(`${API_URL}?machine=${selectedMachine}&date=${formattedDate}`);
        const data = await res.json();
        const logsWithMachine = data.map((item: any) => ({
          ...item,
          machine: selectedMachine,
        }));

        setPowerData(logsWithMachine);
        setLastUpdated(new Date());
        setDataSource('online');

        await AsyncStorage.setItem(getStorageKey(selectedMachine, formattedDate), JSON.stringify(logsWithMachine));
      } catch (err) {
        showOfflineFallback();
      }
    } else {
      showOfflineFallback();
    }

    async function showOfflineFallback() {
      const key = getStorageKey(selectedMachine, formattedDate);
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPowerData(parsed);
        setDataSource('offline');
        ToastAndroid.show('📴 Loaded offline data', ToastAndroid.SHORT);
      } else {
        setPowerData([]);
        ToastAndroid.show('❌ No offline data found', ToastAndroid.SHORT);
      }
    }
  };

  useEffect(() => {
    let previousConnection: boolean | null = null;

    const fetchInitialData = async () => {
      await fetchPowerData();
    };

    fetchInitialData();

    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      if (isConnected !== previousConnection) {
        previousConnection = isConnected;
        fetchPowerData();
      }
    });

    return () => unsubscribe();
  }, [selectedMachine, date]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPowerData();
    setRefreshing(false);
  };

  const toggleOrientation = async () => {
    const orientation = landscape
      ? ScreenOrientation.OrientationLock.PORTRAIT_UP
      : ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT;
    await ScreenOrientation.lockAsync(orientation);
    setLandscape(!landscape);
  };

  const generatePDF = async () => {
    if (powerData.length === 0) {
      Alert.alert('No Data', 'There is no data to generate PDF');
      return;
    }

    const rows = powerData.map((d) =>
      `<tr><td>${selectedMachine}</td><td>${new Date(d.timestamp).toLocaleString()}</td><td>${d.power_value}</td></tr>`
    ).join('');

    const html = `
      <h1>Power Report - ${selectedMachine}</h1>
      <table border="1" style="width: 100%; border-collapse: collapse;">
        <tr><th>Machine</th><th>Timestamp</th><th>Power (kW)</th></tr>
        ${rows}
      </table>`;

    try {
      const pdf = await RNHTMLtoPDF.convert({
        html,
        fileName: `${selectedMachine.replace(/\s+/g, '_')}_power_${Date.now()}`,
        directory: 'Download',
        base64: false,
      });
      Alert.alert('✅ PDF Saved', `Saved to Downloads:\n${pdf.filePath}`);
    } catch (err) {
      Alert.alert('❌ Error', 'Failed to generate PDF');
    }
  };

  const timeLabels = powerData.map((item, index) => {
    const date = new Date(item.timestamp);
    return index % 10 === 0 ? `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}` : '';
  });

  const powerValues = powerData.map((item) => item.power_value);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerWithMenu}>
        <TouchableOpacity onPress={toggleDrawer}>
          <Ionicons name="menu" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>🔌 Power Chart</Text>
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

        <View style={styles.utilizationContainer}>
          <AnimatedCircularProgress
            size={120}
            width={12}
            fill={Math.min((averagePower() / 10) * 100, 100)}
            tintColor="#00e0ff"
            backgroundColor="#3d5875"
          >
            {() => <Text style={styles.circularText}>{averagePower()} kW</Text>}
          </AnimatedCircularProgress>
          <Text style={styles.utilizationLabel}>Avg Power Usage</Text>
        </View>

        <Text style={styles.chartTitle}>Power Consumption Over Time</Text>
        {powerData.length > 0 ? (
          <ScrollView horizontal>
            <LineChart
              data={{ labels: timeLabels, datasets: [{ data: powerValues }] }}
              width={powerValues.length * 20}
              height={250}
              chartConfig={{
                backgroundColor: '#1F2937',
                backgroundGradientFrom: '#1F2937',
                backgroundGradientTo: '#111827',
                color: () => '#10B981',
                labelColor: () => '#ccc',
                decimalPlaces: 2,
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

        <Text style={styles.metaText}>📡 Data Source: <Text style={{ color: '#22c55e' }}>{dataSource}</Text></Text>
        {lastUpdated && (
          <Text style={styles.metaText}>⏱️ Last Updated: {lastUpdated.toLocaleTimeString()}</Text>
        )}

        <TouchableOpacity onPress={generatePDF} style={styles.downloadBtn}>
          <Text style={styles.downloadText}>⬇ Download PDF</Text>
        </TouchableOpacity>
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
  utilizationContainer: { alignItems: 'center', marginBottom: 30 },
  circularText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  utilizationLabel: { color: '#ccc', marginTop: 6 },
  chartTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 20, marginBottom: 10 },
  downloadBtn: {
    backgroundColor: '#2563eb', padding: 14, alignItems: 'center', marginHorizontal: 20,
    marginTop: 20, borderRadius: 8,
  },
  downloadText: { color: '#fff', fontWeight: 'bold' },
  metaText: { color: '#aaa', textAlign: 'center', marginTop: 6 },
  drawerOverlay: {
    position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 1000,
  },
});
