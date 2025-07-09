import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ProfileScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem('user_email');
        const storedPassword = await AsyncStorage.getItem('user_password');
        if (storedEmail) setEmail(storedEmail);
        if (storedPassword) setPassword(storedPassword);
      } catch (error) {
        console.log('Failed to load user credentials:', error);
      }
    };

    loadCredentials();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.profileBox}>
        <Image
          source={require('../../assets/images/profile_image.png')}
          style={styles.profileImage}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          editable={false}
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            secureTextEntry={!showPassword}
            value={password}
            editable={false}
            placeholderTextColor="#999"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={22}
              color="#555"
              style={styles.eyeIcon}
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBox: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 12,
    width: '85%',
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignSelf: 'center',
    marginBottom: 20,
  },
  label: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#334155',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginTop: 6,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeIcon: {
    marginLeft: 10,
  },
});
