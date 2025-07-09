// // app/SignIn.tsx
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Stack, router } from 'expo-router';
// import React, { useEffect, useState } from 'react';
// import {
//     Alert,
//     Image,
//     ImageBackground,
//     Linking,
//     Platform,
//     StyleSheet,
//     Text,
//     TextInput,
//     TouchableOpacity,
//     View,
// } from 'react-native';
// import * as authDB from '../utils/authDB';

// const images = [
//   require('../assets/images/bg1.png'),
//   require('../assets/images/bg2.png'),
//   require('../assets/images/bg3.png'),
// ];

// const logo = require('../assets/images/Logo.png');
// const BASE_URL = 'https://indxoapp.onrender.com';

// export default function SignInScreen() {
//   const [imageIndex, setImageIndex] = useState(0);
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');

//   useEffect(() => {
//     authDB.setupAuthDB(); // Setup local DB
//     const interval = setInterval(() => {
//       setImageIndex((prev) => (prev + 1) % images.length);
//     }, 3000);
//     return () => clearInterval(interval);
//   }, []);

//   const handleSignIn = async () => {
//     if (!email.trim() || !password.trim()) {
//       Alert.alert('Missing Fields', 'Please enter both email and password.');
//       return;
//     }

//     try {
//       const response = await fetch(`${BASE_URL}/login`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password }),
//       });

//       const data = await response.json();

//       if (response.ok && data.success) {
//         await AsyncStorage.multiSet([
//           ['user_email', email],
//           ['user_password', password],
//           ['isLoggedIn', 'true'],
//         ]);
//         await authDB.saveUserToSQLite(email, password);
//         router.replace('/screens/dashboard');
//       } else {
//         Alert.alert('Login Failed', data.message || 'Invalid credentials');
//       }
//     } catch (err) {
//       console.error('Login error:', err);
//       Alert.alert('Error', 'Unable to connect to the server.');
//     }
//   };

//   return (
//     <>
//       <Stack.Screen options={{ headerShown: false }} />
//       <ImageBackground
//         source={images[imageIndex]}
//         style={styles.background}
//         resizeMode="cover"
//       >
//         <Image source={logo} style={styles.logo} resizeMode="contain" />
//         <View style={styles.overlay}>
//           <View style={styles.container}>
//             <Text style={styles.title}>Sign In</Text>
//             <Text style={styles.label}>Email</Text>
//             <TextInput
//               placeholder="example@gmail.com"
//               placeholderTextColor="#aaa"
//               style={styles.inputBox}
//               keyboardType="email-address"
//               autoCapitalize="none"
//               value={email}
//               onChangeText={setEmail}
//             />
//             <Text style={styles.label}>Password</Text>
//             <TextInput
//               placeholder="password"
//               placeholderTextColor="#aaa"
//               secureTextEntry
//               style={styles.inputBox}
//               value={password}
//               onChangeText={setPassword}
//             />
//             <TouchableOpacity>
//               <Text style={styles.forgot}>Forgot Password?</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.button} onPress={handleSignIn}>
//               <Text style={styles.buttonText}>Sign In</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//         <View style={styles.footerContainer}>
//           <Text style={styles.footerText}>© 2023 All Rights Reserved by indxo</Text>
//           <TouchableOpacity onPress={() => Linking.openURL('https://indxo.ai/')}>
//             <Text style={styles.websiteText}>
//               Official Website:{' '}
//               <Text style={{ color: '#00B0FF', textDecorationLine: 'underline' }}>
//                 https://indxo.ai/
//               </Text>
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </ImageBackground>
//     </>
//   );
// }

// const styles = StyleSheet.create({
//   background: { flex: 1 },
//   logo: {
//     position: 'absolute',
//     top: Platform.OS === 'web' ? 20 : 50,
//     left: 20,
//     width: 140,
//     height: 90,
//     zIndex: 20,
//   },
//   overlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.4)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   container: {
//     backgroundColor: 'rgba(255, 255, 255, 0.12)',
//     padding: 24,
//     borderRadius: 16,
//     width: '85%',
//     maxWidth: 450,
//   },
//   title: {
//     color: '#fff',
//     fontSize: 28,
//     fontWeight: 'bold',
//     textAlign: 'center',
//     marginBottom: 20,
//   },
//   label: { color: '#ddd', fontSize: 14, marginBottom: 6, marginTop: 10 },
//   inputBox: {
//     width: '100%',
//     backgroundColor: 'rgba(255,255,255,0.15)',
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderRadius: 10,
//     marginBottom: 10,
//     color: '#fff',
//     borderWidth: 1,
//     borderColor: '#999',
//   },
//   forgot: {
//     color: 'yellow',
//     fontSize: 14,
//     textAlign: 'right',
//     marginBottom: 20,
//   },
//   button: {
//     backgroundColor: 'rgba(224, 208, 208, 0.75)',
//     paddingVertical: 14,
//     borderRadius: 10,
//     alignItems: 'center',
//   },
//   buttonText: {
//     color: 'black',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   footerContainer: {
//     position: 'absolute',
//     bottom: Platform.OS === 'ios' ? 20 : 10,
//     alignSelf: 'center',
//     alignItems: 'center',
//   },
//   footerText: {
//     color: '#fff',
//     fontSize: 12,
//   },
//   websiteText: {
//     fontSize: 13,
//     marginTop: 2,
//     marginBottom: 50,
//     color: '#fff',
//   },
// });




import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Stack, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    ImageBackground,
    Linking,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import * as authDB from '../utils/authDB';

const images = [
  require('../assets/images/bg1.png'),
  require('../assets/images/bg2.png'),
  require('../assets/images/bg3.png'),
];

const logo = require('../assets/images/Logo.png');
const BASE_URL = 'https://indxoapp.onrender.com';

export default function SignInScreen() {
  const [imageIndex, setImageIndex] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // ✅ Auto redirect if already logged in
  useEffect(() => {
    const checkLoginStatus = async () => {
      const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
      if (isLoggedIn === 'true') {
        router.replace('/screens/dashboard');
      }
    };

    authDB.setupAuthDB(); // Initialize local DB
    checkLoginStatus();

    const interval = setInterval(() => {
      setImageIndex((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }

    const netState = await NetInfo.fetch();

    if (netState.isConnected) {
      console.log('🟢 Internet available: Attempting ONLINE login');

      try {
        const response = await fetch(`${BASE_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          console.log(`✅ Logged in ONLINE as ${email}`);
          await AsyncStorage.multiSet([
            ['user_email', email],
            ['user_password', password],
            ['isLoggedIn', 'true'],
          ]);

          await authDB.saveUserToSQLite(email, password);
          router.replace('/screens/dashboard');
        } else {
          Alert.alert('Login Failed', data.message || 'Invalid credentials');
        }
      } catch (err) {
        console.error('❌ Server request failed:', err);
        Alert.alert('Login Failed', 'Server error. Try again later.');
      }
    } else {
      console.log('🔴 No internet: Attempting OFFLINE login');

      try {
        const offlineUser = await authDB.getUserFromSQLite(email);
        if (offlineUser && offlineUser.password === password) {
          console.log(`✅ Logged in OFFLINE as ${email}`);
          await AsyncStorage.multiSet([
            ['user_email', email],
            ['user_password', password],
            ['isLoggedIn', 'true'],
          ]);

          Alert.alert('Offline Login', 'Logged in using saved credentials.');
          router.replace('/screens/dashboard');
        } else {
          Alert.alert('Login Failed', 'No saved credentials found or wrong password.');
        }
      } catch (err) {
        console.error('❌ Offline login error:', err);
        Alert.alert('Offline Error', 'Something went wrong offline.');
      }
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ImageBackground
        source={images[imageIndex]}
        style={styles.background}
        resizeMode="cover"
      >
        <Image source={logo} style={styles.logo} resizeMode="contain" />

        <View style={styles.overlay}>
          <View style={styles.container}>
            <Text style={styles.title}>Sign In</Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              placeholder="example@gmail.com"
              placeholderTextColor="#aaa"
              style={styles.inputBox}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              placeholder="password"
              placeholderTextColor="#aaa"
              secureTextEntry
              style={styles.inputBox}
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity>
              <Text style={styles.forgot}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleSignIn}>
              <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>© 2023 All Rights Reserved by indxo</Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://indxo.ai/')}>
            <Text style={styles.websiteText}>
              Official Website:{' '}
              <Text style={{ color: '#00B0FF', textDecorationLine: 'underline' }}>
                https://indxo.ai/
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  logo: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 50,
    left: 20,
    width: 140,
    height: 90,
    zIndex: 20,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    padding: 24,
    borderRadius: 16,
    width: '85%',
    maxWidth: 450,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: { color: '#ddd', fontSize: 14, marginBottom: 6, marginTop: 10 },
  inputBox: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 10,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#999',
  },
  forgot: {
    color: 'yellow',
    fontSize: 14,
    textAlign: 'right',
    marginBottom: 20,
  },
  button: {
    backgroundColor: 'rgba(224, 208, 208, 0.75)',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 20 : 10,
    alignSelf: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#fff',
    fontSize: 12,
  },
  websiteText: {
    fontSize: 13,
    marginTop: 2,
    marginBottom: 50,
    color: '#fff',
  },
});
