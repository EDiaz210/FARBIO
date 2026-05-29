import { useEffect, useState } from 'react';
import useFetch from '../hooks/useFetch';
import storeAuth from '../context/storeAuth';

const MisSolicitudes = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const { fetchDataBackend } = useFetch();
  const { user, token } = storeAuth(); // 1. Extraemos el token del store

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user]);

  const fetchData = async () => {
    const roleStatus = getRoleStatus();
    if (!roleStatus) return;
    
    const sanitizedStatus = encodeURIComponent(roleStatus.trim());
    const url = `${import.meta.env.VITE_BACKEND_URL}/api/codigos/search?status=${sanitizedStatus}`;
    
    const response = await fetchDataBackend(url, null, 'GET', token, false);
    
    if (response?.codigos) {
      setSolicitudes(response.codigos);
      setCurrentPage(1);
    }
  };

  const getRoleStatus = () => {
    if (user?.rol?.toLowerCase().includes('solicitante')) return 'nuevo';
    if (user?.rol?.toLowerCase().includes('compras')) return 'nuevo';
    if (user?.rol?.toLowerCase().includes('contabilidad')) return 'En Contabilidad';
    if (user?.rol?.toLowerCase().includes('maestro')) return 'con Maestro de datos';
    return '';
  };

  // Calcular el total de páginas
  const totalPages = Math.ceil(solicitudes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSolicitudes = solicitudes.slice(startIndex, endIndex);

  const StepIcon = ({ currentStatus, stepName }) => {
    const statusOrder = ['Nuevo', 'En Contabilidad', 'Con Maestro de Datos', 'Completado'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(stepName);

    if (currentIndex >= stepIndex && currentIndex !== -1) {
      return (
        <div className="w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center text-white shadow-sm transition-all duration-300">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    }
    return <div className="w-7 h-7 border-2 border-gray-300 rounded-lg bg-gray-50"></div>;
  };

  return (
    <div className="p-8 bg-[#F8FAFC] min-h-screen font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-[#17243D]">Mis Solicitudes</h1>
          <p className="text-gray-500 mt-2">Seguimiento en tiempo real del proceso de creación</p>
        </header>
        
        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-100">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#17243D] text-white">
                <th className="p-5 border-b border-gray-700">ID</th>
                <th className="p-5 border-b border-gray-700 text-center">SAP Code</th>
                <th className="p-5 border-b border-gray-700">Descripción</th>
                <th className="p-5 border-b border-gray-700 text-center uppercase text-xs tracking-wider">Compras</th>
                <th className="p-5 border-b border-gray-700 text-center uppercase text-xs tracking-wider">Contabilidad</th>
                <th className="p-5 border-b border-gray-700 text-center uppercase text-xs tracking-wider">Maestro Datos</th>
                <th className="p-5 border-b border-gray-700 text-center uppercase text-xs tracking-wider">SAP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentSolicitudes.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="p-5 font-bold text-[#17243D]">#{item.id}</td>
                  {/* Cambiado a 'codigo' si ese es el nombre de columna en tu tabla */}
                  <td className="p-5 text-center font-mono text-sm text-gray-500">{item.codigo || '---'}</td>
                  {/* Usamos descripcionc o descripcion según lo que devuelva tu SELECT */}
                  <td className="p-5 text-gray-700 font-medium">{item.descripcionc || item.descripcion}</td>
                  
                  <td className="p-5 text-center">
                    <div className="flex justify-center"><StepIcon currentStatus={item.status} stepName="Nuevo" /></div>
                  </td>
                  <td className="p-5 text-center">
                    <div className="flex justify-center"><StepIcon currentStatus={item.status} stepName="En Contabilidad" /></div>
                  </td>
                  <td className="p-5 text-center">
                    <div className="flex justify-center"><StepIcon currentStatus={item.status} stepName="Con Maestro de Datos" /></div>
                  </td>
                  <td className="p-5 text-center">
                    <div className="flex justify-center"><StepIcon currentStatus={item.status} stepName="Completado" /></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {solicitudes.length === 0 && (
            <div className="p-20 text-center text-gray-400">No tienes solicitudes registradas actualmente.</div>
          )}
          
          {/* Controles de paginación */}
          {solicitudes.length > 0 && (
            <div className="flex items-center justify-between p-6 bg-gray-50 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                Mostrando <span className="font-semibold">{startIndex + 1}</span> a <span className="font-semibold">{Math.min(endIndex, solicitudes.length)}</span> de <span className="font-semibold">{solicitudes.length}</span> solicitudes
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-[#17243D] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1e2d4a] transition-colors"
                >
                  ← Anterior
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg transition-colors ${
                        currentPage === page
                          ? 'bg-[#17243D] text-white font-semibold'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-[#17243D] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1e2d4a] transition-colors"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MisSolicitudes;