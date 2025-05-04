import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions, 
  Image, 
  StatusBar,
  Platform,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { Video } from 'expo-av';
import Reanimated, { 
  FadeIn, 
  FadeInDown, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';

// Fallback for BlurView
let BlurView;
try {
  BlurView = require('expo-blur').BlurView;
} catch (error) {
  console.warn('BlurView not available, falling back to View');
  // Create a fallback component that mimics BlurView
  BlurView = ({ intensity, tint, style, children }) => (
    <View style={[
      style, 
      { 
        backgroundColor: tint === 'light' 
          ? 'rgba(255, 255, 255, 0.85)' 
          : 'rgba(0, 0, 0, 0.5)' 
      }
    ]}>
      {children}
    </View>
  );
}

// Fallback for LinearGradient
let LinearGradient;
try {
  LinearGradient = require('expo-linear-gradient').LinearGradient;
} catch (error) {
  console.warn('LinearGradient not available, falling back to View');
  LinearGradient = View;
}

const API_URL = 'http://0.0.0.0:8080';

const AnimatedScrollView = Reanimated.createAnimatedComponent(ScrollView);

const WelcomeScreen = ({ navigation }) => {
  const [stats, setStats] = useState({ users: 0, donations: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { width, height } = Dimensions.get('window');
  const scrollY = useSharedValue(0);
  const videoRef = useRef(null);

  // Animation values for buttons
  const buttonScale1 = useSharedValue(0.8);
  const buttonScale2 = useSharedValue(0.8);
  const buttonScale3 = useSharedValue(0.8);
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const headingOpacity = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  useEffect(() => {
    // Trigger animations
    setTimeout(() => {
      logoScale.value = withSpring(1, { damping: 15, stiffness: 100 });
      logoOpacity.value = withTiming(1, { duration: 800 });
      headingOpacity.value = withTiming(1, { duration: 1000 });
    }, 300);
    
    setTimeout(() => {
      buttonScale1.value = withSpring(1, { damping: 10, stiffness: 100 });
    }, 600);
    
    setTimeout(() => {
      buttonScale2.value = withSpring(1, { damping: 10, stiffness: 100 });
    }, 800);
    
    setTimeout(() => {
      buttonScale3.value = withSpring(1, { damping: 10, stiffness: 100 });
    }, 1000);

    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/donor-view`);
        setStats({
          users: response.data.donor_view.length,
          donations: response.data.donor_view.reduce((sum, d) => sum + d.total_donor_contributions, 0),
        });
        setLoading(false);
      } catch (error) {
        console.log('Error fetching stats:', error);
        setError('Failed to load statistics. Please check your connection.');
        setLoading(false);
        
        // Set some default values for demonstration
        setStats({
          users: 1250,
          donations: 52750
        });
      }
    };
    
    fetchStats();
  }, []);

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 100],
      [0, 1],
      Extrapolate.CLAMP
    );
    
    return {
      opacity,
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
    };
  });

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const headingAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headingOpacity.value,
  }));

  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale1.value }],
  }));
  
  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale2.value }],
  }));
  
  const animatedStyle3 = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale3.value }],
  }));

  // Responsive adjustments
  const isSmallScreen = height < 700;
  const fontScale = width < 380 ? 0.85 : 1;
  const paddingScale = isSmallScreen ? 0.8 : 1;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      
      {/* Animated Header */}
      <Reanimated.View style={headerAnimatedStyle}>
        <BlurView intensity={90} tint="light" style={styles.blurHeader}>
          <View style={styles.headerContainer}>
            <Image
              source={{ uri: 'https://via.placeholder.com/100' }}
              style={styles.headerLogo}
            />
            <Text style={styles.headerTitle}>Cariya Wallet</Text>
          </View>
        </BlurView>
      </Reanimated.View>

      <AnimatedScrollView
        style={styles.welcomeContainer}
        contentContainerStyle={[
          styles.contentContainer, 
          { paddingVertical: 40 * paddingScale }
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <View style={[styles.background, { minHeight: height }]}>
          {/* Background Video */}
          <Video
            ref={videoRef}
            source={{ uri: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-smart-phone-with-wallet-application-4886-large.mp4' }}
            rate={1.0}
            volume={0}
            isMuted={true}
            resizeMode="cover"
            shouldPlay
            isLooping
            style={styles.backgroundVideo}
          />
          <View style={styles.overlay} />

          {/* Main Content */}
          <View style={[styles.mainContent, { paddingTop: height * 0.08 }]}>
            {/* Logo Section */}
            <Reanimated.View style={[logoAnimatedStyle, { marginBottom: 30 }]}>
              <Image
                source={{ uri: 'https://via.placeholder.com/100' }}
                style={[
                  styles.logo, 
                  { 
                    width: width * 0.35, 
                    height: width * 0.35, 
                    borderRadius: (width * 0.35) / 2 
                  }
                ]}
                accessible={true}
                accessibilityLabel="Cariya Wallet Logo"
              />
            </Reanimated.View>

            {/* Heading Section */}
            <Reanimated.View style={headingAnimatedStyle}>
              <Text style={[styles.title, { fontSize: Math.min(48, width * 0.12) * fontScale }]}>
                Cariya Wallet
              </Text>
              <Text style={[styles.subtitle, { fontSize: Math.min(22, width * 0.055) * fontScale }]}>
                Empower Women, Transform Lives
              </Text>
            </Reanimated.View>

            {/* Stats Cards */}
            <Reanimated.View 
              entering={FadeInDown.duration(800).delay(400)} 
              style={styles.statsContainer}
            >
              {loading ? (
                <ActivityIndicator size="large" color="#ff4d4d" />
              ) : (
                <>
                  <View style={[styles.statCard, { minWidth: width * 0.42 }]}>
                    <MaterialCommunityIcons 
                      name="account-group" 
                      size={32 * fontScale} 
                      color="#ff4d4d" 
                      style={styles.statIcon} 
                    />
                    <Text style={[styles.statValue, { fontSize: 24 * fontScale }]}>
                      {stats.users.toLocaleString()}
                    </Text>
                    <Text style={[styles.statText, { fontSize: 16 * fontScale }]}>
                      Women Empowered
                    </Text>
                  </View>
                  <View style={[styles.statCard, { minWidth: width * 0.42 }]}>
                    <MaterialCommunityIcons 
                      name="hand-heart" 
                      size={32 * fontScale} 
                      color="#ff4d4d" 
                      style={styles.statIcon} 
                    />
                    <Text style={[styles.statValue, { fontSize: 24 * fontScale }]}>
                      ${stats.donations.toLocaleString()}
                    </Text>
                    <Text style={[styles.statText, { fontSize: 16 * fontScale }]}>
                      Funds Raised
                    </Text>
                  </View>
                </>
              )}
            </Reanimated.View>

            {/* Features Section */}
            <View style={styles.featuresSection}>
              <Text style={styles.sectionTitle}>How We Help</Text>
              
              {/* Get Started Button moved to top of section */}
              <Reanimated.View style={[animatedStyle1, { marginBottom: 24 }]}>
                <TouchableOpacity
                  style={[styles.joinButton, { width: width * 0.85 }]}
                  onPress={() => navigation.navigate('Register')}
                  activeOpacity={0.8}
                  accessible={true}
                  accessibilityLabel="Get started button"
                >
                  <LinearGradient
                    colors={LinearGradient !== View ? ['#ff4d4d', '#ff365c'] : []}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={styles.buttonGradient}
                  >
                    <MaterialCommunityIcons name="account-plus" size={24 * fontScale} color="#fff" style={styles.buttonIcon} />
                    <Text style={[styles.buttonText, { fontSize: 18 * fontScale }]}>Get Started</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Reanimated.View>
              
              <Reanimated.View entering={FadeInDown.duration(600).delay(200)}>
                <View style={styles.featureItem}>
                  <View style={styles.featureIconContainer}>
                    <MaterialCommunityIcons name="wallet-plus" size={26} color="#fff" />
                  </View>
                  <View style={styles.featureTextContainer}>
                    <Text style={styles.featureTitle}>Digital Wallet</Text>
                    <Text style={styles.featureDescription}>
                      Secure financial platform designed specifically for women's needs
                    </Text>
                  </View>
                </View>
              </Reanimated.View>
              
              <Reanimated.View entering={FadeInDown.duration(600).delay(400)}>
                <View style={styles.featureItem}>
                  <View style={styles.featureIconContainer}>
                    <MaterialCommunityIcons name="school" size={26} color="#fff" />
                  </View>
                  <View style={styles.featureTextContainer}>
                    <Text style={styles.featureTitle}>Financial Education</Text>
                    <Text style={styles.featureDescription}>
                      Learn essential money management and investment skills
                    </Text>
                  </View>
                </View>
              </Reanimated.View>
              
              <Reanimated.View entering={FadeInDown.duration(600).delay(600)}>
                <View style={styles.featureItem}>
                  <View style={styles.featureIconContainer}>
                    <MaterialCommunityIcons name="account-cash" size={26} color="#fff" />
                  </View>
                  <View style={styles.featureTextContainer}>
                    <Text style={styles.featureTitle}>Micro-loans</Text>
                    <Text style={styles.featureDescription}>
                      Access to capital to start or grow your business
                    </Text>
                  </View>
                </View>
              </Reanimated.View>
            </View>

            {/* CTA Buttons */}
            <View style={[styles.buttonContainer, { marginTop: 30 }]}>
              {/* Join Waitlist button removed from here since it's now at top of How We Help section */}
              
              <Reanimated.View style={[animatedStyle2]}>
                <TouchableOpacity
                  style={[styles.learnButton, { width: width * 0.85 }]}
                  onPress={() => {}}
                  activeOpacity={0.8}
                  accessible={true}
                  accessibilityLabel="Learn more button"
                >
                  <LinearGradient
                    colors={LinearGradient !== View ? ['#f8f8f8', '#e8e8e8'] : []}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={styles.buttonGradient}
                  >
                    <MaterialCommunityIcons name="information-outline" size={24 * fontScale} color="#ff4d4d" style={styles.buttonIcon} />
                    <Text style={[styles.buttonTextLearn, { fontSize: 18 * fontScale }]}>Learn More</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Reanimated.View>
              
              <Reanimated.View style={[animatedStyle3]}>
                <TouchableOpacity
                  style={[styles.donateButton, { width: width * 0.85 }]}
                  onPress={() => navigation.navigate('MainTabs', { screen: 'Donors' })}
                  activeOpacity={0.8}
                  accessible={true}
                  accessibilityLabel="Donate button"
                >
                  <LinearGradient
                    colors={LinearGradient !== View ? ['#ff4d4d', '#ff365c'] : []}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={styles.buttonGradient}
                  >
                    <MaterialCommunityIcons name="hand-heart" size={24 * fontScale} color="#fff" style={styles.buttonIcon} />
                    <Text style={[styles.buttonText, { fontSize: 18 * fontScale }]}>Donate</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Reanimated.View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>© {new Date().getFullYear()} Cariya Wallet</Text>
              <View style={styles.socialIcons}>
                <TouchableOpacity style={styles.socialIcon}>
                  <MaterialCommunityIcons name="facebook" size={20} color="#555" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialIcon}>
                  <MaterialCommunityIcons name="twitter" size={20} color="#555" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialIcon}>
                  <MaterialCommunityIcons name="instagram" size={20} color="#555" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </AnimatedScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  welcomeContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    flexGrow: 1,
  },
  background: {
    width: '100%',
    alignItems: 'center',
  },
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.07,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  mainContent: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 2,
  },
  blurHeader: {
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 5,
  },
  headerLogo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ff4d4d',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ff4d4d',
    marginLeft: 10,
  },
  logo: {
    marginTop: Platform.OS === 'ios' ? 20 : StatusBar.currentHeight + 20,
    borderWidth: 3,
    borderColor: '#ff4d4d',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    backgroundColor: '#fff',
  },
  title: {
    color: '#ff4d4d',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    color: '#333',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
    paddingHorizontal: 5,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    marginBottom: 10,
  },
  statText: {
    color: '#555',
    textAlign: 'center',
    fontWeight: '500',
  },
  statValue: {
    color: '#ff4d4d',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  featuresSection: {
    width: '100%',
    marginVertical: 20,
    paddingHorizontal: 5,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  featureIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ff4d4d',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  joinButton: {
    borderRadius: 30,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#ff4d4d',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  learnButton: {
    borderRadius: 30,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  donateButton: {
    borderRadius: 30,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#ff4d4d',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 25,
    backgroundColor: '#ff4d4d', // Fallback color
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  buttonTextLearn: {
    color: '#ff4d4d',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  buttonIcon: {
    marginRight: 5,
  },
  footer: {
    marginTop: 40,
    marginBottom: 20,
    alignItems: 'center',
    width: '100%',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  footerText: {
    fontSize: 14,
    color: '#777',
    marginBottom: 15,
  },
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  socialIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
});

export default WelcomeScreen;