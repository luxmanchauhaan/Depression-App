import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const CATEGORIES = [
  { key: 'bdi', label: 'BDI-II Score' },
  { key: 'memory', label: 'Memory Test' },
  { key: 'attention', label: 'Attention Test' },
  { key: 'visual_memory', label: 'Visual Memory' },
  { key: 'processing_speed', label: 'Processing Speed' },
  { key: 'executive_function', label: 'Executive Function' },
];

export default function MyHistoryScreen({ onNavigate, onSelectCategory }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your History</Text>

      {CATEGORIES.map((cat) => (
        <TouchableOpacity
          key={cat.key}
          style={styles.card}
          onPress={() => onSelectCategory(cat.key)}
        >
          <Text style={styles.cardText}>{cat.label}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity onPress={() => onNavigate('dashboard')} style={{ marginTop: 12, marginBottom: 20 }}>
        <Text style={styles.linkText}>Back to dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '600', textAlign: 'center', marginBottom: 24 },
  card: {
    borderWidth: 1,
    borderColor: '#3B6D11',
    backgroundColor: '#EFF5EA',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  cardText: { fontSize: 16, fontWeight: '500', color: '#3B6D11', textAlign: 'center' },
  linkText: { color: '#3B6D11', textAlign: 'center', fontSize: 14 },
});