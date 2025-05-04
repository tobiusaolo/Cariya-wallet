import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Text } from 'react-native';
import { Card } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';

const API_URL = 'http://your-server-ip:8000';

const ComplianceScreen = ({ route }) => {
  const { unique_id } = route.params || {};
  const [compliance, setCompliance] = useState(null);

  useEffect(() => {
    const fetchCompliance = async () => {
      const response = await axios.get(`${API_URL}/users/${unique_id}/compliance`);
      setCompliance(response.data);
    };
    if (unique_id) fetchCompliance();
  }, [unique_id]);

  if (!compliance) return <Text style={styles.loadingText}>Loading...</Text>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.screenTitle}>Compliance</Text>
      <Card style={styles.card} elevation={4}>
        <Card.Content>
          <View style={styles.statItem}>
            <Icon name="check-circle" size={24} color="#ff4d4d" style={styles.statIcon} />
            <Text style={styles.statText}>Compliance Score: {compliance.compliance_score}</Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  screenTitle: {
    fontSize: 28,
    color: '#ff4d4d',
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    marginBottom: 15,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  statIcon: {
    marginRight: 10,
  },
  statText: {
    fontSize: 16,
    color: '#333',
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default ComplianceScreen;