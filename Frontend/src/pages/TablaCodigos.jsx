import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import storeAuth from '../context/storeAuth';

const DashboardCodigos = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const { fetchDataBackend } = useFetch();
  const { user } = storeAuth();
  const navigate = useNavigate();

  const userRole = user?.rol?.toLowerCase() || '';

  const getStatusByRole = () => {
    if (userRole.includes('solicitante')) return 'nuevo';
    if (userRole.includes('compras')) return 'nuevo';
    if (userRole.includes('contabilidad')) return 'En Contabilidad';
    if (userRole.includes('maestrodedatos')) return 'con Maestro de datos';
    return '';
  };

  useEffect(() => {
    const loadData = async () => {
      const statusRole = getStatusByRole();
      if (!statusRole) return;

      try {
        setLoading(true);
        const sanitizedStatus = encodeURIComponent(statusRole.trim());
        const url = `${import.meta.env.VITE_BACKEND_URL}/api/codigos/search?status=${sanitizedStatus}`;
        
        const response = await fetchDataBackend(url, null, 'GET', null);
        
        if (response?.codigos) {
          setItems(response.codigos);
        }
      } catch (error) {
        console.error("Error cargando códigos:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    setCurrentPage(1); // Reiniciar a la primera página
  }, [userRole]);

  // Calcular el total de páginas
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = items.slice(startIndex, endIndex);

  // Función para redirigir a la edición
  const handleEdit = (id) => {
    navigate(`/dashboard/insumos/${id}`);
  };

  return (
    <div className="p-6 bg-white min-h-screen" style={{ fontFamily: 'Gowun Batang, serif' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#17243D]">Gestión de Códigos</h1>
        <p className="text-gray-600">
          Este modulo sirve para mostrar la lista entrante de códigos: 
        </p>
      </div>

      <div className="overflow-x-auto shadow-lg rounded-lg">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#17243D] text-white">
              <th className="p-4">ID</th>
              <th className="p-4">SAP Code</th>
              <th className="p-4">Descripción</th>
              <th className="p-4">Detalles</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="p-10 text-center">Cargando registros...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan="6" className="p-10 text-center text-gray-500">No hay códigos pendientes para tu rol.</td></tr>
            ) : (
              currentItems.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-4 font-bold">#{item.id}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded text-xs font-bold uppercase bg-blue-100 text-blue-800">
                      {item.codigo || 'S/N'}
                    </span>
                  </td>
                  <td className="p-4 truncate max-w-[200px]">{item.descripcion}</td>
                  <td className="p-4 truncate max-w-[200px]">{item.detalles}</td>
                  <td className="p-4">
                    <span className="text-sm font-medium capitalize bg-gray-100 px-3 py-1 rounded-full text-gray-700">
                        {item.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {/* CORRECCIÓN: Se agregó el botón de apertura y la función navigate */}
                    <button 
                      onClick={() => handleEdit(item.id)}
                      className="p-2 bg-[#17243D] text-white rounded-full hover:bg-[#EF3340] transition inline-flex items-center justify-center"
                      title="Editar registro"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Controles de paginación */}
      {items.length > 0 && (
        <div className="flex items-center justify-between p-6 bg-gray-50 border border-gray-200 rounded-lg mt-4">
          <div className="text-sm text-gray-600">
            Mostrando <span className="font-semibold">{startIndex + 1}</span> a <span className="font-semibold">{Math.min(endIndex, items.length)}</span> de <span className="font-semibold">{items.length}</span> códigos
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
  );
};

export default DashboardCodigos;