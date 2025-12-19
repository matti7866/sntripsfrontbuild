import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import apiClient from '../../services/api';
import { PaymentReceiptModal } from '../../components/modals';
import './Receipt.css';

interface ReceiptInfo {
  invoiceNumber: string;
  customer_name: string;
  invoiceDate: string;
  currencyName: string;
  customerID: number;
  invoiceCurrency: number;
}

interface Transaction {
  transactionType: string;
  serviceInfo: string;
  PassengerName: string;
  formatedDate: string;
  salePrice: number;
}

export default function Receipt() {
  const { id: paramId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get receipt ID from either URL param or query string
  const receiptId = paramId || searchParams.get('id');
  
  const [modalOpen, setModalOpen] = useState(true);

  useEffect(() => {
    // Prevent body scroll when modal is open
    if (modalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [modalOpen]);

  useEffect(() => {
    // Auto-open modal when component mounts
    if (receiptId) {
      setModalOpen(true);
    }
  }, [receiptId]);

  const handleClose = () => {
    setModalOpen(false);
    // Navigate back after a short delay to allow modal close animation
    setTimeout(() => {
      navigate(-1);
    }, 300);
  };

  // Show loading state while modal is initializing
  if (!receiptId) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.5)'
      }}>
        <div className="text-center">
          <i className="fa fa-spinner fa-spin fa-3x text-white"></i>
          <p className="mt-3 text-white">Loading receipt...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      zIndex: 10000,
      background: 'rgba(0, 0, 0, 0.8)'
    }}>
      <PaymentReceiptModal
        isOpen={modalOpen}
        onClose={handleClose}
        receiptId={receiptId}
      />
    </div>
  );
}
