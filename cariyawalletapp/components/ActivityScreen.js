import React, { useState } from 'react';
import { StyleSheet, ScrollView, Text } from 'react-native';
import { TextInput, Button, Card } from 'react-native-paper';
import axios from 'axios';

const API_URL = 'http://your-server-ip:8000';

const ActivityScreen = ({ route, navigation }) => {
  const { unique_id } = route.params || {};
  const [activity, setActivity] = useState({ activity: '', partner: '', month: new Date().getMonth() + 1 });

  const handleAddActivity = async () => {
    try {
      await axios.post(`${API_URL}/users/${unique_id}/activities`, activity);
      navigation.navigate('MainTabs', { screen: 'Dashboard' });
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to add activity');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card} elevation={4}>
        <Card.Content>
          <Text style={styles.screenTitle}>Log Activity</Text>
          <TextInput
            label="Activity"
            value={activity.activity}
            onChangeText={text => setActivity({ ...activity, activity: text })}
            style={styles.input}
            mode="outlined"
            theme={{ colors: { primary: '#ff4d4d' } }}
          />
          <TextInput
            label="Partner"
            value={activity.partner}
            onChangeText={text => setActivity({ ...activity, partner: text })}
            style={styles.input}
            mode="outlined"
            theme={{ colors: { primary: '#ff4d4d' } }}
          />
          <Button mode="contained" onPress={handleAddActivity} style={styles.button}>
            Submit Activity
          </Button>
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
  card: {
    marginVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  screenTitle: {
    fontSize: 28,
    color: '#ff4d4d',
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    backgroundColor: '#ff4d4d',
    paddingVertical: 5,
    borderRadius: 5,
  },
});

export default ActivityScreen;