import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/colors';
import { HomeChatMessage } from '../store/useAppStore';
import { speak } from '../services/voiceService';

interface ChatBubbleProps {
  message: HomeChatMessage;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m} ${ampm}`;
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <View style={styles.systemContainer}>
        <View style={styles.systemBubble}>
          <MaterialIcons name="info-outline" size={13} color={COLORS.textLight} />
          <Text style={styles.systemText}>{message.content}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAI]}>
      {!isUser && (
        <View style={styles.aiAvatar}>
          <MaterialIcons name="smart-toy" size={16} color="#fff" />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAI,
        ]}
      >
        {message.isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={isUser ? '#fff' : COLORS.primary} />
            <Text style={[styles.loadingText, isUser && { color: 'rgba(255,255,255,0.8)' }]}>
              Processing...
            </Text>
          </View>
        ) : (
          <>
            {message.intent && !isUser && (
              <View style={styles.intentChip}>
                <MaterialIcons name="auto-awesome" size={11} color={COLORS.accent} />
                <Text style={styles.intentText}>{message.intent}</Text>
              </View>
            )}
            <Text style={[styles.content, isUser ? styles.contentUser : styles.contentAI]}>
              {message.content}
            </Text>
            <View style={styles.footer}>
              <Text style={[styles.time, isUser ? styles.timeUser : styles.timeAI]}>
                {formatTime(message.timestamp)}
              </Text>
              {!isUser && (
                <TouchableOpacity
                  style={styles.speakBtn}
                  onPress={() => speak(message.content)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons name="volume-up" size={14} color={COLORS.primary} />
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </View>
      {isUser && (
        <View style={styles.userAvatar}>
          <MaterialIcons name="person" size={16} color="#fff" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  rowAI: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.voice,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 60,
  },
  bubbleUser: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
    elevation: 1,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  bubbleAI: {
    backgroundColor: COLORS.card,
    borderBottomLeftRadius: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  content: {
    fontSize: FONTS.sizes.md,
    lineHeight: 22,
  },
  contentUser: {
    color: '#fff',
  },
  contentAI: {
    color: COLORS.textPrimary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  time: {
    fontSize: 10,
  },
  timeUser: {
    color: 'rgba(255,255,255,0.6)',
  },
  timeAI: {
    color: COLORS.textLight,
  },
  speakBtn: {
    marginLeft: 8,
  },
  intentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  intentText: {
    fontSize: 10,
    color: COLORS.accent,
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  systemContainer: {
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  systemBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  systemText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
});
