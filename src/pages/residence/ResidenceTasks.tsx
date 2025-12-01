import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import residenceService from '../../services/residenceService';
import Swal from 'sweetalert2';
import SearchableSelect from '../../components/common/SearchableSelect';
import OfferLetterModal from '../../components/residence/tasks/OfferLetterModal';
import { InsuranceModal, LabourCardModal, EVisaModal, ChangeStatusModal, MedicalModal, EmiratesIDModal, VisaStampingModal, ContractSubmissionModal } from '../../components/residence/tasks/StepModals';
import AttachmentsModal from '../../components/residence/AttachmentsModal';
import TawjeehModal from '../../components/residence/TawjeehModal';
import ILOEModal from '../../components/residence/ILOEModal';
import RemarksModal from '../../components/residence/RemarksModal';
import PendingPaymentsModal from '../../components/residence/PendingPaymentsModal';
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
  '9': { name: 'Contract Submission', count: 0, icon: 'fas fa-file-signature' },
  '10': { name: 'Completed', count: 0, icon: 'fa fa-hand-holding' },
};

export default function ResidenceTasks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const currentStep = searchParams.get('step') || '1';
  const companyId = searchParams.get('company_id') || '';
  const searchQuery = searchParams.get('search') || '';
  
  const [residences, setResidences] = useState<ResidenceTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Array<{ company_id: number; company_name: string; company_number: string; totalEmployees: number; starting_quota: number }>>([]);
  const [stepCounts, setStepCounts] = useState<Record<string, number>>({});
  const [selectedCompany, setSelectedCompany] = useState<string>(companyId);
  
  // Lookups for dropdowns
  const [lookups, setLookups] = useState<{
    currencies: Array<{ currencyID: number; currencyName: string }>;
    accounts: Array<{ account_ID: number; account_Name: string }>;
    suppliers: Array<{ supp_id: number; supp_name: string }>;
    customers: Array<{ customer_id: number; customer_name: string }>;
    positions: Array<{ position_id: number; posiiton_name: string }>;
    nationalities: Array<{ airport_id: number; countryName: string }>;
  }>({
    currencies: [],
    accounts: [],
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
  const [showContractSubmissionModal, setShowContractSubmissionModal] = useState(false);
  const [showTawjeehModal, setShowTawjeehModal] = useState(false);
  const [showILOEModal, setShowILOEModal] = useState(false);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [showRemarksHistory, setShowRemarksHistory] = useState(false);
  const [showPendingPaymentsModal, setShowPendingPaymentsModal] = useState(false);
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
  }, [currentStep, companyId, searchQuery]);

  // Sync selectedCompany with URL parameter
  useEffect(() => {
    if (companyId !== selectedCompany) {
      setSelectedCompany(companyId);
    }
  }, [companyId]);
  
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
    // Preserve existing search and company_id if they exist
    if (searchQuery) params.set('search', searchQuery);
    else params.delete('search');
    if (selectedCompany && selectedCompany !== '0') params.set('company_id', selectedCompany);
    else params.delete('company_id');
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
    setSearchParams(params);
  };

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompany(companyId);
    const params = new URLSearchParams(searchParams);
    params.set('step', currentStep);
    if (searchQuery) params.set('search', searchQuery);
    if (companyId && companyId !== '0') {
      params.set('company_id', companyId);
    } else {
      params.delete('company_id');
    }
    setSearchParams(params);
  };

  const getActionButtons = (residence: ResidenceTask) => {
    const buttons: JSX.Element[] = [];
    const step = currentStep;

    if (step === '10') {
      if (residence.tawjeeh_charge === 0) {
        buttons.push(
          <button key="tawjeeh" className="btn btn-warning btn-sm" onClick={() => { setSelectedResidenceId(residence.residenceID); setShowTawjeehModal(true); }}>
            Tawjeeh
          </button>
        );
      }
      if (residence.iloe_charge === 0) {
        buttons.push(
          <button key="iloe" className="btn btn-warning btn-sm" onClick={() => { setSelectedResidenceId(residence.residenceID); setShowILOEModal(true); }}>
            ILOE
          </button>
        );
      }
    }

    if (step === '1') {
      buttons.push(
        <button key="continue" className="btn btn-success btn-sm" onClick={() => { setSelectedResidenceId(residence.residenceID); setShowOfferLetterModal(true); }}>
          Continue
        </button>,
        <button 
          key="doc-verify" 
          className="btn btn-info btn-sm" 
          onClick={() => handleDocumentVerification(residence)}
          title="Check Document Verification"
        >
          <i className="fa fa-file-check"></i> Doc Verify
        </button>
      );
    } else if (step === '2') {
      buttons.push(
        <button key="continue" className="btn btn-success btn-sm" onClick={() => { setSelectedResidenceId(residence.residenceID); setShowInsuranceModal(true); }}>
          Continue
        </button>
      );
    } else if (step === '3') {
      buttons.push(
        <button key="continue" className="btn btn-success btn-sm" onClick={() => { setSelectedResidenceId(residence.residenceID); setShowLabourCardModal(true); }}>
          Continue
        </button>
      );
    } else if (step === '4') {
      buttons.push(
        <button key="continue" className="btn btn-success btn-sm" onClick={() => { setSelectedResidenceId(residence.residenceID); setShowEVisaModal(true); }}>
          Continue
        </button>
      );
    } else if (step === '5') {
      buttons.push(
        <button key="continue" className="btn btn-success btn-sm" onClick={() => { setSelectedResidenceId(residence.residenceID); setShowChangeStatusModal(true); }}>
          Continue
        </button>
      );
    } else if (step === '6') {
      buttons.push(
        <button key="continue" className="btn btn-success btn-sm" onClick={() => { setSelectedResidenceId(residence.residenceID); setShowMedicalModal(true); }}>
          Continue
        </button>
      );
    } else if (step === '7') {
      buttons.push(
        <button key="continue" className="btn btn-success btn-sm" onClick={() => { setSelectedResidenceId(residence.residenceID); setShowEmiratesIDModal(true); }}>
          Continue
        </button>
      );
    } else if (step === '8') {
      buttons.push(
        <button key="continue" className="btn btn-success btn-sm" onClick={() => { setSelectedResidenceId(residence.residenceID); setShowVisaStampingModal(true); }}>
          Continue
        </button>
      );
    } else if (step === '9') {
      buttons.push(
        <button key="continue" className="btn btn-success btn-sm" onClick={() => { setSelectedResidenceId(residence.residenceID); setShowContractSubmissionModal(true); }}>
          Continue
        </button>
      );
    }

    if (step === '1a') {
      buttons.push(
        <button 
          key="accept" 
          className="btn btn-success btn-sm" 
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
          className="btn btn-danger btn-sm" 
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
          className="btn btn-warning btn-sm" 
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
          <i className="fa fa-money-bill-wave"></i> Pending Payments
        </button>
      );
    } else if (step === '4a') {
      if (residence.eVisaStatus === 'rejected') {
        buttons.push(
          <button key="reapply" className="btn btn-warning btn-sm" onClick={() => { setSelectedResidenceId(residence.residenceID); setShowEVisaModal(true); }}>
            <i className="fa fa-redo"></i> Re-apply
          </button>
        );
      } else {
        buttons.push(
          <button key="accept" className="btn btn-success btn-sm" onClick={() => handleEVisaStatus(residence.residenceID, 'accepted')}>
            Accept
          </button>,
          <button key="reject" className="btn btn-danger btn-sm" onClick={() => handleEVisaStatus(residence.residenceID, 'rejected')}>
            Reject
          </button>
        );
      }
    }

    // Common buttons
    if (residence.hold === 0) {
      buttons.push(
        <a key="file" href={`/residence/${residence.residenceID}?stp=${step}`} target="_blank" className="btn btn-sm btn-primary">
          <i className="fa fa-file"></i>
        </a>
      );
    }

    if (step !== '1a' && step !== '4a') {
      buttons.push(
        <button key="move" className="btn btn-sm btn-primary" onClick={() => handleMoveToStep(residence.residenceID, step)}>
          Move
        </button>
      );
    }

    // Add attachments button for all steps
    buttons.push(
      <button 
        key="attachments" 
        className="btn btn-info btn-sm" 
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
      const nationality = lookups.nationalities.find(
        (n) => n.countryName === residence.countryName
      );

      if (!nationality) {
        Swal.fire('Error', 'Nationality code not found', 'error');
        return;
      }

      const response = await fetch(
        `https://api.sntrips.com/trx/verify.php?passportNumber=${residence.passportNumber}&nationalityCode=${nationality.airport_id}&residenceID=${residence.residenceID}`
      );
      const data = await response.json();

      if (data.status === 'success') {
        await loadTasks(); // Reload to show updated status
        
        const statusLower = data.data.verification_status.toLowerCase();
        let icon: 'success' | 'error' | 'info' | 'warning' = 'info';
        
        if (statusLower.includes('approved') || statusLower.includes('verified')) {
          icon = 'success';
        } else if (statusLower.includes('rejected') || statusLower.includes('denied')) {
          icon = 'error';
        } else if (statusLower.includes('pending')) {
          icon = 'warning';
        }

        Swal.fire({
          title: 'Verification Status',
          html: `
            <div style="text-align: left;">
              <p><strong>Passport:</strong> ${residence.passportNumber}</p>
              <p><strong>Status:</strong> <span style="font-weight: bold; color: ${icon === 'success' ? 'green' : icon === 'error' ? 'red' : icon === 'warning' ? 'orange' : 'blue'};">${data.data.verification_status}</span></p>
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
      Swal.fire('Error', 'Failed to check document verification', 'error');
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
      { value: '9', label: '9 - Contract Submission', completedStep: 10, hasTransaction: false },
      { value: '10', label: '10 - Completed', completedStep: 10, hasTransaction: false }
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
    <div className="residence-tasks-page">
      {/* Header */}
      <div className="mb-6">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h1 className="mb-2" style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#000000' }}>
              <i className="fa fa-tasks me-2"></i>
              Residence Tasks (Mainland)
            </h1>
            <p style={{ color: '#000000' }}>Manage residence processing steps</p>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-primary" onClick={() => setShowNewResidenceModal(true)}>
              <i className="fa fa-plus-circle me-2"></i>
              Add New Residence
            </button>
            <a href="/residence/cancellation" className="btn btn-danger">
              <i className="fa fa-times-circle me-2"></i>
              Cancellations
            </a>
            <a href="/residence/replacements" className="btn btn-warning">
              <i className="fa fa-exchange me-2"></i>
              Replacements
            </a>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="card p-4">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              name="search"
              defaultValue={searchQuery}
              placeholder="Search by name or Passport Number"
            />
            <button type="submit" className="btn btn-primary">
              <i className="fa fa-search mr-2"></i>
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Step Navigation */}
      <div className="mb-6">
        <div className="btn-group btn-group-block w-100">
          {(['1', '1a', '2', '3', '4', '4a', '5', '6', '7', '8', '9', '10'] as const).map((key) => {
            const step = steps[key];
            if (!step) return null;
            return (
              <button
                key={key}
                type="button"
                className={`btn btn-white btn-block step-nav-link ${currentStep === key ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleStepChange(key);
                }}
              >
                <span>{step.name}</span>
                {stepCounts[key] > 0 && (
                  <span className="badge bg-red ms-1">{stepCounts[key]}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Establishment Filter */}
      <div className="mb-6">
        <div className="card p-4">
          <label className="form-label mb-2" style={{ color: '#374151', fontWeight: 500 }}>Establishment</label>
          <SearchableSelect
            options={[
              { value: '0', label: 'All' },
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
      </div>

      {/* Data Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="mb-0" style={{ color: '#1f2937', fontWeight: 600 }}>Resident</h3>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-8">
              <i className="fa fa-spinner fa-spin fa-2x" style={{ color: '#9ca3af' }}></i>
              <p className="mt-2" style={{ color: '#6b7280' }}>Loading residences...</p>
            </div>
          ) : residences.length === 0 ? (
            <div className="text-center py-8">
              <p style={{ color: '#6b7280' }}>No residences found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-bordered align-middle text-nowrap">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>App. Date</th>
                    <th>Passenger Name</th>
                    <th>Customer</th>
                    <th>Establishment</th>
                    <th>Passport</th>
                    <th>Remarks</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedResidences.map((residence) => (
                    <tr key={residence.residenceID} className={residence.hold === 1 ? 'bg-hold' : ''}>
                      <td>{residence.residenceID}</td>
                      <td>{new Date(residence.datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td>
                        <img
                          src={`https://flagpedia.net/data/flags/h24/${residence.countryCode?.toLowerCase()}.png`}
                          alt={residence.countryName}
                          height="12"
                          className="me-2"
                        />
                        <strong>{residence.passenger_name.toUpperCase()}</strong>
                        {residence.uid && <><br /><strong>UID: </strong>{residence.uid}</>}
                        {residence.document_verify && (
                          <>
                            <br />
                            <strong>Doc Verify: </strong>
                            <span 
                              className={
                                residence.document_verify.toLowerCase().includes('approved') || residence.document_verify.toLowerCase().includes('verified')
                                  ? 'badge bg-success'
                                  : residence.document_verify.toLowerCase().includes('rejected') || residence.document_verify.toLowerCase().includes('denied')
                                  ? 'badge bg-danger'
                                  : residence.document_verify.toLowerCase().includes('pending')
                                  ? 'badge bg-warning text-dark'
                                  : residence.document_verify.toLowerCase().includes('no data')
                                  ? 'badge bg-secondary'
                                  : 'badge bg-info'
                              }
                              style={{ fontSize: '0.75rem' }}
                            >
                              {residence.document_verify}
                            </span>
                            {residence.document_verify_datetime && (
                              <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>
                                {new Date(residence.document_verify_datetime).toLocaleString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </small>
                            )}
                          </>
                        )}
                        <br />
                        <strong>Sale Price: </strong>{residence.sale_price.toLocaleString()}
                        <br />
                        <strong>Paid Amount: </strong>{residence.paid_amount.toLocaleString()}
                        {' '}
                        <span className={residence.paid_amount === residence.sale_price ? 'text-success' : 'text-danger'}>
                          ({residence.paid_amount === 0 ? 0 : Math.round((residence.paid_amount / residence.sale_price) * 100)}%)
                        </span>
                      </td>
                      <td>{residence.customer_name}</td>
                      <td>
                        {residence.company_name && (
                          <>
                            <strong>{residence.company_name}</strong>
                            {residence.company_number && <> - {residence.company_number}</>}
                          </>
                        )}
                        {residence.mb_number && <><br /><strong>MB Number: </strong>{residence.mb_number}</>}
                        {residence.mohreStatus && (
                          <><br /><strong>MOHRE Status: </strong>
                            <span 
                              className={residence.mb_number ? '' : 'text-danger'}
                              style={{ 
                                color: '#000000',
                                fontWeight: '600',
                                backgroundColor: 'transparent'
                              }}
                            >
                              {residence.mb_number ? residence.mohreStatus : 'Provide MB Number'}
                            </span>
                          </>
                        )}
                        {steps[currentStep]?.showAccess && residence.username && (
                          <>
                            <br /><strong>Username: </strong>{residence.username}
                            {residence.password && <><br /><strong>Password: </strong>{residence.password}</>}
                          </>
                        )}
                      </td>
                      <td>
                        {residence.passportNumber}
                        {(currentStep === '4' || currentStep === '5') && residence.insideOutside && (
                          <span className={`badge bg-${residence.insideOutside === 'inside' ? 'success' : 'danger'} ms-2`}>
                            {residence.insideOutside.toUpperCase()}
                          </span>
                        )}
                      </td>
                      <td>
                        {residence.remarks && (
                          <div className="remarks-content" style={{ maxWidth: '200px', wordWrap: 'break-word' }}>
                            <strong>Current Remarks:</strong><br />
                            <span className="text-info">{residence.remarks}</span>
                            <br />
                            <button 
                              className="btn btn-sm btn-outline-primary btn-view-remarks-history mt-1"
                              onClick={() => { 
                                setSelectedResidenceId(residence.residenceID); 
                                setShowRemarksHistory(true);
                                setShowRemarksModal(true); 
                              }}
                            >
                              <i className="fa fa-history"></i> History
                            </button>
                          </div>
                        )}
                        <button
                          className="btn btn-sm btn-outline-success btn-add-remarks"
                          onClick={() => { 
                            setSelectedResidenceId(residence.residenceID); 
                            setShowRemarksHistory(false);
                            setShowRemarksModal(true); 
                          }}
                        >
                          <i className="fa fa-plus"></i> {residence.remarks ? 'Edit' : 'Add'} Remarks
                        </button>
                      </td>
                      <td>
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
          
          {/* Pagination Controls */}
          {!loading && residences.length > 0 && (
            <div className="pagination-container" style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '16px 20px',
              borderTop: '1px solid #e5e7eb',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              {/* Items per page selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Show</span>
                <select 
                  value={itemsPerPage} 
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  style={{
                    padding: '6px 10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
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
                <span style={{ fontSize: '14px', color: '#6b7280' }}>
                  entries (Showing {startIndex + 1}-{Math.min(endIndex, residences.length)} of {residences.length})
                </span>
              </div>

              {/* Page navigation */}
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: currentPage === 1 ? '#f3f4f6' : '#ffffff',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    color: currentPage === 1 ? '#9ca3af' : '#374151'
                  }}
                >
                  <i className="fa fa-angle-double-left"></i>
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: currentPage === 1 ? '#f3f4f6' : '#ffffff',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
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
                        padding: '6px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: currentPage === pageNum ? '#000000' : '#ffffff',
                        color: currentPage === pageNum ? '#ffffff' : '#374151',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: currentPage === pageNum ? '600' : '400',
                        minWidth: '36px'
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
                    padding: '6px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: currentPage === totalPages ? '#f3f4f6' : '#ffffff',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    color: currentPage === totalPages ? '#9ca3af' : '#374151'
                  }}
                >
                  <i className="fa fa-angle-right"></i>
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: currentPage === totalPages ? '#f3f4f6' : '#ffffff',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
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
            suppliers={lookups.suppliers}
          />
          
          <InsuranceModal
            isOpen={showInsuranceModal}
            onClose={() => { setShowInsuranceModal(false); setSelectedResidenceId(null); }}
            residenceId={selectedResidenceId}
            onSuccess={loadTasks}
            currencies={lookups.currencies}
            accounts={lookups.accounts}
            suppliers={lookups.suppliers}
          />
          
          <LabourCardModal
            isOpen={showLabourCardModal}
            onClose={() => { setShowLabourCardModal(false); setSelectedResidenceId(null); }}
            residenceId={selectedResidenceId}
            onSuccess={loadTasks}
            currencies={lookups.currencies}
            accounts={lookups.accounts}
            suppliers={lookups.suppliers}
          />

          <EVisaModal
            isOpen={showEVisaModal}
            onClose={() => { setShowEVisaModal(false); setSelectedResidenceId(null); }}
            residenceId={selectedResidenceId}
            onSuccess={loadTasks}
            currencies={lookups.currencies}
            accounts={lookups.accounts}
            suppliers={lookups.suppliers}
          />

          <ChangeStatusModal
            isOpen={showChangeStatusModal}
            onClose={() => { setShowChangeStatusModal(false); setSelectedResidenceId(null); }}
            residenceId={selectedResidenceId}
            onSuccess={loadTasks}
            currencies={lookups.currencies}
            accounts={lookups.accounts}
            suppliers={lookups.suppliers}
          />

          <MedicalModal
            isOpen={showMedicalModal}
            onClose={() => { setShowMedicalModal(false); setSelectedResidenceId(null); }}
            residenceId={selectedResidenceId}
            onSuccess={loadTasks}
            currencies={lookups.currencies}
            accounts={lookups.accounts}
            suppliers={lookups.suppliers}
          />

          <EmiratesIDModal
            isOpen={showEmiratesIDModal}
            onClose={() => { setShowEmiratesIDModal(false); setSelectedResidenceId(null); }}
            residenceId={selectedResidenceId}
            onSuccess={loadTasks}
            currencies={lookups.currencies}
            accounts={lookups.accounts}
            suppliers={lookups.suppliers}
          />

          <VisaStampingModal
            isOpen={showVisaStampingModal}
            onClose={() => { setShowVisaStampingModal(false); setSelectedResidenceId(null); }}
            residenceId={selectedResidenceId}
            onSuccess={loadTasks}
            currencies={lookups.currencies}
            accounts={lookups.accounts}
            suppliers={lookups.suppliers}
          />

          <ContractSubmissionModal
            isOpen={showContractSubmissionModal}
            onClose={() => { setShowContractSubmissionModal(false); setSelectedResidenceId(null); }}
            residenceId={selectedResidenceId}
            onSuccess={loadTasks}
            currencies={lookups.currencies}
            accounts={lookups.accounts}
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
    </div>
  );
}

