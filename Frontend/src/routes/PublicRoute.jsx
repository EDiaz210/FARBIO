import { Navigate, Outlet } from "react-router"
import storeAuth from "../context/storeAuth"

const PublicRoute  = () => { 

    const sessionId = storeAuth((state) => state.sessionId)

    return sessionId ? <Navigate to="/dashboard" /> : <Outlet />

}



export default PublicRoute