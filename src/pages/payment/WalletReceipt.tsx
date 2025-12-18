import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import apiClient from '../../services/api';
import './Receipt.css';

interface WalletTransaction {
  transaction_id: number;
  customer_id: number;
  customer_name: string;
  wallet_account_number: string;
  transaction_type: string;
  amount: number;
  currency_name: string;
  currency_symbol: string;
  balance_before: number;
  balance_after: number;
  account_name: string;
  staff_name: string;
  remarks: string | null;
  datetime: string;
}

export default function WalletReceipt() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [transaction, setTransaction] = useState<WalletTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [printSize, setPrintSize] = useState<'A4' | 'A5'>('A4');
  const [receiptNumber, setReceiptNumber] = useState('');

  useEffect(() => {
    if (id) {
      loadTransactionData();
    }
  }, [id]);

  const loadTransactionData = async () => {
    try {
      setLoading(true);
      
      console.log('Loading receipt for transaction ID:', id);
      
      const response = await apiClient.post('/wallet/get-receipt.php', {
        transaction_id: id
      });
      
      console.log('Wallet Receipt Full Response:', response);
      console.log('Wallet Receipt Response Data:', response.data);
      console.log('Response success:', response.data.success);
      
      if (response.data.success) {
        // JWTHelper merges data directly into response, not nested under 'data'
        // Extract transaction by removing success and message fields
        const { success, message, ...transactionData } = response.data;
        console.log('Extracted transaction data:', transactionData);
        
        if (transactionData.transaction_id) {
          setTransaction(transactionData as WalletTransaction);
          // Generate receipt number
          setReceiptNumber(`WLT-${String(transactionData.transaction_id).padStart(6, '0')}`);
        } else {
          throw new Error('Transaction data is invalid');
        }
      } else {
        console.error('API returned success:false');
        console.error('Full API response:', response.data);
        throw new Error(response.data.message || 'Failed to load receipt');
      }
    } catch (error: any) {
      console.error('Error loading wallet receipt:', error);
      console.error('Error response:', error.response);
      Swal.fire('Error', error.response?.data?.message || error.message || 'Failed to load receipt', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (size: 'A4' | 'A5') => {
    setPrintSize(size);
    
    if (transaction) {
      document.title = `Wallet_${transaction.transaction_type}_${transaction.customer_name}_${transaction.amount.toFixed(2)}.pdf`;
    }
    
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.title = `Wallet Receipt ${receiptNumber}`;
      }, 1000);
    }, 100);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Generate QR code URL
  const generateQRUrl = () => {
    if (!id) return '';
    const qrData = `https://app.sntrips.com/wallet/receipt/${id}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrData)}`;
  };

  if (loading) {
    return (
      <div className="container-fluid mt-5">
        <div className="text-center">
          <i className="fa fa-spinner fa-spin fa-3x"></i>
          <p className="mt-3">Loading receipt...</p>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="container-fluid mt-5">
        <div className="alert alert-danger">Transaction not found</div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          <i className="fa fa-arrow-left me-2"></i>Go Back
        </button>
      </div>
    );
  }

  const transactionTypeLabel = transaction.transaction_type.charAt(0).toUpperCase() + transaction.transaction_type.slice(1);

  return (
    <>
      {/* Print Buttons (Fixed position, hidden on print) */}
      <div className="print-buttons-container no-print">
        <button className="action-button print-a4-button" onClick={() => handlePrint('A4')}>
          <i className="fa fa-print me-2"></i>
          Print A4
        </button>
        <button className="action-button print-a5-button" onClick={() => handlePrint('A5')}>
          <i className="fa fa-print me-2"></i>
          Print A5
        </button>
      </div>

      <div className={`page print-${printSize.toLowerCase()}`}>
        {/* Header */}
        <div className="header">
          <div className="logo logo-container">
            <img src="/assets/logo-white.png" alt="Company Logo" />
          </div>
          <div className="heading">
            <span>WALLET RECEIPT</span>
          </div>
          <div className="qr">
            <img src={generateQRUrl()} alt="QR Code" />
          </div>
        </div>

        {/* Data Section */}
        <div className="data">
          <div className="row">
            <div className="col">
              <div className="label">Receipt #:</div>
              <div className="value">{receiptNumber}</div>
            </div>
            <div className="col">
              <div className="label">Date:</div>
              <div className="value">{formatDate(transaction.datetime)}</div>
            </div>
            <div className="col">
              <div className="label">Type:</div>
              <div className="value">{transactionTypeLabel}</div>
            </div>
          </div>
          
          <div className="row">
            <div className="col col-full">
              <div className="label">Customer Name</div>
              <div className="value">{transaction.customer_name}</div>
            </div>
          </div>

          <div className="row">
            <div className="col">
              <div className="label">Wallet Account:</div>
              <div className="value">{transaction.wallet_account_number}</div>
            </div>
            <div className="col">
              <div className="label">Processed By:</div>
              <div className="value">{transaction.staff_name}</div>
            </div>
            <div className="col">
              <div className="label">Currency:</div>
              <div className="value">{transaction.currency_name}</div>
            </div>
          </div>

          {/* Transaction Table */}
          <table border={1} width="100%" style={{ borderCollapse: 'collapse' }} cellPadding="4" cellSpacing="0">
            <thead>
              <tr>
                <th>SR#</th>
                <th>Description</th>
                <th>Account</th>
                <th>Remarks</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>{transactionTypeLabel}</td>
                <td>{transaction.account_name}</td>
                <td>{transaction.remarks || '-'}</td>
                <td>{formatNumber(transaction.amount)}</td>
              </tr>
              <tr>
                <td colSpan={4} align="right" className="text-right">
                  <strong>Balance Before: </strong>
                </td>
                <td>
                  {formatNumber(transaction.balance_before)} {transaction.currency_symbol}
                </td>
              </tr>
              <tr>
                <td colSpan={4} align="right" className="text-right">
                  <strong>{transactionTypeLabel} Amount: </strong>
                </td>
                <td>
                  <span style={{ color: transaction.transaction_type === 'deposit' || transaction.transaction_type === 'refund' ? '#28a745' : '#dc3545' }}>
                    {transaction.transaction_type === 'deposit' || transaction.transaction_type === 'refund' ? '+' : '-'}
                    {formatNumber(transaction.amount)} {transaction.currency_symbol}
                  </span>
                </td>
              </tr>
              <tr>
                <td colSpan={4} align="right" className="text-right">
                  <strong>New Balance: </strong>
                </td>
                <td>
                  <strong>{formatNumber(transaction.balance_after)} {transaction.currency_symbol}</strong>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Footer Text */}
          <div>
            <div className="english">
              This is a computer generated receipt and does not require any signature.
            </div>
            <div className="arabic">
              هذه إيصال مولد بواسطة الكمبيوتر ولا يتطلب أي توقيع.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

