
import axios from "axios";
import storeAuth from "../context/storeAuth";

function useFetch() {
    const fetchDataBackend = async (url, data = null, method = "GET", token = null, showToast = false) => {
        try {
            // Usar token pasado como parámetro o del store
            const storeToken = storeAuth.getState().token;
            const authToken = token || storeToken;
            const requestHeaders = {
                "Content-Type": "application/json",
            };
            
            // Agregar token JWT en Authorization header si existe
            if (authToken) {
                requestHeaders['Authorization'] = `Bearer ${authToken}`;
            }
            
            const options = {
                method,
                url,
                headers: requestHeaders,
            };

            // Solo agregar data si no es null y no es DELETE
            if (data && method !== 'DELETE') {
                options.data = data;
            }
            
            const response = await axios(options);
            return response?.data;
        } catch (error) {
            console.error(error);
            return null;
        }
    };
    return { fetchDataBackend };
}

export default useFetch;
