import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { colors, spacing, typography, theme } from '../../theme/theme';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import PrimaryButton from '../../components/PrimaryButton';
import { useTasks } from '../../stores/TaskStore';
import type { ParsedTaskOutput, RootStackParamList } from '../../types';

type CaptureReviewRoute = RouteProp<RootStackParamList, 'CaptureReview'>;
type CaptureReviewNav = StackNavigationProp<RootStackParamList, 'CaptureReview'>;

const CaptureReviewScreen: React.FC = () => {
  const route = useRoute<CaptureReviewRoute>();
  const navigation = useNavigation<CaptureReviewNav>();
  const { refreshTasks } = useTasks();

  const { captureResult } = route.params;
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveTasks = useCallback(async () => {
    if (!captureResult.tasks.length) {
      navigation.goBack();
      return;
    }

    try {
      setIsSaving(true);

      // Tasks are already created by the backend in /capture/voice.
      // Just refresh the task list so the UI picks them up.
      await refreshTasks();

      setIsSaving(false);
      Alert.alert('Saved', 'Your captured tasks are now available in your task list.');

      // Go back to main tasks view
      navigation.navigate('Main');
    } catch (error: any) {
      console.error('Failed to save tasks from capture', error);
      setIsSaving(false);
      Alert.alert('Error', error.message || 'Could not save tasks. Please try again.');
    }
  }, [captureResult.tasks, navigation, refreshTasks]);

  const renderTask = ({ item, index }: { item: ParsedTaskOutput; index: number }) => {
    return (
      <Card style={styles.taskCard}>
        <View style={styles.taskHeader}>
          <Text style={styles.taskIndex}>{index + 1}</Text>
          <Text style={styles.taskTitle}>{item.title}</Text>
        </View>
        {item.description && (
          <Text style={styles.taskDescription}>{item.description}</Text>
        )}
        {item.contextNotes && (
          <Text style={styles.taskContext}>{item.contextNotes}</Text>
        )}
        <View style={styles.chipsRow}>
          <View style={[styles.chip, styles.domainChip]}>
            <Text style={styles.chipText}>{item.domain}</Text>
          </View>
          <View style={[styles.chip, styles.priorityChip]}>
            <Text style={styles.chipText}>{item.priorityHint}</Text>
          </View>
          {item.estimatedDurationMin && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{item.estimatedDurationMin} min</Text>
            </View>
          )}
        </View>
      </Card>
    );
  };

  const hasTasks = captureResult.tasks.length > 0;

  return (
    <Screen>
      <View style={styles.container}>
        <Card>
          <Text style={styles.title}>Review captured tasks</Text>
          {captureResult.summary && (
            <Text style={styles.summary}>{captureResult.summary}</Text>
          )}

          {captureResult.transcript && (
            <View style={styles.transcriptBox}>
              <Text style={styles.transcriptLabel}>What I heard</Text>
              <Text style={styles.transcriptText}>{captureResult.transcript}</Text>
            </View>
          )}

          <Text style={styles.meta}>
            {hasTasks
              ? `I found ${captureResult.tasks.length} task${
                  captureResult.tasks.length > 1 ? 's' : ''
                } in your capture.`
              : 'No actionable tasks were detected. You can try capturing again.'}
          </Text>
        </Card>

        {hasTasks && (
          <FlatList
            data={captureResult.tasks as ParsedTaskOutput[]}
            keyExtractor={(_, index) => String(index)}
            renderItem={renderTask}
            contentContainerStyle={styles.listContent}
          />
        )}

        <View style={styles.footer}>
          <PrimaryButton
            label={hasTasks ? 'Save tasks' : 'Done'}
            onPress={handleSaveTasks}
            loading={isSaving}
          />
          {isSaving && (
            <View style={styles.savingRow}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.savingText}>Saving to your task list…</Text>
            </View>
          )}
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  summary: {
    fontSize: typography.sizes.sm,
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  transcriptBox: {
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: theme.roundness,
    backgroundColor: colors.gray[50],
  },
  transcriptLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.gray[500],
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  transcriptText: {
    fontSize: typography.sizes.sm,
    color: colors.gray[700],
  },
  meta: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
  },
  listContent: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  taskCard: {
    marginBottom: spacing.md,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  taskIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    textAlign: 'center',
    textAlignVertical: 'center',
    marginRight: spacing.sm,
    fontSize: typography.sizes.sm,
    color: colors.gray[700],
    fontWeight: typography.weights.medium,
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
  taskContext: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
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
  domainChip: {
    backgroundColor: colors.gray[100],
  },
  priorityChip: {
    backgroundColor: colors.gray[200],
  },
  chipText: {
    fontSize: typography.sizes.xs,
    color: colors.gray[700],
  },
  footer: {
    marginTop: 'auto',
    paddingTop: spacing.lg,
  },
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  savingText: {
    marginLeft: spacing.sm,
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
  },
});

export default CaptureReviewScreen;