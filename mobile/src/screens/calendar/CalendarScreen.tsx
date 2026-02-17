/**
 * Calendar Screen - Shows upcoming events with date grouping,
 * time pills, and polished event cards.
 */

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  FlatList,
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  SectionList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, useTheme } from '../../theme/theme';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import FloatingMenu from '../../components/FloatingMenu';
import { apiService } from '../../services/api';
import type { CalendarEvent } from '../../types';
import { useTasks } from '../../stores/TaskStore';
import { useToast } from '../../components/Toast';

/** Format a date as "Mon, Jan 15" */
const formatDateHeader = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  if (dateStr === todayStr) return 'Today';
  if (dateStr === tomorrowStr) return 'Tomorrow';

  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

/** Format time as "9:30 AM" */
const formatTime = (iso: string): string => {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

interface EventSection {
  title: string;
  dateKey: string;
  data: CalendarEvent[];
}

const CalendarScreen: React.FC = () => {
  const theme = useTheme();
  const toast = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const { refreshTasks } = useTasks();

  const loadEvents = useCallback(
    async (showLoader: boolean = true) => {
      try {
        if (showLoader) setLoading(true);
        setError(null);
        const today = new Date();
        const start = today.toISOString().slice(0, 10);
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 7);
        const end = endDate.toISOString().slice(0, 10);

        const data = await apiService.getCalendarEvents(start, end);
        setEvents(data);
      } catch (e: any) {
        const message =
          e?.response?.data?.detail ||
          e?.response?.data?.message ||
          e?.message ||
          'Failed to load calendar events';
        console.log('Calendar load error', e);
        setError(message);
      } finally {
        if (showLoader) setLoading(false);
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
        toast.success('This calendar event is now in your task list.');
      } catch (e: any) {
        toast.error(e.message || 'Failed to create a task from this event.');
      }
    },
    [refreshTasks]
  );

  // Group events by date
  const sections: EventSection[] = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};
    events.forEach((event) => {
      const dateKey = new Date(event.startTime).toISOString().slice(0, 10);
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(event);
    });

    return Object.keys(grouped)
      .sort()
      .map((dateKey) => ({
        title: formatDateHeader(dateKey),
        dateKey,
        data: grouped[dateKey].sort(
          (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        ),
      }));
  }, [events]);

  const hasEvents = events.length > 0;

  return (
    <Screen style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text
            style={[
              styles.headerTitle,
              { fontFamily: theme.typography.fontFamily.semibold },
            ]}
          >
            Next 7 days
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { fontFamily: theme.typography.fontFamily.regular },
            ]}
          >
            {hasEvents
              ? `${events.length} event${events.length !== 1 ? 's' : ''} upcoming`
              : 'No events found'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
          onPress={syncing ? undefined : handleSync}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="sync"
            size={16}
            color={syncing ? colors.gray[400] : colors.gray[700]}
          />
          <Text
            style={[
              styles.syncText,
              syncing && styles.syncTextDisabled,
              { fontFamily: theme.typography.fontFamily.medium },
            ]}
          >
            {syncing ? 'Syncing...' : 'Sync'}
          </Text>
        </TouchableOpacity>
      </View>

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

      {loading && !hasEvents ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={[
              styles.loadingText,
              { fontFamily: theme.typography.fontFamily.regular },
            ]}
          >
            Loading upcoming events...
          </Text>
        </View>
      ) : !hasEvents ? (
        <Card>
          <EmptyState
            icon="📅"
            title="No upcoming events"
            message="Connect your calendar in the backend and tap Sync to pull in events."
          />
        </Card>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  section.dateKey === new Date().toISOString().slice(0, 10) &&
                    styles.sectionTitleToday,
                  { fontFamily: theme.typography.fontFamily.semibold },
                ]}
              >
                {section.title}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <Card style={styles.eventCard}>
              <View style={styles.eventRow}>
                {/* Time column */}
                <View style={styles.timeCol}>
                  <Text
                    style={[
                      styles.timeText,
                      { fontFamily: theme.typography.fontFamily.medium },
                    ]}
                  >
                    {formatTime(item.startTime)}
                  </Text>
                  <Text
                    style={[
                      styles.timeDash,
                      { fontFamily: theme.typography.fontFamily.regular },
                    ]}
                  >
                    {formatTime(item.endTime)}
                  </Text>
                </View>

                {/* Divider */}
                <View style={styles.eventDivider} />

                {/* Content */}
                <View style={styles.eventContent}>
                  <Text
                    style={[
                      styles.eventTitle,
                      { fontFamily: theme.typography.fontFamily.medium },
                    ]}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                  {item.description ? (
                    <Text
                      style={[
                        styles.eventDescription,
                        { fontFamily: theme.typography.fontFamily.regular },
                      ]}
                      numberOfLines={2}
                    >
                      {item.description}
                    </Text>
                  ) : null}

                  <TouchableOpacity
                    style={styles.addTaskRow}
                    onPress={() => handleAddAsTask(item)}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons
                      name="add-circle-outline"
                      size={14}
                      color={colors.gray[600]}
                    />
                    <Text
                      style={[
                        styles.addTaskText,
                        { fontFamily: theme.typography.fontFamily.medium },
                      ]}
                    >
                      Add as task
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={() => loadEvents(false)} />
          }
        />
      )}
      <FloatingMenu />
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
  },
  headerSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
    marginTop: 2,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
    gap: spacing.xs,
  },
  syncButtonDisabled: {
    opacity: 0.5,
  },
  syncText: {
    fontSize: typography.sizes.xs,
    color: colors.gray[700],
    fontWeight: typography.weights.medium,
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
    color: colors.gray[500],
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm + 2,
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
  sectionHeader: {
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionTitleToday: {
    color: colors.info,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  eventCard: {
    marginBottom: spacing.sm,
  },
  eventRow: {
    flexDirection: 'row',
  },
  timeCol: {
    width: 62,
    alignItems: 'flex-end',
    paddingRight: spacing.sm,
  },
  timeText: {
    fontSize: typography.sizes.xs,
    color: colors.gray[900],
    fontWeight: typography.weights.medium,
  },
  timeDash: {
    fontSize: typography.sizes.xs,
    color: colors.gray[400],
    marginTop: 2,
  },
  eventDivider: {
    width: 2,
    borderRadius: 1,
    backgroundColor: colors.info + '30',
    marginRight: spacing.sm,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.gray[900],
  },
  eventDescription: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginTop: 3,
    lineHeight: 19,
  },
  addTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  addTaskText: {
    fontSize: typography.sizes.xs,
    color: colors.gray[600],
    fontWeight: typography.weights.medium,
  },
});

export default CalendarScreen;
