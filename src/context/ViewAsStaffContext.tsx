import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface ViewAsStaffState {
  viewingAsStaff: {
    staff_id: number;
    staff_name: string;
    role_name: string;
    role_id: number;
  } | null;
  setViewingAsStaff: (staff: ViewAsStaffState['viewingAsStaff']) => void;
  exitViewAs: () => void;
}

const ViewAsStaffContext = createContext<ViewAsStaffState | undefined>(undefined);

export const ViewAsStaffProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [viewingAsStaff, setViewingAsStaffState] = useState<ViewAsStaffState['viewingAsStaff']>(null);

  // Load from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('viewingAsStaff');
    if (stored) {
      try {
        setViewingAsStaffState(JSON.parse(stored));
      } catch (e) {
        sessionStorage.removeItem('viewingAsStaff');
      }
    }
  }, []);

  const setViewingAsStaff = (staff: ViewAsStaffState['viewingAsStaff']) => {
    setViewingAsStaffState(staff);
    if (staff) {
      sessionStorage.setItem('viewingAsStaff', JSON.stringify(staff));
    } else {
      sessionStorage.removeItem('viewingAsStaff');
    }
  };

  const exitViewAs = () => {
    setViewingAsStaffState(null);
    sessionStorage.removeItem('viewingAsStaff');
  };

  return (
    <ViewAsStaffContext.Provider
      value={{
        viewingAsStaff,
        setViewingAsStaff,
        exitViewAs,
      }}
    >
      {children}
    </ViewAsStaffContext.Provider>
  );
};

export const useViewAsStaff = (): ViewAsStaffState => {
  const context = useContext(ViewAsStaffContext);
  if (context === undefined) {
    throw new Error('useViewAsStaff must be used within a ViewAsStaffProvider');
  }
  return context;
};

export default ViewAsStaffContext;

