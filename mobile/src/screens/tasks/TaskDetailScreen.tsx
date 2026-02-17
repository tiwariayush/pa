/**
 * Task Detail Screen - Sectioned layout with action timeline,
 * visual decision support, delegation chips, and polished metadata.
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
import { ActionCard } from '../../components/ActionCard';
import { useToast } from '../../components/Toast';
import { useTasks } from '../../stores/TaskStore';
import { apiService } from '../../services/api';
import type { RootStackParamList, Task, TaskStatus, TaskAction } from '../../types';

type TaskDetailRoute = RouteProp<RootStackParamList, 'TaskDetail'>;
type TaskDetailNav = StackNavigationProp<RootStackParamList, 'TaskDetail'>;

/** Format due date with relative context */
const formatRelativeDate = (dateStr: string): string => {
  const now = new Date();
  const due = new Date(dateStr);
  const todayStr = now.toISOString().slice(0, 10);
  const dueStr = due.toISOString().slice(0, 10);
  const diffDays = Math.round(
    (new Date(dueStr).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24)
  );
  const formatted = due.toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
  });
  if (diffDays < 0) return `${formatted} (overdue by ${Math.abs(diffDays)}d)`;
  if (diffDays === 0) return `${formatted} (due today)`;
  if (diffDays === 1) return `${formatted} (tomorrow)`;
  if (diffDays <= 7) return `${formatted} (in ${diffDays} days)`;
  return formatted;
};

const getDueDateColor = (dateStr: string): string => {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const dueStr = new Date(dateStr).toISOString().slice(0, 10);
  if (dueStr < todayStr) return colors.error;
  if (dueStr === todayStr) return colors.warning;
  return colors.gray[600];
};

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
  const toast = useToast();
  const { taskId } = route.params;

  const { getTaskById, refreshTasks, updateTask, deleteTask } = useTasks();
  const [isUpdating, setIsUpdating] = useState(false);
  const [actions, setActions] = useState<TaskAction[]>([]);
  const [actionsLoading, setActionsLoading] = useState(false);
  const [generatingActions, setGeneratingActions] = useState(false);

  const task = useMemo<Task | undefined>(() => getTaskById(taskId), [getTaskById, taskId]);

  useEffect(() => {
    if (!task) refreshTasks();
  }, [refreshTasks, task]);

  // Load actions
  useEffect(() => {
    const load = async () => {
      try {
        setActionsLoading(true);
        const data = await apiService.getTaskActions(taskId);
        setActions(data);
      } catch { /* silently fail */ }
      finally { setActionsLoading(false); }
    };
    load();
  }, [taskId]);

  const handleGenerateActions = useCallback(async () => {
    try {
      setGeneratingActions(true);
      const data = await apiService.generateTaskActions(taskId);
      setActions(data);
      toast.success('Action plan generated!');
    } catch {
      toast.error('Could not generate action plan.');
    } finally {
      setGeneratingActions(false);
    }
  }, [taskId, toast]);

  const handleToggleActionStatus = useCallback(async (action: TaskAction) => {
    const newStatus = action.status === 'done' ? 'pending' : 'done';
    try {
      const updated = await apiService.updateTaskAction(taskId, action.id, { status: newStatus });
      setActions((prev) => prev.map((a) => (a.id === action.id ? updated : a)));
    } catch {
      toast.error('Could not update action.');
    }
  }, [taskId, toast]);

  const handleStatusChange = useCallback(async (status: TaskStatus) => {
    if (!task) return;
    try {
      setIsUpdating(true);
      await updateTask(task.id, { status });
    } catch (error: any) {
      toast.error(error.message || 'Could not update this task.');
    } finally {
      setIsUpdating(false);
    }
  }, [task, updateTask, toast]);

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
              navigation.goBack();
            } catch (error: any) {
              toast.error(error.message || 'Could not delete this task.');
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [deleteTask, navigation, task, toast]);

  if (!task) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { fontFamily: theme.typography.fontFamily.regular }]}>
            Loading task...
          </Text>
        </View>
      </Screen>
    );
  }

  const domainColor =
    colors.domains[task.domain?.toLowerCase() as keyof typeof colors.domains] || colors.gray[400];
  const priority = priorityConfig[task.priority?.toLowerCase()] || priorityConfig.medium;
  const status = statusConfig[task.status] || statusConfig.captured;
  const isDone = task.status === 'done';
  const completedActions = actions.filter((a) => a.status === 'done').length;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
            <Text style={[styles.description, { fontFamily: theme.typography.fontFamily.regular }]}>
              {task.description}
            </Text>
          ) : null}
        </Card>

        {/* Metadata section */}
        <Card>
          <Text style={[styles.sectionLabel, { fontFamily: theme.typography.fontFamily.semibold }]}>
            Details
          </Text>

          {/* Status */}
          <View style={styles.metaItem}>
            <View style={styles.metaIconCol}>
              <MaterialIcons name={status.icon} size={18} color={status.color} />
            </View>
            <View style={styles.metaTextCol}>
              <Text style={[styles.metaLabel, { fontFamily: theme.typography.fontFamily.regular }]}>Status</Text>
              <Text style={[styles.metaValue, { color: status.color, fontFamily: theme.typography.fontFamily.medium }]}>
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
              <Text style={[styles.metaLabel, { fontFamily: theme.typography.fontFamily.regular }]}>Priority</Text>
              <Text style={[styles.metaValue, { color: priority.color, fontFamily: theme.typography.fontFamily.medium }]}>
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
              <Text style={[styles.metaLabel, { fontFamily: theme.typography.fontFamily.regular }]}>Domain</Text>
              <Text style={[styles.metaValue, { fontFamily: theme.typography.fontFamily.medium }]}>{task.domain}</Text>
            </View>
          </View>

          {/* Due date */}
          {task.dueDate && (
            <>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <View style={styles.metaIconCol}>
                  <MaterialIcons name="event" size={18} color={getDueDateColor(task.dueDate)} />
                </View>
                <View style={styles.metaTextCol}>
                  <Text style={[styles.metaLabel, { fontFamily: theme.typography.fontFamily.regular }]}>Due date</Text>
                  <Text style={[styles.metaValue, { color: getDueDateColor(task.dueDate), fontFamily: theme.typography.fontFamily.medium }]}>
                    {formatRelativeDate(task.dueDate)}
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* Estimated duration */}
          {task.estimatedDurationMin != null && task.estimatedDurationMin > 0 && (
            <>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <View style={styles.metaIconCol}>
                  <MaterialIcons name="schedule" size={18} color={colors.gray[600]} />
                </View>
                <View style={styles.metaTextCol}>
                  <Text style={[styles.metaLabel, { fontFamily: theme.typography.fontFamily.regular }]}>Duration</Text>
                  <Text style={[styles.metaValue, { fontFamily: theme.typography.fontFamily.medium }]}>
                    {task.estimatedDurationMin >= 60
                      ? `${Math.floor(task.estimatedDurationMin / 60)}h ${task.estimatedDurationMin % 60 > 0 ? `${task.estimatedDurationMin % 60}m` : ''}`
                      : `${task.estimatedDurationMin} min`}
                  </Text>
                </View>
              </View>
            </>
          )}
        </Card>

        {/* Action Timeline */}
        <View style={styles.actionSection}>
          <View style={styles.actionHeader}>
            <Text style={[styles.sectionLabel, { fontFamily: theme.typography.fontFamily.semibold, marginBottom: 0 }]}>
              Action plan
              {actions.length > 0 && (
                <Text style={[styles.actionCount, { fontFamily: theme.typography.fontFamily.regular }]}>
                  {'  '}{completedActions}/{actions.length}
                </Text>
              )}
            </Text>
            {actions.length === 0 && !actionsLoading && (
              <PrimaryButton
                label={generatingActions ? 'Generating...' : 'Generate plan'}
                icon="auto-awesome"
                variant="outline"
                onPress={handleGenerateActions}
                loading={generatingActions}
                style={styles.generateBtn}
              />
            )}
          </View>

          {actionsLoading && (
            <View style={styles.actionsLoading}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { fontFamily: theme.typography.fontFamily.regular }]}>
                Loading actions...
              </Text>
            </View>
          )}

          {actions.length > 0 && (
            <View style={styles.timeline}>
              {actions.map((action, index) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  index={index}
                  isLast={index === actions.length - 1}
                  onStatusToggle={handleToggleActionStatus}
                  onPress={(a) => {
                    if (a.type === 'decide' && a.metadata?.options) {
                      // Navigate to decision screen
                      navigation.navigate('DecisionView' as any, { taskId, actionId: a.id });
                    }
                  }}
                />
              ))}
            </View>
          )}

          {actions.length > 0 && (
            <TouchableOpacity
              style={styles.regenerateRow}
              onPress={handleGenerateActions}
              activeOpacity={0.7}
            >
              <MaterialIcons name="refresh" size={14} color={colors.gray[500]} />
              <Text style={[styles.regenerateText, { fontFamily: theme.typography.fontFamily.medium }]}>
                Regenerate action plan
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Task Status Actions */}
        <View style={styles.actions}>
          <PrimaryButton
            label={isDone ? 'Reopen task' : 'Mark as done'}
            icon={isDone ? 'replay' : 'check'}
            onPress={() => handleStatusChange((isDone ? 'in_progress' : 'done') as TaskStatus)}
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
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton} activeOpacity={0.7}>
            <MaterialIcons name="delete-outline" size={18} color={colors.error} />
            <Text style={[styles.deleteText, { fontFamily: theme.typography.fontFamily.medium }]}>
              Delete task
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingTop: spacing.md, paddingBottom: spacing.xxl },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: spacing.md, fontSize: typography.sizes.sm, color: colors.gray[500] },
  title: { fontSize: typography.sizes.xl, fontWeight: typography.weights.semibold, color: colors.gray[900], lineHeight: 26 },
  titleDone: { textDecorationLine: 'line-through', color: colors.gray[400] },
  description: { fontSize: typography.sizes.sm, color: colors.gray[600], marginTop: spacing.sm, lineHeight: 20 },
  sectionLabel: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, color: colors.gray[500], textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  metaIconCol: { width: 28, alignItems: 'center' },
  metaTextCol: { flex: 1, marginLeft: spacing.sm },
  metaLabel: { fontSize: typography.sizes.xs, color: colors.gray[500], marginBottom: 2 },
  metaValue: { fontSize: typography.sizes.sm, color: colors.gray[900], fontWeight: typography.weights.medium },
  metaDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.gray[200], marginLeft: 28 + spacing.sm },
  domainCircle: { width: 14, height: 14, borderRadius: 7 },

  // Action timeline
  actionSection: { marginTop: spacing.sm },
  actionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  actionCount: { fontSize: typography.sizes.xs, color: colors.gray[400], textTransform: 'none', letterSpacing: 0 },
  generateBtn: { marginTop: 0 },
  actionsLoading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, gap: spacing.sm },
  timeline: { paddingLeft: spacing.xs },
  regenerateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.sm, marginTop: spacing.xs },
  regenerateText: { fontSize: typography.sizes.xs, color: colors.gray[500] },

  // Actions
  actions: { marginTop: spacing.md, gap: spacing.sm },
  secondaryAction: { marginTop: 0 },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, gap: spacing.xs },
  deleteText: { fontSize: typography.sizes.sm, color: colors.error },
});

export default TaskDetailScreen;
