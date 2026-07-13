import { useState } from 'react';
import { useTablaCodigos } from '../../hooks/useTablaCodigos';
import { CardMovil, TableRowEscritorio } from './TablaCodigos_Components';
import DevolucionCompras from '../Devoluciones/DevolucionCompras';

const ComprasTablaCodigos = () => {
  const colorConfig = "bg-green-100 text-black";
  
  const {
    loading,
    currentPage,
    setCurrentPage,
    totalPages,
    currentItems,
    handleEdit,
    clasesColor,
    refreshItems
  } = useTablaCodigos(
    'compras',
    'nuevo',
    '/dashboard/compras/editar',
    colorConfig
  );

  const [isDevolucionOpen, setIsDevolucionOpen] = useState(false);
  const [codigoSeleccionado, setCodigoSeleccionado] = useState(null);

  const handleOpenReturn = (id) => {
    setCodigoSeleccionado(id);
    setIsDevolucionOpen(true);
  };

  const handleCloseReturn = () => {
    setIsDevolucionOpen(false);
    setCodigoSeleccionado(null);
  };

  const handleAfterSuccessReturn = async () => {
    await refreshItems();
  };

  const renderTableHeader = () => (
    <tr className={`${clasesColor} border-4 border-slate-200`}>
      <th className="rounded-tl-[24px] p-5 text-sm font-semibold uppercase tracking-[0.08em] w-[8%]">ID</th>
      <th className="p-5 text-center text-sm font-semibold uppercase tracking-[0.08em] w-[15%]">SAP Code</th>
      <th className="p-5 text-sm font-semibold uppercase tracking-[0.08em] w-[35%]">Descripción</th>
      <th className="p-5 text-sm font-semibold uppercase tracking-[0.08em] w-[22%]">Detalles</th>
      <th className="p-5 text-center text-sm font-semibold uppercase tracking-[0.08em] w-[12%]">Status</th>
      <th className="rounded-tr-[24px] p-5 text-center text-sm font-semibold uppercase tracking-[0.08em] w-[8%]">Acciones</th>
    </tr>
  );

  return (
    <div className="min-h-full overflow-y-auto" style={{ fontFamily: 'Gowun Batang, serif' }}>
      {/* Banner Superior */}
      <div className="w-full bg-green-100">
        <div className="px-6 lg:px-8 py-4 lg:py-5">
          <h1 className="text-4xl font-bold text-black">Bandeja de Compras</h1>
          <p className="text-sm text-black-700 mt-1">Códigos pendientes para revisar datos de compra</p>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="p-6">

        {/* Tarjeta Blanca Contenedora */}
        <div className="w-full overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm shadow-slate-200/60 ">
          
          {/* VERSIÓN MÓVIL */}
          <div className="block md:hidden divide-y divide-slate-100">
            {loading ? (
              <div className="p-10 text-center text-slate-500 text-sm">Cargando registros...</div>
            ) : currentItems.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-sm">No hay códigos pendientes para compras.</div>
            ) : (
              currentItems.map((item) => (
                <CardMovil key={item.id} item={item} onEdit={handleEdit} clasesColor={clasesColor} onReturn={handleOpenReturn} showReturnButton={true} />
              ))
            )}
          </div>
        

          {/* VERSIÓN ESCRITORIO (Ajuste definitivo para encajar al 100%) */}
          <div className="hidden md:block w-full  p-7" >
            <table className="w-full  text-left border-separate border-spacing-y-2">
              <thead>
                {renderTableHeader()}
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-10 text-center text-slate-500 text-sm">Cargando registros...</td></tr>
                ) : currentItems.length === 0 ? (
                  <tr><td colSpan={6} className="p-10 text-center text-slate-500 text-sm">No hay códigos pendientes para compras.</td></tr>
                ) : (
                  currentItems.map((item) => (
                    <TableRowEscritorio key={item.id} item={item} onEdit={handleEdit} clasesColor={clasesColor} onReturn={handleOpenReturn} showReturnButton={true} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <DevolucionCompras
          isOpen={isDevolucionOpen}
          onClose={handleCloseReturn}
          codigoId={codigoSeleccionado}
          onSuccess={handleAfterSuccessReturn}
        />

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

export default ComprasTablaCodigos;
