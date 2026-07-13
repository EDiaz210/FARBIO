import React, { useState, useEffect } from 'react';
import useFetch from '../../hooks/useFetch';
import { toast } from 'react-toastify';

const DevolucionCompras = ({ isOpen, onClose, codigoId, onSuccess }) => {
  const [comentario, setComentario] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { fetchDataBackend } = useFetch();

  useEffect(() => {
    if (!isOpen) setComentario('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!comentario || comentario.trim().length === 0) {
      toast.error('Ingrese un comentario para devolver el código');
      return;
    }
    if (comentario.length > 200) {
      toast.error('El comentario debe tener máximo 200 caracteres');
      return;
    }

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Devolver código #{codigoId}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-600">Comentario</label>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            maxLength={200}
            rows={5}
            className="w-full border border-slate-200 rounded-md p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-300"
            placeholder="Indique la razón del retorno (máx. 200 caracteres)"
          />
          <div className="text-xs text-slate-500">{comentario.length}/200</div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
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
