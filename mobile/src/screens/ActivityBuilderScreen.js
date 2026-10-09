import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getActivities, createActivity, setActivityComplete, deleteActivity } from '../api';
import { colors, spacing, radius, shadow, buttonBase } from '../theme';

const CATEGORIES = [
  { key: 'yoga', label: 'Yoga', icon: 'body-outline', bg: '#DFF5E3', color: '#5FAE7B' },
  { key: 'meditation', label: 'Meditation', icon: 'flower-outline', bg: '#F3DCF7', color: '#B366C9' },
  { key: 'music', label: 'Music', icon: 'musical-notes-outline', bg: '#DCEEFB', color: '#4C9BD6' },
  { key: 'physical_activity', label: 'Physical', icon: 'barbell-outline', bg: '#FDEBD3', color: '#E0A458' },
];

const HISTORY_DAYS = 7;

function categoryMeta(key) {
  return CATEGORIES.find((c) => c.key === key) || CATEGORIES[0];
}

function todayLabel() {
  return new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

function dateOnlyNDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function formatSeconds(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function ActivityBuilderScreen({ user }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState('yoga');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [saving, setSaving] = useState(false);

  // Timer: only one activity's timer runs at a time, tracked by its id.
  const [runningId, setRunningId] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const intervalRef = useRef(null);

  // History panel
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyDays, setHistoryDays] = useState([]); // [{ date, activities }]
  const [expandedDate, setExpandedDate] = useState(null);

  useEffect(() => {
    load();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  async function load() {
    setLoading(true);
    try {
      const result = await getActivities(user.token);
      setActivities(result.activities);
    } catch (err) {
      console.log('Failed to load activities:', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Give your activity a name first.');
      return;
    }
    let durationMinutes = null;
    if (duration.trim()) {
      const parsed = Number(duration.trim());
      if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 600) {
        Alert.alert('Invalid duration', 'Enter a number of minutes between 1 and 600, or leave it blank.');
        return;
      }
      durationMinutes = parsed;
    }
    setSaving(true);
    try {
      const created = await createActivity(user.token, category, title.trim(), description.trim() || null, undefined, durationMinutes);
      setActivities((prev) => [...prev, created]);
      setTitle('');
      setDescription('');
      setDuration('');
      setCategory('yoga');
      setShowForm(false);
    } catch (err) {
      Alert.alert('Could not add activity', err.message);
    } finally {
      setSaving(false);
    }
  }

  async function markComplete(activity, completedValue) {
    setActivities((prev) =>
      prev.map((a) => (a.id === activity.id ? { ...a, completed: completedValue } : a))
    );
    try {
      await setActivityComplete(user.token, activity.id, completedValue);
    } catch (err) {
      setActivities((prev) =>
        prev.map((a) => (a.id === activity.id ? { ...a, completed: activity.completed } : a))
      );
      Alert.alert('Could not update', err.message);
    }
  }

  function handleToggle(activity) {
    markComplete(activity, !activity.completed);
  }

  function handleDelete(activity) {
    Alert.alert('Remove activity', `Remove "${activity.title}" from today's list?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          if (runningId === activity.id) stopTimer();
          const prev = activities;
          setActivities((p) => p.filter((a) => a.id !== activity.id));
          try {
            await deleteActivity(user.token, activity.id);
          } catch (err) {
            setActivities(prev);
            Alert.alert('Could not remove', err.message);
          }
        },
      },
    ]);
  }

  function stopTimer() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRunningId(null);
    setSecondsLeft(0);
  }

  function startTimer(activity) {
    if (runningId) {
      Alert.alert('Timer already running', 'Finish or cancel the current timer before starting another.');
      return;
    }
    const total = activity.duration_minutes * 60;
    setRunningId(activity.id);
    setSecondsLeft(total);

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setRunningId(null);
          markComplete(activity, true);
          Alert.alert('Time\'s up!', `"${activity.title}" is marked as done. Nice work.`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function cancelTimer() {
    stopTimer();
  }

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const days = [];
      for (let i = 0; i < HISTORY_DAYS; i++) {
        const date = dateOnlyNDaysAgo(i);
        const result = await getActivities(user.token, date);
        days.push({ date, activities: result.activities });
      }
      setHistoryDays(days);
    } catch (err) {
      Alert.alert('Could not load history', err.message);
    } finally {
      setHistoryLoading(false);
    }
  }

  function toggleHistory() {
    const next = !showHistory;
    setShowHistory(next);
    if (next) {
      loadHistory();
    }
  }

  const doneCount = activities.filter((a) => a.completed).length;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activity Builder</Text>
        <Text style={styles.headerSubtitle}>Stays until you delete it</Text>
        {activities.length > 0 && (
          <Text style={styles.headerProgress}>{doneCount} of {activities.length} completed</Text>
        )}
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: spacing.xl }} keyboardShouldPersistTaps="handled">
        {loading ? (
          <ActivityIndicator style={{ marginTop: spacing.lg }} color={colors.primary} />
        ) : (
          <>
            {activities.length === 0 && !showForm && (
              <View style={styles.emptyCard}>
                <Ionicons name="leaf-outline" size={32} color={colors.textMuted} />
                <Text style={styles.emptyText}>No activities yet.</Text>
                <Text style={styles.emptySubtext}>Add something you'd like to do \u2014 it'll stay here until you mark it done or remove it.</Text>
              </View>
            )}

            {activities.map((activity) => {
              const meta = categoryMeta(activity.category);
              const isRunning = runningId === activity.id;
              return (
                <View key={activity.id} style={[styles.activityCard, activity.completed && styles.activityCardDone]}>
                  <View style={styles.activityTopRow}>
                    <TouchableOpacity onPress={() => handleToggle(activity)} style={styles.checkWrap}>
                      <Ionicons
                        name={activity.completed ? 'checkmark-circle' : 'ellipse-outline'}
                        size={26}
                        color={activity.completed ? colors.primary : colors.border}
                      />
                    </TouchableOpacity>

                    <View style={[styles.categoryIconWrap, { backgroundColor: meta.bg }]}>
                      <Ionicons name={meta.icon} size={18} color={meta.color} />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.activityTitle, activity.completed && styles.activityTitleDone]}>
                        {activity.title}
                      </Text>
                      {activity.description ? (
                        <Text style={styles.activityDescription}>{activity.description}</Text>
                      ) : null}
                      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                        {activity.duration_minutes ? (
                          <Text style={styles.durationTag}>
                            <Ionicons name="time-outline" size={11} /> {activity.duration_minutes} min
                          </Text>
                        ) : null}
                        {activity.assigned_date && activity.assigned_date !== todayDateOnly() ? (
                          <Text style={[styles.durationTag, { marginLeft: activity.duration_minutes ? spacing.sm : 0 }]}>
                            Added {new Date(activity.assigned_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    <TouchableOpacity onPress={() => handleDelete(activity)} style={styles.deleteButton}>
                      <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>

                  {activity.duration_minutes && !activity.completed && (
                    <View style={styles.timerRow}>
                      {isRunning ? (
                        <>
                          <View style={styles.timerDisplay}>
                            <Ionicons name="hourglass-outline" size={16} color={meta.color} style={{ marginRight: 6 }} />
                            <Text style={[styles.timerText, { color: meta.color }]}>{formatSeconds(secondsLeft)}</Text>
                          </View>
                          <TouchableOpacity style={styles.cancelTimerButton} onPress={cancelTimer}>
                            <Text style={styles.cancelTimerText}>Cancel</Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <TouchableOpacity
                          style={[styles.startButton, { backgroundColor: meta.color }, runningId && { opacity: 0.5 }]}
                          onPress={() => startTimer(activity)}
                          disabled={!!runningId}
                        >
                          <Ionicons name="play" size={14} color="#fff" style={{ marginRight: 6 }} />
                          <Text style={styles.startButtonText}>Start {activity.duration_minutes} min timer</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              );
            })}

            {showForm ? (
              <View style={styles.formCard}>
                <Text style={styles.formLabel}>Category</Text>
                <View style={styles.categoryRow}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.key}
                      style={[
                        styles.categoryPill,
                        { backgroundColor: cat.bg },
                        category === cat.key && { borderColor: cat.color, borderWidth: 2 },
                      ]}
                      onPress={() => setCategory(cat.key)}
                    >
                      <Ionicons name={cat.icon} size={16} color={cat.color} style={{ marginRight: 4 }} />
                      <Text style={[styles.categoryPillText, { color: cat.color }]}>{cat.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.formLabel}>What would you like to do?</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 10-minute evening walk"
                  value={title}
                  onChangeText={setTitle}
                />

                <Text style={styles.formLabel}>Notes (optional)</Text>
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  placeholder="Any details you want to remember"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                />

                <Text style={styles.formLabel}>Duration in minutes (optional \u2014 adds a timer)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 10"
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="number-pad"
                  maxLength={3}
                />

                <View style={styles.formButtonRow}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowForm(false);
                      setTitle('');
                      setDescription('');
                      setDuration('');
                    }}
                    disabled={saving}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveButton, saving && { opacity: 0.6 }]}
                    onPress={handleCreate}
                    disabled={saving}
                  >
                    {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveButtonText}>Add Activity</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(true)}>
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={styles.addButtonText}>Add an activity</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.historyToggle} onPress={toggleHistory}>
              <Ionicons name="calendar-outline" size={16} color={colors.primaryDark} style={{ marginRight: 6 }} />
              <Text style={styles.historyToggleText}>
                {showHistory ? 'Hide' : 'View'} last {HISTORY_DAYS} days
              </Text>
              <Ionicons
                name={showHistory ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.primaryDark}
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>

            {showHistory && (
              <View style={styles.historyPanel}>
                {historyLoading ? (
                  <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
                ) : historyDays.length === 0 ? (
                  <Text style={styles.historyEmptyText}>No history to show yet.</Text>
                ) : (
                  historyDays.map((day) => {
                    const total = day.activities.length;
                    const done = day.activities.filter((a) => a.completed).length;
                    const allDone = total > 0 && done === total;
                    const isExpanded = expandedDate === day.date;
                    return (
                      <View key={day.date}>
                        <TouchableOpacity
                          style={styles.historyRow}
                          onPress={() => setExpandedDate(isExpanded ? null : day.date)}
                        >
                          <Ionicons
                            name={total === 0 ? 'remove-circle-outline' : allDone ? 'checkmark-circle' : 'time-outline'}
                            size={18}
                            color={total === 0 ? colors.textMuted : allDone ? colors.primary : '#E0A458'}
                            style={{ marginRight: 8 }}
                          />
                          <Text style={styles.historyDate}>
                            {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                          </Text>
                          <Text style={styles.historyCount}>
                            {total === 0 ? 'No activities' : `${done}/${total} done`}
                          </Text>
                          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textMuted} />
                        </TouchableOpacity>
                        {isExpanded && total > 0 && (
                          <View style={styles.historyDetail}>
                            {day.activities.map((a) => (
                              <View key={a.id} style={styles.historyDetailRow}>
                                <Ionicons
                                  name={a.completed ? 'checkmark-circle' : 'close-circle-outline'}
                                  size={14}
                                  color={a.completed ? colors.primary : colors.textMuted}
                                  style={{ marginRight: 6 }}
                                />
                                <Text style={[styles.historyDetailText, !a.completed && { color: colors.textMuted }]}>
                                  {a.title}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  headerProgress: { fontSize: 12, color: 'rgba(255,255,255,0.95)', marginTop: 6, fontWeight: '600' },
  body: { flex: 1, padding: spacing.md },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    ...shadow,
  },
  emptyText: { fontSize: 14, color: colors.text, fontWeight: '600', marginTop: spacing.xs },
  emptySubtext: { fontSize: 12, color: colors.textMuted, marginTop: 2, textAlign: 'center' },
  activityCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    ...shadow,
  },
  activityCardDone: { opacity: 0.65 },
  activityTopRow: { flexDirection: 'row', alignItems: 'center' },
  checkWrap: { marginRight: spacing.sm },
  categoryIconWrap: {
    width: 34, height: 34, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm,
  },
  activityTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  activityTitleDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  activityDescription: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  durationTag: { fontSize: 11, color: colors.textMuted, marginTop: 2, fontWeight: '600' },
  deleteButton: { padding: 4, marginLeft: spacing.xs },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    flex: 1,
  },
  startButtonText: { fontSize: 12, color: '#fff', fontWeight: '700' },
  timerDisplay: { flexDirection: 'row', alignItems: 'center' },
  timerText: { fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },
  cancelTimerButton: { paddingVertical: 6, paddingHorizontal: spacing.sm },
  cancelTimerText: { fontSize: 12, color: colors.danger, fontWeight: '600' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    paddingVertical: 14,
    marginTop: spacing.xs,
  },
  addButtonText: { fontSize: 15, fontWeight: '600', color: colors.primary },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
    ...shadow,
  },
  formLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '700', marginBottom: spacing.xs, marginTop: spacing.sm },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap' },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryPillText: { fontSize: 12, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: 12,
    fontSize: 14,
    color: colors.text,
  },
  inputMultiline: { minHeight: 60, textAlignVertical: 'top' },
  formButtonRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.md },
  cancelButton: { paddingVertical: 12, paddingHorizontal: spacing.sm, marginRight: spacing.xs },
  cancelButtonText: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  saveButton: {
    ...buttonBase,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    minWidth: 130,
  },
  saveButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  historyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  historyToggleText: { fontSize: 13, color: colors.primaryDark, fontWeight: '600' },
  historyPanel: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    ...shadow,
  },
  historyEmptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.sm },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyDate: { fontSize: 13, fontWeight: '600', color: colors.text, flex: 1 },
  historyCount: { fontSize: 12, color: colors.textMuted, marginRight: spacing.xs },
  historyDetail: { paddingLeft: spacing.lg, paddingBottom: spacing.sm },
  historyDetailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3 },
  historyDetailText: { fontSize: 12, color: colors.text },
});