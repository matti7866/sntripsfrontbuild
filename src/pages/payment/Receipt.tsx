import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';
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
  const companySignaturePad = useRef<any>(null);
  const customerSignaturePad = useRef<any>(null);

  useEffect(() => {
    if (receiptId) {
      loadReceiptData();
    }
  }, [receiptId]);

  useEffect(() => {
    // Initialize signature pads when canvas refs are ready
    if (companySignatureRef.current && customerSignatureRef.current) {
      // Try to import signature pad dynamically (optional feature)
      const loadSignaturePad = async () => {
        try {
          const SignaturePad = await import('signature_pad');
          companySignaturePad.current = new SignaturePad.default(companySignatureRef.current!);
          customerSignaturePad.current = new SignaturePad.default(customerSignatureRef.current!);
        } catch (error) {
          console.log('Signature pad not installed. To enable signatures, run: npm install signature_pad');
          // Signature feature will be disabled but receipt still works
        }
      };
      loadSignaturePad();
    }
  }, [receiptInfo]);

  const loadReceiptData = async () => {
    try {
      setLoading(true);
      
      // Load receipt info
      const infoResponse = await fetch('/api/customers/receipt/get-receipt.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getReceiptInfo', receiptID: receiptId })
      });
      const infoData = await infoResponse.json();
      
      if (infoData.success) {
        setReceiptInfo(infoData.data);
        
        // Load transactions
        const transResponse = await fetch('/api/customers/receipt/get-receipt.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getReceiptDetails', receiptID: receiptId })
        });
        const transData = await transResponse.json();
        
        if (transData.success) {
          setTransactions(transData.data);
          
          // Calculate total paid
          const paid = transData.data
            .filter((t: Transaction) => t.transactionType === 'Payment')
            .reduce((sum: number, t: Transaction) => sum + parseFloat(t.salePrice.toString()), 0);
          setTotalPaid(paid);
          
          // Get outstanding balance
          const balanceResponse = await fetch('/api/customers/receipt/get-receipt.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify({
              action: 'getOutstandingBalance',
              customerID: infoData.data.customerID,
              currencyID: infoData.data.invoiceCurrency
            })
          });
          const balanceData = await balanceResponse.json();
          
          if (balanceData.success) {
            setOutstandingBalance(balanceData.data);
          }
        }
      }
    } catch (error) {
      console.error('Error loading receipt:', error);
      Swal.fire('Error', 'Failed to load receipt', 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearSignature = (type: 'company' | 'customer') => {
    if (type === 'company' && companySignaturePad.current) {
      companySignaturePad.current.clear();
    } else if (type === 'customer' && customerSignaturePad.current) {
      customerSignaturePad.current.clear();
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

// QR Code Component (Optional - requires npm install qrcode.react)
function QRCodeComponent({ receiptNumber, customerName, date, amount }: {
  receiptNumber: string;
  customerName: string;
  date: string;
  amount: number;
}) {
  const [QRCode, setQRCode] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Try to dynamically import QR code library
    const loadQRCode = async () => {
      try {
        const module = await import('qrcode.react');
        setQRCode(() => module.QRCodeSVG);
      } catch (err) {
        console.log('QR Code library not installed. To enable QR codes, run: npm install qrcode.react');
        setError(true);
      }
    };
    loadQRCode();
  }, []);

  const qrData = JSON.stringify({
    receiptNumber,
    customerName,
    date,
    amount,
    verifyUrl: `${window.location.origin}/payment/receipt/${receiptNumber}`
  });

  if (error) {
    return (
      <div style={{ textAlign: 'center', marginTop: '10px', padding: '10px', background: '#f8f9fa', borderRadius: '5px' }}>
        <small className="text-muted">
          <i className="fa fa-info-circle me-1"></i>
          QR Code: Run <code>npm install qrcode.react</code>
        </small>
      </div>
    );
  }

  if (!QRCode) {
    return null;
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '10px' }}>
      <QRCode value={qrData} size={80} />
      <p style={{ fontSize: '8px', marginTop: '5px' }}>Scan to verify</p>
    </div>
  );
}

