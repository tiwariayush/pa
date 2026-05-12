/**
 * ActionCard - Renders a typed task action step with icon, status,
 * delegation chip, and action-specific metadata display.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme/theme';
import { useTheme } from '../theme/theme';
import type { TaskAction, TaskActionType } from '../types';

const actionConfig: Record<
  TaskActionType,
  { icon: keyof typeof MaterialIcons.glyphMap; color: string; label: string }
> = {
  research: { icon: 'search', color: colors.info, label: 'Research' },
  purchase: { icon: 'shopping-cart', color: '#F59E0B', label: 'Purchase' },
  email: { icon: 'email', color: '#8B5CF6', label: 'Email' },
  call: { icon: 'phone', color: '#10B981', label: 'Call' },
  book: { icon: 'event-available', color: '#EC4899', label: 'Book' },
  delegate: { icon: 'people', color: '#6366F1', label: 'Delegate' },
  schedule: { icon: 'schedule', color: '#3B82F6', label: 'Schedule' },
  remind: { icon: 'notifications', color: '#F97316', label: 'Remind' },
  track: { icon: 'local-shipping', color: '#0EA5E9', label: 'Track' },
  decide: { icon: 'compare-arrows', color: '#A855F7', label: 'Decide' },
  photo: { icon: 'photo-camera', color: '#64748B', label: 'Photo' },
  checklist: { icon: 'check-box-outline-blank', color: colors.gray[600], label: 'To-do' },
};

const statusConfig: Record<string, { bg: string; iconName: keyof typeof MaterialIcons.glyphMap }> = {
  pending: { bg: colors.gray[100], iconName: 'radio-button-unchecked' },
  in_progress: { bg: colors.info + '15', iconName: 'play-circle-outline' },
  done: { bg: colors.success + '15', iconName: 'check-circle' },
  skipped: { bg: colors.gray[100], iconName: 'remove-circle-outline' },
};

interface ActionCardProps {
  action: TaskAction;
  index: number;
  isLast: boolean;
  onPress?: (action: TaskAction) => void;
  onStatusToggle?: (action: TaskAction) => void;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  action,
  index,
  isLast,
  onPress,
  onStatusToggle,
}) => {
  const theme = useTheme();
  const config = actionConfig[action.type] || actionConfig.checklist;
  const status = statusConfig[action.status] || statusConfig.pending;
  const isDone = action.status === 'done';
  const isSkipped = action.status === 'skipped';

  return (
    <View style={styles.container}>
      {/* Timeline connector */}
      <View style={styles.timelineCol}>
        <TouchableOpacity
          style={[styles.statusCircle, { backgroundColor: status.bg }]}
          onPress={() => onStatusToggle?.(action)}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name={isDone ? 'check-circle' : status.iconName}
            size={18}
            color={isDone ? colors.success : config.color}
          />
        </TouchableOpacity>
        {!isLast && <View style={styles.timelineLine} />}
      </View>

      {/* Content */}
      <TouchableOpacity
        style={[
          styles.card,
          (isDone || isSkipped) && styles.cardDone,
        ]}
        onPress={() => onPress?.(action)}
        activeOpacity={0.7}
      >
        <View style={styles.headerRow}>
          <View style={[styles.typeBadge, { backgroundColor: config.color + '15' }]}>
            <MaterialIcons name={config.icon} size={12} color={config.color} />
            <Text
              style={[
                styles.typeLabel,
                { color: config.color, fontFamily: theme.typography.fontFamily.medium },
              ]}
            >
              {config.label}
            </Text>
          </View>

          {action.assignedTo && (
            <View style={styles.delegationBadge}>
              <MaterialIcons name="person" size={11} color={colors.gray[600]} />
              <Text
                style={[
                  styles.delegationText,
                  { fontFamily: theme.typography.fontFamily.regular },
                ]}
              >
                {action.assignedTo}
              </Text>
            </View>
          )}
        </View>

        <Text
          style={[
            styles.label,
            { fontFamily: theme.typography.fontFamily.medium },
            (isDone || isSkipped) && styles.labelDone,
          ]}
          numberOfLines={2}
        >
          {action.label}
        </Text>

        {/* Action-specific metadata preview */}
        {action.type === 'purchase' && action.metadata?.price && (
          <Text
            style={[
              styles.metaText,
              { fontFamily: theme.typography.fontFamily.regular },
            ]}
          >
            Est. price: {action.metadata.price}
          </Text>
        )}

        {action.type === 'decide' && action.metadata?.options && (
          <Text
            style={[
              styles.metaText,
              { fontFamily: theme.typography.fontFamily.regular },
            ]}
          >
            {(action.metadata.options as any[]).length} options to compare
          </Text>
        )}

        {action.type === 'research' && action.metadata?.query && (
          <Text
            style={[
              styles.metaText,
              { fontFamily: theme.typography.fontFamily.regular },
            ]}
            numberOfLines={1}
          >
            Query: {action.metadata.query}
          </Text>
        )}

        {action.type === 'book' && action.metadata?.provider_name && (
          <Text
            style={[
              styles.metaText,
              { fontFamily: theme.typography.fontFamily.regular },
            ]}
          >
            Provider: {action.metadata.provider_name}
          </Text>
        )}

        {/* Image thumbnail if available */}
        {action.metadata?.image_url && (
          <Image
            source={{ uri: action.metadata.image_url as string }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  timelineCol: {
    width: 32,
    alignItems: 'center',
  },
  statusCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.gray[200],
    marginVertical: 2,
  },
  card: {
    flex: 1,
    marginLeft: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.sm + 2,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gray[200],
    backgroundColor: '#FFFFFF',
  },
  cardDone: {
    opacity: 0.6,
    backgroundColor: colors.gray[50],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  typeLabel: {
    fontSize: 10,
    fontWeight: typography.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  delegationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: 6,
  },
  delegationText: {
    fontSize: 10,
    color: colors.gray[600],
  },
  label: {
    fontSize: typography.sizes.sm,
    color: colors.gray[900],
    fontWeight: typography.weights.medium,
    lineHeight: 19,
  },
  labelDone: {
    textDecorationLine: 'line-through',
    color: colors.gray[400],
  },
  metaText: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
    marginTop: 3,
  },
  thumbnail: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    marginTop: spacing.xs,
  },
});

export default ActionCard;
