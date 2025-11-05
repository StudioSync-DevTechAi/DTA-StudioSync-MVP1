import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Image, 
  Menu, 
  X,
  ChevronLeft,
  ChevronRight,
  Folder
} from "lucide-react";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

interface PortfolioSidebarProps {
  onToggle?: (isCollapsed: boolean) => void;
}

export function PortfolioSidebar({ onToggle }: PortfolioSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggle = () => {
    const newState = !isCollapsed;
    console.log('Toggling sidebar:', newState ? 'collapsed' : 'expanded');
    setIsCollapsed(newState);
    if (onToggle) {
      onToggle(newState);
    }
  };

  const sidebarItems: SidebarItem[] = [
    {
      id: "photobank",
      label: "Manage PhotoBank",
      icon: <Image className="h-5 w-5" />,
      path: "/photobank",
    },
    {
      id: "portfolio",
      label: "Manage Portfolio",
      icon: <LayoutDashboard className="h-5 w-5" />,
      path: "/portfolio",
    },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <>
      <style>{`
        .portfolio-sidebar-collapsed .scroll-sidebar {
          padding: 4px 0 !important;
        }
        .portfolio-sidebar-collapsed .brand-logo {
          padding: 16px 4px !important;
        }
        .portfolio-sidebar-collapsed .sidebar-link {
          padding: 12px 4px !important;
          justify-content: center !important;
          gap: 0 !important;
        }
        .portfolio-sidebar-collapsed .hide-menu {
          display: none !important;
        }
        .portfolio-sidebar-collapsed .nav-small-cap {
          display: none !important;
        }
        .portfolio-sidebar-collapsed .sidebar-divider {
          display: none !important;
        }
      `}</style>
      {/* Mobile overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`left-sidebar fixed top-0 left-0 h-full bg-white z-50 transition-all duration-300 flex flex-col ${
          isCollapsed ? "-translate-x-full lg:translate-x-0 portfolio-sidebar-collapsed" : "translate-x-0"
        }`}
        style={{
          width: isCollapsed ? 'calc(256px * 0.2)' : '256px',
          overflow: 'hidden'
        }}
      >
        {/* Sidebar scroll container */}
        <div className="flex flex-col h-full">
          {/* Brand Logo */}
          <div className="brand-logo d-flex align-items-center justify-content-center flex-shrink-0" style={{ padding: isCollapsed ? '16px 4px' : undefined, minHeight: isCollapsed ? '60px' : undefined }}>
            {!isCollapsed && (
              <a href="/portfolio" className="text-nowrap logo-img d-flex align-items-center gap-2 w-100" onClick={(e) => { e.preventDefault(); navigate('/portfolio'); }}>
                <div className="d-flex align-items-center">
                  <div className="bg-primary rounded d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                    <span className="text-white fw-bold">S</span>
                  </div>
                </div>
                <span className="fw-bold text-dark">StudioSyncWork</span>
              </a>
            )}
            {isCollapsed && (
              <div className="d-flex align-items-center justify-content-center w-100">
                <div className="bg-primary rounded d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px', minWidth: '28px' }}>
                  <span className="text-white fw-bold" style={{ fontSize: '14px' }}>S</span>
                </div>
              </div>
            )}
            {/* Mobile Close Button */}
            <div className="close-btn d-xl-none d-block sidebartoggler cursor-pointer" onClick={() => setIsCollapsed(true)}>
              <X className="h-6 w-6" />
            </div>
          </div>

          {/* Sidebar Navigation */}
          <nav className="sidebar-nav scroll-sidebar flex-1 overflow-y-auto" style={{ padding: isCollapsed ? '4px 0' : undefined, overflowX: 'hidden' }}>
            <ul id="sidebarnav" className="list-unstyled p-0 m-0 h-full flex flex-col" style={{ overflow: 'hidden' }}>
              {/* Menu Items */}
              <div className="flex-1" style={{ overflow: 'hidden', width: '100%', marginTop: '16px' }}>
                {sidebarItems.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <li key={item.id} className={`sidebar-item ${active ? "active" : ""}`} style={{ overflow: 'hidden', width: '100%' }}>
                      <a
                        className={`sidebar-link ${active ? "active" : ""}`}
                        href={item.path}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(item.path);
                          if (window.innerWidth < 1024) {
                            setIsCollapsed(true);
                          }
                        }}
                        aria-expanded="false"
                        style={{ 
                          padding: isCollapsed ? '12px 4px' : undefined,
                          justifyContent: isCollapsed ? 'center' : undefined,
                          display: 'flex',
                          alignItems: 'center',
                          overflow: 'hidden',
                          width: '100%'
                        }}
                      >
                        <div className="d-flex align-items-center" style={{ justifyContent: isCollapsed ? 'center' : undefined, width: isCollapsed ? '100%' : undefined, overflow: 'hidden' }}>
                          <span className="d-flex" style={{ justifyContent: isCollapsed ? 'center' : undefined }}>
                            {item.icon}
                          </span>
                          {!isCollapsed && (
                            <span className="hide-menu ms-3" style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
                          )}
                        </div>
                      </a>
                    </li>
                  );
                })}
              </div>

              {/* Bottom Toggle Button - Collapsible Icon at lower section */}
              <li className="mt-auto flex-shrink-0 d-none d-xl-block">
                {!isCollapsed && (
                  <span className="sidebar-divider lg"></span>
                )}
              </li>
              <li className="sidebar-item flex-shrink-0 d-none d-xl-block">
                <a
                  className="sidebar-link"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleToggle();
                  }}
                  aria-expanded="false"
                  style={{ 
                    padding: isCollapsed ? '12px 4px' : undefined,
                    justifyContent: isCollapsed ? 'center' : undefined,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <div className="d-flex align-items-center" style={{ justifyContent: isCollapsed ? 'center' : undefined, width: isCollapsed ? '100%' : undefined }}>
                    <span className="d-flex" style={{ justifyContent: isCollapsed ? 'center' : undefined }}>
                      {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                    </span>
                    {!isCollapsed && (
                      <span className="hide-menu ms-3">Collapse</span>
                    )}
                  </div>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Sidebar toggle button for mobile */}
      {isCollapsed && (
        <button
          className="fixed top-4 left-4 z-50 bg-dark text-white p-2 rounded-lg lg:hidden"
          onClick={() => setIsCollapsed(false)}
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}
    </>
  );
}
