import CodigosEstadoPage from './CodigosEstadoPage';

const CodigosRechazadosCompras = () => (
  <CodigosEstadoPage
    title="Códigos Rechazados"
    subtitle="Registros devueltos desde Contabilidad para revisión de Compras"
    status="RetornoCompras"
    editRoute="/dashboard/compras/reenviar"
    colorConfig="bg-green-100 text-black shadow-sm"
    headerTitleClass="text-black"
    headerSubtitleClass="text-black/70"
    emptyMessage="No hay códigos rechazados para compras."
  />
);

export default CodigosRechazadosCompras;