import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { QUESTIONNAIRE_ITEMS } from '../data/bdiPlaceholderQuestions';
import { submitQuestionnaire } from '../api';

export default function QuestionnaireScreen({ token, onNavigate, onSubmitted }) {
  const [answers, setAnswers] = useState({}); // { itemId: value }
  const [loading, setLoading] = useState(false);

  function selectAnswer(itemId, value) {
    setAnswers((prev) => ({ ...prev, [itemId]: value }));
  }

  async function handleSubmit() {
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < QUESTIONNAIRE_ITEMS.length) {
      Alert.alert(
        'Incomplete',
        `Please answer all questions (${answeredCount}/${QUESTIONNAIRE_ITEMS.length} answered).`
      );
      return;
    }

    const orderedAnswers = QUESTIONNAIRE_ITEMS.map((item) => answers[item.id]);

    setLoading(true);
    try {
      const result = await submitQuestionnaire(token, orderedAnswers);
      Alert.alert('Submitted', `Your score: ${result.total_score} (${result.severity})`);
      onSubmitted();
    } catch (err) {
      Alert.alert('Submission failed', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Questionnaire</Text>
      <Text style={styles.instruction}>Answer the following questions.</Text>

      {QUESTIONNAIRE_ITEMS.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.prompt}>Item {item.id}</Text>
          {item.options.map((opt) => {
            const selected = answers[item.id] === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.option, selected && styles.optionSelected]}
                onPress={() => selectAnswer(item.id, opt.value)}
              >
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => onNavigate('dashboard')} style={{ marginBottom: 40 }}>
        <Text style={styles.linkText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '600', textAlign: 'center', marginBottom: 4 },
  instruction: { fontSize: 14, color: '#444', textAlign: 'center', marginBottom: 20, fontWeight: '500' },
  card: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },
  prompt: { fontSize: 14, marginBottom: 10, fontWeight: '500' },
  option: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  optionSelected: { backgroundColor: '#3B6D11', borderColor: '#3B6D11' },
  optionText: { fontSize: 14, color: '#333' },
  optionTextSelected: { color: '#fff', fontWeight: '500' },
  submitButton: {
    backgroundColor: '#3B6D11',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  submitText: { color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '500' },
  linkText: { color: '#3B6D11', textAlign: 'center', fontSize: 14 },
});