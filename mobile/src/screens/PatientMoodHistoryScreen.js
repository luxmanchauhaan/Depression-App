import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPatientMoodHistory } from '../api';
import { colors, spacing, radius, shadow, categoryColors } from '../theme';

const EMOTION_LABELS = {
  happy: 'Happy',
  sad: 'Sad',
  angry: 'Angry',
  fear: 'Fearful / Anxious',
  disgust: 'Disgusted',
  surprise: 'Surprised',
  neutral: 'Neutral / Calm',
};

function emotionLabel(key) {
  return EMOTION_LABELS[key] || key || 'Unknown';
}

export default function PatientMoodHistoryScreen({ token, patient, onBack }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const c = categoryColors.mood;

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const result = await getPatientMoodHistory(token, patient.patient_id);
      setEntries(result.history);
    } catch (err) {
      console.log('Failed to load mood history:', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: c.icon }]}>
        <View style={[styles.headerIconWrap, { backgroundColor: c.bg }]}>
          <Ionicons name="happy-outline" size={28} color={c.icon} />
        </View>
        <Text style={styles.headerTitle}>Mood Check-ins</Text>
        <Text style={styles.headerSubtitle}>{patient.full_name || patient.email}</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} color={c.icon} />
      ) : entries.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="document-text-outline" size={32} color={colors.textMuted} />
          <Text style={styles.emptyText}>No mood check-ins yet.</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.body}
          renderItem={({ item }) => {
            const detected = item.EmotionCapture;
            const hasNote = item.notes && item.notes.trim().length > 0;
            return (
              <View style={[styles.card, hasNote && styles.cardFlagged]}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardDate}>{new Date(item.logged_at).toLocaleDateString()}</Text>
                  {hasNote && (
                    <View style={styles.flagBadge}>
                      <Ionicons name="chatbubble-ellipses" size={12} color="#fff" style={{ marginRight: 4 }} />
                      <Text style={styles.flagBadgeText}>Shared note</Text>
                    </View>
                  )}
                </View>

                <View style={styles.compareRow}>
                  <View style={styles.compareHalf}>
                    <Text style={styles.compareLabel}>PATIENT SAID</Text>
                    <Text style={styles.compareValue}>{emotionLabel(item.self_reported_emotion)}</Text>
                  </View>
                  <Ionicons name="swap-horizontal" size={16} color={colors.textMuted} />
                  <View style={styles.compareHalf}>
                    <Text style={styles.compareLabel}>AI DETECTED</Text>
                    <Text style={styles.compareValue}>
                      {detected ? emotionLabel(detected.dominant_emotion) : 'N/A'}
                    </Text>
                    {detected && (
                      <Text style={styles.confidenceText}>{Math.round(detected.confidence * 100)}% confidence</Text>
                    )}
                  </View>
                </View>

                {hasNote && (
                  <View style={styles.noteBox}>
                    <Text style={styles.noteLabel}>What the patient shared:</Text>
                    <Text style={styles.noteText}>{item.notes}</Text>
                  </View>
                )}
              </View>
            );
          }}
          ListFooterComponent={
            <TouchableOpacity onPress={onBack} style={styles.backLink}>
              <Ionicons name="arrow-back" size={16} color={colors.primaryDark} style={{ marginRight: 6 }} />
              <Text style={styles.backLinkText}>Back to patient overview</Text>
            </TouchableOpacity>
          }
        />
      )}
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
  emptyCard: { alignItems: 'center', padding: spacing.lg, margin: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, ...shadow },
  emptyText: { fontSize: 14, color: colors.textMuted, marginTop: 8 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    ...shadow,
  },
  cardFlagged: {
    borderWidth: 1.5,
    borderColor: categoryColors.mood.icon,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  cardDate: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  flagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: categoryColors.mood.icon,
    borderRadius: radius.pill,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  flagBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  compareRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  compareHalf: { flex: 1 },
  compareLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '700', letterSpacing: 0.3 },
  compareValue: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 2 },
  confidenceText: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  noteBox: {
    marginTop: spacing.sm,
    backgroundColor: categoryColors.mood.bg,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  noteLabel: { fontSize: 11, color: categoryColors.mood.icon, fontWeight: '700', marginBottom: 2 },
  noteText: { fontSize: 13, color: colors.text, lineHeight: 18 },
  backLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, marginBottom: spacing.lg },
  backLinkText: { color: colors.primaryDark, fontSize: 14, fontWeight: '600' },
});