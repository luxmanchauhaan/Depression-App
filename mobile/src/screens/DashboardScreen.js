import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { getQuestionnaireHistory, getDoctorPatients } from '../api';

export default function DashboardScreen({ user, onLogout, onNavigate, onSelectPatient }) {
  const [history, setHistory] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user.role === 'patient') {
      loadHistory();
    } else if (user.role === 'doctor') {
      loadPatients();
    }
  }, []);

  async function loadHistory() {
    setLoading(true);
    try {
      const result = await getQuestionnaireHistory(user.token);
      setHistory(result.history);
    } catch (err) {
      console.log('Failed to load history:', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadPatients() {
    setLoading(true);
    try {
      const result = await getDoctorPatients(user.token);
      setPatients(result.patients);
    } catch (err) {
      console.log('Failed to load patients:', err.message);
    } finally {
      setLoading(false);
    }
  }

  if (user.role === 'doctor') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Welcome, {user.fullName || 'there'}</Text>
        <Text style={styles.subtitle}>Logged in as: {user.role}</Text>

        <Text style={styles.historyHeading}>Your patients</Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 20 }} />
        ) : patients.length === 0 ? (
          <Text style={styles.emptyText}>No patients assigned yet.</Text>
        ) : (
          <FlatList
            data={patients}
            keyExtractor={(item) => String(item.patient_id)}
            style={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.historyRow}
                onPress={() => onSelectPatient(item)}
              >
                <Text style={styles.historyScore}>{item.full_name || item.email}</Text>
                {item.latest_score !== null ? (
                  <>
                    <Text style={styles.historyDate}>
                      Latest: {item.latest_score} · {item.latest_severity}
                    </Text>
                    <Text style={styles.historyDate}>
                      {new Date(item.last_taken_at).toLocaleDateString()}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.historyDate}>No submissions yet</Text>
                )}
              </TouchableOpacity>
            )}
          />
        )}

        <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={onLogout}>
          <Text style={styles.buttonText}>Log out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {user.fullName || 'there'}</Text>
      <Text style={styles.subtitle}>Logged in as: {user.role}</Text>

      <TouchableOpacity style={styles.button} onPress={() => onNavigate('questionnaire')}>
        <Text style={styles.buttonText}>Take questionnaire</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => onNavigate('activities')}>
        <Text style={styles.buttonText}>Activities</Text>
      </TouchableOpacity>

      <Text style={styles.historyHeading}>Your history</Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : history.length === 0 ? (
        <Text style={styles.emptyText}>No submissions yet.</Text>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => String(item.id)}
          style={styles.list}
          renderItem={({ item }) => (
            <View style={styles.historyRow}>
              <Text style={styles.historyDate}>
                {new Date(item.taken_at).toLocaleDateString()}
              </Text>
              <Text style={styles.historyScore}>
                Score: {item.total_score} · {item.severity}
              </Text>
            </View>
          )}
        />
      )}

      <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={onLogout}>
        <Text style={styles.buttonText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '600', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 },
  button: { backgroundColor: '#3B6D11', paddingVertical: 14, borderRadius: 8, marginBottom: 12 },
  logoutButton: { backgroundColor: '#993C1D', marginTop: 'auto' },
  buttonText: { color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '500' },
  historyHeading: { fontSize: 16, fontWeight: '600', marginTop: 8, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 12 },
  list: { flex: 1, marginBottom: 12 },
  historyRow: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  historyDate: { fontSize: 13, color: '#666', marginBottom: 4 },
  historyScore: { fontSize: 15, fontWeight: '500' },
});