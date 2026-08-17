import { useState } from 'react';
import { toast } from 'react-toastify';
import useFetch from '../../hooks/useFetch';

const EvioInpelClarel = ({ id, token, getValues, userId, userName, onSuccess, onError }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { fetchDataBackend } = useFetch();

  const handleEnviar = async () => {
    const data = getValues?.() || {};

    const payload = {
      nombreMaestroDatos: userName || 'Maestro',
      codigo: data.ItemCode || '',
      descripcion_sap: data.ItemName || '',
      nombre_extranjero: data.ForeignName || '',
      unidad_compra: data.unidad_medida || '',
      cantidad_minima_pedido: data.CantidadMinimaPedido ?? '',
      impuesto_compra: data.PurchaseTaxCode || '',
      impuesto_venta: data.SalesTaxCode || '',
      lead_time: data.LeadTime ?? '',
      dias_tolerancia: data.ToleranceDays ?? '',
      grupo_articulos: data.ItemsGroupCode || '',
      tipo_bien: data.ItemType || 'B',
      inventario: data.InventoryItem ? 'tYES' : 'tNO',
      venta: data.SalesItem ? 'tYES' : 'tNO',
      compra: data.PurchaseItem ? 'tYES' : 'tNO',
      userId,
      userName: userName || 'Maestro',
    };

    try {
      setIsSubmitting(true);

      const url = `${import.meta.env.VITE_BACKEND_URL}/api/maestro/codigos/base/${id}`;
      const response = await fetchDataBackend(url, payload, 'PUT', token);

      if (response?.success) {
        const message = response?.message || 'Código enviado correctamente a INPEL';
        toast.success(message);
        onSuccess?.(message);
      } else {
        const message = response?.message || response?.msg || 'No se pudo enviar a INPEL';
        toast.error(message);
        onError?.(message);
      }
    } catch (error) {
      console.error('Error enviando a INPEL:', error);
      const message = 'Error al enviar el código a INPEL';
      toast.error(message);
      onError?.(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleEnviar}
      disabled={isSubmitting || !id}
      className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700 shadow-sm transition hover:bg-emerald-100 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isSubmitting ? 'Enviando...' : 'SINCRONIZAR'}
    </button>
  );
};

export default EvioInpelClarel;
