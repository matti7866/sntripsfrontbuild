import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { API_CONFIG } from '../config/api';
import { STORAGE_KEYS } from '../config/constants';
import { authService } from '../services/authService';
import storage from '../utils/storage';

const BACKGROUND_IMAGE = 'https://unsplash.com/photos/Fr6zexbmjmc/download?force=true&w=1600';
const API_ORIGIN = API_CONFIG.BASE_URL.replace(/\/api\/?$/, '');

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [staffInfo, setStaffInfo] = useState<{ name: string; picture?: string } | null>(null);
  const [countdown, setCountdown] = useState(0);

  const otpRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    loadRememberedEmail();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (step === 'otp') {
      const timer = setTimeout(() => otpRefs.current[0]?.focus(), 120);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const loadRememberedEmail = async () => {
    const remembered = await storage.get<string>(STORAGE_KEYS.REMEMBER_EMAIL);
    if (remembered) setEmail(remembered);
  };

  const maskEmail = (value: string) => {
    const [name, domain] = value.split('@');
    if (!name || !domain) return value;
    if (name.length <= 2) return `${name[0]}*@${domain}`;
    return `${name.slice(0, 2)}${'*'.repeat(Math.max(2, name.length - 2))}@${domain}`;
  };

  const normalizeImageUrl = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith('https://')) return url;
    if (url.startsWith('http://')) return url.replace('http://', 'https://');
    if (url.startsWith('//')) return `https:${url}`;
    if (url.startsWith('/')) return `${API_ORIGIN}${url}`;
    return `${API_ORIGIN}/${url}`;
  };

  const verifyOtpCode = async (code: string) => {
    if (loading) return;
    if (!code || code.length !== 6) return;

    setLoading(true);
    try {
      const response = await login(email, code);
      if (!response.success) {
        setOtp(['', '', '', '', '', '']);
        otpRefs.current[0]?.focus();
        Alert.alert('Error', response.message || 'Invalid OTP');
      }
    } catch (error: any) {
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
      Alert.alert('Error', error.message || 'Login failed');
    } finally {
      setLoading(false);
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
        setCountdown(60);
        setOtp(['', '', '', '', '', '']);
        await storage.set(STORAGE_KEYS.REMEMBER_EMAIL, email);
        Alert.alert('Success', response.message || 'OTP sent successfully');
      } else {
        Alert.alert('Error', response.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);

    const updated = [...otp];
    updated[index] = digit;
    setOtp(updated);

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (!digit && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }

    const code = updated.join('');
    if (code.length === 6 && !updated.includes('')) {
      void verifyOtpCode(code);
    }
  };

  const handleOtpKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOTP = async () => {
    setOtp(['', '', '', '', '', '']);
    await handleSendOTP();
  };

  const handleBack = () => {
    setStep('email');
    setOtp(['', '', '', '', '', '']);
    setStaffInfo(null);
  };

  return (
    <ImageBackground source={{ uri: BACKGROUND_IMAGE }} resizeMode="cover" style={styles.backgroundImage}>
      <LinearGradient colors={['rgba(208,0,0,0.16)', 'rgba(0,0,0,0.45)']} style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            <View style={styles.card}>
              <View style={styles.logoShell}>
                <Image source={require('../../assets/logo-white.png')} style={styles.logoImage} resizeMode="contain" />
              </View>

              {step === 'otp' && (
                <View style={styles.staffWrap}>
                  {normalizeImageUrl(staffInfo?.picture) ? (
                    <Image
                      source={{ uri: normalizeImageUrl(staffInfo?.picture) }}
                      style={styles.staffPicture}
                      onError={() => setStaffInfo((prev) => (prev ? { ...prev, picture: undefined } : prev))}
                    />
                  ) : (
                    <View style={styles.staffFallback}><Text style={styles.staffFallbackText}>{staffInfo?.name?.charAt(0) || 'U'}</Text></View>
                  )}
                  {staffInfo?.name ? <Text style={styles.staffName}>{staffInfo.name}</Text> : null}
                </View>
              )}

              <Text style={styles.cardTitle}>{step === 'email' ? 'Sign in with OTP' : 'Enter verification code'}</Text>
              <Text style={styles.cardSubtitle}>
                {step === 'email' ? 'Use your company email to receive one-time code.' : `Code sent to ${maskEmail(email)}`}
              </Text>

              {step === 'email' ? (
                <>
                  <Text style={styles.label}>Company Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="you@selabnadiry.com"
                    placeholderTextColor="#8f8f8f"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    editable={!loading}
                  />

                  <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSendOTP} disabled={loading}>
                    {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Send OTP</Text>}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.otpRow}>
                    {otp.map((value, index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => {
                          otpRefs.current[index] = ref;
                        }}
                        value={value}
                        onChangeText={(text) => handleOtpChange(index, text)}
                        onKeyPress={({ nativeEvent }) => handleOtpKeyPress(index, nativeEvent.key)}
                        keyboardType="number-pad"
                        maxLength={1}
                        style={styles.otpInput}
                        editable={!loading}
                      />
                    ))}
                  </View>

                  {loading ? (
                    <View style={styles.verifyingWrap}>
                      <ActivityIndicator color="#d00000" size="small" />
                      <Text style={styles.verifyingText}>Verifying code...</Text>
                    </View>
                  ) : null}

                  <TouchableOpacity style={styles.ghostButton} onPress={handleBack} disabled={loading}>
                    <Text style={styles.ghostButtonText}>Back</Text>
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

              <Text style={styles.footer}>&copy; {new Date().getFullYear()} Selab Nadiry Travel & Tourism</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backgroundImage: { flex: 1 },
  overlay: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    minHeight: '45%',
    justifyContent: 'center',
  },
  logoShell: {
    height: 72,
    backgroundColor: '#000000',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: '95%',
    height: 52,
  },
  staffWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  staffPicture: {
    width: 66,
    height: 66,
    borderRadius: 33,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  staffFallback: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#d00000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  staffFallbackText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 24,
  },
  staffName: {
    color: '#111111',
    fontWeight: '700',
    fontSize: 16,
  },
  cardTitle: {
    color: '#111111',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  cardSubtitle: {
    color: '#555555',
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    color: '#111111',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.16)',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    color: '#111111',
    marginBottom: 14,
    fontSize: 15,
  },
  button: {
    height: 50,
    borderRadius: 12,
    backgroundColor: '#d00000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  otpInput: {
    width: 46,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.22)',
    backgroundColor: '#ffffff',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#111111',
  },
  verifyingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  verifyingText: {
    color: '#8a0000',
    fontWeight: '600',
    fontSize: 13,
  },
  ghostButton: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostButtonText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '700',
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  resendText: {
    color: '#666666',
    fontSize: 13,
  },
  resendLink: {
    color: '#d00000',
    fontWeight: '700',
    fontSize: 13,
  },
  footer: {
    textAlign: 'center',
    color: '#666666',
    fontSize: 11,
    marginTop: 14,
  },
});
