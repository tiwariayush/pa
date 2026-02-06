/**
 * Home Screen - Primary dashboard with smart greetings, live stats,
 * and quick-access recommendations.
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { useAuth, useAuthStore } from '../../stores/AuthStore';
import { useTasks, useTaskList } from '../../stores/TaskStore';
import { colors, spacing, typography, shadows, useTheme } from '../../theme/theme';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import PrimaryButton from '../../components/PrimaryButton';
import EmptyState from '../../components/EmptyState';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList, Task } from '../../types';
import { TaskStatus } from '../../types';

/** Return a contextual greeting based on the time of day */
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 5) return 'Working late';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
};

/** Return a contextual subtitle message */
const getSubtitle = (): string => {
  const hour = new Date().getHours();
  if (hour < 5) return "Let's wrap up and get some rest.";
  if (hour < 12) return "Let's make the most of today.";
  if (hour < 17) return 'Keep the momentum going.';
  if (hour < 21) return 'Time to wind down intentionally.';
  return 'Review tomorrow and rest easy.';
};

const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const logout = useAuthStore((state) => state.logout);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const theme = useTheme();
  const { fetchTasks } = useTasks();
  const tasks = useTaskList();

  const firstName = user?.name?.split(' ')[0] || 'there';

  React.useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Compute live stats
  const stats = React.useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    let overdue = 0;
    let dueToday = 0;
    let inProgress = 0;

    tasks.forEach((task: Task) => {
      if (task.status === 'done' || task.status === 'cancelled') return;

      if (task.status === 'in_progress') inProgress++;

      if (task.dueDate) {
        const dueStr = typeof task.dueDate === 'string'
          ? task.dueDate.slice(0, 10)
          : new Date(task.dueDate).toISOString().slice(0, 10);

        if (dueStr < todayStr) overdue++;
        else if (dueStr === todayStr) dueToday++;
      }
    });

    return { overdue, dueToday, inProgress };
  }, [tasks]);

  const inboxTasks = React.useMemo(
    () =>
      tasks
        .filter(
          (task: Task) =>
            task.status === TaskStatus.CAPTURED ||
            task.status === TaskStatus.PARSED
        )
        .slice(0, 4),
    [tasks]
  );

  const totalInbox = tasks.filter(
    (task: Task) =>
      task.status === TaskStatus.CAPTURED || task.status === TaskStatus.PARSED
  ).length;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text
              style={[
                styles.greeting,
                { fontFamily: theme.typography.fontFamily.bold },
              ]}
            >
              {getGreeting()}, {firstName}
            </Text>
            <Text
              style={[
                styles.subtitle,
                { fontFamily: theme.typography.fontFamily.regular },
              ]}
            >
              {getSubtitle()}
            </Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <MaterialIcons name="logout" size={18} color={colors.gray[400]} />
          </TouchableOpacity>
        </View>

        {/* What should I do now? */}
        <Card elevated>
          <View style={styles.whatNowHeader}>
            <View style={styles.iconPill}>
              <MaterialIcons name="auto-awesome" size={20} color={colors.gray[900]} />
            </View>
            <View style={styles.whatNowText}>
              <Text
                style={[
                  styles.cardTitle,
                  { fontFamily: theme.typography.fontFamily.semibold },
                ]}
              >
                What should I do now?
              </Text>
              <Text
                style={[
                  styles.cardSubtitle,
                  { fontFamily: theme.typography.fontFamily.regular },
                ]}
              >
                AI-powered suggestions based on your time, energy, and tasks.
              </Text>
            </View>
          </View>
          <PrimaryButton
            label="Get recommendations"
            icon="lightbulb"
            onPress={() =>
              navigation.navigate('Main', {
                screen: 'Assistant',
              } as any)
            }
          />
        </Card>

        {/* Today at a Glance */}
        <Text
          style={[
            styles.sectionLabel,
            { fontFamily: theme.typography.fontFamily.semibold },
          ]}
        >
          Today at a glance
        </Text>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.statIconBg, { backgroundColor: colors.priorities.critical + '15' }]}>
              <MaterialIcons name="warning" size={16} color={colors.priorities.critical} />
            </View>
            <Text
              style={[
                styles.statNumber,
                { color: stats.overdue > 0 ? colors.priorities.critical : colors.gray[400] },
                { fontFamily: theme.typography.fontFamily.bold },
              ]}
            >
              {stats.overdue}
            </Text>
            <Text
              style={[
                styles.statLabel,
                { fontFamily: theme.typography.fontFamily.regular },
              ]}
            >
              Overdue
            </Text>
          </View>

          <View style={[styles.statCard, styles.statCardCenter, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.statIconBg, { backgroundColor: colors.info + '15' }]}>
              <MaterialIcons name="today" size={16} color={colors.info} />
            </View>
            <Text
              style={[
                styles.statNumber,
                { color: stats.dueToday > 0 ? colors.gray[900] : colors.gray[400] },
                { fontFamily: theme.typography.fontFamily.bold },
              ]}
            >
              {stats.dueToday}
            </Text>
            <Text
              style={[
                styles.statLabel,
                { fontFamily: theme.typography.fontFamily.regular },
              ]}
            >
              Due today
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.statIconBg, { backgroundColor: colors.success + '15' }]}>
              <MaterialIcons name="play-arrow" size={16} color={colors.success} />
            </View>
            <Text
              style={[
                styles.statNumber,
                { color: stats.inProgress > 0 ? colors.statuses.in_progress : colors.gray[400] },
                { fontFamily: theme.typography.fontFamily.bold },
              ]}
            >
              {stats.inProgress}
            </Text>
            <Text
              style={[
                styles.statLabel,
                { fontFamily: theme.typography.fontFamily.regular },
              ]}
            >
              In progress
            </Text>
          </View>
        </View>

        {/* Inbox & Focus */}
        <Text
          style={[
            styles.sectionLabel,
            { fontFamily: theme.typography.fontFamily.semibold, marginTop: spacing.lg },
          ]}
        >
          Inbox
          {totalInbox > 0 && (
            <Text style={[styles.sectionCount, { fontFamily: theme.typography.fontFamily.regular }]}>
              {'  '}{totalInbox}
            </Text>
          )}
        </Text>

        <Card>
          {inboxTasks.length === 0 ? (
            <EmptyState
              icon="📥"
              title="Nothing captured yet"
              message="Use voice capture to add thoughts. They'll appear here ready to be organized."
              compact
            />
          ) : (
            <View>
              {inboxTasks.map((task, index) => {
                const domainColor =
                  colors.domains[
                    task.domain?.toLowerCase() as keyof typeof colors.domains
                  ] || colors.gray[400];

                return (
                  <TouchableOpacity
                    key={task.id}
                    style={[
                      styles.inboxItem,
                      index < inboxTasks.length - 1 && styles.inboxItemBorder,
                    ]}
                    activeOpacity={0.7}
                    onPress={() =>
                      navigation.navigate('TaskDetail', { taskId: task.id })
                    }
                  >
                    <View
                      style={[styles.inboxDot, { backgroundColor: domainColor }]}
                    />
                    <View style={styles.inboxContent}>
                      <Text
                        style={[
                          styles.inboxTitle,
                          { fontFamily: theme.typography.fontFamily.medium },
                        ]}
                        numberOfLines={1}
                      >
                        {task.title}
                      </Text>
                      <Text
                        style={[
                          styles.inboxMeta,
                          { fontFamily: theme.typography.fontFamily.regular },
                        ]}
                        numberOfLines={1}
                      >
                        {task.domain?.toLowerCase()}
                        {task.priority ? ` \u00B7 ${task.priority.toLowerCase()}` : ''}
                      </Text>
                    </View>
                    <MaterialIcons
                      name="chevron-right"
                      size={18}
                      color={colors.gray[300]}
                    />
                  </TouchableOpacity>
                );
              })}

              {totalInbox > inboxTasks.length && (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('Main', { screen: 'Inbox' } as any)
                  }
                  style={styles.viewAllRow}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.viewAllText,
                      { fontFamily: theme.typography.fontFamily.medium },
                    ]}
                  >
                    View all {totalInbox} items
                  </Text>
                  <MaterialIcons name="arrow-forward" size={14} color={colors.gray[500]} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </Card>

        {/* Quick actions */}
        <Text
          style={[
            styles.sectionLabel,
            { fontFamily: theme.typography.fontFamily.semibold, marginTop: spacing.sm },
          ]}
        >
          Quick actions
        </Text>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: theme.colors.surface }]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('VoiceCapture')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.domains.personal + '15' }]}>
              <MaterialIcons name="mic" size={20} color={colors.domains.personal} />
            </View>
            <Text
              style={[
                styles.quickActionLabel,
                { fontFamily: theme.typography.fontFamily.medium },
              ]}
            >
              Capture
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: theme.colors.surface }]}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate('Main', { screen: 'Tasks' } as any)
            }
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.domains.job + '15' }]}>
              <MaterialIcons name="assignment" size={20} color={colors.domains.job} />
            </View>
            <Text
              style={[
                styles.quickActionLabel,
                { fontFamily: theme.typography.fontFamily.medium },
              ]}
            >
              Tasks
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: theme.colors.surface }]}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate('Main', { screen: 'Calendar' } as any)
            }
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.domains.family + '15' }]}>
              <MaterialIcons name="event" size={20} color={colors.domains.family} />
            </View>
            <Text
              style={[
                styles.quickActionLabel,
                { fontFamily: theme.typography.fontFamily.medium },
              ]}
            >
              Calendar
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('VoiceCapture')}
        activeOpacity={0.9}
      >
        <MaterialIcons name="mic" size={26} color="white" />
      </TouchableOpacity>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: spacing.md,
    paddingBottom: 100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  logoutButton: {
    padding: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    marginTop: spacing.xs,
  },
  whatNowHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  iconPill: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  whatNowText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
  },
  cardSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
    marginTop: 3,
    lineHeight: 17,
  },
  sectionLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  sectionCount: {
    fontSize: typography.sizes.xs,
    color: colors.gray[400],
    textTransform: 'none',
    letterSpacing: 0,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gray[200],
  },
  statCardCenter: {},
  statIconBg: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statNumber: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
  },
  statLabel: {
    fontSize: 10,
    color: colors.gray[500],
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  inboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
  },
  inboxItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray[200],
  },
  inboxDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm + 2,
  },
  inboxContent: {
    flex: 1,
  },
  inboxTitle: {
    fontSize: typography.sizes.sm,
    color: colors.gray[900],
  },
  inboxMeta: {
    marginTop: 2,
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.sm + 2,
    marginTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gray[200],
  },
  viewAllText: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
    marginRight: spacing.xs,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gray[200],
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  quickActionLabel: {
    fontSize: typography.sizes.xs,
    color: colors.gray[700],
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.gray[900],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
});

export default HomeScreen;
