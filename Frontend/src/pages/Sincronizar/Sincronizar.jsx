import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import useFetch from '../../hooks/useFetch';

const Sincronizar = ({ compact = false, token = null }) => {
  const { fetchDataBackend } = useFetch();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const ejecutarSincronizacion = async () => {
    setLoading(true);
    setResult(null);

    try {
      const url = `${import.meta.env.VITE_BACKEND_URL}/api/sync/sap-to-mysql`;
      const response = await fetchDataBackend(url, null, 'POST', token);

      if (!response?.success) {
        toast.error(response?.message || 'No se pudo completar la sincronización');
        return;
      }

      setResult(response);
      toast.success(`Sincronización completada: ${response.updated} registros actualizados`);
    } catch (error) {
      console.error('Error al sincronizar SAP:', error);
      toast.error('Error al conectar con el servicio de sincronización');
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <>
        <button
          type="button"
          onClick={ejecutarSincronizacion}
          disabled={loading}
          title="Sincronizar códigos con SAP"
          aria-label="Sincronizar códigos con SAP"
          className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <ToastContainer />
      <div className="mx-auto max-w-4xl">
        <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Panel administrativo</p>
        <h1 className="mt-2 text-4xl font-semibold text-slate-950">Sincronización con SAP</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Actualiza en MySQL los datos de artículos que hayan cambiado en SAP.
        </p>

        <div className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <button
            type="button"
            onClick={ejecutarSincronizacion}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-[28px] bg-[#17243D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Sincronizando...' : 'Iniciar sincronización'}
          </button>

          {result && (
            <div className="mt-6 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
              <p><strong className="text-slate-900">Total:</strong> {result.total}</p>
              <p><strong className="text-slate-900">Actualizados:</strong> {result.updated}</p>
              <p><strong className="text-slate-900">Omitidos:</strong> {result.skipped}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sincronizar;