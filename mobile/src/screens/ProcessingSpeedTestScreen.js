import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { submitCognitiveResult } from '../api';

const ROUND_COUNT = 8;
const MIN_DELAY_MS = 1200;
const MAX_DELAY_MS = 3000;

export default function ProcessingSpeedTestScreen({ token, onNavigate }) {
  const [phase, setPhase] = useState('intro'); // intro | waiting | ready | tooSoon | result
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
      // tapped too early
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

  if (phase === 'intro') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Processing Speed Test</Text>
        <Text style={styles.instructions}>
          Wait for the box to turn green, then tap it as fast as you can.
          Tapping too early restarts that round. This repeats for {ROUND_COUNT} rounds.
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

  if (phase === 'waiting' || phase === 'ready' || phase === 'tooSoon') {
    return (
      <View style={styles.container}>
        <Text style={styles.progressText}>{round} / {ROUND_COUNT}</Text>
        <TouchableOpacity
          style={[
            styles.tapBox,
            phase === 'ready' && styles.tapBoxReady,
            phase === 'tooSoon' && styles.tapBoxTooSoon,
          ]}
          onPress={handleTap}
          activeOpacity={0.8}
        >
          <Text style={styles.tapBoxText}>
            {phase === 'waiting' && 'Wait...'}
            {phase === 'ready' && 'Tap now!'}
            {phase === 'tooSoon' && 'Too soon — retry'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // result
  const avg = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Complete</Text>
      <Text style={styles.resultText}>Average reaction time: {avg} ms</Text>
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
  tapBox: {
    width: 220,
    height: 220,
    borderRadius: 16,
    backgroundColor: '#993C1D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tapBoxReady: { backgroundColor: '#3B6D11' },
  tapBoxTooSoon: { backgroundColor: '#B33A3A' },
  tapBoxText: { color: '#fff', fontSize: 20, fontWeight: '600' },
  resultText: { fontSize: 20, marginBottom: 24, textAlign: 'center' },
});