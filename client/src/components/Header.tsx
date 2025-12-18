import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { User, Home, Info, HelpCircle, ChevronDown, History, Calculator, LogOut } from "lucide-react";

export function Header() {
  const [showFunctionDropdown, setShowFunctionDropdown] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const checkLoginStatus = () => {
      const loggedIn = localStorage.getItem("isLoggedIn") === "true";
      setIsLoggedIn(loggedIn);
    };
    
    checkLoginStatus();
    
    window.addEventListener("storage", checkLoginStatus);
    return () => window.removeEventListener("storage", checkLoginStatus);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("loggedInEmail");
    localStorage.removeItem("userId");
    localStorage.removeItem("favoriteFood");
    setIsLoggedIn(false);
    setLocation("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 24px',
          height: '64px',
        }}
      >
        {/* Logo Section - Left Aligned */}
        <Link href="/home">
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            className="group"
          >
            <img 
              src="/logo.png" 
              alt="FoodAdvisor Logo" 
              style={{ height: '40px', width: 'auto' }}
              className="transition-transform group-hover:scale-105" 
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '20px', fontWeight: 700, lineHeight: 1.2, color: '#333' }}>FoodAdvisor</span>
              <Link href="/admin">
                <span 
                  style={{ fontSize: '12px', color: '#666', fontWeight: 500, whiteSpace: 'nowrap', cursor: 'default' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  Healthy Eating Guidance Service
                </span>
              </Link>
            </div>
          </div>
        </Link>

        {/* Navigation Section - Right Aligned */}
        <nav 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '32px',
            flexShrink: 0,
          }}
        >
          {isLoggedIn ? (
            <div 
              onClick={handleLogout}
              data-testid="button-logout"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#555',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
              className="hover:text-primary transition-colors"
            >
              <LogOut style={{ height: '18px', width: '18px' }} />
              <span>Log Out</span>
            </div>
          ) : (
            <Link href="/">
              <div 
                data-testid="button-login"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#555',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
                className="hover:text-primary transition-colors"
              >
                <User style={{ height: '18px', width: '18px' }} />
                <span>Log In</span>
              </div>
            </Link>
          )}
          
          <Link href="/home">
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#555',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
              className="hover:text-primary transition-colors"
            >
              <Home style={{ height: '18px', width: '18px' }} />
              <span>HOME</span>
            </div>
          </Link>

          {/* Function Dropdown Menu */}
          <div 
            style={{ position: 'relative' }}
            onMouseEnter={() => setShowFunctionDropdown(true)}
            onMouseLeave={() => setShowFunctionDropdown(false)}
          >
            <button
              data-testid="button-function-menu"
              onClick={() => setShowFunctionDropdown(!showFunctionDropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#555',
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                padding: 0,
                whiteSpace: 'nowrap',
              }}
              className="hover:text-primary transition-colors"
            >
              <span>Function</span>
              <ChevronDown style={{ height: '16px', width: '16px' }} />
            </button>
            
            {showFunctionDropdown && (
              <div
                data-testid="dropdown-function-menu"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: '0',
                  paddingTop: '8px',
                }}
              >
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    border: '1px solid #eee',
                    padding: '8px 0',
                    minWidth: '180px',
                    zIndex: 50,
                    animation: 'fadeIn 0.15s ease-out',
                  }}
                >
                <div 
                  data-testid="link-search-history"
                  onClick={() => {
                    setShowFunctionDropdown(false);
                    setLocation("/history");
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 16px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#555',
                    cursor: 'pointer',
                  }}
                  className="hover:text-primary hover:bg-gray-50 transition-colors"
                >
                  <History style={{ height: '16px', width: '16px' }} />
                  <span>Search History</span>
                </div>
                <div 
                  data-testid="link-calculator"
                  onClick={() => {
                    setShowFunctionDropdown(false);
                    setLocation("/calculator");
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 16px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#555',
                    cursor: 'pointer',
                  }}
                  className="hover:text-primary hover:bg-gray-50 transition-colors"
                >
                  <Calculator style={{ height: '16px', width: '16px' }} />
                  <span>Calculator</span>
                </div>
                </div>
              </div>
            )}
          </div>

          <Link href="/about">
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#555',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
              className="hover:text-primary transition-colors"
            >
              <Info style={{ height: '18px', width: '18px' }} />
              <span>About Us</span>
            </div>
          </Link>

          <Link href="/help">
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#555',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
              className="hover:text-primary transition-colors"
            >
              <HelpCircle style={{ height: '18px', width: '18px' }} />
              <span>Help</span>
            </div>
          </Link>
        </nav>
      </div>
      
      {/* CSS for dropdown animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </header>
  );
}

export function PageTitle({ title }: { title: string }) {
  return (
    <div className="w-full bg-primary text-primary-foreground py-4 px-6 md:px-10 shadow-md">
      <div className="container mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
      </div>
    </div>
  );
}
