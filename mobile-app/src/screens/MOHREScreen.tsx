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
import { api } from '../services/api';

interface MOHRETask {
  residenceID: number;
  passenger_name: string;
  passportNumber: string;
  customer_name?: string;
  company_name?: string;
  company_number?: string;
  countryName?: string;
  nationality?: string;
  dob?: string;
  gender?: string;
  position?: string;
  salary?: number;
  sale_price?: number;
  paid_amount?: number;
  remaining_balance?: number;
  completedStep?: number;
  mb_number?: string;
  mohreStatus?: string;
}

export default function MOHREScreen() {
  const [tasks, setTasks] = useState<MOHRETask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<MOHRETask[]>([]);
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
      // Fetch MOHRE step 1a tasks from your API
      const response = await api.get<any>('/residence/tasks.php?step=1a');
      
      console.log('MOHRE API Response:', JSON.stringify(response, null, 2));
      
      // The API returns data in 'residences' field (not 'tasks')
      let tasksList: MOHRETask[] = [];
      
      if (response.residences) {
        tasksList = response.residences;
      } else if (response.data?.residences) {
        tasksList = response.data.residences;
      } else if (Array.isArray(response.data)) {
        tasksList = response.data;
      } else if (Array.isArray(response)) {
        tasksList = response;
      }
      
      console.log('Extracted MOHRE tasks count:', tasksList.length);
      console.log('First task:', tasksList[0]);
      
      setTasks(tasksList);
      setFilteredTasks(tasksList);
    } catch (error: any) {
      console.error('MOHRE API Error:', error);
      Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to load MOHRE tasks');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
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
        task.company_name?.toLowerCase().includes(lowercaseQuery) ||
        task.residenceID?.toString().includes(query)
      );
    });
    setFilteredTasks(filtered);
  };

  const renderTask = ({ item }: { item: MOHRETask }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <View style={styles.taskIdBadge}>
          <Text style={styles.taskIdText}>#{item.residenceID}</Text>
        </View>
        <View style={styles.stepBadge}>
          <Text style={styles.stepText}>Step 1A</Text>
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
          <Text style={styles.infoLabel}>Company:</Text>
          <Text style={styles.infoValue}>
            {item.company_name || 'N/A'}
            {item.company_number && ` - ${item.company_number}`}
          </Text>
        </View>

        {item.mb_number && (
          <View style={styles.infoRow}>
            <Ionicons name="barcode" size={16} color="#6b7280" />
            <Text style={styles.infoLabel}>MB Number:</Text>
            <Text style={styles.infoValue}>{item.mb_number}</Text>
          </View>
        )}

        {item.mohreStatus && (
          <View style={[styles.infoRow, styles.mohreStatusRow]}>
            <Ionicons 
              name={item.mb_number ? "checkmark-circle" : "alert-circle"} 
              size={16} 
              color={item.mb_number ? "#16a34a" : "#dc2626"} 
            />
            <Text style={styles.infoLabel}>MOHRE Status:</Text>
            <Text style={[
              styles.infoValue, 
              styles.mohreStatusText,
              !item.mb_number && styles.mohreStatusWarning
            ]}>
              {item.mb_number ? item.mohreStatus : 'Provide MB Number'}
            </Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Ionicons name="card" size={16} color="#6b7280" />
          <Text style={styles.infoLabel}>Passport:</Text>
          <Text style={styles.infoValue}>{item.passportNumber}</Text>
        </View>

        {item.position && (
          <View style={styles.infoRow}>
            <Ionicons name="briefcase" size={16} color="#6b7280" />
            <Text style={styles.infoLabel}>Position:</Text>
            <Text style={styles.infoValue}>{item.position}</Text>
          </View>
        )}

        {item.salary && item.salary > 0 && (
          <View style={styles.infoRow}>
            <Ionicons name="wallet" size={16} color="#6b7280" />
            <Text style={styles.infoLabel}>Salary:</Text>
            <Text style={styles.infoValue}>{item.salary.toLocaleString()} AED</Text>
          </View>
        )}

        {item.completedStep !== undefined && (
          <View style={styles.infoRow}>
            <Ionicons name="layers" size={16} color="#6b7280" />
            <Text style={styles.infoLabel}>Step:</Text>
            <Text style={styles.infoValue}>{item.completedStep}</Text>
          </View>
        )}

        {item.remaining_balance !== undefined && item.remaining_balance > 0 && (
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
      <Ionicons name="document-text-outline" size={64} color="#9ca3af" />
      <Text style={styles.emptyText}>No MOHRE tasks</Text>
      <Text style={styles.emptySubtext}>Step 1A tasks will appear here</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading MOHRE tasks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MOHRE - Step 1A</Text>
        <Text style={styles.headerSubtitle}>
          {filteredTasks.length} of {tasks.length} task(s)
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, passport, company..."
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
        keyExtractor={(item) => item.residenceID.toString()}
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
  stepBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  stepText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#92400e',
  },
  taskBody: {
    marginBottom: 0,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
  mohreStatusRow: {
    backgroundColor: '#f0fdf4',
    padding: 8,
    borderRadius: 6,
    marginVertical: 4,
  },
  mohreStatusText: {
    fontWeight: '600',
    color: '#16a34a',
  },
  mohreStatusWarning: {
    color: '#dc2626',
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

