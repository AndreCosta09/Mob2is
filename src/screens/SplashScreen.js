import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions, Text } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const navigation = useNavigation();
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <LinearGradient colors={['#001F3F', '#003366']} style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      </View>
      <View style={styles.buttonContainer}>
        <View style={styles.fakeButton}>
            <Text style={styles.fakeButtonText}>Iniciar Rota</Text>
        </View>
      </View>
    </LinearGradient>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 50 },
  logoContainer: { flex: 1, justifyContent: 'center' },
  logo: { width: width * 0.6, height: width * 0.6 },
  buttonContainer: { width: '100%', paddingHorizontal: 40 },
  fakeButton: { backgroundColor: '#F18F01', padding: 15, borderRadius: 10, alignItems: 'center', elevation: 5 },
  fakeButtonText: { color: '#002E5D', fontWeight: 'bold', fontSize: 18 }
});