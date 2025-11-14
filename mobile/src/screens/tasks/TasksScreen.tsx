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
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { colors, spacing, theme, typography } from '../../theme/theme';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import { useTasks, useTaskList, useTaskLoading, useTaskError } from '../../stores/TaskStore';
import type { RootStackParamList, Task } from '../../types';

type TasksNav = StackNavigationProp<RootStackParamList, 'Main'>;

const TasksScreen: React.FC = () => {
  const navigation = useNavigation<TasksNav>();
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
      colors.domains[item.domain.toLowerCase() as keyof typeof colors.domains] ||
      theme.colors.primary;

    return (
      <TouchableOpacity onPress={() => handleTaskPress(item)} activeOpacity={0.8}>
        <Card style={styles.taskCard}>
          <View style={styles.taskHeader}>
            <View style={[styles.domainDot, { backgroundColor: domainColor }]} />
            <Text style={styles.taskTitle}>{item.title}</Text>
          </View>
          {item.description && (
            <Text style={styles.taskDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{item.domain}</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{item.priority}</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{item.status}</Text>
            </View>
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
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {isLoading && !hasTasks ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading your tasks…</Text>
        </View>
      ) : !hasTasks ? (
        <Card>
          <EmptyState
            icon="📋"
            title="No tasks yet"
            message="Capture something that’s on your mind, and it will show up here ready to be organized."
          />
        </Card>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTask}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refreshTasks} />
          }
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
  },
  errorBanner: {
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: theme.roundness,
    backgroundColor: colors.error + '15',
  },
  errorText: {
    fontSize: typography.sizes.sm,
    color: colors.error,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  taskCard: {
    marginBottom: spacing.md,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  domainDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  taskTitle: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
  },
  taskDescription: {
    fontSize: typography.sizes.sm,
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: colors.gray[100],
    marginRight: spacing.xs,
    marginTop: spacing.xs,
  },
  chipText: {
    fontSize: typography.sizes.xs,
    color: colors.gray[700],
  },
});

export default TasksScreen;