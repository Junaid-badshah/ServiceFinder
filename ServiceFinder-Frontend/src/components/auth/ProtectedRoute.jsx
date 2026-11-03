import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-4">
          Access Denied
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          You don't have permission to view this page.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Your role: <strong>{user.role}</strong>
        </p>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
