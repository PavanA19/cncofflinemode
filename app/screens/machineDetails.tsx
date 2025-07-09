// MachineDetails.tsx
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as MediaLibrary from 'expo-media-library';
import * as Print from 'expo-print';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import CustomDrawer from '../../components/CustomDrawer';
import { useTheme } from '../../context/ThemeContext';

const API_URL = 'https://cncofflinemode.onrender.com/machines';
const machineList = ['Machine 01', 'Machine 02', 'Machine 03'];

export default function MachineDetails() {
  const { theme } = useTheme();
  const [machine, setMachine] = useState('Machine 01');
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = () => setDrawerOpen(!drawerOpen);
  const closeDrawer = () => setDrawerOpen(false);

  const fetchData = async () => {
    const from = fromDate.toISOString().split('T')[0];
    const to = toDate.toISOString().split('T')[0];
    try {
      const res = await fetch(`${API_URL}/range?name=${machine}&from=${from}&to=${to}`);
      const json = await res.json();
      setData(json || []);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch data');
    }
  };

  useEffect(() => {
    fetchData();
  }, [machine, fromDate, toDate]);

  const generatePDF = async () => {
    if (data.length === 0) {
      Alert.alert('No Data', 'There is no data to generate PDF');
      return;
    }

    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Storage permission is required to save the PDF.');
      return;
    }

    const rows = data.map((d) => `
      <tr>
        <td>${d.name}</td>
        <td>${new Date(d.date).toLocaleDateString()}</td>
        <td>${d.spindle_speed}</td>
        <td>${d.power_consumption}</td>
        <td>${d.rest_time}</td>
        <td>${d.status}</td>
      </tr>
    `).join('');

    const html = `
      <h1 style="text-align:center;">Machine Report - ${machine}</h1>
      <table border="1" style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <tr>
          <th>Name</th>
          <th>Date</th>
          <th>Spindle Speed</th>
          <th>Power</th>
          <th>Rest Time</th>
          <th>Status</th>
        </tr>
        ${rows}
      </table>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('Download', asset, false);
      Alert.alert('✅ PDF Saved', 'The report was saved to your Downloads folder.');
    } catch (err) {
      console.error(err);
      Alert.alert('❌ Error', 'Failed to generate PDF');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#0D0D0D' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleDrawer} style={styles.menuButton}>
          <Ionicons name="menu" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Machine Details</Text>
      </View>

      {/* Machine Selector */}
      <View style={styles.machineRow}>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setDropdownVisible(!dropdownVisible)}
        >
          <View style={styles.dropdownContent}>
            <Text style={styles.dropdownText}>{machine}</Text>
            <Ionicons name="chevron-down" color="#fff" size={18} />
          </View>
        </TouchableOpacity>
        {dropdownVisible && (
          <View style={styles.dropdownList}>
            {machineList.map(m => (
              <TouchableOpacity
                key={m}
                style={styles.dropdownItem}
                onPress={() => {
                  setMachine(m);
                  setDropdownVisible(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Date Selectors */}
      <View style={styles.dateRow}>
        <TouchableOpacity onPress={() => setShowFromPicker(true)} style={styles.dateBtn}>
          <Text style={styles.dateText}>From: {fromDate.toDateString()}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowToPicker(true)} style={styles.dateBtn}>
          <Text style={styles.dateText}>To: {toDate.toDateString()}</Text>
        </TouchableOpacity>
      </View>

      {showFromPicker && (
        <DateTimePicker
          value={fromDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, selectedDate) => {
            setShowFromPicker(false);
            if (selectedDate) setFromDate(selectedDate);
          }}
        />
      )}
      {showToPicker && (
        <DateTimePicker
          value={toDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, selectedDate) => {
            setShowToPicker(false);
            if (selectedDate) setToDate(selectedDate);
          }}
        />
      )}

      {/* Table */}
      <ScrollView style={styles.tableScroll}>
        <View style={styles.tableHeader}>
          {['Name', 'Date', 'Spindle', 'Power', 'Rest', 'Status'].map((h, i) => (
            <Text key={i} style={styles.tableHeaderText}>{h}</Text>
          ))}
        </View>
        {data.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.tableCell}>{item.name}</Text>
            <Text style={styles.tableCell}>{new Date(item.date).toLocaleDateString()}</Text>
            <Text style={styles.tableCell}>{item.spindle_speed}</Text>
            <Text style={styles.tableCell}>{item.power_consumption}</Text>
            <Text style={styles.tableCell}>{item.rest_time}</Text>
            <Text style={styles.tableCell}>{item.status}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Download PDF */}
      <TouchableOpacity onPress={generatePDF} style={styles.downloadBtn}>
        <Text style={styles.downloadText}>⬇ Download PDF</Text>
      </TouchableOpacity>

      {/* Drawer */}
      {drawerOpen && (
        <Pressable style={styles.drawerOverlay} onPress={closeDrawer}>
          <CustomDrawer onClose={closeDrawer} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  menuButton: { marginRight: 15 },
  headerText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },

  machineRow: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 10,
  },

  dropdownButton: {
    backgroundColor: '#1F2937',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: { color: '#fff', fontSize: 16 },
  dropdownList: {
    marginTop: 4,
    backgroundColor: '#1F2937',
    borderRadius: 10,
    zIndex: 1000,
    elevation: 5,
  },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 16 },
  dropdownItemText: { color: '#fff', fontSize: 16 },

  dateBtn: {
    backgroundColor: '#1F2937',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  dateText: { color: '#fff', fontSize: 14 },

  tableScroll: {
    flex: 1,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#222',
    padding: 8,
    borderBottomWidth: 1,
    borderColor: '#444',
  },
  tableHeaderText: {
    flex: 1,
    color: '#00e0ff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderColor: '#333',
  },
  tableCell: {
    flex: 1,
    color: '#fff',
    fontSize: 12,
  },
  downloadBtn: {
    backgroundColor: '#2563eb',
    padding: 14,
    alignItems: 'center',
    margin: 10,
    borderRadius: 8,
    marginBottom: 50,
  },
  downloadText: {
    color: '#fff',
    fontWeight: 'bold',
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
