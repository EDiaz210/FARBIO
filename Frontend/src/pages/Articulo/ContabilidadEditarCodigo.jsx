import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast, ToastContainer } from 'react-toastify';
import useFetch from '../../hooks/useFetch';
import storeAuth from '../../context/storeAuth';
import { getAuthClaims } from '../../utils/authClaims';
import { ITEM_TYPES } from './ArticuloFormUtils';

const ContabilidadEditarCodigo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = storeAuth();
  const { fetchDataBackend } = useFetch();
  
  // Estados de carga y datos de SAP
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [itemsGroups, setItemsGroups] = useState([]);
  const [vatGroups, setVatGroups] = useState([]);
  const [perfilUsuario, setPerfilUsuario] = useState(null);
  
  const claims = getAuthClaims(token);
  const userID = claims?.id || null;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      ItemsGroupCode: '',
      ItemType: 'B',
      PurchaseTaxCode: '',
      SalesTaxCode: '',
      nombre_solicitante: '',
      requestor_area: '',
      descripcion_sap: '',
      unidad_medida: '',
      Details: '',
    }
  });

  // Cargar datos del perfil para la UI
  useEffect(() => {
    const cargarDatosUsuario = async () => {
      if (!token) {
        setPerfilUsuario(null);
        return;
      }

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

  // Cargar Grupos de Artículos, IVA de SAP y Datos del Código en un solo bloque optimizado
  useEffect(() => {
    const cargarTodoElFormulario = async () => {
      try {
        setLoadingOptions(true);

        // 1. Cargar catálogos desde SAP de forma simultánea
        const [itemsRes, vatRes] = await Promise.all([
          fetchDataBackend(`${import.meta.env.VITE_BACKEND_URL}/api/sap/items-groups`, null, 'GET', token),
          fetchDataBackend(`${import.meta.env.VITE_BACKEND_URL}/api/sap/vat-groups`, null, 'GET', token)
        ]);

        const itemsData = itemsRes?.data || itemsRes?.value || itemsRes || [];
        const vatData = vatRes?.data || vatRes?.value || vatRes || [];

        const mappedItemsGroups = Array.isArray(itemsData)
          ? itemsData.map(item => ({
              Code: item.Number,
              Name: item.GroupName
            }))
          : [];

        setItemsGroups(mappedItemsGroups);
        setVatGroups(Array.isArray(vatData) ? vatData : []);

        // 2. Cargar los datos específicos del código a editar
        const response = await fetchDataBackend(
          `${import.meta.env.VITE_BACKEND_URL}/api/codigos/${id}`,
          null,
          'GET',
          token
        );

        if (response?.codigo) {
          const item = response.codigo;
          reset({
            ItemsGroupCode: item.grupo_articulos || '',
            ItemType: item.tipo_bien || 'B',
            PurchaseTaxCode: item.impuesto_compra || '',
            SalesTaxCode: item.impuesto_venta || '',
            nombre_solicitante: item.nombre_solicitante || '',
            requestor_area: item.requestor_area || '',
            descripcion_sap: item.descripcion_sap || '',
            unidad_medida: item.unidad_medida || '',
            Details: item.detalles || '',
          });
        } else {
          toast.error('No se pudo cargar el código');
          setTimeout(() => navigate('/dashboard/tablas'), 1500);
        }
      } catch (error) {
        console.error('Error cargando catálogos o código:', error);
        toast.error('Error al inicializar los datos del formulario');
      } finally {
        setLoadingOptions(false);
      }
    };

    if (id && token) {
      cargarTodoElFormulario();
    }
  }, [id, token, navigate, fetchDataBackend, reset]);

  // Actualizar código con datos de contabilidad
  const updateCodigo = async (data) => {
    try {
      setIsSubmitting(true);

      const codigoData = {
        nombreContabilidad: perfilUsuario?.nombre || claims?.nombre || 'Contabilidad',
        grupo_articulos: data.ItemsGroupCode,
        tipo_bien: data.ItemType,
        impuesto_compra: data.PurchaseTaxCode,
        impuesto_venta: data.SalesTaxCode,
        userId: userID,
        userName: perfilUsuario?.nombre || claims?.nombre || 'Contabilidad'
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

  return (
    <div className="min-h-full overflow-auto font-sans" style={{ fontFamily: 'Gowun Batang, serif' }}>
      <ToastContainer />

      <div className="w-full bg-yellow-100">
        <div className="px-6 lg:px-8 py-4 lg:py-5">
          <h1 className="text-4xl font-bold text-black">Datos Contables - Código #{id}</h1>
          <p className="text-sm text-black-700 mt-1">Actualiza la clasificación contable y datos fiscales del artículo</p>
        </div>
      </div>

      <div className="w-full max-w-7xl px-6 lg:px-8 mx-auto py-8">
        <form onSubmit={handleSubmit(updateCodigo)} className="space-y-6">
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

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-700">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                    <path d="M12 12a4 4 0 100-8 4 4 0 000 8z" />
                    <path d="M4 20a8 8 0 0116 0v1H4v-1z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Nombre del Solicitante</p>
                  <p className="mt-1 text-sm text-slate-700">{watch('nombre_solicitante') || 'Sin datos'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-700">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                    <path d="M3 21h18v-2H3v2zM6 7h2v2H6V7zm0 4h2v2H6v-2zM10 7h2v2h-2V7zm0 4h2v2h-2v-2zM14 7h2v2h-2V7zm0 4h2v2h-2v-2z" />
                    <path d="M19 3H5v14h14V3z" opacity=".3" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Área Solicitante</p>
                  <p className="mt-1 text-sm text-slate-700">{watch('requestor_area') || 'Sin datos'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-700">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 3.5L18.5 8H14a1 1 0 01-1-1V3.5z" />
                    <path d="M8 12h8v2H8v-2zm0-4h8v2H8V8z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Descripción SAP</p>
                  <p className="mt-1 text-sm text-slate-700">{watch('descripcion_sap') || 'Sin datos'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-700">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                    <path d="M4.22 19.78a1 1 0 001.41 0l14-14a1 1 0 000-1.41l-2.59-2.59a1 1 0 00-1.41 0l-14 14a1 1 0 000 1.41L4.22 19.78zM5.64 6.34l1.42-1.42 2.12 2.12-1.42 1.42-2.12-2.12zm3.54 3.54l1.42-1.42 2.12 2.12-1.42 1.42-2.12-2.12zm3.54 3.54l1.42-1.42 2.12 2.12-1.42 1.42-2.12-2.12z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Unidad de Medida</p>
                  <p className="mt-1 text-sm text-slate-700">{watch('unidad_medida') || 'Sin datos'}</p>
                </div>
              </div>
            </div>

            <hr className="my-6 border-slate-200" />

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-700">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                  <path d="M4 6.5C4 5.67 4.67 5 5.5 5S7 5.67 7 6.5 6.33 8 5.5 8 4 7.33 4 6.5zM4 12.5C4 11.67 4.67 11 5.5 11S7 11.67 7 12.5 6.33 14 5.5 14 4 13.33 4 12.5zM4 18.5C4 17.67 4.67 17 5.5 17S7 17.67 7 18.5 6.33 20 5.5 20 4 19.33 4 18.5zM9 6h11v2H9V6zm0 6h11v2H9v-2zm0 6h11v2H9v-2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Detalles</p>
                <p className="mt-1 text-sm text-slate-700 leading-7">{watch('Details') || 'Sin datos'}</p>
              </div>
            </div>
          </section>

          {/* Datos Contables (Editable) */}
          <section className="w-full overflow-hidden rounded-[28px] border border-slate-200 border-l-4 border-l-yellow-300 bg-white shadow-[0_25px_50px_-30px_rgba(15,23,42,0.2)]">
            <div className="flex items-center justify-between px-6 py-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-700 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92 1.58l-1.67-1.67 9.19-9.19 1.67 1.67-9.19 9.19zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                </div>
                <p className="text-xl font-semibold text-slate-900">Datos Contables y Fiscales</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-yellow-700">
                Ingrese la información
              </span>
            </div>

            <div className="grid gap-6 px-6 py-6 md:grid-cols-2">
              {/* Grupo de Artículos */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-900">
                  Grupo de Artículos *
                </label>
                <select
                  disabled={loadingOptions}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:bg-white disabled:text-slate-900 cursor-wait"
                  {...register('ItemsGroupCode', {
                    required: 'El grupo de artículos es obligatorio'
                  })}
                >
                  {loadingOptions ? (
                    <option value="">Cargando grupos...</option>
                  ) : (
                    <>
                      <option value="">Selecciona un grupo</option>
                      {itemsGroups.map((group) => (
                        <option key={group.Code} value={group.Code}>
                          {group.Name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                {errors.ItemsGroupCode && (
                  <p className="text-sm text-red-600">{errors.ItemsGroupCode.message}</p>
                )}
              </div>

              {/* Tipo de Bien */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-900">
                  Tipo de Bien *
                </label>
                <select
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
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

              {/* IVA Compra */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-900">
                  IVA Compra *
                </label>
                <select
                  disabled={loadingOptions}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:bg-white disabled:text-slate-900 cursor-wait"
                  {...register('PurchaseTaxCode', {
                    required: 'El IVA de compra es obligatorio'
                  })}
                >
                  {loadingOptions ? (
                    <option value="">Cargando impuestos...</option>
                  ) : (
                    <>
                      <option value="">Selecciona IVA</option>
                      {vatGroups.map((vat) => (
                        <option key={vat.Code} value={vat.Code}>
                          {vat.Name} ({vat.Code})
                        </option>
                      ))}
                    </>
                  )}
                </select>
                {errors.PurchaseTaxCode && (
                  <p className="text-sm text-red-600">{errors.PurchaseTaxCode.message}</p>
                )}
              </div>

              {/* IVA Venta */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-900">
                  IVA Venta *
                </label>
                <select
                  disabled={loadingOptions}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:bg-white disabled:text-slate-900 cursor-wait"
                  {...register('SalesTaxCode', {
                    required: 'El IVA de venta es obligatorio'
                  })}
                >
                  {loadingOptions ? (
                    <option value="">Cargando impuestos...</option>
                  ) : (
                    <>
                      <option value="">Selecciona IVA</option>
                      {vatGroups.map((vat) => (
                        <option key={vat.Code} value={vat.Code}>
                          {vat.Name} ({vat.Code})
                        </option>
                      ))}
                    </>
                  )}
                </select>
                {errors.SalesTaxCode && (
                  <p className="text-sm text-red-600">{errors.SalesTaxCode.message}</p>
                )}
              </div>
            </div>
          </section>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard/tablas')}
              className="flex-1 inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 inline-flex items-center justify-center rounded-lg bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContabilidadEditarCodigo;