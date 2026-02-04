import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import ResidenceTasksScreen from '../screens/ResidenceTasksScreen';
import MOHREInquiryScreen from '../screens/MOHREInquiryScreen';

export default function MOHRENavigator() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'inquiry'>('tasks');

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tasks' && styles.activeTab]}
          onPress={() => setActiveTab('tasks')}
        >
          <Text style={[styles.tabText, activeTab === 'tasks' && styles.activeTabText]}>
            Tasks
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'inquiry' && styles.activeTab]}
          onPress={() => setActiveTab('inquiry')}
        >
          <Text style={[styles.tabText, activeTab === 'inquiry' && styles.activeTabText]}>
            Inquiry
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        {activeTab === 'tasks' && <ResidenceTasksScreen />}
        {activeTab === 'inquiry' && <MOHREInquiryScreen />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#111111',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#dc2626',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111111',
  },
  activeTabText: {
    color: '#dc2626',
  },
  content: {
    flex: 1,
  },
});
