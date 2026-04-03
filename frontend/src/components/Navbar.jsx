import React, { useContext, useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [totalMessages, setTotalMessages] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path) => location.pathname === path ? 'active' : '';

  useEffect(() => {
    if (!user) { setTotalMessages(0); return; }
    const fetchCounts = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/inquiries');
        const total = res.data.reduce((sum, inq) => sum + (inq.unread_count || 0), 0);
        setTotalMessages(total);
      } catch (_) {}
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="navbar-brand">
          nv.<span>drive</span>
        </Link>
        <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={28} color="var(--color-neon-red)" /> : <Menu size={28} />}
        </button>

        <ul className={`nav-links ${isMobileMenuOpen ? 'open' : ''}`}>
          <li className={`nav-item ${isActive('/')}`}>
            <Link to="/" onClick={closeMobileMenu}>Home</Link>
          </li>
          <li className={`nav-item ${isActive('/sales')}`}>
            <Link to="/sales" onClick={closeMobileMenu}>Sales</Link>
          </li>
          <li className={`nav-item ${isActive('/rentals')}`}>
            <Link to="/rentals" onClick={closeMobileMenu}>Rentals</Link>
          </li>
          <li className={`nav-item ${isActive('/service')}`}>
            <Link to="/service" onClick={closeMobileMenu}>Service</Link>
          </li>
          <li className={`nav-item ${isActive('/contact')}`}>
            <Link to="/contact" onClick={closeMobileMenu}>Contact Us</Link>
          </li>
          {user ? (
            <>
              {user.role === 'client' ? (
                <li className={`nav-item ${isActive('/profile')}`}>
                  <Link to="/profile" className="neon-text" onClick={closeMobileMenu} style={{ position: 'relative' }}>
                    Profile
                    {totalMessages > 0 && (
                      <span style={{
                        position: 'absolute', top: '-10px', right: '-14px',
                        background: 'var(--color-neon-red)', color: '#fff',
                        borderRadius: '50%', width: '18px', height: '18px',
                        fontSize: '0.65rem', fontWeight: 'bold',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-body)', boxShadow: '0 0 6px var(--color-neon-red-glow)'
                      }}>
                        {totalMessages > 99 ? '99+' : totalMessages}
                      </span>
                    )}
                  </Link>
                </li>
              ) : (
                <li className={`nav-item ${isActive('/admin')}`}>
                  <Link to="/admin" className="neon-text" onClick={closeMobileMenu} style={{ position: 'relative' }}>
                    Dashboard
                    {totalMessages > 0 && (
                      <span style={{
                        position: 'absolute', top: '-10px', right: '-14px',
                        background: 'var(--color-neon-red)', color: '#fff',
                        borderRadius: '50%', width: '18px', height: '18px',
                        fontSize: '0.65rem', fontWeight: 'bold',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-body)', boxShadow: '0 0 6px var(--color-neon-red-glow)'
                      }}>
                        {totalMessages > 99 ? '99+' : totalMessages}
                      </span>
                    )}
                  </Link>
                </li>
              )}
              <li className="nav-item">
                <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--color-neon-red)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'bold' }}>
                  Logout
                </button>
              </li>
            </>
          ) : (
            <li className={`nav-item ${isActive('/login')}`}>
               <Link to="/login" className="neon-text" onClick={closeMobileMenu}>Login</Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
