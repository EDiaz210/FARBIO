import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import useFetch from '../../hooks/useFetch';
import storeAuth from '../../context/storeAuth';
import ArticuloFormLayout from './ArticuloFormLayout';
import { ITEM_TYPES, isFieldEnabled } from './ArticuloFormUtils';
import { getAuthClaims } from '../../utils/authClaims';

const defaultValues = {
  ItemCode: '',
  ItemName: '',
  ForeignName: '',
  RequestorDescription: '',
  Details: '',
  ReferenceLink: '',
  PurchaseUnit: '',
  PurchaseTaxCode: '',
  SalesTaxCode: '',
  LeadTimeInDays: '',
  ItemsGroupCode: '',
  ItemType: 'B',
  ToleranceDays: '',
  InventoryItem: false,
  SalesItem: false,
  PurchaseItem: false
};

const EditarArticulo = ({ id }) => {
  const { token } = storeAuth();
  const { fetchDataBackend } = useFetch();
  const [vatGroups, setVatGroups] = useState([]);
  const [itemsGroups, setItemsGroups] = useState([]);
  const [itemTypes, setItemTypes] = useState(ITEM_TYPES);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const claims = getAuthClaims(token);
  const userRole = claims?.rol?.toLowerCase() || '';
  const userID = claims?.id || null;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    getValues
  } = useForm({ defaultValues });

  useEffect(() => {
    if (token) {
      fetchSAPMasterData();
      fetchItemById(id);
    }
  }, [token, id]);

  useEffect(() => {
    if (itemTypes.length > 0 && !getValues('ItemType')) {
      setValue('ItemType', 'B');
    }
  }, [itemTypes, getValues, setValue]);

  const fetchSAPMasterData = async () => {
    try {
      setLoading(true);
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
      setItemTypes(ITEM_TYPES);
    } catch (error) {
      console.error('Error cargando datos maestros:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchItemById = async (itemId) => {
    try {
      setLoading(true);
      const url = `${import.meta.env.VITE_BACKEND_URL}/api/codigos/${itemId}`;
      const response = await fetchDataBackend(url, null, 'GET', token);

      if (response?.codigo) {
        const item = response.codigo;
        setValue('ItemCode', item.codigo || '');
        setValue('ItemName', item.descripcion_sap || '');
        setValue('ForeignName', item.nombre_extranjero || '');
        setValue('RequestorDescription', item.descripcion || '');
        setValue('Details', item.detalles || '');
        setValue('ReferenceLink', item.link_referencia || '');
        setValue('PurchaseUnit', item.unidad_compra || '');
        setValue('PurchaseTaxCode', item.impuesto_compra || '');
        setValue('SalesTaxCode', item.impuesto_venta || '');
        setValue('LeadTimeInDays', item.lead_time || '');
        setValue('ItemsGroupCode', item.grupo_articulos || '');
        setValue('ItemType', item.tipo_bien || '');
        setValue('ToleranceDays', item.dias_tolerancia || '');
        setValue('InventoryItem', item.inventario === 'tYES');
        setValue('SalesItem', item.venta === 'tYES');
        setValue('PurchaseItem', item.compra === 'tYES');
      }
    } catch (error) {
      console.error('Error buscando por ID', error);
    } finally {
      setLoading(false);
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

  const updateItem = async (data) => {
    try {
      setIsSubmitting(true);

      const codigoData = {
        descripcionSolicitante: data.RequestorDescription,
        detalles: data.Details,
        link_referencia: data.ReferenceLink,
        userId: userID
      };

      let url = '';
      let method = 'PUT';

      if (userRole.includes('compras')) {
        codigoData.lead_time = data.LeadTimeInDays;
        codigoData.dias_tolerancia = data.ToleranceDays;
        url = `${import.meta.env.VITE_BACKEND_URL}/api/compras/update/${id}`;
      } else if (userRole.includes('contabilidad')) {
        codigoData.grupo_articulos = data.ItemsGroupCode;
        codigoData.tipo_bien = data.ItemType;
        url = `${import.meta.env.VITE_BACKEND_URL}/api/contabilidad/update/${id}`;
      } else {
        url = `${import.meta.env.VITE_BACKEND_URL}/api/solicitante/codigos/${id}`;
      }

      const response = await fetchDataBackend(url, codigoData, method, token);
      if (response?.success) {
        reset();
      }
    } catch (error) {
      console.error('Error al actualizar el artículo', error);
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
        userName: user?.nombre || user?.email || 'Usuario'
      };

      const url = `${import.meta.env.VITE_BACKEND_URL}/api/maestro/codigos/${id}`;
      const response = await fetchDataBackend(url, codigoData, 'PUT', token);
      if (response?.success) reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ArticuloFormLayout
      title={`Editando Código #${id}`}
      description="Completa los datos según tu rol de acceso"
      loading={loading}
      isSubmitting={isSubmitting}
      id={id}
      userRole={userRole}
      vatGroups={vatGroups}
      itemsGroups={itemsGroups}
      itemTypes={itemTypes}
      register={register}
      errors={errors}
      handleSubmit={handleSubmit}
      onSubmit={updateItem}
      onSecondarySubmit={sendToSAP}
      onBuscarItem={buscarItemEnSAP}
      submitButtonText="Actualizar Código"
      secondaryButtonText="Enviar a SAP"
      showSecondaryButton={Boolean(id && (userRole.includes('maestro') || userRole.includes('master')))}
      isFieldEnabled={(fieldName) => isFieldEnabled(userRole, fieldName)}
    />
  );
};

export default EditarArticulo;
