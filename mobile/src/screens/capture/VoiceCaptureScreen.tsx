/**
 * Voice Capture Screen - Polished mic button with visual states,
 * clean text input fallback, and professional layout.
 *
 * Uses expo-audio (SDK 54+) instead of deprecated expo-av.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { colors, spacing, typography, shadows, useTheme } from '../../theme/theme';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import PrimaryButton from '../../components/PrimaryButton';
import { useTasks } from '../../stores/TaskStore';
import type { RootStackParamList } from '../../types';

type VoiceCaptureNav = StackNavigationProp<RootStackParamList, 'VoiceCapture'>;

const VoiceCaptureScreen: React.FC = () => {
  const navigation = useNavigation<VoiceCaptureNav>();
  const theme = useTheme();
  const { processVoiceCapture } = useTasks();

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualText, setManualText] = useState('');
  const [isSubmittingText, setIsSubmittingText] = useState(false);

  const startRecording = useCallback(async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Microphone access needed',
          'Please enable microphone access to capture voice.'
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      setIsRecording(true);
    } catch (error: any) {
      console.error('Failed to start recording', error);
      Alert.alert('Error', 'Could not start recording. Please try again.');
    }
  }, []);

  const stopRecordingAndSend = useCallback(async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      console.log('[VoiceCapture] Recording URI:', uri);

      if (!uri) {
        Alert.alert('Error', 'No audio data found. Please try again.');
        return;
      }

      setIsProcessing(true);

      const base64Audio = await readAsStringAsync(uri, {
        encoding: EncodingType.Base64,
      });

      const result = await processVoiceCapture({
        audioData: base64Audio,
      });

      setIsProcessing(false);
      setRecording(null);

      navigation.navigate('CaptureReview', {
        captureResult: result,
      });
    } catch (error: any) {
      console.error('Failed to process voice capture', error);
      setIsProcessing(false);
      setRecording(null);
      Alert.alert('Error', error.message || 'Voice capture failed. Please try again.');
    }
  }, [navigation, processVoiceCapture, recording]);

  const handleMicPress = useCallback(() => {
    if (isRecording) {
      stopRecordingAndSend();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecordingAndSend]);

  const handleTextSubmit = useCallback(async () => {
    const trimmed = manualText.trim();
    if (!trimmed) {
      Alert.alert('Nothing to capture', 'Type a thought or task before submitting.');
      return;
    }

    try {
      setIsSubmittingText(true);
      const result = await processVoiceCapture({
        transcript: trimmed,
      });
      setIsSubmittingText(false);
      setManualText('');

      navigation.navigate('CaptureReview', {
        captureResult: result,
      });
    } catch (error: any) {
      console.error('Failed to process typed capture', error);
      setIsSubmittingText(false);
      Alert.alert('Error', error.message || 'Could not process your text. Please try again.');
    }
  }, [manualText, navigation, processVoiceCapture]);

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Voice capture */}
          <Card elevated>
            <View style={styles.headerRow}>
              <MaterialIcons name="mic" size={20} color={colors.gray[900]} />
              <Text
                style={[
                  styles.title,
                  { fontFamily: theme.typography.fontFamily.semibold },
                ]}
              >
                Voice capture
              </Text>
            </View>
            <Text
              style={[
                styles.subtitle,
                { fontFamily: theme.typography.fontFamily.regular },
              ]}
            >
              Tap the mic and speak freely. I'll turn your thoughts into
              structured tasks you can review before saving.
            </Text>

            <View style={styles.micContainer}>
              {/* Outer ring */}
              <View
                style={[
                  styles.micRing,
                  isRecording && styles.micRingRecording,
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.micButton,
                    isRecording && styles.micButtonRecording,
                  ]}
                  onPress={handleMicPress}
                  activeOpacity={0.9}
                  disabled={isProcessing}
                >
                  <MaterialIcons
                    name={isRecording ? 'stop' : 'mic'}
                    size={32}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>

              <Text
                style={[
                  styles.micLabel,
                  isRecording && styles.micLabelRecording,
                  { fontFamily: theme.typography.fontFamily.medium },
                ]}
              >
                {isRecording
                  ? 'Listening... tap to finish'
                  : 'Tap to start recording'}
              </Text>
            </View>

            {isProcessing && (
              <View style={styles.processingRow}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text
                  style={[
                    styles.processingText,
                    { fontFamily: theme.typography.fontFamily.regular },
                  ]}
                >
                  Processing your capture...
                </Text>
              </View>
            )}
          </Card>

          {/* Text capture */}
          <Card>
            <View style={styles.headerRow}>
              <MaterialIcons name="edit" size={18} color={colors.gray[700]} />
              <Text
                style={[
                  styles.sectionTitle,
                  { fontFamily: theme.typography.fontFamily.semibold },
                ]}
              >
                Prefer typing?
              </Text>
            </View>
            <Text
              style={[
                styles.tipText,
                { fontFamily: theme.typography.fontFamily.regular },
              ]}
            >
              Type what's on your mind and I'll parse it into tasks.
            </Text>
            <TextInput
              style={[
                styles.textInput,
                { fontFamily: theme.typography.fontFamily.regular },
              ]}
              placeholder="E.g. Tomorrow I need to prepare slides for Monday's client meeting and book a pediatrician appointment."
              placeholderTextColor={colors.gray[400]}
              value={manualText}
              onChangeText={setManualText}
              multiline
              numberOfLines={4}
            />
            <PrimaryButton
              label={isSubmittingText ? 'Capturing...' : 'Capture from text'}
              icon="send"
              onPress={handleTextSubmit}
              loading={isSubmittingText}
            />
          </Card>

          {/* Skip */}
          <PrimaryButton
            label="Skip for now"
            variant="ghost"
            onPress={() => navigation.goBack()}
            disabled={isRecording || isProcessing}
            style={styles.skipButton}
          />
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
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.gray[500],
    lineHeight: 19,
  },
  micContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  micRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3,
    borderColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  micRingRecording: {
    borderColor: colors.error + '50',
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gray[900],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  micButtonRecording: {
    backgroundColor: colors.error,
  },
  micLabel: {
    marginTop: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.gray[500],
    fontWeight: typography.weights.medium,
  },
  micLabelRecording: {
    color: colors.error,
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  processingText: {
    fontSize: typography.sizes.sm,
    color: colors.gray[500],
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
  },
  tipText: {
    fontSize: typography.sizes.sm,
    color: colors.gray[500],
    marginBottom: spacing.sm,
    lineHeight: 19,
  },
  textInput: {
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 10,
    padding: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.gray[900],
    minHeight: 96,
    textAlignVertical: 'top',
    backgroundColor: colors.gray[50],
    lineHeight: 20,
  },
  skipButton: {
    marginTop: spacing.sm,
  },
});

export default VoiceCaptureScreen;
