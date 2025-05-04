import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform, ActivityIndicator, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import WelcomeScreen from './components/WelcomeScreen';
import RegisterScreen from './components/RegisterScreen';
import LoginScreen from './components/LoginScreen';
import DashboardScreen from './components/DashboardScreen';
import DonorViewScreen from './components/DonorViewScreen';
import SavingsScreen from './components/SavingsScreen';
import ActivityScreen from './components/ActivityScreen';
import ComplianceScreen from './components/ComplianceScreen';
import ProfileScreen from './components/ProfileScreen';
import EditProfileScreen from './components/EditProfileScreen';

// Context for Authentication
import { AuthContext } from './AuthContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Custom TabBar Icon with Label
const TabIcon = ({ label, focused, iconName }) => {
  const primaryColor = '#ff4d4d'; // Matches screenshot primary color
  const inactiveColor = '#8E8E93';

  return (
    <View style={styles.tabIconContainer}>
      <View style={[
        styles.iconWrapper,
        focused && { backgroundColor: `${primaryColor}10` }, // Light red background when focused
      ]}>
        <Icon
          name={iconName}
          size={24}
          color={focused ? primaryColor : inactiveColor}
        />
      </View>
      <Text style={[
        styles.tabLabel,
        { color: focused ? primaryColor : inactiveColor },
      ]}>
        {label}
      </Text>
    </View>
  );
};

// Custom Center Button Component
const CustomCenterButton = ({ onPress }) => (
  <TouchableOpacity style={styles.centerButton} onPress={onPress}>
    <View style={styles.centerButtonInner}>
      <Text style={styles.centerButtonText}>cariya</Text>
    </View>
  </TouchableOpacity>
);

// Enhanced Tab Navigator with Custom Center Button
const TabNavigator = () => {
  const handleCenterPress = () => {
    // Add navigation or action for the center button (e.g., navigate to a donations screen)
    console.log('Center button pressed');
  };

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#ff4d4d',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        headerShown: false,
      }}
      tabBar={(props) => (
        <View style={styles.tabBarContainer}>
          <View style={styles.tabBarInner}>
            {props.state.routes.map((route, index) => {
              const { options } = props.descriptors[route.key];
              const isFocused = props.state.index === index;

              const onPress = () => {
                const event = props.navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  props.navigation.navigate(route.name);
                }
              };

              const onLongPress = () => {
                props.navigation.emit({
                  type: 'tabLongPress',
                  target: route.key,
                });
              };

              // Define icon and label based on route name
              let iconName;
              switch (route.name) {
                case 'Dashboard':
                  iconName = 'home';
                  break;
                case 'Savings':
                  iconName = 'savings';
                  break;
                case 'Donors':
                  iconName = 'favorite';
                  break;
                case 'Profile':
                  iconName = 'person';
                  break;
                default:
                  iconName = 'home';
              }

              return (
                <TouchableOpacity
                  key={route.key}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  style={styles.tabItem}
                >
                  <TabIcon label={route.name} focused={isFocused} iconName={iconName} />
                </TouchableOpacity>
              );
            })}
            <CustomCenterButton onPress={handleCenterPress} />
          </View>
        </View>
      )}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Savings" component={SavingsScreen} />
      <Tab.Screen name="Donors" component={DonorViewScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Auth Stack - Screens for non-authenticated users
const AuthStack = () => (
  <Stack.Navigator initialRouteName="Welcome">
    <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
    <Stack.Screen
      name="Register"
      component={RegisterScreen}
      options={{
        title: 'Register',
        headerStyle: { backgroundColor: '#ff4d4d' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    />
    <Stack.Screen
      name="Login"
      component={LoginScreen}
      options={{
        title: 'Login',
        headerStyle: { backgroundColor: '#ff4d4d' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    />
  </Stack.Navigator>
);

// App Stack - Screens for authenticated users
const AppStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="MainTabs" component={TabNavigator} options={{ headerShown: false }} />
    <Stack.Screen
      name="Activity"
      component={ActivityScreen}
      options={{
        title: 'Log Activity',
        headerStyle: { backgroundColor: '#ff4d4d' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    />
    <Stack.Screen
      name="Compliance"
      component={ComplianceScreen}
      options={{
        title: 'Compliance',
        headerStyle: { backgroundColor: '#ff4d4d' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    />
    <Stack.Screen
      name="EditProfile"
      component={EditProfileScreen}
      options={{
        title: 'Edit Profile',
        headerStyle: { backgroundColor: '#ff4d4d' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    />
  </Stack.Navigator>
);

// Main App Component with Auth Context
const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  const authContext = {
    signIn: async (data) => {
      try {
        await AsyncStorage.setItem('userToken', data.token || 'dummy-token');
        await AsyncStorage.setItem('userId', data.unique_id || data.userId);
        if (data.userInfo) {
          await AsyncStorage.setItem('userInfo', JSON.stringify(data.userInfo));
          setUserInfo(data.userInfo);
        }
        setUserId(data.unique_id || data.userId);
        setUserToken(data.token || 'dummy-token');
      } catch (e) {
        console.error('Error saving auth data:', e);
      }
    },
    signUp: async (data) => {
      try {
        await AsyncStorage.setItem('userToken', data.token || 'dummy-token');
        await AsyncStorage.setItem('userId', data.unique_id || data.generated_id);
        if (data.userInfo) {
          await AsyncStorage.setItem('userInfo', JSON.stringify(data.userInfo));
          setUserInfo(data.userInfo);
        }
        setUserId(data.unique_id || data.generated_id);
        setUserToken(data.token || 'dummy-token');
      } catch (e) {
        console.error('Error saving auth data:', e);
      }
    },
    signOut: async () => {
      try {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userId');
        await AsyncStorage.removeItem('userInfo');
        setUserToken(null);
        setUserId(null);
        setUserInfo(null);
      } catch (e) {
        console.error('Error clearing auth data:', e);
      }
    },
    getUserInfo: () => userInfo,
    getUserId: () => userId,
  };

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        const storedUserId = await AsyncStorage.getItem('userId');
        const storedUserInfo = await AsyncStorage.getItem('userInfo');
        if (storedUserInfo) setUserInfo(JSON.parse(storedUserInfo));
        if (storedToken && storedUserId) {
          setUserToken(storedToken);
          setUserId(storedUserId);
        }
      } catch (e) {
        console.error('Error loading auth data:', e);
      } finally {
        setTimeout(() => setIsLoading(false), 500);
      }
    };
    bootstrapAsync();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff4d4d" />
        <Text style={styles.loadingText}>Loading Cariya Wallet...</Text>
      </View>
    );
  }

  return (
    <AuthContext.Provider value={authContext}>
      <NavigationContainer>
        {userToken ? <AppStack /> : <AuthStack />}
      </NavigationContainer>
    </AuthContext.Provider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#ff4d4d',
    fontWeight: '500',
  },
  tabBarContainer: {
    height: 80,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#F2F2F2',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    position: 'relative',
  },
  tabBarInner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    backgroundColor: 'transparent', // Default state
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  centerButton: {
    position: 'absolute',
    left: '50%',
    top: -20, // Slightly above the tab bar for a floating effect
    transform: [{ translateX: -30 }],
    zIndex: 1,
  },
  centerButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ff4d4d',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  centerButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default App;