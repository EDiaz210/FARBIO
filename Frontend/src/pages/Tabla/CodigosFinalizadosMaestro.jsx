import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import * as XLSX from 'xlsx';
import { useTablaCodigos } from '../../hooks/useTablaCodigos';
import { EyeIcon } from './TablaCodigos_Components';

const FONT_LINK =
  'https://fonts.googleapis.com/css2?family=Gowun+Batang&display=swap';

// Historial de Maestro de Datos.
const formatHistoryRows = (history) => {
  if (!history) return [];

  let parsedHistory = history;

  if (typeof history === 'string') {
    try {
      parsedHistory = JSON.parse(history);
    } catch {
      parsedHistory = history;
    }
  }

  const entries = Array.isArray(parsedHistory)
    ? parsedHistory
    : [parsedHistory];

  return entries.map((entry) => {
    if (entry === null || entry === undefined) {
      return { fecha: '', creador: '' };
    }

    if (typeof entry === 'object') {
      return {
        fecha: entry.fecha ?? '',
        creador: entry.creador ?? entry.usuario ?? '',
      };
    }

    return {
      fecha: String(entry),
      creador: '',
    };
  });
};

// Exportación para Excel.
const mostrarValor = (value) => {
  if (value === null || value === undefined) return '';

  if (typeof value === 'object') {
    return JSON.stringify(value)
      .replace(/\r\n/g, ' ')
      .replace(/[\r\n]/g, ' ');
  }

  return String(value).replace(/\r\n/g, ' ').replace(/[\r\n]/g, ' ');
};

const ETIQUETAS_CSV = {
  id: 'ID',
  codigo: 'Código SAP',
  status: 'Estado',
  descripcion: 'Descripción del solicitante',
  descripcion_sap: 'Descripción SAP',
  responsable_compras: 'Responsable de Compras',
  r_sap_descomprimido: 'Historial de Maestro de Datos',
  link_referencia:'Link',
  nombre_solicitante: 'Nombre del Solicitante',
  indicadorIVACompras: 'Indicador de IVA Compras',
  indicadorIVAVentas: 'Indicador de IVA Ventas',
  grupo_articulos: 'Grupo de Artículos',
  tipo_bien: 'Tipo de Bien',
  lead_time: 'Lead Time',
  grava_iva: 'IVA',
  unidad_medida: 'Unidad de Medida',
  inventoryItem: 'Lote de Inventario',
  salesItem: 'Artículo de Venta',
  purchaseItem: 'Artículo de Compra',
  empresa: 'Empresa',
  created_by: 'Creador por',
  created_at: 'Fecha de Creación',
  updated_by: 'Actualizado por',
  updated_at: 'Fecha de Actualización',
  responsable_compras: 'Responsable de Compras',
  comentario: 'Comentario',
  dias_tolerancia: 'Días de Tolerancia',
  cantidad_minima_pedido: 'Cantidad Mínima de Pedido',
  requestor_area: 'Área',
  nombre_extranjero: 'Nombre Extranjero',
};


const obtenerEtiquetaCsv = (campo) =>
  ETIQUETAS_CSV[campo] || campo.replace(/_/g, ' ');

const CAMPOS_AUXILIARES_CSV = new Set([
  'created_by_nombre',
  'updated_by_nombre',
  'compras_enviado_por_nombre',
]);

const createExcelRows = (items) => {
  const campos = [
    ...new Set(
      items.flatMap((item) =>
        Object.keys(item).filter(
          (campo) => !CAMPOS_AUXILIARES_CSV.has(campo)
        )
      )
    ),
  ];
  const columnas = campos.map(obtenerEtiquetaCsv);

  const filas = items.map((item) => {
    const fila = {};

    campos.forEach((campo, index) => {
      const columna = columnas[index];

        if (campo === 'created_by') {
          fila[columna] = mostrarValor(
            item.created_by_nombre || item.created_by
          );
          return;
        }

        if (campo === 'updated_by') {
          fila[columna] = mostrarValor(
            item.updated_by_nombre || item.updated_by
          );
          return;
        }

        fila[columna] = mostrarValor(item[campo]);
      });

    return fila;
  });

  return filas;
};

const downloadExcel = (items, fileName) => {
  const worksheet = XLSX.utils.json_to_sheet(createExcelRows(items));
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Códigos finalizados');
  XLSX.writeFile(workbook, fileName);
};

const CodigosFinalizadosMaestro = () => {
  const navigate = useNavigate();

  const {
    items,
    loading,
    currentPage,
    setCurrentPage,
    totalPages,
    currentItems,
    clasesColor,
  } = useTablaCodigos(
    '',
    'Finalizado',
    '/dashboard/maestro/editar',
    'bg-blue-300 text-black shadow-sm',
    {
      endpoint: `${
        import.meta.env.VITE_BACKEND_URL
      }/api/maestro/codigos/finalizados`,
    }
  );

  useEffect(() => {
    const link = document.createElement('link');

    link.href = FONT_LINK;
    link.rel = 'stylesheet';

    document.head.appendChild(link);

    return () => {
      link.remove();
    };
  }, []);

  const verCodigo = (id) => {
    navigate(`/dashboard/maestro/finalizados/${id}`);
  };

  const renderBotonVer = (item) => (
    <button
      type="button"
      onClick={() => verCodigo(item.id)}
      title="Ver información del código"
      aria-label={`Ver información del código ${item.id}`}
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-800 transition hover:bg-blue-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
    >
      <EyeIcon className="h-5 w-5" />
    </button>
  );

  const handleExport = () => {
    if (loading) return;

    if (items.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    try {
      const fecha = new Date().toISOString().split('T')[0];

      downloadExcel(
        items,
        `codigos_finalizados_${fecha}.xlsx`
      );

      toast.success('Archivo generado exitosamente');
    } catch (error) {
      console.error('Error al exportar códigos:', error);
      toast.error('Error al generar el archivo');
    }
  };

  const inicioPaginas = Math.max(
    1,
    Math.min(currentPage - 2, totalPages - 4)
  );

  const paginasVisibles = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => inicioPaginas + index
  );

  return (
    <div
      className="min-h-screen w-full min-w-0 max-w-full bg-white"
      style={{ fontFamily: 'Gowun Batang, serif' }}
    >
      <header className="w-full bg-blue-300 text-black shadow-sm">
        <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8 lg:py-5">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold sm:text-4xl">
              Códigos Finalizados
            </h1>

            <p className="mt-1 text-sm text-black/70">
              Registros concluidos por Maestro de Datos
            </p>
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={loading || items.length === 0}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#17243D] shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="h-5 w-5"
            >
              <path d="M12 3v12m-4-4 4 4 4-4" />
              <path d="M5 16v4h14v-4" />
            </svg>

            Descargar Excel
          </button>
        </div>
      </header>

      <main className="min-w-0 p-4 sm:p-6">
        <div className="w-full min-w-0 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          {/* Tarjetas para móvil */}
          <div className="divide-y divide-slate-100 md:hidden">
            {loading ? (
              <div className="p-10 text-center text-sm text-slate-500">
                Cargando registros...
              </div>
            ) : currentItems.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">
                No hay códigos finalizados.
              </div>
            ) : (
              currentItems.map((item) => {
                const historial = formatHistoryRows(
                  item.r_sap_descomprimido
                );

                return (
                  <article key={item.id} className="bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-slate-400">
                          #{item.id}
                        </span>

                        <p className="mt-1 break-words text-sm font-medium text-slate-800">
                          {item.descripcion_sap || 'Sin descripción'}
                        </p>
                      </div>

                      {renderBotonVer(item)}
                    </div>

                    <dl className="mt-4 space-y-3 border-t border-dashed border-slate-200 pt-4 text-sm">
                      <div>
                        <dt className="mb-1 text-xs font-semibold uppercase text-slate-400">
                          Código SAP
                        </dt>
                        <dd className="break-words text-slate-700">
                          {item.codigo || 'S/N'}
                        </dd>
                      </div>

                      <div>
                        <dt className="mb-1 text-xs font-semibold uppercase text-slate-400">
                          Estado
                        </dt>
                        <dd>
                          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                            {item.status || 'Sin estado'}
                          </span>
                        </dd>
                      </div>

                      <div>
                        <dt className="mb-1 text-xs font-semibold uppercase text-slate-400">
                          Fecha
                        </dt>
                        <dd className="space-y-1 text-slate-700">
                          {historial.length > 0 ? (
                            historial.map((linea, index) => (
                              <p
                                key={`${item.id}-fecha-${index}`}
                                className="break-words"
                              >
                                {linea.fecha || 'Sin fecha'}
                              </p>
                            ))
                          ) : (
                            <p>Sin fecha</p>
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt className="mb-1 text-xs font-semibold uppercase text-slate-400">
                          Creador
                        </dt>
                        <dd className="space-y-1 text-slate-700">
                          {historial.length > 0 ? (
                            historial.map((linea, index) => (
                              <p
                                key={`${item.id}-creador-${index}`}
                                className="break-words"
                              >
                                {linea.creador || 'Sin creador'}
                              </p>
                            ))
                          ) : (
                            <p>Sin creador</p>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </article>
                );
              })
            )}
          </div>

          {/* Tabla para escritorio */}
          <div className="hidden w-full min-w-0 overflow-x-auto p-6 pb-0 md:block">
            <table className="w-full min-w-[1100px] table-fixed border-separate border-spacing-y-4 text-left">
              <thead>
                <tr className={clasesColor}>
                  <th
                    scope="col"
                    className="w-[8%] rounded-tl-[24px] p-4 text-sm font-semibold uppercase"
                  >
                    ID
                  </th>

                  <th
                    scope="col"
                    className="w-[12%] p-4 text-center text-sm font-semibold uppercase"
                  >
                    Código SAP
                  </th>

                  <th
                    scope="col"
                    className="w-[12%] p-4 text-center text-sm font-semibold uppercase"
                  >
                    Estado
                  </th>

                  <th
                    scope="col"
                    className="w-[24%] p-4 text-sm font-semibold uppercase"
                  >
                    Descripción SAP
                  </th>

                  <th
                    scope="col"
                    className="w-[14%] p-4 text-sm font-semibold uppercase"
                  >
                    Fecha
                  </th>

                  <th
                    scope="col"
                    className="w-[20%] p-4 text-sm font-semibold uppercase"
                  >
                    Creador
                  </th>

                  <th
                    scope="col"
                    className="w-[10%] rounded-tr-[24px] p-3 text-center text-sm font-semibold uppercase"
                  >
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-10 text-center text-sm text-slate-500"
                    >
                      Cargando registros...
                    </td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-10 text-center text-sm text-slate-500"
                    >
                      No hay códigos finalizados.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((item) => {
                    const historial = formatHistoryRows(
                      item.r_sap_descomprimido
                    );

                    return (
                      <tr
                        key={item.id}
                        className="bg-white shadow-sm transition hover:bg-slate-50"
                      >
                        <td className="rounded-l-[20px] p-4 font-bold text-slate-900">
                          #{item.id}
                        </td>

                        <td className="break-words p-4 text-center">
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                            {item.codigo || 'S/N'}
                          </span>
                        </td>

                        <td className="p-4 text-center">
                          <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                            {item.status || 'Sin estado'}
                          </span>
                        </td>

                        <td
                          className="truncate p-4 font-medium text-slate-700"
                          title={item.descripcion_sap || 'Sin datos'}
                        >
                          {item.descripcion_sap || 'Sin datos'}
                        </td>

                        <td className="p-4 align-top text-slate-700">
                          <div className="space-y-1">
                            {historial.length > 0 ? (
                              historial.map((linea, index) => (
                                <p
                                  key={`${item.id}-fecha-${index}`}
                                  className="break-words text-sm"
                                >
                                  {linea.fecha || 'Sin fecha'}
                                </p>
                              ))
                            ) : (
                              <p className="text-sm">Sin fecha</p>
                            )}
                          </div>
                        </td>

                        <td className="p-4 align-top text-slate-700">
                          <div className="space-y-1">
                            {historial.length > 0 ? (
                              historial.map((linea, index) => (
                                <p
                                  key={`${item.id}-creador-${index}`}
                                  className="break-words text-sm"
                                >
                                  {linea.creador || 'Sin creador'}
                                </p>
                              ))
                            ) : (
                              <p className="text-sm">Sin creador</p>
                            )}
                          </div>
                        </td>

                        <td className="rounded-r-[20px] p-3 text-center">
                          {renderBotonVer(item)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginación */}
        {!loading && items.length > 0 && totalPages > 1 && (
          <div className="mt-4 flex w-full min-w-0 flex-col items-center justify-between gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4 shadow-sm lg:flex-row lg:p-6">
            <p className="text-center text-sm text-slate-600 lg:text-left">
              <span className="font-semibold text-slate-900">
                {items.length}
              </span>{' '}
              registros · Página{' '}
              <span className="font-semibold text-slate-900">
                {currentPage}
              </span>{' '}
              de {totalPages}
            </p>

            <nav
              aria-label="Paginación de códigos finalizados"
              className="flex max-w-full flex-wrap items-center justify-center gap-2"
            >
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) => Math.max(page - 1, 1))
                }
                disabled={currentPage <= 1}
                className={`rounded-lg px-3 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${clasesColor}`}
              >
                ← Anterior
              </button>

              <span
                aria-live="polite"
                className="text-sm font-semibold text-slate-700 sm:hidden"
              >
                {currentPage} / {totalPages}
              </span>

              <div className="hidden flex-wrap items-center justify-center gap-1 sm:flex">
                {paginasVisibles.map((page) => (
                  <button
                    type="button"
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    aria-label={`Ir a la página ${page}`}
                    aria-current={
                      page === currentPage ? 'page' : undefined
                    }
                    className={`min-w-[36px] rounded-lg px-3 py-2 text-sm transition ${
                      page === currentPage
                        ? `${clasesColor} font-semibold`
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.min(page + 1, totalPages)
                  )
                }
                disabled={currentPage >= totalPages}
                className={`rounded-lg px-3 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${clasesColor}`}
              >
                Siguiente →
              </button>
            </nav>
          </div>
        )}
      </main>

      <ToastContainer />
    </div>
  );
};

export default CodigosFinalizadosMaestro;