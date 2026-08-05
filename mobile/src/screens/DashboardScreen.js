import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDoctorPatients } from '../api';
import { colors, spacing, radius, typography, shadow, buttonBase } from '../theme';

export default function DashboardScreen({ user, onLogout, onNavigate, onSelectPatient }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user.role === 'doctor') {
      loadPatients();
    } else {
      setLoading(false);
    }
  }, []);

  async function loadPatients() {
    setLoading(true);
    try {
      const result = await getDoctorPatients(user.token);
      setPatients(result.patients);
    } catch (err) {
      console.log('Failed to load patients:', err.message);
    } finally {
      setLoading(false);
    }
  }

  if (user.role === 'doctor') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={typography.title}>Welcome, {user.fullName || 'there'}</Text>
          <Text style={typography.subtitle}>Logged in as: {user.role}</Text>
        </View>

        <View style={styles.body}>
          <Text style={[typography.sectionHeading, styles.sectionSpacing]}>Your patients</Text>

          {loading ? (
            <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />
          ) : patients.length === 0 ? (
            <Text style={styles.emptyText}>No patients assigned yet.</Text>
          ) : (
            <FlatList
              data={patients}
              keyExtractor={(item) => String(item.patient_id)}
              style={styles.list}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.listCard} onPress={() => onSelectPatient(item)}>
                  <View style={styles.listCardIcon}>
                    <Ionicons name="person" size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={typography.cardTitle}>{item.full_name || item.email}</Text>
                    {item.latest_score !== null ? (
                      <>
                        <Text style={typography.cardDescription}>
                          Latest: {item.latest_score} · {item.latest_severity}
                        </Text>
                        <Text style={styles.dateText}>
                          {new Date(item.last_taken_at).toLocaleDateString()}
                        </Text>
                      </>
                    ) : (
                      <Text style={typography.cardDescription}>No submissions yet</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            />
          )}

          <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
            <Ionicons name="log-out-outline" size={18} color={colors.danger} style={{ marginRight: 8 }} />
            <Text style={styles.logoutButtonText}>Log out</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const menuItems = [
    { key: 'questionnaire', label: 'Questionnaire', icon: 'clipboard-outline' },
    { key: 'activities', label: 'Activities', icon: 'game-controller-outline' },
    { key: 'myHistory', label: 'History', icon: 'bar-chart-outline' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={typography.title}>Welcome, {user.fullName || 'there'}</Text>
        <Text style={typography.subtitle}>Logged in as: {user.role}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.grid}>
          {menuItems.map((item) => (
            <TouchableOpacity key={item.key} style={styles.gridCard} onPress={() => onNavigate(item.key)}>
              <View style={styles.gridIconWrap}>
                <Ionicons name={item.icon} size={26} color={colors.primary} />
              </View>
              <Text style={styles.gridCardText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={18} color={colors.danger} style={{ marginRight: 8 }} />
          <Text style={styles.logoutButtonText}>Log out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const CARD_GAP = spacing.sm;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 70,
    paddingBottom: 28,
    paddingHorizontal: spacing.md,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  body: { flex: 1, padding: spacing.md },
  sectionSpacing: { marginBottom: spacing.sm },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: CARD_GAP,
    ...shadow,
  },
  gridIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  gridCardText: { fontSize: 15, fontWeight: '600', color: colors.text, textAlign: 'center' },
  logoutButton: {
    ...buttonBase,
    backgroundColor: colors.dangerLight,
    marginTop: 'auto',
  },
  logoutButtonText: { color: colors.danger, fontSize: 16, fontWeight: '600' },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
  list: { flex: 1, marginBottom: spacing.sm },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    ...shadow,
  },
  listCardIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  dateText: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});