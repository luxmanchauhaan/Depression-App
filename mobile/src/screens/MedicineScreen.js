import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createMedicine, getMedicines, deactivateMedicine, getTodayDoses, updateDoseStatus } from '../api';
import { requestNotificationPermission, scheduleMedicineNotifications, cancelMedicineNotifications } from '../notifications';
import { colors, spacing, radius, shadow } from '../theme';

const THEME = { bg: '#FDE0E0', icon: '#E07A7A' };

export default function MedicineScreen({ token, onNavigate, onBack }) {
  const [medicines, setMedicines] = useState([]);
  const [doses, setDoses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [times, setTimes] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    requestNotificationPermission();
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [medResult, doseResult] = await Promise.all([getMedicines(token), getTodayDoses(token)]);
      setMedicines(medResult.medicines);
      setDoses(doseResult.doses);
    } catch (err) {
      console.log('Failed to load medicines:', err.message);
    } finally {
      setLoading(false);
    }
  }

  function addTime() {
    const trimmed = timeInput.trim();
    const valid = /^([01]\d|2[0-3]):([0-5]\d)$/.test(trimmed);
    if (!valid) {
      Alert.alert('Invalid time', 'Enter time as HH:MM in 24-hour format, e.g. 08:00 or 20:30.');
      return;
    }
    if (times.includes(trimmed)) return;
    setTimes([...times, trimmed].sort());
    setTimeInput('');
  }

  function removeTime(t) {
    setTimes(times.filter((x) => x !== t));
  }

  async function handleAddMedicine() {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Please enter the medicine name.');
      return;
    }
    if (times.length === 0) {
      Alert.alert('Missing times', 'Add at least one reminder time.');
      return;
    }

    setSubmitting(true);
    try {
      const granted = await requestNotificationPermission();
      let notificationIds = [];

      if (granted) {
        const scheduled = await scheduleMedicineNotifications(name.trim(), dosage.trim() || null, times);
        notificationIds = scheduled.map((s) => s.notificationId);
      } else {
        Alert.alert(
          'Notifications disabled',
          'The medicine will be saved, but reminders won\'t alert you unless notifications are enabled in your phone settings.'
        );
      }

      await createMedicine(token, name.trim(), dosage.trim() || null, times, notificationIds);
      setName('');
      setDosage('');
      setTimes([]);
      setShowForm(false);
      await loadAll();
    } catch (err) {
      Alert.alert('Failed to add medicine', err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemoveMedicine(id) {
    Alert.alert('Remove medicine', 'Stop reminders for this medicine?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            const med = medicines.find((m) => m.id === id);
            if (med?.notification_ids_json?.length) {
              await cancelMedicineNotifications(med.notification_ids_json);
            }
            await deactivateMedicine(token, id);
            await loadAll();
          } catch (err) {
            Alert.alert('Failed to remove', err.message);
          }
        },
      },
    ]);
  }

  async function handleDoseAction(logId, status) {
    try {
      await updateDoseStatus(token, logId, status);
      setDoses((prev) => prev.map((d) => (d.id === logId ? { ...d, status } : d)));
    } catch (err) {
      Alert.alert('Failed to update', err.message);
    }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: THEME.icon }]}>
        <View style={[styles.headerIconWrap, { backgroundColor: THEME.bg }]}>
          <Ionicons name="medkit-outline" size={28} color={THEME.icon} />
        </View>
        <Text style={styles.headerTitle}>Medicine Reminders</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.sectionHeading}>Today's Doses</Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 20 }} color={THEME.icon} />
        ) : doses.length === 0 ? (
          <Text style={styles.emptyText}>No medicines scheduled. Add one below.</Text>
        ) : (
          doses.map((dose) => (
            <View key={dose.id} style={styles.doseCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.doseName}>{dose.Medicine?.name}</Text>
                <Text style={styles.doseDetail}>
                  {dose.scheduled_time} {dose.Medicine?.dosage ? `· ${dose.Medicine.dosage}` : ''}
                </Text>
              </View>
              {dose.status === 'pending' ? (
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity style={styles.takenButton} onPress={() => handleDoseAction(dose.id, 'taken')}>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.missedButton} onPress={() => handleDoseAction(dose.id, 'missed')}>
                    <Ionicons name="close" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[styles.statusBadge, dose.status === 'taken' ? styles.takenBadge : styles.missedBadge]}>
                  <Text style={styles.statusBadgeText}>{dose.status}</Text>
                </View>
              )}
            </View>
          ))
        )}

        <Text style={[styles.sectionHeading, { marginTop: spacing.lg }]}>Your Medicines</Text>

        {medicines.length === 0 ? (
          <Text style={styles.emptyText}>No medicines added yet.</Text>
        ) : (
          medicines.map((med) => (
            <View key={med.id} style={styles.medCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.doseName}>{med.name}</Text>
                <Text style={styles.doseDetail}>
                  {med.dosage ? `${med.dosage} · ` : ''}{med.times_json.join(', ')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleRemoveMedicine(med.id)}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ))
        )}

        {!showForm ? (
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: THEME.icon }]} onPress={() => setShowForm(true)}>
            <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.primaryButtonText}>Add Medicine</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.formCard}>
            <Text style={styles.label}>Medicine name</Text>
            <TextInput style={styles.input} placeholder="e.g. Sertraline" value={name} onChangeText={setName} />

            <Text style={[styles.label, { marginTop: spacing.sm }]}>Dosage (optional)</Text>
            <TextInput style={styles.input} placeholder="e.g. 50mg" value={dosage} onChangeText={setDosage} />

            <Text style={[styles.label, { marginTop: spacing.sm }]}>Reminder times</Text>
            <View style={styles.timeRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="HH:MM (e.g. 08:00)"
                value={timeInput}
                onChangeText={setTimeInput}
              />
              <TouchableOpacity style={[styles.addTimeButton, { backgroundColor: THEME.icon }]} onPress={addTime}>
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {times.length > 0 && (
              <View style={styles.timeChipRow}>
                {times.map((t) => (
                  <TouchableOpacity key={t} style={styles.timeChip} onPress={() => removeTime(t)}>
                    <Text style={styles.timeChipText}>{t} ✕</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={{ flexDirection: 'row', marginTop: spacing.md }}>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: THEME.icon, flex: 1, marginRight: 8 }]}
                onPress={handleAddMedicine}
                disabled={submitting}
              >
                <Text style={styles.primaryButtonText}>{submitting ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.border, flex: 1 }]}
                onPress={() => { setShowForm(false); setName(''); setDosage(''); setTimes([]); }}
              >
                <Text style={[styles.primaryButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity onPress={onBack} style={styles.backLink}>
          <Ionicons name="arrow-back" size={16} color={colors.primaryDark} style={{ marginRight: 6 }} />
          <Text style={styles.backLinkText}>Back to dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: 70, paddingBottom: 24, paddingHorizontal: spacing.md, alignItems: 'center',
    borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg,
  },
  headerIconWrap: { width: 56, height: 56, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  body: { padding: spacing.md },
  sectionHeading: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  emptyText: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.sm },
  doseCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.xs, ...shadow,
  },
  medCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.xs, ...shadow,
  },
  doseName: { fontSize: 15, fontWeight: '600', color: colors.text },
  doseDetail: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  takenButton: { backgroundColor: colors.primary, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
  missedButton: { backgroundColor: colors.danger, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  takenBadge: { backgroundColor: colors.primaryLight },
  missedBadge: { backgroundColor: colors.dangerLight },
  statusBadgeText: { fontSize: 12, fontWeight: '600', color: colors.text, textTransform: 'capitalize' },
  primaryButton: { flexDirection: 'row', paddingVertical: 14, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  formCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm, ...shadow },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 12, fontSize: 15, backgroundColor: colors.background },
  timeRow: { flexDirection: 'row', alignItems: 'center' },
  addTimeButton: { width: 44, height: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  timeChipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm },
  timeChip: { backgroundColor: colors.primaryLight, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6, marginRight: 6, marginBottom: 6 },
  timeChipText: { fontSize: 13, color: colors.primaryDark, fontWeight: '600' },
  backLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, marginBottom: spacing.lg },
  backLinkText: { color: colors.primaryDark, fontSize: 14, fontWeight: '600' },
});