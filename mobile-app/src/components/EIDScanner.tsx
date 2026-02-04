import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

interface EIDScannerProps {
  onScanComplete: (data: {
    idNumber: string;
    name?: string;
    expiryDate?: string;
    imageUri?: string;
  }) => void;
  onClose: () => void;
}

export default function EIDScanner({ onScanComplete, onClose }: EIDScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [cameraRef, setCameraRef] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleCapture = async () => {
    if (!cameraRef) return;

    try {
      const photo = await cameraRef.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      setScanned(true);
      
      // For now, we'll just extract basic info
      // In production, you'd use OCR service here
      Alert.alert(
        'Scan Complete',
        'Photo captured! Please enter EID details manually.',
        [
          {
            text: 'OK',
            onPress: () => {
              onScanComplete({
                idNumber: '784-',
                imageUri: photo.uri,
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setScanned(true);
        Alert.alert(
          'Image Selected',
          'Image loaded! Please enter EID details manually.',
          [
            {
              text: 'OK',
              onPress: () => {
                onScanComplete({
                  idNumber: '784-',
                  imageUri: result.assets[0].uri,
                });
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="camera-off" size={64} color="#dc2626" />
          <Text style={styles.errorText}>Camera Permission Denied</Text>
          <Text style={styles.errorSubtext}>
            Please enable camera access in your device settings to scan Emirates IDs
          </Text>
          <TouchableOpacity style={styles.galleryButton} onPress={handlePickFromGallery}>
            <Ionicons name="image" size={24} color="#ffffff" />
            <Text style={styles.galleryButtonText}>Pick from Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        ref={(ref) => setCameraRef(ref)}
      >
        <View style={styles.overlay}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.closeIconButton} onPress={onClose}>
              <Ionicons name="close" size={32} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.title}>Scan Emirates ID</Text>
            <View style={{ width: 32 }} />
          </View>

          {/* Scanning Frame */}
          <View style={styles.frameContainer}>
            <View style={styles.frame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <Text style={styles.instruction}>
              Position Emirates ID within the frame
            </Text>
          </View>

          {/* Bottom Actions */}
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.galleryIconButton} onPress={handlePickFromGallery}>
              <Ionicons name="image" size={28} color="#ffffff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleCapture}
              disabled={scanned}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            <View style={{ width: 56 }} />
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  closeIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  frameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    width: '80%',
    aspectRatio: 1.6,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#ffffff',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  instruction: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 24,
    textAlign: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  galleryIconButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#d1d5db',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
    gap: 8,
  },
  galleryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  closeButtonText: {
    color: '#333333',
    fontSize: 16,
  },
  text: {
    fontSize: 16,
    color: '#ffffff',
  },
});









