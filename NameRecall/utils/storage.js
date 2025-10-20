import AsyncStorage from '@react-native-async-storage/async-storage';

const CONTACTS_KEY = 'NameRecall:contacts';

export const saveContact = async (contact) => {
  try {
    const existingContacts = await getContacts();
    const newContacts = [...existingContacts, contact];
    const jsonValue = JSON.stringify(newContacts);
    await AsyncStorage.setItem(CONTACTS_KEY, jsonValue);
  } catch (e) {
    console.error('Error saving contact', e);
  }
};

export const getContacts = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(CONTACTS_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Error getting contacts', e);
    return [];
  }
};

export const deleteContact = async (contactId) => {
  try {
    const existingContacts = await getContacts();
    const newContacts = existingContacts.filter((contact) => contact.id !== contactId);
    const jsonValue = JSON.stringify(newContacts);
    await AsyncStorage.setItem(CONTACTS_KEY, jsonValue);
  } catch (e) {
    console.error('Error deleting contact', e);
  }
};
