import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { colors, spacing, typography, theme } from '../../theme/theme';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import PrimaryButton from '../../components/PrimaryButton';
import { useTasks } from '../../stores/TaskStore';
import type { RootStackParamList } from '../../types';

type VoiceCaptureNav = StackNavigationProp<RootStackParamList, 'VoiceCapture'>;

const VoiceCaptureScreen: React.FC = () => {
  const navigation = useNavigation<VoiceCaptureNav>();
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
        Alert.alert('Microphone access needed', 'Please enable microphone access to capture voice.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
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

      if (!uri) {
        Alert.alert('Error', 'No audio data found. Please try again.');
        return;
      }

      setIsProcessing(true);

      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
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
      <View style={styles.container}>
        <Card>
          <Text style={styles.title}>Capture what’s on your mind</Text>
          <Text style={styles.subtitle}>
            Tap the mic and speak freely. I’ll turn your thoughts into structured tasks you can
            review before saving.
          </Text>

          <View style={styles.micContainer}>
            <TouchableOpacity
              style={[styles.micButton, isRecording && styles.micButtonRecording]}
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

            <Text style={styles.micLabel}>
              {isRecording
                ? 'Listening… tap to finish'
                : 'Tap to start recording'}
            </Text>
          </View>

          {isProcessing && (
            <View style={styles.processingRow}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.processingText}>Processing your capture…</Text>
            </View>
          )}
        </Card>

        <Card style={styles.textCard}>
          <Text style={styles.tipTitle}>Prefer typing?</Text>
          <Text style={styles.tipText}>
            You can also type what’s on your mind and I’ll parse it into tasks.
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder="E.g. Tomorrow I need to prepare slides for Monday’s client meeting and book a pediatrician appointment next week."
            value={manualText}
            onChangeText={setManualText}
            multiline
            numberOfLines={4}
          />
          <PrimaryButton
            label={isSubmittingText ? 'Capturing…' : 'Capture from text'}
            onPress={handleTextSubmit}
            loading={isSubmittingText}
          />
        </Card>

        <PrimaryButton
          label="Skip for now"
          onPress={() => navigation.goBack()}
          style={styles.skipButton}
          disabled={isRecording || isProcessing}
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: spacing.lg,
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
  },
  micContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  micButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonRecording: {
    backgroundColor: colors.error,
  },
  micLabel: {
    marginTop: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  processingText: {
    marginLeft: spacing.sm,
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
  },
  tipCard: {
    marginTop: spacing.lg,
  },
  textCard: {
    marginTop: spacing.lg,
  },
  tipTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  tipText: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  textInput: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: theme.roundness,
    padding: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.gray[900],
    minHeight: 96,
    textAlignVertical: 'top',
  },
  skipButton: {
    marginTop: spacing.lg,
  },
});

export default VoiceCaptureScreen;