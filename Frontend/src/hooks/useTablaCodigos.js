import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useFetch from './useFetch';
import storeAuth from '../context/storeAuth';
import { getAuthClaims } from '../utils/authClaims';

/**
 * Hook personalizado para gestionar la lógica de tablas de códigos por rol
 * @param {string} userRole - El rol del usuario (solicitante, compras, contabilidad, maestrodedatos)
 * @param {string} status - El status que se debe buscar
 * @param {string} editRoute - La ruta base para editar (ej: '/dashboard/insumos/editar')
 * @param {object} colorConfig - Configuración de colores del rol
 * @returns {object} Lógica completa de la tabla
 */
export const useTablaCodigos = (userRole, status, editRoute, colorConfig) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const { fetchDataBackend } = useFetch();
  const { token } = storeAuth();
  const navigate = useNavigate();

  // Calcular items por página dinámicamente basado en altura de pantalla
  useEffect(() => {
    const calculateItems = () => {
      const vh = window.innerHeight;
      const isMobile = window.innerWidth < 768;

      if (isMobile) {
        const dynamicCards = Math.floor((vh - 260) / 75);
        setItemsPerPage(Math.max(3, dynamicCards));
      } else {
        const dynamicRows = Math.floor((vh - 340) / 85);
        setItemsPerPage(Math.max(4, dynamicRows));
      }
    };

    calculateItems();
    window.addEventListener('resize', calculateItems);
    return () => window.removeEventListener('resize', calculateItems);
  }, []);

  // Cargar datos del backend
  useEffect(() => {
    const loadData = async () => {
      if (!status) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const sanitizedStatus = encodeURIComponent(status.trim());
        const url = `${import.meta.env.VITE_BACKEND_URL}/api/codigos/search?status=${sanitizedStatus}`;
        const response = await fetchDataBackend(url, null, 'GET', null);
        if (response?.codigos) setItems(response.codigos);
      } catch (err) {
        console.error('Error cargando códigos:', err);
      } finally {
        setLoading(false);
        setCurrentPage(1);
      }
    };

    loadData();
  }, [fetchDataBackend, status]);

  // Calcular paginación
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(items.length / itemsPerPage)),
    [items.length, itemsPerPage]
  );

  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  }, [items, currentPage, itemsPerPage]);

  // Navegar a editar
  const handleEdit = (id) => {
    navigate(`${editRoute}/${id}`);
  };

  return {
    items,
    loading,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    totalPages,
    currentItems,
    handleEdit,
    clasesColor: colorConfig
  };
};
