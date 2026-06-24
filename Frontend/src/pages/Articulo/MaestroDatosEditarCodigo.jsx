import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast, ToastContainer } from 'react-toastify';
import useFetch from '../../hooks/useFetch';
import storeAuth from '../../context/storeAuth';
import { getAuthClaims } from '../../utils/authClaims';

const ITEM_TYPES = [
  { Code: 'B', Name: 'Bien' },
  { Code: 'S', Name: 'Servicio' },
];

const MaestroDatosEditarCodigo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = storeAuth();
  const { fetchDataBackend } = useFetch();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sapLoading, setSapLoading] = useState(false);
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
    watch,
  } = useForm({
    defaultValues: {
      ItemCode: '',
      ItemName: '',
      ForeignName: '',
      unidad_medida: '',
      LeadTime: '',
      ToleranceDays: '',
      ItemsGroupCode: '',
      ItemType: 'B',
      PurchaseTaxCode: '',
      SalesTaxCode: '',
      RequestorDescription: '',
      Details: '',
      ReferenceLink: '',
      RequestorArea: '',
      nombreSolicitante: '',
      descripcion_sap: '',
      InventoryItem: false,
      SalesItem: false,
      PurchaseItem: false,
    }
  });

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
          setValue('unidad_medida', item.unidad_compra || item.unidad_medida || item.PurchaseUnit || '');
          setValue('LeadTime', item.lead_time || '');
          setValue('ToleranceDays', item.dias_tolerancia || '');
          setValue('ItemsGroupCode', item.grupo_articulos || '');
          setValue('ItemType', item.tipo_bien || 'B');
          setValue('PurchaseTaxCode', item.impuesto_compra || '');
          setValue('SalesTaxCode', item.impuesto_venta || '');
          setValue('RequestorDescription', item.descripcion || '');
          setValue('Details', item.detalles || '');
          setValue('ReferenceLink', item.link_referencia || '');
          setValue('RequestorArea', item.requestor_area || '');
          setValue('nombreSolicitante', item.nombre_solicitante || '');
          setValue('descripcion_sap', item.descripcion_sap || '');
          // ensure unidad_medida is populated from any available property
          setValue('unidad_medida', item.unidad_compra || item.unidad_medida || item.PurchaseUnit || '');
          // Checkboxes - convertir tYES/tNO a boolean
          setValue('InventoryItem', item.inventoryItem === 'tYES');
          setValue('SalesItem', item.salesItem === 'tYES');
          setValue('PurchaseItem', item.purchaseItem === 'tYES');
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

  // Buscar item en SAP
  const buscarItemEnSAP = async () => {
    const itemCode = getValues('ItemCode')?.trim();

    if (!itemCode) {
      toast.error('Ingresa un código de item para buscarlo en SAP');
      return;
    }

    try {
      setSapLoading(true);
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
      setValue('unidad_medida', item.PurchaseUnit || item.unidad_compra || item.unidad_medida || '');
      setValue('PurchaseTaxCode', item.PurchaseTaxCode || item.impuesto_compra || '');
      setValue('SalesTaxCode', item.SalesTaxCode || item.impuesto_venta || '');
      setValue('ItemsGroupCode', item.ItemsGroupCode ?? item.grupo_articulos ?? '');
      setValue('ItemType', item.ItemType || item.tipo_bien || 'B');
      setValue('LeadTime', item.LeadTime || item.lead_time || '');

      toast.success('Item encontrado en SAP');
    } catch (error) {
      console.error('Error buscando item en SAP:', error);
      toast.error('Error buscando el item en SAP');
    } finally {
      setSapLoading(false);
    }
  };

  // Actualizar código con datos de maestro de datos
  const updateCodigo = async (data) => {
    try {
      setIsSubmitting(true);

      // Convertir checkboxes a tYES/tNO
      const codigoData = {
        nombreMaestroDatos: perfilUsuario?.nombre,
        codigo: data.ItemCode,
        descripcion: data.RequestorDescription,
        detalles: data.Details,
        link_referencia: data.ReferenceLink,
        descripcion_sap: data.ItemName,
        nombre_extranjero: data.ForeignName,
        unidad_compra: data.unidad_medida,
        impuesto_compra: data.PurchaseTaxCode,
        impuesto_venta: data.SalesTaxCode,
        lead_time: data.LeadTime,
        dias_tolerancia: data.ToleranceDays,
        grupo_articulos: data.ItemsGroupCode,
        tipo_bien: data.ItemType,
        inventario: data.InventoryItem ? 'tYES' : 'tNO',
        venta: data.SalesItem ? 'tYES' : 'tNO',
        compra: data.PurchaseItem ? 'tYES' : 'tNO',
        userId: userID,
        userName: claims?.nombre || 'Maestro'
      };

      const url = `${import.meta.env.VITE_BACKEND_URL}/api/maestro/codigos/${id}`;
      const response = await fetchDataBackend(url, codigoData, 'PUT', token);

      if (response?.success) {
        toast.success('Código actualizado exitosamente y enviado a SAP');
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

      <div className="w-full max-w-7xl px-6 lg:px-8 mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Maestro de Datos - Código #{id}</h1>
          <p className="text-sm text-slate-600 mt-2">
            Completa todos los datos del artículo. Al guardar, se sincronizará con SAP automáticamente.
          </p>
        </div>

        <form onSubmit={handleSubmit(updateCodigo)} className="space-y-6">
          <div className="space-y-6">
            {/* Info General (Solo lectura) - ficha compacta */}
            <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Información del Código</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-700">
                <div>
                  <p className="text-xs font-medium text-slate-500">Nombre del Solicitante</p>
                  <p className="mt-1 text-sm text-slate-800">{watch('nombreSolicitante') || 'No disponible'}</p>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500">Área Solicitante</p>
                  <p className="mt-1 text-sm text-slate-800">{watch('RequestorArea') || 'No disponible'}</p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-xs font-medium text-slate-500">Descripción del Solicitante</p>
                  <p className="mt-1 text-sm text-slate-800 whitespace-pre-wrap">{watch('RequestorDescription') || 'No disponible'}</p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-xs font-medium text-slate-500">Detalles</p>
                  <p className="mt-1 text-sm text-slate-800 whitespace-pre-wrap">{watch('Details') || 'No disponible'}</p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-xs font-medium text-slate-500">Link de Referencia</p>
                  <p className="mt-1 text-sm text-slate-800 break-words">{watch('ReferenceLink') || 'No disponible'}</p>
                </div>
              </div>

              <input type="hidden" {...register('RequestorDescription')} />
              <input type="hidden" {...register('Details')} />
              <input type="hidden" {...register('ReferenceLink')} />
              <input type="hidden" {...register('RequestorArea')} />
              <input type="hidden" {...register('nombreSolicitante')} />
            </div>

            {/* Datos de Maestro (Editable) */}
            <fieldset aria-label="Datos Maestro" className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900">Datos Maestro de Datos *</h2>
              </div>

              <div className="grid gap-6 pt-1 md:grid-cols-2">
                {/* Código */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-900">Código del Artículo *</label>
                  <div className="flex gap-2 items-stretch">
                    <input
                      type="text"
                      placeholder="Ej: ARTICULO001"
                      className="flex-1 rounded-lg rounded-r-none border px-4 py-3 text-slate-900 outline-none transition border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                      {...register('ItemCode', {
                        required: 'El código es obligatorio'
                      })}
                    />
                    <button
                      type="button"
                      onClick={buscarItemEnSAP}
                      disabled={sapLoading}
                      title="Buscar en SAP"
                      aria-label="Buscar en SAP"
                      className="px-3 py-2 min-w-[44px] bg-blue-300 text-black rounded-lg rounded-l-none font-semibold hover:bg-blue-400 disabled:opacity-50 inline-flex items-center justify-center"
                    >
                      {sapLoading ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="11" cy="11" r="7"></circle>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.ItemCode && <p className="text-sm text-red-600">{errors.ItemCode.message}</p>}
                </div>

                {/* Descripción SAP */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-900">Descripción SAP *</label>
                  <input
                    type="text"
                    placeholder="Ej: Jabón S3"
                    className="w-full rounded-lg border px-4 py-3 text-slate-900 outline-none transition border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                    {...register('ItemName', {
                      required: 'La descripción SAP es obligatoria'
                    })}
                  />
                  {errors.ItemName && <p className="text-sm text-red-600">{errors.ItemName.message}</p>}
                </div>

                {/* Nombre Extranjero */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-900">Nombre Extranjero *</label>
                  <input
                    type="text"
                    placeholder="Ej: Soap S3"
                    className="w-full rounded-lg border px-4 py-3 text-slate-900 outline-none transition border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                    {...register('ForeignName', {
                      required: 'El nombre extranjero es obligatorio'
                    })}
                  />
                  {errors.ForeignName && <p className="text-sm text-red-600">{errors.ForeignName.message}</p>}
                </div>

                {/* Unidad de Compra */}
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

                {/* Lead Time */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-900">Lead Time (días) *</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ej: 30"
                    className="w-full rounded-lg border px-4 py-3 text-slate-900 outline-none transition border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                    {...register('LeadTime', {
                      required: 'El lead time es obligatorio',
                      min: { value: 0, message: 'Debe ser positivo' }
                    })}
                  />
                  {errors.LeadTime && <p className="text-sm text-red-600">{errors.LeadTime.message}</p>}
                </div>

                {/* Días de Tolerancia */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-900">Días de Tolerancia *</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ej: 5"
                    className="w-full rounded-lg border px-4 py-3 text-slate-900 outline-none transition border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                    {...register('ToleranceDays', {
                      required: 'Los días de tolerancia son obligatorios',
                      min: { value: 0, message: 'Debe ser positivo' }
                    })}
                  />
                  {errors.ToleranceDays && <p className="text-sm text-red-600">{errors.ToleranceDays.message}</p>}
                </div>

                {/* Grupo de Artículos */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-900">Grupo de Artículos *</label>
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
                  {errors.ItemsGroupCode && <p className="text-sm text-red-600">{errors.ItemsGroupCode.message}</p>}
                </div>

                {/* Tipo de Bien */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-900">Tipo de Bien *</label>
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
                  {errors.ItemType && <p className="text-sm text-red-600">{errors.ItemType.message}</p>}
                </div>

                {/* IVA Compra */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-900">IVA Compra *</label>
                  <select
                    className="w-full rounded-lg border px-4 py-3 text-slate-900 outline-none transition border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                    {...register('PurchaseTaxCode', {
                      required: 'El IVA de compra es obligatorio'
                    })}
                  >
                    <option value="">Selecciona IVA</option>
                    {vatGroups.map((vat) => (
                      <option key={vat.Code} value={vat.Code}>
                        {vat.Name} ({vat.Code})
                      </option>
                    ))}
                  </select>
                  {errors.PurchaseTaxCode && <p className="text-sm text-red-600">{errors.PurchaseTaxCode.message}</p>}
                </div>

                {/* IVA Venta */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-900">IVA Venta *</label>
                  <select
                    className="w-full rounded-lg border px-4 py-3 text-slate-900 outline-none transition border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                    {...register('SalesTaxCode', {
                      required: 'El IVA de venta es obligatorio'
                    })}
                  >
                    <option value="">Selecciona IVA</option>
                    {vatGroups.map((vat) => (
                      <option key={vat.Code} value={vat.Code}>
                        {vat.Name} ({vat.Code})
                      </option>
                    ))}
                  </select>
                  {errors.SalesTaxCode && <p className="text-sm text-red-600">{errors.SalesTaxCode.message}</p>}
                </div>
              </div>

              {/* Checkboxes */}
              <div className="grid gap-6 pt-6 md:grid-cols-3">
                <div className="flex items-center space-x-3 rounded-lg border border-slate-200 p-4 bg-slate-50">
                  <input
                    type="checkbox"
                    id="InventoryItem"
                    className="h-5 w-5 rounded border-slate-300 text-blue-200 focus:ring-blue-100 cursor-pointer"
                    {...register('InventoryItem')}
                  />
                  <label htmlFor="InventoryItem" className="text-sm font-semibold text-slate-900 cursor-pointer">
                    Es Artículo de Inventario
                  </label>
                </div>

                <div className="flex items-center space-x-3 rounded-lg border border-slate-200 p-4 bg-slate-50">
                  <input
                    type="checkbox"
                    id="SalesItem"
                    className="h-5 w-5 rounded border-slate-300 text-blue-200 focus:ring-blue-100 cursor-pointer"
                    {...register('SalesItem')}
                  />
                  <label htmlFor="SalesItem" className="text-sm font-semibold text-slate-900 cursor-pointer">
                    Se Vende
                  </label>
                </div>

                <div className="flex items-center space-x-3 rounded-lg border border-slate-200 p-4 bg-slate-50">
                  <input
                    type="checkbox"
                    id="PurchaseItem"
                    className="h-5 w-5 rounded border-slate-300 text-blue-200 focus:ring-blue-100 cursor-pointer"
                    {...register('PurchaseItem')}
                  />
                  <label htmlFor="PurchaseItem" className="text-sm font-semibold text-slate-900 cursor-pointer">
                    Se Compra
                  </label>
                </div>
              </div>
            </fieldset>
          </div>

          {/* Botones alineados con columnas */}
          <div className="grid gap-6 md:grid-cols-2 mt-8">
            <div>
              <button
                type="button"
                onClick={() => navigate('/dashboard/tablas')}
                className="w-full inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center rounded-lg bg-blue-300 px-6 py-3 text-sm font-semibold text-black transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Sincronizando con SAP...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaestroDatosEditarCodigo;
