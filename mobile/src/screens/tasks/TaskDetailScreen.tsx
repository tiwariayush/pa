import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Alert } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { colors, spacing, theme, typography } from '../../theme/theme';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import PrimaryButton from '../../components/PrimaryButton';
import { useTasks } from '../../stores/TaskStore';
import type { RootStackParamList, Task, TaskStatus } from '../../types';

type TaskDetailRoute = RouteProp<RootStackParamList, 'TaskDetail'>;
type TaskDetailNav = StackNavigationProp<RootStackParamList, 'TaskDetail'>;

const TaskDetailScreen: React.FC = () => {
  const route = useRoute<TaskDetailRoute>();
  const navigation = useNavigation<TaskDetailNav>();
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
      'Are you sure you want to delete this task?',
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
          <Text style={styles.loadingText}>Loading task…</Text>
        </View>
      </Screen>
    );
  }

  const domainColor =
    colors.domains[task.domain.toLowerCase() as keyof typeof colors.domains] ||
    theme.colors.primary;

  return (
    <Screen>
      <View style={styles.container}>
        <Card>
          <View style={styles.headerRow}>
            <View style={[styles.domainDot, { backgroundColor: domainColor }]} />
            <Text style={styles.title}>{task.title}</Text>
          </View>
          {task.description && (
            <Text style={styles.description}>{task.description}</Text>
          )}
          <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <Text style={styles.chipLabel}>Domain</Text>
              <Text style={styles.chipValue}>{task.domain}</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipLabel}>Priority</Text>
              <Text style={styles.chipValue}>{task.priority}</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipLabel}>Status</Text>
              <Text style={styles.chipValue}>{task.status}</Text>
            </View>
          </View>
        </Card>

        <View style={styles.actions}>
          <PrimaryButton
            label={task.status === 'done' ? 'Mark as in progress' : 'Mark as done'}
            onPress={() =>
              handleStatusChange(
                (task.status === 'done' ? 'in_progress' : 'done') as TaskStatus
              )
            }
            loading={isUpdating}
          />
          <View style={styles.deleteWrapper}>
            <Text style={styles.deleteText} onPress={handleDelete}>
              Delete task
            </Text>
          </View>
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  domainDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
  },
  description: {
    fontSize: typography.sizes.sm,
    color: colors.gray[700],
    marginTop: spacing.xs,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: theme.roundness,
    backgroundColor: colors.gray[50],
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipLabel: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
  },
  chipValue: {
    fontSize: typography.sizes.sm,
    color: colors.gray[800],
    fontWeight: typography.weights.medium,
  },
  actions: {
    marginTop: spacing.lg,
  },
  deleteWrapper: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  deleteText: {
    fontSize: typography.sizes.sm,
    color: colors.error,
  },
});

export default TaskDetailScreen;