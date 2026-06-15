import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import useFetch from '../../hooks/useFetch';
import storeAuth from '../../context/storeAuth';
import { getAuthClaims } from '../../utils/authClaims';
import { ToastContainer } from 'react-toastify';

const ComprasEditarCodigo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = storeAuth();
  const { fetchDataBackend } = useFetch();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sapLoading, setsapLoading] = useState(false);

  const claims = getAuthClaims(token);
  const userID = claims?.id || null;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
  } = useForm({
    defaultValues: {
      ItemCode: '',
      ItemName: '',
      ForeignName: '',
      PurchaseUnit: '',
      LeadTimeInDays: '',
      ToleranceDays: '',
      RequestorDescription: '',
      Details: '',
      ReferenceLink: '',
    }
  });

  // Cargar datos del código
  useEffect(() => {
    const fetchCodigoData = async () => {
      try {
        setLoading(true);
        const url = `${import.meta.env.VITE_BACKEND_URL}/api/codigos/${id}`;
        const response = await fetchDataBackend(url, null, 'GET', token);

        if (response?.codigo) {
          const item = response.codigo;
          setValue('ItemCode', item.codigo || '');
          setValue('ItemName', item.descripcion_sap || '');
          setValue('ForeignName', item.nombre_extranjero || '');
          setValue('PurchaseUnit', item.unidad_compra || '');
          setValue('LeadTimeInDays', item.lead_time || '');
          setValue('ToleranceDays', item.dias_tolerancia || '');
          setValue('RequestorDescription', item.descripcion || '');
          setValue('Details', item.detalles || '');
          setValue('ReferenceLink', item.link_referencia || '');
        } else {
          toast.error('No se pudo cargar el código');
          setTimeout(() => navigate('/dashboard/tablas'), 1500);
        }
      } catch (error) {
        console.error('Error cargando código:', error);
        toast.error('Error al cargar el código');
      } finally {
        setLoading(false);
      }
    };

    if (id && token) {
      fetchCodigoData();
    }
  }, [id, token, setValue, navigate, fetchDataBackend]);

  // Buscar item en SAP
  const buscarItemEnSAP = async () => {
    const itemCode = getValues('ItemCode')?.trim();

    if (!itemCode) {
      toast.error('Ingresa un código de item para buscarlo en SAP');
      return;
    }

    try {
      setsapLoading(true);
      const url = `${import.meta.env.VITE_BACKEND_URL}/api/sap/items/${encodeURIComponent(itemCode)}`;
      const response = await fetchDataBackend(url, null, 'GET', token);

      if (!response?.success || !response?.data) {
        toast.error('No se encontró el item en SAP');
        return;
      }

      const item = response.data.value || response.data;

      setValue('ItemCode', item.ItemCode || item.codigo || itemCode);
      setValue('ItemName', item.ItemName || item.descripcion_sap || '');
      setValue('ForeignName', item.ForeignName || item.nombre_extranjero || '');
      setValue('PurchaseUnit', item.PurchaseUnit || item.unidad_compra || '');

      toast.success('Item encontrado en SAP');
    } catch (error) {
      console.error('Error buscando item en SAP:', error);
      toast.error('Error buscando el item en SAP');
    } finally {
      setsapLoading(false);
    }
  };

  // Actualizar código con datos de compras
  const updateCodigo = async (data) => {
    try {
      setIsSubmitting(true);

      const codigoData = {
        lead_time: data.LeadTimeInDays,
        dias_tolerancia: data.ToleranceDays,
      };

      const url = `${import.meta.env.VITE_BACKEND_URL}/api/compras/update/${id}`;
      const response = await fetchDataBackend(url, codigoData, 'PUT', token);

      if (response?.success) {
        toast.success('Código actualizado exitosamente');
        setTimeout(() => {
          navigate('/dashboard/tablas');
        }, 1500);
      } else {
        toast.error(response?.message || 'Error al actualizar el código');
      }
    } catch (error) {
      console.error('Error al actualizar:', error);
      toast.error('Error al actualizar el código');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-full py-8 overflow-auto" style={{ fontFamily: 'Gowun Batang, serif' }}>
      <ToastContainer />

      <div className="w-full max-w-4xl px-6 lg:px-8 mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Datos de Compra - Código #{id}</h1>
          <p className="text-sm text-slate-600 mt-2">Actualiza los datos de compra y lead time del artículo</p>
        </div>

        <form onSubmit={handleSubmit(updateCodigo)} className="space-y-6">
          {/* Info General (Solo lectura) */}
          <fieldset className="w-full rounded-lg border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <legend className="text-lg font-semibold text-slate-900 px-2">Información del Código (Solo lectura)</legend>
            
            <div className="grid gap-6 pt-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Código</label>
                <input
                  type="text"
                  disabled
                  className="w-full rounded-lg border px-4 py-3 text-slate-600 bg-slate-100 cursor-not-allowed"
                  {...register('ItemCode')}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Descripción SAP</label>
                <input
                  type="text"
                  disabled
                  className="w-full rounded-lg border px-4 py-3 text-slate-600 bg-slate-100 cursor-not-allowed"
                  {...register('ItemName')}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Nombre Extranjero</label>
                <input
                  type="text"
                  disabled
                  className="w-full rounded-lg border px-4 py-3 text-slate-600 bg-slate-100 cursor-not-allowed"
                  {...register('ForeignName')}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Unidad de Compra</label>
                <input
                  type="text"
                  disabled
                  className="w-full rounded-lg border px-4 py-3 text-slate-600 bg-slate-100 cursor-not-allowed"
                  {...register('PurchaseUnit')}
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Descripción del Solicitante</label>
                <textarea
                  disabled
                  className="w-full rounded-lg border px-4 py-3 text-slate-600 bg-slate-100 cursor-not-allowed"
                  {...register('RequestorDescription')}
                />
              </div>
            </div>
          </fieldset>

          {/* Datos de Compra (Editable) */}
          <fieldset className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <legend className="text-lg font-semibold text-slate-900 px-2">Datos de Compra *</legend>
            
            <div className="grid gap-6 pt-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-900">
                  Lead Time (días) *
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Ej: 30"
                  className="w-full rounded-lg border px-4 py-3 text-slate-900 outline-none transition border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                  {...register('LeadTimeInDays', {
                    required: 'El lead time es obligatorio',
                    min: {
                      value: 0,
                      message: 'El lead time debe ser positivo'
                    }
                  })}
                />
                {errors.LeadTimeInDays && (
                  <p className="text-sm text-red-600">{errors.LeadTimeInDays.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-900">
                  Días de Tolerancia *
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Ej: 5"
                  className="w-full rounded-lg border px-4 py-3 text-slate-900 outline-none transition border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                  {...register('ToleranceDays', {
                    required: 'Los días de tolerancia son obligatorios',
                    min: {
                      value: 0,
                      message: 'Los días deben ser positivos'
                    }
                  })}
                />
                {errors.ToleranceDays && (
                  <p className="text-sm text-red-600">{errors.ToleranceDays.message}</p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={buscarItemEnSAP}
              disabled={sapLoading}
              className="mt-6 inline-flex items-center justify-center rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sapLoading ? 'Buscando...' : 'Buscar Item en SAP'}
            </button>
          </fieldset>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 inline-flex items-center justify-center rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard/tablas')}
              className="flex-1 inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComprasEditarCodigo;
