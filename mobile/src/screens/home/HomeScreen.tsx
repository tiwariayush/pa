/**
 * Home Screen - Simplified version without react-native-paper
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { useAuth, useAuthStore } from '../../stores/AuthStore';
import { useTasks, useTaskList } from '../../stores/TaskStore';
import { colors, spacing, typography, useTheme } from '../../theme/theme';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import PrimaryButton from '../../components/PrimaryButton';
import EmptyState from '../../components/EmptyState';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList, Task } from '../../types';
import { TaskStatus } from '../../types';

const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const logout = useAuthStore((state) => state.logout);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const theme = useTheme();
  const { fetchTasks } = useTasks();
  const tasks = useTaskList();

  const firstName = user?.name?.split(' ')[0] || 'there';

  React.useEffect(() => {
    // Ensure we have the latest tasks when landing on Home
    fetchTasks();
  }, [fetchTasks]);

  const inboxTasks = React.useMemo(
    () =>
      tasks
        .filter(
          (task: Task) =>
            task.status === TaskStatus.CAPTURED ||
            task.status === TaskStatus.PARSED
        )
        .slice(0, 3),
    [tasks]
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <View style={styles.header}>
            <Text style={[styles.greeting, { fontFamily: theme.typography.fontFamily.semibold }]}>
              Good morning, {firstName} 👋
            </Text>
            <Text style={[styles.subtitle, { fontFamily: theme.typography.fontFamily.regular }]}>
              Let's make the next hour count.
            </Text>
          </View>
          <TouchableOpacity onPress={logout}>
            <Text style={[styles.logoutText, { fontFamily: theme.typography.fontFamily.regular }]}>
              Log out
            </Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.whatNowCard}>
          <View style={styles.cardHeader}>
            <View style={styles.iconPill}>
              <MaterialIcons name="lightbulb" size={22} color={colors.gray[900]} />
            </View>
            <View>
              <Text style={[styles.cardTitle, { fontFamily: theme.typography.fontFamily.semibold }]}>
                What should I do now?
              </Text>
              <Text style={[styles.cardSubtitle, { fontFamily: theme.typography.fontFamily.regular }]}>
                Quick, contextual suggestions based on your tasks.
              </Text>
            </View>
          </View>

          <PrimaryButton
            label="Get recommendations"
            onPress={() =>
              navigation.navigate('Main', {
                screen: 'Assistant',
              } as any)
            }
            style={styles.primaryButton}
          />
        </Card>

        <Card>
          <Text style={[styles.sectionTitle, { fontFamily: theme.typography.fontFamily.semibold }]}>
            Today at a glance
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.overdue, { fontFamily: theme.typography.fontFamily.bold }]}>
                0
              </Text>
              <Text style={[styles.statLabel, { fontFamily: theme.typography.fontFamily.regular }]}>
                Overdue
              </Text>
            </View>
            <View style={[styles.statItem, styles.statItemEmphasis]}>
              <Text style={[styles.statNumber, styles.dueToday, { fontFamily: theme.typography.fontFamily.bold }]}>
                0
              </Text>
              <Text style={[styles.statLabel, { fontFamily: theme.typography.fontFamily.regular }]}>
                Due today
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.inProgress, { fontFamily: theme.typography.fontFamily.bold }]}>
                0
              </Text>
              <Text style={[styles.statLabel, { fontFamily: theme.typography.fontFamily.regular }]}>
                In progress
              </Text>
            </View>
          </View>
        </Card>

        <Card>
          <Text style={[styles.sectionTitle, { fontFamily: theme.typography.fontFamily.semibold }]}>
            Inbox & focus
          </Text>

          {inboxTasks.length === 0 ? (
            <EmptyState
              icon="📥"
              title="Nothing captured yet"
              message="Use voice capture or add a task to start building your system. Your future self will thank you."
            />
          ) : (
            <View>
              {inboxTasks.map((task) => (
                <View key={task.id} style={styles.inboxItem}>
                  <View style={styles.inboxBullet} />
                  <View style={styles.inboxTextContainer}>
                    <Text
                      style={[
                        styles.inboxTitle,
                        { fontFamily: theme.typography.fontFamily.medium },
                      ]}
                      numberOfLines={1}
                    >
                      {task.title}
                    </Text>
                    {task.domain && (
                      <Text
                        style={[
                          styles.inboxMeta,
                          { fontFamily: theme.typography.fontFamily.regular },
                        ]}
                        numberOfLines={1}
                      >
                        {task.domain.toLowerCase()} • {task.priority.toLowerCase()}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
              {tasks.length > inboxTasks.length && (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('Main', {
                      screen: 'Tasks',
                    } as any)
                  }
                  style={{ marginTop: spacing.sm }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      fontSize: typography.sizes.xs,
                      color: colors.gray[600],
                      fontFamily: theme.typography.fontFamily.medium,
                    }}
                  >
                    View all tasks →
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </Card>
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('VoiceCapture')}
        activeOpacity={0.9}
      >
        <MaterialIcons name="mic" size={28} color="white" />
      </TouchableOpacity>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginTop: spacing.xs,
  },
  logoutText: {
    fontSize: typography.sizes.sm,
    color: colors.gray[500],
  },
  whatNowCard: {
    marginBottom: spacing.xl,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
  },
  cardSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statItemEmphasis: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gray[200],
    backgroundColor: colors.gray[50],
  },
  statNumber: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.gray[600],
    marginTop: spacing.xs,
  },
  overdue: {
    color: colors.priorities.critical,
  },
  dueToday: {
    color: colors.gray[900],
  },
  inProgress: {
    color: colors.statuses.in_progress,
  },
  primaryButton: {
    marginTop: spacing.sm,
  },
  inboxItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.xs,
  },
  inboxBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: spacing.xs,
    marginRight: spacing.sm,
    backgroundColor: colors.gray[400],
  },
  inboxTextContainer: {
    flex: 1,
  },
  inboxTitle: {
    fontSize: typography.sizes.sm,
    color: colors.gray[900],
  },
  inboxMeta: {
    marginTop: 2,
    fontSize: typography.sizes.xs,
    color: colors.gray[600],
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.gray[900],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default HomeScreen;