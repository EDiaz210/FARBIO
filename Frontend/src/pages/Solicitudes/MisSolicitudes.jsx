import { useCallback, useEffect, useMemo, useState } from 'react';
import useFetch from '../../hooks/useFetch';
import storeAuth from '../../context/storeAuth';
import { getAuthClaims } from '../../utils/authClaims';

const STATUS_ORDER = ['RetornoSolicitante', 'Nuevo', 'RetornoCompras', 'En Contabilidad', 'Con Maestro de Datos', 'Finalizado'];

const StepIcon = ({ currentStatus, stepName }) => {
  let isCompleted = false;

  if (currentStatus === 'RetornoCompras' || currentStatus === 'RetornoSolicitante') {
    isCompleted = currentStatus === stepName;
  } else {
    const cleanOrder = ['Nuevo', 'En Contabilidad', 'Con Maestro de Datos', 'Finalizado'];
    const currentIndex = cleanOrder.indexOf(currentStatus);
    const stepIndex = cleanOrder.indexOf(stepName);
    
    if (stepIndex !== -1) {
      isCompleted = currentIndex >= stepIndex && currentIndex !== -1;
    }
  }

  return isCompleted ? (
    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm transition-all duration-300 bg-gradient-to-r from-[#274C77] via-[#2F5D8A] to-[#1F3F5B] shrink-0">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  ) : (
    <div className="w-7 h-7 rounded-lg border-2 border-slate-200 bg-slate-50 shrink-0"></div>
  );
};

// Componente para la versión Móvil (Vertical estándar)
const SolicitudCardMovil = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);
  const description = item.descripcionc || item.descripcion || item.descripcionSolicitante || 'Sin descripción';
  const code = item.codigo || '---';
  const status = item.status || '';

  return (
    <div className="border-b border-slate-100 last:border-none p-4 bg-white transition-colors">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-3">
          <div className={`w-6 h-6 rounded-full bg-gradient-to-r from-[#274C77] via-[#2F5D8A] to-[#1F3F5B] text-white flex items-center justify-center transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block">#{item.id}</span>
            <span className="font-medium text-slate-800 text-sm line-clamp-1">{description}</span>
          </div>
        </div>
        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{code}</span>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-dashed border-slate-100 bg-slate-50/50 p-3 rounded-xl space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Retorno Solicitante:</span>
            <StepIcon currentStatus={status} stepName="RetornoSolicitante" />
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Compras:</span>
            <StepIcon currentStatus={status} stepName="Nuevo" />
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Retorno Compras:</span>
            <StepIcon currentStatus={status} stepName="RetornoCompras" />
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Contabilidad:</span>
            <StepIcon currentStatus={status} stepName="En Contabilidad" />
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Maestro Datos:</span>
            <StepIcon currentStatus={status} stepName="Con Maestro de Datos" />
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">SAP Finalizado:</span>
            <StepIcon currentStatus={status} stepName="Finalizado" />
          </div>
        </div>
      )}
    </div>
  );
};

// Componente de Fila para Escritorio / Pantallas Horizontales
const SolicitudRowEscritorio = ({ item }) => {
  const description = item.descripcionc || item.descripcion || item.descripcionSolicitante || 'Sin descripción';
  const code = item.codigo || '---';
  const status = item.status || '';

  return (
    <tr className="bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <td className="rounded-[20px] rounded-r-none py-4 pl-4 pr-2 font-bold text-slate-900 whitespace-nowrap text-sm">#{item.id}</td>
      <td className="py-4 px-2 text-center font-mono text-xs text-slate-500 whitespace-nowrap">{code}</td>
      
      <td className="py-4 px-3 text-slate-700 font-medium text-sm min-w-[140px] max-w-[200px] lg:max-w-[none] truncate" title={description}>
        {description}
      </td>
      
      <td className="py-4 px-1 text-center">
        <div className="flex justify-center"><StepIcon currentStatus={status} stepName="RetornoSolicitante" /></div>
      </td>
      <td className="py-4 px-1 text-center">
        <div className="flex justify-center"><StepIcon currentStatus={status} stepName="Nuevo" /></div>
      </td>
      <td className="py-4 px-1 text-center">
        <div className="flex justify-center"><StepIcon currentStatus={status} stepName="RetornoCompras" /></div>
      </td>
      <td className="py-4 px-1 text-center">
        <div className="flex justify-center"><StepIcon currentStatus={status} stepName="En Contabilidad" /></div>
      </td>
      <td className="py-4 px-1 text-center">
        <div className="flex justify-center"><StepIcon currentStatus={status} stepName="Con Maestro de Datos" /></div>
      </td>
      <td className="rounded-[20px] rounded-l-none py-4 pl-1 pr-4 text-center">
        <div className="flex justify-center"><StepIcon currentStatus={status} stepName="Finalizado" /></div>
      </td>
    </tr>
  );
};

const MisSolicitudes = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const { fetchDataBackend } = useFetch();
  const { token } = storeAuth();
  
  const claims = getAuthClaims(token);
  const userID = claims?.id || null;

  useEffect(() => {
    const calculateItems = () => {
      const vh = window.innerHeight;
      const isMobile = window.innerWidth < 768;

      if (isMobile) {
        const dynamicCards = Math.floor((vh - 260) / 80);
        setItemsPerPage(Math.max(3, dynamicCards));
      } else {
        const dynamicRows = Math.floor((vh - 340) / 85);
        setItemsPerPage(Math.max(4, dynamicRows));
      }
    };

    calculateItems();
    window.addEventListener('resize', calculateItems);
    return () => window.removeEventListener('resize', calculateItems);
  }, []);

  const fetchData = useCallback(async () => {
    if (!userID) return;
    const url = `${import.meta.env.VITE_BACKEND_URL}/api/codigos/mis-codigos?created_by=${userID}`;
    const response = await fetchDataBackend(url, null, 'GET', token, false);
    if (response?.codigos) {
      setSolicitudes(response.codigos);
      setCurrentPage(1);
    }
  }, [fetchDataBackend, userID, token]);

  useEffect(() => {
    if (userID) fetchData();
  }, [userID, fetchData]);

  const totalPages = useMemo(() => Math.ceil(solicitudes.length / itemsPerPage), [solicitudes.length, itemsPerPage]);
  
  const currentSolicitudes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return solicitudes.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, solicitudes, itemsPerPage]);

  return (
    <div className="min-h-full overflow-y-auto overflow-x-hidden" style={{ fontFamily: 'Gowun Batang, serif' }}>
      <div className="w-full bg-gradient-to-r from-[#274C77] via-[#2F5D8A] to-[#1F3F5B] text-white shadow-sm">
        <div className="px-6 lg:px-8 py-4 lg:py-5">
          <h1 className="text-4xl font-bold">Mis Solicitudes</h1>
          <p className="mt-1 text-sm text-white/90">Seguimiento en tiempo real del proceso de creación</p>
        </div>
      </div>

      <div className="p-6">
        <div className="w-full overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
          
          {/* 📱 VERSIÓN MÓVIL (PORTRAIT / VERTICAL) */}
          <div className="block md:hidden divide-y divide-slate-100">
            {currentSolicitudes.map((item) => (
              <SolicitudCardMovil key={item.id} item={item} />
            ))}
          </div>

          {/* 💻 VERSIÓN TABLA (ESCRITORIO / CELULAR HORIZONTAL) */}
          {/* 🚀 SOLUCIÓN: Cambiado a `overflow-x-auto` global para la tabla, pero limitando un `min-w-[850px]` únicamente para prevenir colapsos en pantallas inferiores a laptops (como celulares acostados) sin afectar monitores */}
          <div className="hidden md:block w-full p-6 pb-0 overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-4 table-auto min-w-[850px] lg:min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-[#274C77] via-[#2F5D8A] to-[#1F3F5B] text-white shadow-sm text-xs lg:text-sm">
                  <th className="rounded-tl-[24px] py-4 pl-4 pr-2 font-semibold uppercase tracking-[0.05em] whitespace-nowrap w-[5%]">ID</th>
                  <th className="py-4 px-2 text-center font-semibold uppercase tracking-[0.05em] whitespace-nowrap w-[10%]">SAP Code</th>
                  <th className="py-4 px-3 font-semibold uppercase tracking-[0.05em] whitespace-nowrap">Descripción</th>
                  
                  <th className="py-4 px-1 text-center font-semibold uppercase tracking-[0.05em] whitespace-nowrap w-[11%]">Ret. Solic.</th>
                  <th className="py-4 px-1 text-center font-semibold uppercase tracking-[0.05em] whitespace-nowrap w-[10%]">Compras</th>
                  <th className="py-4 px-1 text-center font-semibold uppercase tracking-[0.05em] whitespace-nowrap w-[11%]">Ret. Compras</th>
                  
                  <th className="py-4 px-1 text-center font-semibold uppercase tracking-[0.05em] whitespace-nowrap w-[11%]">Contabilidad</th>
                  <th className="py-4 px-1 text-center font-semibold uppercase tracking-[0.05em] whitespace-nowrap w-[12%]">Maestro Datos</th>
                  <th className="rounded-tr-[24px] py-4 pl-1 pr-4 text-center font-semibold uppercase tracking-[0.05em] whitespace-nowrap w-[6%]">SAP</th>
                </tr>
              </thead>
              <tbody>
                {currentSolicitudes.map((item) => (
                  <SolicitudRowEscritorio key={item.id} item={item} />
                ))}
              </tbody>
            </table>
          </div>

          {solicitudes.length === 0 && (
            <div className="p-20 text-center text-slate-400 text-sm">No tienes solicitudes registradas actualmente.</div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="text-xs sm:text-sm text-slate-600 text-center sm:text-left">
                Mostrando <span className="font-semibold text-slate-900">{currentPage}</span> de <span className="font-semibold text-slate-900">{totalPages}</span> páginas
              </div>
              
              <div className="flex flex-wrap justify-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 sm:px-4 py-2 bg-[#B2EBF2] text-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0f1b35] hover:text-white transition-colors text-xs sm:text-sm flex-1 sm:flex-none text-center"
                >
                  ← Anterior
                </button>
                
                <div className="hidden sm:flex gap-1">
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                        page === currentPage
                          ? 'bg-[#B2EBF2] text-black font-semibold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 sm:px-4 py-2 bg-[#B2EBF2] text-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0f1b35] hover:text-white transition-colors text-xs sm:text-sm flex-1 sm:flex-none text-center"
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