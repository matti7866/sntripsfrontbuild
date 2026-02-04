import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import { cn } from '../../lib/utils';
import './LoginOTP.css';

const LoginOTP: React.FC = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [staffInfo, setStaffInfo] = useState<{ name: string; picture?: string } | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);
  const [staffPictureFailed, setStaffPictureFailed] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  useEffect(() => {
    if (step === 'otp' && otpInputRefs.current[0]) {
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  const maskEmail = (value: string) => {
    const [name, domain] = value.split('@');
    if (!name || !domain) return value;
    if (name.length <= 2) return `${name[0]}*@${domain}`;
    return `${name.slice(0, 2)}${'*'.repeat(Math.max(2, name.length - 2))}@${domain}`;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const result = await authService.sendOTP(email);

      if (result.success) {
        if (result.staff) {
          setStaffInfo(result.staff);
        }

        setStep('otp');

        const channels = ['email'];
        if (result.sms_sent) channels.push('SMS');
        if (result.whatsapp_sent) channels.push('WhatsApp');

        setSuccess(
          channels.length > 1
            ? `Code sent via ${channels.join(', ')}.`
            : result.message || 'Code sent successfully.'
        );
      } else {
        setError(result.message || 'Failed to send OTP.');
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').slice(0, 6);

    if (/^\d+$/.test(pasted)) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i += 1) {
        newOtp[i] = pasted[i] || '';
      }
      setOtp(newOtp);
      otpInputRefs.current[Math.min(pasted.length - 1, 5)]?.focus();
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter all 6 digits.');
      setLoading(false);
      return;
    }

    try {
      const result = await authService.verifyOTP(email, otpString);

      if (result.success) {
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
        window.location.reload();
      } else {
        setError(result.message || 'Invalid code.');
        setOtp(['', '', '', '', '', '']);
        otpInputRefs.current[0]?.focus();
      }
    } catch {
      setError('Unable to verify OTP right now.');
      setOtp(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setOtp(['', '', '', '', '', '']);
    setError('');
    setSuccess('');
    setStaffInfo(null);
    setStaffPictureFailed(false);
  };

  return (
    <div className="login-zenith-page">
      <div className="login-zenith-halo login-zenith-halo-1" />
      <div className="login-zenith-halo login-zenith-halo-2" />
      <div className="login-zenith-grid" />
      <div className="login-zenith-skyline" />

      <div className="login-zenith-shell">
        <aside className="login-zenith-brand">
          <div className="login-zenith-badge">Selab Nadiry</div>
          <h1 className="login-zenith-brand-title">Orbit Control Login</h1>
          <p className="login-zenith-brand-copy">
            A fresh sign-in flow with quick OTP delivery and cleaner focus for your daily operations.
          </p>
          <ul className="login-zenith-brand-list">
            <li><i className="fas fa-bolt" /> Fast secure OTP delivery</li>
            <li><i className="fas fa-shield-alt" /> Device-aware verification</li>
            <li><i className="fas fa-layer-group" /> Built for desktop and mobile</li>
          </ul>
        </aside>

        <section className="login-zenith-card-wrap">
          <div className="login-zenith-card">
            <div className="login-zenith-card-head">
              {step === 'email' ? (
                <>
                  <div className="login-zenith-logo-shell">
                    {!logoFailed ? (
                      <img
                        src="/assets/logo-white.png"
                        alt="Selab Nadiry Logo"
                        className="login-zenith-logo"
                        onError={() => setLogoFailed(true)}
                      />
                    ) : (
                      <div className="login-zenith-avatar-fallback">SN</div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {staffInfo?.picture && !staffPictureFailed ? (
                    <img
                      src={staffInfo.picture}
                      alt={staffInfo.name}
                      className="login-zenith-avatar"
                      onError={() => setStaffPictureFailed(true)}
                    />
                  ) : (
                    <div className="login-zenith-avatar-fallback">
                      {staffInfo?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  {staffInfo?.name ? <p className="login-zenith-staff">{staffInfo.name}</p> : null}
                </>
              )}

              <h2>{step === 'email' ? 'Sign in with OTP' : 'Enter verification code'}</h2>
              <p>
                {step === 'email'
                  ? 'Use your company email and we will send a one-time code.'
                  : `We sent a secure 6-digit code to ${maskEmail(email)}.`}
              </p>
            </div>

            {error ? (
              <div className="login-zenith-message login-zenith-error">
                <i className="fas fa-circle-exclamation" />
                <span>{error}</span>
              </div>
            ) : null}

            {success ? (
              <div className="login-zenith-message login-zenith-success">
                <i className="fas fa-circle-check" />
                <span>{success}</span>
              </div>
            ) : null}

            {step === 'email' ? (
              <form onSubmit={handleSendOTP} className="login-zenith-form">
                <label htmlFor="email" className="login-zenith-label">Company Email</label>
                <div className={cn('login-zenith-input-wrap', emailFocused && 'is-focused')}>
                  <i className="fas fa-envelope" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    placeholder="you@selabnadiry.com"
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>

                <button type="submit" disabled={loading} className="login-zenith-btn">
                  {loading ? (
                    <><i className="fas fa-spinner fa-spin" /> Sending code...</>
                  ) : (
                    <><span>Send OTP</span><i className="fas fa-arrow-right" /></>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="login-zenith-form">
                <div className="login-zenith-otp" onPaste={handlePaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpInputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      disabled={loading}
                      className="login-zenith-otp-input"
                    />
                  ))}
                </div>

                <div className="login-zenith-actions">
                  <button
                    type="button"
                    onClick={handleBackToEmail}
                    disabled={loading}
                    className="login-zenith-btn login-zenith-btn-ghost"
                  >
                    <i className="fas fa-arrow-left" />
                    <span>Back</span>
                  </button>
                  <button type="submit" disabled={loading} className="login-zenith-btn">
                    {loading ? (
                      <><i className="fas fa-spinner fa-spin" /> Checking...</>
                    ) : (
                      <><span>Verify</span><i className="fas fa-check" /></>
                    )}
                  </button>
                </div>
              </form>
            )}

            <p className="login-zenith-footnote">
              &copy; {new Date().getFullYear()} Selab Nadiry Travel & Tourism
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginOTP;
