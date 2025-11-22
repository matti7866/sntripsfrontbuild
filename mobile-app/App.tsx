// Simple test version - Remove "test-" prefix below to use full app
// import App from './test-app';
// export default App;

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import AppNavigator from './src/navigation/AppNavigator';

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  
  console.log('AppContent render:', { isAuthenticated, loading });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    console.log('Rendering LoginScreen');
    return <LoginScreen />;
  }

  console.log('Rendering AppNavigator');
  return <AppNavigator />;
};

const App: React.FC = () => {
  console.log('App render');
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AppContent />
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#667eea',
  },
});

export default App;

