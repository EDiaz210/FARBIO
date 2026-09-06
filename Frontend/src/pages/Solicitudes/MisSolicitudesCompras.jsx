import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useFetch from '../../hooks/useFetch';
import storeAuth from '../../context/storeAuth';

const DetailField = ({ label, value, large = false }) => (
  <div className="space-y-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
    <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">{label}</p>
    {large ? (
      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{value || 'Sin información'}</p>
    ) : (
      <p className="break-words text-sm text-slate-700">{value || 'Sin información'}</p>
    )}
  </div>
);

const MisSolicitudesCompras = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = storeAuth();
  const { fetchDataBackend } = useFetch();
  const [codigo, setCodigo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarCodigo = async () => {
      if (!id || !token) return;

      setLoading(true);
      try {
        const response = await fetchDataBackend(
          `${import.meta.env.VITE_BACKEND_URL}/api/codigos/${id}`,
          null,
          'GET',
          token,
          false
        );
        setCodigo(response?.codigo || null);
      } catch (error) {
        console.error('Error cargando el código enviado:', error);
        setCodigo(null);
      } finally {
        setLoading(false);
      }
    };

    cargarCodigo();
  }, [fetchDataBackend, id, token]);

  if (loading) {
    return <div className="flex min-h-full items-center justify-center text-slate-500">Cargando información...</div>;
  }

  if (!codigo) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-slate-600">No se encontró la información del código.</p>
        <button type="button" onClick={() => navigate('/dashboard/mis-codigos-compras')} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white">Volver</button>
      </div>
    );
  }

  const referenceLink = codigo.link_referencia;
  const responsable = codigo.responsable_compras || codigo.compras_responsable_id;

  return (
    <div className="min-h-full overflow-auto" style={{ fontFamily: 'Gowun Batang, serif' }}>
      <div className="w-full bg-green-100">
        <div className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-800">Mis códigos</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-950 lg:text-4xl">Código #{codigo.id}</h1>
            <p className="mt-1 text-sm text-slate-700">Información del solicitante y datos enviados por Compras</p>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between bg-slate-200 px-6 py-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Datos de origen</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">Información del código</h2>
            </div>
            <span className="rounded-full bg-green-100 px-3 py-1.5 text-sm font-semibold text-green-800">{codigo.status || 'Sin estado'}</span>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2 md:p-6">
            <DetailField label="ID" value={`#${codigo.id}`} />
            <DetailField label="Código SAP" value={codigo.codigo} />
            <DetailField label="Solicitante" value={codigo.nombre_solicitante} />
            <DetailField label="Área solicitante" value={codigo.requestor_area} />
            <DetailField label="Empresa" value={codigo.empresa} />
            <DetailField label="Responsable de Compras" value={responsable} />
            <div className="md:col-span-2"><DetailField label="Descripción del solicitante" value={codigo.descripcion} large /></div>
            <div className="md:col-span-2"><DetailField label="Detalles del solicitante" value={codigo.detalles} large /></div>
            <div className="md:col-span-2"><DetailField label="Link de referencia" value={referenceLink ? <a href={referenceLink} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">{referenceLink}</a> : null} /></div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-green-700 bg-green-600 px-6 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-green-100">Gestión de la etapa</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Información enviada por Compras</h2>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2 md:p-6">
            <DetailField label="Descripción SAP" value={codigo.descripcion_sap} />
            <DetailField label="Unidad de medida" value={codigo.unidad_medida} />
            <DetailField label="Grava IVA" value={codigo.grava_iva} />
            <DetailField label="Cantidad mínima de pedido" value={codigo.cantidad_minima_pedido} />
            <DetailField label="Lead Time (días)" value={codigo.lead_time} />
            <DetailField label="Días de tolerancia" value={codigo.dias_tolerancia} />
          </div>
        </section>

        <button type="button" onClick={() => navigate('/dashboard/mis-codigos-compras')} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Volver a Mis códigos
        </button>
      </div>
    </div>
  );
};

export default MisSolicitudesCompras;
