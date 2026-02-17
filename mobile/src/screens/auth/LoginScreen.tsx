/**
 * Login Screen - Polished authentication interface with clean form,
 * branded header, and smooth mode switching.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { useAuth } from '../../stores/AuthStore';
import { colors, spacing, typography, shadows, useTheme } from '../../theme/theme';
import Screen from '../../components/Screen';
import PrimaryButton from '../../components/PrimaryButton';
import { useToast } from '../../components/Toast';

const LoginScreen: React.FC = () => {
  const { login, register, isLoading } = useAuth();
  const theme = useTheme();
  const toast = useToast();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    console.log('[Login] handleSubmit called', { email, isLoginMode });

    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!isLoginMode && !name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    try {
      if (isLoginMode) {
        console.log('[Login] calling login...');
        await login(email.trim(), password);
      } else {
        console.log('[Login] calling register...');
        await register({
          name: name.trim(),
          email: email.trim(),
          password: password,
        });
      }
      console.log('[Login] success');
    } catch (error: any) {
      console.error('[Login] error:', error);
      toast.error(error.message || 'Authentication failed');
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Branding */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <MaterialIcons name="auto-awesome" size={32} color={colors.gray[900]} />
            </View>

            <Text
              style={[
                styles.brandName,
                { fontFamily: theme.typography.fontFamily.bold },
              ]}
            >
              Personal Assistant
            </Text>
            <Text
              style={[
                styles.tagline,
                { fontFamily: theme.typography.fontFamily.regular },
              ]}
            >
              A calmer, more intentional way{'\n'}to manage your life.
            </Text>
          </View>

          {/* Form card */}
          <View style={[styles.formCard, { backgroundColor: theme.colors.surface }]}>
            <Text
              style={[
                styles.formTitle,
                { fontFamily: theme.typography.fontFamily.semibold },
              ]}
            >
              {isLoginMode ? 'Welcome back' : 'Create your account'}
            </Text>

            {!isLoginMode && (
              <View style={styles.inputGroup}>
                <Text
                  style={[
                    styles.inputLabel,
                    { fontFamily: theme.typography.fontFamily.medium },
                  ]}
                >
                  Full name
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { fontFamily: theme.typography.fontFamily.regular },
                  ]}
                  placeholder="Jane Doe"
                  placeholderTextColor={colors.gray[400]}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.inputLabel,
                  { fontFamily: theme.typography.fontFamily.medium },
                ]}
              >
                Email address
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { fontFamily: theme.typography.fontFamily.regular },
                ]}
                placeholder="you@example.com"
                placeholderTextColor={colors.gray[400]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.inputLabel,
                  { fontFamily: theme.typography.fontFamily.medium },
                ]}
              >
                Password
              </Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    { fontFamily: theme.typography.fontFamily.regular },
                  ]}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.gray[400]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword((prev) => !prev)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={20}
                    color={colors.gray[400]}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <PrimaryButton
              label={isLoginMode ? 'Sign in' : 'Create account'}
              icon={isLoginMode ? 'login' : 'person-add'}
              onPress={handleSubmit}
              loading={isLoading}
              style={styles.submitButton}
            />

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text
                style={[
                  styles.dividerText,
                  { fontFamily: theme.typography.fontFamily.regular },
                ]}
              >
                or
              </Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              onPress={() => !isLoading && setIsLoginMode(!isLoginMode)}
              activeOpacity={0.7}
              style={styles.switchRow}
            >
              <Text
                style={[
                  styles.switchLabel,
                  { fontFamily: theme.typography.fontFamily.regular },
                ]}
              >
                {isLoginMode ? "Don't have an account?" : 'Already have an account?'}
              </Text>
              <Text
                style={[
                  styles.switchLink,
                  { fontFamily: theme.typography.fontFamily.semibold },
                ]}
              >
                {' '}
                {isLoginMode ? 'Sign up' : 'Sign in'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  brandName: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
    letterSpacing: -0.3,
  },
  tagline: {
    fontSize: typography.sizes.sm,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 20,
  },
  formCard: {
    padding: spacing.xl,
    borderRadius: 16,
    ...shadows.md,
  },
  formTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
    marginBottom: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.sizes.xs,
    color: colors.gray[600],
    marginBottom: spacing.xs,
    fontWeight: typography.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 3,
    fontSize: typography.sizes.md,
    color: colors.gray[900],
    backgroundColor: colors.gray[50],
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  passwordToggle: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  submitButton: {
    marginTop: spacing.md,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gray[200],
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: typography.sizes.xs,
    color: colors.gray[400],
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: typography.sizes.sm,
    color: colors.gray[500],
  },
  switchLink: {
    fontSize: typography.sizes.sm,
    color: colors.gray[900],
    fontWeight: typography.weights.semibold,
  },
});

export default LoginScreen;
