import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { submitCognitiveResult } from '../api';

const GRID_SIZE = 4; // 4x4 = 16 cells
const START_TARGETS = 3;
const MAX_TARGETS = 10;
const SHOW_DURATION_MS = 2000;

export default function VisualMemoryTestScreen({ token, onNavigate }) {
  const [phase, setPhase] = useState('intro'); // intro | showing | input | result
  const [targetCells, setTargetCells] = useState([]);
  const [selectedCells, setSelectedCells] = useState([]);
  const [level, setLevel] = useState(START_TARGETS);
  const [bestScore, setBestScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  function startRound(count) {
    const allCells = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i);
    const shuffled = allCells.sort(() => Math.random() - 0.5);
    const targets = shuffled.slice(0, count);

    setTargetCells(targets);
    setSelectedCells([]);
    setPhase('showing');

    setTimeout(() => {
      setPhase('input');
    }, SHOW_DURATION_MS);
  }

  function handleCellPress(index) {
    if (phase !== 'input') return;
    if (selectedCells.includes(index)) {
      setSelectedCells((prev) => prev.filter((i) => i !== index));
    } else {
      setSelectedCells((prev) => [...prev, index]);
    }
  }

  function handleSubmitSelection() {
    const sortedTarget = [...targetCells].sort((a, b) => a - b);
    const sortedSelected = [...selectedCells].sort((a, b) => a - b);
    const correct =
      sortedTarget.length === sortedSelected.length &&
      sortedTarget.every((v, i) => v === sortedSelected[i]);

    if (correct) {
      const newBest = targetCells.length;
      setBestScore(newBest);
      if (targetCells.length >= MAX_TARGETS) {
        finishTest(newBest);
      } else {
        const nextLevel = targetCells.length + 1;
        setLevel(nextLevel);
        setTimeout(() => startRound(nextLevel), 800);
      }
    } else {
      finishTest(bestScore);
    }
  }

  async function finishTest(finalScore) {
    setPhase('result');
    setSubmitting(true);
    try {
      await submitCognitiveResult(token, 'visual_memory', finalScore, {
        max_cells_recalled: finalScore,
        grid_size: GRID_SIZE,
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
        <Text style={styles.title}>Visual Memory Test</Text>
        <Text style={styles.instructions}>
          A pattern of highlighted squares will flash on the grid. Memorize
          their positions, then tap the same squares once the pattern
          disappears. Each round adds one more square — the test ends when
          you make a mistake.
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => startRound(START_TARGETS)}>
          <Text style={styles.buttonText}>Start</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onNavigate('activities')} style={{ marginTop: 16 }}>
          <Text style={styles.linkText}>Back to activities</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === 'showing' || phase === 'input') {
    return (
      <View style={styles.container}>
        <Text style={styles.levelText}>
          {phase === 'showing' ? 'Memorize the pattern' : `Tap the squares (${selectedCells.length}/${targetCells.length})`}
        </Text>
        <View style={styles.grid}>
          {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
            const isTarget = phase === 'showing' && targetCells.includes(i);
            const isSelected = phase === 'input' && selectedCells.includes(i);
            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.cell,
                  isTarget && styles.cellTarget,
                  isSelected && styles.cellSelected,
                ]}
                onPress={() => handleCellPress(i)}
                disabled={phase !== 'input'}
              />
            );
          })}
        </View>
        {phase === 'input' && (
          <TouchableOpacity
            style={[styles.button, selectedCells.length !== targetCells.length && styles.buttonDisabled]}
            onPress={handleSubmitSelection}
            disabled={selectedCells.length !== targetCells.length}
          >
            <Text style={styles.buttonText}>Submit</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // result
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Complete</Text>
      <Text style={styles.resultText}>Longest pattern recalled: {bestScore} squares</Text>
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

const CELL_SIZE = 60;
const CELL_GAP = 8;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 16, textAlign: 'center' },
  instructions: { fontSize: 14, color: '#555', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  button: { backgroundColor: '#3B6D11', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 8, marginTop: 20 },
  buttonDisabled: { backgroundColor: '#aaa' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  linkText: { color: '#3B6D11', fontSize: 14 },
  levelText: { fontSize: 16, color: '#666', marginBottom: 20, textAlign: 'center' },
  grid: {
    width: GRID_SIZE * (CELL_SIZE + CELL_GAP),
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    margin: CELL_GAP / 2,
    borderRadius: 8,
    backgroundColor: '#e8e8e8',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cellTarget: { backgroundColor: '#3B6D11' },
  cellSelected: { backgroundColor: '#7DA860' },
  resultText: { fontSize: 18, marginBottom: 24, textAlign: 'center' },
});