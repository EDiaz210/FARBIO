import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useFetch from '../../hooks/useFetch';
import storeAuth from '../../context/storeAuth';
import { getAuthClaims } from '../../utils/authClaims';

const ITEMS_PER_PAGE = 5;
const getStatusByRole = (userRole = '') => {
  const role = userRole.toLowerCase();
  if (role.includes('solicitante')) return 'nuevo';
  if (role.includes('compras')) return 'nuevo';
  if (role.includes('contabilidad')) return 'En Contabilidad';
  if (role.includes('maestrodedatos')) return 'con Maestro de datos';
  return '';
};

const TablaCodigos = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const { fetchDataBackend } = useFetch();
  const { token } = storeAuth();
  const navigate = useNavigate();

  const claims = getAuthClaims(token);
  const userRole = claims?.rol?.toLowerCase() || '';

  const statusRole = useMemo(() => getStatusByRole(userRole), [userRole]);

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


 

  const totalPages = useMemo(() => Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE)), [items.length]);

  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return items.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [items, currentPage]);

  const handleEdit = (id) => {
    const role = userRole.toLowerCase();
    if (role.includes('compras')) {
      navigate(`/dashboard/compras/editar/${id}`);
    } else if (role.includes('contabilidad')) {
      navigate(`/dashboard/contabilidad/editar/${id}`);
    } else {
      navigate(`/dashboard/insumos/${id}`);
    }
  };

   const activeColorsByRole = {
      solicitante: "bg-[#B2EBF2] text-black",
      compras: "bg-green-100 text-black",
      contabilidad: "bg-yellow-100 text-black",
      maestrodedatos: "bg-blue-300 text-black",
      administrador: "bg-zinc-200 text-black",
    };
    const clasesColor = activeColorsByRole[userRole] ;


const TableRow = ({ item, onEdit }) => (
  <tr className="bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
    <td className="rounded-[20px] rounded-r-none p-5 font-bold text-slate-900">#{item.id}</td>
    <td className="p-5">
      <span className="px-2 py-1 rounded-full text-xs font-semibold uppercase bg-slate-100 text-slate-700">{item.codigo || 'S/N'}</span>
    </td>
    <td className="p-5 truncate max-w-[220px] text-slate-700">{item.descripcion}</td>
    <td className="p-5 truncate max-w-[220px] text-slate-700">{item.detalles}</td>
    <td className="p-5">
      <span className="text-sm font-medium capitalize bg-slate-100 px-3 py-1 rounded-full text-slate-700">{item.status}</span>
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

const Pagination = ({ currentPage, totalPages, onChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between p-6 bg-gray-50 border border-gray-200 rounded-lg mt-4">
      <div className="text-sm text-gray-600">
        Mostrando <span className="font-semibold">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> a <span className="font-semibold">{Math.min(currentPage * ITEMS_PER_PAGE, totalPages * ITEMS_PER_PAGE)}</span> de <span className="font-semibold">{totalPages * ITEMS_PER_PAGE}</span>
      </div>

      <div className="flex gap-2">
        <button onClick={() => onChange((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 bg-[#17243D] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1e2d4a] transition-colors">← Anterior</button>

        <div className="flex gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button key={page} onClick={() => onChange(page)} className={`px-3 py-2 rounded-lg transition-colors ${page === currentPage ? 'bg-[#17243D] text-white font-semibold' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{page}</button>
          ))}
        </div>

        <button onClick={() => onChange((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-4 py-2 bg-[#17243D] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1e2d4a] transition-colors">Siguiente →</button>
      </div>
    </div>
  );
};



  return (
    <div className="py-8 min-h-screen font-sans" style={{ fontFamily: 'Gowun Batang, serif' }}>
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-4xl font-semibold text-slate-900">Gestión de Códigos</h1>
          <p className="text-base text-slate-600 mt-2">Este módulo sirve para mostrar la lista entrante de códigos:</p>
        </div>

        <div className="w-full overflow-hidden rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
          <table className="w-full text-left border-separate border-spacing-y-4">
            <thead>
              <tr className={`${clasesColor} border-b border-slate-200`}>
                <th className="rounded-tl-[24px] p-5 text-sm font-semibold uppercase tracking-[0.08em]">ID</th>
                <th className="p-5 text-center text-sm font-semibold uppercase tracking-[0.08em]">SAP Code</th>
                <th className="p-5 text-sm font-semibold uppercase tracking-[0.08em]">Descripción</th>
                <th className="p-5 text-sm font-semibold uppercase tracking-[0.08em]">Detalles</th>
                <th className="p-5 text-sm font-semibold uppercase tracking-[0.08em]">Status</th>
                <th className="rounded-tr-[24px] p-5 text-center text-sm font-semibold uppercase tracking-[0.08em]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-10 text-center text-slate-500">Cargando registros...</td></tr>
              ) : currentItems.length === 0 ? (
                <tr><td colSpan={6} className="p-10 text-center text-slate-500">No hay códigos pendientes para tu rol.</td></tr>
              ) : (
                currentItems.map((item) => <TableRow key={item.id} item={item} onEdit={handleEdit} />)
              )}
            </tbody>
          </table>
        </div>

        {!loading && items.length > 0 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
        )}
      </div>
    </div>
  );
};

export default TablaCodigos;
