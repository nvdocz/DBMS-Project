import React, { useContext, useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

function AdminLayout() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [badges, setBadges] = useState({
    salesInquiries: 0,
    rentInquiries: 0,
    bookings: 0,
    services: 0,
    contacts: 0,
  });

  const fetchBadges = async () => {
    try {
      const [salesRes, rentRes, bookingsRes, servicesRes, contactsRes] = await Promise.all([
        axios.get('/api/inquiries?type=sales'),
        axios.get('/api/inquiries?type=rentals'),
        axios.get('/api/bookings'),
        axios.get('/api/services'),
        axios.get('/api/contacts'),
      ]);

      setBadges({
        salesInquiries: salesRes.data.reduce((s, i) => s + (i.unread_count || 0), 0),
        rentInquiries: rentRes.data.reduce((s, i) => s + (i.unread_count || 0), 0),
        bookings: bookingsRes.data.filter(b => b.status === 'confirmed').length,
        services: servicesRes.data.filter(s => s.status === 'pending').length,
        contacts: contactsRes.data.filter(c => !c.is_read).length,
      });
    } catch (_) {}
  };

  useEffect(() => {
    fetchBadges();
    const interval = setInterval(fetchBadges, 15000);
    return () => clearInterval(interval);
  }, []);

  // Re-fetch when navigating away from a page (so badge clears after viewing)
  useEffect(() => { fetchBadges(); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/'); };

  const menuItems = [
    { name: 'Dashboard',            path: '/admin',                  roles: ['ceo', 'manager', 'marketing', 'delivery'] },
    { name: 'Manage Cars',          path: '/admin/cars',             roles: ['ceo', 'manager', 'marketing'] },
    { name: 'Manage Users',         path: '/admin/users',            roles: ['ceo', 'manager'] },
    { name: 'Sales Inquiries',      path: '/admin/sales-inquiries',  roles: ['ceo', 'manager', 'marketing', 'delivery'], badge: badges.salesInquiries },
    { name: 'Rent Inquiries',       path: '/admin/rent-inquiries',   roles: ['ceo', 'manager', 'marketing', 'delivery'], badge: badges.rentInquiries },
    { name: 'Bookings',             path: '/admin/bookings',         roles: ['ceo', 'manager', 'marketing', 'delivery'], badge: badges.bookings },
    { name: 'Service Appointments', path: '/admin/services',         roles: ['ceo', 'manager', 'marketing', 'delivery'], badge: badges.services },
    { name: 'Contact Messages',     path: '/admin/contacts',          roles: ['ceo', 'manager', 'marketing', 'delivery'], badge: badges.contacts },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Sidebar */}
      <aside style={{ width: '260px', flexShrink: 0, background: 'var(--color-surface)', borderRight: '1px solid var(--color-surface-light)', padding: '2rem', display: 'flex', flexDirection: 'column' }}>
        <h2 className="navbar-brand" style={{ marginBottom: '2rem' }}>
          nv.<span style={{ color: 'var(--color-neon-red)' }}>admin</span>
        </h2>

        <div style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-surface-light)' }}>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Logged in as</p>
          <p style={{ fontWeight: 'bold' }}>{user.name}</p>
          <p style={{ color: 'var(--color-neon-red)', fontSize: '0.9rem' }}>Role: {user.role.toUpperCase()}</p>
        </div>

        <nav style={{ flex: 1 }}>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {menuItems.filter(item => item.roles.includes(user.role)).map(item => {
              const isActive = location.pathname === item.path;
              const hasBadge = item.badge > 0;
              return (
                <li key={item.path} style={{ marginBottom: '0.5rem' }}>
                  <Link
                    to={item.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: '4px',
                      background: isActive ? 'rgba(255, 42, 42, 0.1)' : 'transparent',
                      color: isActive ? 'var(--color-neon-red)' : 'var(--color-text-primary)',
                      border: isActive ? '1px solid var(--color-neon-red-glow)' : '1px solid transparent',
                      transition: 'all 0.2s ease',
                      textDecoration: 'none',
                    }}
                  >
                    <span style={{ fontSize: '0.9rem' }}>{item.name}</span>
                    {hasBadge && (
                      <span style={{
                        background: 'var(--color-neon-red)',
                        color: '#fff',
                        borderRadius: '12px',
                        padding: '0.1rem 0.5rem',
                        fontSize: '0.72rem',
                        fontWeight: 'bold',
                        fontFamily: 'var(--font-body)',
                        minWidth: '20px',
                        textAlign: 'center',
                        boxShadow: '0 0 6px var(--color-neon-red-glow)',
                        flexShrink: 0,
                      }}>
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <button onClick={handleLogout} className="btn" style={{ width: '100%', marginTop: '2rem' }}>
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '3rem', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
