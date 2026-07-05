import { useTablaCodigos } from '../../hooks/useTablaCodigos';
import { CardMovil, TableRowEscritorio } from './TablaCodigos_Components';

const SolicitanteTablaCodigos = () => {
  const colorConfig = "bg-gradient-to-r from-[#274C77] via-[#2F5D8A] to-[#1F3F5B] text-white shadow-sm";
  
  const {
    loading,
    currentPage,
    setCurrentPage,
    totalPages,
    currentItems,
    handleEdit,
    clasesColor
  } = useTablaCodigos(
    'solicitante',
    'nuevo',
    '/dashboard/insumos/editar',
    colorConfig
  );

  const renderTableHeader = () => (
    <tr className={`${clasesColor} border-b border-slate-200`}>
      <th className="rounded-tl-[24px] p-5 text-sm font-semibold uppercase tracking-[0.08em] w-[8%]">ID</th>
      <th className="p-5 text-center text-sm font-semibold uppercase tracking-[0.08em] w-[15%]">SAP Code</th>
      <th className="p-5 text-sm font-semibold uppercase tracking-[0.08em] w-[35%]">Descripción</th>
      <th className="p-5 text-sm font-semibold uppercase tracking-[0.08em] w-[22%]">Detalles</th>
      <th className="p-5 text-center text-sm font-semibold uppercase tracking-[0.08em] w-[12%]">Status</th>
      <th className="rounded-tr-[24px] p-5 text-center text-sm font-semibold uppercase tracking-[0.08em] w-[8%]">Acciones</th>
    </tr>
  );

  return (
    <div className="py-8 min-h-screen font-sans" style={{ fontFamily: 'Gowun Batang, serif' }}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900">Mis Solicitudes de Códigos</h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2">Gestiona tus códigos de insumos solicitados</p>
        </div>

        {/* Contenedor principal */}
        <div className="w-full overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
          
          {/* 📱 VERSIÓN MÓVIL */}
          <div className="block md:hidden divide-y divide-slate-100">
            {loading ? (
              <div className="p-10 text-center text-slate-500 text-sm">Cargando registros...</div>
            ) : currentItems.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-sm">No hay solicitudes pendientes.</div>
            ) : (
              currentItems.map((item) => (
                <CardMovil key={item.id} item={item} onEdit={handleEdit} clasesColor={clasesColor} />
              ))
            )}
          </div>

          {/* 💻 VERSIÓN ESCRITORIO */}
          <div className="hidden md:block w-full p-6 pb-0">
            <table className="w-full text-left border-separate border-spacing-y-4 layout-fixed">
              <thead>
                {renderTableHeader()}
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-10 text-center text-slate-500 text-sm">Cargando registros...</td></tr>
                ) : currentItems.length === 0 ? (
                  <tr><td colSpan={6} className="p-10 text-center text-slate-500 text-sm">No hay solicitudes pendientes.</td></tr>
                ) : (
                  currentItems.map((item) => (
                    <TableRowEscritorio key={item.id} item={item} onEdit={handleEdit} clasesColor={clasesColor} />
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
    </div>
  );
};

export default SolicitanteTablaCodigos;
