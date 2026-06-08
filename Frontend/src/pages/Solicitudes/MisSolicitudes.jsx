import { useCallback, useEffect, useMemo, useState } from 'react';
import useFetch from '../../hooks/useFetch';
import storeAuth from '../../context/storeAuth';

const ITEMS_PER_PAGE = 5;
const STATUS_ORDER = ['Nuevo', 'En Contabilidad', 'Con Maestro de Datos', 'Completado'];

const getRoleStatus = (rol = '') => {
  const normalized = rol.toLowerCase();

  if (normalized.includes('solicitante') || normalized.includes('compras')) return 'nuevo';
  if (normalized.includes('contabilidad')) return 'En Contabilidad';
  if (normalized.includes('maestro')) return 'con Maestro de datos';
  return '';
};

const StepIcon = ({ currentStatus, stepName }) => {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  const stepIndex = STATUS_ORDER.indexOf(stepName);
  const isCompleted = currentIndex >= stepIndex && currentIndex !== -1;

  return isCompleted ? (
    <div className="w-7 h-7 bg-[#3B6EE8] rounded-lg flex items-center justify-center text-white shadow-sm transition-all duration-300">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  ) : (
    <div className="w-7 h-7 border-2 border-slate-200 rounded-lg bg-slate-50"></div>
  );
};

const SolicitudRow = ({ item }) => {
  const description = item.descripcionc || item.descripcion || 'Sin descripción';
  const code = item.codigo || '---';
  const status = item.status || '';

  return (
    <tr className="bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <td className="rounded-[20px] rounded-r-none p-5 font-bold text-slate-900">#{item.id}</td>
      <td className="p-5 text-center font-mono text-sm text-slate-500">{code}</td>
      <td className="p-5 text-slate-700 font-medium">{description}</td>
      <td className="p-5 text-center">
        <div className="flex justify-center"><StepIcon currentStatus={status} stepName="Nuevo" /></div>
      </td>
      <td className="p-5 text-center">
        <div className="flex justify-center"><StepIcon currentStatus={status} stepName="En Contabilidad" /></div>
      </td>
      <td className="p-5 text-center">
        <div className="flex justify-center"><StepIcon currentStatus={status} stepName="Con Maestro de Datos" /></div>
      </td>
      <td className="rounded-[20px] rounded-l-none p-5 text-center">
        <div className="flex justify-center"><StepIcon currentStatus={status} stepName="Completado" /></div>
      </td>
    </tr>
  );
};

const Pagination = ({ currentPage, totalPages, onChangePage }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between p-6 bg-slate-50 border-t border-slate-100">
      <div className="text-sm text-slate-600">
        Mostrando <span className="font-semibold text-slate-900">{currentPage}</span> de <span className="font-semibold text-slate-900">{totalPages}</span> páginas
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onChangePage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-[#3B6EE8] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0f1b35] transition-colors"
        >
          ← Anterior
        </button>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
          <button
            key={page}
            onClick={() => onChangePage(page)}
            className={`px-3 py-2 rounded-lg transition-colors ${
              page === currentPage
                ? 'bg-[#3B6EE8] text-white font-semibold'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onChangePage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-[#3B6EE8] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0f1b35] transition-colors"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
};

const MisSolicitudes = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const { fetchDataBackend } = useFetch();
  const { user, token } = storeAuth();

  const roleStatus = useMemo(() => getRoleStatus(user?.rol), [user?.rol]);

  const fetchData = useCallback(async () => {
    if (!roleStatus) return;

    const sanitizedStatus = encodeURIComponent(roleStatus.trim());
    const url = `${import.meta.env.VITE_BACKEND_URL}/api/codigos/search?status=${sanitizedStatus}`;

    const response = await fetchDataBackend(url, null, 'GET', token, false);
    if (response?.codigos) {
      setSolicitudes(response.codigos);
      setCurrentPage(1);
    }
  }, [fetchDataBackend, roleStatus, token]);

  useEffect(() => {
    if (user?.id && roleStatus) fetchData();
  }, [user?.id, roleStatus, fetchData]);

  const totalPages = useMemo(() => Math.ceil(solicitudes.length / ITEMS_PER_PAGE), [solicitudes.length]);
  const currentSolicitudes = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return solicitudes.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, solicitudes]);

  return (
    <div className="py-8 min-h-screen font-sans" style={{ fontFamily: 'Gowun Batang, serif' }}>
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-4xl font-semibold text-slate-900">Mis Solicitudes</h1>
          <p className="text-base text-slate-600 mt-2">Seguimiento en tiempo real del proceso de creación</p>
        </header>

        <div className="w-full overflow-hidden rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
          <table className="w-full text-left border-separate border-spacing-y-4">
            <thead>
              <tr className="bg-[#1E3A8A] text-white">
                <th className="rounded-tl-[24px] p-5 text-sm font-semibold uppercase tracking-[0.08em]">ID</th>
                <th className="p-5 text-center text-sm font-semibold uppercase tracking-[0.08em]">SAP Code</th>
                <th className="p-5 text-sm font-semibold uppercase tracking-[0.08em]">Descripción</th>
                <th className="p-5 text-center text-sm font-semibold uppercase tracking-[0.08em]">Compras</th>
                <th className="p-5 text-center text-sm font-semibold uppercase tracking-[0.08em]">Contabilidad</th>
                <th className="p-5 text-center text-sm font-semibold uppercase tracking-[0.08em]">Maestro Datos</th>
                <th className="rounded-tr-[24px] p-5 text-center text-sm font-semibold uppercase tracking-[0.08em]">SAP</th>
              </tr>
            </thead>
            <tbody>
              {currentSolicitudes.map((item) => (
                <SolicitudRow key={item.id} item={item} />
              ))}
            </tbody>
          </table>

          {solicitudes.length === 0 && (
            <div className="p-20 text-center text-slate-400">No tienes solicitudes registradas actualmente.</div>
          )}

          <Pagination currentPage={currentPage} totalPages={totalPages} onChangePage={setCurrentPage} />
        </div>
      </div>
    </div>
  );
};

export default MisSolicitudes;
