// Simple test to verify React Native is working
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function TestApp() {
  const [count, setCount] = React.useState(0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SNT Customer App</Text>
      <Text style={styles.subtitle}>Test Mode</Text>
      <Text style={styles.count}>Count: {count}</Text>
      <TouchableOpacity 
        style={styles.button}
        onPress={() => setCount(count + 1)}
      >
        <Text style={styles.buttonText}>Tap Me</Text>
      </TouchableOpacity>
      <Text style={styles.info}>
        If you can see this and tap the button, React Native is working! ✅
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#000',
    marginBottom: 30,
  },
  count: {
    fontSize: 24,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  info: {
    fontSize: 14,
    color: '#111',
    textAlign: 'center',
    marginTop: 20,
  },
});


