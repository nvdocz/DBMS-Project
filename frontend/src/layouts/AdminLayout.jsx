import React, { useContext } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function AdminLayout() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/admin', roles: ['ceo', 'manager', 'marketing', 'delivery'] },
    { name: 'Manage Cars', path: '/admin/cars', roles: ['ceo', 'manager', 'marketing'] },
    { name: 'Manage Users', path: '/admin/users', roles: ['ceo', 'manager'] },
    { name: 'Sales Inquiries', path: '/admin/sales-inquiries', roles: ['ceo', 'manager', 'marketing', 'delivery'] },
    { name: 'Rent Inquiries', path: '/admin/rent-inquiries', roles: ['ceo', 'manager', 'marketing', 'delivery'] },
    { name: 'Bookings', path: '/admin/bookings', roles: ['ceo', 'manager', 'marketing', 'delivery'] },
    { name: 'Service Appointments', path: '/admin/services', roles: ['ceo', 'manager', 'marketing', 'delivery'] }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Sidebar */}
      <aside style={{ width: '250px', background: 'var(--color-surface)', borderRight: '1px solid var(--color-surface-light)', padding: '2rem' }}>
        <h2 className="navbar-brand" style={{ marginBottom: '2rem' }}>
          nv.<span style={{ color: 'var(--color-neon-red)' }}>admin</span>
        </h2>
        
        <div style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-surface-light)' }}>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Logged in as</p>
          <p style={{ fontWeight: 'bold' }}>{user.name}</p>
          <p style={{ color: 'var(--color-neon-red)', fontSize: '0.9rem' }}>Role: {user.role.toUpperCase()}</p>
        </div>

        <nav>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {menuItems.filter(item => item.roles.includes(user.role)).map(item => (
              <li key={item.path} style={{ marginBottom: '1rem' }}>
                <Link 
                  to={item.path} 
                  style={{
                    display: 'block',
                    padding: '0.75rem 1rem',
                    borderRadius: '4px',
                    background: location.pathname === item.path ? 'rgba(255, 42, 42, 0.1)' : 'transparent',
                    color: location.pathname === item.path ? 'var(--color-neon-red)' : 'var(--color-text-primary)',
                    border: location.pathname === item.path ? '1px solid var(--color-neon-red-glow)' : '1px solid transparent',
                  }}
                >
                  {item.name}
                </Link>
              </li>
            ))}
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
