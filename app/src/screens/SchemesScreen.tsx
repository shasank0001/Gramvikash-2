import React, { useState } from 'react';
import {
  View, FlatList, StyleSheet, Text, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../store/useAppStore';
import { runSchemeChat, ChatMessage } from '../services/openaiClient';
import { speak, startRecording, stopRecording, transcribeAudioFile } from '../services/voiceService';
import { COLORS, FONTS } from '../constants/colors';

export default function SchemesScreen() {
  const {
    schemeMessages, addSchemeMessage, clearScheme, user,
  } = useAppStore();
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const beginSession = async () => {
    clearScheme();
    setChatHistory([]);
    setDone(false);
    setLoading(true);
    try {
      const result = await runSchemeChat([]);
      const question = result.question ?? 'How can I help you find the right scheme?';
      addSchemeMessage({ role: 'assistant', content: question });
      speak(question, user?.language ?? 'en');
    } catch (_) {
      addSchemeMessage({
        role: 'assistant',
        content: 'Sorry, could not start the session. Please check your internet connection.',
      });
    }
    setLoading(false);
  };

  const handleVoiceAnswer = async () => {
    if (schemeMessages.length === 0) return;
    if (isRecording) {
      setIsRecording(false);
      const uri = await stopRecording();
      if (!uri) return;
      const { text } = await transcribeAudioFile(uri);
      if (!text.trim()) return;
      await sendAnswer(text);
    } else {
      setIsRecording(true);
      await startRecording();
    }
  };

  const sendAnswer = async (answer: string) => {
    addSchemeMessage({ role: 'user', content: answer });
    setLoading(true);
    try {
      const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: answer }];
      setChatHistory(newHistory);
      const result = await runSchemeChat(newHistory);
      const responseText = result.done ? result.result! : result.question!;
      addSchemeMessage({ role: 'assistant', content: responseText });
      speak(responseText, user?.language ?? 'en');
      if (result.done) setDone(true);
      else setChatHistory([...newHistory, { role: 'assistant', content: responseText }]);
    } catch (_) {
      addSchemeMessage({ role: 'assistant', content: 'Sorry, could not process that. Please try again.' });
    }
    setLoading(false);
  };

  const renderIntro = () => (
    <View style={styles.introCard}>
      <MaterialIcons name="account-balance" size={48} color={COLORS.primary} />
      <Text style={styles.introTitle}>Government Scheme Advisor</Text>
      <Text style={styles.introText}>
        I'll ask you a few simple questions about your farm and financial situation to find which
        government schemes you qualify for — including PM-KISAN, crop insurance, subsidies, and loans.
      </Text>
      <Text style={styles.introSub}>All in your local language. No paperwork needed.</Text>
      <TouchableOpacity style={styles.startBtn} onPress={beginSession}>
        <MaterialIcons name="mic" size={20} color="#fff" />
        <Text style={styles.startBtnText}>Start Voice Interview</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#BF360C', '#E64A19']} style={styles.header}>
        <Text style={styles.headerTitle}>🏛️ Govt Schemes</Text>
        <Text style={styles.headerSub}>Find schemes you qualify for</Text>
      </LinearGradient>

      {schemeMessages.length === 0 ? (
        <View style={styles.center}>{renderIntro()}</View>
      ) : (
        <>
          <FlatList
            data={schemeMessages}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <View style={[styles.bubble, item.role === 'user' ? styles.bubbleUser : styles.bubbleAI]}>
                <View style={[styles.bubbleInner, item.role === 'user' ? styles.innerUser : styles.innerAI]}>
                  <Text style={[styles.bubbleText, item.role === 'user' ? styles.textUser : styles.textAI]}>
                    {item.content}
                  </Text>
                  {item.role === 'assistant' && (
                    <TouchableOpacity style={styles.speakBtn} onPress={() => speak(item.content)}>
                      <MaterialIcons name="volume-up" size={13} color={COLORS.primary} />
                      <Text style={styles.speakBtnText}>Read aloud</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
            contentContainerStyle={styles.chatList}
          />

          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingText}>Processing...</Text>
            </View>
          )}

          {!done ? (
            <View style={styles.inputBar}>
              <Text style={styles.inputHint}>
                {isRecording ? '🔴 Recording... tap to send answer' : 'Tap mic to answer'}
              </Text>
              <TouchableOpacity
                style={[styles.micBtn, isRecording && styles.micBtnActive]}
                onPress={handleVoiceAnswer}
                disabled={loading}
              >
                <MaterialIcons name={isRecording ? 'stop' : 'mic'} size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.restartBtn} onPress={beginSession}>
              <MaterialIcons name="refresh" size={18} color="#fff" />
              <Text style={styles.restartText}>Start Over</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.surface },
  header: { paddingTop: 8, paddingBottom: 14, paddingHorizontal: 16 },
  headerTitle: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  introCard: {
    backgroundColor: COLORS.card, borderRadius: 20,
    padding: 24, alignItems: 'center', gap: 12,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,
  },
  introTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center' },
  introText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  introSub: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '600', textAlign: 'center' },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, marginTop: 4,
  },
  startBtnText: { color: '#fff', fontSize: FONTS.sizes.md, fontWeight: '700' },
  chatList: { padding: 16, gap: 10, paddingBottom: 20 },
  bubble: { flexDirection: 'row' },
  bubbleUser: { justifyContent: 'flex-end' },
  bubbleAI: { justifyContent: 'flex-start' },
  bubbleInner: { maxWidth: '80%', borderRadius: 16, padding: 12 },
  innerUser: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  innerAI: {
    backgroundColor: COLORS.card, borderBottomLeftRadius: 4,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  bubbleText: { fontSize: FONTS.sizes.md, lineHeight: 22 },
  textUser: { color: '#fff' },
  textAI: { color: COLORS.textPrimary },
  speakBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  speakBtnText: { fontSize: FONTS.sizes.xs, color: COLORS.primary, fontWeight: '600' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  loadingText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, backgroundColor: COLORS.card,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  inputHint: { flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.textLight },
  micBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  micBtnActive: { backgroundColor: COLORS.danger },
  restartBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: COLORS.primary, margin: 16, padding: 14, borderRadius: 14,
  },
  restartText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.md },
});
