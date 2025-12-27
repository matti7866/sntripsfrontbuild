import { useAuth } from '../../context/AuthContext';
import './ViewAsStaffBanner.css';

interface ViewAsStaffBannerProps {
  viewingAsStaff: {
    staff_id: number;
    staff_name: string;
    role_name: string;
  } | null;
  onExit: () => void;
}

export default function ViewAsStaffBanner({ viewingAsStaff, onExit }: ViewAsStaffBannerProps) {
  const { user } = useAuth();

  if (!viewingAsStaff) return null;

  return (
    <div className="view-as-staff-banner">
      <div className="banner-content">
        <div className="banner-info">
          <i className="fa fa-eye me-2"></i>
          <strong>Preview Mode:</strong> Viewing as <strong>{viewingAsStaff.staff_name}</strong> 
          ({viewingAsStaff.role_name})
          <span className="ms-2 text-muted">|</span>
          <span className="ms-2">Your account: {user?.staff_name}</span>
        </div>
        <button className="btn btn-sm btn-light" onClick={onExit}>
          <i className="fa fa-times me-1"></i>
          Exit Preview
        </button>
      </div>
    </div>
  );
}

