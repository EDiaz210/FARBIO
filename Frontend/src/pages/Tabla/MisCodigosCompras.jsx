import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useFetch from '../../hooks/useFetch';
import storeAuth from '../../context/storeAuth';
import { EyeIcon } from './TablaCodigos_Components';

const MisCodigosCompras = () => {
  const navigate = useNavigate();
  const { token } = storeAuth();
  const { fetchDataBackend } = useFetch();
  const [codigos, setCodigos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const cargarCodigos = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetchDataBackend(
        `${import.meta.env.VITE_BACKEND_URL}/api/codigos/mis-codigos-compras`,
        null,
        'GET',
        token,
        false
      );
      setCodigos(Array.isArray(response?.codigos) ? response.codigos : []);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error cargando mis códigos de Compras:', error);
      setCodigos([]);
    } finally {
      setLoading(false);
    }
  }, [fetchDataBackend, token]);

  useEffect(() => {
    cargarCodigos();
  }, [cargarCodigos]);

  const totalPages = Math.max(1, Math.ceil(codigos.length / itemsPerPage));
  const currentCodigos = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return codigos.slice(start, start + itemsPerPage);
  }, [codigos, currentPage]);

  const verCodigo = (id) => navigate(`/dashboard/mis-codigos-compras/${id}`);

  return (
    <div className="min-h-full overflow-auto" style={{ fontFamily: 'Gowun Batang, serif' }}>
      <div className="w-full bg-green-100">
        <div className="px-6 lg:px-8 py-4 lg:py-5">
          <h1 className="text-4xl font-bold text-black">Mis Códigos</h1>
          <p className="mt-1 text-sm text-black/70">Códigos enviados por ti desde Compras</p>
        </div>
      </div>

      <div className="p-6">
        <div className="w-full overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="block md:hidden divide-y divide-slate-100">
            {loading ? (
              <div className="p-10 text-center text-slate-500 text-sm">Cargando registros...</div>
            ) : currentCodigos.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-sm">No has enviado códigos desde Compras.</div>
            ) : currentCodigos.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-slate-400">#{item.id}</span>
                  <p className="truncate text-sm font-medium text-slate-800">{item.descripcion || 'Sin descripción'}</p>
                  <span className="text-xs text-slate-500">{item.status || 'Sin estado'}</span>
                  <span className="block truncate text-xs text-slate-500">Responsable: {item.responsable_compras || 'Sin responsable'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => verCodigo(item.id)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-800 transition hover:bg-green-200"
                  title="Ver información del código"
                  aria-label="Ver información del código"
                >
                      <EyeIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>

          <div className="hidden md:block w-full overflow-x-auto p-6 pb-0">
            <table className="w-full text-left border-separate border-spacing-y-3">
              <thead>
                <tr className="bg-green-100 text-black">
                  <th className="rounded-tl-[20px] p-5 text-sm font-semibold uppercase tracking-[0.08em]">ID</th>
                  <th className="p-5 text-sm font-semibold uppercase tracking-[0.08em]">Descripción</th>
                  <th className="p-5 text-sm font-semibold uppercase tracking-[0.08em]">Status</th>
                  <th className="p-5 text-sm font-semibold uppercase tracking-[0.08em]">Responsable de Compras</th>
                  <th className="rounded-tr-[20px] p-5 text-center text-sm font-semibold uppercase tracking-[0.08em]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="p-10 text-center text-slate-500">Cargando registros...</td></tr>
                ) : currentCodigos.length === 0 ? (
                  <tr><td colSpan={5} className="p-10 text-center text-slate-500">No has enviado códigos desde Compras.</td></tr>
                ) : currentCodigos.map((item) => (
                  <tr key={item.id} className="group transition hover:-translate-y-0.5">
                    <td className="rounded-l-[20px] bg-white p-5 font-bold text-slate-900 shadow-sm">#{item.id}</td>
                    <td className="max-w-[360px] truncate bg-white p-5 text-slate-700 shadow-sm" title={item.descripcion}>{item.descripcion || 'Sin descripción'}</td>
                    <td className="bg-white p-5 shadow-sm"><span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{item.status || 'Sin estado'}</span></td>
                    <td className="bg-white p-5 text-slate-700 shadow-sm">{item.responsable_compras || 'Sin responsable'}</td>
                    <td className="rounded-r-[20px] bg-white p-5 text-center shadow-sm">
                      <button
                        type="button"
                        onClick={() => verCodigo(item.id)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-800 transition hover:bg-green-200"
                        title="Ver información del código"
                        aria-label="Ver información del código"
                      >
                        <EyeIcon className="h-5 w-5" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268 2.943-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {!loading && codigos.length > 0 && (
          <div className="mt-4 flex items-center justify-between rounded-[24px] border border-slate-200 bg-slate-50 p-4 shadow-sm">
            <span className="text-sm text-slate-600">Página {currentPage} de {totalPages}</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="rounded-lg bg-green-100 px-4 py-2 text-sm disabled:opacity-50">Anterior</button>
              <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="rounded-lg bg-green-100 px-4 py-2 text-sm disabled:opacity-50">Siguiente</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MisCodigosCompras;
