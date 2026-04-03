import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function ProtectedRoute({ children, reqRoles = [] }) {
  const { user, token } = useContext(AuthContext);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (reqRoles.length > 0 && !reqRoles.includes(user.role)) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

export default ProtectedRoute;
