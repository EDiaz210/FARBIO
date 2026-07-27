import { Navigate } from "react-router"
import storeAuth from "../context/storeAuth"
import { isTokenValid } from '../utils/authClaims';

const ProtectedRoute = ({ children }) => {
    const token = storeAuth(state => state.token)
    const valid = isTokenValid(token);

    if (!token || !valid) {
        storeAuth.getState().logout();
        return <Navigate to="/login" replace />;
    }
    
    return children;
}

export default ProtectedRoute

