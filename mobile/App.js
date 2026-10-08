import { useState, useEffect, useRef, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, BackHandler, View } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

import DashboardScreen from './src/screens/DashboardScreen';
import QuestionnaireScreen from './src/screens/QuestionnaireScreen';
import LandingScreen from './src/screens/LandingScreen';
import SplashScreen from './src/screens/SplashScreen';
import DoctorSignupScreen from './src/screens/DoctorSignupScreen';
import PatientSignupScreen from './src/screens/PatientSignupScreen';
import LoginScreen from './src/screens/LoginScreen';
import ActivityScreen from './src/screens/ActivityScreen';
import MemoryTestScreen from './src/screens/MemoryTestScreen';
import AttentionTestScreen from './src/screens/AttentionTestScreen';
import VisualMemoryTestScreen from './src/screens/VisualMemoryTestScreen';
import PatientDetailScreen from './src/screens/PatientDetailScreen';
import PatientMoodHistoryScreen from './src/screens/PatientMoodHistoryScreen';
import ProcessingSpeedTestScreen from './src/screens/ProcessingSpeedTestScreen';
import ExecutiveFunctionTestScreen from './src/screens/ExecutiveFunctionTestScreen';
import TestHistoryDetailScreen from './src/screens/TestHistoryDetailScreen';
import MyHistoryScreen from './src/screens/MyHistoryScreen';
import MyTestHistoryDetailScreen from './src/screens/MyTestHistoryDetailScreen';
import SleepLogScreen from './src/screens/SleepLogScreen';
import WeightLogScreen from './src/screens/WeightLogScreen';
import PatientListScreen from './src/screens/PatientListScreen';
import MedicineScreen from './src/screens/MedicineScreen';
import MoodCheckInScreen from './src/screens/MoodCheckInScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ActivityBuilderScreen from './src/screens/ActivityBuilderScreen';
import BottomTabBar from './src/components/BottomTabBar';

// Screens that show the persistent bottom tab bar (patients only).
// Anything not in this list (tests, camera, log detail, etc.) is a
// drill-down screen and covers the full screen without the tab bar,
// which is the standard pattern for tab + stack navigation.
const TAB_SCREENS = ['dashboard', 'activityBuilder', 'myHistory', 'profile'];

export default function App() {
  const [screenStack, setScreenStack] = useState(['splash']);
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

  const screenRef = useRef(screen);
  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const current = screenRef.current;
      if (current === 'landing' || current === 'dashboard') {
        return false;
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
    // Mood check-ins have a different shape (emotion comparison + shared
    // notes) from the single-numeric-score categories, so they get their
    // own screen instead of the generic TestHistoryDetailScreen.
    navigate(category === 'mood' ? 'patientMoodHistory' : 'testHistoryDetail');
  }

  function handleSelectMyCategory(category) {
    setSelectedMyCategory(category);
    navigate('myTestHistoryDetail');
  }

  // Switching tabs resets the stack to that tab's screen, so the back
  // button doesn't wander through screens from a different tab.
  function handleTabPress(tabKey) {
    if (tabKey !== screen) {
      resetTo(tabKey);
    }
  }

  const showTabBar = user && user.role === 'patient' && TAB_SCREENS.includes(screen);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="auto" />
        <View style={styles.screenArea}>
          {screen === 'splash' && <SplashScreen onFinish={() => resetTo('landing')} />}
          {screen === 'landing' && <LandingScreen onNavigate={navigate} />}
          {screen === 'doctorSignup' && <DoctorSignupScreen onNavigate={navigate} onBack={goBack} onAuth={handleAuth} />}
          {screen === 'patientSignup' && <PatientSignupScreen onNavigate={navigate} onBack={goBack} onAuth={handleAuth} />}
          {screen === 'login' && <LoginScreen onNavigate={navigate} onBack={goBack} onAuth={handleAuth} />}
          {screen === 'dashboard' && user && (
            <DashboardScreen user={user} onLogout={handleLogout} onNavigate={navigate} />
          )}
          {screen === 'profile' && user && (
            <ProfileScreen user={user} onLogout={handleLogout} onNavigate={navigate} />
          )}
          {screen === 'activityBuilder' && user && (
            <ActivityBuilderScreen user={user} onNavigate={navigate} />
          )}
          {screen === 'patientList' && user && (
            <PatientListScreen token={user.token} onNavigate={navigate} onBack={goBack} onSelectPatient={handleSelectPatient} />
          )}
          {screen === 'questionnaire' && user && (
            <QuestionnaireScreen token={user.token} onNavigate={navigate} onBack={goBack} onSubmitted={goBack} />
          )}
          {screen === 'moodCheckIn' && user && (
            <MoodCheckInScreen token={user.token} onBack={goBack} onSubmitted={goBack} />
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
          {screen === 'patientMoodHistory' && user && selectedPatient && (
            <PatientMoodHistoryScreen token={user.token} patient={selectedPatient} onBack={goBack} />
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
          {screen === 'medicineReminders' && user && (
            <MedicineScreen token={user.token} onNavigate={navigate} onBack={goBack} />
          )}
        </View>

        {showTabBar && <BottomTabBar activeTab={screen} onTabPress={handleTabPress} />}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  screenArea: { flex: 1 },
});