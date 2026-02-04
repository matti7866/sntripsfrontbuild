import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import mohreService, { EWPData, ImmigrationData, CompanyData, ApplicationStatusData } from '../services/mohreService';

type InquiryType = 'workPermit' | 'immigration' | 'company' | 'applicationStatus';

interface InquiryOption {
  value: InquiryType;
  label: string;
  icon: string;
  color: string;
  paramLabel: string;
}

export default function MOHREInquiryScreen() {
  const [inquiryType, setInquiryType] = useState<InquiryType>('workPermit');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [workPermitData, setWorkPermitData] = useState<EWPData | null>(null);
  const [immigrationData, setImmigrationData] = useState<ImmigrationData | null>(null);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [applicationStatusData, setApplicationStatusData] = useState<ApplicationStatusData | null>(null);

  const inquiryOptions: InquiryOption[] = [
    {
      value: 'workPermit',
      label: 'Work Permit Information',
      icon: 'document-text',
      color: '#dc2626',
      paramLabel: 'Permit Number',
    },
    {
      value: 'immigration',
      label: 'Immigration Status',
      icon: 'airplane',
      color: '#10b981',
      paramLabel: 'MB/Transaction Number',
    },
    {
      value: 'company',
      label: 'Company Information',
      icon: 'business',
      color: '#f59e0b',
      paramLabel: 'Company Number',
    },
    {
      value: 'applicationStatus',
      label: 'Application Status',
      icon: 'clipboard',
      color: '#06b6d4',
      paramLabel: 'MB/Transaction Number',
    },
  ];

  const getCurrentOption = () => {
    return inquiryOptions.find(opt => opt.value === inquiryType)!;
  };

  const getPlaceholder = () => {
    switch (inquiryType) {
      case 'workPermit':
        return 'e.g., 123217758';
      case 'immigration':
        return 'e.g., MB295943148AE';
      case 'company':
        return 'e.g., 1206022';
      case 'applicationStatus':
        return 'e.g., MB272236740AE';
    }
  };

  const getExampleValue = () => {
    switch (inquiryType) {
      case 'workPermit':
        return '123217758';
      case 'immigration':
        return 'MB295943148AE';
      case 'company':
        return '1206022';
      case 'applicationStatus':
        return 'MB272236740AE';
    }
  };

  const handleSelectInquiry = (value: InquiryType) => {
    setInquiryType(value);
    setInputValue('');
    clearAllData();
    setShowDropdown(false);
  };

  const handleSearch = async () => {
    if (!inputValue.trim()) {
      Alert.alert('Error', 'Please enter a value');
      return;
    }

    setLoading(true);
    clearAllData();

    try {
      switch (inquiryType) {
        case 'workPermit':
          const wpData = await mohreService.getWorkPermitInfo(inputValue);
          setWorkPermitData(wpData);
          break;
        case 'immigration':
          const immData = await mohreService.getImmigrationStatus(inputValue);
          setImmigrationData(immData);
          break;
        case 'company':
          const compData = await mohreService.getCompanyInfo(inputValue);
          setCompanyData(compData);
          break;
        case 'applicationStatus':
          const appData = await mohreService.getApplicationStatus(inputValue);
          setApplicationStatusData(appData);
          break;
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const clearAllData = () => {
    setWorkPermitData(null);
    setImmigrationData(null);
    setCompanyData(null);
    setApplicationStatusData(null);
  };

  const handleReset = () => {
    setInputValue('');
    clearAllData();
  };

  const renderInfoRow = (label: string, value: string | undefined, isHighlight?: boolean) => {
    if (!value) return null;
    const decodedValue = mohreService.decodeHtmlEntities(value);
    return (
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}:</Text>
        <Text style={[styles.infoValue, isHighlight && styles.highlightValue]}>{decodedValue}</Text>
      </View>
    );
  };

  const renderResults = () => {
    // Work Permit Results
    if (workPermitData) {
      return (
        <View>
          {workPermitData.company_info && Object.keys(workPermitData.company_info).length > 0 && (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Ionicons name="business" size={24} color="#dc2626" />
                <Text style={styles.resultTitle}>Company Information</Text>
              </View>
              <View style={styles.resultBody}>
                {renderInfoRow('Est Name', workPermitData.company_info.company_name)}
                {renderInfoRow('Company Code', workPermitData.company_info.company_code)}
                {renderInfoRow('Category', workPermitData.company_info.category)}
                {renderInfoRow('Classification', workPermitData.company_info.classification)}
              </View>
            </View>
          )}

          {workPermitData.permit_info && Object.keys(workPermitData.permit_info).length > 0 && (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Ionicons name="card" size={24} color="#10b981" />
                <Text style={styles.resultTitle}>Permit Information</Text>
              </View>
              <View style={styles.resultBody}>
                {renderInfoRow('Name', workPermitData.permit_info.person_name)}
                {renderInfoRow('Designation', workPermitData.permit_info.designation)}
                {renderInfoRow('Expiry Date', workPermitData.permit_info.expiry_date)}
                {renderInfoRow('Permit Number', workPermitData.permit_info.permit_number)}
                {renderInfoRow('Permit Type', workPermitData.permit_info.permit_type)}
                {renderInfoRow('Transaction Number', workPermitData.permit_info.transaction_number)}
              </View>
            </View>
          )}
        </View>
      );
    }

    // Immigration Results
    if (immigrationData && immigrationData.immigration_status) {
      return (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Ionicons name="airplane" size={24} color="#10b981" />
            <Text style={styles.resultTitle}>Immigration Status</Text>
          </View>
          <View style={styles.resultBody}>
            {renderInfoRow('Card Number', immigrationData.immigration_status.card_number, true)}
            {renderInfoRow('MOI Company Code', immigrationData.immigration_status.moi_company_code)}
            {renderInfoRow('File Number', immigrationData.immigration_status.file_number, true)}
            {renderInfoRow('Unified Number', immigrationData.immigration_status.unified_number, true)}
            {immigrationData.immigration_status.application_status && (
              <View style={styles.statusCard}>
                <Text style={styles.statusLabel}>Application Status:</Text>
                <Text style={styles.statusValue}>{immigrationData.immigration_status.application_status}</Text>
              </View>
            )}
          </View>
        </View>
      );
    }

    // Company Results
    if (companyData && companyData.company_info) {
      return (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Ionicons name="briefcase" size={24} color="#f59e0b" />
            <Text style={styles.resultTitle}>Company Information</Text>
          </View>
          <View style={styles.resultBody}>
            {companyData.company_info.company_name && (
              <View style={styles.companyNameCard}>
                <Text style={styles.companyName}>{mohreService.decodeHtmlEntities(companyData.company_info.company_name)}</Text>
              </View>
            )}
            {renderInfoRow('Company Number', companyData.company_info.company_number)}
            {renderInfoRow('Category', companyData.company_info.category)}
            {renderInfoRow('Emirate', companyData.company_info.emirate)}
            {renderInfoRow('License Number', companyData.company_info.license_number)}
            {companyData.company_info.mission_quota_available && (
              <View style={styles.quotaRow}>
                <Text style={styles.infoLabel}>Mission Quota:</Text>
                <Text style={styles.quotaValue}>{companyData.company_info.mission_quota_available}</Text>
              </View>
            )}
            {companyData.company_info.electronic_quota_available && (
              <View style={styles.quotaRow}>
                <Text style={styles.infoLabel}>Electronic Quota:</Text>
                <Text style={styles.quotaValue}>{companyData.company_info.electronic_quota_available}</Text>
              </View>
            )}
          </View>
        </View>
      );
    }

    // Application Status Results
    if (applicationStatusData) {
      return (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Ionicons name="clipboard" size={24} color="#06b6d4" />
            <Text style={styles.resultTitle}>Application Status</Text>
          </View>
          <View style={styles.resultBody}>
            {applicationStatusData.has_details && applicationStatusData.application_info ? (
              Object.entries(applicationStatusData.application_info).map(([key, value], index) => (
                <View key={index} style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{key}:</Text>
                  <Text style={styles.infoValue}>{value}</Text>
                </View>
              ))
            ) : (
              <View style={styles.messageCard}>
                <Text style={styles.messageText}>{applicationStatusData.status_message}</Text>
              </View>
            )}
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Selection Card */}
        <View style={styles.searchCard}>
          <Text style={styles.searchTitle}>MOHRE Inquiry</Text>
          <Text style={styles.searchSubtitle}>Select inquiry type and search</Text>

          {/* Custom Dropdown */}
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowDropdown(true)}
          >
            <View style={styles.dropdownButtonContent}>
              <Ionicons 
                name={getCurrentOption().icon as any} 
                size={24} 
                color={getCurrentOption().color} 
              />
              <View style={styles.dropdownButtonText}>
                <Text style={styles.dropdownLabel}>Select Inquiry Type</Text>
                <Text style={styles.dropdownValue}>{getCurrentOption().label}</Text>
              </View>
            </View>
            <Ionicons name="chevron-down" size={24} color="#111111" />
          </TouchableOpacity>

          {/* Parameter Input */}
          <View style={styles.paramContainer}>
            <Text style={styles.paramLabel}>
              {getCurrentOption().paramLabel} <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="create" size={20} color="#111111" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={getPlaceholder()}
                value={inputValue}
                onChangeText={setInputValue}
                editable={!loading}
                placeholderTextColor="#333333"
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.exampleButton}
            onPress={() => setInputValue(getExampleValue())}
          >
            <Ionicons name="bulb-outline" size={16} color="#dc2626" />
            <Text style={styles.exampleText}>Try example: {getExampleValue()}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.searchButton, loading && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={loading}
          >
            {loading ? (
              <>
                <ActivityIndicator color="#ffffff" size="small" />
                <Text style={styles.searchButtonText}>Searching...</Text>
              </>
            ) : (
              <>
                <Ionicons name="search" size={20} color="#ffffff" />
                <Text style={styles.searchButtonText}>Search</Text>
              </>
            )}
          </TouchableOpacity>

          {(workPermitData || immigrationData || companyData || applicationStatusData) && (
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Ionicons name="refresh" size={20} color="#111111" />
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Results */}
        {renderResults()}
      </ScrollView>

      {/* Dropdown Modal */}
      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDropdown(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowDropdown(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Inquiry Type</Text>
              <TouchableOpacity onPress={() => setShowDropdown(false)}>
                <Ionicons name="close" size={24} color="#111111" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={[styles.optionItem, inquiryType === 'workPermit' && styles.optionItemActive]}
              onPress={() => handleSelectInquiry('workPermit')}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#fee2e2' }]}>
                <Ionicons name="document-text" size={24} color="#dc2626" />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionLabel}>Work Permit Information</Text>
                <Text style={styles.optionParam}>Enter: Permit Number</Text>
              </View>
              {inquiryType === 'workPermit' && (
                <Ionicons name="checkmark-circle" size={24} color="#dc2626" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionItem, inquiryType === 'immigration' && styles.optionItemActive]}
              onPress={() => handleSelectInquiry('immigration')}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#d1fae5' }]}>
                <Ionicons name="airplane" size={24} color="#10b981" />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionLabel}>Immigration Status</Text>
                <Text style={styles.optionParam}>Enter: MB/Transaction Number</Text>
              </View>
              {inquiryType === 'immigration' && (
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionItem, inquiryType === 'company' && styles.optionItemActive]}
              onPress={() => handleSelectInquiry('company')}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="business" size={24} color="#f59e0b" />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionLabel}>Company Information</Text>
                <Text style={styles.optionParam}>Enter: Company Number</Text>
              </View>
              {inquiryType === 'company' && (
                <Ionicons name="checkmark-circle" size={24} color="#f59e0b" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionItem, inquiryType === 'applicationStatus' && styles.optionItemActive]}
              onPress={() => handleSelectInquiry('applicationStatus')}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#cffafe' }]}>
                <Ionicons name="clipboard" size={24} color="#06b6d4" />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionLabel}>Application Status</Text>
                <Text style={styles.optionParam}>Enter: MB/Transaction Number</Text>
              </View>
              {inquiryType === 'applicationStatus' && (
                <Ionicons name="checkmark-circle" size={24} color="#06b6d4" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  searchCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  searchSubtitle: {
    fontSize: 14,
    color: '#111111',
    marginBottom: 16,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#dc2626',
    padding: 16,
    marginBottom: 20,
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownButtonText: {
    marginLeft: 12,
    flex: 1,
  },
  dropdownLabel: {
    fontSize: 12,
    color: '#111111',
    marginBottom: 2,
  },
  dropdownValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  paramContainer: {
    marginBottom: 16,
  },
  paramLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#111111',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
  },
  exampleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 4,
  },
  exampleText: {
    fontSize: 14,
    color: '#dc2626',
    marginLeft: 4,
  },
  searchButton: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  searchButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resetButton: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  resetButtonText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resultCard: {
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
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#111111',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginLeft: 12,
  },
  resultBody: {
    gap: 12,
  },
  infoRow: {
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: '#000000',
    lineHeight: 22,
  },
  highlightValue: {
    color: '#dc2626',
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 15,
    color: '#047857',
    lineHeight: 22,
  },
  companyNameCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#991b1b',
    textAlign: 'center',
  },
  quotaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  quotaValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  messageCard: {
    backgroundColor: '#e0f2fe',
    borderRadius: 8,
    padding: 16,
  },
  messageText: {
    fontSize: 15,
    color: '#000000',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#111111',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff',
  },
  optionItemActive: {
    backgroundColor: '#f0f9ff',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  optionParam: {
    fontSize: 13,
    color: '#111111',
  },
});
