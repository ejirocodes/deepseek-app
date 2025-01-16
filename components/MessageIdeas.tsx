import Colors from '@/constants/Colors';
import { Text, ScrollView, TouchableOpacity, StyleSheet, View } from 'react-native';
import { useState, useEffect } from 'react';
import OpenAI from 'openai';

type Props = {
  onSelectCard: (message: string) => void;
  model?: string;
};

const MessageIdeas = ({ onSelectCard, model }: Props) => {
  const [PredefinedMessages, setPredefinedMessages] = useState<{ title: string; text: string }[]>([]);

  useEffect(() => {
    const generateSuggestions = async () => {
      const prompt = `Generate 3 conversation starter suggestions as a direct JSON array (not wrapped in an object).
Return format must be exactly like this, with no additional wrapping:
[
  {
    "title": "short phrase",
    "text": "brief context"
  }
]

${model === 'deepseek-coder' 
  ? 'Focus on programming topics, code explanations, and best practices.' 
  : 'Focus on general knowledge, creative ideas, and helpful advice.'}

Keep titles under 20 characters and text under 40 characters.
Do not wrap the array in any object. Return only the array.`;

      try {
        const openai = new OpenAI({
          baseURL: process.env.EXPO_PUBLIC_DEEPSEEK_API_URL,
          apiKey: process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY,
        });

        const completion = await openai.chat.completions.create({
          model: model || 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: "json_object" }
        });

        const content = completion.choices[0].message.content;
        if (!!content?.trim()) {
          try {
            const suggestions = JSON.parse(content);

            const suggestionsArray = Array.isArray(suggestions) 
              ? suggestions 
              : suggestions.conversation_starters || [];
            setPredefinedMessages(suggestionsArray);
          } catch (e) {
            console.error('Failed to parse suggestions:', e);
          }
        }
      } catch (error) {
        console.error('Failed to generate suggestions:', error);
      }
    };

    generateSuggestions();
  }, [model]);

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingVertical: 10,
          gap: 16,
        }}>
        {PredefinedMessages.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() => onSelectCard(`${item.title} ${item.text}`)}>
            <Text style={{ fontSize: 16, fontWeight: '500' }}>{item.title}</Text>
            <Text style={{ color: Colors.grey, fontSize: 14 }}>{item.text}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.input,
    padding: 14,
    borderRadius: 10,
  },
});

export default MessageIdeas;
