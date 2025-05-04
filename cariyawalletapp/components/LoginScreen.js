// LoginScreen.js
import React, { useState, useContext } from 'react';
import { StyleSheet, ScrollView, Dimensions, View, SafeAreaView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Card, HelperText, Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { AuthContext } from '../AuthContext';

const API_URL = 'http://0.0.0.0:8080';

// Get dimensions outside the component
const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 600;
const fontScale = width < 320 ? 0.8 : 1;
const paddingScale = isSmallScreen ? 0.8 : 1;

const LoginScreen = ({ navigation }) => {
  const { signIn } = useContext(AuthContext);
  const [form, setForm] = useState({ mobile_number: '+256', password: '' });
  const [errors, setErrors] = useState({});
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    const newErrors = {};
    const phoneRegex = /^\+256\d{9}$/;
    if (!phoneRegex.test(form.mobile_number)) {
      newErrors.mobile_number = 'Phone number must be in format +256XXXXXXXXX';
    }
    if (!form.password.trim()) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      // Assuming the backend has a /login endpoint
      const response = await axios.post(`${API_URL}/login`, {
        mobile_number: form.mobile_number,
        password: form.password,
      });

      console.log('Login successful:', response.data);

      const userInfo = {
        mobileNumber: form.mobile_number,
        // Add other user info if provided by the backend
      };

      // Use AuthContext signIn to persist user session
      signIn({
        token: response.data.token || 'dummy-token',
        userId: response.data.user_id || 'dummy-id',
        userInfo,
      });

    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      setErrors({
        general: error.response?.data?.detail || 'Login failed. Please check your credentials.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (text) => {
    let formattedNumber = text;
    if (!formattedNumber.startsWith('+256')) {
      if (formattedNumber.startsWith('+')) {
        formattedNumber = '+256' + formattedNumber.substring(1);
      } else if (formattedNumber.startsWith('256')) {
        formattedNumber = '+' + formattedNumber;
      } else if (formattedNumber.startsWith('0')) {
        formattedNumber = '+256' + formattedNumber.substring(1);
      } else {
        formattedNumber = '+256' + formattedNumber;
      }
    }
    if (formattedNumber.length > 13) {
      formattedNumber = formattedNumber.substring(0, 13);
    }
    setForm({ ...form, mobile_number: formattedNumber });
    setErrors({ ...errors, mobile_number: '', general: '' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="wallet-outline" size={60} color="#ff4d4d" />
          </View>

          <Text style={styles.screenTitle}>Welcome Back</Text>
          <Text style={styles.screenSubtitle}>Sign in to Cariya Wallet</Text>

          <Card style={styles.card} elevation={3}>
            <Card.Content style={styles.cardContent}>
              {errors.general && (
                <HelperText type="error" visible={!!errors.general} style={styles.errorText}>
                  {errors.general}
                </HelperText>
              )}

              <View style={styles.inputContainer}>
                <TextInput
                  label="Mobile Number"
                  value={form.mobile_number}
                  onChangeText={handlePhoneChange}
                  style={styles.input}
                  mode="flat"
                  keyboardType="phone-pad"
                  underlineColor="#ff4d4d"
                  activeUnderlineColor="#ff4d4d"
                  error={!!errors.mobile_number}
                  left={<TextInput.Icon icon="phone" color="#ff4d4d" />}
                />
              </View>
              <HelperText type="error" visible={!!errors.mobile_number} style={styles.errorText}>
                {errors.mobile_number}
              </HelperText>
              <HelperText type="info" visible={true}>
                Phone format: +256XXXXXXXXX (Uganda)
              </HelperText>

              <View style={styles.inputContainer}>
                <TextInput
                  label="Password"
                  value={form.password}
                  onChangeText={(text) => {
                    setForm({ ...form, password: text });
                    setErrors({ ...errors, password: '', general: '' });
                  }}
                  style={styles.input}
                  mode="flat"
                  secureTextEntry={!isPasswordVisible}
                  underlineColor="#ff4d4d"
                  activeUnderlineColor="#ff4d4d"
                  error={!!errors.password}
                  left={<TextInput.Icon icon="lock" color="#ff4d4d" />}
                  right={
                    <TextInput.Icon
                      icon={isPasswordVisible ? 'eye-off' : 'eye'}
                      color="#ff4d4d"
                      onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    />
                  }
                />
              </View>
              <HelperText type="error" visible={!!errors.password} style={styles.errorText}>
                {errors.password}
              </HelperText>
            </Card.Content>
          </Card>

          <TouchableOpacity
            style={[styles.loginButtonContainer, isLoading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#ff4d4d', '#ff6b6b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              {isLoading ? (
                <MaterialCommunityIcons name="loading" size={24} color="#fff" style={styles.loadingIcon} />
              ) : (
                <>
                  <Text style={styles.buttonText}>Sign In</Text>
                  <MaterialCommunityIcons name="arrow-right" size={24} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40 * paddingScale,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  screenTitle: {
    fontSize: 32 * fontScale,
    color: '#ff4d4d',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  screenSubtitle: {
    fontSize: 16 * fontScale,
    color: '#777',
    textAlign: 'center',
    marginBottom: 25,
  },
  card: {
    borderRadius: 20,
    backgroundColor: '#fff',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 5,
    position: 'relative',
  },
  input: {
    backgroundColor: '#fff',
    height: 55,
  },
  errorText: {
    color: '#f44336',
    marginLeft: 5,
    fontSize: 12,
  },
  loginButtonContainer: {
    marginVertical: 20,
    alignSelf: 'center',
    width: '100%',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonGradient: {
    borderRadius: 30,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18 * fontScale,
    fontWeight: 'bold',
    marginRight: 10,
  },
  loadingIcon: {
    animation: 'spin 1s linear infinite',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#777',
    fontSize: 14 * fontScale,
  },
  registerLink: {
    color: '#ff4d4d',
    fontWeight: 'bold',
    fontSize: 14 * fontScale,
    marginLeft: 5,
  },
});

export default LoginScreen;