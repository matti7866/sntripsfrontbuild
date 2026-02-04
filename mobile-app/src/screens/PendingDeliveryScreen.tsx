import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { eidService } from '../services/eidService';
import type { ResidenceTask } from '../types';
import MarkReceivedModal from '../components/MarkReceivedModal';

export default function PendingDeliveryScreen() {
  const [tasks, setTasks] = useState<ResidenceTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<ResidenceTask[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ResidenceTask | null>(null);
  const [showModal, setShowModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [])
  );

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await eidService.getEIDTasks('pending');
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

  const handleMarkReceived = (task: ResidenceTask) => {
    setSelectedTask(task);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedTask(null);
  };

  const handleSuccess = () => {
    setShowModal(false);
    setSelectedTask(null);
    loadTasks();
  };

  const renderTask = ({ item }: { item: ResidenceTask }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <View style={styles.taskIdBadge}>
          <Text style={styles.taskIdText}>#{item.residenceID}</Text>
        </View>
        {item.type && (
          <View style={[styles.typeBadge, item.type === 'ML' ? styles.typeML : styles.typeFZ]}>
            <Text style={styles.typeText}>{item.type}</Text>
          </View>
        )}
      </View>

      <View style={styles.taskBody}>
        <View style={styles.infoRow}>
          <Ionicons name="person" size={16} color="#111111" />
          <Text style={styles.infoLabel}>Passenger:</Text>
          <Text style={styles.infoValue}>{item.passenger_name}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="business" size={16} color="#111111" />
          <Text style={styles.infoLabel}>Customer:</Text>
          <Text style={styles.infoValue}>{item.customer_name || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="card" size={16} color="#111111" />
          <Text style={styles.infoLabel}>Passport:</Text>
          <Text style={styles.infoValue}>{item.passportNumber}</Text>
        </View>

        {item.EmiratesIDNumber && (
          <View style={styles.infoRow}>
            <Ionicons name="id-card" size={16} color="#111111" />
            <Text style={styles.infoLabel}>EID:</Text>
            <Text style={styles.infoValue}>{item.EmiratesIDNumber}</Text>
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

      <TouchableOpacity style={styles.actionButton} onPress={() => handleMarkReceived(item)}>
        <Ionicons name="download-outline" size={20} color="#ffffff" />
        <Text style={styles.actionButtonText}>Mark as Received</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="checkmark-done-circle-outline" size={64} color="#333333" />
      <Text style={styles.emptyText}>No pending deliveries</Text>
      <Text style={styles.emptySubtext}>All Emirates IDs have been received</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#dc2626" />
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pending Delivery</Text>
        <Text style={styles.headerSubtitle}>
          {filteredTasks.length} of {tasks.length} task(s)
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#111111" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, passport, EID..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#333333"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={20} color="#111111" />
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

      {selectedTask && (
        <MarkReceivedModal
          visible={showModal}
          task={selectedTask}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#111111',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#111111',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#111111',
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
    borderColor: '#111111',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
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
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  taskIdText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#991b1b',
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  typeML: {
    backgroundColor: '#dcfce7',
  },
  typeFZ: {
    backgroundColor: '#fee2e2',
  },
  typeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
  },
  taskBody: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#111111',
    marginLeft: 8,
    marginRight: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#000000',
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
  actionButton: {
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
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
    color: '#000000',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#111111',
    marginTop: 8,
  },
});

