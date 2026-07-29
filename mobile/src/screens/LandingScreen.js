import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function LandingScreen({ onNavigate }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Depression app</Text>
      <Text style={styles.subtitle}>Track mood, get support, stay on top of it.</Text>

      <TouchableOpacity style={styles.button} onPress={() => onNavigate('patientSignup')}>
        <Text style={styles.buttonText}>Sign up as patient</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => onNavigate('doctorSignup')}>
        <Text style={styles.buttonText}>Sign up as doctor</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkButton} onPress={() => onNavigate('login')}>
        <Text style={styles.linkText}>Already have an account? Log in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '600', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 40 },
  button: {
    backgroundColor: '#3B6D11',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonText: { color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '500' },
  linkButton: { marginTop: 16 },
  linkText: { color: '#3B6D11', textAlign: 'center', fontSize: 14 },
});
