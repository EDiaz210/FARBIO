import { useEffect, useState } from 'react'; // 1. Importar useEffect
import { useParams } from 'react-router-dom'; // 2. Importar useParams
import { useForm } from 'react-hook-form';
import useFetch from '../hooks/useFetch';
import storeAuth from '../context/storeAuth';
import { toast, ToastContainer } from 'react-toastify';

const ItemForm = () => {
  // 3. Obtener el id que viene en la URL (/item-form/:id)
  const { id } = useParams(); 
  const { register, handleSubmit, formState: { errors }, reset, setValue, getValues } = useForm();
  const { fetchDataBackend } = useFetch();
  const { token, user } = storeAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vatGroups, setVatGroups] = useState([]);
  const [itemsGroups, setItemsGroups] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);

  const userRole = user?.rol?.toLowerCase() || '';
  const userID = user?.id || null;

  // 4. Efecto para cargar los datos apenas entre a la página si existe un ID
  useEffect(() => {
  if (id) {
    fetchItemById(id);
    
  } else {
    reset(); // Limpia el formulario si entras a "Crear" después de haber editado uno
  }
  
  // Cargar datos maestros de SAP
  fetchSAPMasterData();
}, [id, reset, token]);

  // 5. Efecto para establecer el valor por defecto de ItemType cuando los datos estén listos
  useEffect(() => {
    if (itemTypes.length > 0 && !id) {
      setValue("ItemType", "B");
    }
  }, [itemTypes, id, setValue]);

  // Cargar datos maestros desde SAP
  const fetchSAPMasterData = async () => {
    try {
      const [vatRes, itemsRes] = await Promise.all([
        fetchDataBackend(`${import.meta.env.VITE_BACKEND_URL}/api/sap/vat-groups`, null, 'GET', token),
        fetchDataBackend(`${import.meta.env.VITE_BACKEND_URL}/api/sap/items-groups`, null, 'GET', token)
      ]);

      // Intentar extraer data de diferentes estructuras de respuesta
      const vatData = vatRes?.data || vatRes?.value || vatRes || [];
      const itemsData = itemsRes?.data || itemsRes?.value || itemsRes || [];

      // Mapear los datos a formato consistente para los dropdowns
      // ItemsGroups usa Number y GroupName
      const mappedItemsGroups = Array.isArray(itemsData) 
        ? itemsData.map(item => ({
            Code: item.Number,
            Name: item.GroupName
          }))
        : [];

      // Tipos de bien - Hardcodeado
      const mappedItemTypes = [
        { Code: 'B', Name: 'BIEN' },
        { Code: 'S', Name: 'SERVICIO' },
        { Code: 'A', Name: 'ACTIVO' }
      ];



      setVatGroups(Array.isArray(vatData) ? vatData : []);
      setItemsGroups(mappedItemsGroups);
      setItemTypes(mappedItemTypes);
    } catch (error) {
      console.error('Error cargando datos maestros:', error);
    }
  };

  const fetchItemById = async (itemId) => {
  try {
    setIsSubmitting(true);
    const url = `${import.meta.env.VITE_BACKEND_URL}/api/codigos/${itemId}`;
    const response = await fetchDataBackend(url, null, 'GET', token);
    if (response?.codigo) {
      const item = response.codigo;
      
      // Asegúrate de que estos nombres coincidan EXACTAMENTE con el {...register("Nombre")}
      setValue("ItemCode", item.codigo || ""); 
      setValue("ItemName", item.descripcion_sap || "");
      setValue("ForeignName", item.nombre_extranjero || "");
      setValue("RequestorDescription", item.descripcion || "");
      setValue("Details", item.detalles || "");
      setValue("ReferenceLink", item.link_referencia || "");
      setValue("PurchaseUnit", item.unidad_compra || "");
      setValue("PurchaseTaxCode", item.impuesto_compra || "");
      setValue("SalesTaxCode", item.impuesto_venta || "");
      setValue("LeadTimeInDays", item.lead_time || "");
      setValue("ItemsGroupCode", item.grupo_articulos || "");
      setValue("ItemType", item.tipo_bien || "");
      setValue("ToleranceDays", item.dias_tolerancia || "");
      // Checkboxes - SAP uses 'tYES' or 'tNO'
      setValue("InventoryItem", item.inventario === 'tYES');
      setValue("SalesItem", item.venta === 'tYES');
      setValue("PurchaseItem", item.compra === 'tYES');
    }
  } catch (error) {
    console.error("Error buscando por ID", error);
  } finally {
    setIsSubmitting(false);
  }
};

  const buscarItemEnSAP = async () => {
    const itemCode = getValues('ItemCode')?.trim();

    if (!itemCode) {
      toast.error('Ingresa un código de item para buscarlo en SAP');
      return;
    }

    try {
      setLoading(true);
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
      setValue('ItemsGroupCode', item.ItemsGroupCode ?? item.grupo_articulos ?? '');
      setValue('ItemType', item.ItemType || item.tipo_bien || '');
      setValue('PurchaseUnit', item.PurchaseUnit || item.unidad_compra || '');
      setValue('PurchaseTaxCode', item.PurchaseTaxCode || item.impuesto_compra || '');
      setValue('SalesTaxCode', item.SalesTaxCode || item.impuesto_venta || '');
      setValue('InventoryItem', item.InventoryItem === 'tYES' || item.InventoryItem === true);
      setValue('SalesItem', item.SalesItem === 'tYES' || item.SalesItem === true);
      setValue('PurchaseItem', item.PurchaseItem === 'tYES' || item.PurchaseItem === true);

      toast.success('Item encontrado en SAP');
    } catch (error) {
      console.error('Error buscando item en SAP:', error);
      toast.error('Error buscando el item en SAP');
    } finally {
      setLoading(false);
    }
  };

  const isFieldEnabled = (fieldName) => {
    if (userRole.includes('maestro') || userRole.includes('master')) return true;

    const rolePermissions = {
      'contabilidad': ['ItemsGroupCode', 'ItemType'],
      'compras': ['LeadTimeInDays', 'ToleranceDays'],
      'solicitante': ['RequestorDescription', 'Details', 'ReferenceLink']
    };

    const allowedFields = rolePermissions[userRole] || [];
    return allowedFields.includes(fieldName);
  };

  const createItem = async (data) => {
  try {
    setIsSubmitting(true);
    
    // Objeto base de datos
    const codigoData = {
      descripcionSolicitante: data.RequestorDescription,
      detalles: data.Details,
      link_referencia: data.ReferenceLink,
      userId: userID,
      userName: user?.nombre || user?.email || 'Usuario',
    };

    let url = "";
    let method = "";

    if (id) {
      // MODO EDICIÓN / ACTUALIZACIÓN
      method = 'PUT';
      
      if (userRole.includes('compras')) {
        codigoData.lead_time = data.LeadTimeInDays;
        codigoData.dias_tolerancia = data.ToleranceDays;
        url = `${import.meta.env.VITE_BACKEND_URL}/api/compras/update/${id}`;
      } else if (userRole.includes('contabilidad')) {
        codigoData.grupo_articulos = data.ItemsGroupCode;
        codigoData.tipo_bien = data.ItemType;
        url = `${import.meta.env.VITE_BACKEND_URL}/api/contabilidad/update/${id}`;
      } else {
        // Si el solicitante edita su propia solicitud
        method = 'PUT';
        url = `${import.meta.env.VITE_BACKEND_URL}/api/solicitante/codigos/${id}`;
      }
    } else {
      // MODO CREACIÓN
      url = `${import.meta.env.VITE_BACKEND_URL}/api/solicitante/codigos/create`;
      method = 'POST';
    }

    const response = await fetchDataBackend(url, codigoData, method, token);
    if (response?.success) {
      reset(); // Limpiar después de crear o actualizar
    }
  } catch (error) {
    console.error("Error al procesar el formulario", error);
  } finally {
    setIsSubmitting(false);
  }
};

  const sendToSAP = async (data) => {
    try {
      setIsSubmitting(true);
      const codigoData = {
        codigo: data.ItemCode,
        descripcion: data.RequestorDescription,
        detalles: data.Details,
        link_referencia: data.ReferenceLink,
        descripcion_sap: data.ItemName,
        nombre_extranjero: data.ForeignName,
        unidad_compra: data.PurchaseUnit,
        impuesto_compra: data.PurchaseTaxCode,
        impuesto_venta: data.SalesTaxCode,
        lead_time: data.LeadTimeInDays,
        dias_tolerancia: data.ToleranceDays,
        grupo_articulos: data.ItemsGroupCode,
        tipo_bien: data.ItemType,
        inventario: data.InventoryItem ? 'tYES' : 'tNO',
        venta: data.SalesItem ? 'tYES' : 'tNO',
        compra: data.PurchaseItem ? 'tYES' : 'tNO',
        status: 'finalizado',
        userId: userID,
        userName: user?.nombre || user?.email || 'Usuario',
      };

      const url = `${import.meta.env.VITE_BACKEND_URL}/api/maestro/codigos/${id}`;
      const response = await fetchDataBackend(url, codigoData, 'PUT', token);
      if (response?.success) reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white p-4" style={{ fontFamily: 'Gowun Batang, serif' }}>
      <ToastContainer />
      <h1 className="text-2xl font-bold text-[#17243D] mb-1">
        {id ? `Editando Código #${id}` : 'Crear Código'}
      </h1>
      <p className="text-gray-600 mb-6">
        {loading ? "Cargando datos..." : "Completa los datos según tu rol de acceso"}
      </p>

      <form onSubmit={handleSubmit(createItem)}>
        <div className="flex gap-8">
          {/* COLUMNA IZQUIERDA */}
          <div className="flex-1 max-w-sm space-y-4">
            {/* Código */}
            <div className="flex flex-col">
              <label className="text-[#17243D] font-semibold mb-2 text-sm">Código</label>
              <div className="relative">
                <input
                  type="text"
                  disabled={!isFieldEnabled('ItemCode')}
                  className={`p-4 rounded-3xl text-[#17243D] w-full ${
                    isFieldEnabled('ItemCode') ? 'bg-[#dee2e6]' : 'bg-gray-300 cursor-not-allowed'
                  }`}
                  {...register("ItemCode")}
                />
                <button
                  type="button"
                  disabled={!userRole.includes('maestro')}
                  onClick={buscarItemEnSAP}
                  className={`absolute right-4 top-1/2 transform -translate-y-1/2 rounded-full w-12 h-12 flex items-center justify-center transition ${
                    !userRole.includes('maestro')
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-[#17243D] text-white hover:bg-[#EF3340]'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Descripción SAP */}
            <div className="flex flex-col">
              <label className="text-[#17243D] font-semibold mb-2 text-sm">Descripción (ItemName)</label>
              <input
                type="text"
                disabled={!isFieldEnabled('ItemName')}
                className={`p-4 rounded-3xl text-[#17243D] ${
                  isFieldEnabled('ItemName') ? 'bg-[#dee2e6]' : 'bg-gray-300 cursor-not-allowed'
                }`}
                {...register("ItemName")}
              />
            </div>

            {/* Nombre Extranjero */}
            <div className="flex flex-col">
              <label className="text-[#17243D] font-semibold mb-2 text-sm">Nombre Extranjero</label>
              <input
                type="text"
                disabled={!isFieldEnabled('ForeignName')}
                className={`p-4 rounded-3xl text-[#17243D] ${
                  isFieldEnabled('ForeignName') ? 'bg-[#dee2e6]' : 'bg-gray-300 cursor-not-allowed'
                }`}
                {...register("ForeignName")}
              />
            </div>

            {/* Descripción Solicitante */}
            <div className="flex flex-col">
              <label className="text-[#17243D] font-semibold mb-2 text-sm">Descripción Solicitante</label>
              <textarea
                disabled={!isFieldEnabled('RequestorDescription')}
                className={`p-4 rounded-3xl text-[#17243D] min-h-20 resize-none ${
                  isFieldEnabled('RequestorDescription') ? 'bg-[#dee2e6]' : 'bg-gray-300 cursor-not-allowed'
                }`}
                {...register("RequestorDescription")}
              />
            </div>

            {/* Detalles */}
            <div className="flex flex-col">
              <label className="text-[#17243D] font-semibold mb-2 text-sm">Detalles</label>
              <textarea
                disabled={!isFieldEnabled('Details')}
                className={`p-4 rounded-3xl text-[#17243D] min-h-20 resize-none ${
                  isFieldEnabled('Details') ? 'bg-[#dee2e6]' : 'bg-gray-300 cursor-not-allowed'
                }`}
                {...register("Details")}
              />
            </div>

            {/* Link de Referencia */}
            <div className="flex flex-col">
              <label className="text-[#17243D] font-semibold mb-2 text-sm">Link de Referencia</label>
              <input
                type="text"
                disabled={!isFieldEnabled('ReferenceLink')}
                className={`p-4 rounded-3xl text-[#17243D] ${
                  isFieldEnabled('ReferenceLink') ? 'bg-[#dee2e6]' : 'bg-gray-300 cursor-not-allowed'
                }`}
                {...register("ReferenceLink")}
              />
            </div>
          </div>

          {/* COLUMNA DERECHA */}
          <div className="flex-1 relative">
            {/* Checkboxes - Posicionadas en la esquina superior derecha */}
            <div className="absolute top-0 right-0 flex flex-col gap-3">
              {/* Primera fila horizontal */}
              <div className="flex items-center justify-end gap-6">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="inventoryItem"
                    disabled={!isFieldEnabled('InventoryItem')}
                    className="w-6 h-6 accent-[#17243D] cursor-pointer disabled:cursor-not-allowed"
                    {...register("InventoryItem")}
                  />
                  <label htmlFor="inventoryItem" className="text-[#17243D] font-medium text-sm cursor-pointer">Item de Inventario</label>
                </div>
              </div>

              {/* Segunda fila horizontal */}
              <div className="flex items-center justify-end gap-6">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="purchaseItem"
                    disabled={!isFieldEnabled('PurchaseItem')}
                    className="w-6 h-6 accent-[#17243D] cursor-pointer disabled:cursor-not-allowed"
                    {...register("PurchaseItem")}
                  />
                  <label htmlFor="purchaseItem" className="text-[#17243D] font-medium text-sm cursor-pointer">Item de Compra</label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="salesItem"
                    disabled={!isFieldEnabled('SalesItem')}
                    className="w-6 h-6 accent-[#17243D] cursor-pointer disabled:cursor-not-allowed"
                    {...register("SalesItem")}
                  />
                  <label htmlFor="salesItem" className="text-[#17243D] font-medium text-sm cursor-pointer">Item de Venta</label>
                </div>
              </div>
            </div>

            {/* Campos - Derecha */}
            <div className="space-y-4 max-w-xs">
              {/* Unidad de Compra */}
              <div className="flex flex-col">
                <label className="text-[#17243D] font-semibold mb-2 text-sm">Unidad de Compra</label>
                <input
                  type="text"
                  disabled={!isFieldEnabled('PurchaseUnit')}
                  className={`p-4 rounded-3xl text-[#17243D] ${
                    isFieldEnabled('PurchaseUnit') ? 'bg-[#dee2e6]' : 'bg-gray-300 cursor-not-allowed'
                  }`}
                  {...register("PurchaseUnit")}
                />
              </div>

              {/* Código Impuesto Compra - PurchaseTaxCode (VAT Group) */}
              <div className="flex flex-col">
                <label className="text-[#17243D] font-semibold mb-2 text-sm">Código Impuesto Compra (VAT Group)</label>
                <select
                  disabled={!isFieldEnabled('PurchaseTaxCode')}
                  className={`p-4 rounded-3xl text-[#17243D] ${
                    isFieldEnabled('PurchaseTaxCode') ? 'bg-[#dee2e6]' : 'bg-gray-300 cursor-not-allowed'
                  }`}
                  {...register("PurchaseTaxCode")}
                >
                  <option value="">-- Selecciona VAT Group --</option>
                  {vatGroups.length > 0 ? (
                    vatGroups.map((vat, idx) => (
                      <option key={idx} value={vat.Code || vat.id || ''}>
                        {vat.Name || vat.name || vat.Code || vat.id}
                      </option>
                    ))
                  ) : (
                    <option disabled>Sin datos de VAT Groups</option>
                  )}
                </select>
              </div>

              {/* Código Impuesto Venta - SalesTaxCode (VAT Group) */}
              <div className="flex flex-col">
                <label className="text-[#17243D] font-semibold mb-2 text-sm">Código Impuesto Venta (VAT Group)</label>
                <select
                  disabled={!isFieldEnabled('SalesTaxCode')}
                  className={`p-4 rounded-3xl text-[#17243D] ${
                    isFieldEnabled('SalesTaxCode') ? 'bg-[#dee2e6]' : 'bg-gray-300 cursor-not-allowed'
                  }`}
                  {...register("SalesTaxCode")}
                >
                  <option value="">-- Selecciona VAT Group --</option>
                  {vatGroups.length > 0 ? (
                    vatGroups.map((vat, idx) => (
                      <option key={idx} value={vat.Code || vat.id || ''}>
                        {vat.Name || vat.name || vat.Code || vat.id}
                      </option>
                    ))
                  ) : (
                    <option disabled>Sin datos de VAT Groups</option>
                  )}
                </select>
              </div>

              {/* Lead Time en Días - LeadTimeInDays */}
              <div className="flex flex-col">
                <label className="text-[#17243D] font-semibold mb-2 text-sm">Lead Time (días)</label>
                <input
                  type="number"
                  disabled={!isFieldEnabled('LeadTimeInDays')}
                  className={`p-4 rounded-3xl text-[#17243D] ${
                    isFieldEnabled('LeadTimeInDays') ? 'bg-[#dee2e6]' : 'bg-gray-300 cursor-not-allowed'
                  }`}
                  {...register("LeadTimeInDays")}
                />
              </div>

              {/* Código Grupo de Artículo - ItemsGroupCode */}
              <div className="flex flex-col">
                <label className="text-[#17243D] font-semibold mb-2 text-sm">Código Grupo Artículo</label>
                <select
                  disabled={!isFieldEnabled('ItemsGroupCode')}
                  className={`p-4 rounded-3xl text-[#17243D] ${
                    isFieldEnabled('ItemsGroupCode') ? 'bg-[#dee2e6]' : 'bg-gray-300 cursor-not-allowed'
                  }`}
                  {...register("ItemsGroupCode")}
                >
                  <option value="">-- Selecciona Grupo Artículo --</option>
                  {itemsGroups.length > 0 ? (
                    itemsGroups.map((group, idx) => (
                      <option key={idx} value={group.Code || group.id || ''}>
                        {group.Name || group.name || group.Code || group.id}
                      </option>
                    ))
                  ) : (
                    <option disabled>Sin datos de Grupos</option>
                  )}
                </select>
              </div>

              {/* Tipo de Bien */}
              <div className="flex flex-col">
                <label className="text-[#17243D] font-semibold mb-2 text-sm">Tipo de Bien</label>
                <select
                  disabled={!isFieldEnabled('ItemType')}
                  className={`p-4 rounded-3xl text-[#17243D] ${
                    isFieldEnabled('ItemType') ? 'bg-[#dee2e6]' : 'bg-gray-300 cursor-not-allowed'
                  }`}
                  {...register("ItemType")}
                >
                  <option value="">-- Selecciona Tipo de Bien --</option>
                  {itemTypes.length > 0 ? (
                    itemTypes.map((type, idx) => (
                      <option key={idx} value={type.Code || type.id || ''}>
                        {type.Name || type.name || type.Code || type.id}
                      </option>
                    ))
                  ) : (
                    <option disabled>Sin datos de Tipos</option>
                  )}
                </select>
              </div>

              {/* Días de Tolerancia */}
              <div className="flex flex-col">
                <label className="text-[#17243D] font-semibold mb-2 text-sm">Días de Tolerancia</label>
                <input
                  type="number"
                  disabled={!isFieldEnabled('ToleranceDays')}
                  className={`p-4 rounded-3xl text-[#17243D] ${
                    isFieldEnabled('ToleranceDays') ? 'bg-[#dee2e6]' : 'bg-gray-300 cursor-not-allowed'
                  }`}
                  {...register("ToleranceDays")}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Botón Acción según rol e ID */}
        <div className="mt-6 flex gap-4">
          {!userRole.includes('maestro') && (
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-64 text-white font-bold py-3 rounded-full transition disabled:opacity-50 ${
                id ? 'bg-[#17243D] hover:bg-[#EF3340]' : 'bg-[#17243D] hover:bg-[#EF3340]'
              }`}
            >
              {isSubmitting ? (
                id ? 'Actualizando Código...' : 'Creando Código...'
              ) : (
                id ? 'Actualizar Código' : 'Crear Código'
              )}
            </button>
          )}

          {/* Botón Maestro */}
          {(userRole.includes('maestro') || userRole.includes('master')) && (
            <button
              type="button"
              onClick={handleSubmit(sendToSAP)}
              disabled={isSubmitting}
              className="w-64 bg-[#17243D] hover:bg-[#EF3340] text-white font-bold py-3 rounded-full transition disabled:opacity-50"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar a SAP'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ItemForm;
