import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Animated, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { submitMoodLog } from '../api';
import { colors, spacing, radius, shadow } from '../theme';

const THEME = { bg: '#E1E7FB', icon: '#6C7FD6' };

const EMOTIONS = ['happy', 'sad', 'angry', 'fear', 'disgust', 'surprise', 'neutral'];

const EMOTION_META = {
  happy: { label: 'Happy', icon: 'happy-outline', color: '#5FAE7B' },
  sad: { label: 'Sad', icon: 'sad-outline', color: '#6C9BD6' },
  angry: { label: 'Angry', icon: 'flame-outline', color: '#E07A7A' },
  fear: { label: 'Fearful / Anxious', icon: 'alert-circle-outline', color: '#E0A458' },
  disgust: { label: 'Disgusted', icon: 'thumbs-down-outline', color: '#B366C9' },
  surprise: { label: 'Surprised', icon: 'flash-outline', color: '#4C9BD6' },
  neutral: { label: 'Neutral / Calm', icon: 'remove-circle-outline', color: colors.textMuted },
};

const EMOTION_TO_SCORE = { happy: 9, surprise: 6, neutral: 5, fear: 3, disgust: 3, sad: 2, angry: 2 };

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

const CAPTURE_INTERVAL_MS = 3000;
const CAPTURE_TOTAL_FRAMES = 10;
const SUBMIT_TIMEOUT_MS = 90000;
const FRAME_WIDTH = 480;

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

// Circular countdown ring drawn with react-native-svg (already a dependency
// via the chart library) - avoids pulling in a new package for this.
function CountdownRing({ progress, size = 84, strokeWidth = 7 }) {
  const radiusVal = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radiusVal;
  const offset = circumference * (1 - progress);

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radiusVal}
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radiusVal}
        stroke="#fff"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        rotation="-90"
        origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  );
}

export default function MoodCheckInScreen({ token, onNavigate, onBack }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState('questions');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [capturing, setCapturing] = useState(false);
  const [framesCaptured, setFramesCaptured] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const cameraRef = useRef(null);
  const framesRef = useRef([]);
  const cancelledRef = useRef(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const currentQuestion = QUESTIONS[questionIndex];
  const selfReportedEmotion = answers.length === QUESTIONS.length ? computeDominantEmotion(answers) : null;
  const moodScore = selfReportedEmotion ? EMOTION_TO_SCORE[selfReportedEmotion] : 5;

  useEffect(() => {
    if (!capturing) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [capturing]);

  // Fallback: some devices never fire onCameraReady, which left the Start button disabled.
  useEffect(() => {
    if (step !== 'camera' || !permission?.granted) return;
    const timer = setTimeout(() => setCameraReady(true), 1500);
    return () => clearTimeout(timer);
  }, [step, permission?.granted]);

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
    if (!cameraRef.current) {
      Alert.alert('Camera not ready', 'Please wait a moment and try again.');
      return;
    }
    cancelledRef.current = false;
    framesRef.current = [];
    setFramesCaptured(0);
    setCapturing(true);

    for (let i = 0; i < CAPTURE_TOTAL_FRAMES; i++) {
      if (cancelledRef.current) return;
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          skipProcessing: true,
        });
        // Shrink each frame so the upload is small (raw camera photos are many MB each).
        const small = await manipulateAsync(
          photo.uri,
          [{ resize: { width: FRAME_WIDTH } }],
          { compress: 0.6, format: SaveFormat.JPEG, base64: true }
        );
        framesRef.current.push(small.base64);
        setFramesCaptured(framesRef.current.length);
      } catch (err) {
        console.log('Frame capture failed:', err.message);
        if (framesRef.current.length === 0 && i === 0) {
          Alert.alert('Capture error (debug)', err.message);
        }
      }
      if (cancelledRef.current) return;
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
      const response = await Promise.race([
        submitMoodLog(token, moodScore, null, framesRef.current, selfReportedEmotion),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('The analysis is taking too long. Check that the backend server is running and reachable from your phone, then try again.')),
            SUBMIT_TIMEOUT_MS
          )
        ),
      ]);
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

          <View style={styles.stepDots}>
            {QUESTIONS.map((q, i) => (
              <View
                key={q.id}
                style={[
                  styles.stepDot,
                  i === questionIndex && styles.stepDotActive,
                  i < questionIndex && styles.stepDotDone,
                ]}
              />
            ))}
          </View>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: spacing.lg }}>
          <Text style={styles.questionPrompt}>{currentQuestion.prompt}</Text>

          {currentQuestion.options.map((option) => {
            const meta = EMOTION_META[option.emotion];
            return (
              <TouchableOpacity
                key={option.emotion}
                style={styles.optionRow}
                onPress={() => handleAnswer(option.emotion)}
                activeOpacity={0.75}
              >
                <View style={[styles.optionIconWrap, { backgroundColor: meta.color + '22' }]}>
                  <Ionicons name={meta.icon} size={18} color={meta.color} />
                </View>
                <Text style={styles.optionText}>{option.text}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity onPress={handleBackQuestion} style={styles.backLink}>
            <Ionicons name="arrow-back" size={14} color={colors.primaryDark} style={{ marginRight: 6 }} />
            <Text style={styles.backLinkText}>{questionIndex === 0 ? 'Cancel' : 'Back'}</Text>
          </TouchableOpacity>
        </ScrollView>
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
          <View style={[styles.resultIconWrap, { backgroundColor: THEME.bg }]}>
            <Ionicons name="camera-outline" size={36} color={THEME.icon} />
          </View>
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

    const progress = framesCaptured / CAPTURE_TOTAL_FRAMES;
    const secondsRemaining = Math.max(0, Math.round((CAPTURE_TOTAL_FRAMES - framesCaptured) * (CAPTURE_INTERVAL_MS / 1000)));

    return (
      <View style={styles.container}>
        <View style={[styles.header, { backgroundColor: THEME.icon }]}>
          <View style={[styles.headerIconWrap, { backgroundColor: THEME.bg }]}>
            <Ionicons name="camera-outline" size={28} color={THEME.icon} />
          </View>
          <Text style={styles.headerTitle}>Mood Check-In</Text>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: spacing.lg }}>
          <View style={styles.cameraWrap}>
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: capturing ? pulseAnim : 1 }] }]}>
              <CameraView ref={cameraRef} style={styles.camera} facing="front" onCameraReady={() => setCameraReady(true)} />
            </Animated.View>

            {capturing && (
              <View style={styles.captureOverlay}>
                <View style={styles.ringWrap}>
                  <CountdownRing progress={progress} />
                  <View style={styles.ringCenter}>
                    <Text style={styles.ringCenterText}>{secondsRemaining}s</Text>
                  </View>
                </View>
              </View>
            )}

            {!capturing && (
              <View style={styles.faceGuide} pointerEvents="none" />
            )}
          </View>

          {!capturing && (
            <View style={styles.selfReportCard}>
              <Ionicons name={EMOTION_META[selfReportedEmotion].icon} size={20} color={THEME.icon} style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.selfReportLabel}>You said you're feeling</Text>
                <Text style={styles.selfReportValue}>{EMOTION_META[selfReportedEmotion].label}</Text>
              </View>
            </View>
          )}

          {!capturing && (
            <Text style={styles.subLabel}>
              We'll take a 30-second look via the camera and compare it with what you told us.
            </Text>
          )}

          {capturing && (
            <View style={styles.progressWrap}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
              <Text style={styles.subLabel}>Hold still and look at the camera · frame {framesCaptured}/{CAPTURE_TOTAL_FRAMES}</Text>
            </View>
          )}

          {submitting ? (
            <View style={[styles.primaryButton, { backgroundColor: THEME.icon }]}>
              <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.primaryButtonText}>Analyzing...</Text>
            </View>
          ) : capturing ? (
            <TouchableOpacity style={[styles.primaryButton, styles.cancelButton]} onPress={cancelCapture}>
              <Text style={styles.primaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: THEME.icon, opacity: cameraReady ? 1 : 0.5 }]}
              onPress={startCapture}
              disabled={!cameraReady}
            >
              <Ionicons name="camera" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.primaryButtonText}>Start 30-Second Check-In</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    );
  }

  // ---- Step 3: result ----
  const detected = result.emotion;
  const detectedMeta = EMOTION_META[detected.dominant_emotion] || EMOTION_META.neutral;
  const selfMeta = EMOTION_META[selfReportedEmotion] || EMOTION_META.neutral;
  const agree = selfReportedEmotion === detected.dominant_emotion;
  const sortedScores = Object.entries(detected.scores || {}).sort((a, b) => b[1] - a[1]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: THEME.icon }]}>
        <View style={[styles.headerIconWrap, { backgroundColor: THEME.bg }]}>
          <Ionicons name="checkmark-circle" size={28} color={THEME.icon} />
        </View>
        <Text style={styles.headerTitle}>Check-In Complete</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: spacing.lg }}>
        <View style={styles.compareRow}>
          <View style={styles.compareCard}>
            <Text style={styles.compareLabel}>YOU SAID</Text>
            <View style={[styles.compareIconWrap, { backgroundColor: selfMeta.color + '22' }]}>
              <Ionicons name={selfMeta.icon} size={24} color={selfMeta.color} />
            </View>
            <Text style={styles.compareValue}>{selfMeta.label}</Text>
          </View>

          <View style={styles.compareDivider}>
            <Ionicons
              name={agree ? 'checkmark-circle' : 'swap-horizontal'}
              size={22}
              color={agree ? colors.primary : colors.textMuted}
            />
          </View>

          <View style={styles.compareCard}>
            <Text style={styles.compareLabel}>WE DETECTED</Text>
            <View style={[styles.compareIconWrap, { backgroundColor: detectedMeta.color + '22' }]}>
              <Ionicons name={detectedMeta.icon} size={24} color={detectedMeta.color} />
            </View>
            <Text style={styles.compareValue}>{detectedMeta.label}</Text>
            <Text style={styles.compareConfidence}>{Math.round(detected.confidence * 100)}% confidence</Text>
          </View>
        </View>

        {result.mismatch_prompt && (
          <View style={styles.mismatchCard}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={THEME.icon} style={{ marginRight: 8 }} />
            <Text style={styles.mismatchText}>{result.mismatch_prompt}</Text>
          </View>
        )}

        <Text style={styles.breakdownTitle}>Emotion breakdown</Text>
        <View style={styles.breakdownCard}>
          {sortedScores.map(([emotion, score]) => {
            const meta = EMOTION_META[emotion] || EMOTION_META.neutral;
            return (
              <View key={emotion} style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>{meta.label}</Text>
                <View style={styles.breakdownBarTrack}>
                  <View style={[styles.breakdownBarFill, { width: `${Math.max(score * 100, 2)}%`, backgroundColor: meta.color }]} />
                </View>
                <Text style={styles.breakdownPercent}>{Math.round(score * 100)}%</Text>
              </View>
            );
          })}
        </View>

        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: THEME.icon, marginTop: spacing.md }]} onPress={onBack}>
          <Text style={styles.primaryButtonText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
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
  stepDots: { flexDirection: 'row', marginTop: spacing.sm },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)', marginHorizontal: 4 },
  stepDotActive: { backgroundColor: '#fff', width: 20 },
  stepDotDone: { backgroundColor: 'rgba(255,255,255,0.75)' },
  body: { flex: 1, padding: spacing.md },
  questionPrompt: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: spacing.md, lineHeight: 23 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    ...shadow,
  },
  optionIconWrap: {
    width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm,
  },
  optionText: { fontSize: 15, fontWeight: '600', color: colors.text, flexShrink: 1 },
  cameraWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
    backgroundColor: '#000',
    ...shadow,
  },
  camera: { flex: 1 },
  faceGuide: {
    position: 'absolute',
    top: '18%',
    left: '20%',
    right: '20%',
    bottom: '28%',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 999,
  },
  captureOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  ringWrap: { alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  ringCenterText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  selfReportCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.xs, ...shadow,
  },
  selfReportLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  selfReportValue: { fontSize: 15, fontWeight: '700', color: colors.text },
  subLabel: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.md, textAlign: 'center' },
  progressWrap: { marginBottom: spacing.md },
  progressTrack: {
    width: '100%', height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden', marginBottom: spacing.sm,
  },
  progressFill: { height: '100%', backgroundColor: THEME.icon },
  primaryButton: { flexDirection: 'row', paddingVertical: 15, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  cancelButton: { backgroundColor: colors.danger },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  permissionText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginVertical: spacing.md },
  backLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  backLinkText: { color: colors.primaryDark, fontSize: 14, fontWeight: '600' },
  resultIconWrap: { width: 72, height: 72, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  compareRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  compareCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm,
    alignItems: 'center', ...shadow,
  },
  compareLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '700', letterSpacing: 0.5, marginBottom: spacing.xs },
  compareIconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  compareValue: { fontSize: 14, fontWeight: '700', color: colors.text, textAlign: 'center' },
  compareConfidence: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  compareDivider: { paddingHorizontal: spacing.xs },
  mismatchCard: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: THEME.bg, borderRadius: radius.md,
    padding: spacing.sm, marginBottom: spacing.md,
  },
  mismatchText: { fontSize: 13, color: THEME.icon, flex: 1, lineHeight: 18, fontWeight: '500' },
  breakdownTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  breakdownCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm, ...shadow },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  breakdownLabel: { width: 90, fontSize: 12, color: colors.text, fontWeight: '600' },
  breakdownBarTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden', marginHorizontal: spacing.sm },
  breakdownBarFill: { height: '100%', borderRadius: 4 },
  breakdownPercent: { width: 36, fontSize: 12, color: colors.textMuted, fontWeight: '600', textAlign: 'right' },
});