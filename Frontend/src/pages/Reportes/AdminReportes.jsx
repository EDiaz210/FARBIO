import { useEffect, useMemo, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import useFetch from '../../hooks/useFetch';
import storeAuth from '../../context/storeAuth';

const REPORTES_API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/users/usuarios`;
const CSV_HEADERS = ['ID', 'Nombre', 'Email', 'Rol', 'Fecha de Creación', 'Estado', 'Última Actividad'];

const PHONE_FONT_LINK = 'https://fonts.googleapis.com/css2?family=Gowun+Batang&display=swap';

const cardStyles = 'p-6 rounded-lg border-l-4 hover:shadow-lg transition';
const cardBg = { backgroundColor: '#dee2e6', borderColor: '#17243D' };
const tableCellStyle = { borderColor: '#dee2e6' };

const mapUsuarioToReporte = (usuario) => ({
  id: usuario.id,
  nombre: usuario.nombre,
  email: usuario.email,
  rol: usuario.rol,
  fecha_creacion: usuario.created_at,
  estado: 'Activo',
  ultima_actividad: new Date(usuario.created_at).toLocaleDateString()
});

const buildStats = (reportes) => {
  const totalUsuarios = reportes.length;

  const porRol = reportes.reduce(
    (acc, reporte) => {
      acc[reporte.rol] = (acc[reporte.rol] || 0) + 1;
      return acc;
    },
    {
      administrador: 0,
      solicitante: 0,
      compras: 0,
      contabilidad: 0,
      maestrodedatos: 0
    }
  );

  return {
    totalUsuarios,
    usuariosActivos: totalUsuarios,
    porRol,
    ultima24Horas: totalUsuarios > 0 ? 1 : 0
  };
};

const createCsvContent = (reportes) => {
  const rows = reportes.map((reporte) => [
    reporte.id,
    `"${reporte.nombre}"`,
    reporte.email,
    reporte.rol,
    reporte.fecha_creacion,
    reporte.estado,
    reporte.ultima_actividad
  ]);

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

const AdminReportes = () => {
  const { fetchDataBackend } = useFetch();
  const { token } = storeAuth();
  const [reportes, setReportes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const estadisticas = useMemo(() => buildStats(reportes), [reportes]);

  const obtenerReportes = async () => {
    setIsLoading(true);

    try {
      const response = await fetchDataBackend(REPORTES_API_URL, null, 'GET', token, false);

      if (response?.usuarios) {
        setReportes(response.usuarios.map(mapUsuarioToReporte));
      }
    } catch (error) {
      console.error('Error al obtener reportes:', error);
      toast.error('No se pudieron cargar los reportes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDescargarReporte = () => {
    if (reportes.length === 0) {
      toast.error('No hay datos para generar el reporte');
      return;
    }

    try {
      downloadCsv(
        createCsvContent(reportes),
        `reporte_usuarios_${new Date().toISOString().split('T')[0]}.csv`
      );
      toast.success('Reporte generado exitosamente');
    } catch (error) {
      console.error('Error al generar reporte:', error);
      toast.error('Error al generar el reporte');
    }
  };

  useEffect(() => {
    if (token) {
      obtenerReportes();
    }
  }, [token]);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = PHONE_FONT_LINK;
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <div className="w-full bg-white p-6 min-h-screen" style={{ fontFamily: 'Gowun Batang, serif' }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold" style={{ color: '#17243D' }}>Reportes y Estadísticas</h1>
          <p className="text-gray-600 mt-2">Gestiona y visualiza los reportes del sistema</p>
        </div>

        <button
          onClick={handleDescargarReporte}
          disabled={reportes.length === 0}
          className="text-white px-6 py-3 rounded-lg transition font-semibold flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#EF3340' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          Descargar Excel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className={cardStyles} style={cardBg}>
          <h3 className="font-semibold uppercase" style={{ color: '#17243D' }}>Total de Usuarios</h3>
          <p className="text-3xl font-bold mt-2" style={{ color: '#17243D' }}>{estadisticas.totalUsuarios}</p>
        </div>

        <div className={cardStyles} style={cardBg}>
          <h3 className="font-semibold uppercase" style={{ color: '#17243D' }}>Usuarios Activos</h3>
          <p className="text-3xl font-bold mt-2" style={{ color: '#17243D' }}>{estadisticas.usuariosActivos}</p>
        </div>

        <div className={cardStyles} style={cardBg}>
          <h3 className="font-semibold uppercase" style={{ color: '#17243D' }}>Últimas 24 Horas</h3>
          <p className="text-3xl font-bold mt-2" style={{ color: '#17243D' }}>{estadisticas.ultima24Horas}</p>
        </div>
      </div>

      <div className="p-6 rounded-lg mb-8 border" style={{ backgroundColor: '#f9f9f9', borderColor: '#dee2e6' }}>
        <h2 className="text-2xl font-bold mb-6" style={{ color: '#17243D' }}>Distribución por Rol</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Object.entries(estadisticas.porRol).map(([rol, cantidad]) => (
            <div key={rol} className="bg-white p-4 rounded-lg border" style={{ borderColor: '#dee2e6' }}>
              <p className="text-sm font-semibold" style={{ color: '#17243D' }}>{rol === 'maestrodedatos' ? 'Maestro de Datos' : rol.charAt(0).toUpperCase() + rol.slice(1)}</p>
              <p className="text-2xl font-bold mt-2" style={{ color: '#17243D' }}>{cantidad}</p>
              <div className="bg-gray-200 h-2 rounded mt-3">
                <div
                  className="h-2 rounded"
                  style={{ width: `${estadisticas.totalUsuarios > 0 ? (cantidad / estadisticas.totalUsuarios) * 100 : 0}%`, backgroundColor: rol === 'solicitante' || rol === 'contabilidad' ? '#EF3340' : '#17243D' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Cargando reportes...</div>
      ) : (
        <div className="overflow-x-auto">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#17243D' }}>Tabla de Progreso</h2>
          <table className="w-full border-collapse border" style={{ borderColor: '#dee2e6' }}>
            <thead style={{ backgroundColor: '#17243D' }}>
              <tr>
                {CSV_HEADERS.map((header) => (
                  <th key={header} className="border p-3 text-left text-white font-semibold" style={tableCellStyle}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportes.length > 0 ? (
                reportes.map((reporte) => (
                  <tr key={reporte.id} className="hover:bg-gray-50" style={{ backgroundColor: '#f9f9f9' }}>
                    {Object.values(reporte).map((value, index) => (
                      <td key={`${reporte.id}-${index}`} className="border p-3" style={tableCellStyle}>{value}</td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={CSV_HEADERS.length} className="text-center py-8 text-gray-500">No hay datos para mostrar</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default AdminReportes;
