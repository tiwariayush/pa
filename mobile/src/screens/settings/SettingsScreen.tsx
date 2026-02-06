/**
 * Settings Screen - Theme customization with polished option cards,
 * consistent section headers, and clean visual hierarchy.
 */

import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import Screen from '../../components/Screen';
import Card from '../../components/Card';
import { useThemeStore, FontTheme, BackgroundTheme } from '../../stores/ThemeStore';
import { fontThemes, backgroundThemes } from '../../theme/themes';
import { colors, spacing, typography, useTheme } from '../../theme/theme';

const SettingsScreen: React.FC = () => {
  const dynamicTheme = useTheme();
  const { currentTheme, setFont, setBackground, initialize } = useThemeStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleFontSelect = async (font: FontTheme) => {
    await setFont(font);
  };

  const handleBackgroundSelect = async (background: BackgroundTheme) => {
    await setBackground(background);
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Font selection */}
        <Card>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.domains.job + '15' }]}>
              <MaterialIcons name="text-fields" size={18} color={colors.domains.job} />
            </View>
            <View>
              <Text
                style={[
                  styles.sectionTitle,
                  { fontFamily: dynamicTheme.typography.fontFamily.semibold },
                ]}
              >
                Font
              </Text>
              <Text
                style={[
                  styles.sectionDescription,
                  { fontFamily: dynamicTheme.typography.fontFamily.regular },
                ]}
              >
                Choose your preferred font family
              </Text>
            </View>
          </View>

          <View style={styles.optionsList}>
            {(Object.keys(fontThemes) as FontTheme[]).map((fontKey) => {
              const fontTheme = fontThemes[fontKey];
              const isSelected = currentTheme.font === fontKey;

              return (
                <TouchableOpacity
                  key={fontKey}
                  style={[
                    styles.optionCard,
                    {
                      borderColor: isSelected
                        ? dynamicTheme.colors.primary
                        : colors.gray[200],
                      backgroundColor: isSelected
                        ? colors.gray[50]
                        : dynamicTheme.colors.surface,
                    },
                    isSelected && styles.optionCardSelected,
                  ]}
                  onPress={() => handleFontSelect(fontKey)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionRow}>
                    <View style={styles.optionTextCol}>
                      <Text
                        style={[
                          styles.optionName,
                          isSelected && { color: dynamicTheme.colors.primary },
                          { fontFamily: dynamicTheme.typography.fontFamily.medium },
                        ]}
                      >
                        {fontTheme.name}
                      </Text>
                      <Text
                        style={[
                          styles.optionDescription,
                          { fontFamily: dynamicTheme.typography.fontFamily.regular },
                        ]}
                      >
                        {fontTheme.description}
                      </Text>
                    </View>
                    {isSelected && (
                      <MaterialIcons
                        name="check-circle"
                        size={20}
                        color={dynamicTheme.colors.primary}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Background selection */}
        <Card>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.domains.company + '15' }]}>
              <MaterialIcons name="palette" size={18} color={colors.domains.company} />
            </View>
            <View>
              <Text
                style={[
                  styles.sectionTitle,
                  { fontFamily: dynamicTheme.typography.fontFamily.semibold },
                ]}
              >
                Background
              </Text>
              <Text
                style={[
                  styles.sectionDescription,
                  { fontFamily: dynamicTheme.typography.fontFamily.regular },
                ]}
              >
                Choose your preferred background color
              </Text>
            </View>
          </View>

          <View style={styles.optionsList}>
            {(Object.keys(backgroundThemes) as BackgroundTheme[]).map((bgKey) => {
              const bgTheme = backgroundThemes[bgKey];
              const isSelected = currentTheme.background === bgKey;

              return (
                <TouchableOpacity
                  key={bgKey}
                  style={[
                    styles.optionCard,
                    {
                      borderColor: isSelected
                        ? dynamicTheme.colors.primary
                        : colors.gray[200],
                      backgroundColor: isSelected
                        ? colors.gray[50]
                        : dynamicTheme.colors.surface,
                    },
                    isSelected && styles.optionCardSelected,
                  ]}
                  onPress={() => handleBackgroundSelect(bgKey)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionRow}>
                    <View style={styles.colorPreviewRow}>
                      <View
                        style={[
                          styles.colorPreview,
                          { backgroundColor: bgTheme.colors.background },
                        ]}
                      />
                      <View style={styles.optionTextCol}>
                        <Text
                          style={[
                            styles.optionName,
                            isSelected && { color: dynamicTheme.colors.primary },
                            { fontFamily: dynamicTheme.typography.fontFamily.medium },
                          ]}
                        >
                          {bgTheme.name}
                        </Text>
                        <Text
                          style={[
                            styles.optionDescription,
                            { fontFamily: dynamicTheme.typography.fontFamily.regular },
                          ]}
                        >
                          {bgTheme.description}
                        </Text>
                      </View>
                    </View>
                    {isSelected && (
                      <MaterialIcons
                        name="check-circle"
                        size={20}
                        color={dynamicTheme.colors.primary}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
  },
  sectionDescription: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
    marginTop: 1,
  },
  optionsList: {
    gap: spacing.sm,
  },
  optionCard: {
    padding: spacing.md,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  optionCardSelected: {
    borderWidth: 2,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionTextCol: {
    flex: 1,
  },
  colorPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 6,
    marginRight: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  optionName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.gray[900],
  },
  optionDescription: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
    marginTop: 2,
  },
});

export default SettingsScreen;
