import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, ActivityIndicator, TouchableOpacity } from 'react-native';
import { colors, spacing, theme, typography } from '../../theme/theme';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import PrimaryButton from '../../components/PrimaryButton';
import { useTasks } from '../../stores/TaskStore';
import type { WhatNowRequest, WhatNowResponse } from '../../types';

const AssistantScreen: React.FC = () => {
  const { getWhatNowRecommendations, isLoading } = useTasks();
  const [minutes, setMinutes] = useState('30');
  const [energy, setEnergy] = useState<'low' | 'medium' | 'high' | undefined>('medium');
  const [location, setLocation] = useState<'home' | 'office' | 'outside' | undefined>('home');
  const [result, setResult] = useState<WhatNowResponse | null>(null);

  const handleGetRecommendations = async () => {
    const availableDurationMin = parseInt(minutes, 10) || undefined;

    const request: WhatNowRequest = {
      currentTime: new Date().toISOString(),
      availableDurationMin,
      energyLevel: energy,
      location,
    };

    const data = await getWhatNowRecommendations(request);
    setResult(data);
  };

  return (
    <Screen style={styles.container}>
      <Card>
        <Text style={styles.title}>What should I do now?</Text>
        <Text style={styles.subtitle}>
          Tell me how much time you have and how you’re feeling. I’ll recommend the best tasks for
          this moment.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Time available (minutes)</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={minutes}
            onChangeText={setMinutes}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Energy level</Text>
          <View style={styles.chipRow}>
            {(['low', 'medium', 'high'] as const).map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.chip,
                  energy === level && styles.chipSelected,
                ]}
                onPress={() => setEnergy(level)}
              >
                <Text
                  style={[
                    styles.chipText,
                    energy === level && styles.chipTextSelected,
                  ]}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Location</Text>
          <View style={styles.chipRow}>
            {(['home', 'office', 'outside'] as const).map((loc) => (
              <TouchableOpacity
                key={loc}
                style={[
                  styles.chip,
                  location === loc && styles.chipSelected,
                ]}
                onPress={() => setLocation(loc)}
              >
                <Text
                  style={[
                    styles.chipText,
                    location === loc && styles.chipTextSelected,
                  ]}
                >
                  {loc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <PrimaryButton
          label="Get recommendations"
          onPress={handleGetRecommendations}
          loading={isLoading}
        />
      </Card>

      {isLoading && !result && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Thinking about your next best move…</Text>
        </View>
      )}

      {result && (
        <Card style={styles.resultsCard}>
          {result.recommendations.length === 0 ? (
            <EmptyState
              icon="🤔"
              title="No clear recommendation"
              message="Try adjusting your time, energy level, or location for better matches."
            />
          ) : (
            <>
              <Text style={styles.resultsTitle}>Recommended tasks</Text>
              {result.recommendations.map((rec, index) => (
                <View key={index} style={styles.recCard}>
                  <Text style={styles.recTitle}>{rec.task.title}</Text>
                  <Text style={styles.recReason}>{rec.reason}</Text>
                  <Text style={styles.recMeta}>
                    ~{rec.estimatedTime} min • confidence {Math.round(rec.confidence * 100)}%
                  </Text>
                </View>
              ))}
            </>
          )}
        </Card>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginBottom: spacing.md,
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.sm,
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: theme.roundness,
    padding: spacing.sm,
    fontSize: typography.sizes.sm,
    color: colors.gray[900],
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: colors.gray[100],
    marginRight: spacing.sm,
    marginTop: spacing.xs,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
  },
  chipText: {
    fontSize: typography.sizes.xs,
    color: colors.gray[700],
  },
  chipTextSelected: {
    color: 'white',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  loadingText: {
    marginLeft: spacing.sm,
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
  },
  resultsCard: {
    marginTop: spacing.lg,
  },
  resultsTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  recCard: {
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gray[200],
  },
  recTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.gray[900],
  },
  recReason: {
    fontSize: typography.sizes.sm,
    color: colors.gray[700],
    marginTop: spacing.xs,
  },
  recMeta: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
});

export default AssistantScreen;