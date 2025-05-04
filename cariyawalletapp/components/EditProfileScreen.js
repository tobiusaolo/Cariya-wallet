import React, { useState } from 'react';
import { StyleSheet, ScrollView, Text } from 'react-native';
import { TextInput, Button, Card } from 'react-native-paper';
import axios from 'axios';

const API_URL = 'http://your-server-ip:8000';

const EditProfileScreen = ({ route, navigation }) => {
  const { unique_id, user } = route.params || {};
  const [form, setForm] = useState({
    first_name: user.first_name || '',
    surname: user.surname || '',
    mobile_number: user.mobile_number || '',
    num_children: user.num_children || '',
    ages_of_children: user.ages_of_children || '',
  });

  const handleSave = async () => {
    try {
      await axios.put(`${API_URL}/users/${unique_id}`, {
        first_name: form.first_name,
        surname: form.surname,
        mobile_number: form.mobile_number,
        num_children: parseInt(form.num_children),
        ages_of_children_per_birth_order: form.ages_of_children,
      });
      navigation.goBack();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to update profile');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card} elevation={4}>
        <Card.Content>
          <Text style={styles.screenTitle}>Edit Profile</Text>
          <TextInput
            label="First Name"
            value={form.first_name}
            onChangeText={text => setForm({ ...form, first_name: text })}
            style={styles.input}
            mode="outlined"
            theme={{ colors: { primary: '#ff4d4d' } }}
          />
          <TextInput
            label="Surname"
            value={form.surname}
            onChangeText={text => setForm({ ...form, surname: text })}
            style={styles.input}
            mode="outlined"
            theme={{ colors: { primary: '#ff4d4d' } }}
          />
          <TextInput
            label="Mobile Number"
            value={form.mobile_number}
            onChangeText={text => setForm({ ...form, mobile_number: text })}
            style={styles.input}
            mode="outlined"
            theme={{ colors: { primary: '#ff4d4d' } }}
          />
          <TextInput
            label="Number of Children"
            value={form.num_children}
            onChangeText={text => setForm({ ...form, num_children: text })}
            keyboardType="numeric"
            style={styles.input}
            mode="outlined"
            theme={{ colors: { primary: '#ff4d4d' } }}
          />
          <TextInput
            label="Ages (e.g., 2,4,6)"
            value={form.ages_of_children}
            onChangeText={text => setForm({ ...form, ages_of_children: text })}
            style={styles.input}
            mode="outlined"
            theme={{ colors: { primary: '#ff4d4d' } }}
          />
          <Button mode="contained" onPress={handleSave} style={styles.button}>
            Save Changes
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

export default EditProfileScreen;