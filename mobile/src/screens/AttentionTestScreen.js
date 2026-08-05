import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { submitCognitiveResult } from '../api';
import { colors, spacing, radius, shadow, categoryColors } from '../theme';

const TARGET_LETTER = 'X';
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'X'];
const ROUND_COUNT = 20;
const LETTER_DISPLAY_MS = 900;
const TARGET_PROBABILITY = 0.3;
const c = categoryColors.attention;

export default function AttentionTestScreen({ token, onNavigate }) {
  const [phase, setPhase] = useState('intro');
  const [currentLetter, setCurrentLetter] = useState('');
  const [round, setRound] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [falseAlarms, setFalseAlarms] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const respondedThisRound = useRef(false);
  const timers = useRef([]);
  const counts = useRef({ hits: 0, misses: 0, falseAlarms: 0 });

  function startTest() {
    counts.current = { hits: 0, misses: 0, falseAlarms: 0 };
    setHits(0);
    setMisses(0);
    setFalseAlarms(0);
    setRound(0);
    setPhase('running');
    runRound(0);
  }

  function runRound(roundIndex) {
    if (roundIndex >= ROUND_COUNT) {
      finishTest();
      return;
    }

    const isTarget = Math.random() < TARGET_PROBABILITY;
    const letter = isTarget
      ? TARGET_LETTER
      : LETTERS.filter((l) => l !== TARGET_LETTER)[Math.floor(Math.random() * (LETTERS.length - 1))];

    setCurrentLetter(letter);
    respondedThisRound.current = false;
    setRound(roundIndex + 1);

    const t = setTimeout(() => {
      if (!respondedThisRound.current && letter === TARGET_LETTER) {
        counts.current.misses += 1;
        setMisses(counts.current.misses);
      }
      runRound(roundIndex + 1);
    }, LETTER_DISPLAY_MS);
    timers.current.push(t);
  }

  function handleTap() {
    if (phase !== 'running' || respondedThisRound.current) return;
    respondedThisRound.current = true;

    if (currentLetter === TARGET_LETTER) {
      counts.current.hits += 1;
      setHits(counts.current.hits);
    } else {
      counts.current.falseAlarms += 1;
      setFalseAlarms(counts.current.falseAlarms);
    }
  }

  async function finishTest() {
    setPhase('result');
    setSubmitting(true);
    try {
      const { hits: h, misses: m, falseAlarms: f } = counts.current;
      const totalTargets = h + m;
      const accuracy = totalTargets > 0 ? Math.round((h / totalTargets) * 100) : 0;
      await submitCognitiveResult(token, 'attention', accuracy, {
        hits: h, misses: m, false_alarms: f, total_rounds: ROUND_COUNT,
      });
    } catch (err) {
      Alert.alert('Failed to save result', err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const header = (title) => (
    <View style={[styles.header, { backgroundColor: c.icon }]}>
      <View style={styles.headerRow}>
        <View style={[styles.headerIconWrap, { backgroundColor: c.bg }]}>
          <Ionicons name="eye-outline" size={26} color={c.icon} />
        </View>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      </View>
    </View>
  );

  if (phase === 'intro') {
    return (
      <View style={styles.container}>
        {header('Attention Test')}
        <View style={styles.body}>
          <View style={styles.card}>
            <Text style={styles.instructions}>
              Letters will appear one at a time. Tap the button only when you see
              the letter "{TARGET_LETTER}" — don't tap for any other letter.
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

  if (phase === 'running') {
    return (
      <View style={styles.container}>
        {header('Attention Test')}
        <View style={styles.centerBody}>
          <Text style={styles.progressText}>{round} / {ROUND_COUNT}</Text>
          <TouchableOpacity style={[styles.letterBox, { backgroundColor: c.icon }]} onPress={handleTap} activeOpacity={0.7}>
            <Text style={styles.letterText}>{currentLetter}</Text>
          </TouchableOpacity>
          <Text style={styles.hint}>Tap the box when you see "{TARGET_LETTER}"</Text>
        </View>
      </View>
    );
  }

  const totalTargets = hits + misses;
  const accuracy = totalTargets > 0 ? Math.round((hits / totalTargets) * 100) : 0;

  return (
    <View style={styles.container}>
      {header('Test Completed')}
      <View style={styles.centerBody}>
        <View style={[styles.resultIconWrap, { backgroundColor: c.bg }]}>
          <Ionicons name="checkmark-circle" size={40} color={c.icon} />
        </View>
        <Text style={styles.resultText}>Accuracy: {accuracy}%</Text>
        <Text style={styles.resultSubtext}>Hits: {hits} · Missed: {misses} · False taps: {falseAlarms}</Text>
        {submitting ? (
          <Text style={styles.savingText}>Saving result...</Text>
        ) : (
          <TouchableOpacity
            style={[styles.primaryButton, styles.resultButton, { backgroundColor: c.icon }]}
            activeOpacity={0.85}
            onPress={() => onNavigate('activities')}
          >
            <Ionicons name="arrow-back" size={18} color="#fff" style={{ marginRight: 8 }} />
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
    paddingTop: 44,
    paddingBottom: 16,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', height: 48 },
  headerIconWrap: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  headerTitle: { fontSize: 19, fontWeight: '700', color: '#fff', lineHeight: 24, includeFontPadding: false, textAlignVertical: 'center' },
  body: { padding: spacing.md, flex: 1 },
  centerBody: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, ...shadow },
  instructions: { fontSize: 14, color: colors.text, lineHeight: 20, textAlign: 'center' },
  primaryButton: { paddingVertical: 16, borderRadius: radius.lg, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  resultButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    ...shadow,
  },
  backLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  backLinkText: { color: colors.primaryDark, fontSize: 14, fontWeight: '600' },
  progressText: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.md },
  letterBox: { width: 160, height: 160, borderRadius: radius.lg, justifyContent: 'center', alignItems: 'center', ...shadow },
  letterText: { fontSize: 72, color: '#fff', fontWeight: '700' },
  hint: { fontSize: 13, color: colors.textMuted, marginTop: spacing.md, textAlign: 'center' },
  resultIconWrap: { width: 72, height: 72, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  resultText: { fontSize: 22, fontWeight: '700', marginBottom: 8, textAlign: 'center', color: colors.text },
  resultSubtext: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.lg, textAlign: 'center' },
  savingText: { fontSize: 14, color: colors.textMuted },
});