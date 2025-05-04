import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, Dimensions, Animated, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { Card, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Swiper from 'react-native-deck-swiper';
import { LinearGradient } from 'expo-linear-gradient';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import axios from 'axios';

// Get dimensions for responsive design
const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 600;
const fontScale = width < 320 ? 0.8 : 1;
const paddingScale = isSmallScreen ? 0.75 : 1;

const API_URL = 'http://0.0.0.0:8080';

// Placeholder image URLs for cycling
const placeholderImages = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
];

// Dynamic bio snippets for context
const bioSnippets = [
  'Dedicated mother transforming her farm',
  'Passionate about community empowerment',
  'Committed to sustainable family growth',
  'Advocate for children’s future',
];

const DonorViewScreen = ({ navigation }) => {
  const [donors, setDonors] = useState([]);
  const [matches, setMatches] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Animation for swipe feedback
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  // Fetch donors
  const fetchDonors = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/donor-view`);
      const enrichedData = response.data.donor_view.map((donor, index) => ({
        ...donor,
        profile_image: placeholderImages[index % placeholderImages.length],
        bio: bioSnippets[index % bioSnippets.length],
      }));
      setDonors(enrichedData || []);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Error fetching donors:', err);
      setError('Unable to load donors. Tap to retry.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDonors();
  }, [fetchDonors]);

  // Handle swipe actions
  const onSwipedLeft = () => {
    setCurrentIndex((prev) => prev + 1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const onSwipedRight = (cardIndex) => {
    const matchedDonor = donors[cardIndex];
    setMatches((prev) => [...prev, matchedDonor]);
    setCurrentIndex((prev) => prev + 1);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Handle retry on error
  const handleRetry = () => {
    setError(null);
    fetchDonors();
  };

  // Handle gesture for swipe feedback
  const onGestureEvent = (event) => {
    const { translationX } = event.nativeEvent;
    translateX.value = translationX;
    rotate.value = (translationX / width) * 8;
    scale.value = 1 - Math.abs(translationX) / (width * 3);
    opacity.value = 1 - Math.abs(translationX) / (width * 1.5);
  };

  const onHandlerStateChange = (event) => {
    if (event.nativeEvent.state === State.END) {
      translateX.value = withSpring(0);
      rotate.value = withSpring(0);
      scale.value = withSpring(1);
      opacity.value = withSpring(1);
    }
  };

  // Render individual donor card
  const renderCard = (donor) => (
    <PanGestureHandler onGestureEvent={onGestureEvent} onHandlerStateChange={onHandlerStateChange}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <Card style={styles.cardContainer}>
          <LinearGradient colors={['#FF4081', '#F06292']} style={styles.cardGradient}>
            <Image source={{ uri: donor.profile_image }} style={styles.profileImage} resizeMode="cover" />
            <View style={styles.cardContent}>
              <Text style={styles.donorName}>{donor.first_name} {donor.surname}</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Registered Children:</Text>
                <Text style={styles.detailValue}>3</Text>
              </View>
              <View style={styles.statContainer}>
                <View style={styles.statItem}>
                  <Icon name="savings" size={18} color="#FFD700" style={styles.statIcon} />
                  <Text style={styles.statText}>${donor.total_savings}</Text>
                </View>
                <View style={styles.statItem}>
                  <Icon name="attach-money" size={18} color="#FFD700" style={styles.statIcon} />
                  <Text style={styles.statText}>${donor.total_donor_contributions}</Text>
                </View>
              </View>
              <Text style={styles.donorBio}>{donor.bio}</Text>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Savings', { unique_id: donor.user_id })}
                style={styles.donateButton}
                labelStyle={styles.buttonLabel}
              >
                Make Donation
              </Button>
            </View>
          </LinearGradient>
        </Card>
      </Animated.View>
    </PanGestureHandler>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FF4081', '#F06292']} style={styles.headerGradient}>
        <Text style={styles.screenTitle}>Discover</Text>
      </LinearGradient>
      {error && (
        <TouchableOpacity onPress={handleRetry} style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Icon name="refresh" size={20} color="#FFD700" />
        </TouchableOpacity>
      )}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Curating Donors...</Text>
        </View>
      ) : donors.length === 0 ? (
        <Text style={styles.noMatches}>No donors available at this time.</Text>
      ) : (
        <View style={styles.swiperWrapper}>
          <Swiper
            cards={donors}
            renderCard={renderCard}
            onSwipedLeft={onSwipedLeft}
            onSwipedRight={onSwipedRight}
            cardIndex={currentIndex}
            backgroundColor="transparent"
            stackSize={3}
            cardVerticalMargin={20}
            cardHorizontalMargin={20}
            disableBottomSwipe
            disableTopSwipe
            animateCardOpacity
            animateOverlayLabelsOpacity
            overlayLabels={{
              left: {
                title: 'PASS',
                style: {
                  label: {
                    backgroundColor: 'rgba(211, 47, 47, 0.9)',
                    color: '#FFF',
                    fontSize: 24,
                    fontWeight: 'bold',
                    borderRadius: 15,
                    padding: 10,
                  },
                  wrapper: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    marginLeft: 30,
                  },
                },
              },
              right: {
                title: 'MATCH',
                style: {
                  label: {
                    backgroundColor: 'rgba(255, 215, 0, 0.9)',
                    color: '#1A1A1A',
                    fontSize: 24,
                    fontWeight: 'bold',
                    borderRadius: 15,
                    padding: 10,
                  },
                  wrapper: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    marginRight: 30,
                  },
                },
              },
            }}
          />
        </View>
      )}
      {matches.length > 0 && (
        <View style={styles.matchesContainer}>
          <Text style={styles.sectionTitle}>Your Matches</Text>
          {matches.map((match, index) => (
            <Card key={index} style={styles.matchCard}>
              <Card.Content style={styles.matchCardContent}>
                <Image source={{ uri: match.profile_image }} style={styles.matchImage} resizeMode="cover" />
                <View style={styles.matchDetails}>
                  <Text style={styles.matchName}>{match.first_name} {match.surname}</Text>
                  <Text style={styles.matchBio}>{match.bio}</Text>
                  <View style={styles.statItem}>
                    <Icon name="savings" size={16} color="#FFD700" style={styles.statIcon} />
                    <Text style={styles.matchStatText}>Savings: ${match.total_savings}</Text>
                  </View>
                  <Button
                    mode="contained"
                    onPress={() => navigation.navigate('Savings', { unique_id: match.user_id })}
                    style={styles.donateButton}
                    labelStyle={styles.buttonLabel}
                  >
                    Make Donation
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerGradient: {
    padding: 20 * paddingScale,
    paddingTop: 50,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  screenTitle: {
    fontSize: 32 * fontScale,
    color: '#FFF',
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  errorContainer: {
    backgroundColor: 'rgba(211, 47, 47, 0.95)',
    padding: 15,
    margin: 15,
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  errorText: {
    color: '#FFF',
    fontSize: 16 * fontScale,
    marginRight: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18 * fontScale,
    color: '#FFD700',
    marginTop: 12,
    fontWeight: '500',
  },
  swiperWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  card: {
    width: width * 0.85,
    height: height * 0.7,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  cardContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  cardGradient: {
    flex: 1,
    padding: 15,
  },
  profileImage: {
    width: '100%',
    height: height * 0.4,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  cardContent: {
    padding: 15,
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  donorName: {
    fontSize: 24 * fontScale,
    color: '#1A1A1A',
    fontWeight: '700',
    marginBottom: 5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 16 * fontScale,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16 * fontScale,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  statContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    marginRight: 8,
  },
  statText: {
    fontSize: 16 * fontScale,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  donorBio: {
    fontSize: 14 * fontScale,
    color: '#666',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  donateButton: {
    marginTop: 15,
    backgroundColor: '#D32F2F',
    borderRadius: 25,
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 16 * fontScale,
    fontWeight: '700',
    color: '#FFF',
  },
  matchesContainer: {
    padding: 20 * paddingScale,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 24 * fontScale,
    color: '#FF4081',
    fontWeight: '700',
    marginBottom: 15,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  matchCard: {
    marginBottom: 15,
    borderRadius: 15,
    backgroundColor: '#F8F8F8',
    elevation: 4,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  matchCardContent: {
    flexDirection: 'row',
    padding: 15,
  },
  matchImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#FFD700',
    marginRight: 15,
  },
  matchDetails: {
    flex: 1,
  },
  matchName: {
    fontSize: 20 * fontScale,
    color: '#1A1A1A',
    fontWeight: '700',
    marginBottom: 5,
  },
  matchBio: {
    fontSize: 14 * fontScale,
    color: '#666',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  matchStatText: {
    fontSize: 14 * fontScale,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  noMatches: {
    fontSize: 18 * fontScale,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});

export default DonorViewScreen;