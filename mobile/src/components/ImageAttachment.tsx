/**
 * ImageAttachment - Component for capturing and displaying image attachments.
 * Uses expo-image-picker for camera and gallery access.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, useTheme } from '../theme/theme';
import type { TaskAttachment } from '../types';

interface ImageAttachmentProps {
  attachments: TaskAttachment[];
  onAddAttachment?: (uri: string, caption?: string) => void;
  onRemoveAttachment?: (id: string) => void;
  readonly?: boolean;
}

export const ImageAttachmentView: React.FC<ImageAttachmentProps> = ({
  attachments,
  onAddAttachment,
  onRemoveAttachment,
  readonly = false,
}) => {
  const theme = useTheme();
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const pickFromGallery = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]) {
      onAddAttachment?.(result.assets[0].uri);
    }
  }, [onAddAttachment]);

  const pickFromCamera = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]) {
      onAddAttachment?.(result.assets[0].uri);
    }
  }, [onAddAttachment]);

  const imageAttachments = attachments.filter((a) => a.type === 'image');

  return (
    <View style={styles.container}>
      {imageAttachments.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.imageRow}
        >
          {imageAttachments.map((att) => (
            <TouchableOpacity
              key={att.id}
              style={styles.imageContainer}
              activeOpacity={0.8}
              onPress={() => setExpandedImage(att.url)}
            >
              <Image source={{ uri: att.url }} style={styles.thumbnail} resizeMode="cover" />
              {att.caption && (
                <Text
                  style={[styles.caption, { fontFamily: theme.typography.fontFamily.regular }]}
                  numberOfLines={1}
                >
                  {att.caption}
                </Text>
              )}
              {!readonly && onRemoveAttachment && (
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => onRemoveAttachment(att.id)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="close" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {!readonly && (
        <View style={styles.addRow}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={pickFromCamera}
            activeOpacity={0.7}
          >
            <MaterialIcons name="photo-camera" size={18} color={colors.gray[600]} />
            <Text style={[styles.addText, { fontFamily: theme.typography.fontFamily.medium }]}>
              Camera
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addButton}
            onPress={pickFromGallery}
            activeOpacity={0.7}
          >
            <MaterialIcons name="photo-library" size={18} color={colors.gray[600]} />
            <Text style={[styles.addText, { fontFamily: theme.typography.fontFamily.medium }]}>
              Gallery
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  imageRow: {
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
  },
  thumbnail: {
    width: 120,
    height: 90,
    borderRadius: 10,
  },
  caption: {
    fontSize: 10,
    color: colors.gray[500],
    marginTop: 3,
    maxWidth: 120,
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
  },
  addText: {
    fontSize: typography.sizes.xs,
    color: colors.gray[600],
    fontWeight: typography.weights.medium,
  },
});

export default ImageAttachmentView;
