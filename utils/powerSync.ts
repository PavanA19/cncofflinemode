import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { savePowerLogsToSQLite } from './powerDB';

const API_URL = 'https://indxoapp.onrender.com/power-data';

export const syncPowerLogs = async (
  machine: string,
  date: string
): Promise<any[] | null> => {
  const net = await NetInfo.fetch();

  if (!net.isConnected || !net.isInternetReachable) {
    console.log('📴 Offline: falling back to local');
    return null;
  }

  try {
    const res = await fetch(`${API_URL}?machine=${machine}&date=${date}`);
    const data = await res.json();

    if (Array.isArray(data)) {
      await savePowerLogsToSQLite(data);
      await AsyncStorage.setItem(`power_${machine}_${date}`, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.error('❌ Sync failed:', err);
  }

  return null;
};
