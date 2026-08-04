import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { getPatientBdiHistory, getPatientCognitiveHistory } from '../api';

const LABELS = {
  bdi: 'BDI-II Score',
  memory: 'Memory Test',
  attention: 'Attention Test',
  visual_memory: 'Visual Memory',
  processing_speed: 'Processing Speed',
  executive_function: 'Executive Function',
};

export default function TestHistoryDetailScreen({ token, patient, category, onNavigate }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      if (category === 'bdi') {
        const result = await getPatientBdiHistory(token, patient.patient_id);
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
    return category === 'bdi' ? item.total_score : item.score;
  }

  const chronological = [...entries].reverse(); // oldest first for the chart

  function daysSpan() {
    if (chronological.length === 0) return 0;
    const first = new Date(chronological[0].taken_at);
    const last = new Date(chronological[chronological.length - 1].taken_at);
    const diffDays = Math.round((last - first) / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  }

  const span = daysSpan();

  const chartData = {
    labels: chronological.map((item) =>
      new Date(item.taken_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    ),
    datasets: [{ data: chronological.map((item) => getScore(item)) }],
  };

  const screenWidth = Dimensions.get('window').width - 48;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{LABELS[category]}</Text>
      <Text style={styles.subtitle}>{patient.full_name || patient.email}</Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : entries.length === 0 ? (
        <Text style={styles.emptyText}>No records yet.</Text>
      ) : (
        <>
          {entries.length >= 2 && (
            <>
              <Text style={styles.chartCaption}>
                History of {LABELS[category]} — last {span} day{span !== 1 ? 's' : ''}
                {category === 'processing_speed' ? ' (lower is faster)' : ''}
              </Text>
              <View>
                <LineChart
                  data={chartData}
                  width={screenWidth}
                  height={220}
                  yAxisSuffix=""
                  chartConfig={{
                    backgroundColor: '#fff',
                    backgroundGradientFrom: '#fff',
                    backgroundGradientTo: '#fff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(59, 109, 17, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(80, 80, 80, ${opacity})`,
                    propsForDots: { r: '4', strokeWidth: '2', stroke: '#3B6D11' },
                  }}
                  bezier
                  style={styles.chart}
                  onDataPointClick={({ index, x, y }) => {
                    const item = chronological[index];
                    setTooltip({
                      x,
                      y,
                      date: new Date(item.taken_at).toLocaleDateString(),
                      score: getScore(item),
                    });
                  }}
                />
                {tooltip && (
                  <View style={[styles.tooltip, { left: Math.max(0, tooltip.x - 60), top: tooltip.y - 10 }]}>
                    <Text style={styles.tooltipText}>{tooltip.date}</Text>
                    <Text style={styles.tooltipText}>Score: {tooltip.score}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.tapHint}>Tap a point on the graph to see its date and score.</Text>
            </>
          )}

          <FlatList
            data={entries}
            keyExtractor={(item) => String(item.id)}
            style={styles.list}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.row}>
                {category === 'bdi' ? (
                  <Text style={styles.rowScore}>Score: {item.total_score} · {item.severity}</Text>
                ) : (
                  <Text style={styles.rowScore}>Score: {item.score}</Text>
                )}
                <Text style={styles.rowDate}>{new Date(item.taken_at).toLocaleDateString()}</Text>
              </View>
            )}
          />
        </>
      )}

      <TouchableOpacity onPress={() => onNavigate('patientDetail')} style={{ marginTop: 12, marginBottom: 40 }}>
        <Text style={styles.linkText}>Back to patient overview</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 60, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '600', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 12 },
  chartCaption: { fontSize: 13, color: '#3B6D11', fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  chart: { borderRadius: 12 },
  tapHint: { fontSize: 11, color: '#999', textAlign: 'center', marginTop: 6, marginBottom: 20 },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#333',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  tooltipText: { color: '#fff', fontSize: 11 },
  list: { marginBottom: 12 },
  row: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  rowScore: { fontSize: 15, fontWeight: '500', marginBottom: 2 },
  rowDate: { fontSize: 12, color: '#888' },
  linkText: { color: '#3B6D11', textAlign: 'center', fontSize: 14 },
});