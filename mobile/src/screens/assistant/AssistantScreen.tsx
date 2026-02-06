/**
 * Assistant Screen - "What should I do now?" with icon-labeled chips,
 * polished form layout, and professional recommendation cards.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, shadows, useTheme } from '../../theme/theme';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import PrimaryButton from '../../components/PrimaryButton';
import { useTasks } from '../../stores/TaskStore';
import type { WhatNowRequest, WhatNowResponse } from '../../types';

const energyIcons: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  low: 'battery-2-bar',
  medium: 'battery-4-bar',
  high: 'battery-full',
};

const locationIcons: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  home: 'home',
  office: 'business',
  outside: 'directions-walk',
};

const AssistantScreen: React.FC = () => {
  const theme = useTheme();
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
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Input form */}
        <Card elevated>
          <View style={styles.titleRow}>
            <View style={styles.titleIcon}>
              <MaterialIcons name="auto-awesome" size={20} color={colors.gray[900]} />
            </View>
            <View style={styles.titleTextCol}>
              <Text
                style={[
                  styles.title,
                  { fontFamily: theme.typography.fontFamily.semibold },
                ]}
              >
                What should I do now?
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { fontFamily: theme.typography.fontFamily.regular },
                ]}
              >
                Tell me your context and I'll recommend the best tasks.
              </Text>
            </View>
          </View>

          {/* Time */}
          <View style={styles.field}>
            <Text
              style={[
                styles.label,
                { fontFamily: theme.typography.fontFamily.medium },
              ]}
            >
              <MaterialIcons name="schedule" size={13} color={colors.gray[600]} />
              {'  '}Time available (minutes)
            </Text>
            <TextInput
              style={[
                styles.input,
                { fontFamily: theme.typography.fontFamily.regular },
              ]}
              keyboardType="number-pad"
              value={minutes}
              onChangeText={setMinutes}
              placeholder="30"
              placeholderTextColor={colors.gray[400]}
            />
          </View>

          {/* Energy */}
          <View style={styles.field}>
            <Text
              style={[
                styles.label,
                { fontFamily: theme.typography.fontFamily.medium },
              ]}
            >
              <MaterialIcons name="bolt" size={13} color={colors.gray[600]} />
              {'  '}Energy level
            </Text>
            <View style={styles.chipRow}>
              {(['low', 'medium', 'high'] as const).map((level) => {
                const selected = energy === level;
                return (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.chip,
                      selected && styles.chipSelected,
                      { borderColor: selected ? theme.colors.primary : colors.gray[200] },
                    ]}
                    onPress={() => setEnergy(level)}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons
                      name={energyIcons[level]}
                      size={14}
                      color={selected ? '#FFFFFF' : colors.gray[600]}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.chipTextSelected,
                        { fontFamily: theme.typography.fontFamily.medium },
                      ]}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Location */}
          <View style={styles.field}>
            <Text
              style={[
                styles.label,
                { fontFamily: theme.typography.fontFamily.medium },
              ]}
            >
              <MaterialIcons name="place" size={13} color={colors.gray[600]} />
              {'  '}Location
            </Text>
            <View style={styles.chipRow}>
              {(['home', 'office', 'outside'] as const).map((loc) => {
                const selected = location === loc;
                return (
                  <TouchableOpacity
                    key={loc}
                    style={[
                      styles.chip,
                      selected && styles.chipSelected,
                      { borderColor: selected ? theme.colors.primary : colors.gray[200] },
                    ]}
                    onPress={() => setLocation(loc)}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons
                      name={locationIcons[loc]}
                      size={14}
                      color={selected ? '#FFFFFF' : colors.gray[600]}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.chipTextSelected,
                        { fontFamily: theme.typography.fontFamily.medium },
                      ]}
                    >
                      {loc.charAt(0).toUpperCase() + loc.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <PrimaryButton
            label="Get recommendations"
            icon="lightbulb"
            onPress={handleGetRecommendations}
            loading={isLoading}
          />
        </Card>

        {/* Loading */}
        {isLoading && !result && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text
              style={[
                styles.loadingText,
                { fontFamily: theme.typography.fontFamily.regular },
              ]}
            >
              Thinking about your next best move...
            </Text>
          </View>
        )}

        {/* Results */}
        {result && (
          <View>
            <Text
              style={[
                styles.resultsLabel,
                { fontFamily: theme.typography.fontFamily.semibold },
              ]}
            >
              Recommendations
            </Text>

            {result.recommendations.length === 0 ? (
              <Card>
                <EmptyState
                  icon="🤔"
                  title="No clear recommendation"
                  message="Try adjusting your time, energy level, or location for better matches."
                  compact
                />
              </Card>
            ) : (
              result.recommendations.map((rec, index) => {
                const domainColor =
                  colors.domains[
                    rec.task?.domain?.toLowerCase() as keyof typeof colors.domains
                  ] || colors.gray[400];

                return (
                  <Card key={index} accentColor={domainColor} style={styles.recCard}>
                    <View style={styles.recHeader}>
                      <View style={styles.recRank}>
                        <Text
                          style={[
                            styles.recRankText,
                            { fontFamily: theme.typography.fontFamily.bold },
                          ]}
                        >
                          {index + 1}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.recTitle,
                          { fontFamily: theme.typography.fontFamily.semibold },
                        ]}
                      >
                        {rec.task.title}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.recReason,
                        { fontFamily: theme.typography.fontFamily.regular },
                      ]}
                    >
                      {rec.reason}
                    </Text>

                    <View style={styles.recMeta}>
                      <View style={styles.recMetaItem}>
                        <MaterialIcons name="schedule" size={12} color={colors.gray[500]} />
                        <Text
                          style={[
                            styles.recMetaText,
                            { fontFamily: theme.typography.fontFamily.regular },
                          ]}
                        >
                          ~{rec.estimatedTime} min
                        </Text>
                      </View>
                      <View style={styles.recMetaItem}>
                        <MaterialIcons name="trending-up" size={12} color={colors.success} />
                        <Text
                          style={[
                            styles.recMetaText,
                            { fontFamily: theme.typography.fontFamily.regular },
                          ]}
                        >
                          {Math.round(rec.confidence * 100)}% match
                        </Text>
                      </View>
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  titleIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  titleTextCol: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
    marginTop: 3,
    lineHeight: 17,
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.sm,
    color: colors.gray[700],
    marginBottom: spacing.sm,
    fontWeight: typography.weights.medium,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: typography.sizes.md,
    color: colors.gray[900],
    backgroundColor: colors.gray[50],
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: colors.gray[50],
    gap: spacing.xs,
  },
  chipSelected: {
    backgroundColor: colors.gray[900],
    borderColor: colors.gray[900],
  },
  chipText: {
    fontSize: typography.sizes.xs,
    color: colors.gray[700],
    fontWeight: typography.weights.medium,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.sizes.sm,
    color: colors.gray[500],
  },
  resultsLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  recCard: {
    marginBottom: spacing.sm,
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  recRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  recRankText: {
    fontSize: typography.sizes.xs,
    color: colors.gray[700],
    fontWeight: typography.weights.bold,
  },
  recTitle: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
  },
  recReason: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    lineHeight: 19,
    marginTop: spacing.xs,
  },
  recMeta: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  recMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  recMetaText: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
  },
});

export default AssistantScreen;
