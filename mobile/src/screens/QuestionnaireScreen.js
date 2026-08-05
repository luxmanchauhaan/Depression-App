import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { QUESTIONNAIRE_ITEMS } from '../data/bdiPlaceholderQuestions';
import { submitQuestionnaire } from '../api';
import { colors, spacing, radius, shadow } from '../theme';

function getSeverityStyle(severity) {
  const key = (severity || '').toLowerCase();
  if (key.includes('severe')) {
    return { color: colors.danger, bg: colors.dangerLight, icon: 'alert-circle' };
  }
  if (key.includes('moderate')) {
    return { color: '#E0A458', bg: '#FBF1E1', icon: 'warning' };
  }
  if (key.includes('mild')) {
    return { color: colors.accent, bg: colors.accentLight, icon: 'information-circle' };
  }
  return { color: colors.primary, bg: colors.primaryLight, icon: 'checkmark-circle' };
}

export default function QuestionnaireScreen({ token, onNavigate, onSubmitted }) {
  const [answers, setAnswers] = useState({}); // { itemId: value }
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { total_score, severity } | null

  const answeredCount = Object.keys(answers).length;

  function selectAnswer(itemId, value) {
    setAnswers((prev) => ({ ...prev, [itemId]: value }));
  }

  async function handleSubmit() {
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
      setResult(result);
    } catch (err) {
      Alert.alert('Submission failed', err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleResultClose() {
    setResult(null);
    onSubmitted();
  }

  const severityStyle = result ? getSeverityStyle(result.severity) : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="clipboard-outline" size={26} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>Questionnaire</Text>
            <Text style={styles.headerSubtitle}>{answeredCount}/{QUESTIONNAIRE_ITEMS.length} answered</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {QUESTIONNAIRE_ITEMS.map((item, idx) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.prompt}>Question {idx + 1} of {QUESTIONNAIRE_ITEMS.length}</Text>
            {item.options.map((opt) => {
              const selected = answers[item.id] === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => selectAnswer(item.id, opt.value)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                    {selected && <View style={styles.radioInner} />}
                  </View>
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.submitText}>Submit</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => onNavigate('dashboard')} style={styles.cancelLink}>
          <Text style={styles.linkText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={!!result} transparent animationType="fade" onRequestClose={handleResultClose}>
        <View style={styles.overlay}>
          <View style={styles.resultCard}>
            {severityStyle && (
              <View style={[styles.resultIconWrap, { backgroundColor: severityStyle.bg }]}>
                <Ionicons name={severityStyle.icon} size={32} color={severityStyle.color} />
              </View>
            )}
            <Text style={styles.resultTitle}>Submitted</Text>

            {result && (
              <View style={[styles.scoreRow, { backgroundColor: severityStyle.bg }]}>
                <View>
                  <Text style={styles.scoreLabel}>Total score</Text>
                  <Text style={[styles.scoreValue, { color: severityStyle.color }]}>{result.total_score}</Text>
                </View>
                <View style={styles.scoreDivider} />
                <View>
                  <Text style={styles.scoreLabel}>Severity</Text>
                  <Text style={[styles.severityValue, { color: severityStyle.color }]}>
                    {result.severity}
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.resultButton} onPress={handleResultClose} activeOpacity={0.85}>
              <Text style={styles.resultButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 44,
    paddingBottom: 18,
    paddingHorizontal: spacing.md,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', height: 48 },
  headerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerTitle: { fontSize: 19, fontWeight: '700', color: '#fff', includeFontPadding: false, textAlignVertical: 'center' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2, includeFontPadding: false, textAlignVertical: 'center' },
  body: { padding: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow,
  },
  prompt: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.sm, fontWeight: '600' },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  optionSelected: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioOuterSelected: { borderColor: colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  optionText: { fontSize: 14, color: colors.text, flex: 1 },
  optionTextSelected: { color: colors.primaryDark, fontWeight: '600' },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    ...shadow,
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelLink: { alignItems: 'center', marginBottom: 40 },
  linkText: { color: colors.primaryDark, fontSize: 14, fontWeight: '600' },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(46,58,52,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  resultCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadow,
  },
  resultIconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  resultTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  scoreDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginHorizontal: spacing.lg,
  },
  scoreLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 2, textAlign: 'center' },
  scoreValue: { fontSize: 26, fontWeight: '700', textAlign: 'center' },
  severityValue: { fontSize: 18, fontWeight: '700', textAlign: 'center', textTransform: 'capitalize' },
  resultButton: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});