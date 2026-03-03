import React from 'react';
import { Navigate } from 'react-router-dom';

interface PrivateRouteProps {
  isAuthenticated: boolean;
  element: JSX.Element;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ isAuthenticated, element }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return element;
};

export default PrivateRoute;
