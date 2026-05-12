/**
 * Decision Screen - Side-by-side image comparison for DECIDE-type actions.
 * Displays product/option cards with images, pros/cons, prices, and a select button.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { colors, spacing, typography, shadows, useTheme } from '../../theme/theme';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import PrimaryButton from '../../components/PrimaryButton';
import { useToast } from '../../components/Toast';
import { apiService } from '../../services/api';
import type { RootStackParamList, TaskAction, DecisionOption } from '../../types';

type DecisionRoute = RouteProp<RootStackParamList, 'DecisionView'>;
type DecisionNav = StackNavigationProp<RootStackParamList, 'DecisionView'>;

const DecisionScreen: React.FC = () => {
  const route = useRoute<DecisionRoute>();
  const navigation = useNavigation<DecisionNav>();
  const theme = useTheme();
  const toast = useToast();
  const { taskId, actionId } = route.params;

  const [action, setAction] = useState<TaskAction | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const actions = await apiService.getTaskActions(taskId);
        const found = actions.find((a) => a.id === actionId);
        setAction(found || null);

        // Pre-select recommended option
        if (found?.metadata?.options) {
          const idx = (found.metadata.options as DecisionOption[]).findIndex((o) => o.recommended);
          if (idx >= 0) setSelectedIndex(idx);
        }
      } catch {
        toast.error('Could not load decision options.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [taskId, actionId, toast]);

  const options: DecisionOption[] = (action?.metadata?.options || []) as DecisionOption[];

  const handleSelect = useCallback(async () => {
    if (selectedIndex === null || !action) return;
    try {
      const chosen = options[selectedIndex];
      await apiService.updateTaskAction(taskId, actionId, {
        status: 'done',
        metadataUpdates: { chosen_option: chosen.title, chosen_index: selectedIndex },
      });
      toast.success(`Selected: ${chosen.title}`);
      navigation.goBack();
    } catch {
      toast.error('Could not save decision.');
    }
  }, [selectedIndex, action, options, taskId, actionId, toast, navigation]);

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!action || options.length === 0) {
    return (
      <Screen>
        <View style={styles.center}>
          <MaterialIcons name="compare-arrows" size={40} color={colors.gray[300]} />
          <Text style={[styles.emptyText, { fontFamily: theme.typography.fontFamily.regular }]}>
            No options available for this decision.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <MaterialIcons name="compare-arrows" size={20} color={colors.gray[900]} />
          <Text style={[styles.headerTitle, { fontFamily: theme.typography.fontFamily.semibold }]}>
            {action.label}
          </Text>
        </View>
        <Text style={[styles.headerSub, { fontFamily: theme.typography.fontFamily.regular }]}>
          Compare options and pick the best one for your family.
        </Text>

        {/* Option cards */}
        {options.map((option, index) => {
          const isSelected = selectedIndex === index;
          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.8}
              onPress={() => setSelectedIndex(index)}
            >
              <Card
                style={[
                  styles.optionCard,
                  isSelected && { borderColor: colors.info, borderWidth: 2 },
                ]}
              >
                {option.recommended && (
                  <View style={styles.recommendedBadge}>
                    <MaterialIcons name="thumb-up" size={11} color="#FFFFFF" />
                    <Text style={[styles.recommendedText, { fontFamily: theme.typography.fontFamily.bold }]}>
                      Recommended
                    </Text>
                  </View>
                )}

                {/* Image */}
                {option.imageUrl ? (
                  <Image
                    source={{ uri: option.imageUrl }}
                    style={styles.optionImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.noImage}>
                    <MaterialIcons name="image" size={32} color={colors.gray[300]} />
                  </View>
                )}

                {/* Title + Price row */}
                <View style={styles.titleRow}>
                  <Text
                    style={[styles.optionTitle, { fontFamily: theme.typography.fontFamily.semibold }]}
                    numberOfLines={2}
                  >
                    {option.title}
                  </Text>
                  {option.price && (
                    <Text style={[styles.priceText, { fontFamily: theme.typography.fontFamily.bold }]}>
                      {option.price}
                    </Text>
                  )}
                </View>

                {/* Rating */}
                {option.rating != null && (
                  <View style={styles.ratingRow}>
                    <MaterialIcons name="star" size={14} color="#F59E0B" />
                    <Text style={[styles.ratingText, { fontFamily: theme.typography.fontFamily.medium }]}>
                      {option.rating.toFixed(1)}
                    </Text>
                  </View>
                )}

                {/* Description */}
                <Text
                  style={[styles.optionDesc, { fontFamily: theme.typography.fontFamily.regular }]}
                  numberOfLines={3}
                >
                  {option.description}
                </Text>

                {/* Pros/Cons */}
                {option.pros.length > 0 && (
                  <View style={styles.prosConsSection}>
                    {option.pros.map((pro, i) => (
                      <View key={`pro-${i}`} style={styles.proConRow}>
                        <MaterialIcons name="add-circle" size={13} color={colors.success} />
                        <Text style={[styles.proConText, { fontFamily: theme.typography.fontFamily.regular }]}>
                          {pro}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
                {option.cons.length > 0 && (
                  <View style={styles.prosConsSection}>
                    {option.cons.map((con, i) => (
                      <View key={`con-${i}`} style={styles.proConRow}>
                        <MaterialIcons name="remove-circle" size={13} color={colors.error} />
                        <Text style={[styles.proConText, { fontFamily: theme.typography.fontFamily.regular }]}>
                          {con}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Link */}
                {option.url && (
                  <TouchableOpacity
                    style={styles.linkRow}
                    onPress={() => Linking.openURL(option.url!)}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="open-in-new" size={13} color={colors.info} />
                    <Text style={[styles.linkText, { fontFamily: theme.typography.fontFamily.medium }]}>
                      View details
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Selection indicator */}
                {isSelected && (
                  <View style={styles.selectedIndicator}>
                    <MaterialIcons name="check-circle" size={20} color={colors.info} />
                  </View>
                )}
              </Card>
            </TouchableOpacity>
          );
        })}

        {/* Confirm button */}
        <PrimaryButton
          label={selectedIndex !== null ? `Select: ${options[selectedIndex].title}` : 'Select an option'}
          icon="check"
          onPress={handleSelect}
          disabled={selectedIndex === null}
          style={styles.confirmBtn}
        />
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingTop: spacing.md, paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  emptyText: { fontSize: typography.sizes.sm, color: colors.gray[500] },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  headerTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.gray[900] },
  headerSub: { fontSize: typography.sizes.sm, color: colors.gray[500], marginBottom: spacing.md, lineHeight: 19 },

  optionCard: { marginBottom: spacing.md, overflow: 'hidden' },
  recommendedBadge: {
    position: 'absolute', top: spacing.sm, right: spacing.sm, zIndex: 1,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: colors.info, paddingHorizontal: spacing.sm, paddingVertical: 3,
    borderRadius: 6,
  },
  recommendedText: { fontSize: 10, color: '#FFFFFF', fontWeight: typography.weights.bold },

  optionImage: { width: '100%', height: 160, borderRadius: 8, marginBottom: spacing.sm },
  noImage: { width: '100%', height: 100, borderRadius: 8, backgroundColor: colors.gray[100], alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },

  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs },
  optionTitle: { flex: 1, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.gray[900], marginRight: spacing.sm },
  priceText: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.gray[900] },

  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: spacing.xs },
  ratingText: { fontSize: typography.sizes.xs, color: colors.gray[700] },

  optionDesc: { fontSize: typography.sizes.sm, color: colors.gray[600], lineHeight: 19, marginBottom: spacing.sm },

  prosConsSection: { marginBottom: spacing.xs },
  proConRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs, marginBottom: 3 },
  proConText: { flex: 1, fontSize: typography.sizes.xs, color: colors.gray[600], lineHeight: 17 },

  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  linkText: { fontSize: typography.sizes.xs, color: colors.info },

  selectedIndicator: { position: 'absolute', top: spacing.sm, left: spacing.sm },

  confirmBtn: { marginTop: spacing.sm },
});

export default DecisionScreen;
