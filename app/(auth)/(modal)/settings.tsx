import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Button, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const Page = () => {
  const { user } = useUser();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const router = useRouter();
  const { signOut } = useAuth();
  const [imageUri, setImageUri] = useState<string | null>(user?.imageUrl || null);

  const pickImage = async (useCamera: boolean) => {
    try {
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Sorry, we need camera permissions to make this work!');
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Sorry, we need gallery permissions to make this work!');
          return;
        }
      }

      const result = await (useCamera
        ? ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 4],
            quality: 0.1,
            base64: true,
          })
        : ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 4],
            quality: 0.1,
            base64: true,
          }));

      if (!result.canceled && result.assets[0].base64) {
        const base64 = result.assets[0].base64;
        const mimeType = result.assets[0].mimeType;
        const image = `data:${mimeType};base64,${base64}`;
        
        setImageUri(result.assets[0].uri);
        await user?.setProfileImage({
          file: image,
        });
      }
    } catch (error: any) {
      Alert.alert(error.errors?.[0]?.message || 'Failed to pick image');
    }
  };

  const saveSettings = async () => {
    try {
      await user?.update({
        firstName,
        lastName,
        username: `${firstName}${lastName}`,
      });

      router.navigate('/(auth)/(drawer)');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileImageContainer}>
        <Image
          source={{ uri: imageUri || user?.imageUrl }}
          style={styles.profileImage}
        />
        <View style={styles.imageButtonsContainer}>
          <TouchableOpacity
            style={styles.imageButton}
            onPress={() => pickImage(false)}>
            <Text style={styles.imageButtonText}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.imageButton}
            onPress={() => pickImage(true)}>
            <Text style={styles.imageButtonText}>Camera</Text>
          </TouchableOpacity>
        </View>
      </View>

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
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    backgroundColor: Colors.grey,
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  imageButton: {
    backgroundColor: Colors.primary,
    padding: 8,
    borderRadius: 5,
    minWidth: 80,
  },
  imageButtonText: {
    color: 'white',
    textAlign: 'center',
  },
});

export default Page;
