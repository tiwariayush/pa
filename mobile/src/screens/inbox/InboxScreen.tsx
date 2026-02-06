/**
 * Inbox Screen - Shows captured and parsed items awaiting triage.
 * Professional list with domain colors, status badges, and empty state.
 */

import React, { useEffect, useCallback } from 'react';
import {
  StyleSheet,
  FlatList,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { colors, spacing, typography, useTheme } from '../../theme/theme';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import { useTasks, useTaskList, useTaskLoading } from '../../stores/TaskStore';
import type { RootStackParamList, Task, TaskStatus } from '../../types';

type InboxNav = StackNavigationProp<RootStackParamList, 'Main'>;

const statusLabels: Record<string, { label: string; color: string }> = {
  captured: { label: 'Captured', color: colors.statuses.captured },
  parsed: { label: 'Parsed', color: colors.statuses.parsed },
  triaged: { label: 'Triaged', color: colors.statuses.triaged },
};

const InboxScreen: React.FC = () => {
  const navigation = useNavigation<InboxNav>();
  const theme = useTheme();
  const { fetchTasks, refreshTasks } = useTasks();
  const tasks = useTaskList();
  const isLoading = useTaskLoading();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const inboxStatuses: TaskStatus[] = ['captured', 'parsed', 'triaged'];
  const inboxTasks = tasks.filter((t: Task) => inboxStatuses.includes(t.status));

  const handleTaskPress = useCallback(
    (task: Task) => {
      navigation.navigate('TaskDetail', { taskId: task.id });
    },
    [navigation]
  );

  const renderItem = ({ item, index }: { item: Task; index: number }) => {
    const domainColor =
      colors.domains[item.domain?.toLowerCase() as keyof typeof colors.domains] ||
      colors.gray[400];
    const statusInfo = statusLabels[item.status] || {
      label: item.status,
      color: colors.gray[500],
    };

    return (
      <TouchableOpacity
        onPress={() => handleTaskPress(item)}
        activeOpacity={0.7}
      >
        <Card accentColor={domainColor} style={styles.itemCard}>
          <View style={styles.itemHeader}>
            <Text
              style={[
                styles.itemTitle,
                { fontFamily: theme.typography.fontFamily.medium },
              ]}
              numberOfLines={2}
            >
              {item.title}
            </Text>
            <MaterialIcons name="chevron-right" size={18} color={colors.gray[300]} />
          </View>

          {item.description ? (
            <Text
              style={[
                styles.itemDescription,
                { fontFamily: theme.typography.fontFamily.regular },
              ]}
              numberOfLines={2}
            >
              {item.description}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <View style={[styles.badge, { backgroundColor: statusInfo.color + '18' }]}>
              <View style={[styles.badgeDot, { backgroundColor: statusInfo.color }]} />
              <Text
                style={[
                  styles.badgeText,
                  { color: statusInfo.color, fontFamily: theme.typography.fontFamily.medium },
                ]}
              >
                {statusInfo.label}
              </Text>
            </View>

            {item.domain && (
              <Text
                style={[
                  styles.domainLabel,
                  { fontFamily: theme.typography.fontFamily.regular },
                ]}
              >
                {item.domain.toLowerCase()}
              </Text>
            )}

            {item.priority && (
              <Text
                style={[
                  styles.priorityLabel,
                  { fontFamily: theme.typography.fontFamily.regular },
                ]}
              >
                {item.priority.toLowerCase()}
              </Text>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (!inboxTasks.length && !isLoading) {
    return (
      <Screen style={styles.container}>
        <Card>
          <EmptyState
            icon="📥"
            title="Inbox is clear"
            message="Captured notes and ideas will land here, waiting to be turned into actionable tasks."
          />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <View style={styles.headerRow}>
        <Text
          style={[
            styles.countText,
            { fontFamily: theme.typography.fontFamily.regular },
          ]}
        >
          {inboxTasks.length} item{inboxTasks.length !== 1 ? 's' : ''} to review
        </Text>
      </View>

      <FlatList
        data={inboxTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshTasks} />
        }
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  countText: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  itemCard: {
    marginBottom: spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  itemTitle: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.gray[900],
    marginRight: spacing.sm,
  },
  itemDescription: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginTop: spacing.xs,
    lineHeight: 19,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  badgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  domainLabel: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
  },
  priorityLabel: {
    fontSize: typography.sizes.xs,
    color: colors.gray[400],
  },
});

export default InboxScreen;
