import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import residenceService from '../../services/residenceService';
import axios from '../../services/api';
import Swal from 'sweetalert2';
import SearchableSelect from '../../components/common/SearchableSelect';
import OfferLetterModal from '../../components/residence/tasks/OfferLetterModal';
import { InsuranceModal, LabourCardModal, EVisaModal, ChangeStatusModal, MedicalModal, EmiratesIDModal, VisaStampingModal } from '../../components/residence/tasks/StepModals';
import AttachmentsModal from '../../components/residence/AttachmentsModal';
import TawjeehModal from '../../components/residence/TawjeehModal';
import ILOEModal from '../../components/residence/ILOEModal';
import RemarksModal from '../../components/residence/RemarksModal';
import PendingPaymentsModal from '../../components/residence/PendingPaymentsModal';
import CreateResidenceModal from '../../components/residence/CreateResidenceModal';
import HiddenResidencesModal from '../../components/residence/HiddenResidencesModal';
import './ResidenceTasks.css';

interface ResidenceTask {
  residenceID: number;
  datetime: string;
  passenger_name: string;
  customer_name: string;
  company_name: string;
  company_number: string;
  username: string;
  password: string;
  passportNumber: string;
  countryName: string;
  countryCode: string;
  uid: string;
  mb_number: string;
  mohreStatus: string;
  document_verify: string;
  document_verify_datetime: string;
  document_verify_message: string;
  LabourCardNumber: string;
  hold: number;
  remarks: string;
  sale_price: number;
  paid_amount: number;
  offerLetterStatus: string;
  eVisaStatus: string;
  insideOutside: string;
  tawjeeh_charge: number;
  iloe_charge: number;
  completedStep: number;
  dob?: string;
}

interface StepInfo {
  name: string;
  count: number;
  icon: string;
  showAccess?: boolean;
}

const steps: Record<string, StepInfo> = {
  '1': { name: 'Offer Letter', count: 0, icon: 'fa fa-envelope' },
  '1a': { name: 'Offer Letter (S)', count: 0, icon: 'fa fa-envelope' },
  '2': { name: 'Insurance', count: 0, icon: 'fa fa-shield' },
  '3': { name: 'Labour Card', count: 0, icon: 'fa fa-credit-card' },
  '4': { name: 'E-Visa', count: 0, icon: 'fa fa-ticket', showAccess: true },
  '4a': { name: 'E-Visa (S)', count: 0, icon: 'fa fa-file-ticket', showAccess: true },
  '5': { name: 'Change Status', count: 0, icon: 'fa fa-exchange', showAccess: true },
  '6': { name: 'Medical', count: 0, icon: 'fa fa-medkit' },
  '7': { name: 'EID', count: 0, icon: 'fa fa-id-card' },
  '8': { name: 'Visa Stamping', count: 0, icon: 'fas fa-stamp' },
  '9': { name: 'Completed', count: 0, icon: 'fa fa-hand-holding' },
};

export default function ResidenceTasks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const currentStep = searchParams.get('step') || '1';
  const companyId = searchParams.get('company_id') || '';
  const customerId = searchParams.get('customer_id') || '';
  const searchQuery = searchParams.get('search') || '';
  
  const [residences, setResidences] = useState<ResidenceTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Array<{ company_id: number; company_name: string; company_number: string; totalEmployees: number; starting_quota: number }>>([]);
  const [stepCounts, setStepCounts] = useState<Record<string, number>>({});
  const [selectedCompany, setSelectedCompany] = useState<string>(companyId);
  const [selectedCustomer, setSelectedCustomer] = useState<string>(customerId);
  
  // Lookups for dropdowns
  const [lookups, setLookups] = useState<{
    currencies: Array<{ currencyID: number; currencyName: string }>;
    accounts: Array<{ account_ID: number; account_Name: string }>;
    creditCards: Array<{ account_ID: number; account_Name: string; card_holder_name?: string; card_type?: string; bank_name?: string; accountNum?: string; display_name?: string }>;
    suppliers: Array<{ supp_id: number; supp_name: string }>;
    customers: Array<{ customer_id: number; customer_name: string }>;
    positions: Array<{ position_id: number; posiiton_name: string }>;
    nationalities: Array<{ airport_id: number; countryName: string }>;
  }>({
    currencies: [],
    accounts: [],
    creditCards: [],
    suppliers: [],
    customers: [],
    positions: [],
    nationalities: []
  });
  
  // Modal states
  const [showNewResidenceModal, setShowNewResidenceModal] = useState(false);
  const [showOfferLetterModal, setShowOfferLetterModal] = useState(false);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [showLabourCardModal, setShowLabourCardModal] = useState(false);
  const [showEVisaModal, setShowEVisaModal] = useState(false);
  const [showChangeStatusModal, setShowChangeStatusModal] = useState(false);
  const [showMedicalModal, setShowMedicalModal] = useState(false);
  const [showEmiratesIDModal, setShowEmiratesIDModal] = useState(false);
  const [showVisaStampingModal, setShowVisaStampingModal] = useState(false);
  const [showTawjeehModal, setShowTawjeehModal] = useState(false);
  const [showILOEModal, setShowILOEModal] = useState(false);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [showRemarksHistory, setShowRemarksHistory] = useState(false);
  const [showPendingPaymentsModal, setShowPendingPaymentsModal] = useState(false);
  const [showHiddenResidencesModal, setShowHiddenResidencesModal] = useState(false);
  const [selectedResidenceId, setSelectedResidenceId] = useState<number | null>(null);
  const [selectedCompanyNumber, setSelectedCompanyNumber] = useState<string>('');
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    loadCompanies();
    loadLookups();
  }, []);

  useEffect(() => {
    loadTasks();
    setCurrentPage(1); // Reset to first page when filters change
  }, [currentStep, companyId, customerId, searchQuery]);

  // Sync selectedCompany and selectedCustomer with URL parameters
  useEffect(() => {
    if (companyId !== selectedCompany) {
      setSelectedCompany(companyId);
    }
    if (customerId !== selectedCustomer) {
      setSelectedCustomer(customerId);
    }
  }, [companyId, customerId]);
  
  // Calculate pagination
  const totalPages = Math.ceil(residences.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResidences = residences.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const loadLookups = async () => {
    try {
      const data = await residenceService.getLookups();
      setLookups({
        currencies: Array.isArray(data.currencies) ? data.currencies : [],
        accounts: Array.isArray(data.accounts) ? data.accounts : [],
        creditCards: Array.isArray(data.creditCards) ? data.creditCards : [],
        suppliers: Array.isArray(data.suppliers) ? data.suppliers : [],
        customers: Array.isArray(data.customers) ? data.customers : [],
        positions: Array.isArray(data.positions) ? data.positions : [],
        nationalities: Array.isArray(data.nationalities) ? data.nationalities : []
      });
    } catch (error) {
      console.error('Error loading lookups:', error);
    }
  };

  const loadCompanies = async () => {
    try {
      const data = await residenceService.getCompanies();
      console.log('Companies loaded:', data);
      console.log('Companies count:', data?.length);
      if (data && data.length > 0) {
        console.log('First company:', data[0]);
      }
      setCompanies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await residenceService.getTasks({ 
        step: currentStep, 
        company_id: companyId || undefined, 
        customer_id: customerId || undefined,
        search: searchQuery || undefined 
      });
      
      if (data && data.residences) {
        const residencesArray = Array.isArray(data.residences) ? data.residences : [];
        setResidences(residencesArray);
      } else {
        setResidences([]);
      }
      
      if (data && data.stepCounts) {
        setStepCounts(data.stepCounts);
      }
    } catch (error: any) {
      console.error('Error loading tasks:', error);
      console.error('Error details:', error.response);
      setResidences([]); // Set empty array on error to prevent blank page
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load tasks';
      Swal.fire('Error', errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStepChange = (step: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('step', step);
    // Preserve existing search, company_id, and customer_id if they exist
    if (searchQuery) params.set('search', searchQuery);
    else params.delete('search');
    if (selectedCompany && selectedCompany !== '0') params.set('company_id', selectedCompany);
    else params.delete('company_id');
    if (selectedCustomer && selectedCustomer !== '0') params.set('customer_id', selectedCustomer);
    else params.delete('customer_id');
    setSearchParams(params, { replace: false });
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get('search') as string;
    const params = new URLSearchParams(searchParams);
    params.set('search', search);
    params.set('step', currentStep);
    if (selectedCompany) params.set('company_id', selectedCompany);
    if (selectedCustomer) params.set('customer_id', selectedCustomer);
    setSearchParams(params);
  };

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompany(companyId);
    const params = new URLSearchParams(searchParams);
    params.set('step', currentStep);
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCustomer && selectedCustomer !== '0') params.set('customer_id', selectedCustomer);
    if (companyId && companyId !== '0') {
      params.set('company_id', companyId);
    } else {
      params.delete('company_id');
    }
    setSearchParams(params);
  };

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomer(customerId);
    const params = new URLSearchParams(searchParams);
    params.set('step', currentStep);
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCompany && selectedCompany !== '0') params.set('company_id', selectedCompany);
    if (customerId && customerId !== '0') {
      params.set('customer_id', customerId);
    } else {
      params.delete('customer_id');
    }
    setSearchParams(params);
  };

  // Check eligibility based on payment thresholds for each step
  const checkEligibility = (residence: ResidenceTask, step: string): { eligible: boolean; message: string } => {
    const paidAmount = Number(residence.paid_amount) || 0;
    const salePrice = Number(residence.sale_price) || 0;
    const paymentPercentage = salePrice > 0 ? (paidAmount / salePrice) * 100 : 0;

    const thresholds: Record<string, number> = {
      '1': 2000,
      '1a': 2000,
      '2': 2000,
      '3': 3000,
      '4': 4000,
      '4a': 4000,
      '5': 4000,
      '6': 4000,
      '7': 4000,
      '8': 100 // 100% payment required for step 8
    };

    const threshold = thresholds[step];
    
    if (!threshold) {
      return { eligible: true, message: '' };
    }

    // For step 8, check full payment (100%)
    if (step === '8') {
      if (paymentPercentage >= 100) {
        return { eligible: true, message: 'Eligible' };
      } else {
        return { eligible: false, message: 'Not Eligible' };
      }
    }

    // For other steps, check minimum payment amount
    if (paidAmount >= threshold) {
      return { eligible: true, message: 'Eligible' };
    } else {
      return { eligible: false, message: 'Not Eligible' };
    }
  };

  const getActionButtons = (residence: ResidenceTask) => {
    const buttons: React.ReactNode[] = [];
    const step = currentStep;

    const buttonStyle = { padding: '2px 6px', fontSize: '11px', lineHeight: '1.2' };
    
    if (step === '10') {
      if (residence.tawjeeh_charge === 0) {
        buttons.push(
          <button key="tawjeeh" className="btn btn-warning btn-xs" style={buttonStyle} onClick={() => { setSelectedResidenceId(residence.residenceID); setShowTawjeehModal(true); }}>
            Tawjeeh
          </button>
        );
      }
      if (residence.iloe_charge === 0) {
        buttons.push(
          <button key="iloe" className="btn btn-warning btn-xs" style={buttonStyle} onClick={() => { setSelectedResidenceId(residence.residenceID); setShowILOEModal(true); }}>
            ILOE
          </button>
        );
      }
    }

    if (step === '1') {
      buttons.push(
        <button key="continue" className="btn btn-success btn-xs" style={buttonStyle} onClick={() => { setSelectedResidenceId(residence.residenceID); setShowOfferLetterModal(true); }}>
          Continue
        </button>,
        <button 
          key="doc-verify" 
          className="btn btn-info btn-xs" 
          style={buttonStyle}
          onClick={() => handleDocumentVerification(residence)}
          title="Check Document Verification"
        >
          <i className="fa fa-file-check me-1"></i>
          Check Verification
        </button>
      );
    } else if (step === '2') {
      buttons.push(
        <button key="continue" className="btn btn-success btn-xs" style={buttonStyle} onClick={() => { setSelectedResidenceId(residence.residenceID); setShowInsuranceModal(true); }}>
          Continue
        </button>,
        <button 
          key="pay-insurance" 
          className="btn btn-primary btn-xs" 
          style={buttonStyle}
          onClick={() => {
            if (residence.mb_number) {
              // Copy MB number to clipboard
              navigator.clipboard.writeText(residence.mb_number).then(() => {
                Swal.fire({
                  title: 'MB Number Copied!',
                  html: `
                    <p><strong>MB Number:</strong> ${residence.mb_number}</p>
                    <p>The MB number has been copied to your clipboard.</p>
                    <p>Click OK to open the insurance payment page.</p>
                    <p style="color: #666; font-size: 12px;">Click "Quick Pay" on the login page, then paste the MB number.</p>
                  `,
                  icon: 'success',
                  confirmButtonText: 'Open Insurance Page'
                }).then(() => {
                  // Open insurance login page
                  window.open('https://dinwpp.ae/nsure/app/#/auth/login', '_blank');
                });
              }).catch(() => {
                // If clipboard fails, still show the MB and open the page
                Swal.fire({
                  title: 'Pay Insurance',
                  html: `
                    <p><strong>MB Number:</strong> ${residence.mb_number}</p>
                    <p>Please copy this MB number manually.</p>
                    <p style="color: #666; font-size: 12px;">Click "Quick Pay" on the login page, then paste the MB number.</p>
                  `,
                  icon: 'info',
                  confirmButtonText: 'Open Insurance Page'
                }).then(() => {
                  window.open('https://dinwpp.ae/nsure/app/#/auth/login', '_blank');
                });
              });
            } else {
              Swal.fire('Error', 'MB Number not found for this residence', 'error');
            }
          }}
          title="Pay Insurance Online"
        >
          <i className="fa fa-credit-card me-1"></i>
          Pay Insurance
        </button>
      );
    } else if (step === '3') {
      buttons.push(
        <button key="continue" className="btn btn-success btn-xs" style={buttonStyle} onClick={() => { setSelectedResidenceId(residence.residenceID); setShowLabourCardModal(true); }}>
          Continue
        </button>
      );
    } else if (step === '4') {
      buttons.push(
        <button key="continue" className="btn btn-success btn-xs" style={buttonStyle} onClick={() => { setSelectedResidenceId(residence.residenceID); setShowEVisaModal(true); }}>
          Continue
        </button>
      );
    } else if (step === '5') {
      buttons.push(
        <button key="continue" className="btn btn-success btn-xs" style={buttonStyle} onClick={() => { setSelectedResidenceId(residence.residenceID); setShowChangeStatusModal(true); }}>
          Continue
        </button>
      );
    } else if (step === '6') {
      buttons.push(
        <button key="continue" className="btn btn-success btn-xs" style={buttonStyle} onClick={() => { setSelectedResidenceId(residence.residenceID); setShowMedicalModal(true); }}>
          Continue
        </button>
      );
    } else if (step === '7') {
      buttons.push(
        <button key="continue" className="btn btn-success btn-xs" style={buttonStyle} onClick={() => { setSelectedResidenceId(residence.residenceID); setShowEmiratesIDModal(true); }}>
          Continue
        </button>
      );
    } else if (step === '8') {
      buttons.push(
        <button key="continue" className="btn btn-success btn-xs" style={buttonStyle} onClick={() => { setSelectedResidenceId(residence.residenceID); setShowVisaStampingModal(true); }}>
          Continue
        </button>
      );
    }

    if (step === '1a') {
      buttons.push(
        <button 
          key="accept" 
          className="btn btn-success btn-xs" 
          style={buttonStyle}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleOfferLetterStatus(residence.residenceID, 'accepted');
          }}
        >
          Accept
        </button>,
        <button 
          key="reject" 
          className="btn btn-danger btn-xs" 
          style={buttonStyle}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleOfferLetterStatus(residence.residenceID, 'rejected');
          }}
        >
          Reject
        </button>,
        <button 
          key="pending-payments" 
          className="btn btn-warning btn-xs" 
          style={buttonStyle}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (residence.company_number) {
              setSelectedCompanyNumber(residence.company_number);
              setSelectedCompanyName(residence.company_name);
              setShowPendingPaymentsModal(true);
            } else {
              Swal.fire('Error', 'Company number not found for this residence', 'error');
            }
          }}
          title="View Pending Payments"
        >
          <i className="fa fa-money-bill-wave"></i>
        </button>
      );
    } else if (step === '4a') {
      if (residence.eVisaStatus === 'rejected') {
        buttons.push(
          <button key="reapply" className="btn btn-warning btn-xs" style={buttonStyle} onClick={() => { setSelectedResidenceId(residence.residenceID); setShowEVisaModal(true); }}>
            <i className="fa fa-redo"></i>
          </button>
        );
      } else {
        buttons.push(
          <button key="accept" className="btn btn-success btn-xs" style={buttonStyle} onClick={() => handleEVisaStatus(residence.residenceID, 'accepted')}>
            Accept
          </button>,
          <button key="reject" className="btn btn-danger btn-xs" style={buttonStyle} onClick={() => handleEVisaStatus(residence.residenceID, 'rejected')}>
            Reject
          </button>
        );
      }
    }

    // Common buttons
    if (residence.hold === 0) {
      buttons.push(
        <a key="file" href={`/residence/${residence.residenceID}?stp=${step}`} target="_blank" className="btn btn-xs btn-primary" style={buttonStyle}>
          <i className="fa fa-file"></i>
        </a>
      );
    }

    if (step !== '1a' && step !== '4a') {
      buttons.push(
        <button key="move" className="btn btn-xs btn-primary" style={buttonStyle} onClick={() => handleMoveToStep(residence.residenceID, step)}>
          Move
        </button>
      );
    }

    // Add attachments button for all steps
    buttons.push(
      <button 
        key="attachments" 
        className="btn btn-info btn-xs" 
        style={buttonStyle}
        onClick={() => { setSelectedResidenceId(residence.residenceID); setShowAttachmentsModal(true); }}
        title="View/Upload Attachments"
      >
        <i className="fa fa-paperclip"></i>
      </button>
    );

    return buttons;
  };

  const handleOfferLetterStatus = async (id: number, status: string) => {
    try {
      await residenceService.setOfferLetterStatus(id, status);
      await loadTasks();
      Swal.fire('Success', `Offer letter ${status} successfully`, 'success');
    } catch (error: any) {
      console.error('handleOfferLetterStatus error:', error);
      console.error('Error response:', error.response);
      Swal.fire('Error', error.response?.data?.message || error.message || 'Failed to update status', 'error');
    }
  };

  const handleEVisaStatus = async (id: number, status: string) => {
    try {
      await residenceService.setEVisaStatus(id, status);
      await loadTasks();
      Swal.fire('Success', `E-Visa ${status} successfully`, 'success');
    } catch (error: any) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  const handleDocumentVerification = async (residence: ResidenceTask) => {
    if (!residence.passportNumber) {
      Swal.fire('Error', 'Passport number not found', 'error');
      return;
    }

    if (!residence.countryName) {
      Swal.fire('Error', 'Nationality information not found', 'error');
      return;
    }

    try {
      Swal.fire({
        title: 'Checking Document Verification',
        html: 'Please wait while we check the verification status...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Get nationality code from lookups
      let nationality = lookups.nationalities.find(
        (n) => n.countryName === residence.countryName
      );

      // If not found, try case-insensitive search
      if (!nationality) {
        nationality = lookups.nationalities.find(
          (n) => n.countryName?.toLowerCase() === residence.countryName?.toLowerCase()
        );
      }

      // If still not found, try partial match
      if (!nationality) {
        nationality = lookups.nationalities.find(
          (n) => n.countryName?.toLowerCase().includes(residence.countryName?.toLowerCase()) ||
                 residence.countryName?.toLowerCase().includes(n.countryName?.toLowerCase())
        );
      }

      // Common country name variations and their codes
      const countryCodeMap: { [key: string]: number } = {
        'afghanistan': 209,
        'pakistan': 209,
        'india': 209,
        'bangladesh': 209,
        'sri lanka': 209,
        'nepal': 209,
        'philippines': 209,
        'egypt': 209,
        'jordan': 209,
        'syria': 209,
        'lebanon': 209,
        'yemen': 209,
        'sudan': 209,
        'somalia': 209,
        'ethiopia': 209,
        'kenya': 209,
        'uganda': 209,
        'tanzania': 209
      };

      // If still not found, use country code map
      if (!nationality && residence.countryName) {
        const countryKey = residence.countryName.toLowerCase();
        if (countryCodeMap[countryKey]) {
          nationality = { 
            airport_id: countryCodeMap[countryKey], 
            countryName: residence.countryName 
          };
        }
      }

      if (!nationality) {
        // Ask user to enter nationality code manually
        const { value: nationalityCode } = await Swal.fire({
          title: 'Nationality Code Required',
          html: `
            <div style="text-align: left;">
              <p>Could not find nationality code for: <strong>${residence.countryName}</strong></p>
              <p class="text-muted" style="font-size: 12px; margin-bottom: 15px;">
                Please enter the MOHRE nationality code manually (usually 209 for most countries)
              </p>
            </div>
          `,
          input: 'text',
          inputPlaceholder: 'Enter nationality code (e.g., 209)',
          inputValue: '209',
          showCancelButton: true,
          inputValidator: (value) => {
            if (!value) {
              return 'Please enter a nationality code!';
            }
            return null;
          }
        });

        if (!nationalityCode) {
          return; // User cancelled
        }

        nationality = { 
          airport_id: parseInt(nationalityCode), 
          countryName: residence.countryName 
        };
      }

      // Call DVS API
      console.log('Calling DVS API with:', {
        passport: residence.passportNumber,
        nationalityCode: nationality.airport_id
      });

      const response = await fetch(
        `https://api.sntrips.com/trx/dvs.php?passportNumber=${residence.passportNumber}&nationalityCode=${nationality.airport_id}`
      );
      
      console.log('DVS API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      
      const data = await response.json();
      console.log('DVS API data:', data);

      if (data.status === 'success') {
        // Save verification status to database using FormData for POST
        let saveFailed = false;
        try {
          const alertType = data.data.alert_type;
          const message = data.data.verification_message.toLowerCase();
          
          // Determine status based on message content
          let statusText = 'Pending Verification';
          
          if (message.includes('not available') || message.includes('no data') || message.includes('no information')) {
            statusText = 'No Data Available';
          } else if (message.includes('approved') || message.includes('proceed')) {
            statusText = 'Document Approved';
          } else if (message.includes('rejected') || message.includes('denied')) {
            statusText = 'Document Rejected';
          } else if (alertType === 'success') {
            statusText = 'Document Approved';
          } else if (alertType === 'danger') {
            statusText = 'Document Rejected';
          } else if (alertType === 'warning') {
            statusText = 'Document Approved';
          }
          
          const formData = new FormData();
          formData.append('residenceID', residence.residenceID.toString());
          formData.append('document_verify', statusText);
          formData.append('document_verify_message', data.data.verification_message);
          
          const saveResponse = await axios.post('/residence/update-verification.php', formData);
          console.log('Save result:', saveResponse.data);
          
          if (saveResponse.data.status !== 'success') {
            console.error('Database save failed:', saveResponse.data.message);
            saveFailed = true;
          }
        } catch (saveError) {
          console.error('Error saving to database:', saveError);
          saveFailed = true;
        }
        
        // Wait a bit for database to update
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await loadTasks(); // Reload to show updated status
        
        let icon: 'success' | 'error' | 'info' | 'warning' = 'info';
        const alertType = data.data.alert_type;
        
        if (alertType === 'success' || data.data.verification_message.toLowerCase().includes('approved')) {
          icon = 'success';
        } else if (alertType === 'danger' || data.data.verification_message.toLowerCase().includes('rejected')) {
          icon = 'error';
        } else if (alertType === 'warning') {
          icon = 'warning';
        }

        Swal.fire({
          title: 'Document Verification',
          html: `
            <div style="text-align: left;">
              <p><strong>Passport:</strong> ${residence.passportNumber}</p>
              <p><strong>Nationality:</strong> ${residence.countryName}</p>
              <p><strong>Nationality Code:</strong> ${nationality.airport_id}</p>
              <p><strong>Status:</strong></p>
              <div class="alert alert-${alertType === 'danger' ? 'danger' : alertType === 'success' ? 'success' : 'warning'}" style="text-align: left; margin-top: 10px;">
                ${data.data.verification_message}
              </div>
            </div>
          `,
          icon: icon,
          confirmButtonText: 'OK'
        });
      } else {
        Swal.fire('Error', data.message || 'Failed to check verification status', 'error');
      }
    } catch (error: any) {
      console.error('Error checking document verification:', error);
      Swal.fire({
        title: 'Error',
        html: `
          <div style="text-align: left;">
            <p>Failed to check document verification</p>
            <p class="text-danger" style="font-size: 12px; margin-top: 10px;">
              ${error.message || error.toString()}
            </p>
          </div>
        `,
        icon: 'error'
      });
    }
  };

  const handleMoveToStep = async (id: number, currentStep: string) => {
    // Find the residence to get its data
    const residence = residences.find(r => r.residenceID === id);
    if (!residence) {
      Swal.fire('Error', 'Residence not found', 'error');
      return;
    }

    // Fetch full residence details to check which steps have financial transactions
    let residenceDetails: any = null;
    try {
      const response = await residenceService.getResidence(id);
      residenceDetails = response;
    } catch (error) {
      console.error('Error fetching residence details:', error);
    }

    // Get the residence's current completedStep
    const residenceCompletedStep = residence.completedStep || 0;

    // Map step names to completedStep values
    const stepToCompletedStep: Record<string, number> = {
      '1': 1,
      '1a': 2,
      '2': 3,
      '3': 4,
      '4': 5,
      '4a': 5,
      '5': 6,
      '6': 7,
      '7': 8,
      '8': 9,
      '9': 10,
      '10': 10
    };

    // Check which steps have financial transactions (cost + account/supplier + date)
    const stepsWithTransactions: Record<string, boolean> = {
      '1': !!(residenceDetails?.offerLetterCost && (residenceDetails?.offerLetterAccount || residenceDetails?.offerLetterSupplier) && residenceDetails?.offerLetterDate),
      '2': !!(residenceDetails?.insuranceCost && (residenceDetails?.insuranceAccount || residenceDetails?.insuranceSupplier) && residenceDetails?.insuranceDate),
      '3': !!(residenceDetails?.laborCardFee && (residenceDetails?.laborCardAccount || residenceDetails?.laborCardSupplier) && residenceDetails?.laborCardDate),
      '4': !!(residenceDetails?.eVisaCost && (residenceDetails?.eVisaAccount || residenceDetails?.eVisaSupplier) && residenceDetails?.eVisaDate),
      '5': !!(residenceDetails?.changeStatusCost && (residenceDetails?.changeStatusAccount || residenceDetails?.changeStatusSupplier) && residenceDetails?.changeStatusDate),
      '6': !!(residenceDetails?.medicalTCost && (residenceDetails?.medicalAccount || residenceDetails?.medicalSupplier) && residenceDetails?.medicalDate),
      '7': !!(residenceDetails?.emiratesIDCost && (residenceDetails?.emiratesIDAccount || residenceDetails?.emiratesIDSupplier) && residenceDetails?.emiratesIDDate),
      '8': !!(residenceDetails?.visaStampingCost && (residenceDetails?.visaStampingAccount || residenceDetails?.visaStampingSupplier) && residenceDetails?.visaStampingDate),
    };

    // Define all available steps (ORIGINAL completedStep values)
    const allSteps = [
      { value: '1', label: '1 - Offer Letter', completedStep: 1, hasTransaction: stepsWithTransactions['1'] },
      { value: '1a', label: '1a - Offer Letter (Submitted)', completedStep: 2, hasTransaction: false },
      { value: '2', label: '2 - Insurance', completedStep: 3, hasTransaction: stepsWithTransactions['2'] },
      { value: '3', label: '3 - Labour Card', completedStep: 4, hasTransaction: stepsWithTransactions['3'] },
      { value: '4', label: '4 - E-Visa', completedStep: 5, hasTransaction: stepsWithTransactions['4'] },
      { value: '4a', label: '4a - E-Visa (Submitted)', completedStep: 5, hasTransaction: false },
      { value: '5', label: '5 - Change Status', completedStep: 6, hasTransaction: stepsWithTransactions['5'] },
      { value: '6', label: '6 - Medical', completedStep: 7, hasTransaction: stepsWithTransactions['6'] },
      { value: '7', label: '7 - Emirates ID', completedStep: 8, hasTransaction: stepsWithTransactions['7'] },
      { value: '8', label: '8 - Visa Stamping', completedStep: 9, hasTransaction: stepsWithTransactions['8'] },
      { value: '9', label: '9 - Completed', completedStep: 9, hasTransaction: false }
    ];

    // NEW LOGIC: Allow moving to ANY step EXCEPT:
    // 1. Current step
    // 2. Steps with existing financial transactions (to prevent data corruption)
    const availableSteps = allSteps.filter(step => {
      const isNotCurrent = step.value !== currentStep;
      const hasNoTransaction = !step.hasTransaction;
      return isNotCurrent && hasNoTransaction;
    });

    const blockedSteps = allSteps.filter(step => {
      const isNotCurrent = step.value !== currentStep;
      return isNotCurrent && step.hasTransaction;
    });

    if (availableSteps.length === 0) {
      Swal.fire('Info', 'No other steps available. All steps either have transactions or are current.', 'info');
      return;
    }

    // Group steps by direction relative to current
    const currentStepNum = parseInt(currentStep) || 0;
    const backwardSteps = availableSteps.filter(step => {
      const stepNum = parseInt(step.value) || 0;
      return stepNum < currentStepNum;
    });
    const forwardSteps = availableSteps.filter(step => {
      const stepNum = parseInt(step.value) || 0;
      return stepNum > currentStepNum;
    });
    
    let optionsHtml = '';
    
    if (backwardSteps.length > 0) {
      optionsHtml += '<optgroup label="⬅️ Move Backward (Earlier Steps)">';
      optionsHtml += backwardSteps.map(step => 
        `<option value="${step.value}">${step.label}</option>`
      ).join('');
      optionsHtml += '</optgroup>';
    }
    
    if (forwardSteps.length > 0) {
      optionsHtml += '<optgroup label="➡️ Move Forward (Later Steps)">';
      optionsHtml += forwardSteps.map(step => 
        `<option value="${step.value}">${step.label}</option>`
      ).join('');
      optionsHtml += '</optgroup>';
    }

    // Build blocked steps info
    let blockedInfo = '';
    if (blockedSteps.length > 0) {
      blockedInfo = '<div class="alert alert-warning mt-3 mb-0 text-start" style="font-size: 12px;">';
      blockedInfo += '<strong>🔒 Steps with Transactions (Cannot Move):</strong><br>';
      blockedInfo += '<ul class="mb-0 mt-1" style="padding-left: 20px;">';
      blockedInfo += blockedSteps.map(step => 
        `<li>${step.label} - Has financial data saved</li>`
      ).join('');
      blockedInfo += '</ul>';
      blockedInfo += '</div>';
    }

    const { value: targetStep } = await Swal.fire({
      title: 'Move Residence to Step',
      html: `
        <div class="text-start">
          <label class="form-label mb-2">Select Target Step:</label>
          <select id="targetStep" class="form-select">
            ${optionsHtml}
          </select>
          <small class="text-muted d-block mt-2">
            <strong>Current step:</strong> ${currentStep}<br>
            <strong>Residence completed up to step:</strong> ${residenceCompletedStep}<br>
            <div class="alert alert-info mt-2 mb-0" style="font-size: 11px; padding: 8px;">
              <strong>📝 Important:</strong><br>
              • Moving TO a step places you ON that step (not completed)<br>
              • Step is marked completed only when you SAVE data to it<br>
              • ✅ You can freely move backward/forward to empty steps<br>
              • ❌ Steps with saved transactions are locked (prevents data loss)
            </div>
          </small>
          ${blockedInfo}
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Move',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#007bff',
      cancelButtonColor: '#6c757d',
      width: '600px',
      didOpen: () => {
        const select = document.getElementById('targetStep') as HTMLSelectElement;
        if (select) {
          select.focus();
        }
      },
      preConfirm: () => {
        const select = document.getElementById('targetStep') as HTMLSelectElement;
        if (!select || !select.value) {
          Swal.showValidationMessage('Please select a target step');
          return false;
        }
        const selectedStep = allSteps.find(s => s.value === select.value);
        if (!selectedStep) {
          Swal.showValidationMessage('Invalid step selected');
          return false;
        }
        // Check if step has transactions
        if (selectedStep.hasTransaction) {
          Swal.showValidationMessage('❌ Cannot move to this step - it has financial transactions saved. Moving would cause data inconsistency.');
          return false;
        }
        if (selectedStep.value === currentStep) {
          Swal.showValidationMessage('Cannot move to the current step');
          return false;
        }
        return select.value;
      }
    });

    if (targetStep) {
      try {
        console.log(`🔄 Moving residence ${id} from step ${currentStep} to step ${targetStep}...`);
        const moveResponse = await residenceService.moveResidenceToStep(id, targetStep);
        console.log('✅ Move response:', moveResponse);
        console.log('Response success?', moveResponse.success);
        console.log('Response message:', moveResponse.message);
        console.log('Full response data:', JSON.stringify(moveResponse, null, 2));
        
        // Ask user if they want to navigate to the target step or stay
        const result = await Swal.fire({
          title: 'Residence Moved Successfully!',
          html: `
            <p>Residence has been moved to <strong>Step ${targetStep}</strong>.</p>
            <p>Would you like to:</p>
          `,
          icon: 'success',
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonText: `Go to Step ${targetStep}`,
          denyButtonText: 'Stay on Current Step',
          cancelButtonText: 'Cancel',
          confirmButtonColor: '#007bff',
          denyButtonColor: '#6c757d',
          cancelButtonColor: '#6c757d'
        });

        if (result.isConfirmed) {
          // Redirect to the target step
          handleStepChange(targetStep);
        } else {
          // Stay on current step, just reload
          await loadTasks();
        }
      } catch (error: any) {
        Swal.fire('Error', error.response?.data?.message || error.message || 'Failed to move residence', 'error');
      }
    }
  };

  return (
    <div className="residence-tasks-page-compact">
      {/* Compact Header */}
      <div className="compact-header mb-2">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div>
            <h1 className="mb-0" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#000000' }}>
              <i className="fa fa-tasks me-2"></i>
              Residence Tasks ({residences.length})
            </h1>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-success" onClick={() => setShowNewResidenceModal(true)}>
              <i className="fa fa-plus me-1"></i>
              Add New
            </button>
            <button className="btn btn-sm btn-primary" onClick={() => navigate('/residence/list')}>
              <i className="fa fa-list me-1"></i>
              List
            </button>
            <button className="btn btn-sm btn-info" onClick={() => setShowHiddenResidencesModal(true)}>
              <i className="fa fa-eye-slash me-1"></i>
              Hidden
            </button>
            <a href="/residence/cancellation" className="btn btn-sm btn-danger">
              <i className="fa fa-times-circle me-1"></i>
              Cancel
            </a>
            <a href="/residence/replacements" className="btn btn-sm btn-warning">
              <i className="fa fa-exchange me-1"></i>
              Replace
            </a>
          </div>
        </div>

        {/* Search and Filters Row */}
        <div className="row g-2 mb-2">
          {/* Search Bar */}
          <div className="col-md-4">
            <form onSubmit={handleSearch}>
              <div className="input-group input-group-sm">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  name="search"
                  defaultValue={searchQuery}
                  placeholder="Search by name or passport..."
                />
                <button type="submit" className="btn btn-sm btn-primary">
                  <i className="fa fa-search"></i>
                </button>
              </div>
            </form>
          </div>

          {/* Establishment Filter */}
          <div className="col-md-4">
            <SearchableSelect
              options={[
                { value: '0', label: 'All Establishments' },
                ...companies
                  .filter(company => company && company.company_id)
                  .map((company) => {
                    const quota = Number(company.starting_quota) || 0;
                    const employees = Number(company.totalEmployees) || 0;
                    const available = quota - employees;
                    return {
                      value: String(company.company_id || ''),
                      label: `${company.company_name || 'Unknown'} (${available})`
                    };
                  })
              ]}
              value={selectedCompany || '0'}
              onChange={(value) => handleCompanyChange(String(value))}
              placeholder="Select Establishment"
            />
          </div>

          {/* Customer Filter */}
          <div className="col-md-4">
            <SearchableSelect
              options={[
                { value: '0', label: 'All Customers' },
                ...lookups.customers
                  .filter(customer => customer && customer.customer_id)
                  .map((customer) => ({
                    value: String(customer.customer_id || ''),
                    label: customer.customer_name || 'Unknown'
                  }))
              ]}
              value={selectedCustomer || '0'}
              onChange={(value) => handleCustomerChange(String(value))}
              placeholder="Select Customer"
            />
          </div>
        </div>
      </div>

      {/* Enhanced Step Navigation Tabs */}
      <div className="mb-2">
        <div className="step-tabs-container">
          {(['1', '1a', '2', '3', '4', '4a', '5', '6', '7', '8', '9', '10'] as const).map((key) => {
            const step = steps[key];
            if (!step) return null;
            const isActive = currentStep === key;
            return (
              <button
                key={key}
                type="button"
                className={`step-tab ${isActive ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleStepChange(key);
                }}
              >
                <div className="step-tab-content">
                  <span className="step-tab-icon">
                    <i className={step.icon}></i>
                  </span>
                  <span className="step-tab-label">{step.name}</span>
                  {stepCounts[key] > 0 && (
                    <span className="step-tab-badge">{stepCounts[key]}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Compact Data Table */}
      <div className="card compact-table-card">
        <div className="card-body p-2">
          {loading ? (
            <div className="text-center py-4">
              <i className="fa fa-spinner fa-spin fa-2x" style={{ color: '#9ca3af' }}></i>
              <p className="mt-2" style={{ color: '#6b7280', fontSize: '14px' }}>Loading residences...</p>
            </div>
          ) : residences.length === 0 ? (
            <div className="text-center py-4">
              <p style={{ color: '#6b7280', fontSize: '14px' }}>No residences found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm table-striped table-bordered align-middle compact-table">
                <thead>
                  <tr>
                    <th style={{ padding: '6px 8px', fontSize: '11px', fontWeight: '600' }}>ID</th>
                    <th style={{ padding: '6px 8px', fontSize: '11px', fontWeight: '600' }}>Date</th>
                    <th style={{ padding: '6px 8px', fontSize: '11px', fontWeight: '600' }}>Passenger</th>
                    <th style={{ padding: '6px 8px', fontSize: '11px', fontWeight: '600' }}>Customer</th>
                    <th style={{ padding: '6px 8px', fontSize: '11px', fontWeight: '600' }}>
                      {currentStep === '1' ? 'Sale/Paid' : 'Company'}
                    </th>
                    <th style={{ padding: '6px 8px', fontSize: '11px', fontWeight: '600' }}>Passport</th>
                    <th style={{ padding: '6px 8px', fontSize: '11px', fontWeight: '600' }}>Remarks</th>
                    <th style={{ padding: '6px 8px', fontSize: '11px', fontWeight: '600' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedResidences.map((residence) => (
                    <tr key={residence.residenceID} className={residence.hold === 1 ? 'bg-hold' : ''} style={{ fontSize: '12px' }}>
                      <td style={{ padding: '4px 6px' }}>
                        <strong style={{ fontSize: '12px' }}>#{residence.residenceID}</strong>
                      </td>
                      <td style={{ padding: '4px 6px', fontSize: '11px' }}>
                        {new Date(residence.datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '4px 6px' }}>
                        <div style={{ fontSize: '11px' }}>
                          <img
                            src={`https://flagpedia.net/data/flags/h24/${residence.countryCode?.toLowerCase()}.png`}
                            alt={residence.countryName}
                            height="10"
                            className="me-1"
                          />
                          <strong style={{ fontSize: '11px' }}>{residence.passenger_name.toUpperCase()}</strong>
                        </div>
                        {residence.dob && (
                          <div style={{ fontSize: '9px', marginTop: '2px', color: '#666', fontWeight: '700' }}>
                            <strong>DOB:</strong> {new Date(residence.dob).toLocaleDateString('en-GB')}
                          </div>
                        )}
                        {residence.uid && (
                          <div className="text-muted" style={{ fontSize: '9px', fontWeight: '700' }}>
                            <strong>UID:</strong> {residence.uid}
                          </div>
                        )}
                        {residence.document_verify && (
                          <div style={{ marginTop: '2px' }}>
                            <span 
                              className={
                                residence.document_verify.toLowerCase().includes('approved') || residence.document_verify.toLowerCase().includes('verified')
                                  ? 'badge bg-success'
                                  : residence.document_verify.toLowerCase().includes('rejected') || residence.document_verify.toLowerCase().includes('denied')
                                  ? 'badge bg-danger'
                                  : residence.document_verify.toLowerCase().includes('pending')
                                  ? 'badge bg-warning text-dark'
                                  : residence.document_verify.toLowerCase().includes('no data') || residence.document_verify.toLowerCase().includes('not available')
                                  ? 'badge bg-secondary'
                                  : 'badge bg-info'
                              }
                              style={{ fontSize: '9px', padding: '1px 4px' }}
                              title={residence.document_verify_message || residence.document_verify}
                            >
                              {residence.document_verify}
                            </span>
                          </div>
                        )}
                        {currentStep !== '1' && (
                          <div style={{ fontSize: '10px', marginTop: '2px' }}>
                            <strong style={{ color: '#667eea' }}>Sale: {residence.sale_price.toLocaleString()}</strong>
                            {' | '}
                            <strong style={{ color: '#11998e' }}>Paid: {residence.paid_amount.toLocaleString()}</strong>
                            {' '}
                            <span className={residence.paid_amount === residence.sale_price ? 'text-success' : 'text-danger'} style={{ fontWeight: '600' }}>
                              ({residence.paid_amount === 0 ? 0 : Math.round((residence.paid_amount / residence.sale_price) * 100)}%)
                            </span>
                          </div>
                        )}
                        {/* Eligibility Indicator */}
                        {['1', '1a', '2', '3', '4', '4a', '5', '6', '7', '8'].includes(currentStep) && (() => {
                          const eligibility = checkEligibility(residence, currentStep);
                          return (
                            <div style={{ marginTop: '3px' }}>
                              <span 
                                className={`badge ${eligibility.eligible ? 'bg-success' : 'bg-danger'}`}
                                style={{ fontSize: '9px', padding: '2px 6px', fontWeight: '700' }}
                              >
                                {eligibility.eligible ? '✓ Eligible' : '✗ Not Eligible'}
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                      <td style={{ padding: '4px 6px', fontSize: '11px' }}>{residence.customer_name}</td>
                      <td style={{ padding: '4px 6px', fontSize: '11px' }}>
                        {currentStep === '1' ? (
                          // For Step 1: Show Sale Price and Paid Amount with Eligibility
                          <div>
                            <div style={{ marginBottom: '3px' }}>
                              <strong style={{ fontSize: '11px', color: '#667eea' }}>Sale:</strong>
                              <br />
                              <strong style={{ fontSize: '12px', color: '#000' }}>{residence.sale_price.toLocaleString()}</strong>
                            </div>
                            <div style={{ marginBottom: '3px' }}>
                              <strong style={{ fontSize: '11px', color: '#11998e' }}>Paid:</strong>
                              <br />
                              <strong style={{ fontSize: '12px', color: '#000' }}>{residence.paid_amount.toLocaleString()}</strong>
                              {' '}
                              <span className={residence.paid_amount === residence.sale_price ? 'text-success' : 'text-danger'} style={{ fontSize: '10px', fontWeight: '700' }}>
                                ({residence.paid_amount === 0 ? 0 : Math.round((residence.paid_amount / residence.sale_price) * 100)}%)
                              </span>
                            </div>
                            {/* Eligibility Indicator for Step 1 */}
                            {(() => {
                              const eligibility = checkEligibility(residence, currentStep);
                              return (
                                <span 
                                  className={`badge ${eligibility.eligible ? 'bg-success' : 'bg-danger'}`}
                                  style={{ fontSize: '9px', padding: '2px 6px', fontWeight: '700' }}
                                >
                                  {eligibility.eligible ? '✓ Eligible' : '✗ Not Eligible'}
                                </span>
                              );
                            })()}
                          </div>
                        ) : (
                          // For Other Steps: Show Company Info
                          <>
                            {residence.company_name && (
                              <>
                                <strong style={{ fontSize: '11px' }}>{residence.company_name}</strong>
                                {residence.company_number && <span style={{ fontSize: '10px' }}> - {residence.company_number}</span>}
                              </>
                            )}
                            {residence.mb_number && (
                              <div className="text-muted" style={{ fontSize: '9px' }}>
                                MB: {residence.mb_number}
                              </div>
                            )}
                            {residence.mohreStatus && (
                              <div style={{ fontSize: '9px' }}>
                                <span className={residence.mb_number ? '' : 'text-danger'}>
                                  {residence.mb_number ? residence.mohreStatus : 'Provide MB'}
                                </span>
                              </div>
                            )}
                            {steps[currentStep]?.showAccess && residence.username && (
                              <div className="text-muted" style={{ fontSize: '9px' }}>
                                User: {residence.username}
                                {residence.password && <> | Pass: {residence.password}</>}
                              </div>
                            )}
                          </>
                        )}
                      </td>
                      <td style={{ padding: '4px 6px', fontSize: '11px' }}>
                        {residence.passportNumber}
                        {(currentStep === '4' || currentStep === '5') && residence.insideOutside && (
                          <span className={`badge bg-${residence.insideOutside === 'inside' ? 'success' : 'danger'} ms-1`} style={{ fontSize: '9px', padding: '1px 4px' }}>
                            {residence.insideOutside.toUpperCase()}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '4px 6px' }}>
                        {residence.remarks && (
                          <div className="remarks-content" style={{ maxWidth: '150px', wordWrap: 'break-word', fontSize: '10px' }}>
                            <strong style={{ fontSize: '10px' }}>Remarks:</strong><br />
                            <span className="text-info" style={{ fontSize: '10px' }}>{residence.remarks}</span>
                            <br />
                            <button 
                              className="btn btn-xs btn-outline-primary"
                              onClick={() => { 
                                setSelectedResidenceId(residence.residenceID); 
                                setShowRemarksHistory(true);
                                setShowRemarksModal(true); 
                              }}
                              style={{ padding: '1px 4px', fontSize: '9px', marginTop: '2px' }}
                            >
                              <i className="fa fa-history"></i>
                            </button>
                          </div>
                        )}
                        <button
                          className="btn btn-xs btn-outline-success"
                          onClick={() => { 
                            setSelectedResidenceId(residence.residenceID); 
                            setShowRemarksHistory(false);
                            setShowRemarksModal(true); 
                          }}
                          style={{ padding: '1px 4px', fontSize: '9px' }}
                        >
                          <i className="fa fa-plus"></i> {residence.remarks ? 'Edit' : 'Add'}
                        </button>
                      </td>
                      <td style={{ padding: '4px 6px' }}>
                        <div className="d-flex flex-wrap gap-1">
                          {getActionButtons(residence)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Compact Pagination */}
          {!loading && residences.length > 0 && (
            <div className="pagination-container" style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '8px 12px',
              borderTop: '1px solid #e5e7eb',
              flexWrap: 'wrap',
              gap: '8px',
              fontSize: '12px'
            }}>
              {/* Items per page selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Show</span>
                <select 
                  value={itemsPerPage} 
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  ({startIndex + 1}-{Math.min(endIndex, residences.length)} of {residences.length})
                </span>
              </div>

              {/* Page navigation */}
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: currentPage === 1 ? '#f3f4f6' : '#ffffff',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    color: currentPage === 1 ? '#9ca3af' : '#374151'
                  }}
                >
                  <i className="fa fa-angle-double-left"></i>
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: currentPage === 1 ? '#f3f4f6' : '#ffffff',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    color: currentPage === 1 ? '#9ca3af' : '#374151'
                  }}
                >
                  <i className="fa fa-angle-left"></i>
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        backgroundColor: currentPage === pageNum ? '#000000' : '#ffffff',
                        color: currentPage === pageNum ? '#ffffff' : '#374151',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: currentPage === pageNum ? '600' : '400',
                        minWidth: '28px'
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: currentPage === totalPages ? '#f3f4f6' : '#ffffff',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    color: currentPage === totalPages ? '#9ca3af' : '#374151'
                  }}
                >
                  <i className="fa fa-angle-right"></i>
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: currentPage === totalPages ? '#f3f4f6' : '#ffffff',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    color: currentPage === totalPages ? '#9ca3af' : '#374151'
                  }}
                >
                  <i className="fa fa-angle-double-right"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedResidenceId && (
        <>
          <OfferLetterModal
            isOpen={showOfferLetterModal}
            onClose={() => { setShowOfferLetterModal(false); setSelectedResidenceId(null); }}
            residenceId={selectedResidenceId}
            onSuccess={loadTasks}
            companies={companies}
            currencies={lookups.currencies}
            accounts={lookups.accounts}
            creditCards={lookups.creditCards}
            suppliers={lookups.suppliers}
          />
          
          <InsuranceModal
            isOpen={showInsuranceModal}
            onClose={() => { setShowInsuranceModal(false); setSelectedResidenceId(null); }}
            residenceId={selectedResidenceId}
            onSuccess={loadTasks}
            currencies={lookups.currencies}
            accounts={lookups.accounts}
            creditCards={lookups.creditCards}
            suppliers={lookups.suppliers}
          />
          
          <LabourCardModal
            isOpen={showLabourCardModal}
            onClose={() => { setShowLabourCardModal(false); setSelectedResidenceId(null); }}
            residenceId={selectedResidenceId}
            onSuccess={loadTasks}
            currencies={lookups.currencies}
            accounts={lookups.accounts}
            creditCards={lookups.creditCards}
            suppliers={lookups.suppliers}
          />

          <EVisaModal
            isOpen={showEVisaModal}
            onClose={() => { setShowEVisaModal(false); setSelectedResidenceId(null); }}
            residenceId={selectedResidenceId}
            onSuccess={loadTasks}
            currencies={lookups.currencies}
            accounts={lookups.accounts}
            creditCards={lookups.creditCards}
            suppliers={lookups.suppliers}
          />

          <ChangeStatusModal
            isOpen={showChangeStatusModal}
            onClose={() => { setShowChangeStatusModal(false); setSelectedResidenceId(null); }}
            residenceId={selectedResidenceId}
            onSuccess={loadTasks}
            currencies={lookups.currencies}
            accounts={lookups.accounts}
            creditCards={lookups.creditCards}
            suppliers={lookups.suppliers}
          />

          <MedicalModal
            isOpen={showMedicalModal}
            onClose={() => { setShowMedicalModal(false); setSelectedResidenceId(null); }}
            residenceId={selectedResidenceId}
            onSuccess={loadTasks}
            currencies={lookups.currencies}
            accounts={lookups.accounts}
            creditCards={lookups.creditCards}
            suppliers={lookups.suppliers}
          />

          <EmiratesIDModal
            isOpen={showEmiratesIDModal}
            onClose={() => { setShowEmiratesIDModal(false); setSelectedResidenceId(null); }}
            residenceId={selectedResidenceId}
            onSuccess={loadTasks}
            currencies={lookups.currencies}
            accounts={lookups.accounts}
            creditCards={lookups.creditCards}
            suppliers={lookups.suppliers}
          />

          <VisaStampingModal
            isOpen={showVisaStampingModal}
            onClose={() => { setShowVisaStampingModal(false); setSelectedResidenceId(null); }}
            residenceId={selectedResidenceId}
            onSuccess={loadTasks}
            currencies={lookups.currencies}
            accounts={lookups.accounts}
            creditCards={lookups.creditCards}
            suppliers={lookups.suppliers}
          />
          
          {residences.find(r => r.residenceID === selectedResidenceId) && (
            <AttachmentsModal
              isOpen={showAttachmentsModal}
              onClose={() => { setShowAttachmentsModal(false); setSelectedResidenceId(null); }}
              residence={residences.find(r => r.residenceID === selectedResidenceId) as any}
              onLoadAttachments={async (residenceID) => {
                const data = await residenceService.getAttachments(residenceID);
                return Array.isArray(data) ? data : [];
              }}
              onUploadAttachment={async (residenceID, stepNumber, file, fileType) => {
                await residenceService.uploadAttachment(residenceID, stepNumber, file, fileType);
              }}
              onDeleteAttachment={async (attachmentId) => {
                await residenceService.deleteAttachment(attachmentId);
              }}
            />
          )}
          
          {residences.find(r => r.residenceID === selectedResidenceId) && (
            <TawjeehModal
              isOpen={showTawjeehModal}
              onClose={() => { setShowTawjeehModal(false); setSelectedResidenceId(null); }}
              residence={residences.find(r => r.residenceID === selectedResidenceId) as any}
              onSubmit={async (residenceID, tawjeehIncluded, tawjeehAmount) => {
                await residenceService.updateStep(residenceID, {
                  step: 10,
                  tawjeehIncluded,
                  tawjeeh_amount: tawjeehAmount
                });
                loadTasks();
              }}
            />
          )}
          
          {residences.find(r => r.residenceID === selectedResidenceId) && (
            <ILOEModal
              isOpen={showILOEModal}
              onClose={() => { setShowILOEModal(false); setSelectedResidenceId(null); }}
              residence={residences.find(r => r.residenceID === selectedResidenceId) as any}
              onSubmit={async (residenceID, insuranceIncluded, insuranceAmount, iloeFine, fineRemarks) => {
                await residenceService.updateStep(residenceID, {
                  step: 2,
                  insuranceIncluded,
                  insuranceAmount,
                  iloe_fine: iloeFine,
                  iloe_fine_remarks: fineRemarks
                });
                loadTasks();
              }}
            />
          )}
          
          {selectedResidenceId && (
            <RemarksModal
              isOpen={showRemarksModal}
              onClose={() => { 
                setShowRemarksModal(false); 
                setShowRemarksHistory(false);
                setSelectedResidenceId(null); 
              }}
              residenceId={selectedResidenceId}
              currentRemarks={residences.find(r => r.residenceID === selectedResidenceId)?.remarks || ''}
              currentStep={currentStep}
              onSuccess={loadTasks}
              showHistoryByDefault={showRemarksHistory}
            />
          )}
        </>
      )}

      {/* Pending Payments Modal */}
      <PendingPaymentsModal
        isOpen={showPendingPaymentsModal}
        onClose={() => {
          setShowPendingPaymentsModal(false);
          setSelectedCompanyNumber('');
          setSelectedCompanyName('');
        }}
        companyNumber={selectedCompanyNumber}
        companyName={selectedCompanyName}
      />

      {/* Create Residence Modal */}
      <CreateResidenceModal
        isOpen={showNewResidenceModal}
        onClose={() => setShowNewResidenceModal(false)}
        onSuccess={() => {
          setShowNewResidenceModal(false);
          loadTasks();
        }}
        lookups={{
          customers: lookups.customers,
          nationalities: lookups.nationalities.map(n => ({
            nationality_id: n.airport_id,
            nationality_name: n.countryName
          })),
          currencies: lookups.currencies,
          positions: lookups.positions.map(p => ({
            position_id: p.position_id,
            position_name: p.posiiton_name
          }))
        }}
      />

      {/* Hidden Residences Modal */}
      <HiddenResidencesModal
        isOpen={showHiddenResidencesModal}
        onClose={() => setShowHiddenResidencesModal(false)}
        onSuccess={() => {
          loadTasks(); // Reload current step to reflect changes
        }}
      />
    </div>
  );
}