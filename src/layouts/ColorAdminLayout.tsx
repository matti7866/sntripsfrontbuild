import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAppSettings } from '../context/AppSettingsContext';
import { useViewAsStaff } from '../context/ViewAsStaffContext';
import ColorAdminHeader from './ColorAdminHeader';
import ColorAdminSidebar from './ColorAdminSidebar';
import ViewAsStaffBanner from '../components/common/ViewAsStaffBanner';

export default function ColorAdminLayout() {
  const { viewingAsStaff, exitViewAs } = useViewAsStaff();
  const {
    appHeaderNone,
    appSidebarNone,
    appSidebarMinify,
    appSidebarMobileToggled,
    appContentFullHeight,
    appContentClass,
    hasScroll
  } = useAppSettings();

  // Handle scroll detection
  useEffect(() => {
    const handleScroll = () => {
      // Scroll detection logic can be added here if needed
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      className={
        'app app-sidebar-fixed app-header-fixed ' +
        (appHeaderNone ? 'app-without-header ' : '') +
        (appSidebarNone ? 'app-without-sidebar ' : '') +
        (appSidebarMinify ? 'app-sidebar-minified ' : '') +
        (appSidebarMobileToggled ? 'app-sidebar-mobile-toggled ' : '') +
        (appContentFullHeight ? 'app-content-full-height ' : '') +
        (hasScroll ? 'has-scroll ' : '')
      }
    >
      <ViewAsStaffBanner viewingAsStaff={viewingAsStaff} onExit={exitViewAs} />
      {!appHeaderNone && <ColorAdminHeader />}
      {!appSidebarNone && <ColorAdminSidebar />}
      
      <div id="content" className={'app-content ' + appContentClass}>
        <Outlet />
      </div>
    </div>
  );
}















