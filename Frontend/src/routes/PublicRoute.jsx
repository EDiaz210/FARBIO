import { Navigate, Outlet } from "react-router"
import storeAuth from "../context/storeAuth"
import { isTokenValid } from '../utils/authClaims';

const PublicRoute  = () => { 

    const token = storeAuth((state) => state.token)
    const valid = isTokenValid(token);

    if (token && valid) {
        return <Navigate to="/dashboard" replace />
    }

    if (token && !valid) {
        storeAuth.getState().logout();
    }

    return <Outlet />
}



export default PublicRoute