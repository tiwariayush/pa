/**
 * Assistant Screen - Enhanced AI decision dashboard with auto-recommendations
 * on load, collapsible "Refine" form, and action-oriented recommendation cards.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { colors, spacing, typography, shadows, useTheme } from '../../theme/theme';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import PrimaryButton from '../../components/PrimaryButton';
import FloatingMenu from '../../components/FloatingMenu';
import { useToast } from '../../components/Toast';
import { useTasks } from '../../stores/TaskStore';
import type { WhatNowRequest, WhatNowResponse, RootStackParamList } from '../../types';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  const toast = useToast();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { getWhatNowRecommendations, isLoading } = useTasks();

  // Context form state
  const [minutes, setMinutes] = useState('30');
  const [energy, setEnergy] = useState<'low' | 'medium' | 'high'>('medium');
  const [location, setLocation] = useState<'home' | 'office' | 'outside'>('home');

  // UI state
  const [result, setResult] = useState<WhatNowResponse | null>(null);
  const [isRefineOpen, setIsRefineOpen] = useState(false);
  const [hasAutoFetched, setHasAutoFetched] = useState(false);
  const spinAnim = useRef(new Animated.Value(0)).current;

  const fetchRecommendations = useCallback(async () => {
    try {
      const request: WhatNowRequest = {
        currentTime: new Date().toISOString(),
        availableDurationMin: parseInt(minutes, 10) || undefined,
        energyLevel: energy,
        location,
      };
      const data = await getWhatNowRecommendations(request);
      setResult(data);
    } catch (err: any) {
      toast.error('Could not load recommendations.');
    }
  }, [minutes, energy, location, getWhatNowRecommendations, toast]);

  // Auto-fetch on mount
  useEffect(() => {
    if (!hasAutoFetched) {
      setHasAutoFetched(true);
      fetchRecommendations();
    }
  }, [hasAutoFetched, fetchRecommendations]);

  const toggleRefine = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsRefineOpen((prev) => !prev);
  };

  const handleRefresh = () => {
    fetchRecommendations();
  };

  // Filter out recommendations with missing task data
  const validRecs = (result?.recommendations ?? []).filter(
    (r) => r.task && r.task.title
  );
  const topRec = validRecs[0] ?? null;
  const restRecs = validRecs.slice(1);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* "Your next move" hero card */}
        <Card elevated>
          <View style={styles.heroHeader}>
            <View style={styles.heroIcon}>
              <MaterialIcons name="auto-awesome" size={22} color={colors.gray[900]} />
            </View>
            <View style={styles.heroTextCol}>
              <Text
                style={[
                  styles.heroTitle,
                  { fontFamily: theme.typography.fontFamily.semibold },
                ]}
              >
                Your next move
              </Text>
              <Text
                style={[
                  styles.heroSubtitle,
                  { fontFamily: theme.typography.fontFamily.regular },
                ]}
              >
                {isLoading && !result
                  ? 'Thinking about what fits best right now...'
                  : result?.contextSummary || 'AI-powered suggestions based on your context.'}
              </Text>
            </View>
          </View>

          {/* Loading state */}
          {isLoading && !result && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text
                style={[
                  styles.loadingText,
                  { fontFamily: theme.typography.fontFamily.regular },
                ]}
              >
                Analyzing your tasks...
              </Text>
            </View>
          )}

          {/* Top recommendation */}
          {topRec && !isLoading && (
            <TouchableOpacity
              style={[
                styles.topRecCard,
                {
                  borderColor:
                    colors.domains[
                      topRec.task?.domain?.toLowerCase() as keyof typeof colors.domains
                    ] || colors.gray[200],
                },
              ]}
              activeOpacity={0.7}
              onPress={() => {
                if (topRec.task?.id) {
                  navigation.navigate('TaskDetail', { taskId: topRec.task.id });
                }
              }}
            >
              <View style={styles.topRecHeader}>
                <View
                  style={[
                    styles.topRecBadge,
                    {
                      backgroundColor:
                        (colors.domains[
                          topRec.task?.domain?.toLowerCase() as keyof typeof colors.domains
                        ] || colors.gray[400]) + '15',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.topRecBadgeText,
                      {
                        color:
                          colors.domains[
                            topRec.task?.domain?.toLowerCase() as keyof typeof colors.domains
                          ] || colors.gray[600],
                        fontFamily: theme.typography.fontFamily.bold,
                      },
                    ]}
                  >
                    #1
                  </Text>
                </View>
                <Text
                  style={[
                    styles.topRecTitle,
                    { fontFamily: theme.typography.fontFamily.semibold },
                  ]}
                  numberOfLines={2}
                >
                  {topRec.task?.title ?? 'Untitled'}
                </Text>
              </View>

              <Text
                style={[
                  styles.topRecReason,
                  { fontFamily: theme.typography.fontFamily.regular },
                ]}
              >
                {topRec.reason}
              </Text>

              <View style={styles.topRecMeta}>
                <View style={styles.metaItem}>
                  <MaterialIcons name="schedule" size={13} color={colors.gray[500]} />
                  <Text
                    style={[
                      styles.metaText,
                      { fontFamily: theme.typography.fontFamily.regular },
                    ]}
                  >
                    ~{topRec.estimatedTime} min
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <MaterialIcons name="trending-up" size={13} color={colors.success} />
                  <Text
                    style={[
                      styles.metaText,
                      { fontFamily: theme.typography.fontFamily.regular },
                    ]}
                  >
                    {Math.round(topRec.confidence * 100)}% match
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* Empty state */}
          {!isLoading && result && result.recommendations.length === 0 && (
            <EmptyState
              icon="🤔"
              title="No clear recommendation"
              message="Try adjusting your time, energy, or location below."
              compact
            />
          )}

          {/* Refresh button */}
          {result && !isLoading && (
            <PrimaryButton
              label="Refresh recommendations"
              icon="refresh"
              variant="outline"
              onPress={handleRefresh}
              style={styles.refreshBtn}
            />
          )}
        </Card>

        {/* Collapsible Refine section */}
        <TouchableOpacity
          style={styles.refineToggle}
          onPress={toggleRefine}
          activeOpacity={0.7}
        >
          <View style={styles.refineToggleLeft}>
            <MaterialIcons name="tune" size={16} color={colors.gray[600]} />
            <Text
              style={[
                styles.refineToggleText,
                { fontFamily: theme.typography.fontFamily.medium },
              ]}
            >
              Refine context
            </Text>
          </View>
          <MaterialIcons
            name={isRefineOpen ? 'expand-less' : 'expand-more'}
            size={20}
            color={colors.gray[500]}
          />
        </TouchableOpacity>

        {isRefineOpen && (
          <Card style={styles.refineCard}>
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
              label="Update recommendations"
              icon="lightbulb"
              onPress={() => {
                fetchRecommendations();
                toggleRefine();
              }}
              loading={isLoading}
            />
          </Card>
        )}

        {/* More recommendations */}
        {restRecs.length > 0 && !isLoading && (
          <View>
            <Text
              style={[
                styles.sectionLabel,
                { fontFamily: theme.typography.fontFamily.semibold },
              ]}
            >
              Also consider
            </Text>

            {restRecs.map((rec, index) => {
              const domainColor =
                colors.domains[
                  rec.task?.domain?.toLowerCase() as keyof typeof colors.domains
                ] || colors.gray[400];

              return (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (rec.task?.id) {
                      navigation.navigate('TaskDetail', { taskId: rec.task.id });
                    }
                  }}
                >
                  <Card accentColor={domainColor} style={styles.recCard}>
                    <View style={styles.recHeader}>
                      <View style={styles.recRank}>
                        <Text
                          style={[
                            styles.recRankText,
                            { fontFamily: theme.typography.fontFamily.bold },
                          ]}
                        >
                          {index + 2}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.recTitle,
                          { fontFamily: theme.typography.fontFamily.semibold },
                        ]}
                        numberOfLines={2}
                      >
                        {rec.task?.title ?? 'Untitled'}
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
                      <View style={styles.metaItem}>
                        <MaterialIcons name="schedule" size={12} color={colors.gray[500]} />
                        <Text
                          style={[
                            styles.metaText,
                            { fontFamily: theme.typography.fontFamily.regular },
                          ]}
                        >
                          ~{rec.estimatedTime} min
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <MaterialIcons name="trending-up" size={12} color={colors.success} />
                        <Text
                          style={[
                            styles.metaText,
                            { fontFamily: theme.typography.fontFamily.regular },
                          ]}
                        >
                          {Math.round(rec.confidence * 100)}% match
                        </Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* AI reasoning */}
        {result?.reasoning && !isLoading && (
          <View style={styles.reasoningBox}>
            <MaterialIcons name="psychology" size={14} color={colors.gray[500]} />
            <Text
              style={[
                styles.reasoningText,
                { fontFamily: theme.typography.fontFamily.regular },
              ]}
            >
              {result.reasoning}
            </Text>
          </View>
        )}
      </ScrollView>
      <FloatingMenu />
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },

  // Hero card
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  heroTextCol: {
    flex: 1,
  },
  heroTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
    letterSpacing: -0.2,
  },
  heroSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
    marginTop: 3,
    lineHeight: 17,
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
  refreshBtn: {
    marginTop: spacing.sm,
  },

  // Top recommendation
  topRecCard: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  topRecHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  topRecBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  topRecBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  topRecTitle: {
    flex: 1,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
  },
  topRecReason: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  topRecMeta: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  // Meta items
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
  },

  // Refine toggle
  refineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    borderRadius: 10,
    backgroundColor: colors.gray[100],
  },
  refineToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  refineToggleText: {
    fontSize: typography.sizes.sm,
    color: colors.gray[700],
    fontWeight: typography.weights.medium,
  },
  refineCard: {
    marginBottom: spacing.sm,
  },

  // Form fields
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

  // Section label
  sectionLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },

  // Recommendation cards
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

  // Reasoning
  reasoningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.sm,
  },
  reasoningText: {
    flex: 1,
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
    lineHeight: 17,
  },
});

export default AssistantScreen;
