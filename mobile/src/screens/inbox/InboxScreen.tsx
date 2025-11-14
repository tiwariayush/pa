import React, { useEffect } from 'react';
import { StyleSheet, FlatList } from 'react-native';
import { spacing } from '../../theme/theme';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import { useTasks, useTaskList } from '../../stores/TaskStore';
import type { Task, TaskStatus } from '../../types';
import TasksScreen from '../tasks/TasksScreen';

const InboxScreen: React.FC = () => {
  const { fetchTasks } = useTasks();
  const tasks = useTaskList();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const inboxStatuses: TaskStatus[] = ['captured', 'parsed', 'triaged'];
  const inboxTasks = tasks.filter((t: Task) => inboxStatuses.includes(t.status));

  if (!inboxTasks.length) {
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
      {/* Reuse the Tasks list UI but scoped to inbox tasks */}
      <FlatList
        data={inboxTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          // Use the same card layout as Tasks by delegating to TasksScreen's item renderer
          // For now, keep it simple by using EmptyState-style cards.
          <Card style={{ marginBottom: spacing.md }}>
            <EmptyState
              icon="📝"
              title={item.title}
              message={item.description || 'Captured from voice or quick add.'}
            />
          </Card>
        )}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
});

export default InboxScreen;