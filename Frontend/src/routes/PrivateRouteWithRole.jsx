import storeAuth from '../context/storeAuth';
import { Forbidden } from '../pages/Forbidden';
import { Navigate } from 'react-router';

export default function PrivateRouteWithRole({ children, allowedRoles = [] }) {
    const sessionId = storeAuth.getState().sessionId;
    
    // Si no hay sessionId, redirigir a login
    if (!sessionId) {
        return <Navigate to="/login" replace />;
    }
    
    // Por ahora solo validamos que haya sessionId
    // En el futuro puedes agregar validación de roles desde el backend
    return children;
}