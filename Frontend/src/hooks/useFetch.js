import { useCallback } from "react";
import axios from "axios";
import storeAuth from "../context/storeAuth";

function useFetch() {
  const fetchDataBackend = useCallback(async (url, data = null, method = "GET", token = null, showToast = false) => {
    try {
      const storeToken = storeAuth.getState().token;
      const authToken = token || storeToken;
      const requestHeaders = {
        "Content-Type": "application/json",
      };

      if (authToken) {
        requestHeaders["Authorization"] = `Bearer ${authToken}`;
      }

      const options = {
        method,
        url,
        headers: requestHeaders,
      };

      if (data && method !== "DELETE") {
        options.data = data;
      }

      const response = await axios(options);
      return response?.data;
    } catch (error) {
      console.error(error);
      return null;
    }
  }, []);

  return { fetchDataBackend };
}

export default useFetch;
