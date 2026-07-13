import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import useFetch from '../../hooks/useFetch';
import storeAuth from '../../context/storeAuth';
import { getAuthClaims } from '../../utils/authClaims';
import { ToastContainer } from 'react-toastify';

const ReenviarCompras = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = storeAuth();
  const { fetchDataBackend } = useFetch();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cargandoUsuario, setCargandoUsuario] = useState(false);
  const [perfilUsuario, setPerfilUsuario] = useState(null);
  const [referenceLink, setReferenceLink] = useState('');
  const claims = getAuthClaims(token);
  const userID = claims?.id || null;

  // Cargar datos del perfil para la UI
  useEffect(() => {
    const cargarDatosUsuario = async () => {
      if (!token) {
        setPerfilUsuario(null);
        return;
      }

      setCargandoUsuario(true);
      try {
        const url = `${import.meta.env.VITE_BACKEND_URL}/api/users/mi-perfil`;
        const response = await fetchDataBackend(url, null, "GET", token, false);
        if (response?.usuario) {
          setPerfilUsuario(response.usuario);
        }
      } catch (error) {
        console.error("Error al cargar perfil de usuario:", error);
      } finally {
        setCargandoUsuario(false);
      }
    };

    cargarDatosUsuario();
  }, [token, fetchDataBackend]);


  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    defaultValues: {
      ItemCode: '',
      ItemName: '',
      ForeignName: '',
      PurchaseUnit: '',
      LeadTimeInDays: '',
      ToleranceDays: '',
      CantidadMinimaPedido: '',
      RequestorDescription: '',
      Details: '',
      ReferenceLink: '',
      RequestorArea: '',
      descripcion_sap: '',
      unidad_medida: '',
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
          setValue('CantidadMinimaPedido', item.cantidad_minima_pedido ?? '');
          setValue('RequestorDescription', item.descripcion || '');
          setValue('Details', item.detalles || '');
          setValue('ReferenceLink', item.link_referencia || '');
          setReferenceLink(item.link_referencia || '');
          setValue('RequestorArea', item.requestor_area || '');
          setValue('descripcion_sap', item.descripcion_sap || '');
          setValue('unidad_medida', item.unidad_medida || '');
        } else {
          toast.error('No se pudo cargar el código');
          setTimeout(() => navigate('/dashboard/compras/rechazados'), 1500);
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

  // Actualizar código con datos de compras
  const updateCodigo = async (data) => {
    try {
      setIsSubmitting(true);

      const codigoData = {
        nombreCompras: perfilUsuario?.nombre,
        descripcion_sap: data.descripcion_sap,
        unidad_medida: data.unidad_medida,
        lead_time: data.LeadTimeInDays,
        dias_tolerancia: data.ToleranceDays,
        cantidad_minima_pedido: data.CantidadMinimaPedido,
        userId: userID,
        userName: claims?.nombre || 'Compras'
      };

      const url = `${import.meta.env.VITE_BACKEND_URL}/api/compras/update/${id}`;
      const response = await fetchDataBackend(url, codigoData, 'PUT', token);

      if (response?.success) {
        toast.success('Código actualizado exitosamente');
        setTimeout(() => {
          navigate('/dashboard/compras/rechazados');
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
    <div className="min-h-full overflow-auto" style={{ fontFamily: 'Gowun Batang, serif' }}>
      <ToastContainer />

      {/* Banner Superior */}
      <div className="w-full bg-green-100">
        <div className="px-6 lg:px-8 py-4 lg:py-5">
          <h1 className="text-4xl font-bold text-black">Reenviar a Compras - Código #{id}</h1>
          <p className="text-sm text-black-700 mt-1">Actualiza los datos de compra y lead time del artículo</p>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="w-full max-w-full px-6 lg:px-8 mx-0 py-8">
        <form onSubmit={handleSubmit(updateCodigo)} className="space-y-6 text-left">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              {/* Info General (Solo lectura) */}
              <fieldset className="h-full w-full rounded-lg border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <div className="mb-6 bg-slate-200 -mx-6 -mt-6 px-6 py-4 rounded-t-lg">
                  <h2 className="text-lg font-semibold text-slate-900">Información del Código (Solo lectura)</h2>
                </div>

                <div className="grid gap-6 pt-1">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Descripción del Solicitante</label>
                    <textarea
                      disabled
                      rows={3}
                      className="w-full rounded-lg border px-4 py-3 text-slate-600 bg-slate-100 cursor-not-allowed"
                      {...register('RequestorDescription')}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Detalles</label>
                    <textarea
                      disabled
                      rows={4}
                      className="w-full rounded-lg border px-4 py-3 text-slate-600 bg-slate-100 cursor-not-allowed"
                      {...register('Details')}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Link de Referencia</label>
                    <input
                      type="text"
                      readOnly
                       onClick={() => {
                        if (!referenceLink) return;
                        const href = referenceLink.startsWith('http://') || referenceLink.startsWith('https://') ? referenceLink : `https://${referenceLink}`;
                        window.open(href, '_blank', 'noopener,noreferrer');
                      }}
                      title="Abrir enlace en nueva pestaña"
                      className="w-full rounded-lg border px-4 py-3 text-slate-600 bg-slate-100 cursor-pointer"
                      {...register('ReferenceLink')}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Área Solicitante</label>
                    <input
                      type="text"
                      disabled
                      className="w-full rounded-lg border px-4 py-3 text-slate-600 bg-slate-100 cursor-not-allowed"
                      {...register('RequestorArea')}
                    />
                  </div>
                </div>
              </fieldset>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/compras/rechazados')}
                  className="w-full inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Datos de Compra (Editable) */}
              <fieldset className="h-full w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 bg-green-600 -mx-6 -mt-6 px-6 py-4 rounded-t-lg">
                  <h2 className="text-lg font-semibold text-white">Datos de Compra *</h2>
                </div>

                <div className="grid gap-6 pt-1">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-900">Lead Time (días) *</label>
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
                    {errors.LeadTimeInDays && <p className="text-sm text-red-600">{errors.LeadTimeInDays.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-900">Días de Tolerancia *</label>
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
                    {errors.ToleranceDays && <p className="text-sm text-red-600">{errors.ToleranceDays.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-900">Cantidad Mínima de Pedido *</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Ej: 10"
                      className="w-full rounded-lg border px-4 py-3 text-slate-900 outline-none transition border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                      {...register('CantidadMinimaPedido', {
                        required: 'La cantidad mínima de pedido es obligatoria',
                        min: {
                          value: 0,
                          message: 'La cantidad mínima debe ser positiva'
                        }
                      })}
                    />
                    {errors.CantidadMinimaPedido && <p className="text-sm text-red-600">{errors.CantidadMinimaPedido.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-900">Descripción SAP *</label>
                    <input
                      type="text"
                      placeholder="Ej: Jabón S3"
                      className="w-full rounded-lg border px-4 py-3 text-slate-900 outline-none transition border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                      {...register('descripcion_sap', {
                        required: 'La descripción SAP es obligatoria'
                      })}
                    />
                    {errors.descripcion_sap && <p className="text-sm text-red-600">{errors.descripcion_sap.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-900">Unidad de Medida *</label>
                    <input
                      type="text"
                      placeholder="Ej: CAJA"
                      className="w-full rounded-lg border px-4 py-3 text-slate-900 outline-none transition border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                      {...register('unidad_medida', {
                        required: 'La unidad de medida es obligatoria'
                      })}
                    />
                    {errors.unidad_medida && <p className="text-sm text-red-600">{errors.unidad_medida.message}</p>}
                  </div>
                </div>
              </fieldset>

              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReenviarCompras;
