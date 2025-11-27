import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import './Receipt.css';

// Import Font Awesome for icons
import '@fortawesome/fontawesome-free/css/all.min.css';

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

export default function PublicReceipt() {
  const [searchParams] = useSearchParams();
  const receiptId = searchParams.get('id');
  const hash = searchParams.get('hash');
  const download = searchParams.get('download');
  
  const [receiptInfo, setReceiptInfo] = useState<ReceiptInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (receiptId && hash) {
      loadPublicReceipt();
    } else {
      setError('Invalid receipt link');
      setLoading(false);
    }
  }, [receiptId, hash]);

  const loadPublicReceipt = async () => {
    try {
      setLoading(true);
      
      // Call public API endpoint (no auth required)
      const response = await fetch(`https://app.sntrips.com/api/customers/receipt/receipt-public.php?id=${receiptId}&hash=${hash}`, {
        method: 'GET'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setReceiptInfo(data.receiptInfo);
        setTransactions(data.transactions || []);
        
        const total = (data.transactions || []).reduce((sum: number, t: any) => 
          sum + parseFloat(t.salePrice.toString()), 0);
        setTotalPaid(total);
      } else {
        setError(data.message || 'Failed to load receipt');
      }
    } catch (err: any) {
      console.error('Error loading public receipt:', err);
      setError('Failed to load receipt. Please check the link.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (transactions.length > 0) {
      document.title = `${transactions[0].PassengerName}_${totalPaid.toFixed(2)}_${receiptInfo?.invoiceNumber}.pdf`;
    }
    window.print();
    setTimeout(() => {
      document.title = `Receipt ${receiptInfo?.invoiceNumber}`;
    }, 1000);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const generateQRUrl = () => {
    if (!receiptId || !hash) return '';
    const qrData = `https://app.sntrips.com/receipt/?id=${receiptId}&hash=${hash}&download=true`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrData)}`;
  };

  // Auto-print if download=true
  useEffect(() => {
    if (download === 'true' && receiptInfo && transactions.length > 0) {
      setTimeout(() => handlePrint(), 1000);
    }
  }, [download, receiptInfo, transactions]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
        <p style={{ fontSize: '18px' }}>Loading receipt...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px', color: '#dc2626' }}>⚠️</div>
        <h2 style={{ color: '#dc2626' }}>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!receiptInfo) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
        <h2>Receipt Not Found</h2>
      </div>
    );
  }

  return (
    <div style={{ background: '#f3f4f6', minHeight: '100vh', padding: '0' }}>
      {/* Print Buttons */}
      <div className="print-buttons-container no-print">
        <button className="action-button print-a4-button" onClick={handlePrint}>
          <i className="fa fa-print me-2"></i>
          Print Receipt
        </button>
      </div>

      <div className="page">
        {/* Header */}
        <div className="header">
          <div className="logo logo-container">
            <img src="https://app.sntrips.com/public/assets/logo-white.png" alt="Company Logo" />
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
    </div>
  );
}

