import React, { useState } from 'react';
import {
  View, ScrollView, StyleSheet, Text, TouchableOpacity,
  TextInput, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../store/useAppStore';
import { COLORS, FONTS } from '../constants/colors';
import { speak } from '../services/voiceService';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'mr', label: 'मराठी' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'bn', label: 'বাংলা' },
];

const RADII = [5, 10, 15, 25];

export default function ProfileScreen() {
  const { user, setUser, location, setLocation } = useAppStore();
  const [editName, setEditName] = useState(user?.name ?? '');
  const [editVillage, setEditVillage] = useState(user?.village ?? '');
  const [offlineMode, setOfflineMode] = useState(false);

  const handleSave = () => {
    if (!editName.trim()) { Alert.alert('Name required'); return; }
    const updated = {
      ...(user ?? { id: Date.now().toString(), phone: '', trustScore: 0, emergencyContacts: [], language: 'en' }),
      name: editName.trim(),
      village: editVillage.trim(),
    };
    setUser(updated);
    speak(`Profile saved. Welcome ${editName}!`);
  };

  const handleLanguageChange = (code: string) => {
    if (!user) return;
    setUser({ ...user, language: code });
    const lang = LANGUAGES.find((l) => l.code === code);
    speak(`Language set to ${lang?.label ?? code}`, code);
  };

  const handleRadiusChange = (km: number) => {
    if (!location) return;
    setLocation({ ...location, radiusKm: km });
    speak(`Feed radius set to ${km} kilometres.`);
  };

  const trustLevel = (score: number) => {
    if (score >= 100) return { label: 'Village Elder', color: '#D4AF37' };
    if (score >= 50) return { label: 'Trusted Farmer', color: COLORS.primary };
    if (score >= 20) return { label: 'Active Member', color: '#1565C0' };
    return { label: 'Newcomer', color: COLORS.textSecondary };
  };

  const trust = trustLevel(user?.trustScore ?? 0);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <LinearGradient colors={[COLORS.primary, COLORS.primaryLight]} style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(editName || 'U')[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.headerName}>{editName || 'Your Name'}</Text>
          <View style={[styles.trustBadge, { backgroundColor: trust.color + '33' }]}>
            <MaterialIcons name="grain" size={14} color={trust.color} />
            <Text style={[styles.trustBadgeText, { color: trust.color }]}>
              {user?.trustScore ?? 0} Wheat Sheaves · {trust.label}
            </Text>
          </View>
        </LinearGradient>

        {/* Edit profile */}
        <Section title="My Profile">
          <Field label="Name">
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your full name"
              placeholderTextColor={COLORS.textLight}
            />
          </Field>
          <Field label="Village / Area">
            <TextInput
              style={styles.input}
              value={editVillage}
              onChangeText={setEditVillage}
              placeholder="Your village name"
              placeholderTextColor={COLORS.textLight}
            />
          </Field>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </TouchableOpacity>
        </Section>

        {/* Language */}
        <Section title="Voice Language">
          <Text style={styles.sectionNote}>
            All voice responses (TTS) will be spoken in this language.
          </Text>
          <View style={styles.langGrid}>
            {LANGUAGES.map((l) => (
              <TouchableOpacity
                key={l.code}
                style={[styles.langChip, user?.language === l.code && styles.langChipActive]}
                onPress={() => handleLanguageChange(l.code)}
              >
                <Text style={[styles.langText, user?.language === l.code && styles.langTextActive]}>
                  {l.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* Feed radius */}
        <Section title="Local Feed Radius">
          <Text style={styles.sectionNote}>
            Only posts within this distance will appear in your feed.
          </Text>
          <View style={styles.radiusRow}>
            {RADII.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.radiusChip, location?.radiusKm === r && styles.radiusChipActive]}
                onPress={() => handleRadiusChange(r)}
              >
                <Text style={[styles.radiusText, location?.radiusKm === r && styles.radiusTextActive]}>
                  {r}km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* Settings */}
        <Section title="Settings">
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Offline / Low-data mode</Text>
              <Text style={styles.settingNote}>Cache content for weak connectivity</Text>
            </View>
            <Switch
              value={offlineMode}
              onValueChange={setOfflineMode}
              trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
              thumbColor={offlineMode ? COLORS.primary : '#f4f3f4'}
            />
          </View>
        </Section>

        {/* Trust score explainer */}
        <Section title="Trust Score (Wheat Sheaves)">
          <Text style={styles.sectionNote}>
            Community members award Wheat Sheaves 🌾 to helpful posts, reliable buyers, and trustworthy
            resource sharing. Your score builds your reputation in the village.
          </Text>
          <View style={styles.trustBar}>
            <View style={[styles.trustFill, { width: `${Math.min((user?.trustScore ?? 0) / 100 * 100, 100)}%` }]} />
          </View>
          <Text style={styles.trustProgress}>{user?.trustScore ?? 0} / 100 for next level</Text>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.surface },
  scroll: { paddingBottom: 40 },
  header: { paddingTop: 16, paddingBottom: 24, alignItems: 'center', gap: 8 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 36, fontWeight: '800', color: '#fff' },
  headerName: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: '#fff' },
  trustBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
  },
  trustBadgeText: { fontSize: 12, fontWeight: '700' },
  section: {
    backgroundColor: COLORS.card, marginHorizontal: 16, marginTop: 12,
    borderRadius: 16, padding: 16, gap: 12,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3,
  },
  sectionTitle: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.textPrimary },
  sectionNote: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, lineHeight: 18 },
  field: { gap: 4 },
  fieldLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, fontWeight: '600' },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    padding: 10, fontSize: FONTS.sizes.md, color: COLORS.textPrimary,
  },
  saveBtn: {
    backgroundColor: COLORS.primary, padding: 12, borderRadius: 12, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.md },
  langGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  langChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
  },
  langChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  langText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, fontWeight: '600' },
  langTextActive: { color: '#fff' },
  radiusRow: { flexDirection: 'row', gap: 8 },
  radiusChip: {
    flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
  },
  radiusChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  radiusText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, fontWeight: '700' },
  radiusTextActive: { color: '#fff' },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  settingLabel: { fontSize: FONTS.sizes.md, color: COLORS.textPrimary, fontWeight: '600' },
  settingNote: { fontSize: FONTS.sizes.xs, color: COLORS.textLight, marginTop: 2 },
  trustBar: {
    height: 8, backgroundColor: COLORS.border,
    borderRadius: 4, overflow: 'hidden',
  },
  trustFill: { height: '100%', backgroundColor: COLORS.wheat, borderRadius: 4 },
  trustProgress: { fontSize: FONTS.sizes.xs, color: COLORS.textLight, textAlign: 'right' },
});
