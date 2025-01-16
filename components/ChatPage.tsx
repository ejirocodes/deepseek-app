import HeaderDropDown from '@/components/HeaderDropDown';
import MessageInput from '@/components/MessageInput';
import { defaultStyles } from '@/constants/Styles';
import { keyStorage, storage } from '@/utils/Storage';
import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, View, StyleSheet, KeyboardAvoidingView, Platform, Alert, Text } from 'react-native';
import { useMMKVString } from 'react-native-mmkv';
import { FlashList } from '@shopify/flash-list';
import ChatMessage from '@/components/ChatMessage';
import { Message, Role } from '@/utils/Interfaces';
import MessageIdeas from '@/components/MessageIdeas';
import { addChat, addMessage, getMessages } from '@/utils/Database';
import { useSQLiteContext } from 'expo-sqlite/next';
import EventSource from 'react-native-sse';
import OpenAI from 'openai';

const ChatPage = () => {
  const [deepseekModel, setDeepseekModel] = useMMKVString('deepseekModel', storage);
  const [models, setModels] = useState<{ key: string, title: string, icon: string }[]>([]);
  const [height, setHeight] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const db = useSQLiteContext();
  let { id } = useLocalSearchParams<{ id: string }>();
  
  const [chatId, _setChatId] = useState(id);
  const chatIdRef = useRef(chatId);

  const openai = useMemo(() => {
    return new OpenAI({
     baseURL: process.env.EXPO_PUBLIC_DEEPSEEK_API_URL,
     apiKey: process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY,
    });
  }, []);


  function setChatId(id: string) {
    chatIdRef.current = id;
    _setChatId(id);
  }

  useEffect(() => {
    if (id) {
      getMessages(db, parseInt(id)).then((res) => {
        setMessages(res);
      });
    }
  }, [id]);
  
  const onModelVersionChange = (version: string) => {
    setDeepseekModel(version);
  };

  const onLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    setHeight(height / 2);
  };

  const getCompletion = async (text: string) => {
    if (messages.length === 0) {
      const res = await addChat(db, text);
      const chatID = res.lastInsertRowId;
      setChatId(chatID.toString());
      await addMessage(db, chatID, { content: text, role: Role.User });
    } else {
      await addMessage(db, parseInt(chatIdRef.current), { content: text, role: Role.User });
    }

    setMessages([...messages, 
      { role: Role.User, content: text },
      { role: Role.Bot, content: '' }
    ]);

    const es = new EventSource(`${process.env.EXPO_PUBLIC_DEEPSEEK_API_URL}/chat/completions`, {
      headers: {
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({
        model: deepseekModel,
        stream: true,
        messages: [{ role: 'user', content: text }]
      }),
      pollingInterval: 25000
    });


    const listener = (event: any) => {
      if (event.type === 'message') {
        if (event.data !== '[DONE]') {
          const data = JSON.parse(event.data);
          const delta = data.choices[0].delta;
          const finishReason = data.choices[0].finish_reason;

          if (finishReason === 'stop') {
            es.close();
              addMessage(db, parseInt(chatIdRef.current), {
                content: delta.content,
                role: Role.Bot,
              });
          } else if (delta?.content) {
            setMessages((prevMessages) => {
              const updatedMessages = [...prevMessages];
              updatedMessages[updatedMessages.length - 1].content += delta.content;
              return updatedMessages;
            });
          }
        } else {
          es.close();
        }
      } else if (event.type === 'error') {
        console.error('Connection error:', event.message);
      }
    };

    es.addEventListener('message', listener);
    es.addEventListener('error', listener);

    return () => {
      es.removeAllEventListeners();
      es.close();
    };
  };


  useEffect(() => {

    async function getDeepseekModels() {
      const deepseekModels = await openai.models.list();

      setModels(deepseekModels.data.map((model: any) => {

        if (model.id === 'deepseek-chat') {
          return { key: model.id, title: 'Chat', icon: 'message' }
        } else if (model.id === 'deepseek-coder') {
          return { key: model.id, title: 'Coder', icon: 'desktopcomputer' }
        }

          return { key: model.id, title: model.id, icon: 'bolt' }
      }));
    }

    
    getDeepseekModels();
  }, []);

  return (
    <View style={defaultStyles.pageContainer}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <HeaderDropDown
              title="DeepSeek"
              items={models.map((model) => ({ key: model.key, title: model.title, icon: model.icon }))}
              onSelect={onModelVersionChange}
              selected={deepseekModel}
            />
          ),
        }}
      />
      <View style={styles.page} onLayout={onLayout}>
        {messages.length == 0 && (
          <View style={[styles.logoContainer, { marginTop: height / 2 - 100 }]}>
            <Image source={require('@/assets/images/deepseek-dark.png')} style={styles.image} />
          </View>
        )}
        <FlashList
          data={messages}
          renderItem={({ item }) => <ChatMessage {...item} />}
          estimatedItemSize={400}
          contentContainerStyle={{ paddingTop: 30, paddingBottom: 150 }}
          keyboardDismissMode="on-drag"
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={70}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
        }}>
        {!messages.length && <MessageIdeas onSelectCard={getCompletion} model={deepseekModel} />}
        <MessageInput onShouldSend={getCompletion} />
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: '#000',
  },
  image: {
    width: 30,
    height: 30,
    resizeMode: 'cover',
  },
  page: {
    flex: 1,
  },
});
export default ChatPage;
