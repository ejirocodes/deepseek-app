import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet, Image } from "react-native";
import { TextInput, TouchableOpacity } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { BlurView } from "expo-blur";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

const ATouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export type Props = {
  onShouldSend: (
    message: string,
    isImageResponse?: boolean,
    skipProcessing?: boolean
  ) => void;
};

const MessageInput = ({ onShouldSend }: Props) => {
  const [message, setMessage] = useState("");
  const { bottom } = useSafeAreaInsets();
  const expanded = useSharedValue(0);
  const inputRef = useRef<TextInput>(null);
  const [selectedImage, setSelectedImage] = useState<{
    base64: string;
    mimeType: string;
  } | null>(null);

  const expandItems = () => {
    expanded.value = withTiming(1, { duration: 400 });
  };

  const collapseItems = () => {
    expanded.value = withTiming(0, { duration: 400 });
  };

  const expandButtonStyle = useAnimatedStyle(() => {
    const opacityInterpolation = interpolate(
      expanded.value,
      [0, 1],
      [1, 0],
      Extrapolation.CLAMP
    );
    const widthInterpolation = interpolate(
      expanded.value,
      [0, 1],
      [30, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity: opacityInterpolation,
      width: widthInterpolation,
    };
  });

  const buttonViewStyle = useAnimatedStyle(() => {
    const widthInterpolation = interpolate(
      expanded.value,
      [0, 1],
      [0, 100],
      Extrapolation.CLAMP
    );
    return {
      width: widthInterpolation,
      opacity: expanded.value,
    };
  });

  const onChangeText = (text: string) => {
    collapseItems();
    setMessage(text);
  };

  const onSend = async () => {
    if (selectedImage && message) {
      const image = `data:${selectedImage.mimeType};base64,${selectedImage.base64}`;

      try {
        onShouldSend(message, false, true);

        const response = await fetch(
          "https://api.together.xyz/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.EXPO_PUBLIC_TOGETHER_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo",
              temperature: 0.2,
              max_tokens: 500,
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "text", text: message },
                    {
                      type: "image_url",
                      image_url: {
                        url: image,
                      },
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`An error occurred, ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        onShouldSend(content, true);
        setMessage("");
        setSelectedImage(null);
      } catch (error) {
        console.error("Error details:", error);
      }
    } else if (message) {
      onShouldSend(message, false);
      setMessage("");
    }
  };

  const handleImagePicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.1,
      base64: true,
    });

    if (!result.canceled) {
      setSelectedImage({
        base64: result.assets[0].base64!,
        mimeType: result.assets[0].mimeType!,
      });
    }
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
  };

  return (
    <BlurView
      intensity={90}
      tint="extraLight"
      style={{ paddingBottom: bottom, paddingTop: 10 }}
    >
      {selectedImage && (
        <View style={styles.selectedImageContainer}>
          <Image
            source={{
              uri: `data:${selectedImage.mimeType};base64,${selectedImage.base64}`,
            }}
            style={styles.selectedImage}
          />
          <TouchableOpacity
            style={styles.clearImageButton}
            onPress={clearSelectedImage}
          >
            <Ionicons name="close-circle" size={24} color={Colors.dark} />
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.row}>
        <ATouchableOpacity
          onPress={expandItems}
          style={[styles.roundBtn, expandButtonStyle]}
        >
          <Ionicons name="add" size={24} color={Colors.grey} />
        </ATouchableOpacity>

        <Animated.View style={[styles.buttonView, buttonViewStyle]}>
          <TouchableOpacity onPress={() => ImagePicker.launchCameraAsync()}>
            <Ionicons name="camera-outline" size={24} color={Colors.grey} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleImagePicker}>
            <Ionicons name="image-outline" size={24} color={Colors.grey} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => DocumentPicker.getDocumentAsync()}>
            <Ionicons name="folder-outline" size={24} color={Colors.grey} />
          </TouchableOpacity>
        </Animated.View>

        <TextInput
          autoFocus
          ref={inputRef}
          placeholder="Message"
          style={styles.messageInput}
          onFocus={collapseItems}
          onChangeText={onChangeText}
          value={message}
          multiline
        />
        {message.length > 0 ? (
          <TouchableOpacity onPress={onSend} hitSlop={10}>
            <Ionicons name="arrow-up-circle" size={24} color={Colors.grey} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity>
            <FontAwesome5 name="headphones" size={24} color={Colors.grey} />
          </TouchableOpacity>
        )}
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  messageInput: {
    flex: 1,
    marginHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    padding: 10,
    borderColor: Colors.greyLight,
    backgroundColor: Colors.light,
  },
  roundBtn: {
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: Colors.input,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonView: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  selectedImageContainer: {
    padding: 10,
    position: "relative",
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginBottom: 10,
  },
  clearImageButton: {
    position: "absolute",
    bottom: 94,
    left: 92,
    backgroundColor: Colors.light,
    borderRadius: 12,
  },
});
export default MessageInput;
