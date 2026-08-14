import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { getDashboardSummary } from '../api';
import { colors, spacing, radius, typography, shadow, buttonBase } from '../theme';

function getSeverityColor(severity) {
  const key = (severity || '').toLowerCase();
  if (key.includes('severe')) return colors.danger;
  if (key.includes('moderate')) return '#E0A458';
  if (key.includes('mild')) return colors.accent;
  return colors.primary;
}

const COGNITIVE_LABELS = {
  memory: 'Memory Test',
  attention: 'Attention Test',
  visual_memory: 'Visual Memory',
  processing_speed: 'Processing Speed',
  executive_function: 'Executive Function',
};

export default function DashboardScreen({ user, onLogout, onNavigate }) {
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  useEffect(() => {
    if (user.role === 'patient') {
      loadSummary();
    }
  }, []);

  async function loadSummary() {
    setLoadingSummary(true);
    try {
      const result = await getDashboardSummary(user.token);
      setSummary(result);
    } catch (err) {
      console.log('Failed to load dashboard summary:', err.message);
    } finally {
      setLoadingSummary(false);
    }
  }

  if (user.role === 'doctor') {
    const doctorMenuItems = [
      { key: 'patientList', label: 'Patients', icon: 'people-outline' },
    ];

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[typography.title, styles.headerTitle]}>Welcome, {user.fullName || 'there'}</Text>
          <Text style={[typography.subtitle, styles.headerSubtitle]}>Role : {user.role}</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.grid}>
            {doctorMenuItems.map((item) => (
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

  const menuItems = [
    { key: 'moodCheckIn', label: 'Mood Check-in', icon: 'happy-outline' },
    { key: 'questionnaire', label: 'Questionnaire', icon: 'clipboard-outline' },
    { key: 'activities', label: 'Cognitive Activities', icon: 'game-controller-outline' },
    { key: 'myHistory', label: 'History', icon: 'bar-chart-outline' },
    { key: 'sleepLog', label: 'Sleep Log', icon: 'moon-outline' },
    { key: 'weightLog', label: 'Weight Log', icon: 'scale-outline' },
    { key: 'medicineReminders', label: 'Medicine Reminders', icon: 'medkit-outline' },
  ];

  const fullBdiHistory = summary?.bdi_history || [];
  const bdiHistory = fullBdiHistory.slice(-6);
  const CHART_HEIGHT = 180;
  const Y_LABEL_WIDTH = 22;
  const screenWidth = Dimensions.get('window').width - (spacing.md * 2) - (spacing.sm * 2) - Y_LABEL_WIDTH;

  // Month/year label shown once above the chart, since the x-axis now shows day numbers only.
  // If the visible points span more than one month, show a range instead of a single month.
  let monthLabel = '';
  if (bdiHistory.length > 0) {
    const firstDate = new Date(bdiHistory[0].taken_at);
    const lastDate = new Date(bdiHistory[bdiHistory.length - 1].taken_at);
    const firstMonth = firstDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    const lastMonth = lastDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    monthLabel = firstMonth === lastMonth ? firstMonth : `${firstDate.toLocaleDateString(undefined, { month: 'short' })} – ${lastMonth}`;
  }

  const chartData = {
    labels: bdiHistory.map((item) => String(new Date(item.taken_at).getDate())),
    datasets: [{ data: bdiHistory.map((item) => item.total_score) }],
  };

  const severityColor = getSeverityColor(summary?.latest_bdi?.severity);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[typography.title, styles.headerTitle]}>Welcome, {user.fullName || 'there'}</Text>
        <Text style={[typography.subtitle, styles.headerSubtitle]}>Role : {user.role}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {loadingSummary ? (
          <ActivityIndicator style={{ marginBottom: spacing.md }} color={colors.primary} />
        ) : (
          <>
            <View style={styles.growthCard}>
              <Text style={styles.growthTitle}>Your Progress</Text>
              {bdiHistory.length >= 2 ? (
                <>
                  <Text style={styles.monthLabel}>{monthLabel}</Text>
                  <View style={styles.chartRow}>
                    <View style={[styles.axisLabelYWrap, { height: CHART_HEIGHT }]}>
                      <Text style={styles.axisLabelY}>Score</Text>
                    </View>
                    <LineChart
                      data={chartData}
                      width={screenWidth}
                      height={CHART_HEIGHT}
                      withInnerLines={false}
                      chartConfig={{
                        backgroundColor: colors.surface,
                        backgroundGradientFrom: colors.surface,
                        backgroundGradientTo: colors.surface,
                        decimalPlaces: 0,
                        color: () => colors.primary,
                        labelColor: () => colors.textMuted,
                        propsForDots: { r: '4', strokeWidth: '2', stroke: colors.primary, fill: colors.surface },
                        propsForLabels: { fontSize: 11 },
                      }}
                      bezier
                      style={{ borderRadius: radius.md }}
                    />
                  </View>
                  <Text style={styles.axisLabelX}>Date of Assessment</Text>
                  <View style={styles.captionBadge}>
                    <Ionicons name="trending-down" size={14} color={colors.primaryDark} style={{ marginRight: 6 }} />
                    <Text style={styles.captionBadgeText}>BDI-II score trend — lower is better</Text>
                  </View>
                </>
              ) : summary?.latest_bdi ? (
                <Text style={styles.growthEmptyText}>Take the questionnaire once more to see your trend.</Text>
              ) : (
                <Text style={styles.growthEmptyText}>Take the questionnaire to start tracking your progress.</Text>
              )}
            </View>

            <View style={styles.quickGrid}>
              <View style={styles.quickCard}>
                <Ionicons name="clipboard" size={18} color={severityColor} />
                <Text style={styles.quickLabel}>Latest Questionnaire Score</Text>
                {summary?.latest_bdi ? (
                  <Text style={[styles.quickValue, { color: severityColor }]}>
                    {summary.latest_bdi.total_score} · {summary.latest_bdi.severity}
                  </Text>
                ) : (
                  <Text style={styles.quickEmpty}>No data yet</Text>
                )}
              </View>

              <View style={styles.quickCard}>
                <Ionicons name="game-controller" size={18} color={colors.primary} />
                <Text style={styles.quickLabel}>Last Activity</Text>
                {summary?.latest_cognitive ? (
                  <Text style={styles.quickValue}>
                    {COGNITIVE_LABELS[summary.latest_cognitive.test_type] || summary.latest_cognitive.test_type} · {summary.latest_cognitive.score}
                  </Text>
                ) : (
                  <Text style={styles.quickEmpty}>No data yet</Text>
                )}
              </View>

              <View style={styles.quickCard}>
                <Ionicons name="moon" size={18} color={colors.primary} />
                <Text style={styles.quickLabel}>Last Sleep</Text>
                {summary?.latest_sleep ? (
                  <Text style={styles.quickValue}>
                    {summary.latest_sleep.hours_slept}h · {summary.latest_sleep.quality}
                  </Text>
                ) : (
                  <Text style={styles.quickEmpty}>No data yet</Text>
                )}
              </View>

              <View style={styles.quickCard}>
                <Ionicons name="scale" size={18} color={colors.primary} />
                <Text style={styles.quickLabel}>Last Weight</Text>
                {summary?.latest_weight ? (
                  <Text style={styles.quickValue}>{summary.latest_weight.weight_kg} kg</Text>
                ) : (
                  <Text style={styles.quickEmpty}>No data yet</Text>
                )}
              </View>
            </View>
          </>
        )}

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
      </ScrollView>
    </View>
  );
}

const CARD_GAP = spacing.sm;

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
  headerTitle: { includeFontPadding: false, textAlignVertical: 'center' },
  headerSubtitle: { marginTop: 2, includeFontPadding: false, textAlignVertical: 'center' },
  body: { padding: spacing.md },
  growthCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow,
  },
  growthTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 2 },
  monthLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginBottom: spacing.xs },
  growthEmptyText: { fontSize: 13, color: colors.textMuted, paddingVertical: spacing.md, textAlign: 'center' },
  chartRow: { flexDirection: 'row', alignItems: 'center' },
  axisLabelYWrap: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  axisLabelY: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    width: 60,
    textAlign: 'center',
    transform: [{ rotate: '-90deg' }],
  },
  axisLabelX: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  captionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.sm,
    alignSelf: 'center',
  },
  captionBadgeText: { fontSize: 12, color: colors.primaryDark, fontWeight: '600' },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  quickCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    ...shadow,
  },
  quickLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600', marginTop: 6, marginBottom: 2, textTransform: 'uppercase' },
  quickValue: { fontSize: 14, fontWeight: '700', color: colors.text, textTransform: 'capitalize' },
  quickEmpty: { fontSize: 13, color: colors.textMuted },
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
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  logoutButtonText: { color: colors.danger, fontSize: 16, fontWeight: '600' },
});