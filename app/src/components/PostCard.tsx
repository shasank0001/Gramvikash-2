import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import TagBadge from './TagBadge';
import { Post } from '../store/useAppStore';
import { COLORS, FONTS } from '../constants/colors';
import { TagType } from '../constants/tags';
import { speak, playAudioUrl, stopAudio } from '../services/voiceService';
import { likePost } from '../services/apiService';

interface PostCardProps {
  post: Post;
  onBidPress?: () => void;
  onCommentPress?: () => void;
}

export default function PostCard({ post, onBidPress, onCommentPress }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes ?? 0);
  const [playingAudio, setPlayingAudio] = useState(false);

  const timeAgo = formatTimeAgo(post.timestamp);
  const inventoryPct = post.inventory
    ? (post.inventory.remaining / post.inventory.total) * 100
    : null;

  const handleLike = async () => {
    setLiked(!liked);
    setLikeCount((c) => c + (liked ? -1 : 1));
    try {
      await likePost(post.id);
    } catch (_) {}
  };

  const handleTTS = () => {
    speak(post.text);
  };

  const handlePlayAudio = async () => {
    if (playingAudio) {
      await stopAudio();
      setPlayingAudio(false);
    } else {
      if (post.audioUrl) {
        setPlayingAudio(true);
        await playAudioUrl(post.audioUrl);
        setPlayingAudio(false);
      }
    }
  };

  return (
    <View style={[styles.card, post.isPinned && styles.pinnedCard]}>
      {post.isPinned && (
        <View style={styles.pinnedBanner}>
          <MaterialIcons name="push-pin" size={12} color={COLORS.warning} />
          <Text style={styles.pinnedText}>Pinned Alert</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{post.authorName[0]?.toUpperCase()}</Text>
        </View>
        <View style={styles.headerInfo}>
          <View style={styles.headerRow}>
            <Text style={styles.authorName}>{post.authorName}</Text>
            {/* Trust score wheat sheaves */}
            <View style={styles.trustRow}>
              <MaterialIcons name="grain" size={12} color={COLORS.wheat} />
              <Text style={styles.trustScore}>{post.authorTrust}</Text>
            </View>
          </View>
          <Text style={styles.timestamp}>{timeAgo}</Text>
        </View>
        <TagBadge tagId={post.tag as TagType} size="sm" />
      </View>

      {/* Content */}
      {post.imageUrl && (
        <Image source={{ uri: post.imageUrl }} style={styles.image} resizeMode="cover" />
      )}

      <Text style={styles.postText}>{post.text}</Text>

      {/* AI Analysis chip */}
      {post.aiAnalysis && (
        <View style={styles.aiChip}>
          <MaterialIcons name="smart-toy" size={13} color={COLORS.primaryLight} />
          <Text style={styles.aiText}>{post.aiAnalysis}</Text>
        </View>
      )}

      {/* Inventory bar for sell posts */}
      {post.inventory && (
        <View style={styles.inventoryContainer}>
          <View style={styles.inventoryLabelRow}>
            <Text style={styles.inventoryLabel}>
              Available: {post.inventory.remaining}/{post.inventory.total} {post.inventory.unit}
            </Text>
          </View>
          <View style={styles.inventoryBarBg}>
            <View style={[styles.inventoryBarFill, { width: `${inventoryPct ?? 0}%` }]} />
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
          <MaterialIcons
            name={liked ? 'favorite' : 'favorite-border'}
            size={18}
            color={liked ? COLORS.danger : COLORS.textSecondary}
          />
          <Text style={styles.actionText}>{likeCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={onCommentPress}>
          <MaterialIcons name="chat-bubble-outline" size={18} color={COLORS.textSecondary} />
          <Text style={styles.actionText}>{post.commentCount}</Text>
        </TouchableOpacity>

        {/* Voice playback */}
        {post.audioUrl && (
          <TouchableOpacity style={styles.actionBtn} onPress={handlePlayAudio}>
            <MaterialIcons
              name={playingAudio ? 'stop' : 'play-circle-outline'}
              size={18}
              color={COLORS.voice}
            />
            <Text style={[styles.actionText, { color: COLORS.voice }]}>
              {playingAudio ? 'Stop' : 'Play'}
            </Text>
          </TouchableOpacity>
        )}

        {/* TTS read-aloud */}
        <TouchableOpacity style={styles.actionBtn} onPress={handleTTS}>
          <MaterialIcons name="volume-up" size={18} color={COLORS.primary} />
          <Text style={[styles.actionText, { color: COLORS.primary }]}>Read</Text>
        </TouchableOpacity>

        {/* Bid button for Mandi posts */}
        {post.tag === 'sell_harvest' && onBidPress && (
          <TouchableOpacity style={styles.bidBtn} onPress={onBidPress}>
            <MaterialIcons name="gavel" size={14} color="#fff" />
            <Text style={styles.bidBtnText}>Bid</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  pinnedCard: {
    borderWidth: 1.5,
    borderColor: COLORS.warning,
  },
  pinnedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  pinnedText: {
    fontSize: 11,
    color: COLORS.warning,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  headerInfo: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  authorName: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  trustScore: { fontSize: FONTS.sizes.xs, color: COLORS.wheat, fontWeight: '600' },
  timestamp: { fontSize: FONTS.sizes.xs, color: COLORS.textLight, marginTop: 1 },
  image: { width: '100%', height: 180, borderRadius: 10, marginBottom: 10 },
  postText: { fontSize: FONTS.sizes.md, color: COLORS.textPrimary, lineHeight: 22, marginBottom: 10 },
  aiChip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FFF4',
    borderRadius: 8,
    padding: 8,
    gap: 6,
    marginBottom: 10,
  },
  aiText: { flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.primaryDark, lineHeight: 18 },
  inventoryContainer: { marginBottom: 10 },
  inventoryLabelRow: { marginBottom: 4 },
  inventoryLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, fontWeight: '600' },
  inventoryBarBg: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  inventoryBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  bidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
    marginLeft: 'auto',
  },
  bidBtnText: { color: '#fff', fontSize: FONTS.sizes.sm, fontWeight: '700' },
});
