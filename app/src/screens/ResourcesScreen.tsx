import React, { useState } from 'react';
import {
  View, ScrollView, StyleSheet, Text, TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import VoiceButton from '../components/VoiceButton';
import { COLORS, FONTS } from '../constants/colors';
import { speak } from '../services/voiceService';

type ResourceType = 'equipment' | 'transport' | 'storage';

interface ResourceItem {
  id: string;
  type: ResourceType;
  ownerName: string;
  ownerTrust: number;
  title: string;
  description: string;
  price: string;
  available: boolean;
  distance: number;
}

const MOCK_RESOURCES: ResourceItem[] = [
  {
    id: '1', type: 'equipment', ownerName: 'Ramesh Patil', ownerTrust: 42,
    title: 'Mahindra 575 Tractor', description: 'Available for ploughing and transport. Full tank.',
    price: '₹800/day', available: true, distance: 1.2,
  },
  {
    id: '2', type: 'transport', ownerName: 'Sanjay Kumar', ownerTrust: 38,
    title: 'Truck to Nashik Mandi', description: 'Leaving Tuesday 5 AM. 3 seats for produce remaining.',
    price: '₹400/quintal', available: true, distance: 2.4,
  },
  {
    id: '3', type: 'storage', ownerName: 'Meera Devi', ownerTrust: 55,
    title: 'Cold Storage Space', description: '50 bags capacity free. Available for 2 weeks.',
    price: '₹60/bag/week', available: true, distance: 0.8,
  },
  {
    id: '4', type: 'equipment', ownerName: 'Vijay Jadhav', ownerTrust: 29,
    title: 'Sprayer (8L Backpack)', description: 'Clean sprayer for pesticide/fertilizer. Available today.',
    price: '₹100/day', available: true, distance: 1.8,
  },
];

const TYPE_LABELS: Record<ResourceType, { label: string; icon: keyof typeof MaterialIcons.glyphMap; color: string }> = {
  equipment: { label: 'Equipment', icon: 'agriculture', color: '#1565C0' },
  transport: { label: 'Transport', icon: 'local-shipping', color: '#E65100' },
  storage: { label: 'Storage', icon: 'warehouse', color: '#6A1B9A' },
};

export default function ResourcesScreen() {
  const [activeTab, setActiveTab] = useState<ResourceType | 'all'>('all');

  const filtered = activeTab === 'all'
    ? MOCK_RESOURCES
    : MOCK_RESOURCES.filter((r) => r.type === activeTab);

  const handleRequest = (item: ResourceItem) => {
    speak(`Contacting ${item.ownerName} for ${item.title}. Their trust score is ${item.ownerTrust} wheat sheaves.`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <LinearGradient colors={['#1565C0', '#1976D2']} style={styles.header}>
        <Text style={styles.headerTitle}>🤝 Resource Pool</Text>
        <Text style={styles.headerSub}>Share equipment, transport & storage with your village</Text>
      </LinearGradient>

      {/* Tab bar */}
      <View style={styles.tabs}>
        {(['all', 'equipment', 'transport', 'storage'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            {tab !== 'all' && (
              <MaterialIcons
                name={TYPE_LABELS[tab].icon}
                size={14}
                color={activeTab === tab ? '#fff' : COLORS.textSecondary}
              />
            )}
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'all' ? 'All' : TYPE_LABELS[tab].label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ResourceCard item={item} onRequest={() => handleRequest(item)} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <VoiceButton />
    </SafeAreaView>
  );
}

function ResourceCard({ item, onRequest }: { item: ResourceItem; onRequest: () => void }) {
  const meta = TYPE_LABELS[item.type];
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.typeChip, { backgroundColor: meta.color + '18' }]}>
          <MaterialIcons name={meta.icon} size={14} color={meta.color} />
          <Text style={[styles.typeChipText, { color: meta.color }]}>{meta.label}</Text>
        </View>
        <Text style={styles.distance}>📍 {item.distance}km away</Text>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
      <View style={styles.cardFooter}>
        <View style={styles.ownerRow}>
          <View style={styles.ownerAvatar}>
            <Text style={styles.ownerAvatarText}>{item.ownerName[0]}</Text>
          </View>
          <View>
            <Text style={styles.ownerName}>{item.ownerName}</Text>
            <View style={styles.trustRow}>
              <MaterialIcons name="grain" size={11} color={COLORS.wheat} />
              <Text style={styles.trust}>{item.ownerTrust}</Text>
            </View>
          </View>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{item.price}</Text>
          <TouchableOpacity style={styles.requestBtn} onPress={onRequest}>
            <Text style={styles.requestBtnText}>Request</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.surface },
  header: { paddingTop: 8, paddingBottom: 16, paddingHorizontal: 16 },
  headerTitle: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  tabs: {
    flexDirection: 'row', gap: 8, padding: 12,
    backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: '#fff' },
  list: { padding: 16, paddingBottom: 120, gap: 12 },
  card: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 16,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  typeChipText: { fontSize: 11, fontWeight: '700' },
  distance: { fontSize: 11, color: COLORS.textLight },
  title: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  description: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ownerAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  ownerAvatarText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  ownerName: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textPrimary },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  trust: { fontSize: 10, color: COLORS.wheat, fontWeight: '600' },
  priceRow: { alignItems: 'flex-end', gap: 4 },
  price: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.primary },
  requestBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 10,
  },
  requestBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
