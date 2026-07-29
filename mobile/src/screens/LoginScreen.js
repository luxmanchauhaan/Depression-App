import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { login } from '../api';

export default function LoginScreen({ onNavigate, onAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email || !password) {
      Alert.alert('Missing info', 'Email and password are required.');
      return;
    }
    setLoading(true);
    try {
      const result = await login({ email, password });
      onAuth({ token: result.token, role: result.role, fullName: result.full_name });
    } catch (err) {
      Alert.alert('Login failed', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log in</Text>

      <TextInput style={styles.input} placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log in</Text>}
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
