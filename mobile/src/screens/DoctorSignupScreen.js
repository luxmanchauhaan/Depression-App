import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { signupDoctor } from '../api';

export default function DoctorSignupScreen({ onNavigate, onAuth }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [doctorCode, setDoctorCode] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!fullName || !email || !password || !doctorCode) {
      Alert.alert('Missing info', 'Name, email, password, and a doctor code are required.');
      return;
    }
    setLoading(true);
    try {
      const result = await signupDoctor({
        full_name: fullName,
        email,
        password,
        doctor_code: doctorCode,
        specialization,
      });
      onAuth({ token: result.token, role: 'doctor', fullName });
    } catch (err) {
      Alert.alert('Signup failed', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Doctor sign up</Text>

      <TextInput style={styles.input} placeholder="Full name" value={fullName} onChangeText={setFullName} />
      <TextInput style={styles.input} placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      <TextInput style={styles.input} placeholder="Doctor code (you choose this, e.g. DR001)" autoCapitalize="characters" value={doctorCode} onChangeText={setDoctorCode} />
      <TextInput style={styles.input} placeholder="Specialization (optional)" value={specialization} onChangeText={setSpecialization} />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create account</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => onNavigate('landing')}>
        <Text style={styles.linkText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 24, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 15,
  },
  button: { backgroundColor: '#3B6D11', paddingVertical: 14, borderRadius: 8, marginTop: 8, marginBottom: 16 },
  buttonText: { color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '500' },
  linkText: { color: '#3B6D11', textAlign: 'center', fontSize: 14 },
});
