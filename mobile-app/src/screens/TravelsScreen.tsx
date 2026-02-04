import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import travelService from '../services/travelService';
import type { UpcomingTravel } from '../types';
import { useAuth } from '../context/AuthContext';
import { format, isAfter, parseISO } from 'date-fns';

const TravelsScreen: React.FC = () => {
  const { user } = useAuth();
  const [travels, setTravels] = useState<UpcomingTravel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTravels();
  }, []);

  const loadTravels = async () => {
    try {
      // Development: Using customer_id 558
      const customerId = (user as any)?.customer_id || 558;
      const data = await travelService.getUpcomingTravels(customerId);
      setTravels(data);
    } catch (error) {
      console.error('Error loading travels:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTravels();
  };

  const getDaysUntilTravel = (travelDate: string): number => {
    try {
      const date = new Date(travelDate.replace(',', ''));
      const today = new Date();
      const diffTime = date.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 ? diffDays : 0;
    } catch {
      return 0;
    }
  };

  const renderTravel = ({ item }: { item: UpcomingTravel }) => {
    const travelDate = new Date(item.date_of_travel.replace(',', ''));
    const daysUntil = getDaysUntilTravel(item.date_of_travel);
    const isSoon = daysUntil <= 7 && daysUntil > 0;

    return (
      <View style={[styles.travelCard, isSoon && styles.soonTravel]}>
        <View style={styles.travelHeader}>
          <View style={styles.route}>
            <View style={styles.airportContainer}>
              <Text style={styles.airportCode}>{item.from_place}</Text>
              <Text style={styles.airportLabel}>From</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
            <View style={styles.airportContainer}>
              <Text style={styles.airportCode}>{item.to_place}</Text>
              <Text style={styles.airportLabel}>To</Text>
            </View>
          </View>
          {isSoon && (
            <View style={styles.soonBadge}>
              <Text style={styles.soonBadgeText}>Soon</Text>
            </View>
          )}
        </View>

        <View style={styles.travelBody}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Passenger:</Text>
            <Text style={styles.infoValue}>{item.passenger_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>PNR:</Text>
            <Text style={styles.infoValue}>{item.Pnr}</Text>
          </View>
          {item.ticketNumber && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ticket:</Text>
              <Text style={styles.infoValue}>{item.ticketNumber}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Travel Date:</Text>
            <Text style={styles.infoValue}>
              {format(travelDate, 'MMM dd, yyyy')}
            </Text>
          </View>
          {item.return_date && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Return Date:</Text>
              <Text style={styles.infoValue}>
                {format(new Date(item.return_date.replace(',', '')), 'MMM dd, yyyy')}
              </Text>
            </View>
          )}
          {item.flight_number && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Flight:</Text>
              <Text style={styles.infoValue}>{item.flight_number}</Text>
            </View>
          )}
          {item.departure_time && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Departure:</Text>
              <Text style={styles.infoValue}>{item.departure_time}</Text>
            </View>
          )}
          <View style={styles.daysContainer}>
            <Text style={styles.daysLabel}>
              {daysUntil === 0
                ? 'Today'
                : daysUntil === 1
                ? 'Tomorrow'
                : `${daysUntil} days until travel`}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Upcoming Travels</Text>
        <Text style={styles.subtitle}>{travels.length} upcoming trip(s)</Text>
      </View>

      <FlatList
        data={travels}
        renderItem={renderTravel}
        keyExtractor={(item) => item.ticket.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 64, marginBottom: 20 }}>✈️</Text>
            <Text style={styles.emptyText}>No upcoming travels</Text>
            <Text style={{ fontSize: 14, color: '#111', marginTop: 10, textAlign: 'center' }}>
              Your flight bookings will appear here
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 25,
    backgroundColor: '#dc2626',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  travelCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  soonTravel: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  travelHeader: {
    marginBottom: 15,
  },
  route: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  airportContainer: {
    flex: 1,
    alignItems: 'center',
  },
  airportCode: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 5,
  },
  airportLabel: {
    fontSize: 12,
    color: '#111',
  },
  arrow: {
    fontSize: 24,
    color: '#111',
    marginHorizontal: 10,
  },
  soonBadge: {
    alignSelf: 'flex-end',
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  soonBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  travelBody: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 15,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 14,
    color: '#000',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  daysContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'center',
  },
  daysLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#000',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default TravelsScreen;

