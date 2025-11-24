import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { customerPaymentService } from '../services/paymentService';
import type { CustomerPayment } from '../types';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const PaymentsScreen: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      // Development: Using customer_id 558
      const customerId = (user as any)?.customer_id || 558;
      const response = await customerPaymentService.getCustomerPayments({
        customer: customerId,
        per_page: 50,
      });
      setPayments(response.data);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPayments();
  };

  const renderPayment = ({ item }: { item: CustomerPayment }) => {
    const paymentDate = new Date(item.datetime);
    const isRecent = (Date.now() - paymentDate.getTime()) / (1000 * 60 * 60 * 24) <= 30;

    return (
      <View style={[styles.paymentCard, isRecent && styles.recentPayment]}>
        <View style={styles.paymentHeader}>
          <View>
            <Text style={styles.amount}>
              {item.payment_amount.toLocaleString()} {item.currencyName || ''}
            </Text>
            <Text style={styles.account}>{item.account_Name || 'N/A'}</Text>
          </View>
          {isRecent && (
            <View style={styles.recentBadge}>
              <Text style={styles.recentBadgeText}>Recent</Text>
            </View>
          )}
        </View>

        <View style={styles.paymentBody}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date:</Text>
            <Text style={styles.infoValue}>
              {format(paymentDate, 'MMM dd, yyyy HH:mm')}
            </Text>
          </View>
          {item.remarks && (
            <View style={styles.remarksContainer}>
              <Text style={styles.remarksLabel}>Remarks:</Text>
              <Text style={styles.remarksText}>{item.remarks}</Text>
            </View>
          )}
          {item.staff_name && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Processed by:</Text>
              <Text style={styles.infoValue}>{item.staff_name}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const getTotalAmount = () => {
    return payments.reduce((sum, payment) => sum + payment.payment_amount, 0);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Payments</Text>
        <Text style={styles.subtitle}>{payments.length} payment(s) found</Text>
        {payments.length > 0 && (
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalAmount}>
              {getTotalAmount().toLocaleString()} {payments[0]?.currencyName || ''}
            </Text>
          </View>
        )}
      </View>

      <FlatList
        data={payments}
        renderItem={renderPayment}
        keyExtractor={(item) => item.pay_id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 64, marginBottom: 20 }}>💳</Text>
            <Text style={styles.emptyText}>No payments found</Text>
            <Text style={{ fontSize: 14, color: '#999', marginTop: 10, textAlign: 'center' }}>
              Your payment history will appear here
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
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 25,
    backgroundColor: '#667eea',
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
    marginBottom: 12,
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  totalLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginRight: 10,
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  paymentCard: {
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
  recentPayment: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  amount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 5,
  },
  account: {
    fontSize: 14,
    color: '#666',
  },
  recentBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recentBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  paymentBody: {
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
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  remarksContainer: {
    marginTop: 5,
  },
  remarksLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  remarksText: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default PaymentsScreen;

