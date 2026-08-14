import { useState } from 'react';
import { View, Text, TextInput, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, radius, shadow } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import { submitMoodLog } from '../api';

// Five quick-tap options rather than a 1-10 slider - faster for daily use.
// Mapped to backend's 1-10 scale.
const MOOD_OPTIONS = [
  { score: 2, emoji: '😞', label: 'Very low' },
  { score: 4, emoji: '🙁', label: 'Low' },
  { score: 6, emoji: '😐', label: 'Okay' },
  { score: 8, emoji: '🙂', label: 'Good' },
  { score: 10, emoji: '😄', label: 'Great' },
];

export default function MoodCheckInScreen({ token, onBack, onSubmitted }) {
  const [selectedScore, setSelectedScore] = useState(null);
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState(null); // { uri, base64 } | null
  const [submitting, setSubmitting] = useState(false);

  async function handleTakePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera permission needed', 'Enable camera access in your phone settings to add a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.front,
      quality: 0.5, // keep the base64 payload reasonably small
      base64: true,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets?.[0]) {
      setPhoto({ uri: result.assets[0].uri, base64: result.assets[0].base64 });
    }
  }

  function removePhoto() {
    setPhoto(null);
  }

  async function handleSubmit() {
    if (selectedScore === null) {
      Alert.alert('Pick a mood', 'Tap one of the faces above to log how you\'re feeling.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitMoodLog(token, {
        mood_score: selectedScore,
        notes: notes.trim() || undefined,
        image_base64: photo?.base64,
      });

      if (result.emotion?.error) {
        Alert.alert(
          'Mood logged',
          `Your mood was saved. The photo couldn't be analyzed: ${result.emotion.error}`
        );
      } else if (result.emotion) {
        Alert.alert(
          'Mood logged',
          `Saved. Detected expression: ${result.emotion.dominant_emotion} (${Math.round(result.emotion.confidence * 100)}% confidence)`
        );
      } else {
        Alert.alert('Mood logged', 'Your check-in was saved.');
      }

      onSubmitted();
    } catch (err) {
      Alert.alert('Something went wrong', err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScreenHeader icon="happy-outline" title="Mood check-in" onBack={onBack} />

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.sectionLabel}>How are you feeling right now?</Text>
        <View style={styles.moodRow}>
          {MOOD_OPTIONS.map((opt) => {
            const selected = selectedScore === opt.score;
            return (
              <TouchableOpacity
                key={opt.score}
                style={[styles.moodOption, selected && styles.moodOptionSelected]}
                onPress={() => setSelectedScore(opt.score)}
                activeOpacity={0.75}
              >
                <Text style={styles.moodEmoji}>{opt.emoji}</Text>
                <Text style={[styles.moodLabel, selected && styles.moodLabelSelected]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Notes (optional)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Anything you want to add..."
          placeholderTextColor={colors.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <Text style={styles.sectionLabel}>Add a photo (optional)</Text>
        <Text style={styles.photoHint}>
          A quick selfie lets the app detect your expression alongside your self-reported mood.
          Your photo is analyzed and then discarded - it's never saved.
        </Text>

        {photo ? (
          <View style={styles.photoPreviewWrap}>
            <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
            <TouchableOpacity style={styles.removePhotoButton} onPress={removePhoto}>
              <Ionicons name="close-circle" size={26} color={colors.danger} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto} activeOpacity={0.8}>
            <Ionicons name="camera-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.photoButtonText}>Take a photo</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Save check-in</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.md, paddingBottom: spacing.xl },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between' },
  moodOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginHorizontal: 3,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  moodOptionSelected: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  moodEmoji: { fontSize: 28, marginBottom: 4 },
  moodLabel: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },
  moodLabelSelected: { color: colors.primaryDark, fontWeight: '600' },
  notesInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    minHeight: 70,
    textAlignVertical: 'top',
    fontSize: 14,
    color: colors.text,
  },
  photoHint: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.sm },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    paddingVertical: 14,
    ...shadow,
  },
  photoButtonText: { color: colors.primaryDark, fontSize: 14, fontWeight: '600' },
  photoPreviewWrap: { alignItems: 'center', marginBottom: spacing.sm },
  photoPreview: { width: 140, height: 140, borderRadius: radius.md },
  removePhotoButton: { position: 'absolute', top: -8, right: '28%', backgroundColor: '#fff', borderRadius: 13 },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    ...shadow,
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});