import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import amerService from '../../services/amerService';
import { config } from '../../utils/config';
import '../modals/Modal.css';

interface Attachment {
  id: number;
  transaction_id: number;
  file_name: string;
  original_name: string;
  file_path?: string;
  description?: string;
  uploaded_at?: string;
}

interface AmerAttachmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: number | null;
}

const getFileIcon = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'fa fa-image';
  if (['pdf'].includes(ext || '')) return 'fa fa-file-pdf';
  if (['doc', 'docx'].includes(ext || '')) return 'fa fa-file-word';
  if (['xls', 'xlsx'].includes(ext || '')) return 'fa fa-file-excel';
  return 'fa fa-file';
};

const getFileUrl = (fileName: string): string => {
  return `${config.baseUrl}/amer/attachments/${fileName}`;
};

const AmerAttachmentsModal: React.FC<AmerAttachmentsModalProps> = ({ 
  isOpen, 
  onClose, 
  transactionId
}) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen && transactionId) {
      loadAttachments();
    }
  }, [isOpen, transactionId]);

  const loadAttachments = async () => {
    if (!transactionId) return;
    
    setLoading(true);
    try {
      const data = await amerService.getAttachments(transactionId);
      console.log('Loaded Amer attachments:', data);
      setAttachments(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error loading attachments:', error);
      // Handle "Invalid action" error gracefully - backend not implemented yet
      if (error.response?.status === 400 && error.response?.data?.message?.includes('Invalid action')) {
        console.log('Attachments feature not yet implemented on backend');
        setAttachments([]);
        // Don't show error alert, just show empty state
      } else if (error.response?.status === 404 || error.code === 'ERR_NETWORK') {
        console.log('Attachments endpoint not available yet');
        setAttachments([]);
      } else {
        // Only show error for unexpected errors
        console.warn('Unexpected error loading attachments:', error);
        setAttachments([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionId || !selectedFile) {
      Swal.fire('Error', 'Please select a file to upload', 'error');
      return;
    }

    setUploading(true);
    try {
      await amerService.uploadAttachment(transactionId, selectedFile, description);
      Swal.fire('Success', 'File uploaded successfully', 'success');
      setSelectedFile(null);
      setDescription('');
      if (e.target instanceof HTMLFormElement) {
        e.target.reset();
      }
      loadAttachments();
    } catch (error: any) {
      console.error('Error uploading attachment:', error);
      // Handle "Invalid action" error - backend not implemented yet
      if (error.response?.status === 400 && error.response?.data?.message?.includes('Invalid action')) {
        Swal.fire({
          title: 'Feature Not Available',
          html: 'The attachment feature is not yet implemented on the backend.<br/><br/>Please contact the administrator to enable this feature.',
          icon: 'info',
          confirmButtonText: 'OK'
        });
      } else if (error.response?.status === 404 || error.code === 'ERR_NETWORK') {
        Swal.fire('Info', 'Attachment feature is not yet available on the backend. Please contact administrator.', 'info');
      } else {
        Swal.fire('Error', error.response?.data?.message || error.message || 'Failed to upload file', 'error');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will permanently delete this attachment',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await amerService.deleteAttachment(id);
        Swal.fire('Success', 'Attachment deleted successfully', 'success');
        loadAttachments();
      } catch (error: any) {
        console.error('Error deleting attachment:', error);
        Swal.fire('Error', error.response?.data?.message || 'Failed to delete attachment', 'error');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <i className="fa fa-paperclip"></i> Attachments
          </h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div className="text-center py-4">
              <i className="fa fa-spinner fa-spin fa-2x"></i>
              <p>Loading attachments...</p>
            </div>
          ) : (
            <>
              {/* Upload Form */}
              <div className="upload-section mb-4 p-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <h5 className="mb-3">
                  <i className="fa fa-upload"></i> Upload New Attachment
                </h5>
                <form onSubmit={handleUpload}>
                  <div className="form-group mb-3">
                    <label>Select File:</label>
                    <input
                      type="file"
                      className="form-control"
                      onChange={handleFileSelect}
                      required
                      disabled={uploading}
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label>Description (Optional):</label>
                    <input
                      type="text"
                      className="form-control"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter file description"
                      disabled={uploading}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={uploading || !selectedFile}
                  >
                    {uploading ? (
                      <>
                        <i className="fa fa-spinner fa-spin"></i> Uploading...
                      </>
                    ) : (
                      <>
                        <i className="fa fa-upload"></i> Upload File
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Attachments List */}
              <div className="attachments-list">
                <h5 className="mb-3">
                  <i className="fa fa-files"></i> Attached Files ({attachments.length})
                </h5>
                {attachments.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="fa fa-inbox fa-3x text-muted mb-3"></i>
                    <p className="text-muted">No attachments found</p>
                    <p className="text-muted small mt-2">
                      <i className="fa fa-info-circle"></i> Attachment feature requires backend implementation
                    </p>
                  </div>
                ) : (
                  <div className="row">
                    {attachments.map((attachment) => {
                      const fileExt = attachment.file_name.split('.').pop();
                      return (
                        <div key={attachment.id} className="col-md-3 mb-3">
                          <div className="card h-100">
                            <div className="card-body text-center">
                              <div className="mb-2">
                                <i className={`${getFileIcon(attachment.file_name)} fa-3x text-primary`}></i>
                              </div>
                              <h6 className="card-title" style={{ fontSize: '12px', wordBreak: 'break-word' }}>
                                {attachment.original_name || attachment.file_name}
                              </h6>
                              {attachment.description && (
                                <p className="text-muted small mb-2">{attachment.description}</p>
                              )}
                              {attachment.uploaded_at && (
                                <p className="text-muted small mb-2">
                                  {new Date(attachment.uploaded_at).toLocaleDateString()}
                                </p>
                              )}
                              <div className="d-flex gap-1 justify-content-center">
                                <a
                                  href={getFileUrl(attachment.file_name)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-primary"
                                  title="View"
                                >
                                  <i className="fa fa-eye"></i>
                                </a>
                                <a
                                  href={getFileUrl(attachment.file_name)}
                                  download
                                  className="btn btn-sm btn-info"
                                  title="Download"
                                >
                                  <i className="fa fa-download"></i>
                                </a>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleDelete(attachment.id)}
                                  title="Delete"
                                >
                                  <i className="fa fa-trash"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default AmerAttachmentsModal;

