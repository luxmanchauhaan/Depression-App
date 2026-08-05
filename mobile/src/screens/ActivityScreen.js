import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadow } from '../theme';
import { categoryColors } from '../theme';

const TESTS = [
  { key: 'memoryTest', category: 'memory', label: 'Memory Test', description: 'Recall a digit sequence.', icon: 'extension-puzzle-outline' },
  { key: 'attentionTest', category: 'attention', label: 'Attention Test', description: 'Tap only the target letter.', icon: 'eye-outline' },
  { key: 'visualMemoryTest', category: 'visual_memory', label: 'Visual Memory', description: 'Recall a highlighted pattern.', icon: 'grid-outline' },
  { key: 'processingSpeedTest', category: 'processing_speed', label: 'Processing Speed', description: 'React as fast as you can.', icon: 'speedometer-outline' },
  { key: 'executiveFunctionTest', category: 'executive_function', label: 'Executive Function', description: 'Tap the ink color, not the word.', icon: 'flash-outline' },
];

export default function ActivityScreen({ token, onNavigate }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={typography.title}>Activities</Text>
        <Text style={typography.subtitle}>Cognitive tests to track your progress</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.grid}>
          {TESTS.map((item) => {
            const c = categoryColors[item.category];
            return (
              <TouchableOpacity
                key={item.key}
                style={styles.card}
                onPress={() => onNavigate(item.key)}
              >
                <View style={[styles.iconWrap, { backgroundColor: c.bg }]}>
                  <Ionicons name={item.icon} size={26} color={c.icon} />
                </View>
                <Text style={styles.cardTitle}>{item.label}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
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
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    ...shadow,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
  cardDescription: { fontSize: 12, color: colors.textMuted, lineHeight: 16 },
  backLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm, marginBottom: spacing.lg },
  backLinkText: { color: colors.primaryDark, fontSize: 14, fontWeight: '600' },
});