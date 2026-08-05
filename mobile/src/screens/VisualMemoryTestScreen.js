import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { submitCognitiveResult } from '../api';
import { colors, spacing, radius, shadow, categoryColors } from '../theme';

const GRID_SIZE = 4;
const START_TARGETS = 3;
const MAX_TARGETS = 10;
const SHOW_DURATION_MS = 2000;
const c = categoryColors.visual_memory;

export default function VisualMemoryTestScreen({ token, onNavigate }) {
  const [phase, setPhase] = useState('intro');
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

  const header = (title) => (
    <View style={[styles.header, { backgroundColor: c.icon }]}>
      <View style={styles.headerRow}>
        <View style={[styles.headerIconWrap, { backgroundColor: c.bg }]}>
          <Ionicons name="grid-outline" size={26} color={c.icon} />
        </View>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      </View>
    </View>
  );

  if (phase === 'intro') {
    return (
      <View style={styles.container}>
        {header('Visual Memory Test')}
        <View style={styles.body}>
          <View style={styles.card}>
            <Text style={styles.instructions}>
              A pattern of highlighted squares will flash on the grid. Memorize
              their positions, then tap the same squares once the pattern
              disappears. Each round adds one more square — the test ends when
              you make a mistake.
            </Text>
          </View>
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: c.icon }]} onPress={() => startRound(START_TARGETS)}>
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

  if (phase === 'showing' || phase === 'input') {
    return (
      <View style={styles.container}>
        {header('Visual Memory Test')}
        <View style={styles.centerBody}>
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
                    isTarget && { backgroundColor: c.icon },
                    isSelected && { backgroundColor: c.icon, opacity: 0.6 },
                  ]}
                  onPress={() => handleCellPress(i)}
                  disabled={phase !== 'input'}
                />
              );
            })}
          </View>
          {phase === 'input' && (
            <TouchableOpacity
              style={[
                styles.primaryButton,
                styles.elevatedButton,
                { backgroundColor: selectedCells.length === targetCells.length ? c.icon : colors.border, marginTop: spacing.md },
              ]}
              activeOpacity={0.85}
              onPress={handleSubmitSelection}
              disabled={selectedCells.length !== targetCells.length}
            >
              <Ionicons name="checkmark" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.primaryButtonText}>Submit</Text>
            </TouchableOpacity>
          )}
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
        <Text style={styles.resultText}>Longest pattern recalled: {bestScore} squares</Text>
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

const CELL_SIZE = 60;
const CELL_GAP = 8;

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
  levelText: { fontSize: 16, color: colors.textMuted, marginBottom: spacing.md, textAlign: 'center' },
  grid: { width: GRID_SIZE * (CELL_SIZE + CELL_GAP), flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    margin: CELL_GAP / 2,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultIconWrap: { width: 72, height: 72, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  resultText: { fontSize: 18, marginBottom: spacing.lg, textAlign: 'center', color: colors.text, fontWeight: '600' },
  savingText: { fontSize: 14, color: colors.textMuted },
});