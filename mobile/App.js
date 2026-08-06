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
import AttentionTestScreen from './src/screens/AttentionTestScreen';
import VisualMemoryTestScreen from './src/screens/VisualMemoryTestScreen';
import PatientDetailScreen from './src/screens/PatientDetailScreen';
import ProcessingSpeedTestScreen from './src/screens/ProcessingSpeedTestScreen';
import ExecutiveFunctionTestScreen from './src/screens/ExecutiveFunctionTestScreen';
import TestHistoryDetailScreen from './src/screens/TestHistoryDetailScreen';
import MyHistoryScreen from './src/screens/MyHistoryScreen';
import MyTestHistoryDetailScreen from './src/screens/MyTestHistoryDetailScreen';
import SleepLogScreen from './src/screens/SleepLogScreen';
import WeightLogScreen from './src/screens/WeightLogScreen';
import PatientListScreen from './src/screens/PatientListScreen';

export default function App() {
  const [screen, setScreen] = useState('landing');
  const [user, setUser] = useState(null); // { token, role, fullName }
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedMyCategory, setSelectedMyCategory] = useState(null);

  function handleAuth(authResult) {
    setUser(authResult);
    setScreen('dashboard');
  }

  function handleLogout() {
    setUser(null);
    setScreen('landing');
  }

  function handleSelectPatient(patient) {
    setSelectedPatient(patient);
    setScreen('patientDetail');
  }

  function handleSelectCategory(category) {
    setSelectedCategory(category);
    setScreen('testHistoryDetail');
  }

  function handleSelectMyCategory(category) {
    setSelectedMyCategory(category);
    setScreen('myTestHistoryDetail');
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="auto" />
        {screen === 'landing' && <LandingScreen onNavigate={setScreen} />}
        {screen === 'doctorSignup' && <DoctorSignupScreen onNavigate={setScreen} onAuth={handleAuth} />}
        {screen === 'patientSignup' && <PatientSignupScreen onNavigate={setScreen} onAuth={handleAuth} />}
        {screen === 'login' && <LoginScreen onNavigate={setScreen} onAuth={handleAuth} />}
        {screen === 'dashboard' && user && (
          <DashboardScreen
            user={user}
            onLogout={handleLogout}
            onNavigate={setScreen}
          />
        )}
        {screen === 'patientList' && user && (
          <PatientListScreen
            token={user.token}
            onNavigate={setScreen}
            onSelectPatient={handleSelectPatient}
          />
        )}
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
        {screen === 'attentionTest' && user && (
          <AttentionTestScreen token={user.token} onNavigate={setScreen} />
        )}
        {screen === 'visualMemoryTest' && user && (
          <VisualMemoryTestScreen token={user.token} onNavigate={setScreen} />
        )}
        {screen === 'patientDetail' && user && selectedPatient && (
          <PatientDetailScreen
            token={user.token}
            patient={selectedPatient}
            onNavigate={setScreen}
            onSelectCategory={handleSelectCategory}
          />
        )}
        {screen === 'processingSpeedTest' && user && (
          <ProcessingSpeedTestScreen token={user.token} onNavigate={setScreen} />
        )}
        {screen === 'executiveFunctionTest' && user && (
          <ExecutiveFunctionTestScreen token={user.token} onNavigate={setScreen} />
        )}
        {screen === 'testHistoryDetail' && user && selectedPatient && selectedCategory && (
          <TestHistoryDetailScreen
            token={user.token}
            patient={selectedPatient}
            category={selectedCategory}
            onNavigate={setScreen}
          />
        )}
        {screen === 'myHistory' && user && (
          <MyHistoryScreen onNavigate={setScreen} onSelectCategory={handleSelectMyCategory} />
        )}
        {screen === 'myTestHistoryDetail' && user && selectedMyCategory && (
          <MyTestHistoryDetailScreen
            token={user.token}
            category={selectedMyCategory}
            onNavigate={setScreen}
          />
        )}
        {screen === 'sleepLog' && user && (
          <SleepLogScreen token={user.token} onNavigate={setScreen} />
        )}
        {screen === 'weightLog' && user && (
          <WeightLogScreen token={user.token} onNavigate={setScreen} />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
});