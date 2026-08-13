import { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import useFetch from '../../hooks/useFetch';
import storeAuth from '../../context/storeAuth';

const DevolucionContabilidad = ({ isOpen, onClose, codigoId, onSuccess }) => {
  const [comentario, setComentario] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const { fetchDataBackend } = useFetch();
  const { token } = storeAuth();

  useEffect(() => {
    if (!isOpen) {
      setComentario('');
      setIsSubmitting(false);
      setValidationError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validación: vacío, mínimo 10, máximo 200
    if (!comentario || comentario.trim().length === 0) {
      setValidationError('El comentario es obligatorio para devolver el código');
      return;
    }
    if (comentario.trim().length < 10) {
      setValidationError('El comentario debe tener al menos 10 caracteres');
      return;
    }
    if (comentario.length > 200) {
      setValidationError('El comentario debe tener máximo 200 caracteres');
      return;
    }

    setValidationError('');

    try {
      setIsSubmitting(true);

      const response = await fetchDataBackend(
        `${import.meta.env.VITE_BACKEND_URL}/api/contabilidad/retorno`,
        { id: codigoId, comentario: comentario.trim() },
        'POST',
        token
      );

      if (response?.msg || response?.message || response?.success) {
        // Mostrar toast de éxito y cerrar la modal cuando el toast se cierre
        toast.success('Código devuelto correctamente', {
          autoClose: 1500,
          onClose: () => {
            onSuccess?.();
            onClose();
            setComentario('');
            setValidationError('');
          }
        });
      } else {
        toast.error(response?.msg || 'No se pudo devolver el código');
      }
    } catch (error) {
      console.error('Error al devolver código:', error);
      toast.error('Error al devolver el código');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (event) => {
    const v = event.target.value;
    setComentario(v);
    if (!v || v.trim().length === 0) {
      setValidationError('El comentario es obligatorio para devolver el código');
    } else if (v.trim().length < 10) {
      setValidationError('El comentario debe tener al menos 10 caracteres');
    } else if (v.length > 200) {
      setValidationError('El comentario debe tener máximo 200 caracteres');
    } else {
      setValidationError('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <ToastContainer />
      <div className="w-full max-w-lg rounded-[24px] border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-semibold text-slate-900">Devolver código a solicitante</p>
            <p className="mt-1 text-sm text-slate-600">
              Describe el motivo de la devolución para que el solicitante pueda corregirlo .
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-900">
              Comentario de devolución <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              value={comentario}
              onChange={handleChange}
              maxLength={200}
              placeholder="Ej: Falta información de unidad de medida y descripción."
              className={`w-full rounded-2xl px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-red-100 ${validationError ? 'border border-red-300 bg-white' : 'border border-slate-300 bg-slate-50'}`}
            />
            {validationError ? (
              <div className="text-xs text-red-600 mt-1">{validationError}</div>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Devolviendo...' : 'Devolver código'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DevolucionContabilidad;
