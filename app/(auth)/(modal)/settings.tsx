import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';
import { keyStorage } from '@/utils/Storage';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Button, Alert } from 'react-native';

const Page = () => {
  const { user } = useUser();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const router = useRouter();
  const { signOut } = useAuth();

  const saveSettings = async () => {
    try {
      await user?.update({
        firstName,
        lastName,
      });
    router.navigate('/(auth)/(drawer)');

    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }

  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Profile Settings:</Text>
      <TextInput
        style={styles.input}
        value={firstName}
        onChangeText={setFirstName}
        placeholder="First Name"
        autoCorrect={false}
      />
      <TextInput
        style={styles.input}
        value={lastName}
        onChangeText={setLastName}
        placeholder="Last Name"
        autoCorrect={false}
      />

      
      <TouchableOpacity
        style={[defaultStyles.btn, { backgroundColor: Colors.primary }]}
        onPress={saveSettings}>
        <Text style={styles.buttonText}>Save Settings</Text>
      </TouchableOpacity>

      <Button title="Sign Out" onPress={() => signOut()} color={Colors.grey} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 20,
    backgroundColor: '#fff',
  },

  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  successText: {
    fontSize: 16,
    color: Colors.primary,
    marginBottom: 20,
  },
});

export default Page;
