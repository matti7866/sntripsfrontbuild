import { API_BASE_URL } from '../config/api';

export interface WorkPermit {
  permit_number: string;
  permit_type: string;
  status: string;
  transaction_number: string;
}

export interface CompanyInfo {
  company_name?: string;
  company_code?: string;
  category?: string;
  classification?: string;
}

export interface PermitInfo {
  person_name?: string;
  designation?: string;
  expiry_date?: string;
  employee_classification?: string;
  permit_number?: string;
  permit_type?: string;
  permit_active?: string;
  payment_number?: string;
  paycard_number?: string;
  person_code?: string;
  transaction_number?: string;
}

export interface EWPData {
  company_info: CompanyInfo;
  permit_info: PermitInfo;
  work_permits: WorkPermit[];
  total_permits: number;
}

export interface ImmigrationStatus {
  card_number?: string;
  moi_company_code?: string;
  date_added?: string;
  send_date?: string;
  application_status?: string;
  file_number?: string;
  unified_number?: string;
}

export interface ImmigrationData {
  immigration_status: ImmigrationStatus;
}

export interface CompanyData {
  company_info: {
    company_name?: string;
    company_number?: string;
    category?: string;
    nationality?: string;
    class_desc?: string;
    company_type?: string;
    license_number?: string;
    license_type?: string;
    emirate?: string;
    labour_office?: string;
    mission_quota_available?: string;
    electronic_quota_available?: string;
    company_status?: string;
  };
}

export interface ApplicationStatusData {
  mb_number: string;
  status_message?: string;
  status_type?: string;
  application_info?: { [key: string]: string };
  has_details: boolean;
}

class MOHREService {
  private baseUrl = 'https://api.sntrips.com/trx';

  async getWorkPermitInfo(permitNumber: string): Promise<EWPData> {
    try {
      const response = await fetch(`${this.baseUrl}/ewp.php?permitNumber=${permitNumber.trim()}`);
      const result = await response.json();

      if (result.status === 'success') {
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to fetch work permit information');
      }
    } catch (error: any) {
      console.error('Error fetching work permit info:', error);
      throw error;
    }
  }

  async getImmigrationStatus(mbNumber: string): Promise<ImmigrationData> {
    try {
      const response = await fetch(`${this.baseUrl}/wpricp.php?mbNumber=${mbNumber.trim()}`);
      const result = await response.json();

      if (result.status === 'success') {
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to fetch immigration status');
      }
    } catch (error: any) {
      console.error('Error fetching immigration status:', error);
      throw error;
    }
  }

  async getCompanyInfo(companyNumber: string): Promise<CompanyData> {
    try {
      const response = await fetch(`${this.baseUrl}/company-info.php?companyNumber=${companyNumber.trim()}`);
      const result = await response.json();

      if (result.status === 'success') {
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to fetch company information');
      }
    } catch (error: any) {
      console.error('Error fetching company info:', error);
      throw error;
    }
  }

  async getApplicationStatus(mbNumber: string): Promise<ApplicationStatusData> {
    try {
      const response = await fetch(`${this.baseUrl}/application-status.php?mbNumber=${mbNumber.trim()}`);
      const result = await response.json();

      if (result.status === 'success') {
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to fetch application status');
      }
    } catch (error: any) {
      console.error('Error fetching application status:', error);
      throw error;
    }
  }

  // Helper function to decode HTML entities and handle Arabic text
  decodeHtmlEntities(text: string): string {
    if (!text) return '';
    
    // Remove HTML tags
    let decoded = text.replace(/<[^>]*>/g, '');
    
    // Decode common HTML entities
    decoded = decoded
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#xFC;/gi, '✓')
      .replace(/ü/g, '✓')
      .replace(/&nbsp;/g, ' ');
    
    // Decode numeric character references (for Arabic and other Unicode characters)
    decoded = decoded.replace(/&#(\d+);/g, (match, dec) => {
      return String.fromCharCode(dec);
    });
    
    // Decode hex character references
    decoded = decoded.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
    
    return decoded;
  }

  // Helper function to translate Arabic to English
  translateArabicToEnglish(text: string): string {
    const translations: { [key: string]: string } = {
      'نشط': 'Active',
      'ملغي': 'Cancelled',
      'ملغى': 'Cancelled',
      'معلق': 'Suspended',
      'قيد المعالجة': 'In Progress',
      'مكتمل': 'Completed',
      'محدود المهارة': 'Limited Skilled',
      'ماهر': 'Skilled',
      'عالي المهارة': 'Highly Skilled',
      'كبيرة': 'Large',
      'متوسطة': 'Medium',
      'صغيرة': 'Small',
      'تصريح عمل الكتروني جديد': 'NEW ELECTRONIC WORK PERMIT',
      'اشعار الموافقة المبدئية لتصريح العمل': 'PRE APPROVAL FOR WORK PERMIT',
      'تجديد تصريح العمل الالكتروني': 'ELECTRONIC WORK PERMIT RENEWAL',
      'دبي': 'Dubai',
      'دبى': 'Dubai',
      'أبوظبي': 'Abu Dhabi',
      'الشارقة': 'Sharjah',
      'عجمان': 'Ajman',
      'أم القيوين': 'Umm Al Quwain',
      'رأس الخيمة': 'Ras Al Khaimah',
      'الفجيرة': 'Fujairah',
    };

    let translated = text;
    Object.keys(translations).forEach(arabic => {
      const regex = new RegExp(arabic, 'gi');
      translated = translated.replace(regex, translations[arabic]);
    });

    return translated;
  }
}

export default new MOHREService();
