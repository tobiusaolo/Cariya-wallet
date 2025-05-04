import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, View, Text, Dimensions, Modal, TouchableOpacity, Animated, FlatList } from 'react-native';
import { Card, ProgressBar, Button, TextInput } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { debounce } from 'lodash';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

// Get dimensions for responsive design
const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 600;
const fontScale = width < 320 ? 0.8 : 1;
const paddingScale = isSmallScreen ? 0.75 : 1;

const API_URL = 'http://0.0.0.0:8080'; // Update to your server IP

// Dummy data for initial render
const dummySavings = {
  current_savings: 250.00,
  monthly_data: {
    '2025-01': 50.00,
    '2025-02': 75.00,
    '2025-03': 125.00,
  },
  yearly_data: { '2025': 250.00 },
  activity_data: { 'donation': 100.00, 'investment': 150.00 },
  target_savings: 7680.00,
};

// Dummy mini statements
const dummyMiniStatements = [
  { id: '1', date: '2025-05-01', amount: 50.00, activity: 'donation', status: 'Processed' },
  { id: '2', date: '2025-04-15', amount: 75.00, activity: 'investment', status: 'Processed' },
  { id: '3', date: '2025-03-10', amount: 125.00, activity: 'general', status: 'Processed' },
];

// Create Tab Navigator
const Tab = createMaterialTopTabNavigator();

// Savings Overview Tab Component
const SavingsOverviewTab = ({ savings, monthlyTarget, yearlyTarget, savingsProgress, monthlyTotal, yearlyTotal, expandedSections, toggleSection, fadeAnim }) => (
  <ScrollView style={styles.tabContent}>
    <Card style={styles.breakdownCard} elevation={8}>
      <Card.Content>
        {/* Monthly Breakdown */}
        <TouchableOpacity onPress={() => toggleSection('monthly')} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Monthly Savings</Text>
          <Icon name={expandedSections.monthly ? 'expand-less' : 'expand-more'} size={24} color="#FF4081" />
        </TouchableOpacity>
        {expandedSections.monthly && (
          <Animated.View style={{ opacity: fadeAnim }}>
            {Object.entries(savings.monthly_data || {}).map(([month, amount]) => {
              const monthlyProgress = Math.min(amount / monthlyTarget, 1);
              return (
                <View key={month} style={styles.breakdownItem}>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>{month}</Text>
                    <Text style={styles.breakdownValue}>${amount.toLocaleString()}</Text>
                  </View>
                  <ProgressBar
                    progress={monthlyProgress}
                    color={monthlyProgress >= 1 ? '#FFD700' : '#FF4081'}
                    style={styles.sectionProgressBar}
                  />
                  <Text style={styles.progressLabel}>
                    {Math.round(monthlyProgress * 100)}% of ${monthlyTarget.toLocaleString()} Target
                  </Text>
                </View>
              );
            })}
            <Text style={styles.totalText}>Total: ${monthlyTotal.toLocaleString()}</Text>
          </Animated.View>
        )}

        {/* Yearly Breakdown */}
        <TouchableOpacity onPress={() => toggleSection('yearly')} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Yearly Savings</Text>
          <Icon name={expandedSections.yearly ? 'expand-less' : 'expand-more'} size={24} color="#FF4081" />
        </TouchableOpacity>
        {expandedSections.yearly && (
          <Animated.View style={{ opacity: fadeAnim }}>
            {Object.entries(savings.yearly_data || {}).map(([year, amount]) => {
              const yearlyProgress = Math.min(amount / yearlyTarget, 1);
              return (
                <View key={year} style={styles.breakdownItem}>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>{year}</Text>
                    <Text style={styles.breakdownValue}>${amount.toLocaleString()}</Text>
                  </View>
                  <ProgressBar
                    progress={yearlyProgress}
                    color={yearlyProgress >= 1 ? '#FFD700' : '#FF4081'}
                    style={styles.sectionProgressBar}
                  />
                  <Text style={styles.progressLabel}>
                    {Math.round(yearlyProgress * 100)}% of ${yearlyTarget.toLocaleString()} Target
                  </Text>
                </View>
              );
            })}
            <Text style={styles.totalText}>Total: ${yearlyTotal.toLocaleString()}</Text>
          </Animated.View>
        )}
      </Card.Content>
    </Card>
  </ScrollView>
);

// Mini Statements Tab Component
const MiniStatementsTab = ({ miniStatements }) => (
  <View style={styles.tabContent}>
    <Card style={styles.breakdownCard} elevation={8}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Recent Savings</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Date</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Amount</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Activity</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Status</Text>
        </View>
        <FlatList
          data={miniStatements}
          renderItem={({ item }) => (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>{item.date}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>${item.amount.toLocaleString()}</Text>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>{item.activity}</Text>
              <Text style={[styles.tableCell, { flex: 1, color: '#FF4081' }]}>{item.status}</Text>
            </View>
          )}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={styles.emptyText}>No recent savings found.</Text>}
        />
      </Card.Content>
    </Card>
  </View>
);

const SavingsScreen = ({ route, navigation }) => {
  const { unique_id } = route.params || {};
  const [savings, setSavings] = useState(dummySavings);
  const [miniStatements, setMiniStatements] = useState(dummyMiniStatements);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({ amount: '', date: '', activity: '' });
  const [expandedSections, setExpandedSections] = useState({ monthly: false, yearly: false, activity: false });
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Debounced fetch for savings data
  const fetchSavings = useCallback(
    debounce(async () => {
      try {
        if (unique_id) {
          setIsRefreshing(true);
          const savingsResponse = await axios.get(`${API_URL}/users/${unique_id}/savings`);
          setSavings(savingsResponse.data);

          // Fetch mini statements
          const statementsResponse = await axios.get(`${API_URL}/users/${unique_id}/savings/statements`);
          setMiniStatements(statementsResponse.data);
          setError(null);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Tap to retry.');
      } finally {
        setIsRefreshing(false);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();
      }
    }, 300),
    [unique_id, fadeAnim]
  );

  useEffect(() => {
    fetchSavings();
    const interval = setInterval(fetchSavings, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [unique_id, fetchSavings]);

  const handleAddSavings = async () => {
    if (!formData.amount || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount greater than 0.');
      return;
    }

    try {
      await axios.post(`${API_URL}/users/${unique_id}/savings`, {
        amount: parseFloat(formData.amount),
        date: formData.date || new Date().toISOString().split('T')[0],
        activity: formData.activity || 'general',
      });
      setModalVisible(false);
      setFormData({ amount: '', date: '', activity: '' });
      fetchSavings(); // Immediate refresh
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to add savings');
    }
  };

  const handleRetry = () => {
    setError(null);
    fetchSavings();
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const monthlyTarget = savings.target_savings / 12;
  const yearlyTarget = savings.target_savings;
  const savingsProgress = savings.current_savings / savings.target_savings;
  const monthlyTotal = Object.values(savings.monthly_data || {}).reduce((a, b) => a + b, 0);
  const yearlyTotal = savings.yearly_data[Object.keys(savings.yearly_data || {})[0]] || 0;

  return (
    <View style={styles.container}>
      {/* Error Message with Retry */}
      {error && (
        <TouchableOpacity onPress={handleRetry} style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Icon name="refresh" size={20} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Savings Summary Header */}
      <LinearGradient colors={['#FF4081', '#F06292']} style={styles.summaryGradient}>
        <View style={styles.summaryContent}>
          <Text style={styles.summaryTitle}>Savings Vault</Text>
          <Animated.Text style={[styles.savingsAmount, { opacity: fadeAnim }]}>
            ${savings.current_savings.toLocaleString()}
          </Animated.Text>
          <ProgressBar progress={savingsProgress} color="#FFD700" style={styles.progressBar} />
          <Text style={styles.targetText}>Goal: ${savings.target_savings.toLocaleString()}</Text>
          <Text style={styles.progressText}>{Math.round(savingsProgress * 100)}% Achieved</Text>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIndicatorStyle: { backgroundColor: '#FF4081' },
          tabBarActiveTintColor: '#FF4081',
          tabBarInactiveTintColor: '#666',
        }}
      >
        <Tab.Screen name="SavingsOverview">
          {() => (
            <SavingsOverviewTab
              savings={savings}
              monthlyTarget={monthlyTarget}
              yearlyTarget={yearlyTarget}
              savingsProgress={savingsProgress}
              monthlyTotal={monthlyTotal}
              yearlyTotal={yearlyTotal}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
              fadeAnim={fadeAnim}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="MiniStatements">
          {() => <MiniStatementsTab miniStatements={miniStatements} />}
        </Tab.Screen>
      </Tab.Navigator>

      {/* Floating Add Savings Button */}
      <TouchableOpacity style={styles.floatingButton} onPress={() => setModalVisible(true)}>
        <Icon name="add" size={24} color="#fff" />
        <Text style={styles.floatingButtonText}>Add Savings</Text>
      </TouchableOpacity>

      {/* Modal for Adding Savings */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Savings</Text>
            <TextInput
              label="Amount ($)"
              value={formData.amount}
              onChangeText={text => setFormData({ ...formData, amount: text })}
              keyboardType="numeric"
              style={styles.modalInput}
              mode="outlined"
              theme={{ colors: { primary: '#FF4081' } }}
              error={!formData.amount || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0}
            />
            <TextInput
              label="Date (YYYY-MM-DD)"
              value={formData.date}
              onChangeText={text => setFormData({ ...formData, date: text })}
              style={styles.modalInput}
              mode="outlined"
              theme={{ colors: { primary: '#FF4081' } }}
            />
            <TextInput
              label="Activity (e.g., donation)"
              value={formData.activity}
              onChangeText={text => setFormData({ ...formData, activity: text })}
              style={styles.modalInput}
              mode="outlined"
              theme={{ colors: { primary: '#FF4081' } }}
            />
            <View style={styles.modalButtons}>
              <Button
                mode="contained"
                onPress={handleAddSavings}
                style={styles.modalButton}
                disabled={!formData.amount || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0}
                labelStyle={styles.buttonLabel}
              >
                Save
              </Button>
              <Button
                mode="outlined"
                onPress={() => {
                  setModalVisible(false);
                  setFormData({ amount: '', date: '', activity: '' });
                }}
                style={styles.modalButton}
                labelStyle={styles.buttonLabel}
              >
                Cancel
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    backgroundColor: '#D32F2F',
    padding: 12,
    margin: 10,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  errorText: {
    color: '#fff',
    fontSize: 14 * fontScale,
    marginRight: 10,
    fontWeight: '600',
  },
  summaryGradient: {
    padding: 25 * paddingScale,
    paddingTop: 50,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  summaryContent: {
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 28 * fontScale,
    color: '#fff',
    fontWeight: '800',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  savingsAmount: {
    fontSize: 52 * fontScale,
    color: '#fff',
    fontWeight: '900',
    textAlign: 'center',
    marginVertical: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  progressBar: {
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    marginVertical: 15,
    width: '90%',
  },
  targetText: {
    fontSize: 18 * fontScale,
    color: '#fff',
    fontWeight: 'bold',
    opacity: 0.9,
  },
  progressText: {
    fontSize: 16 * fontScale,
    color: '#FFD700',
    fontWeight: '700',
    marginTop: 10,
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    elevation: 4,
  },
  tabLabel: {
    fontSize: 16 * fontScale,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  tabContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  breakdownCard: {
    margin: 20 * paddingScale,
    marginBottom: 80, // Space for floating button
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 22 * fontScale,
    color: '#FF4081',
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  sectionContent: {
    padding: 15 * paddingScale,
  },
  breakdownItem: {
    marginVertical: 12,
    padding: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    elevation: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 18 * fontScale,
    color: '#000',
    fontWeight: '500',
  },
  breakdownValue: {
    fontSize: 18 * fontScale,
    color: '#D32F2F',
    fontWeight: '600',
  },
  sectionProgressBar: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e0e0e0',
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 14 * fontScale,
    color: '#000',
    marginTop: 5,
    textAlign: 'right',
    fontStyle: 'italic',
  },
  totalText: {
    fontSize: 18 * fontScale,
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'right',
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#FF4081',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    marginBottom: 5,
  },
  tableHeaderCell: {
    fontSize: 16 * fontScale,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    marginVertical: 5,
  },
  tableCell: {
    fontSize: 16 * fontScale,
    color: '#000',
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16 * fontScale,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#D32F2F',
    width: 180,
    height: 60,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  floatingButtonText: {
    color: '#fff',
    fontSize: 18 * fontScale,
    fontWeight: '700',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 25,
    width: '90%',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 26 * fontScale,
    color: '#FF4081',
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  modalInput: {
    marginBottom: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 25,
    backgroundColor: '#D32F2F',
    borderColor: '#D32F2F',
  },
  buttonLabel: {
    fontSize: 16 * fontScale,
    fontWeight: '600',
    color: '#fff',
  },
});

export default SavingsScreen;