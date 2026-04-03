import React, { useContext, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path) => location.pathname === path ? 'active' : '';

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

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
                  <Link to="/profile" className="neon-text" onClick={closeMobileMenu}>Profile</Link>
                </li>
              ) : (
                <li className={`nav-item ${isActive('/admin')}`}>
                  <Link to="/admin" className="neon-text" onClick={closeMobileMenu}>Dashboard</Link>
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
