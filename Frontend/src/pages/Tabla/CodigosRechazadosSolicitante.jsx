import CodigosEstadoPage from './CodigosEstadoPage';

const CodigosRechazadosSolicitante = () => (
  <CodigosEstadoPage
    title="Códigos Rechazados"
    subtitle="Registros devueltos a Solicitante para corrección"
    status="RetornoSolicitante"
    editRoute="/dashboard/insumos/editar"
    colorConfig="bg-gradient-to-r from-[#274C77] via-[#2F5D8A] to-[#1F3F5B] text-white shadow-sm"
    emptyMessage="No hay códigos rechazados para solicitante."
    showCommentButton
  />
);

export default CodigosRechazadosSolicitante;