import React, { useState, useEffect } from 'react';
import { settingsService, type Settings } from '../../services/settingsService';
import Swal from 'sweetalert2';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'openai' | 'sms'>('sms');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<Settings>({});
  const [evStatus, setEvStatus] = useState<{ apiStatus: string; instanceStatus: string } | null>(null);
  const [whatsappProvider, setWhatsappProvider] = useState<string>('meta');

  useEffect(() => {
    loadSettings();
    if (activeTab === 'whatsapp') {
      loadEvStatus();
    }
  }, [activeTab]);

  useEffect(() => {
    if (settings.whatsapp_api_provider) {
      setWhatsappProvider(settings.whatsapp_api_provider);
      updateProviderDisplay(settings.whatsapp_api_provider);
    }
  }, [settings.whatsapp_api_provider]);

  const updateProviderDisplay = (provider: string) => {
    const metaSection = document.getElementById('meta-whatsapp-section');
    const evSection = document.getElementById('ev-whatsapp-section');
    const etisalatSection = document.getElementById('etisalat-whatsapp-section');
    
    if (metaSection) metaSection.style.display = provider === 'meta' ? 'block' : 'none';
    if (evSection) evSection.style.display = provider === 'ev' ? 'block' : 'none';
    if (etisalatSection) etisalatSection.style.display = provider === 'etisalat' ? 'block' : 'none';
  };

  const loadSettings = async () => {
    try {
      const loadedSettings = await settingsService.getSettings();
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadEvStatus = async () => {
    try {
      const response = await settingsService.getEvStatus();
      if (response.status === 'success') {
        setEvStatus(response.data);
      }
    } catch (error) {
      console.error('Error loading EV status:', error);
    }
  };

  const handleSaveWhatsApp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const provider = formData.get('whatsapp_api_provider') as string;
      
      if (provider === 'meta') {
        // Save Meta WhatsApp API settings
        const settingsData: Partial<Settings> = {
          whatsapp_api_provider: provider,
          whatsapp_api_enabled: formData.get('whatsapp_api_enabled') as string,
          meta_app_id: formData.get('meta_app_id') as string,
          meta_app_secret: formData.get('meta_app_secret') as string,
          meta_access_token: formData.get('meta_access_token') as string,
          meta_phone_number_id: formData.get('meta_phone_number_id') as string,
          meta_business_account_id: formData.get('meta_business_account_id') as string,
          meta_api_version: formData.get('meta_api_version') as string || 'v21.0',
        };

        const response = await settingsService.saveMetaWhatsAppSettings(settingsData);
        if (response.status === 'success') {
          Swal.fire('Success', response.message, 'success');
          loadSettings();
        } else {
          Swal.fire('Error', response.message || 'Failed to save settings', 'error');
        }
      } else if (provider === 'etisalat') {
        // Save Etisalat Enterprise WhatsApp API settings
        const settingsData: Partial<Settings> = {
          whatsapp_api_provider: provider,
          whatsapp_api_enabled: formData.get('whatsapp_api_enabled') as string,
          etisalat_whatsapp_api_url: formData.get('etisalat_whatsapp_api_url') as string,
          etisalat_whatsapp_username: formData.get('etisalat_whatsapp_username') as string,
          etisalat_whatsapp_password: formData.get('etisalat_whatsapp_password') as string,
          etisalat_whatsapp_client_id: formData.get('etisalat_whatsapp_client_id') as string,
          etisalat_whatsapp_secret_id: formData.get('etisalat_whatsapp_secret_id') as string,
          etisalat_whatsapp_sender_id: formData.get('etisalat_whatsapp_sender_id') as string,
        };

        const response = await settingsService.saveEtisalatWhatsAppSettings(settingsData);
        if (response.status === 'success') {
          Swal.fire('Success', response.message, 'success');
          loadSettings();
        } else {
          Swal.fire('Error', response.message || 'Failed to save settings', 'error');
        }
      } else {
        // Save EV API settings
        const settingsData: Partial<Settings> = {
          whatsapp_api_provider: provider,
          ev_status: formData.get('ev_status') as string,
          ev_url: formData.get('ev_url') as string,
          ev_api_key: formData.get('ev_api_key') as string,
          ev_instance: formData.get('ev_instance') as string,
        };

        const response = await settingsService.saveWhatsAppSettings(settingsData);
        if (response.status === 'success') {
          Swal.fire('Success', response.message, 'success');
          loadEvStatus();
        } else {
          Swal.fire('Error', response.message || 'Failed to save settings', 'error');
        }
      }
    } catch (error: any) {
      Swal.fire('Error', error.message || 'Failed to save settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTestMetaWhatsApp = async () => {
    const accessToken = (document.getElementById('meta_access_token') as HTMLInputElement)?.value;
    const phoneNumberId = (document.getElementById('meta_phone_number_id') as HTMLInputElement)?.value;

    if (!accessToken || !phoneNumberId) {
      Swal.fire('Error', 'Please enter Access Token and Phone Number ID first', 'error');
      return;
    }

    try {
      const response = await settingsService.testMetaWhatsAppConnection(accessToken, phoneNumberId);
      if (response.status === 'success') {
        Swal.fire('Success', 'Connection successful!', 'success');
      } else {
        Swal.fire('Error', response.message || 'Connection failed', 'error');
      }
    } catch (error: any) {
      Swal.fire('Error', error.message || 'Connection test failed', 'error');
    }
  };

  const handleTestEtisalatWhatsApp = async () => {
    const apiUrl = (document.getElementById('etisalat_whatsapp_api_url') as HTMLInputElement)?.value;
    const username = (document.getElementById('etisalat_whatsapp_username') as HTMLInputElement)?.value;
    const password = (document.getElementById('etisalat_whatsapp_password') as HTMLInputElement)?.value;
    const clientId = (document.getElementById('etisalat_whatsapp_client_id') as HTMLInputElement)?.value;
    const secretId = (document.getElementById('etisalat_whatsapp_secret_id') as HTMLInputElement)?.value;

    if (!apiUrl || !username || !password) {
      Swal.fire('Error', 'Please fill in API URL, username, and password first', 'error');
      return;
    }

    try {
      const response = await settingsService.testSMSConnection(apiUrl, username, password, clientId, secretId);
      if (response.status === 'success') {
        Swal.fire('Success', 'Connection successful!', 'success');
      } else {
        Swal.fire('Error', response.message || 'Connection failed', 'error');
      }
    } catch (error: any) {
      Swal.fire('Error', error.message || 'Connection test failed', 'error');
    }
  };

  const handleSendTestWhatsApp = async () => {
    const { value: phoneNumber } = await Swal.fire({
      title: 'Send Test WhatsApp Message',
      html: `
        <input id="swal-phone" class="swal2-input" placeholder="Phone Number (e.g., +971585550045)" value="+971585550045">
        <textarea id="swal-message" class="swal2-textarea" placeholder="Message">Hello! This is a test message from SN Travel & Tours via Etisalat Enterprise WhatsApp API.</textarea>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Send',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const phone = (document.getElementById('swal-phone') as HTMLInputElement)?.value;
        const message = (document.getElementById('swal-message') as HTMLTextAreaElement)?.value;
        if (!phone || !message) {
          Swal.showValidationMessage('Please enter both phone number and message');
          return false;
        }
        return { phone, message };
      }
    });

    if (phoneNumber) {
      try {
        Swal.fire({
          title: 'Sending...',
          text: 'Please wait while we send your WhatsApp message',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const response = await settingsService.sendEtisalatWhatsApp(phoneNumber.phone, phoneNumber.message);
        
        if (response.status === 'success') {
          Swal.fire('Success', response.message || 'WhatsApp message sent successfully!', 'success');
        } else {
          Swal.fire('Error', response.message || 'Failed to send WhatsApp message', 'error');
        }
      } catch (error: any) {
        Swal.fire('Error', error.message || 'Failed to send WhatsApp message', 'error');
      }
    }
  };

  const handleSaveOpenAI = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const settingsData: Partial<Settings> = {
        ai_parsing_enabled: formData.get('ai_parsing_enabled') as string,
        openai_api_key: formData.get('openai_api_key') as string,
        ai_model: formData.get('ai_model') as string,
      };

      const response = await settingsService.saveOpenAISettings(settingsData);
      if (response.status === 'success') {
        Swal.fire('Success', response.message, 'success');
      } else {
        Swal.fire('Error', response.message || 'Failed to save settings', 'error');
      }
    } catch (error: any) {
      Swal.fire('Error', error.message || 'Failed to save settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSMS = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const settingsData: Partial<Settings> = {
        sms_api_enabled: formData.get('sms_api_enabled') as string,
        sms_api_url: formData.get('sms_api_url') as string,
        sms_api_username: formData.get('sms_api_username') as string,
        sms_api_password: formData.get('sms_api_password') as string,
        sms_api_client_id: formData.get('sms_api_client_id') as string,
        sms_api_secret_id: formData.get('sms_api_secret_id') as string,
        sms_sender_id: formData.get('sms_sender_id') as string,
      };

      const response = await settingsService.saveSMSSettings(settingsData);
      if (response.status === 'success') {
        Swal.fire('Success', response.message, 'success');
      } else {
        Swal.fire('Error', response.message || 'Failed to save settings', 'error');
      }
    } catch (error: any) {
      Swal.fire('Error', error.message || 'Failed to save settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTestOpenAI = async () => {
    const apiKey = (document.getElementById('openai_api_key') as HTMLInputElement)?.value;
    if (!apiKey) {
      Swal.fire('Error', 'Please enter an API key first', 'error');
      return;
    }

    try {
      const response = await settingsService.testOpenAIConnection(apiKey);
      if (response.status === 'success') {
        Swal.fire('Success', 'Connection successful!', 'success');
      } else {
        Swal.fire('Error', response.message || 'Connection failed', 'error');
      }
    } catch (error: any) {
      Swal.fire('Error', error.message || 'Connection test failed', 'error');
    }
  };

  const handleTestSMS = async () => {
    const apiUrl = (document.getElementById('sms_api_url') as HTMLInputElement)?.value;
    const username = (document.getElementById('sms_api_username') as HTMLInputElement)?.value;
    const password = (document.getElementById('sms_api_password') as HTMLInputElement)?.value;
    const clientId = (document.getElementById('sms_api_client_id') as HTMLInputElement)?.value;
    const secretId = (document.getElementById('sms_api_secret_id') as HTMLInputElement)?.value;

    if (!apiUrl || !username || !password) {
      Swal.fire('Error', 'Please fill in API URL, username, and password first', 'error');
      return;
    }

    try {
      const response = await settingsService.testSMSConnection(apiUrl, username, password, clientId, secretId);
      if (response.status === 'success') {
        Swal.fire('Success', 'Connection successful!', 'success');
      } else {
        Swal.fire('Error', response.message || 'Connection failed', 'error');
      }
    } catch (error: any) {
      Swal.fire('Error', error.message || 'Connection test failed', 'error');
    }
  };

  const handleSendTestSMS = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Send Test SMS',
      html: `
        <div class="text-start">
          <label class="form-label">Phone Number</label>
          <input id="swal-sms-phone" class="swal2-input" placeholder="+971501234567" value="+971" style="width: 90%;">
          <label class="form-label mt-2">Message</label>
          <textarea id="swal-sms-message" class="swal2-textarea" placeholder="Your test message here..." style="width: 90%; height: 100px;">Hello! This is a test SMS from SN Travels via Etisalat Enterprise API. Your IP has been whitelisted successfully!</textarea>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Send SMS',
      cancelButtonText: 'Cancel',
      width: '600px',
      preConfirm: () => {
        const phone = (document.getElementById('swal-sms-phone') as HTMLInputElement)?.value;
        const message = (document.getElementById('swal-sms-message') as HTMLTextAreaElement)?.value;
        if (!phone || !message) {
          Swal.showValidationMessage('Please enter both phone number and message');
          return false;
        }
        if (!phone.startsWith('+')) {
          Swal.showValidationMessage('Phone number must start with + (e.g., +971...)');
          return false;
        }
        return { phone, message };
      }
    });

    if (formValues) {
      try {
        Swal.fire({
          title: 'Sending SMS...',
          text: 'Please wait while we send your test message',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const response = await settingsService.sendTestSMS(formValues.phone, formValues.message);
        
        if (response.status === 'success') {
          Swal.fire({
            icon: 'success',
            title: 'SMS Sent Successfully!',
            html: `
              <div class="text-start">
                <p><strong>To:</strong> ${formValues.phone}</p>
                <p><strong>Message:</strong> ${formValues.message}</p>
                ${response.message ? `<p class="text-success mt-2">${response.message}</p>` : ''}
              </div>
            `,
          });
        } else {
          Swal.fire('Error', response.message || 'Failed to send SMS', 'error');
        }
      } catch (error: any) {
        Swal.fire('Error', error.response?.data?.message || error.message || 'Failed to send SMS', 'error');
      }
    }
  };

  // Expose test function to window for console testing
  useEffect(() => {
    (window as any).testSMSConnection = async () => {
      const apiUrl = (document.getElementById('sms_api_url') as HTMLInputElement)?.value || 'https://nexus.eandenterprise.com/api';
      const username = (document.getElementById('sms_api_username') as HTMLInputElement)?.value;
      const password = (document.getElementById('sms_api_password') as HTMLInputElement)?.value;
      const clientId = (document.getElementById('sms_api_client_id') as HTMLInputElement)?.value || 'a076b330-13f3-43b7-afb2-7da57d903b46';
      const secretId = (document.getElementById('sms_api_secret_id') as HTMLInputElement)?.value || '5oyO3FPP24VAqyYS64q9zO3FK';
      
      console.log('🚀 Testing Etisalat SMS API Connection...');
      console.log('API URL:', apiUrl);
      console.log('Username:', username || 'NOT SET');
      console.log('Client ID:', clientId);
      console.log('Secret ID:', secretId ? '***' : 'NOT SET');
      
      if (!username || !password) {
        console.error('❌ Please fill in username and password in the form first!');
        return;
      }
      
      const loginData: any = {
        username: username,
        password: password
      };
      
      if (clientId) loginData.client_id = clientId;
      if (secretId) loginData.secret_id = secretId;
      
      try {
        const loginUrl = `${apiUrl}/v1/accounts/users/login`;
        console.log('📡 Calling:', loginUrl);
        console.log('📤 Request data:', { ...loginData, password: '***', secret_id: '***' });
        
        const response = await fetch(loginUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(loginData)
        });
        
        const data = await response.json();
        console.log('📥 HTTP Status:', response.status);
        console.log('📥 Response:', data);
        
        if (response.ok) {
          console.log('✅ SUCCESS! Connection established.');
          if (data.token || data.access_token || data.data?.token) {
            const token = data.token || data.access_token || data.data?.token;
            console.log('✅ Authentication Token:', token.substring(0, 20) + '...');
          }
          return { success: true, data };
        } else {
          console.error('❌ FAILED! Authentication error.');
          console.error('Error details:', data);
          return { success: false, error: data };
        }
      } catch (error: any) {
        console.error('❌ ERROR:', error);
        return { success: false, error: error.message };
      }
    };
    
    console.log('💡 Test function available! Run: testSMSConnection()');
  }, []);

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-12 mb-4">
          <h3>Settings</h3>
        </div>
        <div className="col-md-12">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'sms' ? 'active' : ''}`}
                onClick={() => setActiveTab('sms')}
              >
                SMS API Settings
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'whatsapp' ? 'active' : ''}`}
                onClick={() => setActiveTab('whatsapp')}
              >
                WhatsApp API Settings
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'openai' ? 'active' : ''}`}
                onClick={() => setActiveTab('openai')}
              >
                OpenAI API Settings
              </button>
            </li>
          </ul>
          <div className="tab-content panel p-3 rounded-0 rounded-bottom">
            {/* SMS API Tab */}
            {activeTab === 'sms' && (
              <div className="tab-pane fade active show">
                <form onSubmit={handleSaveSMS}>
                  <div className="row">
                    <div className="col-md-6 mx-auto">
                      <div className="row mb-3">
                        <div className="col-md-12">
                          <div className="alert alert-info">
                            <h6>
                              <i className="fa fa-sms"></i> Etisalat Enterprise SMS API (Ngage) Configuration
                            </h6>
                            <p className="mb-0">
                              Configure your Etisalat Enterprise API credentials to enable SMS functionality. API Base URL: <strong>https://nexus.eandenterprise.com/api</strong>
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="row mb-2">
                        <label className="form-label col-form-label col-md-4">SMS API Status</label>
                        <div className="col-md-3">
                          <select name="sms_api_enabled" className="form-select" defaultValue={settings.sms_api_enabled || '0'}>
                            <option value="1">Enabled</option>
                            <option value="0">Disabled</option>
                          </select>
                        </div>
                      </div>
                      <div className="row mb-2">
                        <label htmlFor="sms_api_url" className="form-label col-form-label col-md-4">
                          API Base URL
                        </label>
                        <div className="col-md-8">
                          <input
                            type="text"
                            className="form-control"
                            name="sms_api_url"
                            id="sms_api_url"
                            placeholder="https://nexus.eandenterprise.com/api"
                            defaultValue={settings.sms_api_url || 'https://nexus.eandenterprise.com/api'}
                          />
                          <div className="form-text">Etisalat Enterprise API base URL (default: https://nexus.eandenterprise.com/api)</div>
                        </div>
                      </div>
                      <div className="row mb-2">
                        <label htmlFor="sms_api_username" className="form-label col-form-label col-md-4">
                          Username
                        </label>
                        <div className="col-md-8">
                          <input
                            type="text"
                            className="form-control"
                            name="sms_api_username"
                            id="sms_api_username"
                            placeholder="Your Etisalat Enterprise username"
                            defaultValue={settings.sms_api_username || ''}
                          />
                          <div className="form-text">Your login username for Etisalat Enterprise API</div>
                        </div>
                      </div>
                      <div className="row mb-2">
                        <label htmlFor="sms_api_password" className="form-label col-form-label col-md-4">
                          Password
                        </label>
                        <div className="col-md-8">
                          <input
                            type="password"
                            className="form-control"
                            name="sms_api_password"
                            id="sms_api_password"
                            placeholder="Your Etisalat Enterprise password"
                            defaultValue={settings.sms_api_password || ''}
                          />
                          <div className="form-text">Your login password for authentication (JWT token will be generated automatically)</div>
                        </div>
                      </div>
                      <div className="row mb-2">
                        <label htmlFor="sms_api_client_id" className="form-label col-form-label col-md-4">
                          Client ID
                        </label>
                        <div className="col-md-8">
                          <input
                            type="text"
                            className="form-control"
                            name="sms_api_client_id"
                            id="sms_api_client_id"
                            placeholder="Your Etisalat Enterprise Client ID"
                            defaultValue={settings.sms_api_client_id || ''}
                          />
                          <div className="form-text">Your Client ID (UUID format) for Etisalat Enterprise API</div>
                        </div>
                      </div>
                      <div className="row mb-2">
                        <label htmlFor="sms_api_secret_id" className="form-label col-form-label col-md-4">
                          Secret ID
                        </label>
                        <div className="col-md-8">
                          <input
                            type="password"
                            className="form-control"
                            name="sms_api_secret_id"
                            id="sms_api_secret_id"
                            placeholder="Your Etisalat Enterprise Secret ID"
                            defaultValue={settings.sms_api_secret_id || ''}
                          />
                          <div className="form-text">Your Secret ID for Etisalat Enterprise API authentication</div>
                        </div>
                      </div>
                      <div className="row mb-2">
                        <label htmlFor="sms_sender_id" className="form-label col-form-label col-md-4">
                          Sender ID / Number
                        </label>
                        <div className="col-md-8">
                          <input
                            type="text"
                            className="form-control"
                            name="sms_sender_id"
                            id="sms_sender_id"
                            placeholder="Your registered sender ID or number"
                            defaultValue={settings.sms_sender_id || ''}
                          />
                          <div className="form-text">Your registered sender address/number from Etisalat Enterprise</div>
                        </div>
                      </div>
                      <div className="row mb-2">
                        <label className="form-label col-form-label col-md-4">API Status</label>
                        <div className="col-md-8">
                          <button type="button" className="btn btn-outline-primary btn-sm me-2" onClick={handleTestSMS}>
                            <i className="fa fa-plug"></i> Test Connection
                          </button>
                          <button type="button" className="btn btn-outline-success btn-sm" onClick={handleSendTestSMS}>
                            <i className="fa fa-paper-plane"></i> Send Test SMS
                          </button>
                        </div>
                      </div>
                      <div className="row mb-3">
                        <div className="col-md-12">
                          <div className="alert alert-success">
                            <h6>
                              <i className="fa fa-check-circle"></i> IP Whitelisted!
                            </h6>
                            <p className="mb-0">
                              Your IP has been added to Etisalat's whitelist. You can now send test SMS messages to verify the integration is working correctly.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="row mb-3">
                        <div className="col-md-12">
                          <div className="alert alert-warning">
                            <h6>
                              <i className="fa fa-info-circle"></i> Configuration Notes
                            </h6>
                            <ul className="mb-0">
                              <li><strong>API Endpoints:</strong> Login: POST /v1/accounts/users/login | Send SMS: POST /v1/sms/send</li>
                              <li>Authentication uses username/password to generate JWT token automatically</li>
                              <li>Ensure your sender ID/number is registered in Etisalat Enterprise platform</li>
                              <li>Test the connection after saving your credentials</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-md-4"></div>
                        <div className="col-md-8">
                          <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : 'Save SMS Settings'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* WhatsApp API Tab */}
            {activeTab === 'whatsapp' && (
              <div className="tab-pane fade active show">
                <form onSubmit={handleSaveWhatsApp}>
                  <div className="row">
                    <div className="col-md-6 mx-auto">
                      <div className="row mb-3">
                        <div className="col-md-12">
                          <div className="alert alert-info">
                            <h6>
                              <i className="fa fa-whatsapp"></i> WhatsApp Business API Configuration
                            </h6>
                            <p className="mb-0">
                              Configure your WhatsApp Business API provider. Choose between Meta Verified API, Etisalat Enterprise API, or Evolution API.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="row mb-2">
                        <label className="form-label col-form-label col-md-4">API Provider</label>
                        <div className="col-md-8">
                          <select 
                            name="whatsapp_api_provider" 
                            id="whatsapp_api_provider"
                            className="form-select" 
                            value={whatsappProvider}
                            onChange={(e) => {
                              const provider = e.target.value;
                              setWhatsappProvider(provider);
                              updateProviderDisplay(provider);
                            }}
                          >
                            <option value="meta">Meta Verified API</option>
                            <option value="etisalat">Etisalat Enterprise API</option>
                            <option value="ev">Evolution API (EV)</option>
                          </select>
                        </div>
                      </div>

                      {/* Meta WhatsApp API Section */}
                      <div id="meta-whatsapp-section" style={{ display: whatsappProvider === 'meta' ? 'block' : 'none' }}>
                        <div className="row mb-3">
                          <div className="col-md-12">
                            <div className="alert alert-info">
                              <h6><i className="fa fa-info-circle"></i> Where to Find Your Credentials</h6>
                              <ul className="mb-0 small">
                                <li><strong>App ID & App Secret:</strong> Go to <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer">Meta for Developers</a> → Your App → Settings → Basic</li>
                                <li><strong>Access Token:</strong> WhatsApp → API Setup → Temporary Token (or create Permanent Token)</li>
                                <li><strong>Phone Number ID:</strong> WhatsApp → API Setup → From phone number info (different from your phone number)</li>
                                <li><strong>Business Account ID:</strong> WhatsApp → Settings → Business Account ID</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                        <div className="row mb-2">
                          <label className="form-label col-form-label col-md-4">WhatsApp API Status</label>
                          <div className="col-md-3">
                            <select name="whatsapp_api_enabled" className="form-select" defaultValue={settings.whatsapp_api_enabled || '0'}>
                              <option value="1">Enabled</option>
                              <option value="0">Disabled</option>
                            </select>
                          </div>
                        </div>
                        <div className="row mb-2">
                          <label htmlFor="meta_app_id" className="form-label col-form-label col-md-4">
                            Meta App ID
                          </label>
                          <div className="col-md-8">
                            <input
                              type="text"
                              className="form-control"
                              name="meta_app_id"
                              id="meta_app_id"
                              placeholder="Your Meta App ID"
                              defaultValue={settings.meta_app_id || ''}
                            />
                            <div className="form-text">Go to Meta for Developers → Your App → Settings → Basic → App ID</div>
                          </div>
                        </div>
                        <div className="row mb-2">
                          <label htmlFor="meta_app_secret" className="form-label col-form-label col-md-4">
                            Meta App Secret
                          </label>
                          <div className="col-md-8">
                            <input
                              type="password"
                              className="form-control"
                              name="meta_app_secret"
                              id="meta_app_secret"
                              placeholder="Your Meta App Secret"
                              defaultValue={settings.meta_app_secret || ''}
                            />
                            <div className="form-text">Go to Meta for Developers → Your App → Settings → Basic → App Secret (click Show)</div>
                          </div>
                        </div>
                        <div className="row mb-2">
                          <label htmlFor="meta_access_token" className="form-label col-form-label col-md-4">
                            Meta Access Token
                          </label>
                          <div className="col-md-8">
                            <input
                              type="password"
                              className="form-control"
                              name="meta_access_token"
                              id="meta_access_token"
                              placeholder="Your Meta Access Token"
                              defaultValue={settings.meta_access_token || ''}
                            />
                            <div className="form-text">Go to WhatsApp → API Setup → Access Token (create Permanent Token for production)</div>
                          </div>
                        </div>
                        <div className="row mb-2">
                          <label htmlFor="meta_phone_number_id" className="form-label col-form-label col-md-4">
                            Phone Number ID
                          </label>
                          <div className="col-md-8">
                            <input
                              type="text"
                              className="form-control"
                              name="meta_phone_number_id"
                              id="meta_phone_number_id"
                              placeholder="Your Phone Number ID"
                              defaultValue={settings.meta_phone_number_id || ''}
                            />
                            <div className="form-text">Go to WhatsApp → API Setup → From phone number info section (NOT your phone number 15558506962)</div>
                          </div>
                        </div>
                        <div className="row mb-2">
                          <label htmlFor="meta_business_account_id" className="form-label col-form-label col-md-4">
                            Business Account ID
                          </label>
                          <div className="col-md-8">
                            <input
                              type="text"
                              className="form-control"
                              name="meta_business_account_id"
                              id="meta_business_account_id"
                              placeholder="Your Business Account ID"
                              defaultValue={settings.meta_business_account_id || ''}
                            />
                            <div className="form-text">Go to WhatsApp → Settings → Business Account ID (WABA ID)</div>
                          </div>
                        </div>
                        <div className="row mb-2">
                          <label htmlFor="meta_api_version" className="form-label col-form-label col-md-4">
                            API Version
                          </label>
                          <div className="col-md-8">
                            <select name="meta_api_version" className="form-select" defaultValue={settings.meta_api_version || 'v21.0'}>
                              <option value="v21.0">v21.0 (Latest)</option>
                              <option value="v20.0">v20.0</option>
                              <option value="v19.0">v19.0</option>
                              <option value="v18.0">v18.0</option>
                            </select>
                            <div className="form-text">Meta WhatsApp API version</div>
                          </div>
                        </div>
                        <div className="row mb-2">
                          <label className="form-label col-form-label col-md-4">API Status</label>
                          <div className="col-md-8">
                            <button type="button" className="btn btn-outline-primary btn-sm" onClick={handleTestMetaWhatsApp}>
                              <i className="fa fa-test"></i> Test Connection
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Etisalat Enterprise WhatsApp API Section */}
                      <div id="etisalat-whatsapp-section" style={{ display: whatsappProvider === 'etisalat' ? 'block' : 'none' }}>
                        <div className="row mb-3">
                          <div className="col-md-12">
                            <div className="alert alert-info">
                              <h6><i className="fa fa-info-circle"></i> Etisalat Enterprise WhatsApp API</h6>
                              <p className="mb-0">
                                Use Etisalat Enterprise API for WhatsApp messaging. Same credentials as SMS API.
                                API Base URL: <strong>https://nexus.eandenterprise.com/api</strong>
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="row mb-2">
                          <label className="form-label col-form-label col-md-4">WhatsApp API Status</label>
                          <div className="col-md-3">
                            <select name="whatsapp_api_enabled" className="form-select" defaultValue={settings.whatsapp_api_enabled || '0'}>
                              <option value="1">Enabled</option>
                              <option value="0">Disabled</option>
                            </select>
                          </div>
                        </div>
                        <div className="row mb-2">
                          <label htmlFor="etisalat_whatsapp_api_url" className="form-label col-form-label col-md-4">
                            API Base URL
                          </label>
                          <div className="col-md-8">
                            <input
                              type="text"
                              className="form-control"
                              name="etisalat_whatsapp_api_url"
                              id="etisalat_whatsapp_api_url"
                              placeholder="https://nexus.eandenterprise.com/api"
                              defaultValue={settings.etisalat_whatsapp_api_url || 'https://nexus.eandenterprise.com/api'}
                            />
                            <div className="form-text">Etisalat Enterprise API base URL</div>
                          </div>
                        </div>
                        <div className="row mb-2">
                          <label htmlFor="etisalat_whatsapp_username" className="form-label col-form-label col-md-4">
                            Username
                          </label>
                          <div className="col-md-8">
                            <input
                              type="text"
                              className="form-control"
                              name="etisalat_whatsapp_username"
                              id="etisalat_whatsapp_username"
                              placeholder="Your Etisalat Enterprise username"
                              defaultValue={settings.etisalat_whatsapp_username || ''}
                            />
                            <div className="form-text">Your login username for Etisalat Enterprise API</div>
                          </div>
                        </div>
                        <div className="row mb-2">
                          <label htmlFor="etisalat_whatsapp_password" className="form-label col-form-label col-md-4">
                            Password
                          </label>
                          <div className="col-md-8">
                            <input
                              type="password"
                              className="form-control"
                              name="etisalat_whatsapp_password"
                              id="etisalat_whatsapp_password"
                              placeholder="Your Etisalat Enterprise password"
                              defaultValue={settings.etisalat_whatsapp_password || ''}
                            />
                            <div className="form-text">Your login password for authentication</div>
                          </div>
                        </div>
                        <div className="row mb-2">
                          <label htmlFor="etisalat_whatsapp_client_id" className="form-label col-form-label col-md-4">
                            Client ID
                          </label>
                          <div className="col-md-8">
                            <input
                              type="text"
                              className="form-control"
                              name="etisalat_whatsapp_client_id"
                              id="etisalat_whatsapp_client_id"
                              placeholder="Your Etisalat Enterprise Client ID"
                              defaultValue={settings.etisalat_whatsapp_client_id || 'a076b330-13f3-43b7-afb2-7da57d903b46'}
                            />
                            <div className="form-text">Your Client ID (UUID format) for Etisalat Enterprise API</div>
                          </div>
                        </div>
                        <div className="row mb-2">
                          <label htmlFor="etisalat_whatsapp_secret_id" className="form-label col-form-label col-md-4">
                            Secret ID
                          </label>
                          <div className="col-md-8">
                            <input
                              type="password"
                              className="form-control"
                              name="etisalat_whatsapp_secret_id"
                              id="etisalat_whatsapp_secret_id"
                              placeholder="Your Etisalat Enterprise Secret ID"
                              defaultValue={settings.etisalat_whatsapp_secret_id || ''}
                            />
                            <div className="form-text">Your Secret ID for Etisalat Enterprise API</div>
                          </div>
                        </div>
                        <div className="row mb-2">
                          <label htmlFor="etisalat_whatsapp_sender_id" className="form-label col-form-label col-md-4">
                            WhatsApp Number / Sender ID
                          </label>
                          <div className="col-md-8">
                            <input
                              type="text"
                              className="form-control"
                              name="etisalat_whatsapp_sender_id"
                              id="etisalat_whatsapp_sender_id"
                              placeholder="15558506962"
                              defaultValue={settings.etisalat_whatsapp_sender_id || '15558506962'}
                            />
                            <div className="form-text">Your WhatsApp Business number (e.g., 15558506962)</div>
                          </div>
                        </div>
                        <div className="row mb-2">
                          <label className="form-label col-form-label col-md-4">API Status</label>
                          <div className="col-md-8">
                            <button type="button" className="btn btn-outline-primary btn-sm me-2" onClick={handleTestEtisalatWhatsApp}>
                              <i className="fa fa-test"></i> Test Connection
                            </button>
                            <button type="button" className="btn btn-outline-success btn-sm" onClick={handleSendTestWhatsApp}>
                              <i className="fa fa-paper-plane"></i> Send Test Message
                            </button>
                          </div>
                        </div>
                        <div className="row mb-3">
                          <div className="col-md-12">
                            <div className="alert alert-warning">
                              <h6><i className="fa fa-info-circle"></i> API Endpoints</h6>
                              <ul className="mb-0 small">
                                <li><strong>Login:</strong> POST /v1/accounts/users/login</li>
                                <li><strong>Send WhatsApp:</strong> POST /v1/whatsapp/send (Non-bulk) or POST /v1/whatsapp/text (Text message)</li>
                                <li><strong>Campaign:</strong> POST /v1/campaigns/whatsapp/send (Bulk messages)</li>
                                <li>Authentication uses username/password to generate JWT token automatically</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Evolution API Section */}
                      <div id="ev-whatsapp-section" style={{ display: whatsappProvider === 'ev' ? 'block' : 'none' }}>
                        <div className="row mb-2">
                          <label className="form-label col-form-label col-md-4">WhatsApp API (EV)</label>
                          <div className="col-md-3">
                            <select name="ev_status" className="form-select" defaultValue={settings.ev_status || '0'}>
                              <option value="1">Enabled</option>
                              <option value="0">Disabled</option>
                            </select>
                          </div>
                        </div>
                        <div className="row mb-2">
                          <label htmlFor="ev_url" className="form-label col-form-label col-md-4">
                            WhatsApp API URL (EV)
                          </label>
                          <div className="col-md-8">
                            <input
                              type="text"
                              className="form-control"
                              name="ev_url"
                              id="ev_url"
                              defaultValue={settings.ev_url || ''}
                            />
                          </div>
                        </div>
                        <div className="row mb-2">
                          <label htmlFor="ev_api_key" className="form-label col-form-label col-md-4">
                            WhatsApp API Key (EV)
                          </label>
                          <div className="col-md-8">
                            <input
                              type="text"
                              className="form-control"
                              name="ev_api_key"
                              id="ev_api_key"
                              defaultValue={settings.ev_api_key || ''}
                            />
                          </div>
                        </div>
                        <div className="row mb-2">
                          <label htmlFor="ev_instance" className="form-label col-form-label col-md-4">
                            WhatsApp API Instance Name (EV)
                          </label>
                          <div className="col-md-8">
                            <input
                              type="text"
                              className="form-control"
                              name="ev_instance"
                              id="ev_instance"
                              defaultValue={settings.ev_instance || ''}
                            />
                          </div>
                        </div>
                        {evStatus && (
                          <>
                            <div className="row mb-2">
                              <label className="form-label col-form-label col-md-4">API Status</label>
                              <div className="col-md-8" dangerouslySetInnerHTML={{ __html: evStatus.apiStatus }} />
                            </div>
                            <div className="row mb-2">
                              <label className="form-label col-form-label col-md-4">Instance Status</label>
                              <div className="col-md-8" dangerouslySetInnerHTML={{ __html: evStatus.instanceStatus }} />
                            </div>
                          </>
                        )}
                      </div>

                      <div className="row">
                        <div className="col-md-4"></div>
                        <div className="col-md-8">
                          <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Settings'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* OpenAI API Tab */}
            {activeTab === 'openai' && (
              <div className="tab-pane fade active show">
                <form onSubmit={handleSaveOpenAI}>
                  <div className="row">
                    <div className="col-md-6 mx-auto">
                      <div className="row mb-3">
                        <div className="col-md-12">
                          <div className="alert alert-info">
                            <h6>
                              <i className="fa fa-robot"></i> AI-Powered PDF Ticket Parsing
                            </h6>
                            <p className="mb-0">
                              Configure OpenAI GPT-4 Vision API to enable intelligent PDF ticket parsing.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="row mb-2">
                        <label className="form-label col-form-label col-md-4">AI Parsing</label>
                        <div className="col-md-3">
                          <select name="ai_parsing_enabled" className="form-select" defaultValue={settings.ai_parsing_enabled || '0'}>
                            <option value="1">Enabled</option>
                            <option value="0">Disabled</option>
                          </select>
                        </div>
                      </div>
                      <div className="row mb-2">
                        <label htmlFor="openai_api_key" className="form-label col-form-label col-md-4">
                          OpenAI API Key
                        </label>
                        <div className="col-md-8">
                          <input
                            type="password"
                            className="form-control"
                            name="openai_api_key"
                            id="openai_api_key"
                            placeholder="sk-..."
                            defaultValue={settings.openai_api_key || ''}
                          />
                          <div className="form-text">
                            Get your API key from{' '}
                            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                              OpenAI Platform
                            </a>
                          </div>
                        </div>
                      </div>
                      <div className="row mb-2">
                        <label htmlFor="ai_model" className="form-label col-form-label col-md-4">
                          AI Model
                        </label>
                        <div className="col-md-8">
                          <select name="ai_model" className="form-select" defaultValue={settings.ai_model || 'gpt-4o'}>
                            <option value="gpt-4o">GPT-4 Omni (Recommended)</option>
                            <option value="gpt-4-vision-preview">GPT-4 Vision (Legacy)</option>
                          </select>
                          <div className="form-text">GPT-4 Omni offers better accuracy and speed</div>
                        </div>
                      </div>
                      <div className="row mb-2">
                        <label className="form-label col-form-label col-md-4">API Status</label>
                        <div className="col-md-8">
                          <button type="button" className="btn btn-outline-primary btn-sm" onClick={handleTestOpenAI}>
                            <i className="fa fa-test"></i> Test Connection
                          </button>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-md-4"></div>
                        <div className="col-md-8">
                          <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : 'Save OpenAI Settings'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

