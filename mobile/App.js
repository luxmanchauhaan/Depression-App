import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

import DashboardScreen from './src/screens/DashboardScreen';
import QuestionnaireScreen from './src/screens/QuestionnaireScreen';
import LandingScreen from './src/screens/LandingScreen';
import DoctorSignupScreen from './src/screens/DoctorSignupScreen';
import PatientSignupScreen from './src/screens/PatientSignupScreen';
import LoginScreen from './src/screens/LoginScreen';
import ActivityScreen from './src/screens/ActivityScreen';
import MemoryTestScreen from './src/screens/MemoryTestScreen';


export default function App() {
  const [screen, setScreen] = useState('landing');
  const [user, setUser] = useState(null); // { token, role, fullName }

  function handleAuth(authResult) {
    setUser(authResult);
    setScreen('dashboard');
  }

  function handleLogout() {
    setUser(null);
    setScreen('landing');
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="auto" />
        {screen === 'landing' && <LandingScreen onNavigate={setScreen} />}
        {screen === 'doctorSignup' && <DoctorSignupScreen onNavigate={setScreen} onAuth={handleAuth} />}
        {screen === 'patientSignup' && <PatientSignupScreen onNavigate={setScreen} onAuth={handleAuth} />}
        {screen === 'login' && <LoginScreen onNavigate={setScreen} onAuth={handleAuth} />}
        {screen === 'dashboard' && user && <DashboardScreen user={user} onLogout={handleLogout} onNavigate={setScreen} />}
        {screen === 'questionnaire' && user && (
          <QuestionnaireScreen
            token={user.token}
            onNavigate={setScreen}
            onSubmitted={() => setScreen('dashboard')}
          />
        )}
        {screen === 'activities' && user && (
          <ActivityScreen token={user.token} onNavigate={setScreen} />
        )}
        {screen === 'memoryTest' && user && (
          <MemoryTestScreen token={user.token} onNavigate={setScreen} />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
});