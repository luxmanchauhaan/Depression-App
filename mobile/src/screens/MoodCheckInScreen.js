import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { submitMoodLog } from '../api';
import { colors, spacing, radius, shadow } from '../theme';

const THEME = { bg: '#E1E7FB', icon: '#6C7FD6' };

// The 7 standard emotion categories, matched to whatever the camera-side
// emotion detection model outputs (e.g. FER-style models: angry, disgust,
// fear, happy, sad, surprise, neutral). Every question below offers exactly
// these 7, just framed differently, so the "self-reported" emotion is the
// mode (most-picked) answer across all 4 - a simple built-in reliability
// check rather than relying on a single question.
const EMOTIONS = ['happy', 'sad', 'angry', 'fear', 'disgust', 'surprise', 'neutral'];

const EMOTION_META = {
  happy: { label: 'Happy', icon: 'happy-outline' },
  sad: { label: 'Sad', icon: 'sad-outline' },
  angry: { label: 'Angry', icon: 'flame-outline' },
  fear: { label: 'Fearful / Anxious', icon: 'alert-circle-outline' },
  disgust: { label: 'Disgusted', icon: 'thumbs-down-outline' },
  surprise: { label: 'Surprised', icon: 'flash-outline' },
  neutral: { label: 'Neutral / Calm', icon: 'remove-circle-outline' },
};

// A rough 1-10 mood score per dominant emotion, kept only so the existing
// mood_score field on the backend still gets a sensible value. The real
// signal for the comparison step is the emotion category itself.
const EMOTION_TO_SCORE = {
  happy: 9,
  surprise: 6,
  neutral: 5,
  fear: 3,
  disgust: 3,
  sad: 2,
  angry: 2,
};

const QUESTIONS = [
  {
    id: 'q1',
    prompt: 'Right now, which word best matches how you feel?',
    options: [
      { emotion: 'happy', text: 'Happy' },
      { emotion: 'sad', text: 'Sad' },
      { emotion: 'angry', text: 'Angry' },
      { emotion: 'fear', text: 'Fearful or anxious' },
      { emotion: 'disgust', text: 'Disgusted' },
      { emotion: 'surprise', text: 'Surprised' },
      { emotion: 'neutral', text: 'Calm / neutral' },
    ],
  },
  {
    id: 'q2',
    prompt: "If someone asked what's going on with you, what would you say?",
    options: [
      { emotion: 'happy', text: 'Everything feels great' },
      { emotion: 'sad', text: "I'm feeling down or low" },
      { emotion: 'angry', text: "I'm frustrated or irritated" },
      { emotion: 'fear', text: "I'm nervous or worried" },
      { emotion: 'disgust', text: 'Something is bothering me' },
      { emotion: 'surprise', text: 'Something caught me off guard' },
      { emotion: 'neutral', text: "Nothing much, I'm just okay" },
    ],
  },
  {
    id: 'q3',
    prompt: 'Which best describes how your body feels right now?',
    options: [
      { emotion: 'happy', text: 'Light and energized' },
      { emotion: 'sad', text: 'Heavy, low energy' },
      { emotion: 'angry', text: 'Tense, jaw or fists clenched' },
      { emotion: 'fear', text: 'Tight chest, restless' },
      { emotion: 'disgust', text: 'Uneasy stomach' },
      { emotion: 'surprise', text: 'Alert, heart racing' },
      { emotion: 'neutral', text: 'Relaxed and steady' },
    ],
  },
  {
    id: 'q4',
    prompt: 'What do you feel like doing right now?',
    options: [
      { emotion: 'happy', text: 'Share good news with someone' },
      { emotion: 'sad', text: 'Be alone for a while' },
      { emotion: 'angry', text: 'Vent or confront something' },
      { emotion: 'fear', text: 'Avoid or get away from something' },
      { emotion: 'disgust', text: 'Push something away from me' },
      { emotion: 'surprise', text: 'Talk about what just happened' },
      { emotion: 'neutral', text: 'Just continue with my day' },
    ],
  },
];

// How the 30-second window is chopped up: one frame every 3 seconds = 10
// frames total. The Python emotion service only ever analyzes one image
// per call, so this stays as discrete stills rather than a video upload -
// simpler on both ends, and the Node backend aggregates the 10 results.
const CAPTURE_INTERVAL_MS = 3000;
const CAPTURE_TOTAL_FRAMES = 10; // 10 * 3s = 30s

// Returns the most-picked emotion across the 4 answers. Ties are broken by
// the order in EMOTIONS (stable, deterministic) rather than by answer order,
// so the result doesn't depend on which question the tie came from.
function computeDominantEmotion(answers) {
  const counts = {};
  answers.forEach((emotion) => {
    counts[emotion] = (counts[emotion] || 0) + 1;
  });
  let best = null;
  let bestCount = -1;
  EMOTIONS.forEach((emotion) => {
    const count = counts[emotion] || 0;
    if (count > bestCount) {
      bestCount = count;
      best = emotion;
    }
  });
  return best;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function MoodCheckInScreen({ token, onNavigate, onBack }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState('questions'); // 'questions' | 'camera' | 'result'
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [capturing, setCapturing] = useState(false);
  const [framesCaptured, setFramesCaptured] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const cameraRef = useRef(null);
  const framesRef = useRef([]);
  const cancelledRef = useRef(false);

  const currentQuestion = QUESTIONS[questionIndex];
  const selfReportedEmotion = answers.length === QUESTIONS.length ? computeDominantEmotion(answers) : null;
  const moodScore = selfReportedEmotion ? EMOTION_TO_SCORE[selfReportedEmotion] : 5;

  function handleAnswer(emotion) {
    const nextAnswers = [...answers, emotion];
    setAnswers(nextAnswers);

    if (questionIndex + 1 < QUESTIONS.length) {
      setQuestionIndex(questionIndex + 1);
    } else {
      setStep('camera');
    }
  }

  function handleBackQuestion() {
    if (questionIndex === 0) {
      onBack();
      return;
    }
    setAnswers(answers.slice(0, -1));
    setQuestionIndex(questionIndex - 1);
  }

  async function startCapture() {
    if (!cameraRef.current) return;
    cancelledRef.current = false;
    framesRef.current = [];
    setFramesCaptured(0);
    setCapturing(true);

    for (let i = 0; i < CAPTURE_TOTAL_FRAMES; i++) {
      if (cancelledRef.current) return;

      try {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.4,
          skipProcessing: true,
        });
        framesRef.current.push(photo.base64);
        setFramesCaptured(framesRef.current.length);
      } catch (err) {
        // Skip a failed frame (e.g. camera momentarily busy) and keep going -
        // the backend tolerates some frames failing analysis later too.
        console.log('Frame capture failed, skipping:', err.message);
      }

      if (cancelledRef.current) return;

      // Don't wait after the last frame.
      if (i < CAPTURE_TOTAL_FRAMES - 1) {
        await wait(CAPTURE_INTERVAL_MS);
      }
    }

    setCapturing(false);

    if (framesRef.current.length === 0) {
      Alert.alert('Check-in failed', 'No frames could be captured. Please try again.');
      return;
    }

    await handleSubmit();
  }

  function cancelCapture() {
    cancelledRef.current = true;
    setCapturing(false);
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const response = await submitMoodLog(token, moodScore, null, framesRef.current, selfReportedEmotion);
      setResult(response);
      setStep('result');
    } catch (err) {
      Alert.alert('Check-in failed', err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ---- Step 1: 4-question self-report ----
  if (step === 'questions') {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { backgroundColor: THEME.icon }]}>
          <View style={[styles.headerIconWrap, { backgroundColor: THEME.bg }]}>
            <Ionicons name="happy-outline" size={28} color={THEME.icon} />
          </View>
          <Text style={styles.headerTitle}>Mood Check-In</Text>
          <Text style={styles.headerProgress}>
            Question {questionIndex + 1} of {QUESTIONS.length}
          </Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.questionPrompt}>{currentQuestion.prompt}</Text>

          {currentQuestion.options.map((option) => (
            <TouchableOpacity
              key={option.emotion}
              style={styles.optionRow}
              onPress={() => handleAnswer(option.emotion)}
            >
              <Ionicons
                name={EMOTION_META[option.emotion].icon}
                size={20}
                color={THEME.icon}
                style={{ marginRight: spacing.sm }}
              />
              <Text style={styles.optionText}>{option.text}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          ))}

          <TouchableOpacity onPress={handleBackQuestion} style={styles.backLink}>
            <Text style={styles.backLinkText}>{questionIndex === 0 ? 'Cancel' : 'Back'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ---- Step 2: 30-second camera capture ----
  if (step === 'camera') {
    if (!permission) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator color={THEME.icon} />
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="camera-outline" size={48} color={colors.textMuted} />
          <Text style={styles.permissionText}>Camera access is needed for mood check-ins.</Text>
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: THEME.icon }]} onPress={requestPermission}>
            <Text style={styles.primaryButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onBack} style={styles.backLink}>
            <Text style={styles.backLinkText}>Back to dashboard</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const secondsRemaining = Math.max(0, (CAPTURE_TOTAL_FRAMES - framesCaptured) * (CAPTURE_INTERVAL_MS / 1000));

    return (
      <View style={styles.container}>
        <View style={[styles.header, { backgroundColor: THEME.icon }]}>
          <View style={[styles.headerIconWrap, { backgroundColor: THEME.bg }]}>
            <Ionicons name="camera-outline" size={28} color={THEME.icon} />
          </View>
          <Text style={styles.headerTitle}>Mood Check-In</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.cameraWrap}>
            <CameraView ref={cameraRef} style={styles.camera} facing="front" />
            {capturing && (
              <View style={styles.captureOverlay}>
                <View style={styles.captureBadge}>
                  <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
                  <Text style={styles.captureBadgeText}>{secondsRemaining}s left</Text>
                </View>
              </View>
            )}
          </View>

          {!capturing && (
            <>
              <Text style={styles.moodLabel}>
                You said you're feeling: {EMOTION_META[selfReportedEmotion].label}
              </Text>
              <Text style={styles.subLabel}>
                We'll take a 30-second look via the camera and compare it with what you told us.
              </Text>
            </>
          )}

          {capturing && (
            <View style={styles.progressWrap}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${(framesCaptured / CAPTURE_TOTAL_FRAMES) * 100}%` }]} />
              </View>
              <Text style={styles.subLabel}>Hold still and look at the camera ({framesCaptured}/{CAPTURE_TOTAL_FRAMES})</Text>
            </View>
          )}

          {submitting ? (
            <View style={[styles.primaryButton, { backgroundColor: THEME.icon }]}>
              <ActivityIndicator color="#fff" />
            </View>
          ) : capturing ? (
            <TouchableOpacity style={[styles.primaryButton, styles.cancelButton]} onPress={cancelCapture}>
              <Text style={styles.primaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: THEME.icon }]} onPress={startCapture}>
              <Ionicons name="camera" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.primaryButtonText}>Start 30-Second Check-In</Text>
            </TouchableOpacity>
          )}

          {!capturing && !submitting && (
            <TouchableOpacity onPress={onBack} style={styles.backLink}>
              <Text style={styles.backLinkText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // ---- Step 3: result ----
  return (
    <View style={styles.centerContainer}>
      <View style={[styles.resultIconWrap, { backgroundColor: THEME.bg }]}>
        <Ionicons name="checkmark-circle" size={40} color={THEME.icon} />
      </View>
      <Text style={styles.resultTitle}>Check-in saved</Text>
      <Text style={styles.resultDetail}>
        Detected: {result.emotion.dominant_emotion} ({Math.round(result.emotion.confidence * 100)}% confidence)
      </Text>

      {result.mismatch_prompt && (
        <View style={styles.mismatchCard}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={THEME.icon} style={{ marginRight: 8 }} />
          <Text style={styles.mismatchText}>{result.mismatch_prompt}</Text>
        </View>
      )}

      <TouchableOpacity style={[styles.primaryButton, { backgroundColor: THEME.icon }]} onPress={onBack}>
        <Text style={styles.primaryButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerContainer: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  header: {
    paddingTop: 70, paddingBottom: 24, paddingHorizontal: spacing.md, alignItems: 'center',
    borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg,
  },
  headerIconWrap: { width: 56, height: 56, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerProgress: { fontSize: 12, color: '#fff', opacity: 0.85, marginTop: 4, fontWeight: '600' },
  body: { flex: 1, padding: spacing.md },
  questionPrompt: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: spacing.md, lineHeight: 23 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    ...shadow,
  },
  optionText: { fontSize: 15, fontWeight: '600', color: colors.text },
  cameraWrap: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadow,
  },
  camera: { flex: 1 },
  captureOverlay: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  captureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  captureBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  moodLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 2, textAlign: 'center' },
  subLabel: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.md, textAlign: 'center' },
  progressWrap: { marginBottom: spacing.md },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: { height: '100%', backgroundColor: THEME.icon },
  primaryButton: { flexDirection: 'row', paddingVertical: 15, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  cancelButton: { backgroundColor: colors.danger },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  permissionText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginVertical: spacing.md },
  backLink: { alignItems: 'center', marginTop: spacing.md },
  backLinkText: { color: colors.primaryDark, fontSize: 14, fontWeight: '600' },
  resultIconWrap: { width: 72, height: 72, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  resultTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  resultDetail: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.md, textAlign: 'center', textTransform: 'capitalize' },
  mismatchCard: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: THEME.bg, borderRadius: radius.md,
    padding: spacing.sm, marginBottom: spacing.md, maxWidth: 320,
  },
  mismatchText: { fontSize: 13, color: THEME.icon, flex: 1, lineHeight: 18, fontWeight: '500' },
});