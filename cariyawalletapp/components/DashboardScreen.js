import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, Dimensions, Animated, TouchableOpacity, Alert } from 'react-native';
import { Card, ProgressBar, Button, Avatar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

const API_URL = 'http://0.0.0.0:8080';

// Get dimensions for responsive design
const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 600;
const fontScale = width < 320 ? 0.8 : 1;
const paddingScale = isSmallScreen ? 0.75 : 1;

// Custom Component for Stat Item
const StatItem = ({ iconName, value, label }) => (
  <View style={styles.statItem}>
    <Icon name={iconName} size={24} color="#FFD700" style={styles.statIcon} />
    <View style={styles.statText}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </View>
);

// Dummy data for initial render
const dummyUser = {
  first_name: 'Jane',
  surname: 'Doe',
  total_savings: 250.00,
  activity_points: 5,
  compliance_score: '4/8',
  monthly_data: {
    '2025-01': { savings: 50, milestone_score: 1 },
    '2025-02': { savings: 75, milestone_score: 0 },
    '2025-03': { savings: 125, milestone_score: 1 },
  },
};

const DashboardScreen = ({ route, navigation }) => {
  const { unique_id } = route.params || {};
  const [user, setUser] = useState(dummyUser);
  const [creditScoreAnim] = useState(new Animated.Value(0));
  const [progressAnim] = useState(new Animated.Value(0));
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (unique_id) {
          const response = await axios.get(`${API_URL}/users/${unique_id}`);
          setUser(response.data);
          setError(null);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load data. Tap to retry.');
      }
    };
    if (unique_id) fetchUser();
  }, [unique_id]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(creditScoreAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(progressAnim, {
              toValue: 1.05,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(progressAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }),
    ]).start();
  }, []);

  // Calculate derived values
  const savingsProgress = user.total_savings / 7680;
  const complianceProgress = parseInt(user.compliance_score.split('/')[0]) / parseInt(user.compliance_score.split('/')[1]) || 0;
  const creditScore = Math.round(savingsProgress * 800);
  const creditStatus = creditScore >= 600 ? 'EXCELLENT' : creditScore >= 400 ? 'GOOD' : 'POOR';
  const accountBalance = user.total_savings * 3600;

  // Monthly progress data with milestone scores
  const months = [
    { name: 'Jan', score: 0, milestone_score: 0 },
    { name: 'Feb', score: 0, milestone_score: 0 },
    { name: 'Mar', score: 0, milestone_score: 0 },
    { name: 'Apr', score: 0, milestone_score: 0 },
    { name: 'May', score: 0, milestone_score: 0 },
    { name: 'Jun', score: 0, milestone_score: 0 },
    { name: 'Jul', score: 0, milestone_score: 0 },
    { name: 'Aug', score: 0, milestone_score: 0 },
    { name: 'Sep', score: 0, milestone_score: 0 },
    { name: 'Oct', score: 0, milestone_score: 0 },
    { name: 'Nov', score: 0, milestone_score: 0 },
    { name: 'Dec', score: 0, milestone_score: 0 },
  ];

  if (user.monthly_data) {
    Object.keys(user.monthly_data).forEach((monthKey, index) => {
      const monthIndex = parseInt(monthKey.split('-')[1]) - 1;
      if (monthIndex >= 0 && monthIndex < months.length) {
        months[monthIndex].score = user.monthly_data[monthKey].savings || 0;
        months[monthIndex].milestone_score = user.monthly_data[monthKey].milestone_score || 0;
      }
    });
  }

  const totalMilestones = months.reduce((sum, month) => sum + month.milestone_score, 0);

  const handleRetry = async () => {
    setError(null);
    try {
      if (unique_id) {
        const response = await axios.get(`${API_URL}/users/${unique_id}`);
        setUser(response.data);
      }
    } catch (error) {
      setError('Failed to load data. Tap to retry.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Error Message with Retry Option */}
      {error && (
        <TouchableOpacity onPress={handleRetry} style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Icon name="refresh" size={20} color="#FFF" />
        </TouchableOpacity>
      )}

      {/* Header Section with Pink Gradient */}
      <LinearGradient
        colors={['#FF4081', '#F06292']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.profileHeader}>
            <Avatar.Icon size={70} icon="account" color="#FF4081" style={styles.avatar} backgroundColor="rgba(255, 255, 255, 0.95)" />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user.first_name} {user.surname}</Text>
              <Text style={styles.profileDetail}>District: Arua</Text>
              <Text style={styles.profileDetail}>Children: {Object.keys(user.monthly_data || {}).length}</Text>
            </View>
          </View>
          <Animated.View style={{ opacity: creditScoreAnim, transform: [{ scale: creditScoreAnim }] }}>
            <Text style={styles.creditScore}>{creditScore}</Text>
            <Text style={styles.creditStatus}>{creditStatus}</Text>
            <ProgressBar
              progress={creditScore / 800}
              color={creditScore >= 600 ? '#FFD700' : creditScore >= 400 ? '#FFF' : '#D32F2F'}
              style={styles.creditProgress}
            />
          </Animated.View>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Account Balance</Text>
            <Text style={styles.balanceValue}>UGX {accountBalance.toLocaleString()}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Quick Stats Section */}
      <Card style={styles.statsCard} elevation={8}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.statsRow}>
            <StatItem iconName="savings" value={`$${user.total_savings.toLocaleString()}`} label="Savings" />
            <StatItem iconName="star" value={user.activity_points} label="Activity" />
            <StatItem iconName="check-circle" value={user.compliance_score} label="Compliance" />
          </View>
        </Card.Content>
      </Card>

      {/* Milestone Scores Section */}
      <View style={styles.milestoneSection}>
        <Text style={styles.sectionTitle}>Milestone Achievements</Text>
        <Card style={styles.milestoneCard} elevation={6}>
          <Card.Content style={styles.milestoneContent}>
            <LinearGradient colors={['#FF4081', '#F06292']} style={styles.milestoneHeader}>
              <Text style={styles.milestoneText}>Achieved: {totalMilestones}/12</Text>
            </LinearGradient>
            <ProgressBar
              progress={totalMilestones / 12}
              color="#FFD700"
              style={styles.milestoneProgress}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.milestoneScroll}>
              <View style={styles.milestoneItems}>
                {months.map((month, index) => (
                  <Animated.View key={index} style={[styles.milestoneItem, { transform: [{ scale: progressAnim }] }]}>
                    <Icon
                      name={month.milestone_score === 1 ? 'check-circle' : 'remove-circle'}
                      size={26}
                      color={month.milestone_score === 1 ? '#FFD700' : '#666'}
                      style={styles.milestoneIcon}
                    />
                    <Text style={styles.milestoneMonth}>{month.name}</Text>
                  </Animated.View>
                ))}
              </View>
            </ScrollView>
          </Card.Content>
        </Card>
      </View>

      {/* Review Your Progress Section */}
      <Text style={styles.sectionTitle}>Review Your Progress</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.progressScroll}
        contentContainerStyle={styles.progressScrollContent}
      >
        {months.map((month, index) => (
          <Animated.View key={index} style={[styles.monthCardWrapper, { opacity: progressAnim, transform: [{ scale: progressAnim }] }]}>
            <TouchableOpacity
              style={styles.monthCard}
              onPress={() => Alert.alert(`${month.name} Details`, `Savings: $${month.score}\nMilestone: ${month.milestone_score === 1 ? 'Achieved' : 'Pending'}`)}
            >
              <LinearGradient
                colors={month.milestone_score === 1 ? ['#FFD700', '#FFA500'] : ['#E0E0E0', '#EEEEEE']}
                style={styles.monthGradient}
              >
                <Text style={styles.monthName}>{month.name}</Text>
                <Text style={styles.monthScore}>${month.score.toLocaleString()}</Text>
                <Text style={styles.monthStatus}>{month.milestone_score === 1 ? 'Achieved' : 'Pending'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtonsRow}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Savings', { unique_id })}
          style={styles.actionButton}
          icon={() => <Icon name="add-circle" size={20} color="#FFF" />}
          labelStyle={styles.buttonLabel}
        >
          Add Savings
        </Button>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Activity', { unique_id })}
          style={styles.actionButton}
          icon={() => <Icon name="event" size={20} color="#FFF" />}
          labelStyle={styles.buttonLabel}
        >
          Log Activity
        </Button>
      </View>
      <View style={styles.actionButtonsRow}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Compliance', { unique_id })}
          style={styles.actionButton}
          icon={() => <Icon name="verified" size={20} color="#FFF" />}
          labelStyle={styles.buttonLabel}
        >
          View Compliance
        </Button>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Donors', { unique_id })}
          style={styles.actionButton}
          icon={() => <Icon name="favorite" size={20} color="#FFF" />}
          labelStyle={styles.buttonLabel}
        >
          Make Donation
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  errorContainer: {
    backgroundColor: '#D32F2F',
    padding: 10,
    margin: 10,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FFF',
    fontSize: 14 * fontScale,
    marginRight: 10,
  },
  headerGradient: {
    padding: 20 * paddingScale,
    paddingTop: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  headerContent: {
    alignItems: 'center',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 15,
    borderRadius: 20,
    width: '100%',
  },
  avatar: {
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 28 * fontScale,
    color: '#FFF',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  profileDetail: {
    fontSize: 14 * fontScale,
    color: '#FFF',
    fontStyle: 'italic',
    opacity: 0.9,
  },
  creditScore: {
    fontSize: 64 * fontScale,
    color: '#FFF',
    fontWeight: '900',
    textAlign: 'center',
    marginVertical: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  creditStatus: {
    fontSize: 22 * fontScale,
    color: '#FFF',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    opacity: 0.9,
    fontStyle: 'italic',
    textTransform: 'uppercase',
  },
  creditProgress: {
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginVertical: 10,
    width: '85%',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 15,
    borderRadius: 20,
    marginTop: 15,
  },
  balanceLabel: {
    fontSize: 16 * fontScale,
    color: '#FFF',
    opacity: 0.9,
  },
  balanceValue: {
    fontSize: 24 * fontScale,
    color: '#FFF',
    fontWeight: 'bold',
  },
  statsCard: {
    margin: 15 * paddingScale,
    marginBottom: 10,
    borderRadius: 20,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  cardContent: {
    padding: 10 * paddingScale,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    padding: 10,
  },
  statIcon: {
    marginBottom: 5,
  },
  statText: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20 * fontScale,
    color: '#FF4081',
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12 * fontScale,
    color: '#666',
    fontStyle: 'italic',
  },
  milestoneSection: {
    margin: 15 * paddingScale,
  },
  sectionTitle: {
    fontSize: 24 * fontScale,
    color: '#FF4081',
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  milestoneCard: {
    borderRadius: 20,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  milestoneHeader: {
    padding: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
  },
  milestoneText: {
    fontSize: 18 * fontScale,
    color: '#FFF',
    fontWeight: '600',
  },
  milestoneContent: {
    padding: 15 * paddingScale,
  },
  milestoneProgress: {
    height: 12,
    borderRadius: 6,
    marginVertical: 10,
    backgroundColor: '#E0E0E0',
  },
  milestoneScroll: {
    marginTop: 10,
  },
  milestoneItems: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  milestoneItem: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  milestoneIcon: {
    marginBottom: 5,
  },
  milestoneMonth: {
    fontSize: 14 * fontScale,
    color: '#666',
    fontStyle: 'italic',
  },
  progressScroll: {
    marginHorizontal: 15 * paddingScale,
  },
  progressScrollContent: {
    paddingRight: 15,
  },
  monthCardWrapper: {
    marginRight: 15,
  },
  monthCard: {
    width: 130,
    height: 150,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  monthGradient: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthName: {
    fontSize: 18 * fontScale,
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  monthScore: {
    fontSize: 20 * fontScale,
    color: '#FFF',
    fontWeight: '600',
    marginBottom: 5,
  },
  monthStatus: {
    fontSize: 14 * fontScale,
    color: '#FFF',
    fontWeight: '500',
    opacity: 0.9,
    fontStyle: 'italic',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 15 * paddingScale,
    marginTop: 10,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: '#D32F2F',
    paddingVertical: 10,
    borderRadius: 25,
    elevation: 4,
  },
  buttonLabel: {
    fontSize: 14 * fontScale,
    fontWeight: '600',
  },
});

export default DashboardScreen;