import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme';

export default function ActivityBuilderScreen({ user }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activity Builder</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.placeholderIconWrap}>
          <Ionicons name="construct-outline" size={40} color={colors.primary} />
        </View>
        <Text style={styles.placeholderText}>Build and track your own wellness activities here soon.</Text>
      </View>
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
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  placeholderIconWrap: {
    width: 72, height: 72, borderRadius: radius.lg, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  placeholderText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
});
