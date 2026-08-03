import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { submitCognitiveResult } from '../api';

const TARGET_LETTER = 'X';
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'X'];
const ROUND_COUNT = 20;
const LETTER_DISPLAY_MS = 900;
const TARGET_PROBABILITY = 0.3;

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
        hits: h,
        misses: m,
        false_alarms: f,
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
        <Text style={styles.title}>Attention Test</Text>
        <Text style={styles.instructions}>
          Letters will appear one at a time. Tap the button only when you see
          the letter "{TARGET_LETTER}" — don't tap for any other letter.
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
        <TouchableOpacity style={styles.letterBox} onPress={handleTap} activeOpacity={0.7}>
          <Text style={styles.letterText}>{currentLetter}</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>Tap the box when you see "{TARGET_LETTER}"</Text>
      </View>
    );
  }

  const totalTargets = hits + misses;
  const accuracy = totalTargets > 0 ? Math.round((hits / totalTargets) * 100) : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Complete</Text>
      <Text style={styles.resultText}>Accuracy: {accuracy}%</Text>
      <Text style={styles.resultSubtext}>Hits: {hits} · Missed: {misses} · False taps: {falseAlarms}</Text>
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
  progressText: { fontSize: 14, color: '#888', marginBottom: 24 },
  letterBox: { width: 160, height: 160, borderRadius: 16, backgroundColor: '#3B6D11', justifyContent: 'center', alignItems: 'center' },
  letterText: { fontSize: 72, color: '#fff', fontWeight: '700' },
  hint: { fontSize: 13, color: '#888', marginTop: 24, textAlign: 'center' },
  resultText: { fontSize: 24, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  resultSubtext: { fontSize: 14, color: '#666', marginBottom: 24, textAlign: 'center' },
});