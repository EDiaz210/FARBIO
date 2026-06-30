import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useFetch from '../../hooks/useFetch';
import storeAuth from '../../context/storeAuth';
import { getAuthClaims } from '../../utils/authClaims';

const getStatusByRole = (userRole = '') => {
  const role = userRole.toLowerCase();
  if (role.includes('solicitante')) return 'nuevo';
  if (role.includes('compras')) return 'nuevo';
  if (role.includes('contabilidad')) return 'En Contabilidad';
  if (role.includes('maestrodedatos') || role.includes('maestro')) return 'con Maestro de datos';
  return '';
};

// 📱 NUEVO: Sub-componente Tarjeta Móvil (Estilo Acordeón Adaptado)
const CardMovil = ({ item, onEdit, clasesColor }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-none p-4 bg-white transition-colors">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-6 h-6 rounded-full ${clasesColor} flex items-center justify-center transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block">#{item.id}</span>
            <span className="font-medium text-slate-800 text-sm line-clamp-1">{item.descripcion}</span>
          </div>
        </div>
        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
          {item.codigo || 'S/N'}
        </span>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-dashed border-slate-100 bg-slate-50/50 p-4 rounded-xl space-y-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Detalles:</span>
            <p className="text-sm text-slate-700">{item.detalles || 'Sin detalles adicionales'}</p>
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Status:</span>
              <span className="text-xs font-medium capitalize bg-white border border-slate-200 px-2.5 py-1 rounded-full text-slate-700 shadow-sm">
                {item.status}
              </span>
            </div>
            
            <button
              onClick={() => onEdit(item.id)}
              className={`inline-flex h-11 px-4 items-center gap-2 rounded-xl ${clasesColor} transition hover:opacity-90 shadow-sm text-sm font-medium`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Ver registro
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// 💻 Sub-componente: Fila de la Tabla Escritorio (Modificado sin max-w forzados)
const TableRowEscritorio = ({ item, onEdit, clasesColor }) => (
  <tr className="bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
    <td className="rounded-[20px] rounded-r-none p-5 font-bold text-slate-900">#{item.id}</td>
    <td className="p-5 text-center">
      <span className="px-2 py-1 rounded-full text-xs font-semibold uppercase bg-slate-100 text-slate-700">
        {item.codigo || 'S/N'}
      </span>
    </td>
    <td className="p-5 text-slate-700 font-medium truncate max-w-0">{item.descripcion}</td>
    <td className="p-5 text-slate-500 truncate max-w-0">{item.detalles}</td>
    <td className="p-5 text-center">
      <span className="text-sm font-medium capitalize bg-slate-100 px-3 py-1 rounded-full text-slate-700">
        {item.status}
      </span>
    </td>
    <td className="rounded-[20px] rounded-l-none p-5 text-center">
      <button
        onClick={() => onEdit(item.id)}
        className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${clasesColor} transition hover:opacity-80`}
        title="Editar registro"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </button>
    </td>
  </tr>
);

// Componente Principal
const TablaCodigos = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5); // 🔹 Cambió a estado dinámico adaptativo

  const { fetchDataBackend } = useFetch();
  const { token } = storeAuth();
  const navigate = useNavigate();

  const claims = getAuthClaims(token);
  const userRole = claims?.rol?.toLowerCase() || '';
  const statusRole = useMemo(() => getStatusByRole(userRole), [userRole]);

  // Colores dinámicos por rol operativo
  const activeColorsByRole = {
    solicitante: "bg-[#B2EBF2] text-black",
    compras: "bg-green-100 text-black",
    contabilidad: "bg-yellow-100 text-black",
    maestrodedatos: "bg-blue-300 text-black",
    maestro: "bg-blue-300 text-black"
  };
  
  const clasesColor = activeColorsByRole[userRole] || "bg-slate-100 text-black";

  // 🔹 CÁLCULO 100% DINÁMICO BASADO EN EL ALTO DE LA PANTALLA REAL (innerHeight)
  useEffect(() => {
    const calculateItems = () => {
      const vh = window.innerHeight;
      const isMobile = window.innerWidth < 768;

      if (isMobile) {
        // Altura de tarjeta móvil cerrada es aprox 75px
        const dynamicCards = Math.floor((vh - 260) / 75);
        setItemsPerPage(Math.max(3, dynamicCards));
      } else {
        // Altura de fila de tabla de control es aprox 85px
        const dynamicRows = Math.floor((vh - 340) / 85);
        setItemsPerPage(Math.max(4, dynamicRows));
      }
    };

    calculateItems();
    window.addEventListener('resize', calculateItems);
    return () => window.removeEventListener('resize', calculateItems);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!statusRole) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const sanitizedStatus = encodeURIComponent(statusRole.trim());
        const url = `${import.meta.env.VITE_BACKEND_URL}/api/codigos/search?status=${sanitizedStatus}`;
        const response = await fetchDataBackend(url, null, 'GET', null);
        if (response?.codigos) setItems(response.codigos);
      } catch (err) {
        console.error('Error cargando códigos:', err);
      } finally {
        setLoading(false);
        setCurrentPage(1);
      }
    };

    loadData();
  }, [fetchDataBackend, statusRole]);

  // Se recalculan dinámicamente con el nuevo valor calculado por el hook resize
  const totalPages = useMemo(() => Math.max(1, Math.ceil(items.length / itemsPerPage)), [items.length, itemsPerPage]);

  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  }, [items, currentPage, itemsPerPage]);

  const handleEdit = (id) => {
    if (userRole.includes('compras')) {
      navigate(`/dashboard/compras/editar/${id}`);
    } else if (userRole.includes('contabilidad')) {
      navigate(`/dashboard/contabilidad/editar/${id}`);
    } else if (userRole.includes('maestro')) {
      navigate(`/dashboard/maestro/editar/${id}`);
    } else if (userRole.includes('solicitante')) {
      navigate(`/dashboard/insumos/editar/${id}`);
    }
  };

  if (userRole.includes('administrador')) {
    return (
      <div className="py-8 min-h-screen flex items-center justify-center font-sans">
        <div className="text-center p-8 bg-red-50 rounded-2xl border border-red-200 max-w-md">
          <h2 className="text-2xl font-bold text-red-700">Acceso Restringido</h2>
          <p className="text-sm text-red-600 mt-2">
            Esta bandeja de control es exclusiva para los flujos operativos. Los administradores no gestionan flujos de códigos desde aquí.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 min-h-screen font-sans" style={{ fontFamily: 'Gowun Batang, serif' }}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900">Gestión de Códigos</h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2">Este módulo sirve para mostrar la lista entrante de códigos:</p>
        </div>

        {/* Contenedor principal de la interfaz */}
        <div className="w-full overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
          
          {/* 📱 VERSIÓN MÓVIL (Lista expandible tipo Acordeón) */}
          <div className="block md:hidden divide-y divide-slate-100">
            {loading ? (
              <div className="p-10 text-center text-slate-500 text-sm">Cargando registros...</div>
            ) : currentItems.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-sm">No hay códigos pendientes para tu rol.</div>
            ) : (
              currentItems.map((item) => (
                <CardMovil key={item.id} item={item} onEdit={handleEdit} clasesColor={clasesColor} />
              ))
            )}
          </div>

          {/* 💻 VERSIÓN ESCRITORIO (Diseño fluido sin scrolls innecesarios) */}
          <div className="hidden md:block w-full p-6 pb-0">
            <table className="w-full text-left border-separate border-spacing-y-4 layout-fixed">
              <thead>
                <tr className={`${clasesColor} border-b border-slate-200`}>
                  <th className="rounded-tl-[24px] p-5 text-sm font-semibold uppercase tracking-[0.08em] w-[8%]">ID</th>
                  <th className="p-5 text-center text-sm font-semibold uppercase tracking-[0.08em] w-[15%]">SAP Code</th>
                  <th className="p-5 text-sm font-semibold uppercase tracking-[0.08em] w-[35%]">Descripción</th>
                  <th className="p-5 text-sm font-semibold uppercase tracking-[0.08em] w-[22%]">Detalles</th>
                  <th className="p-5 text-center text-sm font-semibold uppercase tracking-[0.08em] w-[12%]">Status</th>
                  <th className="rounded-tr-[24px] p-5 text-center text-sm font-semibold uppercase tracking-[0.08em] w-[8%]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-10 text-center text-slate-500 text-sm">Cargando registros...</td></tr>
                ) : currentItems.length === 0 ? (
                  <tr><td colSpan={6} className="p-10 text-center text-slate-500 text-sm">No hay códigos pendientes para tu rol.</td></tr>
                ) : (
                  currentItems.map((item) => (
                    <TableRowEscritorio key={item.id} item={item} onEdit={handleEdit} clasesColor={clasesColor} />
                  ))
                )}
              </tbody>
            </table>
          </div>
          
        </div>

        {/* Bloque de Paginación Inteligente fuera de las envolturas de datos */}
        {!loading && items.length > 0 && totalPages > 1 && (
          <div className="p-4 sm:p-6 bg-slate-50 border border-slate-200 rounded-[24px] mt-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
            <div className="text-xs sm:text-sm text-slate-600 text-center sm:text-left">
              Mostrando <span className="font-semibold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> a{' '}
              <span className="font-semibold text-slate-900">{Math.min(currentPage * itemsPerPage, items.length)}</span> de{' '}
              <span className="font-semibold text-slate-900">{items.length}</span> registros
            </div>

            <div className="flex flex-wrap justify-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 sm:px-4 py-2 ${clasesColor} rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm flex-1 sm:flex-none text-center`}
              >
                ← Anterior
              </button>

              <div className="hidden sm:flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                      page === currentPage ? `${clasesColor} font-semibold` : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-3 sm:px-4 py-2 ${clasesColor} rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm flex-1 sm:flex-none text-center`}
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TablaCodigos;