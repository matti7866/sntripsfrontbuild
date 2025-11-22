import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_PADDING = 20;
const CARD_MARGIN = 15;
const CARDS_PER_ROW = 3;
const CARD_WIDTH = (SCREEN_WIDTH - (CARD_PADDING * 2) - (CARD_MARGIN * (CARDS_PER_ROW - 1))) / CARDS_PER_ROW;
import { useAuth } from '../context/AuthContext';
import loyaltyCardService from '../services/loyaltyCardService';
import type { LoyaltyCard } from '../types';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { useNavigation } from '@react-navigation/native';

const DashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [loyaltyCard, setLoyaltyCard] = useState<LoyaltyCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLoyaltyCard();
  }, []);

  const loadLoyaltyCard = async () => {
    try {
      // Development: Using customer_id 558
      const customerId = (user as any)?.customer_id || 558;
      const card = await loyaltyCardService.getCustomerLoyaltyCard(customerId);
      
      if (!card) {
        // Create card if it doesn't exist
        try {
          const newCard = await loyaltyCardService.createLoyaltyCard(customerId);
          setLoyaltyCard(newCard);
        } catch (error) {
          console.error('Error creating loyalty card:', error);
        }
      } else {
        setLoyaltyCard(card);
      }
    } catch (error) {
      console.error('Error loading loyalty card:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLoyaltyCard();
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return ['#E5E7EB', '#9CA3AF'];
      case 'gold':
        return ['#FCD34D', '#F59E0B'];
      case 'silver':
        return ['#E5E7EB', '#6B7280'];
      default:
        return ['#D97706', '#92400E'];
    }
  };

  const getTierName = (tier: string) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome,</Text>
        <Text style={styles.greeting}>{user?.name || 'Customer'}!</Text>
        <Text style={styles.subtitle}>Your Travel Dashboard</Text>
      </View>

      {loyaltyCard ? (
        <View style={styles.cardContainer}>
          <LinearGradient
            colors={getTierColor(loyaltyCard.tier)}
            style={styles.loyaltyCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>SNT Loyalty Card</Text>
              <View style={styles.tierBadge}>
                <Text style={styles.tierText}>{getTierName(loyaltyCard.tier)}</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.qrContainer}>
                <QRCode
                  value={loyaltyCard.card_number}
                  size={120}
                  backgroundColor="transparent"
                  color="#000"
                />
              </View>
              <Text style={styles.cardNumber}>{loyaltyCard.card_number}</Text>
              <View style={styles.pointsContainer}>
                <Text style={styles.pointsLabel}>Points</Text>
                <Text style={styles.pointsValue}>{loyaltyCard.points.toLocaleString()}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      ) : (
        <View style={styles.noCardContainer}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 24,
            padding: 40,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 6,
          }}>
            <Text style={{ fontSize: 48, marginBottom: 20 }}>🎁</Text>
            <Text style={styles.noCardText}>Get Your Loyalty Card!</Text>
            <Text style={{ fontSize: 14, color: '#999', textAlign: 'center', marginBottom: 25 }}>
              Earn points on every booking and unlock exclusive rewards
            </Text>
            <TouchableOpacity style={styles.createCardButton} onPress={loadLoyaltyCard}>
              <Text style={styles.createCardButtonText}>Create My Card</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Tickets')}
          >
            <Text style={styles.actionIcon}>🎫</Text>
            <Text style={styles.actionText}>Ticket Copies</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Travels')}
          >
            <Text style={styles.actionIcon}>✈️</Text>
            <Text style={styles.actionText}>Upcoming Travels</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Payments')}
          >
            <Text style={styles.actionIcon}>💳</Text>
            <Text style={styles.actionText}>Recent Payments</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
    paddingBottom: 30,
    backgroundColor: '#667eea',
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  cardContainer: {
    paddingHorizontal: 20,
    marginTop: -40,
  },
  loyaltyCard: {
    borderRadius: 24,
    padding: 30,
    minHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  tierBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tierText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    textTransform: 'uppercase',
  },
  cardBody: {
    alignItems: 'center',
  },
  qrContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 25,
    letterSpacing: 3,
  },
  pointsContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 16,
  },
  pointsLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pointsValue: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
  },
  noCardContainer: {
    paddingHorizontal: 20,
    marginTop: -40,
    marginBottom: 20,
  },
  noCardText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  createCardButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createCardButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  quickActions: {
    padding: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  actionCard: {
    backgroundColor: '#fff',
    width: CARD_WIDTH,
    aspectRatio: 0.9,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  actionText: {
    fontSize: 11,
    color: '#1a1a1a',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 14,
  },
});

export default DashboardScreen;

