import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getProfile, changePassword } from '../api';
import { colors, spacing, radius, typography, shadow, buttonBase } from '../theme';

function formatDate(value) {
  if (!value) return 'Not set';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function capitalize(value) {
  if (!value) return 'Not set';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function ProfileScreen({ user, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const result = await getProfile(user.token);
      setProfile(result);
    } catch (err) {
      Alert.alert('Could not load profile', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing info', 'Please fill in all three password fields.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Password too short', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords don\'t match', 'New password and confirmation must match.');
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword(user.token, currentPassword, newPassword);
      Alert.alert('Success', 'Your password has been updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (err) {
      Alert.alert('Could not change password', err.message);
    } finally {
      setSavingPassword(false);
    }
  }

  function confirmLogout() {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: onLogout },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <Ionicons name="person" size={32} color={colors.primary} />
        </View>
        <Text style={[typography.title, styles.headerTitle]}>{profile?.full_name || user.fullName || 'Profile'}</Text>
        <Text style={[typography.subtitle, styles.headerSubtitle]}>{profile?.email || ''}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {loading ? (
          <ActivityIndicator style={{ marginVertical: spacing.lg }} color={colors.primary} />
        ) : (
          <>
            <Text style={styles.sectionHeading}>Your Details</Text>
            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Full Name</Text>
                <Text style={styles.detailValue}>{profile?.full_name || 'Not set'}</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{profile?.email || 'Not set'}</Text>
              </View>
              {user.role === 'patient' && (
                <>
                  <View style={styles.detailDivider} />
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date of Birth</Text>
                    <Text style={styles.detailValue}>{formatDate(profile?.date_of_birth)}</Text>
                  </View>
                  <View style={styles.detailDivider} />
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Gender</Text>
                    <Text style={styles.detailValue}>{capitalize(profile?.gender)}</Text>
                  </View>
                  {profile?.doctor_code && (
                    <>
                      <View style={styles.detailDivider} />
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Doctor Code</Text>
                        <Text style={styles.detailValue}>{profile.doctor_code}</Text>
                      </View>
                    </>
                  )}
                </>
              )}
              {user.role === 'doctor' && profile?.doctor_code && (
                <>
                  <View style={styles.detailDivider} />
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Doctor Code</Text>
                    <Text style={styles.detailValue}>{profile.doctor_code}</Text>
                  </View>
                  <View style={styles.detailDivider} />
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Specialization</Text>
                    <Text style={styles.detailValue}>{profile?.specialization || 'Not set'}</Text>
                  </View>
                </>
              )}
            </View>

            <Text style={styles.sectionHeading}>Security</Text>
            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.7}
              onPress={() => setShowPasswordForm((prev) => !prev)}
            >
              <Ionicons name="lock-closed-outline" size={20} color={colors.primary} style={{ marginRight: spacing.sm }} />
              <Text style={styles.menuRowText}>Change Password</Text>
              <Ionicons
                name={showPasswordForm ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textMuted}
                style={{ marginLeft: 'auto' }}
              />
            </TouchableOpacity>

            {showPasswordForm && (
              <View style={styles.passwordCard}>
                <TextInput
                  style={styles.input}
                  placeholder="Current password"
                  secureTextEntry
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                />
                <TextInput
                  style={styles.input}
                  placeholder="New password (min 6 characters)"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm new password"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity
                  style={[styles.saveButton, savingPassword && { opacity: 0.6 }]}
                  onPress={handleChangePassword}
                  disabled={savingPassword}
                >
                  {savingPassword ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Update Password</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={styles.logoutButton} activeOpacity={0.8} onPress={confirmLogout}>
              <Ionicons name="log-out-outline" size={18} color={colors.danger} style={{ marginRight: 8 }} />
              <Text style={styles.logoutButtonText}>Log out</Text>
            </TouchableOpacity>
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
    paddingBottom: 24,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  avatarWrap: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs,
  },
  headerTitle: { includeFontPadding: false, textAlignVertical: 'center' },
  headerSubtitle: { marginTop: 2, includeFontPadding: false, textAlignVertical: 'center' },
  body: { padding: spacing.md },
  sectionHeading: { ...typography.sectionHeading, marginBottom: spacing.xs, marginTop: spacing.xs },
  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    ...shadow,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  detailDivider: { height: 1, backgroundColor: colors.border },
  detailLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  detailValue: { fontSize: 14, color: colors.text, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    ...shadow,
  },
  menuRowText: { fontSize: 15, fontWeight: '600', color: colors.text },
  passwordCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    ...shadow,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: 12,
    marginBottom: spacing.sm,
    fontSize: 14,
  },
  saveButton: {
    ...buttonBase,
    backgroundColor: colors.primary,
  },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  logoutButton: {
    ...buttonBase,
    backgroundColor: colors.dangerLight,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  logoutButtonText: { color: colors.danger, fontSize: 16, fontWeight: '600' },
});