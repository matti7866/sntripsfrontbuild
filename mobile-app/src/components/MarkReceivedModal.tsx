import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EIDScanner from './EIDScanner';
import { eidService } from '../services/eidService';
import type { ResidenceTask } from '../types';

interface MarkReceivedModalProps {
  visible: boolean;
  task: ResidenceTask;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MarkReceivedModal({
  visible,
  task,
  onClose,
  onSuccess,
}: MarkReceivedModalProps) {
  const [step, setStep] = useState<'form' | 'scanner'>('form');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [formData, setFormData] = useState({
    eidNumber: '784-',
    eidExpiryDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    passenger_name: '',
    gender: 'male',
    dob: '',
    occupation: '',
    establishmentName: '',
  });
  const [frontImageUri, setFrontImageUri] = useState<string | null>(null);
  const [backImageUri, setBackImageUri] = useState<string | null>(null);
  const [positions, setPositions] = useState<Array<{ position_id: number; position_name: string }>>(
    []
  );
  const [companies, setCompanies] = useState<Array<{ company_id: number; company_name: string }>>(
    []
  );
  const [showOccupationPicker, setShowOccupationPicker] = useState(false);
  const [showCompanyPicker, setShowCompanyPicker] = useState(false);
  const [occupationSearch, setOccupationSearch] = useState('');
  const [companySearch, setCompanySearch] = useState('');

  useEffect(() => {
    if (visible && task) {
      loadData();
    }
  }, [visible, task]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [residenceData, positionsData, companiesData] = await Promise.all([
        eidService.getEIDResidence(task.residenceID, task.type || 'ML'),
        eidService.getPositions(),
        eidService.getCompanies(),
      ]);

      if (residenceData && residenceData.residence) {
        const res = residenceData.residence;
        setFormData((prev) => ({
          ...prev,
          passenger_name: res.passenger_name || task.passenger_name || '',
          dob: res.dob || '',
          gender: res.gender || 'male',
          occupation: res.positionID ? String(res.positionID) : '',
          establishmentName: res.company ? String(res.company) : '',
        }));
      }

      if (positionsData && positionsData.positions) {
        setPositions(positionsData.positions);
      }

      if (companiesData && companiesData.companies) {
        setCompanies(companiesData.companies);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load form data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleScanComplete = (data: { idNumber: string; imageUri?: string }) => {
    setFormData((prev) => ({
      ...prev,
      eidNumber: data.idNumber,
    }));
    if (data.imageUri) {
      if (!frontImageUri) {
        setFrontImageUri(data.imageUri);
      } else {
        setBackImageUri(data.imageUri);
      }
    }
    setStep('form');
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.eidNumber || formData.eidNumber === '784-') {
      Alert.alert('Error', 'Please enter a valid EID number');
      return;
    }
    if (!formData.eidExpiryDate) {
      Alert.alert('Error', 'Please enter EID expiry date');
      return;
    }
    if (!formData.passenger_name.trim()) {
      Alert.alert('Error', 'Please enter passenger name');
      return;
    }
    if (!formData.dob) {
      Alert.alert('Error', 'Please enter date of birth');
      return;
    }

    setLoading(true);
    try {
      // Convert image URIs to files for upload
      const frontFile = frontImageUri
        ? {
            uri: frontImageUri,
            type: 'image/jpeg',
            name: 'eid_front.jpg',
          }
        : undefined;

      const backFile = backImageUri
        ? {
            uri: backImageUri,
            type: 'image/jpeg',
            name: 'eid_back.jpg',
          }
        : undefined;

      await eidService.markEIDReceived({
        id: task.residenceID,
        type: task.type || 'ML',
        eidNumber: formData.eidNumber,
        eidExpiryDate: formData.eidExpiryDate,
        passenger_name: formData.passenger_name,
        gender: formData.gender,
        dob: formData.dob,
        occupation: formData.occupation ? parseInt(formData.occupation) : null,
        establishmentName: formData.establishmentName
          ? parseInt(formData.establishmentName)
          : null,
        emiratesIDFrontFile: frontFile,
        emiratesIDBackFile: backFile,
      });

      Alert.alert('Success', 'Emirates ID marked as received successfully', [
        {
          text: 'OK',
          onPress: () => {
            onSuccess();
          },
        },
      ]);
    } catch (error: any) {
      console.error('Error marking as received:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to mark as received');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'scanner') {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={() => setStep('form')}>
        <EIDScanner onScanComplete={handleScanComplete} onClose={() => setStep('form')} />
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mark as Received</Text>
          <View style={{ width: 24 }} />
        </View>

        {loadingData ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Loading form data...</Text>
          </View>
        ) : (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {/* Task Info */}
            <View style={styles.taskInfo}>
              <Text style={styles.taskId}>#{task.residenceID}</Text>
              <Text style={styles.taskName}>{task.passenger_name}</Text>
              <Text style={styles.taskPassport}>Passport: {task.passportNumber}</Text>
            </View>

            {/* Scan Button */}
            <TouchableOpacity style={styles.scanButton} onPress={() => setStep('scanner')}>
              <Ionicons name="scan" size={24} color="#ffffff" />
              <Text style={styles.scanButtonText}>Scan Emirates ID</Text>
            </TouchableOpacity>

            {/* Image Previews */}
            {(frontImageUri || backImageUri) && (
              <View style={styles.imagePreviewContainer}>
                {frontImageUri && (
                  <View style={styles.imagePreview}>
                    <Image source={{ uri: frontImageUri }} style={styles.previewImage} />
                    <Text style={styles.imageLabel}>Front</Text>
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => setFrontImageUri(null)}
                    >
                      <Ionicons name="close-circle" size={24} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                )}
                {backImageUri && (
                  <View style={styles.imagePreview}>
                    <Image source={{ uri: backImageUri }} style={styles.previewImage} />
                    <Text style={styles.imageLabel}>Back</Text>
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => setBackImageUri(null)}
                    >
                      <Ionicons name="close-circle" size={24} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Form Fields */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  EID Number <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.eidNumber}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, eidNumber: text }))}
                  placeholder="784-XXXX-XXXXXXX-X"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  EID Expiry Date <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.eidExpiryDate}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, eidExpiryDate: text }))
                  }
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Passenger Full Name <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.passenger_name}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, passenger_name: text }))
                  }
                  placeholder="Full Name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Gender <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.genderButtons}>
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      formData.gender === 'male' && styles.genderButtonActive,
                    ]}
                    onPress={() => setFormData((prev) => ({ ...prev, gender: 'male' }))}
                  >
                    <Text
                      style={[
                        styles.genderButtonText,
                        formData.gender === 'male' && styles.genderButtonTextActive,
                      ]}
                    >
                      Male
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      formData.gender === 'female' && styles.genderButtonActive,
                    ]}
                    onPress={() => setFormData((prev) => ({ ...prev, gender: 'female' }))}
                  >
                    <Text
                      style={[
                        styles.genderButtonText,
                        formData.gender === 'female' && styles.genderButtonTextActive,
                      ]}
                    >
                      Female
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Date of Birth <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.dob}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, dob: text }))}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              {positions.length > 0 && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Occupation</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowOccupationPicker(true)}
                  >
                    <Text style={styles.pickerButtonText}>
                      {formData.occupation
                        ? positions.find((p) => p.position_id === parseInt(formData.occupation))
                            ?.position_name || 'Select Occupation'
                        : 'Select Occupation'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              )}

              {companies.length > 0 && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Establishment Name</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowCompanyPicker(true)}
                  >
                    <Text style={styles.pickerButtonText}>
                      {formData.establishmentName
                        ? companies.find(
                            (c) => c.company_id === parseInt(formData.establishmentName)
                          )?.company_name || 'Select Company'
                        : 'Select Company'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        )}

        {/* Footer */}
        {!loadingData && (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#ffffff" />
                  <Text style={styles.submitButtonText}>Submit</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Occupation Picker Modal */}
        <Modal visible={showOccupationPicker} transparent animationType="slide">
          <View style={styles.pickerModalOverlay}>
            <View style={styles.pickerModalContainer}>
              <View style={styles.pickerModalHeader}>
                <Text style={styles.pickerModalTitle}>Select Occupation</Text>
                <TouchableOpacity onPress={() => {
                  setShowOccupationPicker(false);
                  setOccupationSearch('');
                }}>
                  <Ionicons name="close" size={24} color="#1f2937" />
                </TouchableOpacity>
              </View>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search occupations..."
                  placeholderTextColor="#9ca3af"
                  value={occupationSearch}
                  onChangeText={setOccupationSearch}
                  autoFocus={false}
                />
                {occupationSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setOccupationSearch('')}>
                    <Ionicons name="close-circle" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                )}
              </View>
              <FlatList
                data={positions.filter((pos) =>
                  pos.position_name.toLowerCase().includes(occupationSearch.toLowerCase())
                )}
                keyExtractor={(item) => item.position_id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.pickerItem}
                    onPress={() => {
                      setFormData((prev) => ({
                        ...prev,
                        occupation: item.position_id.toString(),
                      }));
                      setShowOccupationPicker(false);
                      setOccupationSearch('');
                    }}
                  >
                    <Text style={styles.pickerItemText}>{item.position_name}</Text>
                    {formData.occupation === item.position_id.toString() && (
                      <Ionicons name="checkmark" size={20} color="#2563eb" />
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyPickerContainer}>
                    <Text style={styles.emptyPickerText}>No occupations found</Text>
                  </View>
                }
              />
            </View>
          </View>
        </Modal>

        {/* Company Picker Modal */}
        <Modal visible={showCompanyPicker} transparent animationType="slide">
          <View style={styles.pickerModalOverlay}>
            <View style={styles.pickerModalContainer}>
              <View style={styles.pickerModalHeader}>
                <Text style={styles.pickerModalTitle}>Select Establishment</Text>
                <TouchableOpacity onPress={() => {
                  setShowCompanyPicker(false);
                  setCompanySearch('');
                }}>
                  <Ionicons name="close" size={24} color="#1f2937" />
                </TouchableOpacity>
              </View>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search establishments..."
                  placeholderTextColor="#9ca3af"
                  value={companySearch}
                  onChangeText={setCompanySearch}
                  autoFocus={false}
                />
                {companySearch.length > 0 && (
                  <TouchableOpacity onPress={() => setCompanySearch('')}>
                    <Ionicons name="close-circle" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                )}
              </View>
              <FlatList
                data={companies.filter((comp) =>
                  comp.company_name.toLowerCase().includes(companySearch.toLowerCase())
                )}
                keyExtractor={(item) => item.company_id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.pickerItem}
                    onPress={() => {
                      setFormData((prev) => ({
                        ...prev,
                        establishmentName: item.company_id.toString(),
                      }));
                      setShowCompanyPicker(false);
                      setCompanySearch('');
                    }}
                  >
                    <Text style={styles.pickerItemText}>{item.company_name}</Text>
                    {formData.establishmentName === item.company_id.toString() && (
                      <Ionicons name="checkmark" size={20} color="#2563eb" />
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyPickerContainer}>
                    <Text style={styles.emptyPickerText}>No establishments found</Text>
                  </View>
                }
              />
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  taskInfo: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  taskId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  taskName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  taskPassport: {
    fontSize: 14,
    color: '#6b7280',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  imagePreview: {
    flex: 1,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  imageLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 'bold',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  form: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#dc2626',
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  genderButtonActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  genderButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  genderButtonTextActive: {
    color: '#2563eb',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    margin: 16,
    marginBottom: 8,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 10,
  },
  emptyPickerContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyPickerText: {
    fontSize: 16,
    color: '#6b7280',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

