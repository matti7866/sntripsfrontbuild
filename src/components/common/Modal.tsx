import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}) => {
  useEffect(() => {
    // Disable body scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    // Close on Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  const modalContent = (
    <div 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9000,
        overflowY: 'auto'
      }}
    >
      {/* Backdrop */}
      <div
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          zIndex: 9000
        }}
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div 
        style={{ 
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          position: 'relative',
          zIndex: 9001
        }}
      >
        <div
          className={sizeClasses[size]}
          style={{
            position: 'relative',
            backgroundColor: '#2d353c',
            border: '1px solid #495057',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            zIndex: 9001
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '24px',
              borderBottom: '1px solid #495057',
              backgroundColor: '#343a40'
            }}
          >
            <h3 style={{ 
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#ffffff',
              margin: 0
            }}>
              {title}
            </h3>
            {showCloseButton && (
              <button
                onClick={onClose}
                style={{
                  color: '#9ca3af',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '24px',
                  padding: '0',
                  lineHeight: '1'
                }}
              >
                <i className="fa fa-times"></i>
              </button>
            )}
          </div>

          {/* Content */}
          <div style={{ padding: '24px', color: '#ffffff' }}>{children}</div>
        </div>
      </div>
    </div>
  );

  // Render modal in a portal attached to document.body
  return createPortal(modalContent, document.body);
};

export default Modal;















