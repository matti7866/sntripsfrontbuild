import { useState, useEffect, useRef } from 'react';
import apiClient from '../../services/api';
import Swal from 'sweetalert2';
import './Modal.css';
import '../../pages/payment/Receipt.css';

// Add styles for receipt modal
const receiptModalStyles = `
  .receipt-modal .modal-body {
    background: #f5f5f5 !important;
  }
  
  .receipt-modal .page {
    background: white;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .receipt-print-buttons {
    position: sticky;
    top: 0;
    background: #f5f5f5;
    padding: 10px;
    margin: -20px -20px 20px -20px;
    z-index: 10;
    border-bottom: 1px solid #e5e7eb;
  }
  
  @media print {
    .receipt-print-buttons,
    .modal-header,
    .modal-footer,
    .modal-overlay {
      display: none !important;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = receiptModalStyles;
  if (!document.getElementById('payment-receipt-modal-styles')) {
    styleSheet.id = 'payment-receipt-modal-styles';
    document.head.appendChild(styleSheet);
  }
}

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

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptId: number | string | null;
}

export default function PaymentReceiptModal({
  isOpen,
  onClose,
  receiptId
}: PaymentReceiptModalProps) {
  const [receiptInfo, setReceiptInfo] = useState<ReceiptInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loading, setLoading] = useState(false);
  const [printSize, setPrintSize] = useState<'A4' | 'A5'>('A4');
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && receiptId) {
      loadReceiptData();
    } else {
      setReceiptInfo(null);
      setTransactions([]);
      setTotalPaid(0);
    }
  }, [isOpen, receiptId]);

  const loadReceiptData = async () => {
    if (!receiptId) return;
    
    try {
      setLoading(true);
      
      // Load receipt info
      const infoResponse = await apiClient.post('/customers/receipt/get-receipt.php', {
        action: 'getReceiptInfo',
        receiptID: receiptId
      });
      
      console.log('Receipt Info Response:', infoResponse.data);
      
      if (infoResponse.data.success) {
        const { success, message, ...receiptData } = infoResponse.data;
        const receiptInfoData = receiptData as ReceiptInfo;
        setReceiptInfo(receiptInfoData);
        
        // Load transactions
        const transResponse = await apiClient.post('/customers/receipt/get-receipt.php', {
          action: 'getReceiptDetails',
          receiptID: receiptId
        });
        
        console.log('Transactions Response:', transResponse.data);
        
        if (transResponse.data.success) {
          const { success: transSuccess, message: transMessage, ...transObj } = transResponse.data;
          const transactionsData = Object.values(transObj).filter(item => typeof item === 'object');
          
          if (Array.isArray(transactionsData) && transactionsData.length > 0) {
            setTransactions(transactionsData as Transaction[]);
            
            // Calculate total paid
            const total = transactionsData.reduce((sum: number, t: any) => 
              sum + parseFloat(t.salePrice.toString()), 0);
            setTotalPaid(total);
          }
        }
      } else {
        throw new Error(infoResponse.data.message || 'Failed to load receipt');
      }
    } catch (error: any) {
      console.error('Error loading receipt:', error);
      Swal.fire('Error', error.response?.data?.message || error.message || 'Failed to load receipt', 'error');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (size: 'A4' | 'A5') => {
    if (!printAreaRef.current) {
      Swal.fire('Error', 'Receipt content not found', 'error');
      return;
    }

    setPrintSize(size);
    
    // Create a hidden iframe for printing
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    printFrame.style.visibility = 'hidden';
    
    document.body.appendChild(printFrame);
    
    const printDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
    if (!printDoc) {
      Swal.fire('Error', 'Could not create print window', 'error');
      return;
    }

    const printContent = printAreaRef.current.innerHTML;

    printDoc.open();
    printDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Receipt ${receiptInfo?.invoiceNumber || ''}</title>
          <meta charset="utf-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            @page {
              size: ${size} portrait;
              margin: 5mm;
            }
            
            body {
              font-family: 'Poppins', Arial, sans-serif;
              font-size: 0.9rem;
              color: #000;
              background: white;
              padding: 0;
              margin: 0;
            }
            
            .page {
              display: block;
              width: ${size === 'A4' ? '8.27in' : '5.83in'};
              margin: 0 auto;
              background: white;
              border: 1px solid #000;
            }
            
            .header {
              display: flex;
              width: 100%;
              height: ${size === 'A4' ? '1.3in' : '1.2in'};
              align-items: center;
              justify-content: space-between;
              border-bottom: 1px solid #000;
              padding: 10px 15px;
            }
            
            .logo-container {
              width: ${size === 'A4' ? '1.8in' : '1.5in'};
              background-color: #000;
              padding: 12px;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            .logo-container img {
              width: 100%;
              height: auto;
              max-width: 200px;
            }
            
            .heading {
              font-size: ${size === 'A4' ? '22px' : '20px'};
              font-weight: bold;
              text-align: center;
              flex: 1;
            }
            
            .heading span {
              padding: 8px 20px;
              border: 2px dashed #000;
              border-radius: 10px;
            }
            
            .qr {
              height: ${size === 'A4' ? '1.1in' : '1in'};
              width: ${size === 'A4' ? '1.1in' : '1in'};
            }
            
            .qr img {
              width: 100%;
              height: 100%;
            }
            
            .data {
              padding: ${size === 'A4' ? '15px 20px' : '20px'};
            }
            
            .row {
              margin-bottom: ${size === 'A4' ? '10px' : '15px'};
              display: flex;
            }
            
            .row .col {
              width: 33%;
              margin: 5px;
            }
            
            .col .label {
              background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
              padding: ${size === 'A4' ? '8px 10px' : '6px'};
              font-weight: 600;
              border-radius: 4px 4px 0 0;
              border: 1px solid #dee2e6;
              border-bottom: none;
              font-size: ${size === 'A4' ? '1.1rem' : '0.75rem'};
            }
            
            .col .value {
              padding: ${size === 'A4' ? '8px 10px' : '6px'};
              border: 1px solid #dee2e6;
              border-top: 2px solid #007bff;
              border-radius: 0 0 4px 4px;
              font-weight: 500;
              background: white;
              font-size: ${size === 'A4' ? '1.2rem' : '0.75rem'};
            }
            
            .col.col-full {
              width: 100%;
            }
            
            table {
              margin-top: ${size === 'A4' ? '12px' : '15px'};
              margin-bottom: ${size === 'A4' ? '12px' : '20px'};
              border: 2px solid #000;
              width: 100%;
              border-collapse: collapse;
            }
            
            table th {
              background: linear-gradient(to bottom, #e9ecef, #dee2e6);
              padding: ${size === 'A4' ? '10px 8px' : '8px'};
              text-align: center;
              font-weight: 700;
              border-bottom: 2px solid #000;
              font-size: ${size === 'A4' ? '1rem' : '0.7rem'};
            }
            
            table td {
              padding: ${size === 'A4' ? '8px 6px' : '8px'};
              text-align: center;
              border: 1px solid #dee2e6;
              font-size: ${size === 'A4' ? '0.95rem' : '0.7rem'};
            }
            
            table tbody tr:last-child td {
              font-weight: 700;
              background-color: #f8f9fa;
              font-size: ${size === 'A4' ? '1.05rem' : '0.7rem'};
            }
            
            table td.text-right {
              text-align: right;
            }
            
            .english, .arabic {
              margin-top: ${size === 'A4' ? '12px' : '15px'};
              font-style: italic;
              color: #555;
              text-align: center;
              font-size: ${size === 'A4' ? '0.95rem' : '0.8rem'};
            }
            
            .arabic {
              direction: rtl;
            }
            
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                margin: 0;
                padding: 0;
              }
              
              .page {
                border: 2px solid #000;
                box-shadow: none;
                margin: 0;
              }
              
              .logo-container {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                background-color: #000 !important;
              }
              
              table th {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printDoc.close();

    // Wait for content to load, then print
    setTimeout(() => {
      if (printFrame.contentWindow) {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
      }
      
      // Clean up after printing
      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 1000);
    }, 250);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const generateQRUrl = () => {
    if (!receiptId || !receiptInfo) return '';
    const hash = generateHash(String(receiptId));
    const qrData = `https://app.sntrips.com/receipt/?id=${receiptId}&hash=${hash}&download=true`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrData)}`;
  };

  const generateHash = (id: string) => {
    return btoa(id + '::::::' + id);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container receipt-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', width: '95vw' }}>
        <div className="modal-header">
          <h3>
            <i className="fa fa-receipt me-2"></i>
            Payment Receipt {receiptInfo?.invoiceNumber || ''}
          </h3>
          <button className="modal-close" onClick={onClose}>
            <i className="fa fa-times"></i>
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px', overflowY: 'auto', maxHeight: 'calc(90vh - 120px)' }}>
          {loading ? (
            <div className="text-center py-5">
              <i className="fa fa-spinner fa-spin fa-3x text-primary"></i>
              <p className="mt-3">Loading receipt...</p>
            </div>
          ) : receiptInfo ? (
            <>
              {/* Print Buttons */}
              <div className="receipt-print-buttons d-flex justify-content-end gap-2 mb-3" style={{ display: 'flex' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => handlePrint('A4')}
                  style={{ minWidth: '120px' }}
                >
                  <i className="fa fa-print me-2"></i>
                  Print A4
                </button>
                <button
                  className="btn btn-success"
                  onClick={() => handlePrint('A5')}
                  style={{ minWidth: '120px' }}
                >
                  <i className="fa fa-print me-2"></i>
                  Print A5
                </button>
              </div>

              {/* Receipt Content */}
              <div ref={printAreaRef} className={`page print-${printSize.toLowerCase()}`}>
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
          ) : (
            <div className="text-center py-5">
              <i className="fa fa-exclamation-triangle fa-3x text-warning mb-3"></i>
              <p>Receipt not found</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

