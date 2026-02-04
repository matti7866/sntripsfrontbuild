import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * This page now redirects to the Residence Tasks page
 * The Create Residence functionality is now available as a modal in the Tasks view
 */
export default function CreateResidence() {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Redirect to residence tasks page where the modal can be opened.
    // Preserve query params so renew flow can prefill and process correctly.
    navigate(
      {
        pathname: '/residence/tasks',
        search: location.search
      },
      { replace: true }
    );
  }, [navigate, location.search]);
  
  return null;
}
