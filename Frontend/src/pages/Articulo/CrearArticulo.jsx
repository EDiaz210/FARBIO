import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import useFetch from '../../hooks/useFetch';
import storeAuth from '../../context/storeAuth';
import ArticuloFormLayout from './ArticuloFormLayout';
import { ITEM_TYPES, isFieldEnabled } from './ArticuloFormUtils';

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

const CrearArticulo = () => {
  const { token, user } = storeAuth();
  const { fetchDataBackend } = useFetch();
  const [vatGroups, setVatGroups] = useState([]);
  const [itemsGroups, setItemsGroups] = useState([]);
  const [itemTypes, setItemTypes] = useState(ITEM_TYPES);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userRole = user?.rol?.toLowerCase() || '';
  const userID = user?.id || null;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    getValues
  } = useForm({ defaultValues });

  useEffect(() => {
    fetchSAPMasterData();
  }, [token]);

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

  const createItem = async (data) => {
    try {
      setIsSubmitting(true);

      const codigoData = {
        descripcionSolicitante: data.RequestorDescription,
        detalles: data.Details,
        link_referencia: data.ReferenceLink,
        userId: userID,
        userName: user?.nombre || user?.email || 'Usuario'
      };

      const url = `${import.meta.env.VITE_BACKEND_URL}/api/solicitante/codigos/create`;
      const response = await fetchDataBackend(url, codigoData, 'POST', token);

      if (response?.success) {
        reset();
      }
    } catch (error) {
      console.error('Error al crear el artículo', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ArticuloFormLayout
      title="Crear Código"
      description="Completa los datos según tu rol de acceso"
      loading={loading}
      isSubmitting={isSubmitting}
      id={null}
      userRole={userRole}
      vatGroups={vatGroups}
      itemsGroups={itemsGroups}
      itemTypes={itemTypes}
      register={register}
      errors={errors}
      handleSubmit={handleSubmit}
      onSubmit={createItem}
      onSecondarySubmit={() => {}}
      onBuscarItem={buscarItemEnSAP}
      submitButtonText="Crear Código"
      secondaryButtonText="Enviar a SAP"
      showSecondaryButton={false}
      isFieldEnabled={(fieldName) => isFieldEnabled(userRole, fieldName)}
    />
  );
};

export default CrearArticulo;
