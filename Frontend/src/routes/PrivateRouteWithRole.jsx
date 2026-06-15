import storeAuth from '../context/storeAuth';
import Forbidden from '../pages/Forbidden';
import { Navigate } from 'react-router';
import { getAuthClaims } from '../utils/authClaims';

export default function PrivateRouteWithRole({ children, allowedRoles = [] }) {
    const token = storeAuth.getState().token;
    const claims = getAuthClaims(token);
    const role = claims?.rol || '';
    
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        return <Forbidden />;
    }

    return children;
}