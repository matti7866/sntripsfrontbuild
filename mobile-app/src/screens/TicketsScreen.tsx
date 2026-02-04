import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import ticketService from '../services/ticketService';
import type { Ticket } from '../types';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import API_CONFIG from '../config/api';

const TicketsScreen: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      // Development: Using customer_id 558
      const customerId = (user as any)?.customer_id || 558;
      console.log('Loading tickets for customer:', customerId);
      const data = await ticketService.getCustomerTickets(customerId);
      console.log('Tickets loaded:', data?.length || 0);
      setTickets(data || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
      // Don't show error alert for empty results
      setTickets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTickets();
  };

  const handleViewTicket = async (ticket: Ticket) => {
    if (!ticket.ticketCopy) {
      Alert.alert('Info', 'No ticket copy available');
      return;
    }

    try {
      const fileUri = `${API_CONFIG.baseURL.replace('/api', '')}${ticket.ticketCopy}`;
      const downloadPath = `${FileSystem.documentDirectory}${ticket.ticketNumber || 'ticket'}.pdf`;
      
      const downloadResult = await FileSystem.downloadAsync(fileUri, downloadPath);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadResult.uri);
      } else {
        Alert.alert('Info', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error viewing ticket:', error);
      Alert.alert('Error', 'Failed to open ticket copy');
    }
  };

  const renderTicket = ({ item }: { item: Ticket }) => {
    const travelDate = new Date(item.date_of_travel);
    const isUpcoming = travelDate >= new Date();

    return (
      <TouchableOpacity
        style={[styles.ticketCard, isUpcoming && styles.upcomingTicket]}
        onPress={() => handleViewTicket(item)}
      >
        <View style={styles.ticketHeader}>
          <View>
            <Text style={styles.pnrText}>PNR: {item.Pnr}</Text>
            {item.ticketNumber && (
              <Text style={styles.ticketNumber}>Ticket: {item.ticketNumber}</Text>
            )}
          </View>
          {item.ticketCopy && (
            <View style={styles.copyBadge}>
              <Text style={styles.copyBadgeText}>📄 Copy</Text>
            </View>
          )}
        </View>

        <View style={styles.ticketBody}>
          <View style={styles.route}>
            <Text style={styles.airportCode}>{item.from_code || 'N/A'}</Text>
            <Text style={styles.arrow}>→</Text>
            <Text style={styles.airportCode}>{item.to_code || 'N/A'}</Text>
          </View>

          <Text style={styles.passengerName}>{item.passenger_name}</Text>

          <View style={styles.ticketInfo}>
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
                  {format(new Date(item.return_date), 'MMM dd, yyyy')}
                </Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Type:</Text>
              <Text style={styles.infoValue}>
                {item.flight_type === 'OW' ? 'One Way' : 'Round Trip'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Amount:</Text>
              <Text style={styles.infoValue}>
                {item.sale} {item.currency_name || ''}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
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
        <Text style={styles.title}>Ticket Copies</Text>
        <Text style={styles.subtitle}>{tickets.length} ticket(s) found</Text>
      </View>

      <FlatList
        data={tickets}
        renderItem={renderTicket}
        keyExtractor={(item) => item.ticket.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 64, marginBottom: 20 }}>🎫</Text>
            <Text style={styles.emptyText}>No tickets found</Text>
            <Text style={{ fontSize: 14, color: '#111', marginTop: 10, textAlign: 'center' }}>
              Your ticket bookings will appear here
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
  ticketCard: {
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
  upcomingTicket: {
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  pnrText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 5,
  },
  ticketNumber: {
    fontSize: 14,
    color: '#000',
  },
  copyBadge: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  copyBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  ticketBody: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 15,
  },
  route: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  airportCode: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  arrow: {
    fontSize: 20,
    color: '#111',
    marginHorizontal: 15,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 15,
  },
  ticketInfo: {
    gap: 8,
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

export default TicketsScreen;

