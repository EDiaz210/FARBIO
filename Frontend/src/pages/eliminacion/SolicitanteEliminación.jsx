import { useState } from 'react';
import { toast } from 'react-toastify';
import useFetch from '../../hooks/useFetch';
import storeAuth from '../../context/storeAuth';
import { getAuthClaims } from '../../utils/authClaims';

const SolicitanteEliminacion = ({ codigo, isOpen, onClose, onDeleted }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { token } = storeAuth();
  const { fetchDataBackend } = useFetch();
  const claims = getAuthClaims(token);
  const userId = claims?.id;
  const userName = claims?.nombre || claims?.name || claims?.username || 'Solicitante';

  if (!isOpen || !codigo) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const url = `${import.meta.env.VITE_BACKEND_URL}/api/codigos/${codigo.id}`;
      const response = await fetchDataBackend(
        url,
        { userId, userName },
        'DELETE',
        token
      );

      if (response?.success) {
        toast.success('Código eliminado correctamente');
        onDeleted?.();
        onClose?.();
      } else {
        toast.error(response?.message || 'No se pudo eliminar el código');
      }
    } catch (error) {
      console.error('Error eliminando código:', error);
      toast.error('Error eliminando el código');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-700">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">¿Eliminar código?</h2>
            <p className="mt-2 text-sm text-slate-600">
              Esta acción no se puede deshacer. El código será eliminado permanentemente.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
          <p><span className="font-semibold">Descripción:</span> {codigo.descripcion || 'Sin descripción'}</p>
          <p><span className="font-semibold">Detalles:</span> {codigo.detalles || 'Sin detalles'}</p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:w-auto"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300 sm:w-auto"
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar código'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SolicitanteEliminacion;
