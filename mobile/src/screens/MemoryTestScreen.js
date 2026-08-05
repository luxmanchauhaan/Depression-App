import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { submitCognitiveResult } from '../api';
import { colors, spacing, radius, shadow, categoryColors } from '../theme';

const START_LENGTH = 3;
const MAX_LENGTH = 9;
const DIGIT_DISPLAY_MS = 800;
const DIGIT_GAP_MS = 300;
const c = categoryColors.memory;

export default function MemoryTestScreen({ token, onNavigate }) {
  const [phase, setPhase] = useState('intro');
  const [sequence, setSequence] = useState([]);
  const [displayIndex, setDisplayIndex] = useState(-1);
  const [userInput, setUserInput] = useState([]);
  const [level, setLevel] = useState(START_LENGTH);
  const [bestScore, setBestScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const timers = useRef([]);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function startRound(length) {
    const seq = Array.from({ length }, () => Math.floor(Math.random() * 10));
    setSequence(seq);
    setUserInput([]);
    setPhase('showing');
    playSequence(seq);
  }

  function playSequence(seq) {
    clearTimers();
    seq.forEach((_, i) => {
      const showAt = i * (DIGIT_DISPLAY_MS + DIGIT_GAP_MS);
      const hideAt = showAt + DIGIT_DISPLAY_MS;
      timers.current.push(setTimeout(() => setDisplayIndex(i), showAt));
      timers.current.push(setTimeout(() => setDisplayIndex(-1), hideAt));
    });
    const doneAt = seq.length * (DIGIT_DISPLAY_MS + DIGIT_GAP_MS);
    timers.current.push(setTimeout(() => setPhase('input'), doneAt));
  }

  function handleDigitPress(digit) {
    const next = [...userInput, digit];
    setUserInput(next);

    if (next.length === sequence.length) {
      const correct = next.every((d, i) => d === sequence[i]);
      if (correct) {
        const newBest = sequence.length;
        setBestScore(newBest);
        if (sequence.length >= MAX_LENGTH) {
          finishTest(newBest);
        } else {
          const nextLevel = sequence.length + 1;
          setLevel(nextLevel);
          setTimeout(() => startRound(nextLevel), 1000);
        }
      } else {
        finishTest(bestScore);
      }
    }
  }

  async function finishTest(finalScore) {
    setPhase('result');
    setSubmitting(true);
    try {
      await submitCognitiveResult(token, 'memory', finalScore, { max_length_reached: finalScore });
    } catch (err) {
      Alert.alert('Failed to save result', err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleBackspace() {
    setUserInput((prev) => prev.slice(0, -1));
  }

  const header = (title) => (
    <View style={[styles.header, { backgroundColor: c.icon }]}>
      <View style={styles.headerRow}>
        <View style={[styles.headerIconWrap, { backgroundColor: c.bg }]}>
          <Ionicons name="extension-puzzle-outline" size={26} color={c.icon} />
        </View>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      </View>
    </View>
  );

  if (phase === 'intro') {
    return (
      <View style={styles.container}>
        {header('Memory Test')}
        <View style={styles.body}>
          <View style={styles.card}>
            <Text style={styles.instructions}>
              A sequence of numbers will flash on screen, one at a time. Once it's
              done, tap the numbers back in the same order. The sequence gets
              longer each round — the test ends when you make a mistake.
            </Text>
          </View>
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: c.icon }]} onPress={() => startRound(START_LENGTH)}>
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

  if (phase === 'showing') {
    return (
      <View style={styles.container}>
        {header('Memory Test')}
        <View style={styles.centerBody}>
          <Text style={styles.levelText}>Level {level - START_LENGTH + 1}</Text>
          <View style={[styles.digitBox, { backgroundColor: c.icon }]}>
            <Text style={styles.digitText}>{displayIndex >= 0 ? sequence[displayIndex] : ''}</Text>
          </View>
        </View>
      </View>
    );
  }

  if (phase === 'input') {
    return (
      <View style={styles.container}>
        {header('Memory Test')}
        <View style={styles.centerBody}>
          <Text style={styles.levelText}>Repeat the sequence</Text>
          <Text style={styles.inputDisplay}>{userInput.length > 0 ? userInput.join(' ') : '—'}</Text>

          <View style={styles.keypad}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
              <TouchableOpacity key={d} style={[styles.key, { borderColor: c.icon }]} onPress={() => handleDigitPress(d)}>
                <Text style={[styles.keyText, { color: c.icon }]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.backspaceButton} onPress={handleBackspace}>
            <Text style={styles.backspaceButtonText}>Backspace</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {header('Test Completed')}
      <View style={styles.centerBody}>
        <View style={[styles.resultIconWrap, { backgroundColor: c.bg }]}>
          <Ionicons name="checkmark-circle" size={40} color={c.icon} />
        </View>
        <Text style={styles.resultText}>Longest sequence recalled: {bestScore}</Text>
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
  levelText: { fontSize: 16, color: colors.textMuted, marginBottom: spacing.md },
  digitBox: { width: 140, height: 140, borderRadius: radius.lg, justifyContent: 'center', alignItems: 'center', ...shadow },
  digitText: { fontSize: 56, color: '#fff', fontWeight: '700' },
  inputDisplay: { fontSize: 28, letterSpacing: 4, marginBottom: spacing.md, minHeight: 36, color: colors.text },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', width: 260 },
  key: { width: 70, height: 70, borderRadius: 35, borderWidth: 2, justifyContent: 'center', alignItems: 'center', margin: 6, backgroundColor: colors.surface },
  keyText: { fontSize: 24, fontWeight: '700' },
  backspaceButton: { marginTop: spacing.md, backgroundColor: colors.dangerLight, paddingVertical: 10, paddingHorizontal: 20, borderRadius: radius.md },
  backspaceButtonText: { color: colors.danger, fontWeight: '600' },
  resultIconWrap: { width: 72, height: 72, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  resultText: { fontSize: 18, marginBottom: spacing.lg, textAlign: 'center', color: colors.text, fontWeight: '600' },
  savingText: { fontSize: 14, color: colors.textMuted },
});