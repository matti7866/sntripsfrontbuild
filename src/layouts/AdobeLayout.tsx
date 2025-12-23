import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAppSettings } from '../context/AppSettingsContext';
import AdobeHeader from './AdobeHeader';
import AdobeSidebar from './AdobeSidebar';
import './adobe-nav.css';

export default function AdobeLayout() {
  const {
    appHeaderNone,
    appSidebarNone,
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
        'app adobe-app app-sidebar-fixed app-header-fixed ' +
        (appHeaderNone ? 'app-without-header ' : '') +
        (appSidebarNone ? 'app-without-sidebar ' : '') +
        (appSidebarMobileToggled ? 'app-sidebar-mobile-toggled ' : '') +
        (appContentFullHeight ? 'app-content-full-height ' : '') +
        (hasScroll ? 'has-scroll ' : '')
      }
    >
      {!appHeaderNone && <AdobeHeader />}
      {!appSidebarNone && <AdobeSidebar />}
      
      <div id="content" className={'app-content adobe-content ' + appContentClass}>
        <Outlet />
      </div>
    </div>
  );
}



