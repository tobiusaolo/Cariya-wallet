import React, { useState, useContext } from 'react';
import { StyleSheet, ScrollView, Dimensions, View, StatusBar, SafeAreaView, TouchableOpacity } from 'react-native';
import { TextInput, Button, Card, HelperText, Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { AuthContext } from '../AuthContext';

const API_URL = 'http://0.0.0.0:8080';

// Get dimensions outside the component
const { width, height } = Dimensions.get('window');
// Define these variables outside the component so they can be used in styles
const isSmallScreen = height < 600;
const fontScale = width < 320 ? 0.8 : 1;
const paddingScale = isSmallScreen ? 0.8 : 1;

const RegisterScreen = ({ navigation }) => {
  // Get the signUp function from auth context
  const { signUp } = useContext(AuthContext);
  
  const [form, setForm] = useState({ 
    first_name: '', 
    surname: '', 
    mobile_number: '+256', 
    num_children: '', 
    ages_of_children: '' 
  });
  const [errors, setErrors] = useState({});

  const handleRegister = async () => {
    const newErrors = {};
    if (!form.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!form.surname.trim()) newErrors.surname = 'Surname is required';
    
    // Validate mobile number format for Uganda (+256XXXXXXXXX)
    const phoneRegex = /^\+256\d{9}$/;
    if (!phoneRegex.test(form.mobile_number)) {
      newErrors.mobile_number = 'Phone number must be in format +256XXXXXXXXX';
    }
    
    if (!form.num_children.trim() || isNaN(parseInt(form.num_children)) || parseInt(form.num_children) < 0) {
      newErrors.num_children = 'Valid number of children is required';
    }
    
    if (form.num_children && parseInt(form.num_children) > 0 && !form.ages_of_children.trim()) {
      newErrors.ages_of_children = 'Ages are required if you have children';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      // Validate the number of ages matches number of children
      const agesArray = form.ages_of_children
        .split(/[\/,]/)
        .map(age => age.trim())
        .filter(age => age !== '');
      
      const numChildren = parseInt(form.num_children, 10);
      if (agesArray.length !== numChildren) {
        setErrors({
          ...errors,
          ages_of_children: `Please provide exactly ${numChildren} ages`
        });
        return;
      }

      // Keep ages as a string - don't convert to integers
      // The API is expecting a string format like "2/4/6"
      const response = await axios.post(`${API_URL}/register`, {
        first_name: form.first_name,
        surname: form.surname,
        mobile_number: form.mobile_number,
        num_children: numChildren,
        ages_of_children_per_birth_order: form.ages_of_children
      });
      
      console.log('Registration successful:', response.data);
      
      // Create user info object to store additional user data
      const userInfo = {
        firstName: form.first_name,
        surname: form.surname,
        mobileNumber: form.mobile_number,
        numChildren: numChildren,
        childrenAges: form.ages_of_children
      };
      
      // Use the AuthContext signUp method to persist user session
      signUp({
        unique_id: response.data.generated_id,
        userInfo: userInfo
      });
      
      // No need to navigate - the app will automatically show the authenticated stack
      
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      alert(error.response?.data?.detail || 'Registration failed');
    }
  };

  const goBack = () => {
    navigation.goBack();
  };

  // Format phone number to ensure +256 prefix
  const handlePhoneChange = (text) => {
    let formattedNumber = text;
    
    // Always ensure the number starts with +256
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
    
    // Limit to maximum length for Ugandan numbers (+256 + 9 digits)
    if (formattedNumber.length > 13) {
      formattedNumber = formattedNumber.substring(0, 13);
    }
    
    setForm({ ...form, mobile_number: formattedNumber });
    setErrors({ ...errors, mobile_number: '' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
     
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons name="wallet-outline" size={60} color="#ff4d4d" />
        </View>
        
        <Text style={styles.screenTitle}>Join Cariya Wallet</Text>
        <Text style={styles.screenSubtitle}>Create your account to get started</Text>
        
        <Card style={styles.card} elevation={3}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="account" size={24} color="#ff4d4d" style={styles.inputIcon} />
              <TextInput
                label="First Name"
                value={form.first_name}
                onChangeText={text => {
                  setForm({ ...form, first_name: text });
                  setErrors({ ...errors, first_name: '' });
                }}
                style={styles.input}
                mode="flat"
                underlineColor="#ff4d4d"
                activeUnderlineColor="#ff4d4d"
                error={!!errors.first_name}
                left={<TextInput.Icon icon="account" color="#ff4d4d" />}
              />
            </View>
            <HelperText type="error" visible={!!errors.first_name} style={styles.errorText}>
              {errors.first_name}
            </HelperText>
            
            <View style={styles.inputContainer}>
              <TextInput
                label="Surname"
                value={form.surname}
                onChangeText={text => {
                  setForm({ ...form, surname: text });
                  setErrors({ ...errors, surname: '' });
                }}
                style={styles.input}
                mode="flat"
                underlineColor="#ff4d4d"
                activeUnderlineColor="#ff4d4d"
                error={!!errors.surname}
                left={<TextInput.Icon icon="account-box" color="#ff4d4d" />}
              />
            </View>
            <HelperText type="error" visible={!!errors.surname} style={styles.errorText}>
              {errors.surname}
            </HelperText>
            
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
                label="Number of Children"
                value={form.num_children}
                onChangeText={text => {
                  setForm({ ...form, num_children: text });
                  setErrors({ ...errors, num_children: '', ages_of_children: '' });
                }}
                style={styles.input}
                mode="flat"
                keyboardType="numeric"
                underlineColor="#ff4d4d"
                activeUnderlineColor="#ff4d4d"
                error={!!errors.num_children}
                left={<TextInput.Icon icon="account-child" color="#ff4d4d" />}
              />
            </View>
            <HelperText type="error" visible={!!errors.num_children} style={styles.errorText}>
              {errors.num_children}
            </HelperText>
            
            <View style={styles.inputContainer}>
              <TextInput
                label="Ages of Children"
                placeholder="e.g., 2/4/6"
                value={form.ages_of_children}
                onChangeText={text => {
                  setForm({ ...form, ages_of_children: text });
                  setErrors({ ...errors, ages_of_children: '' });
                }}
                style={styles.input}
                mode="flat"
                underlineColor="#ff4d4d"
                activeUnderlineColor="#ff4d4d"
                error={!!errors.ages_of_children}
                left={<TextInput.Icon icon="calendar" color="#ff4d4d" />}
              />
            </View>
            <HelperText type="error" visible={!!errors.ages_of_children} style={styles.errorText}>
              {errors.ages_of_children}
            </HelperText>
            <HelperText type="info" visible={parseInt(form.num_children) > 0}>
              Enter ages separated by / (e.g., 2/4/6)
            </HelperText>
          </Card.Content>
        </Card>

        <TouchableOpacity style={styles.registerButtonContainer} onPress={handleRegister}>
          <LinearGradient
            colors={['#ff4d4d', '#ff6b6b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Register</Text>
            <MaterialCommunityIcons name="arrow-right" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
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
  backButtonContainer: {
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 5,
  },
  backButton: {
    padding: 5,
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
  inputIcon: {
    position: 'absolute',
    left: 10,
    top: 20,
    zIndex: 2,
  },
  errorText: {
    color: '#f44336',
    marginLeft: 5,
    fontSize: 12,
  },
  registerButtonContainer: {
    marginVertical: 20,
    alignSelf: 'center',
    width: '100%',
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
  loginLink: {
    color: '#ff4d4d',
    fontWeight: 'bold',
    fontSize: 14 * fontScale,
    marginLeft: 5,
  },
});

export default RegisterScreen;