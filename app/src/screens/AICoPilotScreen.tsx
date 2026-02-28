import React, { useState, useRef, useEffect } from 'react';
import {
  View, FlatList, StyleSheet, Text, TouchableOpacity,
  Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useAppStore } from '../store/useAppStore';
import { askCoPilotDirect, ChatMessage } from '../services/openaiClient';
import { speak, startRecording, stopRecording, transcribeAudioFile } from '../services/voiceService';
import { COLORS, FONTS } from '../constants/colors';
import VoiceButton from '../components/VoiceButton';

export default function AICoPilotScreen() {
  const { copilotMessages, addCopilotMessage, clearCopilot, user } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (copilotMessages.length === 0) {
      addCopilotMessage({
        role: 'assistant',
        content:
          "Namaste! 🙏 I'm your AI agricultural assistant. You can:\n\n• 📸 Share a photo of a diseased crop\n• 🎙️ Ask anything about farming\n• 🌱 Get crop suggestions for your area\n\nHow can I help you today?",
      });
    }
  }, []);

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, [copilotMessages]);

  const handleImagePick = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      quality: 0.7,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];

    addCopilotMessage({ role: 'user', content: '📸 Photo sent for diagnosis' });
    setLoading(true);

    try {
      const reply = await askCoPilotDirect(
        'Please diagnose the crop disease in this image and suggest treatment.',
        asset.base64 ?? undefined,
        copilotMessages.map((m) => ({ role: m.role, content: m.content })) as ChatMessage[]
      );
      addCopilotMessage({ role: 'assistant', content: reply });
      speak(reply, user?.language ?? 'en');
    } catch (err) {
      const errMsg = 'Sorry, I could not analyze the image. Please try again.';
      addCopilotMessage({ role: 'assistant', content: errMsg });
      speak(errMsg);
    }
    setLoading(false);
  };

  const handleVoiceAsk = async () => {
    if (isRecording) {
      // Stop and process
      setIsRecording(false);
      const uri = await stopRecording();
      if (!uri) return;
      const { text } = await transcribeAudioFile(uri);
      if (!text.trim()) return;

      addCopilotMessage({ role: 'user', content: text });
      setLoading(true);
      try {
        const reply = await askCoPilotDirect(
          text,
          undefined,
          copilotMessages.map((m) => ({ role: m.role, content: m.content })) as ChatMessage[]
        );
        addCopilotMessage({ role: 'assistant', content: reply });
        speak(reply, user?.language ?? 'en');
      } catch (_) {
        const errMsg = 'Sorry, something went wrong. Please try again.';
        addCopilotMessage({ role: 'assistant', content: errMsg });
        speak(errMsg);
      }
      setLoading(false);
    } else {
      setIsRecording(true);
      await startRecording();
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <LinearGradient colors={['#558B2F', '#689F38']} style={styles.header}>
        <View style={styles.headerContent}>
          <MaterialIcons name="smart-toy" size={28} color="#fff" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>AI Co-Pilot</Text>
            <Text style={styles.headerSub}>Your personal farming assistant</Text>
          </View>
          <TouchableOpacity onPress={clearCopilot} style={styles.clearBtn}>
            <MaterialIcons name="refresh" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Chat messages */}
      <FlatList
        ref={listRef}
        data={copilotMessages}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => <ChatBubble message={item} />}
        contentContainerStyle={styles.chatList}
        showsVerticalScrollIndicator={false}
      />

      {/* Typing indicator */}
      {loading && (
        <View style={styles.typingRow}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.typingText}>AI is thinking...</Text>
        </View>
      )}

      {/* Input bar */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.cameraBtn} onPress={handleImagePick}>
            <MaterialIcons name="camera-alt" size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.inputHint}>
            {isRecording ? '🔴 Recording... tap mic to send' : 'Hold mic to ask a question'}
          </Text>
          <TouchableOpacity
            style={[styles.micBtn, isRecording && styles.micBtnActive]}
            onPress={handleVoiceAsk}
          >
            <MaterialIcons name={isRecording ? 'stop' : 'mic'} size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ChatBubble({
  message,
}: {
  message: { role: 'user' | 'assistant'; content: string };
}) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
      {!isUser && (
        <View style={styles.aiAvatar}>
          <MaterialIcons name="smart-toy" size={14} color="#fff" />
        </View>
      )}
      <View style={[styles.bubbleContent, isUser ? styles.bubbleContentUser : styles.bubbleContentAI]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAI]}>
          {message.content}
        </Text>
        {!isUser && (
          <TouchableOpacity
            style={styles.speakBtn}
            onPress={() => speak(message.content)}
          >
            <MaterialIcons name="volume-up" size={14} color={COLORS.primary} />
            <Text style={styles.speakBtnText}>Read aloud</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.surface },
  header: { paddingTop: 8, paddingBottom: 14, paddingHorizontal: 16 },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerText: { flex: 1 },
  headerTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.85)', marginTop: 1 },
  clearBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  chatList: { padding: 16, paddingBottom: 20, gap: 12 },
  bubble: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubbleUser: { justifyContent: 'flex-end' },
  bubbleAI: { justifyContent: 'flex-start' },
  aiAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  bubbleContent: { maxWidth: '80%', borderRadius: 16, padding: 12 },
  bubbleContentUser: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleContentAI: { backgroundColor: COLORS.card, borderBottomLeftRadius: 4, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  bubbleText: { fontSize: FONTS.sizes.md, lineHeight: 22 },
  bubbleTextUser: { color: '#fff' },
  bubbleTextAI: { color: COLORS.textPrimary },
  speakBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  speakBtnText: { fontSize: FONTS.sizes.xs, color: COLORS.primary, fontWeight: '600' },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 8 },
  typingText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, backgroundColor: COLORS.card,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  cameraBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  inputHint: { flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.textLight },
  micBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  micBtnActive: { backgroundColor: COLORS.danger },
});
