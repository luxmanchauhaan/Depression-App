import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { submitCognitiveResult } from '../api';
import { colors, spacing, radius, shadow, categoryColors } from '../theme';

const ROUND_COUNT = 8;
const MIN_DELAY_MS = 1200;
const MAX_DELAY_MS = 3000;
const c = categoryColors.processing_speed;

export default function ProcessingSpeedTestScreen({ token, onNavigate }) {
  const [phase, setPhase] = useState('intro');
  const [round, setRound] = useState(0);
  const [times, setTimes] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const showTime = useRef(0);
  const timerRef = useRef(null);
  const timesRef = useRef([]);

  function startTest() {
    timesRef.current = [];
    setTimes([]);
    setRound(0);
    runRound(0);
  }

  function runRound(roundIndex) {
    if (roundIndex >= ROUND_COUNT) {
      finishTest();
      return;
    }
    setRound(roundIndex + 1);
    setPhase('waiting');
    const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
    timerRef.current = setTimeout(() => {
      showTime.current = Date.now();
      setPhase('ready');
    }, delay);
  }

  function handleTap() {
    if (phase === 'waiting') {
      clearTimeout(timerRef.current);
      setPhase('tooSoon');
      setTimeout(() => runRound(round), 1000);
      return;
    }
    if (phase === 'ready') {
      const reactionMs = Date.now() - showTime.current;
      timesRef.current = [...timesRef.current, reactionMs];
      setTimes(timesRef.current);
      runRound(round);
    }
  }

  async function finishTest() {
    setPhase('result');
    setSubmitting(true);
    try {
      const validTimes = timesRef.current;
      const avg = validTimes.length > 0
        ? Math.round(validTimes.reduce((a, b) => a + b, 0) / validTimes.length)
        : 0;
      await submitCognitiveResult(token, 'processing_speed', avg, {
        reaction_times_ms: validTimes,
        rounds_completed: validTimes.length,
      });
    } catch (err) {
      Alert.alert('Failed to save result', err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const header = (title) => (
    <View style={[styles.header, { backgroundColor: c.icon }]}>
      <View style={[styles.headerIconWrap, { backgroundColor: c.bg }]}>
        <Ionicons name="speedometer-outline" size={28} color={c.icon} />
      </View>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );

  if (phase === 'intro') {
    return (
      <View style={styles.container}>
        {header('Processing Speed Test')}
        <View style={styles.body}>
          <View style={styles.card}>
            <Text style={styles.instructions}>
              Wait for the box to turn green, then tap it as fast as you can.
              Tapping too early restarts that round. This repeats for {ROUND_COUNT} rounds.
            </Text>
          </View>
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: c.icon }]} onPress={startTest}>
            <Text style={styles.primaryButtonText}>Start</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onNavigate('activities')} style={styles.backLink}>
            <Ionicons name="arrow-back" size={16} color={colors.primaryDark} style={{ marginRight: 6 }} />
            <Text style={styles.backLinkText}>Back to activities</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (phase === 'waiting' || phase === 'ready' || phase === 'tooSoon') {
    return (
      <View style={styles.container}>
        {header('Processing Speed Test')}
        <View style={styles.centerBody}>
          <Text style={styles.progressText}>{round} / {ROUND_COUNT}</Text>
          <TouchableOpacity
            style={[
              styles.tapBox,
              phase === 'waiting' && { backgroundColor: colors.dangerLight, borderWidth: 2, borderColor: colors.danger },
              phase === 'ready' && { backgroundColor: c.icon },
              phase === 'tooSoon' && { backgroundColor: colors.danger },
            ]}
            onPress={handleTap}
            activeOpacity={0.8}
          >
            <Text style={[styles.tapBoxText, phase === 'waiting' && { color: colors.danger }]}>
              {phase === 'waiting' && 'Wait...'}
              {phase === 'ready' && 'Tap now!'}
              {phase === 'tooSoon' && 'Too soon — retry'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const avg = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;

  return (
    <View style={styles.container}>
      {header('Test Complete')}
      <View style={styles.centerBody}>
        <View style={[styles.resultIconWrap, { backgroundColor: c.bg }]}>
          <Ionicons name="checkmark-circle" size={40} color={c.icon} />
        </View>
        <Text style={styles.resultText}>Average reaction time: {avg} ms</Text>
        {submitting ? (
          <Text style={styles.savingText}>Saving result...</Text>
        ) : (
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: c.icon, flexDirection: 'row' }]} onPress={() => onNavigate('activities')}>
            <Ionicons name="arrow-back-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.primaryButtonText}>Back to activities</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: 70,
    paddingBottom: 24,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  headerIconWrap: { width: 56, height: 56, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  body: { padding: spacing.md, flex: 1 },
  centerBody: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, ...shadow },
  instructions: { fontSize: 14, color: colors.text, lineHeight: 20, textAlign: 'center' },
  primaryButton: { paddingVertical: 16, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  backLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  backLinkText: { color: colors.primaryDark, fontSize: 14, fontWeight: '600' },
  progressText: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.md },
  tapBox: { width: 220, height: 220, borderRadius: radius.lg, justifyContent: 'center', alignItems: 'center', ...shadow },
  tapBoxText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  resultIconWrap: { width: 72, height: 72, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  resultText: { fontSize: 20, marginBottom: spacing.lg, textAlign: 'center', color: colors.text, fontWeight: '600' },
  savingText: { fontSize: 14, color: colors.textMuted },
});