import React from 'react';

function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--color-surface-light)', padding: '3rem 0', background: 'var(--color-surface)', textAlign: 'center' }}>
      <div className="container">
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }} className="navbar-brand">
          nv.<span style={{ color: 'var(--color-neon-red)' }}>drive</span>
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>Experience the ultimate selection of sports cars and luxury rides.</p>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>&copy; {new Date().getFullYear()} nv.drive. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
