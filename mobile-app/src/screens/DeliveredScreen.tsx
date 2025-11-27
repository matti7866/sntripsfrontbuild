import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { eidService } from '../services/eidService';
import type { ResidenceTask } from '../types';

export default function DeliveredScreen() {
  const [tasks, setTasks] = useState<ResidenceTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<ResidenceTask[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [])
  );

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await eidService.getEIDTasks('delivered');
      setTasks(data.tasks || []);
      setFilteredTasks(data.tasks || []);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredTasks(tasks);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    const filtered = tasks.filter((task) => {
      return (
        task.passenger_name?.toLowerCase().includes(lowercaseQuery) ||
        task.customer_name?.toLowerCase().includes(lowercaseQuery) ||
        task.passportNumber?.toLowerCase().includes(lowercaseQuery) ||
        task.EmiratesIDNumber?.toLowerCase().includes(lowercaseQuery) ||
        task.residenceID?.toString().includes(query)
      );
    });
    setFilteredTasks(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const renderTask = ({ item }: { item: ResidenceTask }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <View style={styles.taskIdBadge}>
          <Text style={styles.taskIdText}>#{item.residenceID}</Text>
        </View>
        <View style={styles.deliveredBadge}>
          <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
          <Text style={styles.deliveredText}>Delivered</Text>
        </View>
      </View>

      <View style={styles.taskBody}>
        <View style={styles.infoRow}>
          <Ionicons name="person" size={16} color="#6b7280" />
          <Text style={styles.infoLabel}>Passenger:</Text>
          <Text style={styles.infoValue}>{item.passenger_name}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="business" size={16} color="#6b7280" />
          <Text style={styles.infoLabel}>Customer:</Text>
          <Text style={styles.infoValue}>{item.customer_name || 'N/A'}</Text>
        </View>

        {item.EmiratesIDNumber && (
          <View style={styles.infoRow}>
            <Ionicons name="id-card" size={16} color="#6b7280" />
            <Text style={styles.infoLabel}>EID:</Text>
            <Text style={styles.infoValue}>{item.EmiratesIDNumber}</Text>
          </View>
        )}

        {item.eid_delivered_datetime && (
          <View style={[styles.infoRow, styles.highlightRow]}>
            <Ionicons name="calendar" size={16} color="#16a34a" />
            <Text style={styles.infoLabel}>Delivered:</Text>
            <Text style={styles.infoValue}>
              {new Date(item.eid_delivered_datetime).toLocaleDateString()}
            </Text>
          </View>
        )}

        {item.type && (
          <View style={styles.infoRow}>
            <Ionicons name="layers" size={16} color="#6b7280" />
            <Text style={styles.infoLabel}>Type:</Text>
            <Text style={styles.infoValue}>{item.type}</Text>
          </View>
        )}

        {item.remaining_balance > 0 && (
          <View style={[styles.infoRow, styles.balanceRow]}>
            <Ionicons name="cash" size={16} color="#dc2626" />
            <Text style={styles.infoLabel}>Balance:</Text>
            <Text style={styles.balanceValue}>
              {item.remaining_balance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="archive-outline" size={64} color="#9ca3af" />
      <Text style={styles.emptyText}>No delivered Emirates IDs</Text>
      <Text style={styles.emptySubtext}>Completed deliveries will appear here</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Delivered</Text>
        <Text style={styles.headerSubtitle}>
          {filteredTasks.length} of {tasks.length} completed delivery(s)
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, passport, EID..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#9ca3af"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={20} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredTasks}
        renderItem={renderTask}
        keyExtractor={(item) => `${item.type}-${item.residenceID}`}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={renderEmpty}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskIdBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  taskIdText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  deliveredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  deliveredText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  taskBody: {
    marginBottom: 0,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  highlightRow: {
    backgroundColor: '#f0fdf4',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    marginRight: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
  },
  balanceRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#fee2e2',
  },
  balanceValue: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: 'bold',
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
});

