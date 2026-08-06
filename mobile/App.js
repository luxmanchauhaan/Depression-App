import { useState, useEffect, useRef, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, BackHandler } from 'react-native';
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
  const [screenStack, setScreenStack] = useState(['landing']);
  const screen = screenStack[screenStack.length - 1];

  const [user, setUser] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedMyCategory, setSelectedMyCategory] = useState(null);

  const navigate = useCallback((next) => {
    setScreenStack((prev) => [...prev, next]);
  }, []);

  const goBack = useCallback(() => {
    setScreenStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const resetTo = useCallback((next) => {
    setScreenStack([next]);
  }, []);

  // Hardware / gesture back: on the main dashboard (or the landing screen,
  // before login) this exits the app. On any other screen, it goes back one
  // step. Uses a ref for the current screen name so the listener only needs
  // to be registered ONCE, avoiding stale duplicate listeners from Fast Refresh.
  const screenRef = useRef(screen);
  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const current = screenRef.current;
      if (current === 'landing' || current === 'dashboard') {
        return false; // let the OS exit the app
      }
      goBack();
      return true;
    });
    return () => sub.remove();
  }, [goBack]);

  function handleAuth(authResult) {
    setUser(authResult);
    resetTo('dashboard');
  }

  function handleLogout() {
    setUser(null);
    resetTo('landing');
  }

  function handleSelectPatient(patient) {
    setSelectedPatient(patient);
    navigate('patientDetail');
  }

  function handleSelectCategory(category) {
    setSelectedCategory(category);
    navigate('testHistoryDetail');
  }

  function handleSelectMyCategory(category) {
    setSelectedMyCategory(category);
    navigate('myTestHistoryDetail');
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="auto" />
        {screen === 'landing' && <LandingScreen onNavigate={navigate} />}
        {screen === 'doctorSignup' && <DoctorSignupScreen onNavigate={navigate} onBack={goBack} onAuth={handleAuth} />}
        {screen === 'patientSignup' && <PatientSignupScreen onNavigate={navigate} onBack={goBack} onAuth={handleAuth} />}
        {screen === 'login' && <LoginScreen onNavigate={navigate} onBack={goBack} onAuth={handleAuth} />}
        {screen === 'dashboard' && user && (
          <DashboardScreen user={user} onLogout={handleLogout} onNavigate={navigate} />
        )}
        {screen === 'patientList' && user && (
          <PatientListScreen token={user.token} onNavigate={navigate} onBack={goBack} onSelectPatient={handleSelectPatient} />
        )}
        {screen === 'questionnaire' && user && (
          <QuestionnaireScreen token={user.token} onNavigate={navigate} onBack={goBack} onSubmitted={goBack} />
        )}
        {screen === 'activities' && user && (
          <ActivityScreen token={user.token} onNavigate={navigate} onBack={goBack} />
        )}
        {screen === 'memoryTest' && user && (
          <MemoryTestScreen token={user.token} onNavigate={navigate} onBack={goBack} />
        )}
        {screen === 'attentionTest' && user && (
          <AttentionTestScreen token={user.token} onNavigate={navigate} onBack={goBack} />
        )}
        {screen === 'visualMemoryTest' && user && (
          <VisualMemoryTestScreen token={user.token} onNavigate={navigate} onBack={goBack} />
        )}
        {screen === 'patientDetail' && user && selectedPatient && (
          <PatientDetailScreen token={user.token} patient={selectedPatient} onNavigate={navigate} onBack={goBack} onSelectCategory={handleSelectCategory} />
        )}
        {screen === 'processingSpeedTest' && user && (
          <ProcessingSpeedTestScreen token={user.token} onNavigate={navigate} onBack={goBack} />
        )}
        {screen === 'executiveFunctionTest' && user && (
          <ExecutiveFunctionTestScreen token={user.token} onNavigate={navigate} onBack={goBack} />
        )}
        {screen === 'testHistoryDetail' && user && selectedPatient && selectedCategory && (
          <TestHistoryDetailScreen token={user.token} patient={selectedPatient} category={selectedCategory} onNavigate={navigate} onBack={goBack} />
        )}
        {screen === 'myHistory' && user && (
          <MyHistoryScreen onNavigate={navigate} onBack={goBack} onSelectCategory={handleSelectMyCategory} />
        )}
        {screen === 'myTestHistoryDetail' && user && selectedMyCategory && (
          <MyTestHistoryDetailScreen token={user.token} category={selectedMyCategory} onNavigate={navigate} onBack={goBack} />
        )}
        {screen === 'sleepLog' && user && (
          <SleepLogScreen token={user.token} onNavigate={navigate} onBack={goBack} />
        )}
        {screen === 'weightLog' && user && (
          <WeightLogScreen token={user.token} onNavigate={navigate} onBack={goBack} />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
});