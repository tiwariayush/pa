import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, FlatList, View, Text, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { colors, spacing, theme, typography } from '../../theme/theme';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import { apiService } from '../../services/api';
import type { CalendarEvent } from '../../types';
import { useTasks } from '../../stores/TaskStore';

const CalendarScreen: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const { refreshTasks } = useTasks();

  const loadEvents = useCallback(
    async (showLoader: boolean = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        }
        setError(null);
        const today = new Date();
        const start = today.toISOString().slice(0, 10);
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 7);
        const end = endDate.toISOString().slice(0, 10);

        const data = await apiService.getCalendarEvents(start, end);
        setEvents(data);
      } catch (e: any) {
        // Surface more helpful error details when available
        const message =
          e?.response?.data?.detail ||
          e?.response?.data?.message ||
          e?.message ||
          'Failed to load calendar events';
        console.log('Calendar load error', e);
        setError(message);
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleSync = useCallback(async () => {
    try {
      setSyncing(true);
      setError(null);
      await apiService.syncCalendar();
      await loadEvents(false);
    } catch (e: any) {
      const message =
        e?.response?.data?.detail ||
        e?.response?.data?.message ||
        e?.message ||
        'Failed to sync calendar';
      console.log('Calendar sync error', e);
      setError(message);
    } finally {
      setSyncing(false);
    }
  }, [loadEvents]);

  const handleAddAsTask = useCallback(
    async (event: CalendarEvent) => {
      try {
        await apiService.importCalendarEventAsTask(event.id);
        await refreshTasks();
        Alert.alert('Added as task', 'This calendar event is now in your task list.');
      } catch (e: any) {
        Alert.alert('Error', e.message || 'Failed to create a task from this event.');
      }
    },
    [refreshTasks]
  );

  const hasEvents = events.length > 0;

  return (
    <Screen style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Next 7 days</Text>
        <Text
          style={[styles.syncText, syncing && styles.syncTextDisabled]}
          onPress={syncing ? undefined : handleSync}
        >
          {syncing ? 'Syncing…' : 'Sync now'}
        </Text>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading && !hasEvents ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading upcoming events…</Text>
        </View>
      ) : !hasEvents ? (
        <Card>
          <EmptyState
            icon="📅"
            title="No upcoming events"
            message="Connect your calendar in the backend and tap Sync now to pull in events."
          />
        </Card>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.eventCard}>
              <Text style={styles.eventTitle}>{item.title}</Text>
              {item.description && (
                <Text style={styles.eventDescription}>{item.description}</Text>
              )}
              <Text style={styles.eventMeta}>
                {new Date(item.startTime).toLocaleString()} –{' '}
                {new Date(item.endTime).toLocaleTimeString()}
              </Text>
              <TouchableOpacity
                style={styles.addTaskButton}
                onPress={() => handleAddAsTask(item)}
              >
                <Text style={styles.addTaskText}>Add as task</Text>
              </TouchableOpacity>
            </Card>
          )}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={() => loadEvents(false)} />
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    fontFamily: typography.fontFamily.semibold,
    color: theme.colors.onSurface,
  },
  syncText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fontFamily.regular,
    color: theme.colors.primary,
  },
  syncTextDisabled: {
    color: colors.gray[400],
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fontFamily.regular,
    color: theme.colors.onSurfaceVariant,
  },
  errorBanner: {
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: theme.roundness,
    backgroundColor: colors.error + '15',
  },
  errorText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.error,
  },
  eventCard: {
    marginBottom: spacing.md,
  },
  eventTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    fontFamily: typography.fontFamily.semibold,
    color: theme.colors.onSurface,
  },
  eventDescription: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fontFamily.regular,
    color: theme.colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  eventMeta: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  addTaskButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  addTaskText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fontFamily.medium,
    color: theme.colors.primary,
    fontWeight: typography.weights.medium,
  },
});

export default CalendarScreen;