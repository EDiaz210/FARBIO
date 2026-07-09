import { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { useTablaCodigos } from '../../hooks/useTablaCodigos';
import { CardMovil, TableRowEscritorio } from './TablaCodigos_Components';

const PHONE_FONT_LINK = 'https://fonts.googleapis.com/css2?family=Gowun+Batang&display=swap';
const CSV_HEADERS = ['ID', 'SAP Code', 'Descripción', 'Detalles', 'Status'];

const escapeCsvValue = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const createCsvContent = (items) => {
  const rows = items.map((item) => [
    item.id,
    item.codigo || '---',
    item.descripcionc || item.descripcion || item.descripcionSolicitante || 'Sin descripción',
    item.detalles || '',
    item.status || ''
  ].map(escapeCsvValue));

  return [CSV_HEADERS.join(','), ...rows.map((row) => row.join(','))].join('\n');
};

const downloadCsv = (content, fileName) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const CodigosEstadoPage = ({
  title,
  subtitle,
  status,
  editRoute,
  colorConfig, // Detectaremos el rol evaluando esta clase
  pageClassName = '',
  headerTitleClass = 'text-white',
  headerSubtitleClass = 'text-white/90',
  emptyMessage,
  exportable = false,
  exportLabel = 'Descargar CSV',
  exportFilePrefix = 'codigos',
  endpoint,
  showCommentButton = true
}) => {
  const [commentItem, setCommentItem] = useState(null);
  const {
    items,
    loading,
    currentPage,
    setCurrentPage,
    totalPages,
    currentItems,
    handleEdit,
    clasesColor
  } = useTablaCodigos('', status, editRoute, colorConfig, { endpoint });


  // Si el colorConfig incluye 'bg-green' asumimos que es Compras, de lo contrario es Solicitante
  const esCompras = colorConfig?.includes('bg-green') || colorConfig?.includes('emerald');
  
  const computedActionButtonClass = esCompras
    ? 'bg-green-100 text-black'
    : 'bg-gradient-to-r from-[#274C77] via-[#2F5D8A] to-[#1F3F5B] text-white';

  useEffect(() => {
    const link = document.createElement('link');
    link.href = PHONE_FONT_LINK;
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const handleExport = () => {
    if (items.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    try {
      downloadCsv(
        createCsvContent(items),
        `${exportFilePrefix}_${new Date().toISOString().split('T')[0]}.csv`
      );
      toast.success('Archivo generado exitosamente');
    } catch (error) {
      console.error('Error al exportar códigos:', error);
      toast.error('Error al generar el archivo');
    }
  };

  const handleOpenComment = (item) => {
    setCommentItem(item);
  };

  const handleCloseComment = () => {
    setCommentItem(null);
  };

  return (
    <div className={`min-h-full overflow-auto ${pageClassName}`} style={{ fontFamily: 'Gowun Batang, serif' }}>
      {/* Header */}
      <div className={`w-full ${colorConfig}`}>
        <div className="px-6 lg:px-8 py-4 lg:py-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className={`text-4xl font-bold ${headerTitleClass}`}>{title}</h1>
            <p className={`mt-1 text-sm ${headerSubtitleClass}`}>{subtitle}</p>
          </div>

          {exportable && (
            <button
              onClick={handleExport}
              disabled={items.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#17243D] shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              {exportLabel}
            </button>
          )}
        </div>
      </div>

      {/* Contenedor Principal de la Tabla / Tarjetas */}
      <div className="p-6">
        <div className="w-full overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
          
          {/* Vista Móvil */}
          <div className="block md:hidden divide-y divide-slate-100">
            {loading ? (
              <div className="p-10 text-center text-slate-500 text-sm">Cargando registros...</div>
            ) : currentItems.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-sm">{emptyMessage}</div>
            ) : (
              currentItems.map((item) => (
                <CardMovil
                  key={item.id}
                  item={item}
                  onEdit={handleEdit}
                  clasesColor={clasesColor}
                  onComment={handleOpenComment}
                  showCommentButton={showCommentButton}
                  actionButtonClass={computedActionButtonClass} 
                />
              ))
            )}
          </div>

          {/* Vista Escritorio */}
          <div className="hidden md:block w-full p-6 pb-0">
            <table className="w-full text-left border-separate border-spacing-y-4 layout-fixed">
              <thead>
                <tr className={`${clasesColor} border-b border-slate-200`}>
                  <th className="rounded-tl-[24px] p-5 text-sm font-semibold uppercase tracking-[0.08em] w-[8%]">ID</th>
                  <th className="p-5 text-center text-sm font-semibold uppercase tracking-[0.08em] w-[15%]">SAP Code</th>
                  <th className="p-5 text-sm font-semibold uppercase tracking-[0.08em] w-[35%]">Descripción</th>
                  <th className="p-5 text-sm font-semibold uppercase tracking-[0.08em] w-[22%]">Detalles</th>
                  <th className="p-5 text-center text-sm font-semibold uppercase tracking-[0.08em] w-[12%]">Status</th>
                  <th className="rounded-tr-[24px] p-5 text-center text-sm font-semibold uppercase tracking-[0.08em] w-[8%]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-10 text-center text-slate-500 text-sm">Cargando registros...</td></tr>
                ) : currentItems.length === 0 ? (
                  <tr><td colSpan={6} className="p-10 text-center text-slate-500 text-sm">{emptyMessage}</td></tr>
                ) : (
                  currentItems.map((item) => (
                    <TableRowEscritorio
                      key={item.id}
                      item={item}
                      onEdit={handleEdit}
                      clasesColor={clasesColor}
                      onComment={handleOpenComment}
                      showCommentButton={showCommentButton}
                      actionButtonClass={computedActionButtonClass} // <-- Pasado al hijo escritorio
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

        {/* Paginación */}
        {!loading && currentItems.length > 0 && totalPages > 1 && (
          <div className="p-4 sm:p-6 bg-slate-50 border border-slate-200 rounded-[24px] mt-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
            <div className="text-xs sm:text-sm text-slate-600 text-center sm:text-left">
              Mostrando <span className="font-semibold text-slate-900">{(currentPage - 1) * 5 + 1}</span> a{' '}
              <span className="font-semibold text-slate-900">{Math.min(currentPage * 5, currentItems.length)}</span> registros
            </div>

            <div className="flex flex-wrap justify-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 sm:px-4 py-2 ${clasesColor} rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm flex-1 sm:flex-none text-center`}
              >
                ← Anterior
              </button>

              <div className="hidden sm:flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                      page === currentPage ? `${clasesColor} font-semibold` : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-3 sm:px-4 py-2 ${clasesColor} rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm flex-1 sm:flex-none text-center`}
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Comentario */}
      {commentItem && showCommentButton && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={handleCloseComment}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Comentario</h2>
                <p className="text-sm text-slate-500">Código #{commentItem.id}</p>
              </div>
              <button onClick={handleCloseComment} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700" aria-label="Cerrar">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-5 py-4">
              <p className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm text-slate-700 border border-slate-200">
                {commentItem.comentario || 'Sin comentario registrado.'}
              </p>
            </div>
            <div className="flex justify-end px-5 pb-5">
              <button
                onClick={handleCloseComment}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition shadow-sm ${computedActionButtonClass}`}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default CodigosEstadoPage;