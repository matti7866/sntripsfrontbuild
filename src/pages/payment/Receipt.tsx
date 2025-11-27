import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import apiClient from '../../services/api';
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
  
  const [receiptInfo, setReceiptInfo] = useState<ReceiptInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (receiptId) {
      loadReceiptData();
    }
  }, [receiptId]);

  const loadReceiptData = async () => {
    try {
      setLoading(true);
      
      // Load receipt info
      const infoResponse = await apiClient.post('/customers/receipt/get-receipt.php', {
        action: 'getReceiptInfo',
        receiptID: receiptId
      });
      
      console.log('Receipt Info Response:', infoResponse.data);
      
      if (infoResponse.data.success) {
        // JWTHelper merges data directly into response
        const { success, message, ...receiptData } = infoResponse.data;
        const receiptInfo = receiptData as ReceiptInfo;
        setReceiptInfo(receiptInfo);
        
        // Load transactions
        const transResponse = await apiClient.post('/customers/receipt/get-receipt.php', {
          action: 'getReceiptDetails',
          receiptID: receiptId
        });
        
        console.log('Transactions Response:', transResponse.data);
        
        if (transResponse.data.success) {
          // Extract transactions from response
          const { success: transSuccess, message: transMessage, ...transObj } = transResponse.data;
          const transactionsData = Object.values(transObj).filter(item => typeof item === 'object');
          
          if (Array.isArray(transactionsData) && transactionsData.length > 0) {
            setTransactions(transactionsData);
            
            // Calculate total paid (sum of all transactions)
            const total = transactionsData.reduce((sum: number, t: any) => 
              sum + parseFloat(t.salePrice.toString()), 0);
            setTotalPaid(total);
          }
        }
      }
    } catch (error: any) {
      console.error('Error loading receipt:', error);
      Swal.fire('Error', error.response?.data?.message || error.message || 'Failed to load receipt', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    // Set document title for PDF filename
    if (transactions.length > 0) {
      document.title = `${transactions[0].PassengerName}_${totalPaid.toFixed(2)}_${receiptInfo?.invoiceNumber}.pdf`;
    }
    window.print();
    // Reset title after print
    setTimeout(() => {
      document.title = `Print Receipt ${receiptInfo?.invoiceNumber}`;
    }, 1000);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Generate QR code URL
  const generateQRUrl = () => {
    if (!receiptId || !receiptInfo) return '';
    const hash = generateHash(receiptId);
    const qrData = `https://app.sntrips.com/receipt/?id=${receiptId}&hash=${hash}&download=true`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrData)}`;
  };

  // Simple hash function (matching PHP: md5($id . '::::::' . $id))
  const generateHash = (id: string) => {
    // For now, return a placeholder. In production, implement proper MD5 or use backend-generated hash
    return btoa(id + '::::::' + id); // Base64 encoding as placeholder
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

  if (!receiptInfo) {
    return (
      <div className="container-fluid mt-5">
        <div className="alert alert-danger">Receipt not found</div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          <i className="fa fa-arrow-left me-2"></i>Go Back
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Print Button (Fixed position, hidden on print) */}
      <button className="action-button print-button no-print" onClick={handlePrint}>
        Print Receipt
      </button>

      <div className="page">
        {/* Header */}
        <div className="header">
          <div className="logo logo-container">
            <img src="/assets/logo-white.png" alt="Company Logo" />
          </div>
          <div className="heading">
            <span>PAYMENT RECEIPT</span>
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
              <div className="value">{receiptInfo.invoiceNumber}</div>
            </div>
            <div className="col">
              <div className="label">Date:</div>
              <div className="value">{receiptInfo.invoiceDate}</div>
            </div>
            <div className="col">
              <div className="label">Currency:</div>
              <div className="value">{receiptInfo.currencyName}</div>
            </div>
          </div>
          
          <div className="row">
            <div className="col col-full">
              <div className="label">Customer Name</div>
              <div className="value">{receiptInfo.customer_name}</div>
            </div>
          </div>

          {/* Transactions Table */}
          <table border={1} width="100%" style={{ borderCollapse: 'collapse' }} cellPadding="4" cellSpacing="0">
            <thead>
              <tr>
                <th>SR#</th>
                <th>Transaction</th>
                <th>Service</th>
                <th>Passenger</th>
                <th>Date</th>
                <th>Sale Price</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{transaction.transactionType}</td>
                  <td>{transaction.serviceInfo}</td>
                  <td>{transaction.PassengerName}</td>
                  <td>{transaction.formatedDate}</td>
                  <td>{formatNumber(transaction.salePrice)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={5} align="right" className="text-right">
                  <strong>Total Paid: </strong>
                </td>
                <td>
                  {formatNumber(totalPaid)} {receiptInfo.currencyName}
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
