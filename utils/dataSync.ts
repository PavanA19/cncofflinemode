// utils/dataSync.ts
import NetInfo from '@react-native-community/netinfo';
import { getMachineDataOffline, saveMachineDataOffline } from './machineDB';

const BASE_URL = 'https://indxoapp.onrender.com'; // ✅ Your API

export const fetchMachineDataSmart = async (machineName: string, selectedDate: string) => {
  const netInfo = await NetInfo.fetch();
  const isOnline = netInfo.isConnected && netInfo.isInternetReachable;

  if (isOnline) {
    try {
      const response = await fetch(
        `${BASE_URL}/machines?name=${encodeURIComponent(machineName)}&date=${selectedDate}`
      );
      const data = await response.json();

      if (data.length > 0) {
        const { name, date, spindle_speed, rest_time, power_consumption, status } = data[0];

        // ✅ Save to SQLite for offline use
        await saveMachineDataOffline(name, date, spindle_speed, rest_time, power_consumption, status);

        return {
          name,
          date,
          spindle_speed,
          rest_time,
          power_consumption,
          status,
          source: 'server'
        };
      }
    } catch (error) {
  if (error instanceof Error) {
    console.error('🔴 Server fetch failed. Falling back to local DB:', error.message);
  } else {
    console.error('🔴 Unknown error:', error);
  }
}

  }

  // ❌ Offline OR failed → use SQLite
  const localData = await getMachineDataOffline(machineName, selectedDate);
  return {
    ...localData,
    source: 'offline'
  };
};
