import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TagType, TAG_MAP } from '../constants/tags';

interface TagBadgeProps {
  tagId: TagType;
  onPress?: () => void;
  size?: 'sm' | 'md';
}

export default function TagBadge({ tagId, onPress, size = 'md' }: TagBadgeProps) {
  const tag = TAG_MAP[tagId];
  if (!tag) return null;

  const isSmall = size === 'sm';

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      style={[
        styles.badge,
        { backgroundColor: tag.background },
        isSmall && styles.badgeSm,
      ]}
    >
      <MaterialIcons
        name={tag.icon as any}
        size={isSmall ? 11 : 14}
        color={tag.color}
        style={{ marginRight: 3 }}
      />
      <Text style={[styles.label, { color: tag.color }, isSmall && styles.labelSm]}>
        {tag.label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  labelSm: {
    fontSize: 10,
  },
});
