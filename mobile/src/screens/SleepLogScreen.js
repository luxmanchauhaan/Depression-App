import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, Dimensions, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { submitSleepLog, getSleepHistory } from '../api';
import { colors, spacing, radius, shadow } from '../theme';

const QUALITY_OPTIONS = [
  { value: 'poor', label: 'Poor' },
  { value: 'fair', label: 'Fair' },
  { value: 'good', label: 'Good' },
];

const THEME = { bg: '#E1E7FB', icon: '#6C7FD6' };

export default function SleepLogScreen({ token, onNavigate }) {
  const [hours, setHours] = useState('');
  const [quality, setQuality] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setLoading(true);
    try {
      const result = await getSleepHistory(token);
      setHistory(result.history);
    } catch (err) {
      console.log('Failed to load sleep history:', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    const hoursNum = parseFloat(hours);
    if (!hours || isNaN(hoursNum) || hoursNum < 0 || hoursNum > 24) {
      Alert.alert('Invalid input', 'Enter a valid number of hours (0-24).');
      return;
    }
    if (!quality) {
      Alert.alert('Missing info', 'Please select a sleep quality rating.');
      return;
    }

    setSubmitting(true);
    try {
      await submitSleepLog(token, hoursNum, quality);
      setHours('');
      setQuality(null);
      await loadHistory();
      Alert.alert('Logged', 'Your sleep entry has been saved.');
    } catch (err) {
      Alert.alert('Failed to save', err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const chronological = [...history].reverse();
  const chartData = {
    labels: chronological.map((item) =>
      new Date(item.logged_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    ),
    datasets: [{ data: chronological.map((item) => parseFloat(item.hours_slept)) }],
  };
  const screenWidth = Dimensions.get('window').width - 48;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: THEME.icon }]}>
        <View style={[styles.headerIconWrap, { backgroundColor: THEME.bg }]}>
          <Ionicons name="moon-outline" size={28} color={THEME.icon} />
        </View>
        <Text style={styles.headerTitle}>Sleep Log</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.card}>
          <Text style={styles.label}>Hours slept last night</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 7.5"
            keyboardType="decimal-pad"
            value={hours}
            onChangeText={setHours}
          />

          <Text style={[styles.label, { marginTop: spacing.sm }]}>Sleep quality</Text>
          <View style={styles.qualityRow}>
            {QUALITY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.qualityButton,
                  quality === opt.value && { backgroundColor: THEME.icon, borderColor: THEME.icon },
                ]}
                onPress={() => setQuality(opt.value)}
              >
                <Text style={[styles.qualityText, quality === opt.value && { color: '#fff' }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: THEME.icon }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.primaryButtonText}>{submitting ? 'Saving...' : 'Log Sleep'}</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 20 }} color={THEME.icon} />
        ) : history.length === 0 ? (
          <Text style={styles.emptyText}>No sleep logs yet.</Text>
        ) : (
          <>
            {history.length === 1 && (
              <View style={styles.hintCard}>
                <Ionicons name="information-circle-outline" size={18} color={THEME.icon} style={{ marginRight: 6 }} />
                <Text style={[styles.hintText, { color: THEME.icon }]}>Log once more to see your trend graph.</Text>
              </View>
            )}

            {history.length >= 2 && (
              <View style={styles.chartCard}>
                <Text style={styles.chartCaption}>Hours of sleep over time</Text>
                <View>
                  <LineChart
                    data={chartData}
                    width={screenWidth}
                    height={200}
                    withInnerLines={false}
                    chartConfig={{
                      backgroundColor: colors.surface,
                      backgroundGradientFrom: colors.surface,
                      backgroundGradientTo: colors.surface,
                      decimalPlaces: 1,
                      color: () => THEME.icon,
                      labelColor: () => colors.textMuted,
                      propsForDots: { r: '5', strokeWidth: '2', stroke: THEME.icon, fill: colors.surface },
                    }}
                    bezier
                    style={{ borderRadius: radius.md, marginLeft: -spacing.sm }}
                    onDataPointClick={({ index, x, y }) => {
                      const item = chronological[index];
                      setTooltip({ x, y, date: new Date(item.logged_date).toLocaleDateString(), value: `${item.hours_slept}h · ${item.quality}` });
                    }}
                  />
                  {tooltip && (
                    <View style={[styles.tooltip, { left: Math.max(0, tooltip.x - 60), top: tooltip.y - 10, backgroundColor: THEME.icon }]}>
                      <Text style={styles.tooltipText}>{tooltip.date}</Text>
                      <Text style={styles.tooltipText}>{tooltip.value}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.tapHint}>Tap a point to see date and details</Text>
              </View>
            )}

            <FlatList
              data={history}
              keyExtractor={(item) => String(item.id)}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.row}>
                  <View style={[styles.rowDot, { backgroundColor: THEME.icon }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowScore}>{item.hours_slept}h · {item.quality}</Text>
                    <Text style={styles.rowDate}>{new Date(item.logged_date).toLocaleDateString()}</Text>
                  </View>
                </View>
              )}
            />
          </>
        )}

        <TouchableOpacity onPress={() => onNavigate('dashboard')} style={styles.backLink}>
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
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, ...shadow },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 12, fontSize: 15, backgroundColor: colors.background },
  qualityRow: { flexDirection: 'row', justifyContent: 'space-between' },
  qualityButton: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingVertical: 10, marginHorizontal: 4, alignItems: 'center' },
  qualityText: { fontSize: 14, fontWeight: '600', color: colors.text },
  primaryButton: { paddingVertical: 14, borderRadius: radius.lg, alignItems: 'center', marginTop: spacing.md },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
  hintCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.md, ...shadow },
  hintText: { fontSize: 13, fontWeight: '500', flex: 1 },
  chartCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.md, ...shadow },
  chartCaption: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 4, textAlign: 'center' },
  tapHint: { fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 4 },
  tooltip: { position: 'absolute', borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8 },
  tooltipText: { color: '#fff', fontSize: 11 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.xs, ...shadow },
  rowDot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.sm },
  rowScore: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowDate: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  backLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, marginBottom: spacing.lg },
  backLinkText: { color: colors.primaryDark, fontSize: 14, fontWeight: '600' },
});