import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import storage from '../utils/storage';
import { STORAGE_KEYS } from '../config/api';

const LoginScreen: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const { sendOTP, verifyOTP, refreshUser } = useAuth();
  
  // Development bypass
  const DEV_PHONE = '501234567'; // Test phone without country code
  const DEV_OTP = '123456';

  const handleSendOTP = async () => {
    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    // Validate phone number (should be 9 digits after +971)
    if (phone.length < 9) {
      Alert.alert('Error', 'Please enter a valid UAE phone number');
      return;
    }

    setLoading(true);
    try {
      // Development bypass
      if (phone === DEV_PHONE) {
        setStep('otp');
        Alert.alert('Development Mode', 'Use OTP: 123456');
        setLoading(false);
        return;
      }

      // For production, send OTP via API
      const fullPhone = `+971${phone}`;
      const response = await sendOTP(fullPhone);
      if (response.success) {
        setStep('otp');
        Alert.alert('Success', 'OTP sent to your phone');
      } else {
        Alert.alert('Error', response.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      // Development bypass
      if (phone === DEV_PHONE && otp === DEV_OTP) {
        // Create mock user data for development (Customer ID: 558)
        const mockUser = {
          staff_id: 558,
          name: 'Test Customer',
          email: 'test@sntrips.com',
          customer_id: 558,
        };
        const mockToken = 'dev_token_' + Date.now();
        
        await storage.set(STORAGE_KEYS.token, mockToken);
        await storage.set(STORAGE_KEYS.user, mockUser);
        
        // Refresh auth context
        await refreshUser();
        
        setLoading(false);
        return;
      }

      // For production, verify OTP via API
      const fullPhone = `+971${phone}`;
      const response = await verifyOTP(fullPhone, otp);
      if (!response.success) {
        Alert.alert('Error', response.message || 'Invalid OTP');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={styles.title}>SNT Customer App</Text>
            <Text style={styles.subtitle}>Welcome Back</Text>

            {step === 'phone' ? (
              <View style={styles.form}>
                <View style={styles.phoneContainer}>
                  <View style={styles.countryCode}>
                    <Text style={styles.countryCodeText}>🇦🇪 +971</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="50 123 4567"
                    placeholderTextColor="#999"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    maxLength={9}
                  />
                </View>
                <Text style={styles.helperText}>
                  Enter your UAE mobile number
                </Text>
                <Text style={styles.devNote}>
                  💡 Dev: Use 501234567 with OTP 123456
                </Text>
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleSendOTP}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Send OTP</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.form}>
                <Text style={styles.otpLabel}>
                  Enter the 6-digit OTP sent to +971{phone}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="000000"
                  placeholderTextColor="#999"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleVerifyOTP}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Verify OTP</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    setStep('phone');
                    setOtp('');
                  }}
                >
                  <Text style={styles.backButtonText}>Change Phone Number</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  form: {
    width: '100%',
  },
  phoneContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  countryCode: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 10,
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  devNote: {
    fontSize: 11,
    color: '#10b981',
    marginBottom: 15,
    textAlign: 'center',
    fontStyle: 'italic',
    backgroundColor: '#f0fdf4',
    padding: 8,
    borderRadius: 8,
  },
  otpLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#667eea',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#667eea',
    fontSize: 16,
  },
});

export default LoginScreen;

