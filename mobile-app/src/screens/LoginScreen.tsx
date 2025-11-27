import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import storage from '../utils/storage';
import { STORAGE_KEYS } from '../config/constants';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [staffInfo, setStaffInfo] = useState<{ name: string; picture?: string } | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    loadRememberedEmail();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const loadRememberedEmail = async () => {
    const remembered = await storage.get<string>(STORAGE_KEYS.REMEMBER_EMAIL);
    if (remembered) {
      setEmail(remembered);
    }
  };

  const handleSendOTP = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.sendOTP(email);
      if (response.success) {
        setStaffInfo(response.staff || null);
        setStep('otp');
        setCountdown(60); // 60 seconds countdown
        await storage.set(STORAGE_KEYS.REMEMBER_EMAIL, email);
        Alert.alert('Success', response.message || 'OTP sent to your email');
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
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await login(email, otp);
      if (!response.success) {
        Alert.alert('Error', response.message || 'Invalid OTP');
      }
      // Navigation will happen automatically through AuthContext
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setOtp('');
    await handleSendOTP();
  };

  const handleBack = () => {
    setStep('email');
    setOtp('');
    setStaffInfo(null);
  };

  return (
    <LinearGradient colors={['#1e3a8a', '#3b82f6', '#60a5fa']} style={styles.container}>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>SN</Text>
            </View>
            <Text style={styles.title}>SN Travels</Text>
            <Text style={styles.subtitle}>Emirates ID Staff Portal</Text>
                  </View>

          {/* Form Card */}
          <View style={styles.card}>
            {step === 'email' ? (
              <>
                <Text style={styles.cardTitle}>Login with Email</Text>
                <Text style={styles.cardSubtitle}>
                  Enter your email to receive a one-time password
                </Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="your.email@sntravels.com"
                    placeholderTextColor="#9ca3af"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    editable={!loading}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleSendOTP}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.buttonText}>Send OTP</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                  <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>

                {staffInfo && (
                  <View style={styles.staffInfo}>
                    {staffInfo.picture && (
                      <Image source={{ uri: staffInfo.picture }} style={styles.staffPicture} />
                    )}
                    <Text style={styles.staffName}>{staffInfo.name}</Text>
                  </View>
                )}

                <Text style={styles.cardTitle}>Enter OTP</Text>
                <Text style={styles.cardSubtitle}>
                  We've sent a 6-digit code to {'\n'}
                  <Text style={styles.emailText}>{email}</Text>
                </Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>OTP Code</Text>
                <TextInput
                    style={[styles.input, styles.otpInput]}
                  placeholder="000000"
                    placeholderTextColor="#9ca3af"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                    editable={!loading}
                />
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleVerifyOTP}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.buttonText}>Verify & Login</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.resendContainer}>
                  {countdown > 0 ? (
                    <Text style={styles.resendText}>Resend OTP in {countdown}s</Text>
                  ) : (
                    <TouchableOpacity onPress={handleResendOTP} disabled={loading}>
                      <Text style={styles.resendLink}>Resend OTP</Text>
                </TouchableOpacity>
                  )}
              </View>
              </>
            )}
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            For authorized staff only{'\n'}© 2024 SN Travels
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
      </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#e0e7ff',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
  staffInfo: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
  },
  staffPicture: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 12,
  },
  staffName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  emailText: {
    fontWeight: '600',
    color: '#2563eb',
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    color: '#6b7280',
    fontSize: 14,
  },
  resendLink: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    color: '#e0e7ff',
    fontSize: 12,
    marginTop: 32,
    lineHeight: 20,
  },
});
