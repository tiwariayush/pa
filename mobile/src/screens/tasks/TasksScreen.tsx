/**
 * Tasks Screen - Full task list with domain-colored accents,
 * priority indicators, and polished card layout.
 */

import React, { useEffect, useCallback } from 'react';
import {
  StyleSheet,
  FlatList,
  View,
  Text,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { colors, spacing, typography, useTheme } from '../../theme/theme';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import {
  useTasks,
  useTaskList,
  useTaskLoading,
  useTaskError,
} from '../../stores/TaskStore';
import type { RootStackParamList, Task } from '../../types';

type TasksNav = StackNavigationProp<RootStackParamList, 'Main'>;

const priorityConfig: Record<string, { color: string; icon: keyof typeof MaterialIcons.glyphMap }> = {
  critical: { color: colors.priorities.critical, icon: 'priority-high' },
  high: { color: colors.priorities.high, icon: 'arrow-upward' },
  medium: { color: colors.priorities.medium, icon: 'remove' },
  low: { color: colors.priorities.low, icon: 'arrow-downward' },
  someday: { color: colors.priorities.someday, icon: 'schedule' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  captured: { label: 'Captured', color: colors.statuses.captured },
  parsed: { label: 'Parsed', color: colors.statuses.parsed },
  triaged: { label: 'Triaged', color: colors.statuses.triaged },
  planned: { label: 'Planned', color: colors.statuses.planned },
  scheduled: { label: 'Scheduled', color: colors.statuses.scheduled },
  in_progress: { label: 'In Progress', color: colors.statuses.in_progress },
  done: { label: 'Done', color: colors.statuses.done },
  cancelled: { label: 'Cancelled', color: colors.statuses.cancelled },
};

const TasksScreen: React.FC = () => {
  const navigation = useNavigation<TasksNav>();
  const theme = useTheme();
  const { fetchTasks, refreshTasks } = useTasks();
  const tasks = useTaskList();
  const isLoading = useTaskLoading();
  const error = useTaskError();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleTaskPress = useCallback(
    (task: Task) => {
      navigation.navigate('TaskDetail', { taskId: task.id });
    },
    [navigation]
  );

  const renderTask = ({ item }: { item: Task }) => {
    const domainColor =
      colors.domains[item.domain?.toLowerCase() as keyof typeof colors.domains] ||
      colors.gray[400];
    const priority = priorityConfig[item.priority?.toLowerCase()] || priorityConfig.medium;
    const status = statusConfig[item.status] || { label: item.status, color: colors.gray[500] };

    return (
      <TouchableOpacity onPress={() => handleTaskPress(item)} activeOpacity={0.7}>
        <Card accentColor={domainColor} style={styles.taskCard}>
          <View style={styles.taskRow}>
            <View style={styles.taskContent}>
              <Text
                style={[
                  styles.taskTitle,
                  { fontFamily: theme.typography.fontFamily.medium },
                  item.status === 'done' && styles.taskTitleDone,
                ]}
                numberOfLines={2}
              >
                {item.title}
              </Text>

              {item.description ? (
                <Text
                  style={[
                    styles.taskDescription,
                    { fontFamily: theme.typography.fontFamily.regular },
                  ]}
                  numberOfLines={1}
                >
                  {item.description}
                </Text>
              ) : null}

              <View style={styles.chipsRow}>
                {/* Status badge */}
                <View style={[styles.statusBadge, { backgroundColor: status.color + '15' }]}>
                  <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                  <Text
                    style={[
                      styles.statusText,
                      { color: status.color, fontFamily: theme.typography.fontFamily.medium },
                    ]}
                  >
                    {status.label}
                  </Text>
                </View>

                {/* Priority */}
                <View style={styles.priorityBadge}>
                  <MaterialIcons name={priority.icon} size={12} color={priority.color} />
                  <Text
                    style={[
                      styles.priorityText,
                      { color: priority.color, fontFamily: theme.typography.fontFamily.medium },
                    ]}
                  >
                    {item.priority?.toLowerCase()}
                  </Text>
                </View>

                {/* Domain */}
                <Text
                  style={[
                    styles.domainText,
                    { fontFamily: theme.typography.fontFamily.regular },
                  ]}
                >
                  {item.domain?.toLowerCase()}
                </Text>
              </View>
            </View>

            <MaterialIcons name="chevron-right" size={20} color={colors.gray[300]} />
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const hasTasks = tasks.length > 0;

  return (
    <Screen style={styles.container}>
      {error && (
        <View style={styles.errorBanner}>
          <MaterialIcons name="error-outline" size={16} color={colors.error} />
          <Text
            style={[
              styles.errorText,
              { fontFamily: theme.typography.fontFamily.regular },
            ]}
          >
            {error}
          </Text>
        </View>
      )}

      {isLoading && !hasTasks ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={[
              styles.loadingText,
              { fontFamily: theme.typography.fontFamily.regular },
            ]}
          >
            Loading your tasks...
          </Text>
        </View>
      ) : !hasTasks ? (
        <Card>
          <EmptyState
            icon="📋"
            title="No tasks yet"
            message="Capture something on your mind and it will show up here, ready to be organized."
          />
        </Card>
      ) : (
        <>
          <View style={styles.listHeader}>
            <Text
              style={[
                styles.countText,
                { fontFamily: theme.typography.fontFamily.regular },
              ]}
            >
              {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            </Text>
          </View>

          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id}
            renderItem={renderTask}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={refreshTasks} />
            }
          />
        </>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.gray[500],
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm + 2,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: 10,
    backgroundColor: colors.error + '10',
    gap: spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.error,
  },
  listHeader: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  countText: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  taskCard: {
    marginBottom: spacing.sm,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.gray[900],
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: colors.gray[400],
  },
  taskDescription: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginTop: 3,
    lineHeight: 19,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  statusText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  priorityText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  domainText: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
  },
});

export default TasksScreen;
