import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { submitCognitiveResult } from '../api';

const COLORS = [
  { name: 'RED', hex: '#D93025' },
  { name: 'BLUE', hex: '#1A73E8' },
  { name: 'GREEN', hex: '#188038' },
  { name: 'YELLOW', hex: '#E8A200' },
];

const ROUND_COUNT = 15;
const ROUND_TIMEOUT_MS = 3000;

export default function ExecutiveFunctionTestScreen({ token, onNavigate }) {
  const [phase, setPhase] = useState('intro'); // intro | running | result
  const [round, setRound] = useState(0);
  const [wordColor, setWordColor] = useState(COLORS[0]);
  const [inkColor, setInkColor] = useState(COLORS[0]);
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

    const word = COLORS[Math.floor(Math.random() * COLORS.length)];
    let ink = COLORS[Math.floor(Math.random() * COLORS.length)];
    // bias toward mismatched word/ink most of the time, which is the actual test
    if (Math.random() < 0.75) {
      const others = COLORS.filter((c) => c.name !== word.name);
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
        correct,
        incorrect,
        timed_out: timedOut,
        avg_reaction_ms: avgReaction,
        total_rounds: ROUND_COUNT,
      });
    } catch (err) {
      Alert.alert('Failed to save result', err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (phase === 'intro') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Executive Function Test</Text>
        <Text style={styles.instructions}>
          A color word will appear, printed in a possibly different ink color.
          Tap the button matching the INK COLOR, not the word itself.
          {'\n\n'}For example, if the word "RED" appears in blue ink, tap "BLUE".
        </Text>
        <TouchableOpacity style={styles.button} onPress={startTest}>
          <Text style={styles.buttonText}>Start</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onNavigate('activities')} style={{ marginTop: 16 }}>
          <Text style={styles.linkText}>Back to activities</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === 'running') {
    return (
      <View style={styles.container}>
        <Text style={styles.progressText}>{round} / {ROUND_COUNT}</Text>
        <Text style={[styles.wordText, { color: inkColor.hex }]}>{wordColor.name}</Text>

        <View style={styles.answerGrid}>
          {COLORS.map((c) => (
            <TouchableOpacity
              key={c.name}
              style={[styles.answerButton, { backgroundColor: c.hex }]}
              onPress={() => handleAnswer(c.name)}
            >
              <Text style={styles.answerText}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  // result
  const { correct, incorrect, timedOut } = statsRef.current;
  const accuracy = Math.round((correct / ROUND_COUNT) * 100);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Complete</Text>
      <Text style={styles.resultText}>Accuracy: {accuracy}%</Text>
      <Text style={styles.resultSubtext}>Correct: {correct} · Incorrect: {incorrect} · Missed: {timedOut}</Text>
      {submitting ? (
        <Text style={styles.instructions}>Saving result...</Text>
      ) : (
        <TouchableOpacity style={styles.button} onPress={() => onNavigate('activities')}>
          <Text style={styles.buttonText}>Back to activities</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 16, textAlign: 'center' },
  instructions: { fontSize: 14, color: '#555', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  button: { backgroundColor: '#3B6D11', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  linkText: { color: '#3B6D11', fontSize: 14 },
  progressText: { fontSize: 14, color: '#888', marginBottom: 20 },
  wordText: { fontSize: 48, fontWeight: '800', marginBottom: 40 },
  answerGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', width: 280 },
  answerButton: {
    width: 120,
    paddingVertical: 16,
    borderRadius: 8,
    margin: 6,
    alignItems: 'center',
  },
  answerText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  resultText: { fontSize: 24, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  resultSubtext: { fontSize: 14, color: '#666', marginBottom: 24, textAlign: 'center' },
});