import React, { useState } from 'react';

// 📱 Componente Tarjeta Móvil (Estilo Acordeón)
export const CardMovil = ({ 
  item, 
  onEdit, 
  clasesColor, 
  onReturn, 
  showReturnButton = false, 
  onComment, 
  showCommentButton = false,
  actionButtonClass = 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-none p-4 bg-white transition-colors">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-6 h-6 rounded-full ${clasesColor} flex items-center justify-center transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block">#{item.id}</span>
            <span className="font-medium text-slate-800 text-sm line-clamp-1">{item.descripcion}</span>
          </div>
        </div>
        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
          {item.codigo || 'S/N'}
        </span>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t  border-slate-100  p-4 rounded-xl space-y-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Detalles:</span>
            <p className="text-sm text-slate-700">{item.detalles || 'Sin detalles adicionales'}</p>
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Status:</span>
              <span className="text-xs font-medium capitalize bg-white border border-slate-200 px-2.5 py-1 rounded-full text-slate-700 shadow-sm">
                {item.status}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {showCommentButton && onComment && (
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onComment(item);
                  }}
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl transition shadow-sm ${actionButtonClass}`}
                  title="Ver comentario"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              )}
              {showReturnButton && onReturn && (
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onReturn(item.id);
                  }}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-red-600 text-white transition hover:bg-red-700 shadow-sm"
                  title="Devolver código"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h11a4 4 0 014 4v1" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 6l-4 4 4 4" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => onEdit(item.id)}
                className={`inline-flex h-11 px-4 items-center gap-2 rounded-xl ${clasesColor} transition hover:opacity-90 shadow-sm text-sm font-medium`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Ver registro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 💻 Componente Fila de Tabla Escritorio
export const TableRowEscritorio = ({ 
  item, 
  onEdit, 
  clasesColor, 
  onReturn, 
  showReturnButton = false, 
  onComment, 
  showCommentButton = false,
  actionButtonClass = 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
}) => (
  <tr className="transition-all duration-200 hover:-translate-y-0.5 group">
    <td className="rounded-l-[20px] bg-white shadow-sm group-hover:shadow-md p-5 font-bold text-slate-900 transition-all">
      #{item.id}
    </td>
    
    <td className="bg-white shadow-sm group-hover:shadow-md p-5 text-center transition-all">
      <span className="px-2 py-1 rounded-full text-xs font-semibold uppercase bg-slate-100 text-slate-700">
        {item.codigo || 'S/N'}
      </span>
    </td>
    
    <td className="bg-white shadow-sm group-hover:shadow-md p-5 text-slate-700 font-medium truncate max-w-0 transition-all">
      {item.descripcion}
    </td>
    
    <td className="bg-white shadow-sm group-hover:shadow-md p-5 text-slate-500 truncate max-w-0 transition-all">
      {item.detalles}
    </td>
    
    <td className="bg-white shadow-sm group-hover:shadow-md p-5 text-center transition-all">
      <span className="text-sm font-medium capitalize bg-slate-100 px-3 py-1 rounded-full text-slate-700">
        {item.status}
      </span>
    </td>
    
    <td className="rounded-r-[20px] bg-white shadow-sm group-hover:shadow-md p-5 text-center transition-all">
      <div className="flex items-center justify-center gap-2">
        {showCommentButton && onComment && (
          <button
            onClick={() => onComment(item)}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition ${actionButtonClass}`}
            title="Ver comentario"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}
        {showReturnButton && onReturn && (
          <button
            onClick={() => onReturn(item.id)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white transition hover:bg-red-700"
            title="Devolver código"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h11a4 4 0 014 4v1" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 6l-4 4 4 4" />
            </svg>
          </button>
        )}
        <button
          onClick={() => onEdit(item.id)}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${clasesColor} transition hover:opacity-80`}
          title="Editar registro"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      </div>
    </td>
  </tr>
);
