import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
  Image,
  Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { api } from '../services/api';
import { API_CONFIG } from '../config/api';

interface ResidenceTask {
  residenceID: number;
  datetime: string;
  passenger_name: string;
  customer_name: string;
  company_name: string;
  company_number: string;
  passportNumber: string;
  countryName: string;
  uid: string;
  mb_number: string;
  mohreStatus: string;
  LabourCardNumber: string;
  sale_price: number;
  paid_amount: number;
  remaining_balance: number;
  completedStep: number;
  offerLetterStatus: string;
  eVisaStatus: string;
  remarks: string;
}

interface StepInfo {
  name: string;
  icon: string;
  color: string;
  showAccess?: boolean;
}

// Define steps in correct order with Step 1A as second
const stepOrder = ['1', '1a', '2', '3', '4', '4a', '5', '6', '7', '8', '9'];

const steps: Record<string, StepInfo> = {
  '1': { name: 'Offer Letter', icon: 'mail', color: '#dc2626' },
  '1a': { name: 'Offer Letter (S)', icon: 'mail-open', color: '#ef4444' },
  '2': { name: 'Insurance', icon: 'shield-checkmark', color: '#10b981' },
  '3': { name: 'Labour Card', icon: 'card', color: '#f59e0b' },
  '4': { name: 'E-Visa', icon: 'airplane', color: '#8b5cf6', showAccess: true },
  '4a': { name: 'E-Visa (S)', icon: 'paper-plane', color: '#a78bfa', showAccess: true },
  '5': { name: 'Change Status', icon: 'swap-horizontal', color: '#ec4899', showAccess: true },
  '6': { name: 'Medical', icon: 'medkit', color: '#ef4444' },
  '7': { name: 'EID', icon: 'id-card', color: '#06b6d4' },
  '8': { name: 'Stamping', icon: 'checkmark-done', color: '#14b8a6' },
  '9': { name: 'Completed', icon: 'checkmark-circle', color: '#22c55e' },
};

interface Attachment {
  id: number;
  filename: string;
  file_path: string;
  uploaded_at: string;
}

interface OfferLetterData {
  company_id: string;
  mbNumber: string;
  offerLetterCost: string;
  offerLetterCurrency: string;
  offerLetterChargeOn: string;
  offerLetterChargeAccount: string;
  offerLetterChargeSupplier: string;
  offerLetterFile: any;
}

interface Lookups {
  companies: Array<{ company_id: number; company_name: string; starting_quota: number; totalEmployees: number }>;
  currencies: Array<{ currencyID: number; currencyName: string }>;
  accounts: Array<{ account_ID: number; account_Name: string }>;
  suppliers: Array<{ supp_id: number; supp_name: string }>;
  creditCards: Array<{ account_ID: number; account_Name: string; display_name?: string }>;
}

export default function ResidenceTasksScreen() {
  const [currentStep, setCurrentStep] = useState('1');
  const [tasks, setTasks] = useState<ResidenceTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<ResidenceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stepCounts, setStepCounts] = useState<Record<string, number>>({});
  
  // Attachments modal
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [selectedTaskForAttachments, setSelectedTaskForAttachments] = useState<ResidenceTask | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Offer Letter modal (Step 1)
  const [showOfferLetterModal, setShowOfferLetterModal] = useState(false);
  const [selectedTaskForOffer, setSelectedTaskForOffer] = useState<ResidenceTask | null>(null);
  const [offerLetterData, setOfferLetterData] = useState<OfferLetterData>({
    company_id: '',
    mbNumber: '',
    offerLetterCost: '50',
    offerLetterCurrency: '',
    offerLetterChargeOn: '1',
    offerLetterChargeAccount: '',
    offerLetterChargeSupplier: '',
    offerLetterFile: null,
  });
  const [lookups, setLookups] = useState<Lookups>({
    companies: [],
    currencies: [],
    accounts: [],
    suppliers: [],
    creditCards: [],
  });
  const [offerLetterErrors, setOfferLetterErrors] = useState<Record<string, string>>({});

  useFocusEffect(
    useCallback(() => {
      loadTasks();
      loadLookups();
    }, [currentStep])
  );

  const loadLookups = async () => {
    try {
      const response = await api.get<any>('/residence/lookups.php');
      setLookups({
        companies: response.companies || [],
        currencies: response.currencies || [],
        accounts: response.accounts || [],
        suppliers: response.suppliers || [],
        creditCards: response.creditCards || [],
      });
      
      // Set default currency
      if (response.currencies && response.currencies.length > 0 && !offerLetterData.offerLetterCurrency) {
        setOfferLetterData(prev => ({
          ...prev,
          offerLetterCurrency: response.currencies[0].currencyID.toString()
        }));
      }
    } catch (error) {
      console.error('Error loading lookups:', error);
    }
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get<any>(`/residence/tasks.php?step=${currentStep}`);
      
      let tasksList: ResidenceTask[] = [];
      if (response.residences) {
        tasksList = response.residences;
      } else if (response.data?.residences) {
        tasksList = response.data.residences;
      } else if (Array.isArray(response.data)) {
        tasksList = response.data;
      } else if (Array.isArray(response)) {
        tasksList = response;
      }
      
      setTasks(tasksList);
      setFilteredTasks(tasksList);
      
      // Load step counts
      if (response.stepCounts || response.data?.stepCounts) {
        setStepCounts(response.stepCounts || response.data.stepCounts);
      }
    } catch (error: any) {
      console.error('Tasks API Error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load tasks');
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
        task.company_name?.toLowerCase().includes(lowercaseQuery) ||
        task.passportNumber?.toLowerCase().includes(lowercaseQuery) ||
        task.residenceID?.toString().includes(query)
      );
    });
    setFilteredTasks(filtered);
  };

  const handleStepChange = (step: string) => {
    setCurrentStep(step);
    setSearchQuery('');
  };

  const renderSideNavigation = () => (
    <View style={styles.sideNavContainer}>
      <View style={styles.sideNavHeader}>
        <Text style={styles.sideNavTitle}>Steps</Text>
      </View>
      
      <ScrollView style={styles.sideNavList} showsVerticalScrollIndicator={false}>
        {stepOrder.map((stepKey) => {
          const step = steps[stepKey];
          const isActive = currentStep === stepKey;
          const count = stepCounts[stepKey] || 0;
          
          return (
            <TouchableOpacity
              key={stepKey}
              style={[
                styles.sideNavItem,
                isActive && { backgroundColor: `${step.color}15`, borderLeftColor: step.color }
              ]}
              onPress={() => handleStepChange(stepKey)}
            >
              <View style={[styles.sideNavIcon, { backgroundColor: `${step.color}20` }]}>
                <Ionicons name={step.icon as any} size={20} color={step.color} />
              </View>
              <View style={styles.sideNavContent}>
                <Text style={[styles.sideNavLabel, isActive && { color: step.color, fontWeight: 'bold' }]}>
                  {step.name}
                </Text>
                <Text style={styles.sideNavStep}>Step {stepKey.toUpperCase()}</Text>
              </View>
              {count > 0 && (
                <View style={[styles.sideNavBadge, { backgroundColor: step.color }]}>
                  <Text style={styles.sideNavBadgeText}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderTaskCard = ({ item }: { item: ResidenceTask }) => {
    const stepInfo = steps[currentStep];
    
    return (
      <View key={item.residenceID} style={styles.taskCard}>
        <View style={styles.taskHeader}>
          <View style={styles.taskHeaderLeft}>
            <View style={[styles.taskIdBadge, { backgroundColor: stepInfo.color }]}>
              <Text style={styles.taskIdText}>#{item.residenceID}</Text>
            </View>
            <View style={styles.stepIndicator}>
              <Ionicons name={stepInfo.icon as any} size={16} color={stepInfo.color} />
              <Text style={[styles.stepText, { color: stepInfo.color }]}>
                {stepInfo.name}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.taskBody}>
          <View style={styles.infoRow}>
            <Ionicons name="person" size={16} color="#111111" />
            <Text style={styles.infoLabel}>Passenger:</Text>
            <Text style={styles.infoValue}>{item.passenger_name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="business" size={16} color="#111111" />
            <Text style={styles.infoLabel}>Company:</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {item.company_name}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="card" size={16} color="#111111" />
            <Text style={styles.infoLabel}>Passport:</Text>
            <Text style={styles.infoValue}>{item.passportNumber}</Text>
          </View>

          {item.mb_number && (
            <View style={styles.infoRow}>
              <Ionicons name="barcode" size={16} color="#111111" />
              <Text style={styles.infoLabel}>MB:</Text>
              <Text style={styles.infoValue}>{item.mb_number}</Text>
            </View>
          )}

          {item.mohreStatus && (
            <View style={[styles.infoRow, styles.mohreStatusRow]}>
              <Ionicons 
                name={item.mb_number ? "checkmark-circle" : "alert-circle"} 
                size={16} 
                color={item.mb_number ? "#10b981" : "#ef4444"} 
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

          {item.offerLetterStatus && (currentStep === '1' || currentStep === '1a') && (
            <View style={[styles.infoRow, styles.offerStatusRow]}>
              <Ionicons 
                name={
                  item.offerLetterStatus === 'accepted' ? 'checkmark-done-circle' :
                  item.offerLetterStatus === 'rejected' ? 'close-circle' :
                  'time'
                } 
                size={16} 
                color={
                  item.offerLetterStatus === 'accepted' ? '#10b981' :
                  item.offerLetterStatus === 'rejected' ? '#ef4444' :
                  '#f59e0b'
                } 
              />
              <Text style={styles.infoLabel}>Offer Status:</Text>
              <Text style={[
                styles.infoValue,
                item.offerLetterStatus === 'accepted' && { color: '#10b981', fontWeight: 'bold' },
                item.offerLetterStatus === 'rejected' && { color: '#ef4444', fontWeight: 'bold' },
              ]}>
                {item.offerLetterStatus.charAt(0).toUpperCase() + item.offerLetterStatus.slice(1)}
              </Text>
            </View>
          )}

          {item.remaining_balance > 0 && (
            <View style={[styles.infoRow, styles.balanceRow]}>
              <Ionicons name="cash" size={16} color="#dc2626" />
              <Text style={styles.infoLabel}>Balance:</Text>
              <Text style={styles.balanceValue}>
                {item.remaining_balance.toFixed(2)} AED
              </Text>
            </View>
          )}

          {/* Action Buttons Row 1 */}
          <View style={styles.actionButtons}>
            {currentStep === '1' ? (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#10b981' }]}
                  onPress={() => handleOfferLetterContinue(item)}
                >
                  <Ionicons name="arrow-forward-circle" size={16} color="#ffffff" />
                  <Text style={styles.actionButtonText}>Continue</Text>
                </TouchableOpacity>
              </>
            ) : currentStep === '1a' ? (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#10b981' }]}
                  onPress={() => handleOfferLetterAccept(item)}
                >
                  <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
                  <Text style={styles.actionButtonText}>Accept</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
                  onPress={() => handleOfferLetterReject(item)}
                >
                  <Ionicons name="close-circle" size={16} color="#ffffff" />
                  <Text style={styles.actionButtonText}>Reject</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: stepInfo.color }]}
                onPress={() => handleStepAction(item)}
              >
                <Ionicons name={stepInfo.icon as any} size={16} color="#ffffff" />
                <Text style={styles.actionButtonText}>Process</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => handleAttachments(item)}
            >
              <Ionicons name="attach" size={16} color="#10b981" />
              <Text style={[styles.actionButtonText, { color: '#10b981' }]}>
                Files
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => handleRemarks(item)}
            >
              <Ionicons name="chatbox" size={16} color="#f59e0b" />
              <Text style={[styles.actionButtonText, { color: '#f59e0b' }]}>
                Notes
              </Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons Row 2 */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => handleViewDetails(item)}
            >
              <Ionicons name="eye" size={16} color="#dc2626" />
              <Text style={[styles.actionButtonText, { color: '#dc2626' }]}>
                Details
              </Text>
            </TouchableOpacity>

            {stepInfo.showAccess && (
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => handleAccessPortal(item)}
              >
                <Ionicons name="globe" size={16} color="#8b5cf6" />
                <Text style={[styles.actionButtonText, { color: '#8b5cf6' }]}>
                  Portal
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => handlePayments(item)}
            >
              <Ionicons name="cash" size={16} color="#dc2626" />
              <Text style={[styles.actionButtonText, { color: '#dc2626' }]}>
                Pay
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const handleOfferLetterAccept = async (task: ResidenceTask) => {
    Alert.alert(
      'Accept Offer Letter',
      `Accept offer letter for ${task.passenger_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          style: 'default',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Use api service which includes authentication
              const formData = new URLSearchParams();
              formData.append('action', 'setOfferLetterStatus');
              formData.append('id', task.residenceID.toString());
              formData.append('value', 'accepted');
              
              // Pass URLSearchParams directly - axios handles it automatically
              const result = await api.post('/residence/tasks-controller.php', formData as any, {
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
              });
              
              if (result.success !== false) {
                Alert.alert('Success', 'Offer letter accepted successfully');
                await loadTasks();
              } else {
                Alert.alert('Error', result.message || 'Failed to accept offer letter');
              }
            } catch (error: any) {
              console.error('Accept error:', error);
              const errorMessage = error.response?.data?.message || error.message || 'Failed to accept offer letter';
              Alert.alert('Error', errorMessage);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleOfferLetterReject = async (task: ResidenceTask) => {
    Alert.alert(
      'Reject Offer Letter',
      `Reject offer letter for ${task.passenger_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Use api service which includes authentication
              const formData = new URLSearchParams();
              formData.append('action', 'setOfferLetterStatus');
              formData.append('id', task.residenceID.toString());
              formData.append('value', 'rejected');
              
              // Pass URLSearchParams directly - axios handles it automatically
              const result = await api.post('/residence/tasks-controller.php', formData as any, {
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
              });
              
              if (result.success !== false) {
                Alert.alert('Success', 'Offer letter rejected');
                await loadTasks();
              } else {
                Alert.alert('Error', result.message || 'Failed to reject offer letter');
              }
            } catch (error: any) {
              console.error('Reject error:', error);
              const errorMessage = error.response?.data?.message || error.message || 'Failed to reject offer letter';
              Alert.alert('Error', errorMessage);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleOfferLetterContinue = (task: ResidenceTask) => {
    setSelectedTaskForOffer(task);
    setOfferLetterData({
      company_id: '',
      mbNumber: task.mb_number || '',
      offerLetterCost: '50',
      offerLetterCurrency: lookups.currencies.length > 0 ? lookups.currencies[0].currencyID.toString() : '',
      offerLetterChargeOn: '1',
      offerLetterChargeAccount: '',
      offerLetterChargeSupplier: '',
      offerLetterFile: null,
    });
    setOfferLetterErrors({});
    setShowOfferLetterModal(true);
  };

  const handleOfferLetterSubmit = async () => {
    if (!selectedTaskForOffer) return;
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!offerLetterData.company_id) newErrors.company_id = 'Establishment is required';
    if (!offerLetterData.mbNumber.trim()) newErrors.mbNumber = 'MB Number is required';
    if (!offerLetterData.offerLetterCost) newErrors.offerLetterCost = 'Offer Letter Cost is required';
    if (!offerLetterData.offerLetterCurrency) newErrors.offerLetterCurrency = 'Currency is required';
    if (!offerLetterData.offerLetterChargeOn) newErrors.offerLetterChargeOn = 'Charge On is required';
    if (offerLetterData.offerLetterChargeOn === '1' && !offerLetterData.offerLetterChargeAccount) {
      newErrors.offerLetterChargeAccount = 'Charge Account is required';
    }
    if (offerLetterData.offerLetterChargeOn === '2' && !offerLetterData.offerLetterChargeSupplier) {
      newErrors.offerLetterChargeSupplier = 'Charge Supplier is required';
    }
    if (offerLetterData.offerLetterChargeOn === '3' && !offerLetterData.offerLetterChargeAccount) {
      newErrors.offerLetterChargeAccount = 'Credit Card is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setOfferLetterErrors(newErrors);
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }
    
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('action', 'updateStep');
      formData.append('id', selectedTaskForOffer.residenceID.toString());
      formData.append('step', '1');
      formData.append('markComplete', 'true');
      formData.append('company', offerLetterData.company_id);
      formData.append('mb_number', offerLetterData.mbNumber);
      formData.append('offerLetterCost', offerLetterData.offerLetterCost);
      formData.append('offerLetterCostCur', offerLetterData.offerLetterCurrency);
      formData.append('offerLChargOpt', offerLetterData.offerLetterChargeOn);
      formData.append('offerLChargedEntity', 
        (offerLetterData.offerLetterChargeOn === '1' || offerLetterData.offerLetterChargeOn === '3') 
          ? offerLetterData.offerLetterChargeAccount 
          : offerLetterData.offerLetterChargeSupplier
      );
      
      if (offerLetterData.offerLetterFile) {
        formData.append('offerLetterFile', {
          uri: offerLetterData.offerLetterFile.uri,
          name: offerLetterData.offerLetterFile.uri.split('/').pop() || 'offer_letter.pdf',
          type: 'application/pdf',
        } as any);
      }
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/residence/tasks-controller.php`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success !== false) {
        Alert.alert('Success', 'Offer letter processed successfully');
        closeOfferLetterModal();
        await loadTasks();
      } else {
        Alert.alert('Error', result.message || 'Failed to process offer letter');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to process offer letter');
    } finally {
      setLoading(false);
    }
  };

  const handleStepAction = (task: ResidenceTask) => {
    Alert.alert(
      `${steps[currentStep].name}`,
      `Process ${steps[currentStep].name} for ${task.passenger_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Process',
          onPress: () => {
            // TODO: Implement step-specific modals
            Alert.alert('Coming Soon', 'Step processing modal will open here');
          }
        }
      ]
    );
  };

  const handleViewDetails = (task: ResidenceTask) => {
    Alert.alert(
      'Task Details',
      `ID: ${task.residenceID}\n` +
      `Passenger: ${task.passenger_name}\n` +
      `Company: ${task.company_name}\n` +
      `Passport: ${task.passportNumber}\n` +
      `Customer: ${task.customer_name || 'N/A'}\n` +
      `Country: ${task.countryName || 'N/A'}\n` +
      `Sale Price: ${task.sale_price || 0} AED\n` +
      `Paid: ${task.paid_amount || 0} AED\n` +
      `Balance: ${task.remaining_balance || 0} AED\n` +
      `Step: ${steps[currentStep].name}`
    );
  };

  const handleAttachments = async (task: ResidenceTask) => {
    setSelectedTaskForAttachments(task);
    setShowAttachmentsModal(true);
    await loadAttachments(task.residenceID);
  };

  const loadAttachments = async (residenceId: number) => {
    try {
      setLoadingAttachments(true);
      const response = await api.get<any>('/residence/attachments.php', {
        params: { residenceID: residenceId }
      });
      
      // Handle different response formats (matching web app)
      let attachmentsList: Attachment[] = [];
      if (response.success && response.data) {
        attachmentsList = Array.isArray(response.data) ? response.data : [];
      } else if (response.data?.success && response.data.data) {
        attachmentsList = Array.isArray(response.data.data) ? response.data.data : [];
      } else if (Array.isArray(response.data)) {
        attachmentsList = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        attachmentsList = response.data.data;
      } else if (Array.isArray(response)) {
        attachmentsList = response;
      }
      
      setAttachments(attachmentsList);
    } catch (error: any) {
      console.error('Error loading attachments:', error);
      console.warn('Attachments error details:', error.response?.data);
      // Show empty list to allow uploads even if loading fails
      setAttachments([]);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const handleUploadImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to photos to upload attachments');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadFile(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow camera access to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadFile(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const uploadFile = async (fileUri: string) => {
    if (!selectedTaskForAttachments) return;

    try {
      setUploading(true);
      
      const formData = new FormData();
      const filename = fileUri.split('/').pop() || `attachment_${Date.now()}.jpg`;
      
      // Create file object for upload
      formData.append('file', {
        uri: fileUri,
        name: filename,
        type: 'image/jpeg',
      } as any);
      formData.append('residenceID', selectedTaskForAttachments.residenceID.toString());
      formData.append('action', 'upload');

      // Use API base URL for uploads
      const uploadUrl = API_CONFIG.BASE_URL.replace('/api/', '/');
      const response = await fetch(`${uploadUrl}/residence/upload-attachment.php`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success || result.status === 'success') {
        Alert.alert('Success', 'File uploaded successfully');
        await loadAttachments(selectedTaskForAttachments.residenceID);
      } else {
        Alert.alert('Error', result.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadAttachment = async (attachment: Attachment) => {
    try {
      // Build full URL - remove /api/ from baseURL for file access
      const baseUrl = API_CONFIG.BASE_URL.replace('/api/', '/');
      const fileUrl = attachment.file_path.startsWith('http') 
        ? attachment.file_path 
        : `${baseUrl}${attachment.file_path}`;
      
      console.log('Opening file:', fileUrl);
      
      const supported = await Linking.canOpenURL(fileUrl);
      
      if (supported) {
        await Linking.openURL(fileUrl);
      } else {
        Alert.alert('Error', 'Cannot open this file type');
      }
    } catch (error: any) {
      console.error('Download error:', error);
      Alert.alert('Error', error.message || 'Failed to open file');
    }
  };

  const handleRemarks = (task: ResidenceTask) => {
    Alert.alert(
      'Remarks',
      task.remarks || 'No remarks available',
      [
        { text: 'OK' },
        {
          text: 'Add Remark',
          onPress: () => {
            // TODO: Implement remarks modal
            Alert.alert('Coming Soon', 'Add remarks modal will open here');
          }
        }
      ]
    );
  };

  const handleAccessPortal = (task: ResidenceTask) => {
    if (!task.company_number) {
      Alert.alert('Error', 'No company number available');
      return;
    }
    
    Alert.alert(
      'Access Portal',
      `Open company portal for ${task.company_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open',
          onPress: () => {
            // Open web portal
            const portalUrl = `https://portal.example.com/company/${task.company_number}`;
            Linking.openURL(portalUrl).catch(() => {
              Alert.alert('Error', 'Failed to open portal');
            });
          }
        }
      ]
    );
  };

  const handlePayments = (task: ResidenceTask) => {
    Alert.alert(
      'Payment Details',
      `Sale Price: ${task.sale_price || 0} AED\n` +
      `Paid Amount: ${task.paid_amount || 0} AED\n` +
      `Balance: ${task.remaining_balance || 0} AED`,
      [
        { text: 'OK' },
        ...(task.remaining_balance > 0 ? [{
          text: 'Add Payment',
          onPress: () => {
            // TODO: Implement payment modal
            Alert.alert('Coming Soon', 'Payment modal will open here');
          }
        }] : [])
      ]
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={steps[currentStep].icon as any}
        size={64}
        color="#333333"
      />
      <Text style={styles.emptyText}>No tasks for {steps[currentStep].name}</Text>
      <Text style={styles.emptySubtext}>Tasks will appear here when available</Text>
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

  const closeAttachmentsModal = () => {
    setShowAttachmentsModal(false);
    setSelectedTaskForAttachments(null);
    setAttachments([]);
  };

  const closeOfferLetterModal = () => {
    setShowOfferLetterModal(false);
    setSelectedTaskForOffer(null);
    setOfferLetterData({
      company_id: '',
      mbNumber: '',
      offerLetterCost: '50',
      offerLetterCurrency: lookups.currencies.length > 0 ? lookups.currencies[0].currencyID.toString() : '',
      offerLetterChargeOn: '1',
      offerLetterChargeAccount: '',
      offerLetterChargeSupplier: '',
      offerLetterFile: null,
    });
    setOfferLetterErrors({});
  };

  const renderAttachmentsModal = () => (
    <Modal
      visible={showAttachmentsModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeAttachmentsModal}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity 
            onPress={closeAttachmentsModal}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            Attachments
          </Text>
          <TouchableOpacity 
            onPress={closeAttachmentsModal}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={28} color="#000000" />
          </TouchableOpacity>
        </View>

        <View style={styles.passengerInfo}>
          <Text style={styles.passengerName}>
            {selectedTaskForAttachments?.passenger_name}
          </Text>
          <Text style={styles.passengerId}>
            ID: #{selectedTaskForAttachments?.residenceID}
          </Text>
        </View>

        {/* Upload Buttons */}
        <View style={styles.uploadButtons}>
          <TouchableOpacity
            style={[styles.uploadButton, { backgroundColor: '#dc2626' }]}
            onPress={handleTakePhoto}
            disabled={uploading}
          >
            <Ionicons name="camera" size={24} color="#ffffff" />
            <Text style={styles.uploadButtonText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.uploadButton, { backgroundColor: '#10b981' }]}
            onPress={handleUploadImage}
            disabled={uploading}
          >
            <Ionicons name="images" size={24} color="#ffffff" />
            <Text style={styles.uploadButtonText}>Choose Image</Text>
          </TouchableOpacity>
        </View>

        {uploading && (
          <View style={styles.uploadingIndicator}>
            <ActivityIndicator size="small" color="#dc2626" />
            <Text style={styles.uploadingText}>Uploading...</Text>
          </View>
        )}

        {/* Attachments List */}
        <ScrollView style={styles.attachmentsList}>
          {loadingAttachments ? (
            <ActivityIndicator size="large" color="#dc2626" style={{ marginTop: 32 }} />
          ) : attachments.length === 0 ? (
            <View style={styles.emptyAttachments}>
              <Ionicons name="folder-open-outline" size={64} color="#333333" />
              <Text style={styles.emptyAttachmentsText}>No attachments yet</Text>
              <Text style={styles.emptyAttachmentsSubtext}>
                Upload photos or documents
              </Text>
            </View>
          ) : (
            attachments.map((attachment, index) => (
              <TouchableOpacity
                key={`attachment-${attachment.id || index}`}
                style={styles.attachmentItem}
                onPress={() => handleDownloadAttachment(attachment)}
              >
                <View style={styles.attachmentIcon}>
                  <Ionicons name="document" size={32} color="#dc2626" />
                </View>
                <View style={styles.attachmentInfo}>
                  <Text style={styles.attachmentName} numberOfLines={1}>
                    {attachment.filename}
                  </Text>
                  <Text style={styles.attachmentDate}>
                    {new Date(attachment.uploaded_at).toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDownloadAttachment(attachment)}
                  style={styles.downloadButton}
                >
                  <Ionicons name="download" size={24} color="#10b981" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.mainLayout}>
        {/* Permanent Side Navigation */}
        {renderSideNavigation()}

        {/* Main Content Area */}
        <View style={styles.mainContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={[styles.headerTitle, { color: steps[currentStep].color }]}>
                {steps[currentStep].name}
              </Text>
              <Text style={styles.headerSubtitle}>
                {filteredTasks.length} task(s)
              </Text>
            </View>
          </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#111111" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, passport, company..."
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

          {/* Tasks List */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {filteredTasks.length === 0 ? (
              renderEmpty()
            ) : (
              filteredTasks.map((task) => renderTaskCard({ item: task }))
            )}
          </ScrollView>
        </View>
      </View>

      {/* Offer Letter Modal (Step 1) */}
      <Modal
        visible={showOfferLetterModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeOfferLetterModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeOfferLetterModal} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#000000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Offer Letter</Text>
            <TouchableOpacity onPress={closeOfferLetterModal} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#000000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalForm}>
            {selectedTaskForOffer && (
              <View style={styles.taskInfoCard}>
                <Text style={styles.taskInfoLabel}>Passenger</Text>
                <Text style={styles.taskInfoValue}>{selectedTaskForOffer.passenger_name}</Text>
                <Text style={styles.taskInfoLabel}>Company</Text>
                <Text style={styles.taskInfoValue}>{selectedTaskForOffer.company_name}</Text>
              </View>
            )}

            {/* Establishment */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Establishment <Text style={styles.required}>*</Text>
              </Text>
              <ScrollView style={styles.pickerContainer}>
                <TouchableOpacity
                  style={[styles.formInput, offerLetterErrors.company_id && styles.formInputError]}
                  onPress={() => {
                    // Simple picker - in real app you'd use a proper picker component
                    Alert.alert(
                      'Select Establishment',
                      'Choose from list',
                      [
                        { text: 'Cancel' },
                        ...lookups.companies.map(company => ({
                          text: `${company.company_name} (${(company.starting_quota || 0) - (company.totalEmployees || 0)})`,
                          onPress: () => {
                            setOfferLetterData({...offerLetterData, company_id: company.company_id.toString()});
                            setOfferLetterErrors({...offerLetterErrors, company_id: ''});
                          }
                        }))
                      ]
                    );
                  }}
                >
                  <Text style={[
                    offerLetterData.company_id ? styles.pickerValue : styles.pickerPlaceholder
                  ]}>
                    {offerLetterData.company_id 
                      ? lookups.companies.find(c => c.company_id.toString() === offerLetterData.company_id)?.company_name || 'Select Establishment'
                      : 'Select Establishment'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#111111" />
                </TouchableOpacity>
              </ScrollView>
              {offerLetterErrors.company_id && (
                <Text style={styles.errorText}>{offerLetterErrors.company_id}</Text>
              )}
            </View>

            {/* MB Number */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                MB Number <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.formInput, offerLetterErrors.mbNumber && styles.formInputError]}
                value={offerLetterData.mbNumber}
                onChangeText={(text) => {
                  setOfferLetterData({...offerLetterData, mbNumber: text});
                  setOfferLetterErrors({...offerLetterErrors, mbNumber: ''});
                }}
                placeholder="MBXXXXXXAE"
                placeholderTextColor="#333333"
              />
              {offerLetterErrors.mbNumber && (
                <Text style={styles.errorText}>{offerLetterErrors.mbNumber}</Text>
              )}
            </View>

            {/* Offer Letter File */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Offer Letter File</Text>
              <TouchableOpacity
                style={styles.fileUploadButton}
                onPress={async () => {
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.All,
                    allowsEditing: false,
                  });
                  if (!result.canceled && result.assets[0]) {
                    setOfferLetterData({...offerLetterData, offerLetterFile: result.assets[0]});
                  }
                }}
              >
                <Ionicons name="document-attach" size={20} color="#dc2626" />
                <Text style={styles.fileUploadText}>
                  {offerLetterData.offerLetterFile ? 'Change File' : 'Choose PDF File'}
                </Text>
              </TouchableOpacity>
              {offerLetterData.offerLetterFile && (
                <Text style={styles.selectedFileText}>
                  ✓ {offerLetterData.offerLetterFile.uri.split('/').pop()}
                </Text>
              )}
            </View>

            {/* Offer Letter Cost */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Offer Letter Cost <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.formInput, offerLetterErrors.offerLetterCost && styles.formInputError]}
                value={offerLetterData.offerLetterCost}
                onChangeText={(text) => {
                  setOfferLetterData({...offerLetterData, offerLetterCost: text});
                  setOfferLetterErrors({...offerLetterErrors, offerLetterCost: ''});
                }}
                placeholder="50"
                keyboardType="numeric"
                placeholderTextColor="#333333"
              />
              {offerLetterErrors.offerLetterCost && (
                <Text style={styles.errorText}>{offerLetterErrors.offerLetterCost}</Text>
              )}
            </View>

            {/* Currency */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Currency <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[styles.formInput, offerLetterErrors.offerLetterCurrency && styles.formInputError]}
                onPress={() => {
                  Alert.alert(
                    'Select Currency',
                    'Choose currency',
                    [
                      { text: 'Cancel' },
                      ...lookups.currencies.map(currency => ({
                        text: currency.currencyName,
                        onPress: () => {
                          setOfferLetterData({...offerLetterData, offerLetterCurrency: currency.currencyID.toString()});
                          setOfferLetterErrors({...offerLetterErrors, offerLetterCurrency: ''});
                        }
                      }))
                    ]
                  );
                }}
              >
                <Text style={[
                  offerLetterData.offerLetterCurrency ? styles.pickerValue : styles.pickerPlaceholder
                ]}>
                  {offerLetterData.offerLetterCurrency
                    ? lookups.currencies.find(c => c.currencyID.toString() === offerLetterData.offerLetterCurrency)?.currencyName || 'Select Currency'
                    : 'Select Currency'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#111111" />
              </TouchableOpacity>
              {offerLetterErrors.offerLetterCurrency && (
                <Text style={styles.errorText}>{offerLetterErrors.offerLetterCurrency}</Text>
              )}
            </View>

            {/* Charge On */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Charge On <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[styles.formInput, offerLetterErrors.offerLetterChargeOn && styles.formInputError]}
                onPress={() => {
                  Alert.alert(
                    'Charge On',
                    'Select payment method',
                    [
                      { text: 'Cancel' },
                      { text: 'Account', onPress: () => {
                        setOfferLetterData({...offerLetterData, offerLetterChargeOn: '1', offerLetterChargeAccount: '', offerLetterChargeSupplier: ''});
                        setOfferLetterErrors({...offerLetterErrors, offerLetterChargeOn: ''});
                      }},
                      { text: 'Supplier', onPress: () => {
                        setOfferLetterData({...offerLetterData, offerLetterChargeOn: '2', offerLetterChargeAccount: '', offerLetterChargeSupplier: ''});
                        setOfferLetterErrors({...offerLetterErrors, offerLetterChargeOn: ''});
                      }},
                      { text: 'Credit Card', onPress: () => {
                        setOfferLetterData({...offerLetterData, offerLetterChargeOn: '3', offerLetterChargeAccount: '', offerLetterChargeSupplier: ''});
                        setOfferLetterErrors({...offerLetterErrors, offerLetterChargeOn: ''});
                      }}
                    ]
                  );
                }}
              >
                <Text style={[
                  offerLetterData.offerLetterChargeOn ? styles.pickerValue : styles.pickerPlaceholder
                ]}>
                  {offerLetterData.offerLetterChargeOn === '1' ? 'Account' :
                   offerLetterData.offerLetterChargeOn === '2' ? 'Supplier' :
                   offerLetterData.offerLetterChargeOn === '3' ? 'Credit Card' :
                   'Select Charge On'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#111111" />
              </TouchableOpacity>
              {offerLetterErrors.offerLetterChargeOn && (
                <Text style={styles.errorText}>{offerLetterErrors.offerLetterChargeOn}</Text>
              )}
            </View>

            {/* Conditional Fields Based on Charge On */}
            {offerLetterData.offerLetterChargeOn === '1' && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Select Account <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[styles.formInput, offerLetterErrors.offerLetterChargeAccount && styles.formInputError]}
                  onPress={() => {
                    Alert.alert(
                      'Select Account',
                      'Choose account',
                      [
                        { text: 'Cancel' },
                        ...lookups.accounts.map(account => ({
                          text: account.account_Name,
                          onPress: () => {
                            setOfferLetterData({...offerLetterData, offerLetterChargeAccount: account.account_ID.toString()});
                            setOfferLetterErrors({...offerLetterErrors, offerLetterChargeAccount: ''});
                          }
                        }))
                      ]
                    );
                  }}
                >
                  <Text style={[
                    offerLetterData.offerLetterChargeAccount ? styles.pickerValue : styles.pickerPlaceholder
                  ]}>
                    {offerLetterData.offerLetterChargeAccount
                      ? lookups.accounts.find(a => a.account_ID.toString() === offerLetterData.offerLetterChargeAccount)?.account_Name || 'Select Account'
                      : 'Select Account'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#111111" />
                </TouchableOpacity>
                {offerLetterErrors.offerLetterChargeAccount && (
                  <Text style={styles.errorText}>{offerLetterErrors.offerLetterChargeAccount}</Text>
                )}
              </View>
            )}

            {offerLetterData.offerLetterChargeOn === '2' && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Select Supplier <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[styles.formInput, offerLetterErrors.offerLetterChargeSupplier && styles.formInputError]}
                  onPress={() => {
                    Alert.alert(
                      'Select Supplier',
                      'Choose supplier',
                      [
                        { text: 'Cancel' },
                        ...lookups.suppliers.map(supplier => ({
                          text: supplier.supp_name,
                          onPress: () => {
                            setOfferLetterData({...offerLetterData, offerLetterChargeSupplier: supplier.supp_id.toString()});
                            setOfferLetterErrors({...offerLetterErrors, offerLetterChargeSupplier: ''});
                          }
                        }))
                      ]
                    );
                  }}
                >
                  <Text style={[
                    offerLetterData.offerLetterChargeSupplier ? styles.pickerValue : styles.pickerPlaceholder
                  ]}>
                    {offerLetterData.offerLetterChargeSupplier
                      ? lookups.suppliers.find(s => s.supp_id.toString() === offerLetterData.offerLetterChargeSupplier)?.supp_name || 'Select Supplier'
                      : 'Select Supplier'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#111111" />
                </TouchableOpacity>
                {offerLetterErrors.offerLetterChargeSupplier && (
                  <Text style={styles.errorText}>{offerLetterErrors.offerLetterChargeSupplier}</Text>
                )}
              </View>
            )}

            {offerLetterData.offerLetterChargeOn === '3' && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  💳 Select Credit Card <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[styles.formInput, offerLetterErrors.offerLetterChargeAccount && styles.formInputError]}
                  onPress={() => {
                    Alert.alert(
                      'Select Credit Card',
                      'Choose credit card',
                      [
                        { text: 'Cancel' },
                        ...lookups.creditCards.map(card => ({
                          text: card.display_name || `💳 ${card.account_Name}`,
                          onPress: () => {
                            setOfferLetterData({...offerLetterData, offerLetterChargeAccount: card.account_ID.toString()});
                            setOfferLetterErrors({...offerLetterErrors, offerLetterChargeAccount: ''});
                          }
                        }))
                      ]
                    );
                  }}
                >
                  <Text style={[
                    offerLetterData.offerLetterChargeAccount ? styles.pickerValue : styles.pickerPlaceholder
                  ]}>
                    {offerLetterData.offerLetterChargeAccount
                      ? lookups.creditCards.find(c => c.account_ID.toString() === offerLetterData.offerLetterChargeAccount)?.display_name || 
                        `💳 ${lookups.creditCards.find(c => c.account_ID.toString() === offerLetterData.offerLetterChargeAccount)?.account_Name || 'Select Credit Card'}`
                      : 'Select Credit Card'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#111111" />
                </TouchableOpacity>
                {offerLetterErrors.offerLetterChargeAccount && (
                  <Text style={styles.errorText}>{offerLetterErrors.offerLetterChargeAccount}</Text>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleOfferLetterSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
              )}
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Attachments Modal */}
      {renderAttachmentsModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  mainLayout: {
    flex: 1,
    flexDirection: 'row',
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
  sideNavContainer: {
    width: 70,
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#111111',
  },
  sideNavHeader: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#111111',
  },
  sideNavTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },
  sideNavList: {
    flex: 1,
  },
  sideNavItem: {
    padding: 8,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff',
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  sideNavIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  sideNavContent: {
    alignItems: 'center',
  },
  sideNavLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 1,
  },
  sideNavStep: {
    fontSize: 9,
    color: '#111111',
    textAlign: 'center',
  },
  sideNavBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  sideNavBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#111111',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#111111',
    marginTop: 2,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
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
  taskHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskIdBadge: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  taskIdText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stepText: {
    fontSize: 11,
    fontWeight: '600',
  },
  taskBody: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#111111',
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
  mohreStatusRow: {
    backgroundColor: '#f0fdf4',
    padding: 8,
    borderRadius: 6,
    marginVertical: 4,
  },
  mohreStatusText: {
    fontWeight: '600',
    color: '#10b981',
  },
  mohreStatusWarning: {
    color: '#ef4444',
  },
  offerStatusRow: {
    backgroundColor: '#f0f9ff',
    padding: 8,
    borderRadius: 6,
    marginVertical: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 6,
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#111111',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 60, // Account for notch
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#111111',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  passengerInfo: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#111111',
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  passengerId: {
    fontSize: 14,
    color: '#111111',
    marginTop: 2,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  uploadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#fee2e2',
    marginHorizontal: 16,
    borderRadius: 8,
  },
  uploadingText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },
  attachmentsList: {
    flex: 1,
    padding: 16,
  },
  emptyAttachments: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyAttachmentsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 16,
  },
  emptyAttachmentsSubtext: {
    fontSize: 14,
    color: '#111111',
    marginTop: 8,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  attachmentIcon: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  attachmentDate: {
    fontSize: 13,
    color: '#111111',
  },
  downloadButton: {
    padding: 8,
  },
  modalForm: {
    padding: 16,
  },
  taskInfoCard: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#dc2626',
  },
  taskInfoLabel: {
    fontSize: 12,
    color: '#111111',
    fontWeight: '600',
    marginTop: 8,
  },
  taskInfoValue: {
    fontSize: 15,
    color: '#000000',
    marginTop: 2,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#111111',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  formInputError: {
    borderColor: '#ef4444',
    borderWidth: 2,
  },
  pickerContainer: {
    maxHeight: 200,
  },
  pickerValue: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  fileUploadButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#dc2626',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fileUploadText: {
    fontSize: 15,
    color: '#dc2626',
    fontWeight: '600',
  },
  selectedFileText: {
    fontSize: 14,
    color: '#10b981',
    marginTop: 8,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
