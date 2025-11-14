/**
 * Home Screen - Simplified version without react-native-paper
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { useAuth, useAuthStore } from '../../stores/AuthStore';
import { colors, spacing, typography, theme } from '../../theme/theme';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import PrimaryButton from '../../components/PrimaryButton';
import EmptyState from '../../components/EmptyState';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../types';

const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const logout = useAuthStore((state) => state.logout);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <View style={styles.header}>
            <Text style={styles.greeting}>Good morning, {firstName} 👋</Text>
            <Text style={styles.subtitle}>Let’s make the next hour count.</Text>
          </View>
          <TouchableOpacity onPress={logout}>
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.whatNowCard}>
          <View style={styles.cardHeader}>
            <View style={styles.iconPill}>
              <MaterialIcons name="lightbulb" size={22} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={styles.cardTitle}>What should I do now?</Text>
              <Text style={styles.cardSubtitle}>Quick, contextual suggestions based on your tasks.</Text>
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
          <Text style={styles.sectionTitle}>Today at a glance</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.overdue]}>0</Text>
              <Text style={styles.statLabel}>Overdue</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.dueToday]}>0</Text>
              <Text style={styles.statLabel}>Due today</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.inProgress]}>0</Text>
              <Text style={styles.statLabel}>In progress</Text>
            </View>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Inbox & focus</Text>
          <EmptyState
            icon="📥"
            title="Nothing captured yet"
            message="Use voice capture or add a task to start building your system. Your future self will thank you."
          />
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
    justifyContent: 'space-around',
    marginTop: spacing.md,
  },
  statItem: {
    alignItems: 'center',
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
    color: theme.colors.primary,
  },
  inProgress: {
    color: colors.statuses.in_progress,
  },
  primaryButton: {
    marginTop: spacing.sm,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
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