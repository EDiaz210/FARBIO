import React, { useState, useEffect } from 'react';
import useFetch from '../../hooks/useFetch';
import { toast } from 'react-toastify';

const DevolucionCompras = ({ isOpen, onClose, codigoId, onSuccess }) => {
  const [comentario, setComentario] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const { fetchDataBackend } = useFetch();

  useEffect(() => {
    if (!isOpen) setComentario('');
    if (!isOpen) setValidationError('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    // Validaciones en línea (mostrar mensajes bajo el textarea)
    if (!comentario || comentario.trim().length === 0) {
      setValidationError('Ingrese un comentario para devolver el código');
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
    setSubmitting(true);
    try {
      const url = `${import.meta.env.VITE_BACKEND_URL}/api/compras/retorno`;
      const payload = { id: codigoId, comentario };
      const res = await fetchDataBackend(url, payload, 'POST');
      if (res && (res.msg || res.success)) {
        toast.success(res.msg || 'Devolución realizada correctamente');
        onSuccess && onSuccess();
        onClose && onClose();
      } else {
        toast.error('Error al realizar la devolución');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error en la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const v = e.target.value;
    setComentario(v);
    // Validación instantánea
    if (!v || v.trim().length === 0) {
      setValidationError('Ingrese un comentario para devolver el código');
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
      <div className="w-full max-w-lg rounded-[24px] border border-slate-200 bg-white p-4 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-semibold text-slate-900">Devolver código al solicitante </p>
            <p className="mt-1 text-sm text-slate-600">
              Describe el motivo de la devolución para que el solicitante  pueda corregirlo .
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar modal"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-900">
              Comentario de devolución <span className="text-red-500">*</span>
            </label>
            <textarea
              value={comentario}
              onChange={handleChange}
              maxLength={200}
              rows={5}
              placeholder="Indica la razón del retorno (máx. 200 caracteres)"
              className={`w-full rounded-2xl px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-red-100 ${validationError ? 'border border-red-300 bg-white' : 'border border-slate-300 bg-slate-50'}`}
            />
            {validationError ? (
              <div className="mt-1 text-xs text-red-600">{validationError}</div>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={submitting}
          >
            {submitting ? 'Enviando...' : 'Devolver'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DevolucionCompras;
