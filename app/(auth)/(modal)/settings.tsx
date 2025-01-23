import Colors from "@/constants/Colors";
import { defaultStyles } from "@/constants/Styles";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Button,
  Alert,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

const Page = () => {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [imageUri, setImageUri] = useState<string | null>(
    user?.imageUrl || null
  );

  const pickImage = async (useCamera: boolean) => {
    try {
      const permissionResult = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.status !== "granted") {
        Alert.alert(
          "Permission required",
          "Sorry, we need permissions to make this work!"
        );
        return;
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
        await user?.setProfileImage({ file: image });
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.errors?.[0]?.message || "Failed to pick image"
      );
    }
  };

  const saveSettings = async () => {
    try {
      await user?.update({
        firstName,
        lastName,
        username: `${firstName}${lastName}`,
      });
      router.navigate("/(auth)/(drawer)");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
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
            onPress={() => pickImage(false)}
          >
            <Ionicons name="images" size={24} color="white" />
            <Text style={styles.imageButtonText}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.imageButton}
            onPress={() => pickImage(true)}
          >
            <Ionicons name="camera" size={24} color="white" />
            <Text style={styles.imageButtonText}>Camera</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.label}>Profile Settings</Text>
      <View style={styles.inputContainer}>
        <Ionicons name="person-outline" size={20} color="#666" />
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="First Name"
          autoCorrect={false}
          placeholderTextColor="#666"
        />
      </View>
      <View style={styles.inputContainer}>
        <Ionicons name="person-outline" size={20} color="#666" />
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Last Name"
          autoCorrect={false}
          placeholderTextColor="#666"
        />
      </View>
      <View style={{ marginHorizontal: 20 }}>
        <TouchableOpacity
          style={[defaultStyles.btn, { backgroundColor: "#000" }]}
          onPress={saveSettings}
        >
          <Text style={styles.buttonText}>Save settings</Text>
        </TouchableOpacity>

        <Button title="Sign out" onPress={() => signOut()} color="#000" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  profileImageContainer: {
    width: "100%",
    height: "45%",
    marginBottom: 20,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.grey,
  },
  imageButtonsContainer: {
    position: "absolute",
    bottom: 20,
    right: 20,
    flexDirection: "row",
    gap: 10,
  },
  imageButton: {
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  imageButtonText: {
    color: "white",
    fontSize: 16,
  },
  label: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
    marginHorizontal: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 8,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#000",
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Page;
