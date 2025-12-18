import { useState, useEffect } from "react";
import { Header, PageTitle } from "@/components/Header";
import { Users, RefreshCw, Mail, Heart, X, Lock, AlertTriangle, MessageSquare, Clock } from "lucide-react";
import { useLocation } from "wouter";

const ADMIN_PASSWORD = "admin123";

interface User {
  id: string;
  email: string;
  favoriteFood: string | null;
}

interface HelpMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

export default function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [helpMessages, setHelpMessages] = useState<HelpMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState("");
  const [messagesError, setMessagesError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [, setLocation] = useLocation();
  
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(loggedIn);
    if (!loggedIn) {
      setShowLoginModal(true);
    }
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
      setAdminError("");
    } else {
      setAdminError("Incorrect admin password. Please try again.");
    }
  };

  const fetchUsers = async () => {
    if (!isLoggedIn || !isAdminAuthenticated) return;
    
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setError("Please log in to view users.");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/users", {
        headers: {
          "x-user-id": userId,
        },
      });
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || "Failed to fetch users");
        return;
      }
      
      setUsers(data.users);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchHelpMessages = async () => {
    if (!isLoggedIn || !isAdminAuthenticated) return;
    
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    
    setMessagesLoading(true);
    setMessagesError("");
    
    try {
      const response = await fetch("/api/help-messages", {
        headers: {
          "x-user-id": userId,
        },
      });
      const data = await response.json();
      
      if (!response.ok) {
        setMessagesError(data.error || "Failed to fetch messages");
        return;
      }
      
      setHelpMessages(data.messages);
    } catch (err) {
      setMessagesError("Network error. Please try again.");
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && isAdminAuthenticated) {
      fetchUsers();
      fetchHelpMessages();
    }
  }, [isLoggedIn, isAdminAuthenticated]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <PageTitle title="Admin - Registered Users" />

      {/* Login Required Modal */}
      {showLoginModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '28px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setShowLoginModal(false)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <X size={20} color="#666" />
            </button>
            
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>
              Login Required
            </h3>
            <p style={{ color: '#666', marginBottom: '20px', fontSize: '15px' }}>
              You need to be logged in to view registered users.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setLocation("/")}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#F46A27',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">
        <div style={{ maxWidth: '1024px', margin: '30px auto', padding: '0 16px 60px 16px' }}>
          
          {/* Admin Password Prompt */}
          {isLoggedIn && !isAdminAuthenticated && (
            <div
              data-testid="section-admin-password"
              style={{
                background: '#ffffff',
                borderRadius: '10px',
                padding: '32px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                maxWidth: '400px',
                margin: '60px auto',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: '#F46A2710',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <Lock size={28} color="#F46A27" />
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
                  Admin Access
                </h2>
                <p style={{ color: '#666', fontSize: '15px' }}>
                  Enter the admin password to view registered users.
                </p>
              </div>

              <form onSubmit={handleAdminLogin}>
                <input
                  data-testid="input-admin-password"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Admin password"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: '16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#F46A27'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />

                {adminError && (
                  <div
                    data-testid="admin-password-error"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 16px',
                      backgroundColor: '#fef3c7',
                      color: '#b45309',
                      borderRadius: '6px',
                      marginBottom: '16px',
                      fontSize: '14px',
                    }}
                  >
                    <AlertTriangle size={18} />
                    {adminError}
                  </div>
                )}

                <button
                  data-testid="button-admin-login"
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: '#F46A27',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Access Admin Panel
                </button>
              </form>
            </div>
          )}

          {/* Users List - Only show when admin authenticated */}
          {isLoggedIn && isAdminAuthenticated && (
          <div
            data-testid="section-admin-users"
            style={{
              background: '#ffffff',
              borderRadius: '10px',
              padding: '24px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Users size={28} />
                Registered Users
              </h2>
              <button
                data-testid="button-refresh-users"
                onClick={fetchUsers}
                disabled={loading}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#78A892',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>

            {error && (
              <div 
                data-testid="admin-error"
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  borderRadius: '6px',
                  marginBottom: '16px',
                }}
              >
                {error}
              </div>
            )}

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 16px' }} />
                <p>Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div 
                data-testid="no-users-message"
                style={{ 
                  textAlign: 'center', 
                  padding: '40px', 
                  color: '#666',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px',
                }}
              >
                <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <p style={{ fontSize: '16px', fontWeight: 500 }}>No registered users yet</p>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>Users will appear here after they sign up.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table 
                  data-testid="users-table"
                  style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    fontSize: '14px',
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #e0e0e0' }}>
                        #
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #e0e0e0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Mail size={16} />
                          Email
                        </div>
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #e0e0e0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Heart size={16} />
                          Favorite Food
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, index) => (
                      <tr 
                        key={user.id}
                        data-testid={`user-row-${index}`}
                        style={{ 
                          borderBottom: '1px solid #e0e0e0',
                          backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa',
                        }}
                      >
                        <td style={{ padding: '12px 16px', color: '#666' }}>
                          {index + 1}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                          {user.email}
                        </td>
                        <td style={{ padding: '12px 16px', color: user.favoriteFood ? '#333' : '#999' }}>
                          {user.favoriteFood || 'Not set'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div 
                  data-testid="users-count"
                  style={{ 
                    marginTop: '16px', 
                    padding: '12px 16px', 
                    backgroundColor: '#f0f9f4',
                    borderRadius: '6px',
                    color: '#166534',
                    fontWeight: 500,
                  }}
                >
                  Total: {users.length} registered user{users.length !== 1 ? 's' : ''}
                </div>
              </div>
            )}
          </div>
          )}
          
          {/* Help Messages Section */}
          {isLoggedIn && isAdminAuthenticated && (
          <div
            data-testid="section-help-messages"
            style={{
              background: '#ffffff',
              borderRadius: '10px',
              padding: '24px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              marginTop: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <MessageSquare size={28} />
                Help Messages
              </h2>
              <button
                data-testid="button-refresh-messages"
                onClick={fetchHelpMessages}
                disabled={messagesLoading}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#78A892',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: messagesLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: messagesLoading ? 0.7 : 1,
                }}
              >
                <RefreshCw size={16} className={messagesLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>

            {messagesError && (
              <div 
                data-testid="messages-error"
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  borderRadius: '6px',
                  marginBottom: '16px',
                }}
              >
                {messagesError}
              </div>
            )}

            {messagesLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 16px' }} />
                <p>Loading messages...</p>
              </div>
            ) : helpMessages.length === 0 ? (
              <div 
                data-testid="no-messages"
                style={{ 
                  textAlign: 'center', 
                  padding: '40px', 
                  color: '#666',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px',
                }}
              >
                <MessageSquare size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <p style={{ fontSize: '16px', fontWeight: 500 }}>No messages yet</p>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>Messages from the Help page will appear here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {helpMessages.map((msg, index) => (
                  <div
                    key={msg.id}
                    data-testid={`message-card-${index}`}
                    style={{
                      padding: '20px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>{msg.name}</p>
                        <p style={{ color: '#666', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Mail size={14} />
                          {msg.email}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#999', fontSize: '13px' }}>
                        <Clock size={14} />
                        {new Date(msg.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <p style={{ 
                      padding: '12px', 
                      backgroundColor: '#ffffff', 
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                    }}>
                      {msg.message}
                    </p>
                  </div>
                ))}
                
                <div 
                  data-testid="messages-count"
                  style={{ 
                    marginTop: '8px', 
                    padding: '12px 16px', 
                    backgroundColor: '#eff6ff',
                    borderRadius: '6px',
                    color: '#1e40af',
                    fontWeight: 500,
                  }}
                >
                  Total: {helpMessages.length} message{helpMessages.length !== 1 ? 's' : ''}
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      </main>
    </div>
  );
}
