import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import apiClient from '../../services/api';
import './Receipt.css';

// Note: Install these packages:
// npm install qrcode.react signature_pad

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
  const [outstandingBalance, setOutstandingBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const companySignatureRef = useRef<HTMLCanvasElement>(null);
  const customerSignatureRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (receiptId) {
      loadReceiptData();
    }
  }, [receiptId]);

  useEffect(() => {
    // Enable basic drawing on canvases (simple signature without library)
    const enableDrawing = (canvas: HTMLCanvasElement) => {
      let isDrawing = false;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';

      const startDrawing = (e: MouseEvent | TouchEvent) => {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
        const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
        ctx.beginPath();
        ctx.moveTo(x, y);
      };

      const draw = (e: MouseEvent | TouchEvent) => {
        if (!isDrawing) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
        const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
        ctx.lineTo(x, y);
        ctx.stroke();
      };

      const stopDrawing = () => {
        isDrawing = false;
      };

      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stopDrawing);
      canvas.addEventListener('mouseout', stopDrawing);
      canvas.addEventListener('touchstart', startDrawing);
      canvas.addEventListener('touchmove', draw);
      canvas.addEventListener('touchend', stopDrawing);

      return () => {
        canvas.removeEventListener('mousedown', startDrawing);
        canvas.removeEventListener('mousemove', draw);
        canvas.removeEventListener('mouseup', stopDrawing);
        canvas.removeEventListener('mouseout', stopDrawing);
        canvas.removeEventListener('touchstart', startDrawing);
        canvas.removeEventListener('touchmove', draw);
        canvas.removeEventListener('touchend', stopDrawing);
      };
    };

    if (companySignatureRef.current) {
      enableDrawing(companySignatureRef.current);
    }
    if (customerSignatureRef.current) {
      enableDrawing(customerSignatureRef.current);
    }
  }, [receiptInfo]);

  const loadReceiptData = async () => {
    try {
      setLoading(true);
      
      // Load receipt info
      const infoResponse = await apiClient.post('/customers/receipt/get-receipt.php', {
        action: 'getReceiptInfo',
        receiptID: receiptId
      });
      
      if (infoResponse.data.success) {
        setReceiptInfo(infoResponse.data.data);
        
        // Load transactions
        const transResponse = await apiClient.post('/customers/receipt/get-receipt.php', {
          action: 'getReceiptDetails',
          receiptID: receiptId
        });
        
        if (transResponse.data.success) {
          setTransactions(transResponse.data.data);
          
          // Calculate total paid
          const paid = transResponse.data.data
            .filter((t: Transaction) => t.transactionType === 'Payment')
            .reduce((sum: number, t: Transaction) => sum + parseFloat(t.salePrice.toString()), 0);
          setTotalPaid(paid);
          
          // Get outstanding balance
          const balanceResponse = await apiClient.post('/customers/receipt/get-receipt.php', {
            action: 'getOutstandingBalance',
            customerID: infoResponse.data.data.customerID,
            currencyID: infoResponse.data.data.invoiceCurrency
          });
          
          if (balanceResponse.data.success) {
            setOutstandingBalance(balanceResponse.data.data);
          }
        }
      }
    } catch (error: any) {
      console.error('Error loading receipt:', error);
      Swal.fire('Error', error.response?.data?.message || 'Failed to load receipt', 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearSignature = (type: 'company' | 'customer') => {
    // Clear canvas manually
    const canvas = type === 'company' ? companySignatureRef.current : customerSignatureRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
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
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-12">
          <div className="card">
            <div className="row no-print">
              <div className="col-md-12 p-3">
                <button className="btn btn-danger float-end me-2" onClick={handlePrint}>
                  <i className="fa fa-print me-2"></i>
                  Print Receipt
                </button>
                <button className="btn btn-secondary float-end me-2" onClick={() => navigate(-1)}>
                  <i className="fa fa-arrow-left me-2"></i>
                  Back
                </button>
              </div>
            </div>

            <div id="printThisArea">
              <div className="card-body">
                {/* Header */}
                <div className="row">
                  <div className="col-fixed-1">
                    <img src="/logoselab.png" alt="Company Logo" style={{ height: '60px', width: '60px' }} />
                  </div>
                  <div className="col-fixed-4 margin-left-40 margin-top-20">
                    <h1 className="companyName"><b>Selab Nadiry Travel & Tourism</b></h1>
                    <p className="companyInfo">Address: Frij Murar Shop# 15, Deira, Dubai</p>
                    <p className="companyInfo">Contact: +971 4 298 4564, +971 58 514 0764</p>
                  </div>
                  <div className="col-fixed-7">
                    <table id="ReceiptInformation" className="table table-sm table-striped table-hover table-bordered">
                      <tbody>
                        <tr>
                          <td className="ReceiptInfoColumn">Receipt #</td>
                          <td colSpan={2}>{receiptInfo.invoiceNumber}</td>
                        </tr>
                        <tr>
                          <td className="ReceiptInfoColumn">Customer Name</td>
                          <td colSpan={2}>{receiptInfo.customer_name}</td>
                        </tr>
                        <tr>
                          <td className="ReceiptInfoColumn">Date</td>
                          <td>{receiptInfo.invoiceDate}</td>
                          <td>Currency: <span>{receiptInfo.currencyName}</span></td>
                        </tr>
                      </tbody>
                    </table>
                    
                    {/* QR Code */}
                    <div className="qr-code-container">
                      <QRCodeComponent 
                        receiptNumber={receiptInfo.invoiceNumber}
                        customerName={receiptInfo.customer_name}
                        date={receiptInfo.invoiceDate}
                        amount={totalPaid}
                      />
                    </div>
                  </div>
                </div>

                <hr id="headerLineBreak" />

                {/* Transactions Table */}
                <div className="table-responsive d">
                  <table id="InfoTable" className="table table-sm table-striped table-hover table-bordered">
                    <thead>
                      <tr className="bg-danger text-white">
                        <th>S#</th>
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
                    </tbody>
                  </table>
                </div>

                {/* Payment and Signatures */}
                <div id="paymentAndSign">
                  <div className="row">
                    <div className="col-md-8 offset-4">
                      <p className="font-weight-bold text-end" style={{ fontSize: '10px' }}>
                        Total Paid: <span>{formatNumber(totalPaid)}</span>
                      </p>
                      <hr />
                    </div>
                    <div className="col-md-8 offset-4">
                      <p className="font-weight-bold text-end" style={{ fontSize: '12px' }}>
                        <b>Outstanding Balance: <span>{formatNumber(outstandingBalance)}</span></b>
                      </p>
                      <hr />
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="row">
                    <div className="col-md-4" style={{ position: 'relative' }}>
                      <div className="easerButton no-print" style={{ position: 'absolute', top: 0, left: '63px' }}>
                        <button className="btn btn-info" type="button" onClick={() => clearSignature('company')}>
                          <i className="fa fa-eraser"></i>
                        </button>
                      </div>
                      <canvas ref={companySignatureRef} id="company-signature" width="200" height="50"></canvas>
                      <hr className="signatureLine" />
                      <p className="text-center company-signatureText">Company Signature</p>
                    </div>
                    <div className="col-md-4"></div>
                    <div className="col-md-4" style={{ position: 'relative' }}>
                      <div className="easerButton no-print" style={{ position: 'absolute', top: 0, left: '63px' }}>
                        <button className="btn btn-info" type="button" onClick={() => clearSignature('customer')}>
                          <i className="fa fa-eraser"></i>
                        </button>
                      </div>
                      <canvas ref={customerSignatureRef} id="customer-signature" className="float-center" width="200" height="50"></canvas>
                      <hr className="signatureLine" />
                      <p className="text-center company-signatureText">Customer Signature</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// QR Code Component (Simplified - no external dependencies needed)
function QRCodeComponent({ receiptNumber, customerName, date, amount }: {
  receiptNumber: string;
  customerName: string;
  date: string;
  amount: number;
}) {
  // For now, show receipt verification info without actual QR code
  // To enable QR code: npm install qrcode.react
  return (
    <div style={{ textAlign: 'center', marginTop: '10px', padding: '10px', background: '#f8f9fa', borderRadius: '5px', border: '1px solid #dee2e6' }}>
      <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '5px' }}>
        Receipt Verification
      </div>
      <div style={{ fontSize: '9px', color: '#666' }}>
        #{receiptNumber}
      </div>
      <small className="text-muted d-block mt-2" style={{ fontSize: '8px' }}>
        <i className="fa fa-qrcode me-1"></i>
        To enable QR code scanning, run:<br/>
        <code style={{ fontSize: '7px' }}>npm install qrcode.react</code>
      </small>
    </div>
  );
}

