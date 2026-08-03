import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { getPatientCognitiveHistory } from '../api';

const TEST_LABELS = {
  memory: 'Memory Test',
  attention: 'Attention Test',
  processing_speed: 'Processing Speed',
  executive_function: 'Executive Function',
  visual_memory: 'Visual Memory',
};

export default function PatientDetailScreen({ token, patient, onNavigate }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const result = await getPatientCognitiveHistory(token, patient.patient_id);
      setResults(result.results);
    } catch (err) {
      console.log('Failed to load cognitive history:', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{patient.full_name || patient.email}</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Latest BDI-II Score</Text>
        {patient.latest_score !== null ? (
          <Text style={styles.summaryValue}>{patient.latest_score} · {patient.latest_severity}</Text>
        ) : (
          <Text style={styles.summaryValue}>No submissions yet</Text>
        )}
      </View>

      <Text style={styles.sectionHeading}>Cognitive Test History</Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : results.length === 0 ? (
        <Text style={styles.emptyText}>No cognitive tests taken yet.</Text>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          style={styles.list}
          renderItem={({ item }) => (
            <View style={styles.resultRow}>
              <Text style={styles.resultType}>{TEST_LABELS[item.test_type] || item.test_type}</Text>
              <Text style={styles.resultScore}>Score: {item.score}</Text>
              <Text style={styles.resultDate}>{new Date(item.taken_at).toLocaleDateString()}</Text>
            </View>
          )}
        />
      )}

      <TouchableOpacity onPress={() => onNavigate('dashboard')} style={{ marginTop: 12, marginBottom: 20 }}>
        <Text style={styles.linkText}>Back to patient list</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '600', textAlign: 'center', marginBottom: 16 },
  summaryCard: {
    backgroundColor: '#EFF5EA',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  summaryLabel: { fontSize: 12, color: '#3B6D11', fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: '500' },
  sectionHeading: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 12 },
  list: { flex: 1, marginBottom: 12 },
  resultRow: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  resultType: { fontSize: 15, fontWeight: '500', marginBottom: 2 },
  resultScore: { fontSize: 14, color: '#3B6D11', marginBottom: 2 },
  resultDate: { fontSize: 12, color: '#888' },
  linkText: { color: '#3B6D11', textAlign: 'center', fontSize: 14 },
});