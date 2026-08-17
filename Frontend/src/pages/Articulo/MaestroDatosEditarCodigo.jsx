import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast, ToastContainer } from 'react-toastify';
import useFetch from '../../hooks/useFetch';
import storeAuth from '../../context/storeAuth';
import { getAuthClaims } from '../../utils/authClaims';
import EvioInpelClarel from '../BDDLOCAL/EvioInpelClarel';

const ITEM_TYPES = [
  { Code: 'A', Name: 'Activo' },
  { Code: 'B', Name: 'Bien' },
  { Code: 'S', Name: 'Servicio' },
];

const MaestroDatosEditarCodigo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = storeAuth();
  const { fetchDataBackend } = useFetch();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sapLoading, setSapLoading] = useState(false);
  const [perfilUsuario, setPerfilUsuario] = useState(null);

  // Estados de carga independientes para mostrar "Cargando..." en los selects
  const [loadingItemsGroups, setLoadingItemsGroups] = useState(true);
  const [loadingVatGroups, setLoadingVatGroups] = useState(true);

  const [itemsGroups, setItemsGroups] = useState([]);
  const [vatGroups, setVatGroups] = useState([]);

  const rawDataRef = useRef(null);

  const claims = getAuthClaims(token);
  const userID = claims?.id || null;
  const authenticatedUserId = perfilUsuario?.id || userID;
  const authenticatedUserName = perfilUsuario?.nombre || claims?.nombre || 'Maestro';

  const inputClass = (hasError) => `w-full rounded-lg border px-4 py-3 text-slate-900 outline-none transition ${hasError ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-50'}`;
  const validateInteger = (value, fieldName) => {
    if (value === undefined || value === null || String(value).trim() === '') {
      return `${fieldName} es obligatorio`;
    }
    if (!/^\d+$/.test(String(value).trim())) {
      return `${fieldName} solo acepta números`;
    }
    if (Number(value) < 1) {
      return `El valor mínimo para ${fieldName} es 1`;
    }
    return true;
  };

  const validateUppercaseText = (value, fieldName, minLength, maxLength) => {
    if (!value || value.trim() === '') return `${fieldName} es obligatorio`;
    const trimmedValue = value.trim();
    if (trimmedValue.length < minLength) return `${fieldName} debe tener mínimo ${minLength} caracteres`;
    if (trimmedValue.length > maxLength) return `${fieldName} debe tener máximo ${maxLength} caracteres`;
    if (/[a-z]/.test(trimmedValue)) return `${fieldName} no acepta letras minúsculas`;
    return true;
  };

  const validateUnidadMedida = (value) => {
    if (!value || value.trim() === '') return 'La unidad de medida es obligatoria';
    const trimmedValue = value.trim();
    if (trimmedValue.length < 1) return 'La unidad de medida debe tener mínimo 1 carácter';
    if (trimmedValue.length > 50) return 'La unidad de medida debe tener máximo 50 caracteres';
    if (!/^[A-ZÁÉÍÓÚÜÑ ]+$/.test(trimmedValue)) return 'La unidad de medida solo acepta letras mayúsculas';
    return true;
  };

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
        console.error('Error al cargar perfil de usuario en Maestro:', error);
      }
    };

    cargarDatosUsuario();
  }, [token, fetchDataBackend]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
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
      CantidadMinimaPedido: '',
      ItemsGroupCode: '',
      ItemType: 'B',
      gravaIva: 'SI',
      PurchaseTaxCode: '',
      SalesTaxCode: '',
      RequestorDescription: '',
      Details: '',
      ReferenceLink: '',
      RequestorArea: '',
      Empresa: '',
      nombreSolicitante: '',
      descripcion_sap: '',
      InventoryItem: false,
      SalesItem: false,
      PurchaseItem: true,
    },
  });

  // 1. CARGA INMEDIATA: Pinta los datos locales al instante
  useEffect(() => {
    const fetchCodigoData = async () => {
      try {
        const url = `${import.meta.env.VITE_BACKEND_URL}/api/codigos/${id}`;
        const response = await fetchDataBackend(url, null, 'GET', token);

        if (response?.codigo) {
          const item = response.codigo;
          const formattedData = {
            ItemCode: item.codigo || '',
            ItemName: item.descripcion_sap || '',
            ForeignName: item.nombre_extranjero || item.descripcion_sap || '',
            unidad_medida: item.unidad_compra || item.unidad_medida || item.PurchaseUnit || '',
            LeadTime: item.lead_time || '',
            ToleranceDays: item.dias_tolerancia || '',
            CantidadMinimaPedido: item.cantidad_minima_pedido || '',
            ItemsGroupCode: item.grupo_articulos || '',
            ItemType: item.tipo_bien || 'B',
            PurchaseTaxCode: item.impuesto_compra || item.indicadorIVACompras || '',
            SalesTaxCode: item.impuesto_venta || item.indicadorIVAVentas || '',
            RequestorDescription: item.descripcion || '',
            Details: item.detalles || '',
            gravaIva: item.grava_iva || 'SI',
            ReferenceLink: item.link_referencia || '',
            RequestorArea: item.requestor_area || '',
            Empresa: item.empresa || '',
            nombreSolicitante: item.nombre_solicitante || '',
            descripcion_sap: item.descripcion_sap || '',
            InventoryItem: item.inventoryItem === 'tYES',
            SalesItem: item.salesItem === 'tYES',
            PurchaseItem: item.purchaseItem === undefined ? true : item.purchaseItem === 'tYES',
          };

          rawDataRef.current = formattedData;
          reset(formattedData);
        } else {
          toast.error('No se pudo cargar el código');
          setTimeout(() => navigate('/dashboard/tablas'), 1500);
        }
      } catch (error) {
        console.error('Error cargando datos del código:', error);
        toast.error('Error al cargar los datos del código');
      }
    };

    if (id && token) {
      fetchCodigoData();
    }
  }, [id, token, navigate, fetchDataBackend, reset]);

  // 2. CARGA EN SEGUNDO PLANO: Listas de SAP independientes con indicador de carga
  useEffect(() => {
    const fetchSapOptions = async () => {
      try {
        // Clear select values so placeholder ('Cargando datos...') is visible while loading
        try {
          setValue('ItemsGroupCode', '', { shouldDirty: false });
          setValue('PurchaseTaxCode', '', { shouldDirty: false });
          setValue('SalesTaxCode', '', { shouldDirty: false });
        } catch (e) {
          // If setValue not ready, ignore
        }
        const [vatRes, itemsRes] = await Promise.all([
          fetchDataBackend(`${import.meta.env.VITE_BACKEND_URL}/api/sap/vat-groups`, null, 'GET', token),
          fetchDataBackend(`${import.meta.env.VITE_BACKEND_URL}/api/sap/items-groups`, null, 'GET', token),
        ]);

        const vatData = vatRes?.data || vatRes?.value || vatRes || [];
        const itemsData = itemsRes?.data || itemsRes?.value || itemsRes || [];

        const mappedItemsGroups = Array.isArray(itemsData)
          ? itemsData.map((item) => ({
              Code: item.Number,
              Name: item.GroupName,
            }))
          : [];

        setVatGroups(Array.isArray(vatData) ? vatData : []);
        setItemsGroups(mappedItemsGroups);

        setLoadingItemsGroups(false);
        setLoadingVatGroups(false);

        // Re-aplicamos el reset manteniendo cualquier edición previa del usuario
        if (rawDataRef.current) {
          reset(rawDataRef.current, { keepDirty: true });
        }
      } catch (error) {
        console.error('Error cargando opciones de SAP en segundo plano:', error);
        setLoadingItemsGroups(false);
        setLoadingVatGroups(false);
      }
    };

    if (token) {
      fetchSapOptions();
    }
  }, [token, fetchDataBackend, reset]);

  // Buscar item en SAP
  const buscarItemEnSAP = async () => {
  const itemCode = getValues('ItemCode')?.trim();
  const itemName = getValues('ItemName')?.trim();

  if (!itemCode && !itemName) {
    toast.error('Ingresa un código o descripción para verificar en SAP');
    return;
  }

  try {
    setSapLoading(true);

    const params = new URLSearchParams();
    if (itemCode) params.append('itemCode', itemCode);
    if (itemName) params.append('description', itemName);

    const url = `${import.meta.env.VITE_BACKEND_URL}/api/sap/items/search?${params.toString()}`;
    const response = await fetchDataBackend(url, null, 'GET', token);

    if (response?.success) {
      const existeCodigo = response?.detalle?.existeCodigo;
      const existeDescripcion = response?.detalle?.existeDescripcion;

      if (existeCodigo && existeDescripcion) {
        toast.warning('Item encontrado por código y descripción SAP');
      } else if (existeCodigo) {
        toast.warning('Item encontrado por código SAP');
      } else if (existeDescripcion) {
        toast.warning('Item encontrado por descripción SAP');
      } else {
        toast.success('No se encontraron coincidencias en SAP');
      }
    } else {
      toast.error(response?.msg || 'Error al consultar SAP');
    }
  } catch (error) {
    console.error('Error verificando item en SAP:', error);
    toast.error('Error al consultar la existencia en SAP');
  } finally {
    setSapLoading(false);
  }
};

  // Actualizar código con datos de maestro de datos
  const updateCodigo = async (data) => {
    try {
      setIsSubmitting(true);

      if (!authenticatedUserId) {
        toast.error('No se pudo validar el usuario autenticado');
        return;
      }

      const codigoData = {
        nombreMaestroDatos: authenticatedUserName,
        nombreSolicitante: data.nombreSolicitante,
        empresa: data.Empresa,
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
        cantidad_minima_pedido: data.CantidadMinimaPedido,
        inventario: data.InventoryItem ? 'tYES' : 'tNO',
        venta: data.SalesItem ? 'tYES' : 'tNO',
        compra: data.PurchaseItem ? 'tYES' : 'tNO',
        userId: authenticatedUserId,
        userName: authenticatedUserName,
      };

      const url = `${import.meta.env.VITE_BACKEND_URL}/api/maestro/codigos/${id}`;
      const response = await fetchDataBackend(url, codigoData, 'PUT', token);

      if (response?.success) {
        toast.success('Código actualizado exitosamente y enviado a SAP', {
          autoClose: 2200,
          onClose: () => {
            navigate('/dashboard/tablas');
          },
        });
      } else {
        toast.error(response?.message || response?.msg || 'Error al actualizar el código', {
          autoClose: 2200,
        });
      }
    } catch (error) {
      console.error('Error al actualizar:', error);
      toast.error('Error al actualizar el código', {
        autoClose: 2200,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-full overflow-auto" style={{ fontFamily: 'Gowun Batang, serif' }}>
      <ToastContainer />

      <div className="w-full bg-blue-300 text-black shadow-sm">
        <div className="px-4 py-4 sm:px-6 lg:px-8 lg:py-5">
          <h1 className="text-3xl font-bold text-black sm:text-4xl">Maestro de Datos - Código #{id}</h1>
          <p className="mt-2 text-sm text-black/80 sm:text-base">
            Completa todos los datos del artículo. Al guardar, se sincronizará con SAP automáticamente.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <form onSubmit={handleSubmit(updateCodigo)} className="space-y-6">
          <div className="space-y-6">
            {/* Info General (Solo lectura) */}
            <section className="w-full rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <p className="text-lg font-semibold text-slate-900">Información del Código</p>
                </div>
                <div>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">Solo lectura</span>
                </div>
              </div>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                      <path d="M12 12a4 4 0 100-8 4 4 0 000 8z" />
                      <path d="M4 20a8 8 0 0116 0v1H4v-1z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">Nombre del Solicitante</p>
                    <p className="mt-1 break-words text-sm text-slate-700">{watch('nombreSolicitante') || 'Sin datos'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 min-w-0">
                  <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                      <path d="M3 21h18v-2H3v2zM6 7h2v2H6V7zm0 4h2v2H6v-2zM10 7h2v2h-2V7zm0 4h2v2h-2v-2zM14 7h2v2h-2V7zm0 4h2v2h-2v-2z" />
                      <path d="M19 3H5v14h14V3z" opacity=".3" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">Área Solicitante</p>
                    <p className="mt-1 break-words text-sm text-slate-700">{watch('RequestorArea') || 'Sin datos'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 min-w-0">
                  <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 3.5L18.5 8H14a1 1 0 01-1-1V3.5z" />
                      <path d="M8 12h8v2H8v-2zm0-4h8v2H8V8z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">Descripción del Solicitante</p>
                    <p className="mt-1 break-words whitespace-pre-wrap text-sm text-slate-700">{watch('RequestorDescription') || 'Sin datos'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 min-w-0">
                  <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                      <path d="M5 12c0-3.86 3.14-7 7-7s7 3.14 7 7-3.14 7-7 7-7-3.14-7-7zm7-5c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z" />
                      <path d="M12 4c.41 0 .75.34.75.75V7h1.5V4.75c0-.41.34-.75.75-.75s.75.34.75.75V7h1.5V4.75c0-.41.34-.75.75-.75s.75.34.75.75V7h.25A3.75 3.75 0 0119.75 10.75v.5a3.75 3.75 0 01-3.75 3.75H8.75A3.75 3.75 0 015 11.25v-.5A3.75 3.75 0 018.75 7H9V4.75c0-.41.34-.75.75-.75z" opacity=".3" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">Empresa</p>
                    <p className="mt-1 break-words text-sm text-slate-700">{watch('Empresa') || 'Sin datos'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 min-w-0 md:col-span-2">
                  <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                      <path d="M4 6.5C4 5.67 4.67 5 5.5 5S7 5.67 7 6.5 6.33 8 5.5 8 4 7.33 4 6.5zM4 12.5C4 11.67 4.67 11 5.5 11S7 11.67 7 12.5 6.33 14 5.5 14 4 13.33 4 12.5zM4 18.5C4 17.67 4.67 17 5.5 17S7 17.67 7 18.5 6.33 20 5.5 20 4 19.33 4 18.5zM9 6h11v2H9V6zm0 6h11v2H9v-2zm0 6h11v2H9v-2z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">Detalles</p>
                    <p className="mt-1 break-words whitespace-pre-wrap text-sm text-slate-700">{watch('Details') || 'Sin datos'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 min-w-0 md:col-span-2">
                  <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6">
                      <circle cx="7" cy="7" r="2" fill="currentColor" />
                      <circle cx="17" cy="17" r="2" fill="currentColor" />
                      <path d="M19 5L5 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">Grava o no grava IVA</p>
                    <p className="mt-1 break-words text-sm text-slate-700">{watch('gravaIva') || 'Sin datos'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 min-w-0 md:col-span-2">
                  <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                      <path d="M3 5h18v14H3z" opacity=".3" />
                      <path d="M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm2 2v10h14V7H5z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">Link de Referencia</p>
                    <p className="mt-1 break-all text-sm text-slate-700">{watch('ReferenceLink') || 'Sin datos'}</p>
                  </div>
                </div>
              </div>

              <input type="hidden" {...register('RequestorDescription')} />
              <input type="hidden" {...register('Details')} />
              <input type="hidden" {...register('ReferenceLink')} />
              <input type="hidden" {...register('RequestorArea')} />
              <input type="hidden" {...register('nombreSolicitante')} />
              <input type="hidden" {...register('gravaIva')} />
            </section>

            {/* Datos de Maestro (Editable al instante) */}
            <section aria-label="Datos Maestro" className="w-full overflow-hidden rounded-[28px] border border-slate-200 border-l-4 border-l-blue-300 bg-white shadow-[0_25px_50px_-30px_rgba(15,23,42,0.2)]">
              <div className="flex flex-col gap-4 px-4 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92 1.58l-1.67-1.67 9.19-9.19 1.67 1.67-9.19 9.19zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                    </svg>
                  </div>
                  <p className="text-lg font-semibold text-slate-900 sm:text-xl">Datos del Artículo</p>
                </div>
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700 sm:text-xs">
                    Ingrese la información
                  </span>
                  <EvioInpelClarel
                    id={id}
                    token={token}
                    getValues={getValues}
                    userId={authenticatedUserId}
                    userName={authenticatedUserName}
                  />
                </div>
              </div>

              <div className="px-4 py-4 sm:px-6 sm:py-6">
                <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="flex items-center space-x-3 rounded-2xl border border-slate-200 bg-blue-50/70 p-4 shadow-sm">
                    <input
                      type="checkbox"
                      id="InventoryItem"
                      className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-100 cursor-pointer"
                      {...register('InventoryItem')}
                    />
                    <label htmlFor="InventoryItem" className="text-sm font-semibold text-slate-900 cursor-pointer">
                      Artículo de inventario
                    </label>
                  </div>

                  <div className="flex items-center space-x-3 rounded-2xl border border-slate-200 bg-blue-50/70 p-4 shadow-sm">
                    <input
                      type="checkbox"
                      id="SalesItem"
                      className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-100 cursor-pointer"
                      {...register('SalesItem')}
                    />
                    <label htmlFor="SalesItem" className="text-sm font-semibold text-slate-900 cursor-pointer">
                      Artículo venta
                    </label>
                  </div>

                  <div className="flex items-center space-x-3 rounded-2xl border border-slate-200 bg-blue-50/70 p-4 shadow-sm">
                    <input
                      type="checkbox"
                      id="PurchaseItem"
                      className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-100 cursor-pointer"
                      {...register('PurchaseItem')}
                    />
                    <label htmlFor="PurchaseItem" className="text-sm font-semibold text-slate-900 cursor-pointer">
                      Artículo de compra
                    </label>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Código */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-900">Código del Artículo *</label>
                      <div className="flex gap-2 items-stretch">
                        <input
                          type="text"
                          placeholder="Ej: ARTICULO001"
                          className={`${inputClass(errors.ItemCode)} flex-1 rounded-r-none`}
                          {...register('ItemCode', {
                            validate: (value) => {
                              if (!value || value.trim() === '') return 'El código es obligatorio';
                              if (value.trim().length < 5) return 'El código debe tener mínimo 5 caracteres';
                              if (value.trim().length > 35) return 'El código debe tener máximo 35 caracteres';
                              return true;
                            },
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
                        className={inputClass(errors.ItemName)}
                        {...register('ItemName', {
                          validate: (value) => validateUppercaseText(value, 'La descripción SAP', 10, 100),
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
                        className={inputClass(errors.ForeignName)}
                        {...register('ForeignName', {
                          validate: (value) => validateUppercaseText(value, 'El nombre extranjero', 10, 100),
                        })}
                      />
                      {errors.ForeignName && <p className="text-sm text-red-600">{errors.ForeignName.message}</p>}
                    </div>

                    {/* Unidad de Medida */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-900">Unidad de Medida *</label>
                      <input
                        type="text"
                        placeholder="Ej: CAJA"
                        className={inputClass(errors.unidad_medida)}
                        {...register('unidad_medida', { validate: validateUnidadMedida })}
                      />
                      {errors.unidad_medida && <p className="text-sm text-red-600">{errors.unidad_medida.message}</p>}
                    </div>

                    {/* Cantidad mínima de pedido */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-900">Cantidad mínima de pedido *</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Ej: 10"
                        className={inputClass(errors.CantidadMinimaPedido)}
                        {...register('CantidadMinimaPedido', {
                          validate: (value) => validateInteger(value, 'La cantidad mínima de pedido'),
                        })}
                      />
                      {errors.CantidadMinimaPedido && <p className="text-sm text-red-600">{errors.CantidadMinimaPedido.message}</p>}
                    </div>

                    {/* Lead Time */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-900">Lead Time (días) *</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Ej: 30"
                        className={inputClass(errors.LeadTime)}
                        {...register('LeadTime', {
                          validate: (value) => validateInteger(value, 'El lead time'),
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
                        className={inputClass(errors.ToleranceDays)}
                        {...register('ToleranceDays', {
                          validate: (value) => validateInteger(value, 'Los días de tolerancia'),
                        })}
                      />
                      {errors.ToleranceDays && <p className="text-sm text-red-600">{errors.ToleranceDays.message}</p>}
                    </div>

                    {/* Grupo de Artículos (Con indicador visual dinámico) */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="block text-sm font-semibold text-slate-900">Grupo de Artículos *</label>
                      </div>
                      {loadingItemsGroups ? (
                        <select
                          disabled
                          className={`${inputClass(errors.ItemsGroupCode)} disabled:bg-white disabled:text-slate-900`}
                        >
                          <option value="">Cargando datos...</option>
                        </select>
                      ) : (
                        <select
                          className={inputClass(errors.ItemsGroupCode)}
                          {...register('ItemsGroupCode', { required: 'El grupo de artículos es obligatorio' })}
                          defaultValue={getValues('ItemsGroupCode') || ''}
                        >
                          <option value="">Selecciona un grupo</option>
                          {itemsGroups.map((group) => (
                            <option key={group.Code} value={group.Code}>
                              {group.Name}
                            </option>
                          ))}
                        </select>
                      )}
                      {errors.ItemsGroupCode && <p className="text-sm text-red-600">{errors.ItemsGroupCode.message}</p>}
                    </div>

                    {/* Tipo de Bien */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-900">Tipo de Bien *</label>
                      <select
                        className={inputClass(errors.ItemType)}
                        {...register('ItemType', { required: 'El tipo de bien es obligatorio' })}
                      >
                        {ITEM_TYPES.map((type) => (
                          <option key={type.Code} value={type.Code}>
                            {type.Name}
                          </option>
                        ))}
                      </select>
                      {errors.ItemType && <p className="text-sm text-red-600">{errors.ItemType.message}</p>}
                    </div>

                    {/* IVA Compra (Con indicador visual dinámico) */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="block text-sm font-semibold text-slate-900">IVA Compra *</label>
                      </div>
                      {loadingVatGroups ? (
                        <select disabled className={`${inputClass(errors.PurchaseTaxCode)} disabled:bg-white disabled:text-slate-900`}>
                          <option value="">Cargando datos...</option>
                        </select>
                      ) : (
                        <select
                          className={inputClass(errors.PurchaseTaxCode)}
                          {...register('PurchaseTaxCode', {
                            validate: (value) => watch('gravaIva') === 'SI' && !value
                              ? 'El IVA de compra es obligatorio'
                              : true,
                          })}
                          defaultValue={getValues('PurchaseTaxCode') || ''}
                        >
                          <option value="">Selecciona IVA</option>
                          {vatGroups.map((vat) => (
                            <option key={vat.Code} value={vat.Code}>
                              {vat.Name} ({vat.Code})
                            </option>
                          ))}
                        </select>
                      )}
                      {errors.PurchaseTaxCode && <p className="text-sm text-red-600">{errors.PurchaseTaxCode.message}</p>}
                    </div>

                    {/* IVA Venta (Con indicador visual dinámico) */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="block text-sm font-semibold text-slate-900">IVA Venta *</label>
                      </div>
                      {loadingVatGroups ? (
                        <select disabled className={`${inputClass(errors.SalesTaxCode)} disabled:bg-white disabled:text-slate-900`}>
                          <option value="">Cargando datos...</option>
                        </select>
                      ) : (
                        <select
                          className={inputClass(errors.SalesTaxCode)}
                          {...register('SalesTaxCode', {
                            validate: (value) => watch('gravaIva') === 'SI' && !value
                              ? 'El IVA de venta es obligatorio'
                              : true,
                          })}
                          defaultValue={getValues('SalesTaxCode') || ''}
                        >
                          <option value="">Selecciona IVA</option>
                          {vatGroups.map((vat) => (
                            <option key={vat.Code} value={vat.Code}>
                              {vat.Name} ({vat.Code})
                            </option>
                          ))}
                        </select>
                      )}
                      {errors.SalesTaxCode && <p className="text-sm text-red-600">{errors.SalesTaxCode.message}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Botones */}
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            

            <button
              type="button"
              onClick={() => navigate('/dashboard/tablas')}
              className="inline-flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-lg bg-blue-300 px-6 py-3 text-sm font-semibold text-black transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Sincronizando con SAP...' : 'Guardar Cambios'}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
};

export default MaestroDatosEditarCodigo;