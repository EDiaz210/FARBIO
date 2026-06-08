import { jwtDecode } from 'jwt-decode';

export const getAuthClaims = (token) => {
  if (!token) return null;

  try {
    return jwtDecode(token);
  } catch (error) {
    console.error('Error decodificando token:', error);
    return null;
  }
};