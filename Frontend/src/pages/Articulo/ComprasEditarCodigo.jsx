import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast, ToastContainer } from 'react-toastify';
import useFetch from '../../hooks/useFetch';
import storeAuth from '../../context/storeAuth';
import { getAuthClaims } from '../../utils/authClaims';

const ComprasEditarCodigo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = storeAuth();
  const { fetchDataBackend } = useFetch();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [perfilUsuario, setPerfilUsuario] = useState(null);
  const [referenceLink, setReferenceLink] = useState('');

  const claims = getAuthClaims(token);
  const userID = claims?.id || null;

  // 1. Cargar perfil del usuario
  useEffect(() => {
    const cargarDatosUsuario = async () => {
      if (!token) return;

      try {
        const url = `${import.meta.env.VITE_BACKEND_URL}/api/users/mi-perfil`;
        const response = await fetchDataBackend(url, null, 'GET', token, false);
        if (response?.usuario) {
          setPerfilUsuario(response.usuario);
        }
      } catch (error) {
        console.error('Error al cargar perfil de usuario:', error);
      }
    };

    cargarDatosUsuario();
  }, [token, fetchDataBackend]);

  const validateDescripcionSAP = useCallback((value) => {
    if (!value || value.trim() === '') {
      return 'La descripción SAP es obligatoria';
    }

    const trimmed = value.trim();
    if (trimmed.length < 10) {
      return 'La descripción SAP debe tener mínimo 10 caracteres';
    }
    if (trimmed.length > 100) {
      return 'La descripción SAP debe tener máximo 100 caracteres';
    }
    if (/[a-z]/.test(trimmed)) {
      return 'La descripción SAP no acepta letras en minúscula';
    }
    const upperValue = trimmed.toUpperCase();
    if (!/(ADM|VTS|PROD)$/.test(upperValue)) {
      return 'La descripción SAP debe terminar en ADM, VTS o PROD';
    }

    return true;
  }, []);

  const validateUnidadMedida = useCallback((value) => {
    if (!value || value.trim() === '') {
      return 'La unidad de medida es obligatoria';
    }

    const trimmed = value.trim();
    if (trimmed.length < 1) {
      return 'La unidad de medida debe tener mínimo 1 caracter';
    }
    if (trimmed.length > 50) {
      return 'La unidad de medida debe tener máximo 50 caracteres';
    }
    if (/[a-z]/.test(trimmed)) {
      return 'La unidad de medida no acepta letras en minúscula';
    }
    if (/[0-9]/.test(trimmed)) {
      return 'La unidad de medida no acepta números';
    }
    if (!/^[A-ZÁÉÍÓÚÜÑ ]+$/.test(trimmed)) {
      return 'La unidad de medida únicamente acepta letras';
    }

    return true;
  }, []);

  const validateNumericField = useCallback((value, fieldName) => {
    if (value === undefined || value === null || String(value).trim() === '') {
      return `${fieldName} es obligatorio`;
    }

    const stringValue = String(value).trim();
    if (!/^[0-9]+$/.test(stringValue)) {
      return `${fieldName} solo acepta números`; 
    }

    const numericValue = Number(stringValue);
    if (numericValue < 1) {
      return `El valor mínimo para ${fieldName} es 1`;
    }

    return true;
  }, []);

  // 2. Formulario optimizado
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    defaultValues: {
      RequestorDescription: '',
      Details: '',
      ReferenceLink: '',
      RequestorArea: '',
      descripcion_sap: '',
      unidad_medida: '',
      gravaIva: 'SI',
      LeadTimeInDays: '',
      ToleranceDays: '',
      CantidadMinimaPedido: '',
    },
  });

  // 3. Cargar datos del código
  useEffect(() => {
    const fetchCodigoData = async () => {
      try {
        setLoading(true);
        const url = `${import.meta.env.VITE_BACKEND_URL}/api/codigos/${id}`;
        const response = await fetchDataBackend(url, null, 'GET', token);

        if (response?.codigo) {
          const item = response.codigo;

          // Datos de solo lectura
          setValue('RequestorDescription', item.descripcion || '');
          setValue('Details', item.detalles || '');
          setValue('ReferenceLink', item.link_referencia || '');
          setValue('RequestorArea', item.requestor_area || '');
          setReferenceLink(item.link_referencia || '');

          // Datos editables de compras
          setValue('descripcion_sap', item.descripcion_sap || '');
          setValue('unidad_medida', item.unidad_medida || '');
          setValue('gravaIva', item.grava_iva || 'SI');
          setValue('LeadTimeInDays', item.lead_time || '');
          setValue('ToleranceDays', item.dias_tolerancia || '');
          setValue('CantidadMinimaPedido', item.cantidad_minima_pedido ?? '');
        } else {
          toast.error(response?.msg || 'No se pudo cargar el código');
          setTimeout(() => navigate('/dashboard/tablas'), 1500);
        }
      } catch (error) {
        console.error('Error cargando código:', error);
        toast.error(error?.response?.data?.msg || 'Error al cargar el código');
      } finally {
        setLoading(false);
      }
    };

    if (id && token) {
      fetchCodigoData();
    }
  }, [id, token, setValue, navigate, fetchDataBackend]);

  // 4. Guardar cambios usando 'msg'
  const updateCodigo = async (data) => {
    try {
      setIsSubmitting(true);

      const codigoData = {
        nombreCompras: perfilUsuario?.nombre || 'Compras',
        descripcion_sap: data.descripcion_sap,
        unidad_medida: data.unidad_medida,
        grava_iva: data.gravaIva,
        lead_time: data.LeadTimeInDays,
        dias_tolerancia: data.ToleranceDays,
        cantidad_minima_pedido: data.CantidadMinimaPedido,
        userId: userID,
        userName: perfilUsuario?.nombre || 'Compras',
      };

      const url = `${import.meta.env.VITE_BACKEND_URL}/api/compras/update/${id}`;
      const response = await fetchDataBackend(url, codigoData, 'PUT', token);

      if (response?.success) {
        toast.success(response?.msg || 'Código actualizado exitosamente');
        setTimeout(() => {
          navigate('/dashboard/tablas');
        }, 1500);
      } else {
        toast.error(response?.msg || 'Error al actualizar el código');
      }
    } catch (error) {
      console.error('Error al actualizar:', error);
      toast.error(error?.response?.data?.msg || 'Error al actualizar el código');
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
          <h1 className="text-4xl font-bold text-black">Datos de Compra - Código #{id}</h1>
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

            </div>

            <div className="space-y-6">
              {/* Datos de Compra (Editable) */}
              <fieldset className="h-full w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 bg-green-600 -mx-6 -mt-6 px-6 py-4 rounded-t-lg">
                  <h2 className="text-lg font-semibold text-white">Datos de Compra *</h2>
                </div>

                <div className="grid gap-6 pt-1">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-900">Descripción SAP *</label>
                    <input
                      type="text"
                      placeholder="Ej: JABON S3 ADM"
                      className={`w-full rounded-lg border px-4 py-3 text-slate-900 outline-none transition ${errors.descripcion_sap ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-50'}`}
                      {...register('descripcion_sap', {
                        validate: validateDescripcionSAP,
                      })}
                    />
                    {errors.descripcion_sap && <p className="text-sm text-red-600">{errors.descripcion_sap.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-900">Grava o no grava IVA *</label>
                    <select
                      className={`w-full rounded-lg border px-4 py-3 text-slate-900 outline-none transition ${errors.gravaIva ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-50'}`}
                      {...register('gravaIva', {
                        required: 'Seleccione si grava IVA'
                      })}
                    >
                      <option value="SI">SI</option>
                      <option value="NO">NO</option>
                    </select>
                    {errors.gravaIva && <p className="text-sm text-red-600">{errors.gravaIva.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-900">Unidad de Medida *</label>
                    <input
                      type="text"
                      placeholder="Ej: CAJA"
                      className={`w-full rounded-lg border px-4 py-3 text-slate-900 outline-none transition ${errors.unidad_medida ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-50'}`}
                      {...register('unidad_medida', {
                        validate: validateUnidadMedida,
                      })}
                    />
                    {errors.unidad_medida && <p className="text-sm text-red-600">{errors.unidad_medida.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-900">Cantidad Mínima de Pedido *</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Ej: 10"
                      className={`w-full rounded-lg border px-4 py-3 text-slate-900 outline-none transition ${errors.CantidadMinimaPedido ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-50'}`}
                      {...register('CantidadMinimaPedido', {
                        validate: (value) => validateNumericField(value, 'Cantidad Mínima de Pedido'),
                      })}
                    />
                    {errors.CantidadMinimaPedido && <p className="text-sm text-red-600">{errors.CantidadMinimaPedido.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-900">Lead Time (días) *</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Ej: 30"
                      className={`w-full rounded-lg border px-4 py-3 text-slate-900 outline-none transition ${errors.LeadTimeInDays ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-50'}`}
                      {...register('LeadTimeInDays', {
                        validate: (value) => validateNumericField(value, 'Lead Time (días)'),
                      })}
                    />
                    {errors.LeadTimeInDays && <p className="text-sm text-red-600">{errors.LeadTimeInDays.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-900">Días de Tolerancia *</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Ej: 5"
                      className={`w-full rounded-lg border px-4 py-3 text-slate-900 outline-none transition ${errors.ToleranceDays ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-50'}`}
                      {...register('ToleranceDays', {
                        validate: (value) => validateNumericField(value, 'Días de Tolerancia'),
                      })}
                    />
                    {errors.ToleranceDays && <p className="text-sm text-red-600">{errors.ToleranceDays.message}</p>}
                  </div>
                </div>
              </fieldset>

            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate('/dashboard/tablas')}
              className="order-2 w-full inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 sm:order-1 sm:w-auto"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="order-1 w-full inline-flex items-center justify-center rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 sm:order-2 sm:w-auto"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComprasEditarCodigo;
