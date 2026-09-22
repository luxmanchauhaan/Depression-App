import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { signupPatient } from '../api';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export default function PatientSignupScreen({ onNavigate, onAuth }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [doctorCode, setDoctorCode] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false);

  function isValidDate(value) {
    if (!value) return true; // optional field
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const d = new Date(value);
    return !Number.isNaN(d.getTime());
  }

  async function handleSubmit() {
    if (!fullName || !email || !password || !doctorCode) {
      Alert.alert('Missing info', 'Name, email, password, and your doctor\'s code are required.');
      return;
    }
    if (!isValidDate(dateOfBirth)) {
      Alert.alert('Invalid date', 'Please enter your date of birth as YYYY-MM-DD, e.g. 1998-04-23.');
      return;
    }
    setLoading(true);
    try {
      const result = await signupPatient({
        full_name: fullName,
        email,
        password,
        doctor_code: doctorCode,
        date_of_birth: dateOfBirth || null,
        gender: gender || null,
      });
      onAuth({ token: result.token, role: 'patient', fullName });
    } catch (err) {
      Alert.alert('Signup failed', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Patient sign up</Text>

      <TextInput style={styles.input} placeholder="Full name" value={fullName} onChangeText={setFullName} />
      <TextInput style={styles.input} placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      <TextInput style={styles.input} placeholder="Doctor code (given by your doctor)" autoCapitalize="characters" value={doctorCode} onChangeText={setDoctorCode} />

      <TextInput
        style={styles.input}
        placeholder="Date of birth (YYYY-MM-DD) - optional"
        value={dateOfBirth}
        onChangeText={setDateOfBirth}
        keyboardType="numbers-and-punctuation"
        maxLength={10}
      />

      <Text style={styles.label}>Gender (optional)</Text>
      <View style={styles.genderRow}>
        {GENDER_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.genderPill, gender === opt.value && styles.genderPillActive]}
            onPress={() => setGender(gender === opt.value ? '' : opt.value)}
          >
            <Text style={[styles.genderPillText, gender === opt.value && styles.genderPillTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create account</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => onNavigate('landing')}>
        <Text style={styles.linkText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 24, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 15,
  },
  label: { fontSize: 13, color: '#666', marginBottom: 8, marginTop: 4 },
  genderRow: { flexDirection: 'row', marginBottom: 12 },
  genderPill: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 10,
    marginRight: 8,
    alignItems: 'center',
  },
  genderPillActive: { backgroundColor: '#3B6D11', borderColor: '#3B6D11' },
  genderPillText: { fontSize: 14, color: '#333', fontWeight: '500' },
  genderPillTextActive: { color: '#fff' },
  button: { backgroundColor: '#3B6D11', paddingVertical: 14, borderRadius: 8, marginTop: 8, marginBottom: 16 },
  buttonText: { color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '500' },
  linkText: { color: '#3B6D11', textAlign: 'center', fontSize: 14 },
});