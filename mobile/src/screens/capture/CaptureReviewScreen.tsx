/**
 * Capture Review Screen - Review parsed tasks from voice/text capture
 * with numbered cards, domain colors, and clean layout.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { colors, spacing, typography, useTheme } from '../../theme/theme';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import PrimaryButton from '../../components/PrimaryButton';
import { useTasks } from '../../stores/TaskStore';
import { useToast } from '../../components/Toast';
import type { ParsedTaskOutput, RootStackParamList } from '../../types';

type CaptureReviewRoute = RouteProp<RootStackParamList, 'CaptureReview'>;
type CaptureReviewNav = StackNavigationProp<RootStackParamList, 'CaptureReview'>;

const CaptureReviewScreen: React.FC = () => {
  const route = useRoute<CaptureReviewRoute>();
  const navigation = useNavigation<CaptureReviewNav>();
  const theme = useTheme();
  const toast = useToast();
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
      await refreshTasks();
      setIsSaving(false);
      toast.success('Your captured tasks are now available in your task list.');
      navigation.navigate('Main');
    } catch (error: any) {
      console.error('Failed to save tasks from capture', error);
      setIsSaving(false);
      toast.error(error.message || 'Could not save tasks. Please try again.');
    }
  }, [captureResult.tasks, navigation, refreshTasks]);

  const hasTasks = captureResult.tasks.length > 0;

  const renderTask = ({ item, index }: { item: ParsedTaskOutput; index: number }) => {
    const domainColor =
      colors.domains[item.domain?.toLowerCase() as keyof typeof colors.domains] ||
      colors.gray[400];

    return (
      <Card accentColor={domainColor} style={styles.taskCard}>
        <View style={styles.taskHeader}>
          <View style={styles.taskIndex}>
            <Text
              style={[
                styles.taskIndexText,
                { fontFamily: theme.typography.fontFamily.bold },
              ]}
            >
              {index + 1}
            </Text>
          </View>
          <Text
            style={[
              styles.taskTitle,
              { fontFamily: theme.typography.fontFamily.semibold },
            ]}
          >
            {item.title}
          </Text>
        </View>

        {item.description ? (
          <Text
            style={[
              styles.taskDescription,
              { fontFamily: theme.typography.fontFamily.regular },
            ]}
          >
            {item.description}
          </Text>
        ) : null}

        {item.contextNotes ? (
          <View style={styles.contextBox}>
            <MaterialIcons name="info-outline" size={13} color={colors.gray[500]} />
            <Text
              style={[
                styles.contextText,
                { fontFamily: theme.typography.fontFamily.regular },
              ]}
            >
              {item.contextNotes}
            </Text>
          </View>
        ) : null}

        <View style={styles.chipsRow}>
          <View style={[styles.chip, { backgroundColor: domainColor + '15' }]}>
            <Text
              style={[
                styles.chipText,
                { color: domainColor, fontFamily: theme.typography.fontFamily.medium },
              ]}
            >
              {item.domain}
            </Text>
          </View>

          {item.priorityHint && (
            <View style={[styles.chip, { backgroundColor: colors.gray[100] }]}>
              <MaterialIcons name="flag" size={11} color={colors.gray[600]} />
              <Text
                style={[
                  styles.chipText,
                  { color: colors.gray[700], fontFamily: theme.typography.fontFamily.medium },
                ]}
              >
                {item.priorityHint}
              </Text>
            </View>
          )}

          {item.estimatedDurationMin ? (
            <View style={[styles.chip, { backgroundColor: colors.gray[100] }]}>
              <MaterialIcons name="schedule" size={11} color={colors.gray[600]} />
              <Text
                style={[
                  styles.chipText,
                  { color: colors.gray[700], fontFamily: theme.typography.fontFamily.medium },
                ]}
              >
                {item.estimatedDurationMin} min
              </Text>
            </View>
          ) : null}
        </View>
      </Card>
    );
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[]}
      >
        {/* Summary card */}
        <Card>
          <View style={styles.summaryHeader}>
            <MaterialIcons name="auto-awesome" size={20} color={colors.gray[900]} />
            <Text
              style={[
                styles.title,
                { fontFamily: theme.typography.fontFamily.semibold },
              ]}
            >
              Review captured tasks
            </Text>
          </View>

          {captureResult.summary ? (
            <Text
              style={[
                styles.summary,
                { fontFamily: theme.typography.fontFamily.regular },
              ]}
            >
              {captureResult.summary}
            </Text>
          ) : null}

          {captureResult.transcript ? (
            <View style={styles.transcriptBox}>
              <Text
                style={[
                  styles.transcriptLabel,
                  { fontFamily: theme.typography.fontFamily.semibold },
                ]}
              >
                WHAT I HEARD
              </Text>
              <Text
                style={[
                  styles.transcriptText,
                  { fontFamily: theme.typography.fontFamily.regular },
                ]}
              >
                {captureResult.transcript}
              </Text>
            </View>
          ) : null}

          <View style={styles.countRow}>
            <MaterialIcons
              name={hasTasks ? 'check-circle' : 'info'}
              size={16}
              color={hasTasks ? colors.success : colors.gray[500]}
            />
            <Text
              style={[
                styles.countText,
                { fontFamily: theme.typography.fontFamily.regular },
              ]}
            >
              {hasTasks
                ? `${captureResult.tasks.length} task${
                    captureResult.tasks.length > 1 ? 's' : ''
                  } found in your capture.`
                : 'No actionable tasks were detected. You can try capturing again.'}
            </Text>
          </View>
        </Card>

        {/* Task list */}
        {hasTasks &&
          (captureResult.tasks as ParsedTaskOutput[]).map((item, index) =>
            renderTask({ item, index })
          )}

        {/* Actions */}
        <View style={styles.footer}>
          <PrimaryButton
            label={hasTasks ? 'Save tasks' : 'Done'}
            icon={hasTasks ? 'check' : 'arrow-back'}
            onPress={handleSaveTasks}
            loading={isSaving}
          />

          {hasTasks && (
            <PrimaryButton
              label="Discard and go back"
              variant="ghost"
              onPress={() => navigation.goBack()}
              style={styles.discardButton}
            />
          )}
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
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
  },
  summary: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    lineHeight: 19,
    marginBottom: spacing.sm,
  },
  transcriptBox: {
    marginBottom: spacing.sm,
    padding: spacing.sm + 2,
    borderRadius: 10,
    backgroundColor: colors.gray[50],
  },
  transcriptLabel: {
    fontSize: 10,
    fontWeight: typography.weights.semibold,
    color: colors.gray[500],
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  transcriptText: {
    fontSize: typography.sizes.sm,
    color: colors.gray[700],
    lineHeight: 19,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  countText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
  },
  taskCard: {
    marginBottom: spacing.sm,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  taskIndexText: {
    fontSize: typography.sizes.xs,
    color: colors.gray[700],
    fontWeight: typography.weights.bold,
  },
  taskTitle: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
  },
  taskDescription: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    lineHeight: 19,
    marginBottom: spacing.xs,
  },
  contextBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  contextText: {
    flex: 1,
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
    lineHeight: 16,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  chipText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  footer: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  discardButton: {
    marginTop: 0,
  },
});

export default CaptureReviewScreen;
