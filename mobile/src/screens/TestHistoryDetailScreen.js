import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { getPatientBdiHistory, getPatientCognitiveHistory, getPatientSleepHistory, getPatientWeightHistory } from '../api';
import { colors, spacing, radius, shadow, categoryColors } from '../theme';

const LABELS = {
  bdi: 'BDI-II Score',
  memory: 'Memory Test',
  attention: 'Attention Test',
  visual_memory: 'Visual Memory',
  processing_speed: 'Processing Speed',
  executive_function: 'Executive Function',
  sleep: 'Sleep Log',
  weight: 'Weight Log',
};

const ICONS = {
  bdi: 'heart-outline',
  memory: 'extension-puzzle-outline',
  attention: 'eye-outline',
  visual_memory: 'grid-outline',
  processing_speed: 'speedometer-outline',
  executive_function: 'flash-outline',
  sleep: 'moon-outline',
  weight: 'scale-outline',
};

export default function TestHistoryDetailScreen({ token, patient, category, onNavigate }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState(null);

  const c = categoryColors[category];

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      if (category === 'bdi') {
        const result = await getPatientBdiHistory(token, patient.patient_id);
        setEntries(result.history);
      } else if (category === 'sleep') {
        const result = await getPatientSleepHistory(token, patient.patient_id);
        setEntries(result.history);
      } else if (category === 'weight') {
        const result = await getPatientWeightHistory(token, patient.patient_id);
        setEntries(result.history);
      } else {
        const result = await getPatientCognitiveHistory(token, patient.patient_id);
        setEntries(result.results.filter((r) => r.test_type === category));
      }
    } catch (err) {
      console.log('Failed to load history:', err.message);
    } finally {
      setLoading(false);
    }
  }

  function getScore(item) {
    if (category === 'bdi') return item.total_score;
    if (category === 'sleep') return parseFloat(item.hours_slept);
    if (category === 'weight') return parseFloat(item.weight_kg);
    return item.score;
  }

  function getDate(item) {
    return category === 'sleep' || category === 'weight' ? item.logged_date : item.taken_at;
  }

  const chronological = [...entries].reverse();

  function daysSpan() {
    if (chronological.length === 0) return 0;
    const first = new Date(getDate(chronological[0]));
    const last = new Date(getDate(chronological[chronological.length - 1]));
    return Math.round((last - first) / (1000 * 60 * 60 * 24)) + 1;
  }

  const span = daysSpan();

  const chartData = {
    labels: chronological.map((item) =>
      new Date(getDate(item)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    ),
    datasets: [{ data: chronological.map((item) => getScore(item)) }],
  };

  const screenWidth = Dimensions.get('window').width - 48;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: c.icon }]}>
        <View style={[styles.headerIconWrap, { backgroundColor: c.bg }]}>
          <Ionicons name={ICONS[category]} size={28} color={c.icon} />
        </View>
        <Text style={styles.headerTitle}>{LABELS[category]}</Text>
        <Text style={styles.headerSubtitle}>{patient.full_name || patient.email}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 20 }} color={c.icon} />
        ) : entries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptyText}>No records yet.</Text>
          </View>
        ) : (
          <>
            {entries.length === 1 && (
              <View style={styles.hintCard}>
                <Ionicons name="information-circle-outline" size={18} color={c.icon} style={{ marginRight: 6 }} />
                <Text style={[styles.hintText, { color: c.icon }]}>
                  Needs one more submission to show a trend graph.
                </Text>
              </View>
            )}

            {entries.length >= 2 && (
              <View style={styles.chartCard}>
                <Text style={styles.chartCaption}>
                  Last {span} day{span !== 1 ? 's' : ''}
                  {category === 'processing_speed' ? ' · lower is faster' : ''}
                </Text>
                <View>
                  <LineChart
                    data={chartData}
                    width={screenWidth}
                    height={200}
                    withInnerLines={false}
                    chartConfig={{
                      backgroundColor: colors.surface,
                      backgroundGradientFrom: colors.surface,
                      backgroundGradientTo: colors.surface,
                      decimalPlaces: category === 'sleep' || category === 'weight' ? 1 : 0,
                      color: (opacity = 1) => c.icon,
                      labelColor: (opacity = 1) => colors.textMuted,
                      propsForDots: { r: '5', strokeWidth: '2', stroke: c.icon, fill: colors.surface },
                    }}
                    bezier
                    style={{ borderRadius: radius.md, marginLeft: -spacing.sm }}
                    onDataPointClick={({ index, x, y }) => {
                      const item = chronological[index];
                      setTooltip({ x, y, date: new Date(getDate(item)).toLocaleDateString(), score: getScore(item) });
                    }}
                  />
                  {tooltip && (
                    <View style={[styles.tooltip, { left: Math.max(0, tooltip.x - 60), top: tooltip.y - 10, backgroundColor: c.icon }]}>
                      <Text style={styles.tooltipText}>{tooltip.date}</Text>
                      <Text style={styles.tooltipText}>Score: {tooltip.score}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.tapHint}>Tap a point to see date and score</Text>
              </View>
            )}

            <FlatList
              data={entries}
              keyExtractor={(item) => String(item.id)}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.row}>
                  <View style={[styles.rowDot, { backgroundColor: c.icon }]} />
                  <View style={{ flex: 1 }}>
                    {category === 'bdi' ? (
                      <Text style={styles.rowScore}>Score: {item.total_score} · {item.severity}</Text>
                    ) : category === 'sleep' ? (
                      <Text style={styles.rowScore}>{item.hours_slept}h · {item.quality}</Text>
                    ) : category === 'weight' ? (
                      <Text style={styles.rowScore}>{item.weight_kg} kg</Text>
                    ) : (
                      <Text style={styles.rowScore}>Score: {item.score}</Text>
                    )}
                    <Text style={styles.rowDate}>{new Date(getDate(item)).toLocaleDateString()}</Text>
                  </View>
                </View>
              )}
            />
          </>
        )}

        <TouchableOpacity onPress={() => onNavigate('patientDetail')} style={styles.backLink}>
          <Ionicons name="arrow-back" size={16} color={colors.primaryDark} style={{ marginRight: 6 }} />
          <Text style={styles.backLinkText}>Back to patient overview</Text>
        </TouchableOpacity>
      </ScrollView>
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
  headerIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: '#fff', opacity: 0.85, marginTop: 2 },
  body: { padding: spacing.md },
  emptyCard: { alignItems: 'center', padding: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.md, ...shadow },
  emptyText: { fontSize: 14, color: colors.textMuted, marginTop: 8 },
  hintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    ...shadow,
  },
  hintText: { fontSize: 13, fontWeight: '500', flex: 1 },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    ...shadow,
  },
  chartCaption: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 4, textAlign: 'center' },
  tapHint: { fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 4 },
  tooltip: { position: 'absolute', borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8 },
  tooltipText: { color: '#fff', fontSize: 11 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    ...shadow,
  },
  rowDot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.sm },
  rowScore: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowDate: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  backLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, marginBottom: spacing.lg },
  backLinkText: { color: colors.primaryDark, fontSize: 14, fontWeight: '600' },
});