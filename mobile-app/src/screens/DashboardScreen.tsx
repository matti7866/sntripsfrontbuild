import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../services/api';

interface DashboardStats {
  Todays_Ticket?: number;
  ticket_profit?: number;
  Todays_Visa?: number;
  Visa_Profit?: number;
  Today_Expenses?: number;
  Todays_residences?: number;
  residence_profit?: number;
  Todays_Profit?: number;
  Todays_Revenue?: number;
}

interface DailyEntry {
  EntryType: string;
  customer_name: string;
  passenger_name: string;
  Details: string;
  datetime: string;
  staff_name: string;
}

interface CalendarEvent {
  date: string;
  title: string;
  type: 'cheque' | 'flight' | 'custom';
}

export default function DashboardScreen() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dailyEntries, setDailyEntries] = useState<DailyEntry[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllEntries, setShowAllEntries] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get today's date for filtering
      const today = new Date().toISOString().split('T')[0];
      
      const [statsResponse, entriesResponse, chequesResponse, flightsResponse] = await Promise.all([
        api.get<any>('/dashboard/todayStats.php'),
        api.get<any>('/dashboard/dailyEntries.php', { params: { fromDate: today, toDate: today } }),
        api.get<any>('/calendar/cheques.php').catch(() => ({ cheques: [] })),
        api.get<any>('/calendar/flights.php').catch(() => ({ flights: [] })),
      ]);
      
      // Extract stats
      const { success, message, ...statsData } = statsResponse;
      setStats(statsData);
      
      // Extract daily entries
      let entries: DailyEntry[] = [];
      if (entriesResponse.data) {
        if (Array.isArray(entriesResponse.data)) {
          entries = entriesResponse.data;
        } else {
          entries = Object.values(entriesResponse.data);
        }
      } else if (Array.isArray(entriesResponse)) {
        entries = entriesResponse;
      }
      setDailyEntries(entries);
      
      // Extract calendar events
      const events: CalendarEvent[] = [];
      const cheques = chequesResponse.cheques || [];
      const flights = flightsResponse.flights || [];
      
      cheques.slice(0, 5).forEach((cheque: any) => {
        events.push({
          date: cheque.date,
          title: `Cheque: ${cheque.payee} - د.إ${Number(cheque.amount).toLocaleString()}`,
          type: 'cheque',
        });
      });
      
      flights.slice(0, 5).forEach((flight: any) => {
        events.push({
          date: flight.date_of_travel,
          title: `Flight: ${flight.from_place} → ${flight.to_place}`,
          type: 'flight',
        });
      });
      
      setUpcomingEvents(events);
      
    } catch (error: any) {
      console.error('Dashboard error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No data available</Text>
      </View>
    );
  }

  const formatCurrency = (value?: number) => {
    return (value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Welcome Header */}
      <LinearGradient colors={['#2563eb', '#1d4ed8']} style={styles.welcomeCard}>
        <Ionicons name="stats-chart" size={40} color="#ffffff" />
        <Text style={styles.welcomeTitle}>Dashboard</Text>
        <Text style={styles.welcomeSubtitle}>Today's Statistics</Text>
      </LinearGradient>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {/* Tickets Card */}
        <View style={[styles.statCard, styles.ticketsCard]}>
          <View style={styles.statIconContainer}>
            <Ionicons name="airplane" size={24} color="#3b82f6" />
          </View>
          <Text style={styles.statNumber}>{stats.Todays_Ticket || 0}</Text>
          <Text style={styles.statLabel}>Tickets</Text>
          <Text style={styles.statDesc}>د.إ {formatCurrency(stats.ticket_profit)}</Text>
        </View>

        {/* Visas Card */}
        <View style={[styles.statCard, styles.visasCard]}>
          <View style={styles.statIconContainer}>
            <Ionicons name="card" size={24} color="#10b981" />
          </View>
          <Text style={styles.statNumber}>{stats.Todays_Visa || 0}</Text>
          <Text style={styles.statLabel}>Visas</Text>
          <Text style={styles.statDesc}>د.إ {formatCurrency(stats.Visa_Profit)}</Text>
        </View>

        {/* Expenses Card */}
        <View style={[styles.statCard, styles.expensesCard]}>
          <View style={styles.statIconContainer}>
            <Ionicons name="wallet" size={24} color="#ef4444" />
          </View>
          <Text style={styles.statNumber}>د.إ {formatCurrency(stats.Today_Expenses)}</Text>
          <Text style={styles.statLabel}>Expenses</Text>
          <Text style={styles.statDesc}>Today</Text>
        </View>

        {/* Residence Card */}
        <View style={[styles.statCard, styles.residenceCard]}>
          <View style={styles.statIconContainer}>
            <Ionicons name="id-card" size={24} color="#f59e0b" />
          </View>
          <Text style={styles.statNumber}>{stats.Todays_residences || 0}</Text>
          <Text style={styles.statLabel}>Residence</Text>
          <Text style={styles.statDesc}>د.إ {formatCurrency(stats.residence_profit)}</Text>
        </View>
      </View>

      {/* Profit & Revenue Summary */}
      <View style={styles.balanceCard}>
        <LinearGradient
          colors={['#16a34a', '#15803d']}
          style={styles.balanceGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.balanceContent}>
            <Ionicons name="trending-up" size={32} color="#ffffff" />
            <View style={styles.balanceText}>
              <Text style={styles.balanceLabel}>Today's Profit</Text>
              <Text style={styles.balanceAmount}>د.إ {formatCurrency(stats.Todays_Profit)}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.balanceCard}>
        <LinearGradient
          colors={['#2563eb', '#1d4ed8']}
          style={styles.balanceGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.balanceContent}>
            <Ionicons name="cash" size={32} color="#ffffff" />
            <View style={styles.balanceText}>
              <Text style={styles.balanceLabel}>Today's Revenue</Text>
              <Text style={styles.balanceAmount}>د.إ {formatCurrency(stats.Todays_Revenue)}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Today's Entries */}
      {dailyEntries.length > 0 && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list" size={20} color="#1f2937" />
            <Text style={styles.sectionTitle}>Today's Activities ({dailyEntries.length})</Text>
          </View>
          {(showAllEntries ? dailyEntries : dailyEntries.slice(0, 5)).map((entry, index) => (
            <View key={index} style={styles.entryItem}>
              <View style={styles.entryHeader}>
                <View style={styles.entryTypeBadge}>
                  <Text style={styles.entryTypeText}>{entry.EntryType}</Text>
                </View>
                <Text style={styles.entryTime}>{formatDateTime(entry.datetime)}</Text>
              </View>
              <Text style={styles.entryPassenger}>{entry.passenger_name}</Text>
              <Text style={styles.entryCustomer}>{entry.customer_name}</Text>
              <Text style={styles.entryStaff} numberOfLines={1}>By: {entry.staff_name}</Text>
            </View>
          ))}
          {dailyEntries.length > 5 && (
            <TouchableOpacity 
              style={styles.showMoreButton}
              onPress={() => setShowAllEntries(!showAllEntries)}
            >
              <Text style={styles.showMoreText}>
                {showAllEntries ? 'Show Less' : `Show ${dailyEntries.length - 5} More`}
              </Text>
              <Ionicons 
                name={showAllEntries ? "chevron-up" : "chevron-down"} 
                size={16} 
                color="#2563eb" 
              />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar" size={20} color="#1f2937" />
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
          </View>
          {upcomingEvents.map((event, index) => (
            <View key={index} style={styles.eventItem}>
              <View style={[
                styles.eventIcon,
                event.type === 'cheque' ? styles.chequeIcon :
                event.type === 'flight' ? styles.flightIcon : styles.customIcon
              ]}>
                <Ionicons 
                  name={
                    event.type === 'cheque' ? 'wallet' :
                    event.type === 'flight' ? 'airplane' : 'calendar'
                  } 
                  size={16} 
                  color="#ffffff" 
                />
              </View>
              <View style={styles.eventContent}>
                <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
                <Text style={styles.eventDate}>{formatDate(event.date)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: 16,
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
  welcomeCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 12,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#e0e7ff',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ticketsCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  visasCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  expensesCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  residenceCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 2,
  },
  statDesc: {
    fontSize: 11,
    color: '#9ca3af',
  },
  balanceCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceGradient: {
    padding: 20,
  },
  balanceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  balanceText: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 13,
    color: '#fca5a5',
    marginBottom: 4,
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  sectionCard: {
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  entryItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  entryTypeBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  entryTypeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  entryTime: {
    fontSize: 11,
    color: '#6b7280',
  },
  entryPassenger: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  entryCustomer: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 2,
  },
  entryStaff: {
    fontSize: 11,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    marginTop: 8,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 12,
  },
  eventIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chequeIcon: {
    backgroundColor: '#f59e0b',
  },
  flightIcon: {
    backgroundColor: '#3b82f6',
  },
  customIcon: {
    backgroundColor: '#8b5cf6',
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  eventDate: {
    fontSize: 11,
    color: '#6b7280',
  },
});
