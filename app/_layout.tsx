// app/_layout.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Slot, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { syncAlarms } from '../utils/alarmSync';

export default function Layout() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Ask notification permission
    Notifications.requestPermissionsAsync();

    // Start alarm sync every 2 mins
    const interval = setInterval(() => {
      syncAlarms(); // ✅ Alarm check & notification
    }, 2 * 60 * 1000);

    return () => clearInterval(interval); // cleanup
  }, []);

  useEffect(() => {
    const checkLogin = async () => {
      const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
      if (isLoggedIn !== 'true') {
        router.replace('/SignIn');
      }
      setLoading(false);
    };

    checkLogin();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#00B0FF" />
      </View>
    );
  }

  return <Slot />;
}
