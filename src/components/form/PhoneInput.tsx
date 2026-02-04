import React, { useState, useEffect } from 'react';
import { formatPhoneNumber, validatePhoneInput, displayPhoneNumber, getCountryFromPhone } from '../../utils/phoneFormatter';
import './PhoneInput.css';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  icon?: string;
  error?: string;
  showValidation?: boolean;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  name = 'phone',
  label,
  required = false,
  disabled = false,
  placeholder = '971 XX XXX XXXX',
  icon = 'fa fa-phone',
  error,
  showValidation = true
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [countryInfo, setCountryInfo] = useState<{ code: string; name: string } | null>(null);

  useEffect(() => {
    setInputValue(value || '');
    if (value) {
      const country = getCountryFromPhone(value);
      setCountryInfo(country);
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    // Allow only numbers, spaces, +, and -
    newValue = newValue.replace(/[^0-9\s+\-]/g, '');
    
    setInputValue(newValue);

    // Validate
    if (showValidation && newValue) {
      const error = validatePhoneInput(newValue);
      setValidationError(error);
    } else {
      setValidationError(null);
    }

    // Format and pass to parent on blur or when complete
    const cleaned = newValue.replace(/\D/g, '');
    if (cleaned.length >= 12) {
      const formatted = formatPhoneNumber(newValue);
      onChange(formatted);
      setCountryInfo(getCountryFromPhone(formatted));
    } else {
      onChange(newValue);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    if (inputValue) {
      // Format on blur
      const formatted = formatPhoneNumber(inputValue);
      if (formatted) {
        setInputValue(formatted);
        onChange(formatted);
        setValidationError(null);
        setCountryInfo(getCountryFromPhone(formatted));
      } else if (showValidation) {
        setValidationError('Invalid phone number format');
      }
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    // If empty, start with UAE country code
    if (!inputValue) {
      setInputValue('971');
    }
  };

  const displayValue = isFocused ? inputValue : (inputValue ? displayPhoneNumber(inputValue) : '');

  return (
    <div className="phone-input-wrapper">
      {label && (
        <label className="form-label">
          {icon && <i className={`${icon} me-2`}></i>}
          {label}
          {required && <span className="text-danger"> *</span>}
        </label>
      )}
      
      <div className={`phone-input-container ${validationError || error ? 'has-error' : ''} ${disabled ? 'disabled' : ''}`}>
        {countryInfo && !isFocused && (
          <span className="country-badge">{countryInfo.name}</span>
        )}
        
        <input
          type="text"
          className="form-control phone-input"
          name={name}
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
        />
      </div>

      {showValidation && (validationError || error) && (
        <div className="phone-input-error">
          <i className="fa fa-exclamation-circle me-1"></i>
          {error || validationError}
        </div>
      )}

      {showValidation && !validationError && !error && inputValue && (
        <div className="phone-input-hint">
          <i className="fa fa-check-circle me-1"></i>
          Valid phone number format
        </div>
      )}
    </div>
  );
};

export default PhoneInput;






