import React, { useState } from 'react';
import {
  View, FlatList, StyleSheet, Text, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import PostCard from '../components/PostCard';
import VoiceButton from '../components/VoiceButton';
import { useAppStore, Post } from '../store/useAppStore';
import { speak } from '../services/voiceService';
import { COLORS, FONTS } from '../constants/colors';

export default function MandiScreen() {
  const { mandiListings, addMandiListing, user } = useAppStore();
  const [bidModal, setBidModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidUnit, setBidUnit] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [newCrop, setNewCrop] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newUnit, setNewUnit] = useState('kg');
  const [newPrice, setNewPrice] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);

  const CROP_ICONS: Record<string, string> = {
    wheat: '🌾', rice: '🌾', tomato: '🍅', onion: '🧅', potato: '🥔',
    soybean: '🌻', cotton: '🪡', maize: '🌽', garlic: '🧄', chilli: '🌶️',
    turmeric: '🟡', sugarcane: '🍬', coconut: '🥥', coriander: '🌿',
    dal: '🟢', pulses: '🟤', default: '🌱',
  };

  const cropIcon = (name: string) => {
    const key = name.toLowerCase();
    return Object.keys(CROP_ICONS).find((k) => key.includes(k))
      ? CROP_ICONS[Object.keys(CROP_ICONS).find((k) => key.includes(k))!]
      : CROP_ICONS.default;
  };

  const openBidModal = (post: Post) => {
    setSelectedPost(post);
    setBidAmount('');
    setBidUnit(post.inventory?.unit ?? 'kg');
    setBidModal(true);
  };

  const submitBid = () => {
    if (!selectedPost || !bidAmount) return;
    setSubmitting(true);
    setTimeout(() => {
      Alert.alert('Bid Placed! 🎉', `Your bid of ₹${bidAmount}/${bidUnit} has been submitted.`);
      speak(`Bid of ${bidAmount} rupees per ${bidUnit} placed successfully.`);
      setBidModal(false);
      setSubmitting(false);
    }, 800);
  };

  const submitNewListing = () => {
    if (!newCrop.trim() || !newQty || !newPrice) {
      Alert.alert('Missing details', 'Please fill crop name, quantity and price.');
      return;
    }
    const icon = cropIcon(newCrop);
    const post: Post = {
      id: `mv-${Date.now()}`,
      authorId: user?.id ?? 'me',
      authorName: user?.name ?? 'You',
      authorTrust: user?.trustScore ?? 80,
      tag: 'mandi',
      text: `${icon} Selling ${newCrop} – ${newQty} ${newUnit} available at ₹${newPrice}/${newUnit}. Fresh from farm, direct pickup.`,
      timestamp: Date.now(),
      location: { lat: 19.076, lng: 72.877 },
      likes: 0,
      commentCount: 0,
      inventory: { total: parseFloat(newQty), remaining: parseFloat(newQty), unit: newUnit },
      bids: [],
      aiAnalysis: `Listed via Digital Mandi – ₹${newPrice}/${newUnit}`,
    };
    addMandiListing(post);
    speak(`Your ${newCrop} listing has been added to the Digital Mandi!`, user?.language ?? 'en');
    setAddModal(false);
    setNewCrop(''); setNewQty(''); setNewPrice(''); setNewUnit('kg');
  };

  const totalBids = mandiListings.reduce((sum, p) => sum + (p.bids?.length ?? 0), 0);
  const available = mandiListings.filter((p) => (p.inventory?.remaining ?? 1) > 0).length;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <LinearGradient colors={['#1B6B2F', '#2E7D32']} style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>🌾 Digital Mandi</Text>
            <Text style={styles.headerSub}>Live harvest auctions near you</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setAddModal(true)}>
            <MaterialIcons name="add" size={20} color="#fff" />
            <Text style={styles.addBtnText}>Sell</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{mandiListings.length}</Text>
          <Text style={styles.statLabel}>Active Listings</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNum}>{totalBids}</Text>
          <Text style={styles.statLabel}>Total Bids</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNum}>{available}</Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>
      </View>

      {/* Voice hint banner */}
      <View style={styles.voiceHint}>
        <MaterialIcons name="mic" size={15} color={COLORS.primary} />
        <Text style={styles.voiceHintText}>
          Say <Text style={{ fontWeight: '800' }}>"I'm selling 50 kg wheat at ₹28 per kg"</Text> to auto-list
        </Text>
      </View>

      <FlatList
        data={mandiListings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard post={item} onBidPress={() => openBidModal(item)} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <VoiceButton />

      {/* Bid Modal */}
      <Modal visible={bidModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Place Your Bid</Text>
            {selectedPost && (
              <Text style={styles.modalSub}>
                {selectedPost.authorName} — {selectedPost.inventory?.remaining}{' '}
                {selectedPost.inventory?.unit} available
              </Text>
            )}
            <View style={styles.bidInputRow}>
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                placeholder="Price (₹)"
                keyboardType="numeric"
                value={bidAmount}
                onChangeText={setBidAmount}
                placeholderTextColor={COLORS.textLight}
              />
              <TextInput
                style={[styles.textInput, { width: 80 }]}
                placeholder="Unit"
                value={bidUnit}
                onChangeText={setBidUnit}
                placeholderTextColor={COLORS.textLight}
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setBidModal(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitBid} style={styles.bidBtn} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <MaterialIcons name="gavel" size={16} color="#fff" />
                    <Text style={styles.bidBtnText}>Place Bid</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Listing Modal */}
      <Modal visible={addModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>📢 Add New Listing</Text>
            <Text style={styles.modalSub}>Or say it via the mic button below</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Crop name (e.g. Wheat, Tomato)"
              value={newCrop}
              onChangeText={setNewCrop}
              placeholderTextColor={COLORS.textLight}
            />
            <View style={styles.bidInputRow}>
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                placeholder="Quantity"
                keyboardType="numeric"
                value={newQty}
                onChangeText={setNewQty}
                placeholderTextColor={COLORS.textLight}
              />
              <TextInput
                style={[styles.textInput, { width: 80 }]}
                placeholder="Unit"
                value={newUnit}
                onChangeText={setNewUnit}
                placeholderTextColor={COLORS.textLight}
              />
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Price per unit (₹)"
              keyboardType="numeric"
              value={newPrice}
              onChangeText={setNewPrice}
              placeholderTextColor={COLORS.textLight}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setAddModal(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitNewListing} style={styles.bidBtn}>
                <MaterialIcons name="storefront" size={16} color="#fff" />
                <Text style={styles.bidBtnText}>Post Listing</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.surface },
  header: { paddingTop: 8, paddingBottom: 16, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.sm },
  statsRow: {
    flexDirection: 'row', backgroundColor: COLORS.card,
    paddingVertical: 14, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.primary },
  statLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: COLORS.border },
  voiceHint: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#E8F5E9', paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  voiceHintText: { flex: 1, fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, lineHeight: 18 },
  list: { paddingTop: 12, paddingBottom: 120 },
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14 },
  modalTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary },
  modalSub: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  bidInputRow: { flexDirection: 'row', gap: 10 },
  textInput: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 12,
    padding: 12, fontSize: FONTS.sizes.md, color: COLORS.textPrimary,
  },
  modalActions: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  cancelBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.border },
  cancelText: { fontWeight: '700', color: COLORS.textSecondary },
  bidBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12,
    backgroundColor: COLORS.accent, minWidth: 100, justifyContent: 'center',
  },
  bidBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.md },
});
