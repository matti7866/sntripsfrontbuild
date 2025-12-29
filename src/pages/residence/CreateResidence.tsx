import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * This page now redirects to the Residence Tasks page
 * The Create Residence functionality is now available as a modal in the Tasks view
 */
export default function CreateResidence() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to residence tasks page where the modal can be opened
    navigate('/residence/tasks', { replace: true });
  }, [navigate]);
  
  return null;
}
