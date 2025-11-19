/**
 * Settings Screen
 * Allows users to customize theme (fonts and backgrounds)
 */

import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import Screen from '../../components/Screen';
import Card from '../../components/Card';
import { useThemeStore, FontTheme, BackgroundTheme } from '../../stores/ThemeStore';
import { fontThemes, backgroundThemes } from '../../theme/themes';
import { colors, spacing, typography, theme } from '../../theme/theme';

const SettingsScreen: React.FC = () => {
  const { currentTheme, setFont, setBackground, initialize } = useThemeStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleFontSelect = async (font: FontTheme) => {
    await setFont(font);
    // Note: Font change will require app restart or font reload
  };

  const handleBackgroundSelect = async (background: BackgroundTheme) => {
    await setBackground(background);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="text-fields" size={24} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Font</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Choose your preferred font family
          </Text>
          
          <View style={styles.optionsGrid}>
            {(Object.keys(fontThemes) as FontTheme[]).map((fontKey) => {
              const fontTheme = fontThemes[fontKey];
              const isSelected = currentTheme.font === fontKey;
              
              return (
                <TouchableOpacity
                  key={fontKey}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  onPress={() => handleFontSelect(fontKey)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionHeader}>
                    <Text style={[styles.optionName, isSelected && styles.optionNameSelected]}>
                      {fontTheme.name}
                    </Text>
                    {isSelected && (
                      <MaterialIcons name="check-circle" size={20} color={theme.colors.primary} />
                    )}
                  </View>
                  <Text style={styles.optionDescription}>{fontTheme.description}</Text>
                  {fontKey === 'space-grotesk' && (
                    <Text style={styles.currentBadge}>Current</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <Card>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="palette" size={24} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Background</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Choose your preferred background color
          </Text>
          
          <View style={styles.optionsGrid}>
            {(Object.keys(backgroundThemes) as BackgroundTheme[]).map((bgKey) => {
              const bgTheme = backgroundThemes[bgKey];
              const isSelected = currentTheme.background === bgKey;
              
              return (
                <TouchableOpacity
                  key={bgKey}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  onPress={() => handleBackgroundSelect(bgKey)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionHeader}>
                    <View style={styles.colorPreviewRow}>
                      <View 
                        style={[
                          styles.colorPreview, 
                          { backgroundColor: bgTheme.colors.background }
                        ]} 
                      />
                      <Text style={[styles.optionName, isSelected && styles.optionNameSelected]}>
                        {bgTheme.name}
                      </Text>
                    </View>
                    {isSelected && (
                      <MaterialIcons name="check-circle" size={20} color={theme.colors.primary} />
                    )}
                  </View>
                  <Text style={styles.optionDescription}>{bgTheme.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <Card>
          <View style={styles.infoBox}>
            <MaterialIcons name="info" size={20} color={colors.gray[600]} />
            <Text style={styles.infoText}>
              Font changes require restarting the app. Background changes apply immediately.
            </Text>
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    fontFamily: typography.fontFamily.semibold,
    color: theme.colors.onSurface,
    marginLeft: spacing.sm,
  },
  sectionDescription: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fontFamily.regular,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.md,
  },
  optionsGrid: {
    gap: spacing.md,
  },
  optionCard: {
    padding: spacing.md,
    borderRadius: theme.roundness,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: theme.colors.surface,
    marginBottom: spacing.sm,
  },
  optionCardSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: theme.colors.surfaceVariant,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  colorPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorPreview: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  optionName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    fontFamily: typography.fontFamily.medium,
    color: theme.colors.onSurface,
  },
  optionNameSelected: {
    color: theme.colors.primary,
  },
  optionDescription: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fontFamily.regular,
    color: theme.colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  currentBadge: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fontFamily.medium,
    color: theme.colors.primary,
    marginTop: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: theme.roundness,
  },
  infoText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.gray[600],
    marginLeft: spacing.sm,
    lineHeight: 20,
  },
});

export default SettingsScreen;

