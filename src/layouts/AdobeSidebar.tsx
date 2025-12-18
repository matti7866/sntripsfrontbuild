import { Link, useLocation } from 'react-router-dom';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { useAppSettings } from '../context/AppSettingsContext';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import './adobe-nav.css';

interface MenuItem {
  path?: string;
  icon?: string;
  title: string;
  badge?: string;
  children?: MenuItem[];
  isHeader?: boolean;
  adminOnly?: boolean;
}

const menuItems: MenuItem[] = [
  {
    icon: 'fa fa-home',
    title: 'Dashboard',
    children: [
      { path: '/dashboard', title: 'Main Dashboard' },
      { path: '/dashboard/analytics', title: 'Analytics Dashboard', adminOnly: true }
    ]
  },
  {
    icon: 'fa fa-plane',
    title: 'Ticket',
    children: [
      { path: '/ticket/new', title: 'New Ticket' },
      { path: '/ticket/report', title: 'Ticket Report' }
    ]
  },
  {
    icon: 'fa fa-ticket',
    title: 'Visa',
    children: [
      { path: '/visa/new', title: 'New Visa' },
      { path: '/residence', title: 'Residence' },
      { path: '/residence/tasks', title: 'Residence Tasks' },
      { path: '/residence/family', title: 'Family Residence Tasks' },
      { path: '/residence/report', title: 'Residence Report' },
      { path: '/visa/report', title: 'Visa Report' },
      { path: '/visa/pending', title: 'Pending Visa' },
      { path: '/visa/supplier-prices', title: 'Supplier Visa Prices' },
      { path: '/visa/customer-prices', title: 'Customer Visa Prices' },
      { path: '/establishments/manage', title: 'Manage Establishments' }
    ]
  },
  {
    icon: 'fa fa-spinner',
    title: 'Visa Tasks',
    children: [
      { path: '/visa-tasks/mainland', title: 'Mainland' },
      { path: '/visa-tasks/freezone', title: 'Free Zone' },
      { path: '/visa-tasks/emirates-id', title: 'Emirates ID' },
      { path: '/visa-tasks/dashboard', title: 'Visa Dashboard' }
    ]
  },
  {
    icon: 'fa fa-bank',
    title: 'Amer',
    children: [
      { path: '/amer/transactions', title: 'Transactions' }
    ]
  },
  {
    icon: 'fa fa-university',
    title: 'Loan',
    children: [
      { path: '/loan/new', title: 'New Loan' },
      { path: '/loan/view', title: 'View Loan' }
    ]
  },
  {
    icon: 'fa fa-hotel',
    title: 'Hotel',
    children: [
      { path: '/hotel/new', title: 'New Booking' },
      { path: '/hotel/view', title: 'View Bookings' }
    ]
  },
  {
    icon: 'fa fa-car',
    title: 'Rental Car',
    children: [
      { path: '/car-rental/new', title: 'New Booking' },
      { path: '/car-rental/view', title: 'View Bookings' }
    ]
  },
  {
    path: '/service',
    icon: 'fab fa-servicestack',
    title: 'Service'
  },
  {
    path: '/supplier',
    icon: 'fa fa-truck',
    title: 'Supplier'
  },
  {
    icon: 'fa fa-dollar',
    title: 'Expenses',
    children: [
      { path: '/expenses', title: 'Expense Management' },
      { path: '/recurring-expenses', title: 'Recurring Expenses' }
    ]
  },
  {
    icon: 'fa fa-cube',
    title: 'Assets',
    adminOnly: true,
    children: [
      { path: '/assets', title: 'Asset List', adminOnly: true },
      { path: '/assets/create', title: 'Add New Asset', adminOnly: true }
    ]
  },
  {
    icon: 'fa fa-dollar',
    title: 'Make Payment',
    children: [
      { path: '/payment/supplier', title: 'Supplier' },
      { path: '/payment/customer', title: 'Customer' }
    ]
  },
  {
    icon: 'fa fa-user',
    title: 'Customers',
    children: [
      { path: '/customers', title: 'Customer Report' },
      { path: '/agents', title: 'Manage Agents' }
    ]
  },
  {
    icon: 'fa fa-dollar',
    title: 'Ledgers',
    children: [
      { path: '/ledger/customer', title: 'Customer' },
      { path: '/ledger/supplier', title: 'Supplier' },
      { path: '/ledger/affiliate', title: 'Affiliate Business' }
    ]
  },
  {
    icon: 'fa fa-user',
    title: 'Manage User',
    children: [
      { path: '/staff', title: 'Employee' },
      { path: '/role', title: 'Role' },
      { path: '/permission', title: 'Permission' }
    ]
  },
  {
    path: '/cheques',
    icon: 'fa fa-bank',
    title: 'Cheques'
  },
  {
    path: '/tasheel',
    icon: 'fa fa-bank',
    title: 'TASHEEL'
  },
  {
    icon: 'fa fa-user',
    title: 'Manage Accounts',
    children: [
      { path: '/accounts', title: 'Accounts' },
      { path: '/accounts/deposits', title: 'Deposits' },
      { path: '/accounts/withdrawals', title: 'Withdrawals' },
      { path: '/accounts/transfers', title: 'Transfers' },
      { path: '/accounts/report', title: 'Accounts Report' }
    ]
  },
  {
    path: '/salary',
    icon: 'fa fa-dollar',
    title: 'Manage Salaries'
  },
  {
    icon: 'fa fa-hdd',
    title: 'Email',
    children: [
      { path: '/email/inbox', title: 'Inbox' },
      { path: '/email/compose', title: 'Compose' },
      { path: '/email/sent', title: 'Sent' }
    ]
  },
  {
    icon: 'fa fa-file-text',
    title: 'Reports',
    children: [
      { path: '/reports/residence-ledger', title: 'Residence Ledger' }
    ]
  },
  {
    path: '/company-documents',
    icon: 'fa fa-folder',
    title: 'Company Documents'
  },
  {
    path: '/reminder',
    icon: 'fa fa-clock',
    title: 'Set Reminder'
  },
  {
    path: '/currency',
    icon: 'fa fa-exchange-alt',
    title: 'Currency'
  },
  {
    path: '/sms/send',
    icon: 'fa fa-comment',
    title: 'Send SMS'
  },
  {
    path: '/delete-requests',
    icon: 'fa fa-trash',
    title: 'Delete Requests',
    adminOnly: true
  },
  {
    path: '/settings',
    icon: 'fa fa-gears',
    title: 'Settings',
    adminOnly: true
  }
];

export default function AdobeSidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const { 
    toggleAppSidebarMobile,
    appSidebarMobileToggled
  } = useAppSettings();

  const [openSubmenus, setOpenSubmenus] = useState<{ [key: string]: boolean }>({});

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const toggleSubmenu = (title: string) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  // Close sidebar on mobile when clicking a menu item
  const handleMenuClick = () => {
    if (window.innerWidth <= 768 && appSidebarMobileToggled) {
      toggleAppSidebarMobile({ preventDefault: () => {} } as React.MouseEvent);
    }
  };

  // Handle window resize - close mobile sidebar when switching to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && appSidebarMobileToggled) {
        toggleAppSidebarMobile({ preventDefault: () => {} } as React.MouseEvent);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [appSidebarMobileToggled, toggleAppSidebarMobile]);

  // Convert icon class format from 'fa fa-*' to 'fas fa-*' or 'fab fa-*'
  const getIconClass = (icon?: string) => {
    if (!icon) return '';
    if (icon.startsWith('fab')) return icon;
    if (icon.startsWith('fas') || icon.startsWith('far') || icon.startsWith('fal')) return icon;
    return icon.replace(/^fa\s+fa-/, 'fas fa-');
  };

  const renderMenuItem = (item: MenuItem, index: number) => {
    // Skip admin-only items if user is not admin
    if (item.adminOnly && user?.staff_id !== 1) {
      return null;
    }

    const active = item.path ? isActive(item.path) : false;
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openSubmenus[item.title] || false;
    const iconClass = getIconClass(item.icon);

    if (hasChildren) {
      return (
        <div key={index} className={`adobe-menu-item ${active || isOpen ? 'active' : ''}`}>
          <a 
            href="#" 
            className="adobe-menu-link"
            onClick={(e) => {
              e.preventDefault();
              toggleSubmenu(item.title);
            }}
          >
            {iconClass && (
              <div className="adobe-menu-icon">
                <i className={iconClass}></i>
              </div>
            )}
            <span className="adobe-menu-text">{item.title}</span>
            <i className="fas fa-chevron-right adobe-menu-caret"></i>
          </a>
          {isOpen && (
            <div className="adobe-submenu">
              {item.children?.map((child, childIndex) => {
                if (child.adminOnly && user?.staff_id !== 1) {
                  return null;
                }
                
                const childActive = child.path && isActive(child.path);
                return (
                  <Link 
                    key={childIndex} 
                    to={child.path || '#'} 
                    className={`adobe-submenu-link ${childActive ? 'active' : ''}`}
                    onClick={handleMenuClick}
                  >
                    {child.title}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={index} className={`adobe-menu-item ${active ? 'active' : ''}`}>
        {item.path ? (
          <Link to={item.path} className="adobe-menu-link" onClick={handleMenuClick}>
            {iconClass && (
              <div className="adobe-menu-icon">
                <i className={iconClass}></i>
              </div>
            )}
            <span className="adobe-menu-text">{item.title}</span>
          </Link>
        ) : (
          <a href="#" className="adobe-menu-link" onClick={handleMenuClick}>
            {iconClass && (
              <div className="adobe-menu-icon">
                <i className={iconClass}></i>
              </div>
            )}
            <span className="adobe-menu-text">{item.title}</span>
          </a>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {appSidebarMobileToggled && (
        <div 
          className="adobe-sidebar-backdrop"
          onClick={(e) => {
            e.preventDefault();
            toggleAppSidebarMobile(e);
          }}
        />
      )}
      
      <aside className="adobe-sidebar">
        <PerfectScrollbar className="adobe-sidebar-content">
          {/* Create Button */}
          <div className="adobe-create-btn-container">
            <button className="adobe-create-btn">
              <i className="fas fa-plus"></i>
            </button>
          </div>

          {/* Menu Items */}
          <nav className="adobe-menu">
            {menuItems.map((item, index) => renderMenuItem(item, index))}
          </nav>
        </PerfectScrollbar>
      </aside>
    </>
  );
}


