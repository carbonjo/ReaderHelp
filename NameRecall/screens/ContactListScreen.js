import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, Button } from 'react-native';
import { getContacts } from '../utils/storage';

export default function ContactListScreen({ navigation }) {
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadContacts();
    });
    return unsubscribe;
  }, [navigation]);

  const loadContacts = async () => {
    const storedContacts = await getContacts();
    setContacts(storedContacts);
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Image source={{ uri: item.photo }} style={styles.photo} />
      <Text style={styles.name}>{item.name}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Button
        title="Add New Contact"
        onPress={() => navigation.navigate('AddContact')}
      />
      <FlatList
        data={contacts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  photo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  name: {
    fontSize: 18,
  },
});
