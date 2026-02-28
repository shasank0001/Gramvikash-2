import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { WeatherAlert } from '../store/useAppStore';
import { COLORS } from '../constants/colors';
import { speak } from '../services/voiceService';

const SEVERITY_COLORS = {
  low: { bg: '#E8F5E9', text: '#2E7D32', icon: 'info' as const },
  medium: { bg: '#FFF8E1', text: '#F57F17', icon: 'warning' as const },
  high: { bg: '#FFEBEE', text: '#C62828', icon: 'thunderstorm' as const },
};

export default function WeatherAlertStrip({ alerts }: { alerts: WeatherAlert[] }) {
  if (!alerts.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.strip}
      contentContainerStyle={styles.content}
    >
      {alerts.map((alert) => {
        const style = SEVERITY_COLORS[alert.severity];
        return (
          <TouchableOpacity
            key={alert.id}
            style={[styles.chip, { backgroundColor: style.bg }]}
            onPress={() => speak(alert.message)}
          >
            <MaterialIcons name={style.icon} size={14} color={style.text} />
            <Text style={[styles.text, { color: style.text }]} numberOfLines={1}>
              {alert.message}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  strip: { maxHeight: 44, marginBottom: 4 },
  content: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  text: { fontSize: 12, fontWeight: '600', maxWidth: 240 },
});
