import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDoctorPatients } from '../api';
import { colors, spacing, radius, shadow } from '../theme';

export default function PatientListScreen({ token, onNavigate, onSelectPatient }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const result = await getDoctorPatients(token);
      setPatients(result.patients);
    } catch (err) {
      console.log('Failed to load patients:', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Patients</Text>
        <Text style={styles.headerSubtitle}>Tap a patient to view their history</Text>
      </View>

      <View style={styles.body}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />
        ) : patients.length === 0 ? (
          <Text style={styles.emptyText}>No patients assigned yet.</Text>
        ) : (
          <FlatList
            data={patients}
            keyExtractor={(item) => String(item.patient_id)}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.card} onPress={() => onSelectPatient(item)}>
                <View style={styles.cardIcon}>
                  <Ionicons name="person" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{item.full_name || item.email}</Text>
                  {item.latest_score !== null ? (
                    <>
                      <Text style={styles.cardDesc}>
                        Latest BDI-II: {item.latest_score} · {item.latest_severity}
                      </Text>
                      <Text style={styles.cardDate}>
                        {new Date(item.last_taken_at).toLocaleDateString()}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.cardDesc}>No submissions yet</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          />
        )}

        <TouchableOpacity onPress={() => onNavigate('dashboard')} style={styles.backLink}>
          <Ionicons name="arrow-back" size={16} color={colors.primaryDark} style={{ marginRight: 6 }} />
          <Text style={styles.backLinkText}>Back to dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 70,
    paddingBottom: 24,
    paddingHorizontal: spacing.md,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: '#E3F2E9', marginTop: 4 },
  body: { flex: 1, padding: spacing.md },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    ...shadow,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  cardName: { fontSize: 16, fontWeight: '600', color: colors.text },
  cardDesc: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  cardDate: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  backLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  backLinkText: { color: colors.primaryDark, fontSize: 14, fontWeight: '600' },
});