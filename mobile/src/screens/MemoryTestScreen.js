import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { submitCognitiveResult } from '../api';

const START_LENGTH = 3;
const MAX_LENGTH = 9;
const DIGIT_DISPLAY_MS = 800;
const DIGIT_GAP_MS = 300;

export default function MemoryTestScreen({ token, onNavigate }) {
  const [phase, setPhase] = useState('intro'); // intro | showing | input | result
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

  if (phase === 'intro') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Memory Test</Text>
        <Text style={styles.instructions}>
          A sequence of numbers will flash on screen, one at a time. Once it's
          done, tap the numbers back in the same order. The sequence gets
          longer each round — the test ends when you make a mistake.
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => startRound(START_LENGTH)}>
          <Text style={styles.buttonText}>Start</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onNavigate('dashboard')} style={{ marginTop: 16 }}>
          <Text style={styles.linkText}>Back to dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === 'showing') {
    return (
      <View style={styles.container}>
        <Text style={styles.levelText}>Level {level - START_LENGTH + 1}</Text>
        <View style={styles.digitBox}>
          <Text style={styles.digitText}>
            {displayIndex >= 0 ? sequence[displayIndex] : ''}
          </Text>
        </View>
      </View>
    );
  }

  if (phase === 'input') {
    return (
      <View style={styles.container}>
        <Text style={styles.levelText}>Repeat the sequence</Text>
        <Text style={styles.inputDisplay}>
          {userInput.length > 0 ? userInput.join(' ') : '—'}
        </Text>

        <View style={styles.keypad}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
            <TouchableOpacity key={d} style={styles.key} onPress={() => handleDigitPress(d)}>
              <Text style={styles.keyText}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.backspaceButton} onPress={handleBackspace}>
          <Text style={styles.buttonText}>Backspace</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // result
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Complete</Text>
      <Text style={styles.resultText}>Longest sequence recalled: {bestScore}</Text>
      {submitting ? (
        <Text style={styles.instructions}>Saving result...</Text>
      ) : (
        <TouchableOpacity style={styles.button} onPress={() => onNavigate('dashboard')}>
          <Text style={styles.buttonText}>Back to dashboard</Text>
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
  levelText: { fontSize: 16, color: '#666', marginBottom: 24 },
  digitBox: { width: 140, height: 140, borderRadius: 12, backgroundColor: '#3B6D11', justifyContent: 'center', alignItems: 'center' },
  digitText: { fontSize: 56, color: '#fff', fontWeight: '700' },
  inputDisplay: { fontSize: 28, letterSpacing: 4, marginBottom: 24, minHeight: 36 },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', width: 260 },
  key: { width: 70, height: 70, borderRadius: 35, borderWidth: 1, borderColor: '#3B6D11', justifyContent: 'center', alignItems: 'center', margin: 6 },
  keyText: { fontSize: 24, color: '#3B6D11', fontWeight: '600' },
  backspaceButton: { marginTop: 16, backgroundColor: '#993C1D', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  resultText: { fontSize: 18, marginBottom: 24, textAlign: 'center' },
});