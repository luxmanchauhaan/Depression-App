import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { submitCognitiveResult } from '../api';
import { colors, spacing, radius, shadow, categoryColors } from '../theme';

const COLOR_WORDS = [
  { name: 'RED', hex: '#D93025' },
  { name: 'BLUE', hex: '#1A73E8' },
  { name: 'GREEN', hex: '#188038' },
  { name: 'YELLOW', hex: '#E8A200' },
];

const ROUND_COUNT = 15;
const ROUND_TIMEOUT_MS = 3000;
const c = categoryColors.executive_function;

export default function ExecutiveFunctionTestScreen({ token, onNavigate }) {
  const [phase, setPhase] = useState('intro');
  const [round, setRound] = useState(0);
  const [wordColor, setWordColor] = useState(COLOR_WORDS[0]);
  const [inkColor, setInkColor] = useState(COLOR_WORDS[0]);
  const [submitting, setSubmitting] = useState(false);

  const respondedRef = useRef(false);
  const startTimeRef = useRef(0);
  const timeoutRef = useRef(null);
  const statsRef = useRef({ correct: 0, incorrect: 0, timedOut: 0, reactionTimes: [] });

  function startTest() {
    statsRef.current = { correct: 0, incorrect: 0, timedOut: 0, reactionTimes: [] };
    setRound(0);
    setPhase('running');
    runRound(0);
  }

  function runRound(roundIndex) {
    if (roundIndex >= ROUND_COUNT) {
      finishTest();
      return;
    }

    const word = COLOR_WORDS[Math.floor(Math.random() * COLOR_WORDS.length)];
    let ink = COLOR_WORDS[Math.floor(Math.random() * COLOR_WORDS.length)];
    if (Math.random() < 0.75) {
      const others = COLOR_WORDS.filter((cw) => cw.name !== word.name);
      ink = others[Math.floor(Math.random() * others.length)];
    }

    setWordColor(word);
    setInkColor(ink);
    respondedRef.current = false;
    startTimeRef.current = Date.now();
    setRound(roundIndex + 1);

    timeoutRef.current = setTimeout(() => {
      if (!respondedRef.current) {
        statsRef.current.timedOut += 1;
        runRound(roundIndex + 1);
      }
    }, ROUND_TIMEOUT_MS);
  }

  function handleAnswer(selectedColorName) {
    if (phase !== 'running' || respondedRef.current) return;
    respondedRef.current = true;
    clearTimeout(timeoutRef.current);

    const reactionMs = Date.now() - startTimeRef.current;
    statsRef.current.reactionTimes.push(reactionMs);

    if (selectedColorName === inkColor.name) {
      statsRef.current.correct += 1;
    } else {
      statsRef.current.incorrect += 1;
    }

    runRound(round);
  }

  async function finishTest() {
    setPhase('result');
    setSubmitting(true);
    try {
      const { correct, incorrect, timedOut, reactionTimes } = statsRef.current;
      const accuracy = Math.round((correct / ROUND_COUNT) * 100);
      const avgReaction = reactionTimes.length > 0
        ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
        : 0;
      await submitCognitiveResult(token, 'executive_function', accuracy, {
        correct, incorrect, timed_out: timedOut, avg_reaction_ms: avgReaction, total_rounds: ROUND_COUNT,
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
          <Ionicons name="flash-outline" size={26} color={c.icon} />
        </View>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      </View>
    </View>
  );

  if (phase === 'intro') {
    return (
      <View style={styles.container}>
        {header('Executive Function Test')}
        <View style={styles.body}>
          <View style={styles.card}>
            <Text style={styles.instructions}>
              A color word will appear, printed in a possibly different ink color.
              Tap the button matching the INK COLOR, not the word itself.
              {'\n\n'}For example, if the word "RED" appears in blue ink, tap "BLUE".
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
        {header('Executive Function Test')}
        <View style={styles.centerBody}>
          <Text style={styles.progressText}>{round} / {ROUND_COUNT}</Text>
          <Text style={[styles.wordText, { color: inkColor.hex }]}>{wordColor.name}</Text>

          <View style={styles.answerGrid}>
            {COLOR_WORDS.map((cw) => (
              <TouchableOpacity
                key={cw.name}
                style={[styles.answerButton, { backgroundColor: cw.hex }]}
                onPress={() => handleAnswer(cw.name)}
              >
                <Text style={styles.answerText}>{cw.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  }

  const { correct, incorrect, timedOut } = statsRef.current;
  const accuracy = Math.round((correct / ROUND_COUNT) * 100);

  return (
    <View style={styles.container}>
      {header('Test Completed')}
      <View style={styles.centerBody}>
        <View style={[styles.resultIconWrap, { backgroundColor: c.bg }]}>
          <Ionicons name="checkmark-circle" size={40} color={c.icon} />
        </View>
        <Text style={styles.resultText}>Accuracy: {accuracy}%</Text>
        <Text style={styles.resultSubtext}>Correct: {correct} · Incorrect: {incorrect} · Missed: {timedOut}</Text>
        {submitting ? (
          <Text style={styles.savingText}>Saving result...</Text>
        ) : (
          <TouchableOpacity
            style={[styles.primaryButton, styles.elevatedButton, { backgroundColor: c.icon, width: '100%' }]}
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
  primaryButton: { paddingVertical: 16, paddingHorizontal: 24, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  elevatedButton: { flexDirection: 'row', elevation: 4, ...shadow },
  backLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  backLinkText: { color: colors.primaryDark, fontSize: 14, fontWeight: '600' },
  progressText: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.sm },
  wordText: { fontSize: 48, fontWeight: '800', marginBottom: spacing.xl },
  answerGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', width: 280 },
  answerButton: { width: 120, paddingVertical: 16, borderRadius: radius.md, margin: 6, alignItems: 'center', ...shadow },
  answerText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  resultIconWrap: { width: 72, height: 72, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  resultText: { fontSize: 22, fontWeight: '700', marginBottom: 8, textAlign: 'center', color: colors.text },
  resultSubtext: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.lg, textAlign: 'center' },
  savingText: { fontSize: 14, color: colors.textMuted },
});