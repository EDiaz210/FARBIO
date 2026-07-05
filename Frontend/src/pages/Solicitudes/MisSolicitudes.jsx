import { useCallback, useEffect, useMemo, useState } from 'react';
import useFetch from '../../hooks/useFetch';
import storeAuth from '../../context/storeAuth';
import { getAuthClaims } from '../../utils/authClaims';

const STATUS_ORDER = ['Nuevo', 'En Contabilidad', 'Con Maestro de Datos', 'Finalizado'];

const StepIcon = ({ currentStatus, stepName, accentColor }) => {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  const stepIndex = STATUS_ORDER.indexOf(stepName);
  const isCompleted = currentIndex >= stepIndex && currentIndex !== -1;

  return isCompleted ? (
    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm transition-all duration-300 bg-gradient-to-r from-[#274C77] via-[#2F5D8A] to-[#1F3F5B]">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  ) : (
    <div className="w-7 h-7 rounded-lg border-2 border-slate-200 bg-slate-50"></div>
  );
};

// Componente para la versión Móvil (Estilo Acordeón/Tarjeta)
const SolicitudCardMovil = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);
  const description = item.descripcionc || item.descripcion || item.descripcionSolicitante || 'Sin descripción';
  const code = item.codigo || '---';
  const status = item.status || '';

  return (
    <div className="border-b border-slate-100 last:border-none p-4 bg-white transition-colors">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
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
            <span className="text-slate-500 font-medium">Compras:</span>
            <StepIcon currentStatus={status} stepName="Nuevo" accentColor="bg-[#B2EBF2] text-slate-800" />
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Contabilidad:</span>
            <StepIcon currentStatus={status} stepName="En Contabilidad" accentColor="bg-[#B2EBF2] text-slate-800" />
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Maestro Datos:</span>
            <StepIcon currentStatus={status} stepName="Con Maestro de Datos" accentColor="bg-[#B2EBF2] text-slate-800" />
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">SAP Finalizado:</span>
            <StepIcon currentStatus={status} stepName="Finalizado" accentColor="bg-[#B2EBF2] text-slate-800" />
          </div>
        </div>
      )}
    </div>
  );
};

// Componente de Fila para Escritorio Tradicional
const SolicitudRowEscritorio = ({ item }) => {
  const description = item.descripcionc || item.descripcion || item.descripcionSolicitante || 'Sin descripción';
  const code = item.codigo || '---';
  const status = item.status || '';

  return (
    <tr className="bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <td className="rounded-[20px] rounded-r-none p-5 font-bold text-slate-900">#{item.id}</td>
      <td className="p-5 text-center font-mono text-sm text-slate-500">{code}</td>
      <td className="p-5 text-slate-700 font-medium">{description}</td>
      <td className="p-5 text-center">
        <div className="flex justify-center">
          <StepIcon currentStatus={status} stepName="Nuevo" accentColor="bg-[#B2EBF2] text-slate-800" />
        </div>
      </td>
      <td className="p-5 text-center">
        <div className="flex justify-center">
          <StepIcon currentStatus={status} stepName="En Contabilidad" accentColor="bg-[#B2EBF2] text-slate-800" />
        </div>
      </td>
      <td className="p-5 text-center">
        <div className="flex justify-center">
          <StepIcon currentStatus={status} stepName="Con Maestro de Datos" accentColor="bg-[#B2EBF2] text-slate-800" />
        </div>
      </td>
      <td className="rounded-[20px] rounded-l-none p-5 text-center">
        <div className="flex justify-center">
          <StepIcon currentStatus={status} stepName="Finalizado" accentColor="bg-[#B2EBF2] text-slate-800" />
        </div>
      </td>
    </tr>
  );
};

const MisSolicitudes = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5); // Valor por defecto inicial

  const { fetchDataBackend } = useFetch();
  const { token } = storeAuth();
  
  const claims = getAuthClaims(token);
  const userID = claims?.id || null;

  // 🔹 CÁLCULO 100% DINÁMICO BASADO EN EL ALTO DE LA PANTALLA REAL (innerHeight)
  useEffect(() => {
    const calculateItems = () => {
      const vh = window.innerHeight;
      const isMobile = window.innerWidth < 768;

      if (isMobile) {
        // En móvil el espacio restante para el contenedor es menor.
        // Restamos ~260px (Header + Paginación inferior) y dividimos por ~75px que mide cada tarjeta cerrada.
        const dynamicCards = Math.floor((vh - 260) / 75);
        setItemsPerPage(Math.max(3, dynamicCards)); // Como mínimo muestra 3 elementos
      } else {
        // En escritorio restamos ~340px (Header + Títulos de la tabla + Paginación)
        // Cada fila de la tabla mide alrededor de ~85px debido a los paddings.
        const dynamicRows = Math.floor((vh - 340) / 85);
        setItemsPerPage(Math.max(4, dynamicRows)); // Como mínimo muestra 4 elementos
      }
    };

    calculateItems(); // Ejecución inicial
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
    <div className="min-h-full overflow-auto" style={{ fontFamily: 'Gowun Batang, serif' }}>
      <div className="w-full bg-gradient-to-r from-[#274C77] via-[#2F5D8A] to-[#1F3F5B] text-white shadow-sm">
        <div className="px-6 lg:px-8 py-4 lg:py-5">
          <h1 className="text-4xl font-bold">Mis Solicitudes</h1>
          <p className="mt-1 text-sm text-white/90">Seguimiento en tiempo real del proceso de creación</p>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
          
          {/* 📱 VERSIÓN MÓVIL (Lista expandible) */}
          <div className="block md:hidden divide-y divide-slate-100">
            {currentSolicitudes.map((item) => (
              <SolicitudCardMovil key={item.id} item={item} />
            ))}
          </div>

          {/* 💻 VERSIÓN ESCRITORIO (Ajuste fluido de columnas sin scroll) */}
          <div className="hidden md:block w-full p-6 pb-0">
            <table className="w-full text-left border-separate border-spacing-y-4 layout-fixed">
              <thead>
                <tr className="bg-gradient-to-r from-[#274C77] via-[#2F5D8A] to-[#1F3F5B] text-white shadow-sm">
                  <th className="rounded-tl-[24px] p-5 text-sm font-semibold uppercase tracking-[0.08em] w-[8%]">ID</th>
                  <th className="p-5 text-center text-sm font-semibold uppercase tracking-[0.08em] w-[15%]">SAP Code</th>
                  <th className="p-5 text-sm font-semibold uppercase tracking-[0.08em] w-[37%]">Descripción</th>
                  <th className="p-5 text-center text-sm font-semibold uppercase tracking-[0.08em] w-[10%]">Compras</th>
                  <th className="p-5 text-center text-sm font-semibold uppercase tracking-[0.08em] w-[10%]">Contabilidad</th>
                  <th className="p-5 text-center text-sm font-semibold uppercase tracking-[0.08em] w-[12%]">Maestro Datos</th>
                  <th className="rounded-tr-[24px] p-5 text-center text-sm font-semibold uppercase tracking-[0.08em] w-[8%]">SAP</th>
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
                  className="px-3 sm:px-4 py-2 bg-[#B2EBF2] text-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0f1b35] transition-colors text-xs sm:text-sm flex-1 sm:flex-none text-center"
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
                  className="px-3 sm:px-4 py-2 bg-[#B2EBF2] text-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0f1b35] transition-colors text-xs sm:text-sm flex-1 sm:flex-none text-center"
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