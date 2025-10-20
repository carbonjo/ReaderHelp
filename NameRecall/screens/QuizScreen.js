import React, { useState, useEffect } from 'react';
import { View, Text, Image, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { getContacts } from '../utils/storage';

export default function QuizScreen({ navigation }) {
  const [contacts, setContacts] = useState([]);
  const [currentContact, setCurrentContact] = useState(null);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState('');

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadContacts();
    });
    return unsubscribe;
  }, [navigation]);

  const loadContacts = async () => {
    const storedContacts = await getContacts();
    setContacts(storedContacts);
    selectRandomContact(storedContacts);
  };

  const selectRandomContact = (contacts) => {
    if (contacts.length > 0) {
      const randomIndex = Math.floor(Math.random() * contacts.length);
      setCurrentContact(contacts[randomIndex]);
      setAnswer('');
      setResult('');
    }
  };

  const checkAnswer = () => {
    if (answer.toLowerCase() === currentContact.name.toLowerCase()) {
      setResult('Correct!');
      Alert.alert('Correct!');
    } else {
      setResult('Incorrect. Try again.');
      Alert.alert('Incorrect', `The correct name is ${currentContact.name}`);
    }
  };

  const nextQuestion = () => {
    selectRandomContact(contacts);
  };

  if (!currentContact) {
    return (
      <View style={styles.container}>
        <Text>No contacts found. Add some contacts first!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: currentContact.photo }} style={styles.photo} />
      <Text style={styles.prompt}>Who is this?</Text>
      <TextInput
        style={styles.input}
        value={answer}
        onChangeText={setAnswer}
        placeholder="Enter name"
      />
      <Button title="Check Answer" onPress={checkAnswer} />
      <Button title="Next Question" onPress={nextQuestion} />
      <Text style={styles.result}>{result}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  photo: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 20,
  },
  prompt: {
    fontSize: 24,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
    width: '80%',
    textAlign: 'center',
  },
  result: {
    fontSize: 20,
    marginTop: 20,
    fontWeight: 'bold',
  },
});
