// utils/alarmSync.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as Notifications from 'expo-notifications';

const API_URL = 'https://indxoapp.onrender.com/alarms/recent-critical';

export async function syncAlarms() {
  const isConnected = (await NetInfo.fetch()).isConnected;
  if (!isConnected) return;

  try {
    const res = await fetch(API_URL);
    const alarms = await res.json();

    if (Array.isArray(alarms) && alarms.length > 0) {
      for (const alarm of alarms) {
        await showAlarmNotification(alarm);
      }

      // Save alarms to AsyncStorage (as backup for offline use)
      const dateKey = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem(`offline_alarms_all_${dateKey}`, JSON.stringify(alarms));
    }
  } catch (err) {
    console.error('Alarm Sync Failed:', err);
  }
}

async function showAlarmNotification(alarm: any) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `🚨 ${alarm.alarm_type} - ${alarm.machine_name}`,
      body: alarm.message,
      sound: 'default',
    },
    trigger: null,
  });
}
