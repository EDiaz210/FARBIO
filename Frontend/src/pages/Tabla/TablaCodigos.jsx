import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import storeAuth from '../../context/storeAuth';
import { getAuthClaims } from '../../utils/authClaims';
import SolicitanteTablaCodigos from './SolicitanteTablaCodigos';
import ComprasTablaCodigos from './ComprasTablaCodigos';
import ContabilidadTablaCodigos from './ContabilidadTablaCodigos';
import MaestroDatosTablaCodigos from './MaestroDatosTablaCodigos';

/**
 * Componente Router que redirija a la pantalla específica del rol
 * Mantiene retrocompatibilidad con la ruta /dashboard/tablas
 */
const TablaCodigos = () => {
  const { token } = storeAuth();
  const navigate = useNavigate();

  const claims = getAuthClaims(token);
  const userRole = claims?.rol?.toLowerCase() || '';

  // Mostrar el contenedor correcto según el rol
  if (userRole.includes('administrador')) {
    return (
      <>
        <ToastContainer />
        <div className="py-8 min-h-screen flex items-center justify-center font-sans">
          <div className="text-center p-8 bg-red-50 rounded-2xl border border-red-200 max-w-md">
            <h2 className="text-2xl font-bold text-red-700">Acceso Restringido</h2>
            <p className="text-sm text-red-600 mt-2">
              Esta bandeja de control es exclusiva para los flujos operativos. Los administradores no gestionan flujos de códigos desde aquí.
            </p>
          </div>
        </div>
      </>
    );
  }

  // Router por rol
  if (userRole.includes('solicitante')) {
    return <><ToastContainer /><SolicitanteTablaCodigos /></>;
  }
  if (userRole.includes('compras')) {
    return <><ToastContainer /><ComprasTablaCodigos /></>;
  }
  if (userRole.includes('contabilidad')) {
    return <><ToastContainer /><ContabilidadTablaCodigos /></>;
  }
  if (userRole.includes('maestro')) {
    return <><ToastContainer /><MaestroDatosTablaCodigos /></>;
  }

  // Fallback
  return (
    <>
      <ToastContainer />
      <div className="py-8 min-h-screen flex items-center justify-center font-sans">
        <div className="text-center p-8 bg-amber-50 rounded-2xl border border-amber-200 max-w-md">
          <h2 className="text-2xl font-bold text-amber-700">Rol no identificado</h2>
          <p className="text-sm text-amber-600 mt-2">
            No se pudo identificar tu rol. Por favor, inicia sesión nuevamente.
          </p>
        </div>
      </div>
    </>
  );
};

export default TablaCodigos;