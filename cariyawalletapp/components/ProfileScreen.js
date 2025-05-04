import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Text, Image, Dimensions, View } from 'react-native';
import { Card, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';

const API_URL = 'http://0.0.0.0:8000';

// Dummy data to display while loading real data
const dummyUser = {
  first_name: 'Jane',
  surname: 'Doe',
  total_savings: 250,
  activity_points: 10,
  num_children: 2,
  ages_of_children_per_birth_order: [5, 3],
};

const dummyCompliance = {
  compliance_score: '4/8',
};

const ProfileScreen = ({ route, navigation }) => {
  const { unique_id } = route.params || {};
  const [user, setUser] = useState(dummyUser);
  const [complianceDetail, setComplianceDetail] = useState(dummyCompliance);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const userResponse = await axios.get(`${API_URL}/users/${unique_id}`);
        const complianceResponse = await axios.get(`${API_URL}/users/${unique_id}/compliance`);
        setUser(userResponse.data);
        setComplianceDetail(complianceResponse.data);
      } catch (error) {
        console.log('Error fetching profile:', error);
        // Keep dummy data if fetch fails
      } finally {
        setIsLoading(false);
      }
    };
    if (unique_id) fetchUserData();
  }, [unique_id]);

  const handleEditProfile = () => {
    navigation.navigate('EditProfile', { unique_id, user });
  };

  const handleLogout = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#FF4081', '#F06292']} style={styles.headerGradient}>
        <Image
          source={{ uri: 'https://via.placeholder.com/150' }}
          style={styles.profileImage}
          accessible={true}
          accessibilityLabel="Profile Picture"
        />
        <Text style={styles.name}>{user.first_name} {user.surname}</Text>
      </LinearGradient>
      <Card style={styles.card} elevation={6}>
        <Card.Content>
          <View style={styles.statContainer}>
            <View style={styles.statItem}>
              <Icon name="savings" size={24} color="#FFD700" style={styles.statIcon} />
              <Text style={styles.statText}>
                Savings: ${isLoading ? '...' : user.total_savings.toLocaleString()}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="star" size={24} color="#FFD700" style={styles.statIcon} />
              <Text style={styles.statText}>
                Points: {isLoading ? '...' : user.activity_points}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="check-circle" size={24} color="#FFD700" style={styles.statIcon} />
              <Text style={styles.statText}>
                Compliance: {isLoading ? '...' : complianceDetail.compliance_score}
              </Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Family Details</Text>
          <View style={styles.detailContainer}>
            <Text style={styles.detailText}>
              Children: {isLoading ? '...' : (user.num_children || 0)}
            </Text>
            <Text style={styles.detailText}>
              Ages: {isLoading ? '...' : (user.ages_of_children_per_birth_order?.join(', ') || 'N/A')}
            </Text>
          </View>
          <Button
            mode="contained"
            onPress={handleEditProfile}
            style={styles.button}
            icon={() => <Icon name="edit" size={20} color="#fff" />}
            disabled={isLoading}
          >
            Edit Profile
          </Button>
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={styles.logoutButton}
            textColor="#FF4081"
            icon={() => <Icon name="logout" size={20} color="#FF4081" />}
            disabled={isLoading}
          >
            Log Out
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 600;
const fontScale = width < 320 ? 0.8 : 1;
const paddingScale = isSmallScreen ? 0.75 : 1;

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
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#FFD700',
    marginBottom: 10,
  },
  name: {
    fontSize: 28 * fontScale,
    color: '#fff',
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  card: {
    margin: 15 * paddingScale,
    borderRadius: 15,
    backgroundColor: '#fff',
    elevation: 6,
  },
  statContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
    flexWrap: 'wrap',
    paddingHorizontal: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
  },
  statIcon: {
    marginRight: 8,
  },
  statText: {
    fontSize: 16 * fontScale,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 22 * fontScale,
    color: '#FF4081',
    fontWeight: '700',
    marginBottom: 15,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  detailContainer: {
    padding: 15,
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  detailText: {
    fontSize: 16 * fontScale,
    color: '#4A4A4A',
    marginBottom: 8,
    textAlign: 'center',
  },
  button: {
    margin: 10,
    backgroundColor: '#FF4081',
    paddingVertical: 8,
    borderRadius: 25,
  },
  logoutButton: {
    margin: 10,
    borderColor: '#FF4081',
    borderWidth: 1,
    paddingVertical: 8,
    borderRadius: 25,
  },
});

export default ProfileScreen;