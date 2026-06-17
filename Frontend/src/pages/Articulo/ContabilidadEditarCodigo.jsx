import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import useFetch from '../../hooks/useFetch';
import storeAuth from '../../context/storeAuth';
import { getAuthClaims } from '../../utils/authClaims';
import { ToastContainer } from 'react-toastify';
import { ITEM_TYPES } from './ArticuloFormUtils';

const ContabilidadEditarCodigo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = storeAuth();
  const { fetchDataBackend } = useFetch();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sapLoading, setsapLoading] = useState(false);
  const [itemsGroups, setItemsGroups] = useState([]);
  const [vatGroups, setVatGroups] = useState([]);
  const [cargandoUsuario, setCargandoUsuario] = useState(false);
  const [perfilUsuario, setPerfilUsuario] = useState(null);
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
      PurchaseTaxCode: '',
      SalesTaxCode: '',
      ItemsGroupCode: '',
      ItemType: 'B',
      RequestorDescription: '',
      Details: '',
      ReferenceLink: '',
      descripcion_sap: '',
      unidad_medida: '',
      requestor_area: '',
    }
  });

  // Cargar datos del código y opciones maestras
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);

        // Cargar opciones de SAP
        const [vatRes, itemsRes] = await Promise.all([
          fetchDataBackend(`${import.meta.env.VITE_BACKEND_URL}/api/sap/vat-groups`, null, 'GET', token),
          fetchDataBackend(`${import.meta.env.VITE_BACKEND_URL}/api/sap/items-groups`, null, 'GET', token)
        ]);

        const vatData = vatRes?.data || vatRes?.value || vatRes || [];
        const itemsData = itemsRes?.data || itemsRes?.value || itemsRes || [];

        const mappedItemsGroups = Array.isArray(itemsData)
          ? itemsData.map(item => ({
              Code: item.Number,
              Name: item.GroupName
            }))
          : [];

        setVatGroups(Array.isArray(vatData) ? vatData : []);
        setItemsGroups(mappedItemsGroups);

        // Cargar datos del código
        const url = `${import.meta.env.VITE_BACKEND_URL}/api/codigos/${id}`;
        const response = await fetchDataBackend(url, null, 'GET', token);

        if (response?.codigo) {
          const item = response.codigo;
          setValue('ItemCode', item.codigo || '');
          setValue('ItemName', item.descripcion_sap || '');
          setValue('ForeignName', item.nombre_extranjero || '');
          setValue('PurchaseTaxCode', item.impuesto_compra || '');
          setValue('SalesTaxCode', item.impuesto_venta || '');
          setValue('ItemsGroupCode', item.grupo_articulos || '');
          setValue('ItemType', item.tipo_bien || 'B');
          setValue('RequestorDescription', item.descripcion || '');
          setValue('Details', item.detalles || '');
          setValue('ReferenceLink', item.link_referencia || '');
          setValue('descripcion_sap', item.descripcion_sap || '');
          setValue('unidad_medida', item.unidad_medida || '');
          setValue('requestor_area', item.requestor_area || '');
        } else {
          toast.error('No se pudo cargar el código');
          setTimeout(() => navigate('/dashboard/tablas'), 1500);
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
        toast.error('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    if (id && token) {
      fetchAllData();
    }
  }, [id, token, setValue, navigate, fetchDataBackend]);


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
      setValue('PurchaseTaxCode', item.PurchaseTaxCode || item.impuesto_compra || '');
      setValue('SalesTaxCode', item.SalesTaxCode || item.impuesto_venta || '');
      setValue('ItemsGroupCode', item.ItemsGroupCode ?? item.grupo_articulos ?? '');
      setValue('ItemType', item.ItemType || item.tipo_bien || 'B');

      toast.success('Item encontrado en SAP');
    } catch (error) {
      console.error('Error buscando item en SAP:', error);
      toast.error('Error buscando el item en SAP');
    } finally {
      setsapLoading(false);
    }
  };

  // Actualizar código con datos de contabilidad
  const updateCodigo = async (data) => {
    try {
      setIsSubmitting(true);

      const codigoData = {
        nombreContabilidad: perfilUsuario?.nombre,
        grupo_articulos: data.ItemsGroupCode,
        tipo_bien: data.ItemType,
        userId: userID,
        userName: claims?.nombre || 'Contabilidad'
      };

      const url = `${import.meta.env.VITE_BACKEND_URL}/api/contabilidad/update/${id}`;
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
          <h1 className="text-4xl font-bold text-slate-900">Datos Contables - Código #{id}</h1>
          <p className="text-sm text-slate-600 mt-2">Actualiza la clasificación contable y datos fiscales del artículo</p>
        </div>

        <form onSubmit={handleSubmit(updateCodigo)} className="space-y-6">
          {/* Info General (Solo lectura) */}
          <fieldset className="w-full rounded-lg border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <legend className="text-lg font-semibold text-slate-900 px-2">Información del Código (Solo lectura)</legend>
            
            <div className="grid gap-6 pt-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Descripción SAP</label>
                <input
                  type="text"
                  disabled
                  className="w-full rounded-lg border px-4 py-3 text-slate-600 bg-slate-100 cursor-not-allowed"
                  {...register('descripcion_sap')}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Unidad de Medida</label>
                <input
                  type="text"
                  disabled
                  className="w-full rounded-lg border px-4 py-3 text-slate-600 bg-slate-100 cursor-not-allowed"
                  {...register('unidad_medida')}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700">Detalles</label>
                <textarea
                  disabled
                  rows={4}
                  className="w-full rounded-lg border px-4 py-3 text-slate-600 bg-slate-100 cursor-not-allowed"
                  {...register('Details')}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700">Área Solicitante</label>
                <input
                  type="text"
                  disabled
                  className="w-full rounded-lg border px-4 py-3 text-slate-600 bg-slate-100 cursor-not-allowed"
                  {...register('requestor_area')}
                />
              </div>
            </div>
          </fieldset>

          {/* Datos Contables (Editable) */}
          <fieldset className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <legend className="text-lg font-semibold text-slate-900 px-2">Datos Contables y Fiscales *</legend>
            
            <div className="grid gap-6 pt-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-900">
                  Grupo de Artículos *
                </label>
                <select
                  className="w-full rounded-lg border px-4 py-3 text-slate-900 outline-none transition border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                  {...register('ItemsGroupCode', {
                    required: 'El grupo de artículos es obligatorio'
                  })}
                >
                  <option value="">Selecciona un grupo</option>
                  {itemsGroups.map((group) => (
                    <option key={group.Code} value={group.Code}>
                      {group.Name}
                    </option>
                  ))}
                </select>
                {errors.ItemsGroupCode && (
                  <p className="text-sm text-red-600">{errors.ItemsGroupCode.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-900">
                  Tipo de Bien *
                </label>
                <select
                  className="w-full rounded-lg border px-4 py-3 text-slate-900 outline-none transition border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                  {...register('ItemType', {
                    required: 'El tipo de bien es obligatorio'
                  })}
                >
                  {ITEM_TYPES.map((type) => (
                    <option key={type.Code} value={type.Code}>
                      {type.Name}
                    </option>
                  ))}
                </select>
                {errors.ItemType && (
                  <p className="text-sm text-red-600">{errors.ItemType.message}</p>
                )}
              </div>

              
            </div>

          </fieldset>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 inline-flex items-center justify-center rounded-lg bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
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

export default ContabilidadEditarCodigo;
