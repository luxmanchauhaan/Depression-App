import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadow, categoryColors } from '../theme';

const CATEGORIES = [
  { key: 'bdi', label: 'BDI-II Score', icon: 'heart-outline' },
  { key: 'memory', label: 'Memory Test', icon: 'extension-puzzle-outline' },
  { key: 'attention', label: 'Attention Test', icon: 'eye-outline' },
  { key: 'visual_memory', label: 'Visual Memory', icon: 'grid-outline' },
  { key: 'processing_speed', label: 'Processing Speed', icon: 'speedometer-outline' },
  { key: 'executive_function', label: 'Executive Function', icon: 'flash-outline' },
];

export default function MyHistoryScreen({ onNavigate, onSelectCategory }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={typography.title}>Your History</Text>
        <Text style={typography.subtitle}>Track your progress over time</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.grid}>
          {CATEGORIES.map((cat) => {
            const c = categoryColors[cat.key];
            return (
              <TouchableOpacity
                key={cat.key}
                style={styles.card}
                onPress={() => onSelectCategory(cat.key)}
              >
                <View style={[styles.iconWrap, { backgroundColor: c.bg }]}>
                  <Ionicons name={cat.icon} size={26} color={c.icon} />
                </View>
                <Text style={styles.cardTitle}>{cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

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
    backgroundColor: colors.primary,
    paddingTop: 70,
    paddingBottom: 28,
    paddingHorizontal: spacing.md,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  body: { padding: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...shadow,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  cardTitle: { fontSize: 14, fontWeight: '600', color: colors.text, textAlign: 'center', paddingHorizontal: 4 },
  backLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm, marginBottom: spacing.lg },
  backLinkText: { color: colors.primaryDark, fontSize: 14, fontWeight: '600' },
});