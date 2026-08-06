import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadow, buttonBase } from '../theme';

export default function DashboardScreen({ user, onLogout, onNavigate }) {
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
    { key: 'questionnaire', label: 'Questionnaire', icon: 'clipboard-outline' },
    { key: 'activities', label: 'Cognitive Activities', icon: 'game-controller-outline' },
    { key: 'myHistory', label: 'History', icon: 'bar-chart-outline' },
    { key: 'sleepLog', label: 'Sleep Log', icon: 'moon-outline' },
    { key: 'weightLog', label: 'Weight Log', icon: 'scale-outline' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[typography.title, styles.headerTitle]}>Welcome, {user.fullName || 'there'}</Text>
        <Text style={[typography.subtitle, styles.headerSubtitle]}>Role : {user.role}</Text>
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
    paddingTop: 44,
    paddingBottom: 18,
    paddingHorizontal: spacing.md,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  headerTitle: { includeFontPadding: false, textAlignVertical: 'center' },
  headerSubtitle: { marginTop: 2, includeFontPadding: false, textAlignVertical: 'center' },
  body: { flex: 1, padding: spacing.md },
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
});