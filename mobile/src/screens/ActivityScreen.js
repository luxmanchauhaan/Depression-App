import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

export default function ActivityScreen({ token, onNavigate }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Activities</Text>

      <Text style={styles.sectionHeading}>Cognitive Tests</Text>

      <TouchableOpacity style={styles.testCard} onPress={() => onNavigate('memoryTest')}>
        <Text style={styles.testTitle}>Memory Test</Text>
        <Text style={styles.description}>Test your short-term recall with a digit sequence challenge.</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.testCard} onPress={() => onNavigate('attentionTest')}>
        <Text style={styles.testTitle}>Attention Test</Text>
        <Text style={styles.description}>Tap only when the target letter appears — measures focus and reaction accuracy.</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.testCard} onPress={() => onNavigate('visualMemoryTest')}>
        <Text style={styles.testTitle}>Visual Memory Test</Text>
        <Text style={styles.description}>Memorize a pattern of highlighted squares and tap them back from memory.</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.testCard} onPress={() => onNavigate('processingSpeedTest')}>
        <Text style={styles.testTitle}>Processing Speed Test</Text>
        <Text style={styles.description}>Tap as fast as you can when the box turns green — measures reaction time.</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.testCard} onPress={() => onNavigate('executiveFunctionTest')}>
        <Text style={styles.testTitle}>Executive Function Test</Text>
        <Text style={styles.description}>Tap the ink color, not the word — measures cognitive control.</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => onNavigate('dashboard')} style={{ marginTop: 12, marginBottom: 40 }}>
        <Text style={styles.linkText}>Back to dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '600', textAlign: 'center', marginBottom: 20 },
  sectionHeading: { fontSize: 16, fontWeight: '600', marginTop: 8, marginBottom: 10 },
  testCard: {
    borderWidth: 1,
    borderColor: '#3B6D11',
    backgroundColor: '#EFF5EA',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  testTitle: { fontSize: 16, fontWeight: '600', color: '#3B6D11', marginBottom: 4 },
  description: { fontSize: 13, color: '#666' },
  linkText: { color: '#3B6D11', textAlign: 'center', fontSize: 14 },
});