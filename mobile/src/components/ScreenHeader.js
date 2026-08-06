import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme';

export default function ScreenHeader({ icon, title, subtitle, onBack, rightIcon, onRightPress }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerIconWrap}>
          <Ionicons name={icon} size={26} color={colors.primary} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
        </View>

        {rightIcon ? (
          <TouchableOpacity onPress={onRightPress} style={styles.rightButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name={rightIcon} size={22} color="#fff" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    paddingTop: 44,
    paddingBottom: 18,
    paddingHorizontal: spacing.md,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', height: 48 },
  backButton: { marginRight: spacing.xs, padding: 2 },
  headerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerTitle: { fontSize: 19, fontWeight: '700', color: '#fff', includeFontPadding: false, textAlignVertical: 'center' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2, includeFontPadding: false, textAlignVertical: 'center' },
  rightButton: { padding: 2, marginLeft: spacing.xs },
});