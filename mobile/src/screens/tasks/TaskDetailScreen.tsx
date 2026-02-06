/**
 * Task Detail Screen - Sectioned layout with clear visual hierarchy,
 * domain-colored accents, icon-based actions, and polished metadata.
 */

import React, { useMemo, useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { colors, spacing, typography, useTheme } from '../../theme/theme';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import PrimaryButton from '../../components/PrimaryButton';
import { useTasks } from '../../stores/TaskStore';
import type { RootStackParamList, Task, TaskStatus } from '../../types';

type TaskDetailRoute = RouteProp<RootStackParamList, 'TaskDetail'>;
type TaskDetailNav = StackNavigationProp<RootStackParamList, 'TaskDetail'>;

const priorityConfig: Record<string, { color: string; label: string }> = {
  critical: { color: colors.priorities.critical, label: 'Critical' },
  high: { color: colors.priorities.high, label: 'High' },
  medium: { color: colors.priorities.medium, label: 'Medium' },
  low: { color: colors.priorities.low, label: 'Low' },
  someday: { color: colors.priorities.someday, label: 'Someday' },
};

const statusConfig: Record<string, { color: string; label: string; icon: keyof typeof MaterialIcons.glyphMap }> = {
  captured: { color: colors.statuses.captured, label: 'Captured', icon: 'radio-button-unchecked' },
  parsed: { color: colors.statuses.parsed, label: 'Parsed', icon: 'auto-fix-high' },
  triaged: { color: colors.statuses.triaged, label: 'Triaged', icon: 'low-priority' },
  planned: { color: colors.statuses.planned, label: 'Planned', icon: 'event-note' },
  scheduled: { color: colors.statuses.scheduled, label: 'Scheduled', icon: 'schedule' },
  in_progress: { color: colors.statuses.in_progress, label: 'In Progress', icon: 'play-circle-outline' },
  done: { color: colors.statuses.done, label: 'Done', icon: 'check-circle-outline' },
  cancelled: { color: colors.statuses.cancelled, label: 'Cancelled', icon: 'cancel' },
};

const TaskDetailScreen: React.FC = () => {
  const route = useRoute<TaskDetailRoute>();
  const navigation = useNavigation<TaskDetailNav>();
  const theme = useTheme();
  const { taskId } = route.params;

  const { getTaskById, refreshTasks, updateTask, deleteTask } = useTasks();
  const [isUpdating, setIsUpdating] = useState(false);

  const task = useMemo<Task | undefined>(() => getTaskById(taskId), [getTaskById, taskId]);

  useEffect(() => {
    if (!task) {
      refreshTasks();
    }
  }, [refreshTasks, task]);

  const handleStatusChange = useCallback(
    async (status: TaskStatus) => {
      if (!task) return;
      try {
        setIsUpdating(true);
        await updateTask(task.id, { status });
        setIsUpdating(false);
      } catch (error: any) {
        console.error('Failed to update task status', error);
        setIsUpdating(false);
        Alert.alert('Error', error.message || 'Could not update this task.');
      }
    },
    [task, updateTask]
  );

  const handleDelete = useCallback(async () => {
    if (!task) return;
    Alert.alert(
      'Delete task',
      'Are you sure you want to delete this task? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsUpdating(true);
              await deleteTask(task.id);
              setIsUpdating(false);
              navigation.goBack();
            } catch (error: any) {
              console.error('Failed to delete task', error);
              setIsUpdating(false);
              Alert.alert('Error', error.message || 'Could not delete this task.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [deleteTask, navigation, task]);

  if (!task) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={[
              styles.loadingText,
              { fontFamily: theme.typography.fontFamily.regular },
            ]}
          >
            Loading task...
          </Text>
        </View>
      </Screen>
    );
  }

  const domainColor =
    colors.domains[task.domain?.toLowerCase() as keyof typeof colors.domains] ||
    colors.gray[400];
  const priority = priorityConfig[task.priority?.toLowerCase()] || priorityConfig.medium;
  const status = statusConfig[task.status] || statusConfig.captured;
  const isDone = task.status === 'done';

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title section */}
        <Card accentColor={domainColor}>
          <Text
            style={[
              styles.title,
              { fontFamily: theme.typography.fontFamily.semibold },
              isDone && styles.titleDone,
            ]}
          >
            {task.title}
          </Text>

          {task.description ? (
            <Text
              style={[
                styles.description,
                { fontFamily: theme.typography.fontFamily.regular },
              ]}
            >
              {task.description}
            </Text>
          ) : null}
        </Card>

        {/* Metadata section */}
        <Card>
          <Text
            style={[
              styles.sectionLabel,
              { fontFamily: theme.typography.fontFamily.semibold },
            ]}
          >
            Details
          </Text>

          {/* Status */}
          <View style={styles.metaItem}>
            <View style={styles.metaIconCol}>
              <MaterialIcons name={status.icon} size={18} color={status.color} />
            </View>
            <View style={styles.metaTextCol}>
              <Text
                style={[
                  styles.metaLabel,
                  { fontFamily: theme.typography.fontFamily.regular },
                ]}
              >
                Status
              </Text>
              <Text
                style={[
                  styles.metaValue,
                  { color: status.color, fontFamily: theme.typography.fontFamily.medium },
                ]}
              >
                {status.label}
              </Text>
            </View>
          </View>

          <View style={styles.metaDivider} />

          {/* Priority */}
          <View style={styles.metaItem}>
            <View style={styles.metaIconCol}>
              <MaterialIcons name="flag" size={18} color={priority.color} />
            </View>
            <View style={styles.metaTextCol}>
              <Text
                style={[
                  styles.metaLabel,
                  { fontFamily: theme.typography.fontFamily.regular },
                ]}
              >
                Priority
              </Text>
              <Text
                style={[
                  styles.metaValue,
                  { color: priority.color, fontFamily: theme.typography.fontFamily.medium },
                ]}
              >
                {priority.label}
              </Text>
            </View>
          </View>

          <View style={styles.metaDivider} />

          {/* Domain */}
          <View style={styles.metaItem}>
            <View style={styles.metaIconCol}>
              <View style={[styles.domainCircle, { backgroundColor: domainColor }]} />
            </View>
            <View style={styles.metaTextCol}>
              <Text
                style={[
                  styles.metaLabel,
                  { fontFamily: theme.typography.fontFamily.regular },
                ]}
              >
                Domain
              </Text>
              <Text
                style={[
                  styles.metaValue,
                  { fontFamily: theme.typography.fontFamily.medium },
                ]}
              >
                {task.domain}
              </Text>
            </View>
          </View>

          {task.dueDate && (
            <>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <View style={styles.metaIconCol}>
                  <MaterialIcons name="event" size={18} color={colors.gray[600]} />
                </View>
                <View style={styles.metaTextCol}>
                  <Text
                    style={[
                      styles.metaLabel,
                      { fontFamily: theme.typography.fontFamily.regular },
                    ]}
                  >
                    Due date
                  </Text>
                  <Text
                    style={[
                      styles.metaValue,
                      { fontFamily: theme.typography.fontFamily.medium },
                    ]}
                  >
                    {new Date(task.dueDate).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
            </>
          )}
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <PrimaryButton
            label={isDone ? 'Reopen task' : 'Mark as done'}
            icon={isDone ? 'replay' : 'check'}
            onPress={() =>
              handleStatusChange(
                (isDone ? 'in_progress' : 'done') as TaskStatus
              )
            }
            loading={isUpdating}
          />

          {!isDone && task.status !== 'in_progress' && (
            <PrimaryButton
              label="Start working"
              icon="play-arrow"
              variant="outline"
              onPress={() => handleStatusChange('in_progress' as TaskStatus)}
              loading={isUpdating}
              style={styles.secondaryAction}
            />
          )}

          <TouchableOpacity
            onPress={handleDelete}
            style={styles.deleteButton}
            activeOpacity={0.7}
          >
            <MaterialIcons name="delete-outline" size={18} color={colors.error} />
            <Text
              style={[
                styles.deleteText,
                { fontFamily: theme.typography.fontFamily.medium },
              ]}
            >
              Delete task
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.gray[500],
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
    lineHeight: 26,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: colors.gray[400],
  },
  description: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  metaIconCol: {
    width: 28,
    alignItems: 'center',
  },
  metaTextCol: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  metaLabel: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
    marginBottom: 2,
  },
  metaValue: {
    fontSize: typography.sizes.sm,
    color: colors.gray[900],
    fontWeight: typography.weights.medium,
  },
  metaDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gray[200],
    marginLeft: 28 + spacing.sm,
  },
  domainCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  actions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  secondaryAction: {
    marginTop: 0,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  deleteText: {
    fontSize: typography.sizes.sm,
    color: colors.error,
  },
});

export default TaskDetailScreen;
