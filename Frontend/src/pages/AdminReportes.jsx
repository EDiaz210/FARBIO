import { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import useFetch from '../hooks/useFetch';
import storeAuth from '../context/storeAuth';

const AdminReportes = () => {
  const { fetchDataBackend } = useFetch();
  const { token } = storeAuth();
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Obtener datos para reportes
  const obtenerReportes = async () => {
    setCargando(true);
    try {
      const url = `${import.meta.env.VITE_BACKEND_URL}/api/users/usuarios`;
      const response = await fetchDataBackend(url, null, 'GET', token, false);
      if (response?.usuarios) {
        // Procesar datos para reportes
        const datosReportes = response.usuarios.map((usuario) => ({
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          fecha_creacion: usuario.created_at,
          estado: 'Activo',
          ultima_actividad: new Date(usuario.created_at).toLocaleDateString()
        }));
        setReportes(datosReportes);
      }
    } catch (error) {
      console.error('Error al obtener reportes:', error);
    } finally {
      setCargando(false);
    }
  };

  // Generar Excel
  const generarExcel = () => {
    if (reportes.length === 0) {
      toast.error('No hay datos para generar el reporte');
      return;
    }

    try {
      // Crear contenido CSV
      const headers = ['ID', 'Nombre', 'Email', 'Rol', 'Fecha de Creación', 'Estado', 'Última Actividad'];
      const csvContent = [
        headers.join(','),
        ...reportes.map(r =>
          [
            r.id,
            `"${r.nombre}"`,
            r.email,
            r.rol,
            r.fecha_creacion,
            r.estado,
            r.ultima_actividad
          ].join(',')
        )
      ].join('\n');

      // Crear blob y descargar
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `reporte_usuarios_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Reporte generado exitosamente');
    } catch (error) {
      console.error('Error al generar reporte:', error);
      toast.error('Error al generar el reporte');
    }
  };

  // Generar Excel con librería (si se instala xlsx)
  const generarExcelAvanzado = () => {
    if (reportes.length === 0) {
      alert('No hay datos para generar el reporte');
      return;
    }

    // Para futuro: usar librería xlsx
    // Para ahora, usar CSV simple
    generarExcel();
  };

  useEffect(() => {
    obtenerReportes();
  }, []);

  useEffect(() => {
    const link = document.createElement("link");
    link.href="https://fonts.googleapis.com/css2?family=Gowun+Batang&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Calcular estadísticas
  const estadisticas = {
    totalUsuarios: reportes.length,
    usuariosActivos: reportes.filter(r => r.estado === 'Activo').length,
    porRol: {
      administrador: reportes.filter(r => r.rol === 'administrador').length,
      solicitante: reportes.filter(r => r.rol === 'solicitante').length,
      compras: reportes.filter(r => r.rol === 'compras').length,
      contabilidad: reportes.filter(r => r.rol === 'contabilidad').length,
      maestrodedatos: reportes.filter(r => r.rol === 'maestrodedatos').length
    }
  };

  return (
    <div className="w-full bg-white p-6 min-h-screen" style={{ fontFamily: 'Gowun Batang, serif' }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold" style={{ color: '#17243D' }}>Reportes y Estadísticas</h1>
          <p className="text-gray-600 mt-2">Gestiona y visualiza los reportes del sistema</p>
        </div>
        <button
          onClick={generarExcelAvanzado}
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

      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-6 rounded-lg border-l-4 hover:shadow-lg transition" style={{ backgroundColor: '#dee2e6', borderColor: '#17243D' }}>
          <h3 className="font-semibold uppercase" style={{ color: '#17243D' }}>Total de Usuarios</h3>
          <p className="text-3xl font-bold mt-2" style={{ color: '#17243D' }}>{estadisticas.totalUsuarios}</p>
        </div>
        <div className="p-6 rounded-lg border-l-4 hover:shadow-lg transition" style={{ backgroundColor: '#dee2e6', borderColor: '#17243D' }}>
          <h3 className="font-semibold uppercase" style={{ color: '#17243D' }}>Usuarios Activos</h3>
          <p className="text-3xl font-bold mt-2" style={{ color: '#17243D' }}>{estadisticas.usuariosActivos}</p>
        </div>
        <div className="p-6 rounded-lg border-l-4 hover:shadow-lg transition" style={{ backgroundColor: '#dee2e6', borderColor: '#17243D' }}>
          <h3 className="font-semibold uppercase" style={{ color: '#17243D' }}>Últimas 24 Horas</h3>
          <p className="text-3xl font-bold mt-2" style={{ color: '#17243D' }}>{reportes.length > 0 ? 1 : 0}</p>
        </div>
      </div>

      {/* Distribución por Rol */}
      <div className="p-6 rounded-lg mb-8 border" style={{ backgroundColor: '#f9f9f9', borderColor: '#dee2e6' }}>
        <h2 className="text-2xl font-bold mb-6" style={{ color: '#17243D' }}>Distribución por Rol</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border" style={{ borderColor: '#dee2e6' }}>
            <p className="text-sm font-semibold" style={{ color: '#17243D' }}>Administrador</p>
            <p className="text-2xl font-bold mt-2" style={{ color: '#17243D' }}>{estadisticas.porRol.administrador}</p>
            <div className="bg-gray-200 h-2 rounded mt-3">
              <div
                className="h-2 rounded"
                style={{ width: `${estadisticas.totalUsuarios > 0 ? (estadisticas.porRol.administrador / estadisticas.totalUsuarios * 100) : 0}%`, backgroundColor: '#17243D' }}
              ></div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border" style={{ borderColor: '#dee2e6' }}>
            <p className="text-sm font-semibold" style={{ color: '#17243D' }}>Solicitante</p>
            <p className="text-2xl font-bold mt-2" style={{ color: '#17243D' }}>{estadisticas.porRol.solicitante}</p>
            <div className="bg-gray-200 h-2 rounded mt-3">
              <div
                className="h-2 rounded"
                style={{ width: `${estadisticas.totalUsuarios > 0 ? (estadisticas.porRol.solicitante / estadisticas.totalUsuarios * 100) : 0}%`, backgroundColor: '#EF3340' }}
              ></div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border" style={{ borderColor: '#dee2e6' }}>
            <p className="text-sm font-semibold" style={{ color: '#17243D' }}>Compras</p>
            <p className="text-2xl font-bold mt-2" style={{ color: '#17243D' }}>{estadisticas.porRol.compras}</p>
            <div className="bg-gray-200 h-2 rounded mt-3">
              <div
                className="h-2 rounded"
                style={{ width: `${estadisticas.totalUsuarios > 0 ? (estadisticas.porRol.compras / estadisticas.totalUsuarios * 100) : 0}%`, backgroundColor: '#17243D' }}
              ></div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border" style={{ borderColor: '#dee2e6' }}>
            <p className="text-sm font-semibold" style={{ color: '#17243D' }}>Contabilidad</p>
            <p className="text-2xl font-bold mt-2" style={{ color: '#17243D' }}>{estadisticas.porRol.contabilidad}</p>
            <div className="bg-gray-200 h-2 rounded mt-3">
              <div
                className="h-2 rounded"
                style={{ width: `${estadisticas.totalUsuarios > 0 ? (estadisticas.porRol.contabilidad / estadisticas.totalUsuarios * 100) : 0}%`, backgroundColor: '#EF3340' }}
              ></div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border" style={{ borderColor: '#dee2e6' }}>
            <p className="text-sm font-semibold" style={{ color: '#17243D' }}>Maestro de Datos</p>
            <p className="text-2xl font-bold mt-2" style={{ color: '#17243D' }}>{estadisticas.porRol.maestrodedatos}</p>
            <div className="bg-gray-200 h-2 rounded mt-3">
              <div
                className="h-2 rounded"
                style={{ width: `${estadisticas.totalUsuarios > 0 ? (estadisticas.porRol.maestrodedatos / estadisticas.totalUsuarios * 100) : 0}%`, backgroundColor: '#17243D' }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Progreso */}
      {cargando ? (
        <div className="text-center py-8">Cargando reportes...</div>
      ) : (
        <div className="overflow-x-auto">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#17243D' }}>Tabla de Progreso</h2>
          <table className="w-full border-collapse border" style={{ borderColor: '#dee2e6' }}>
            <thead style={{ backgroundColor: '#17243D' }}>
              <tr>
                <th className="border p-3 text-left text-white font-semibold" style={{ borderColor: '#dee2e6' }}>ID</th>
                <th className="border p-3 text-left text-white font-semibold" style={{ borderColor: '#dee2e6' }}>Nombre</th>
                <th className="border p-3 text-left text-white font-semibold" style={{ borderColor: '#dee2e6' }}>Email</th>
                <th className="border p-3 text-left text-white font-semibold" style={{ borderColor: '#dee2e6' }}>Rol</th>
                <th className="border p-3 text-left text-white font-semibold" style={{ borderColor: '#dee2e6' }}>Fecha de Creación</th>
                <th className="border p-3 text-left text-white font-semibold" style={{ borderColor: '#dee2e6' }}>Estado</th>
                <th className="border p-3 text-left text-white font-semibold" style={{ borderColor: '#dee2e6' }}>Última Actividad</th>
              </tr>
            </thead>
            <tbody>
              {reportes.length > 0 ? (
                reportes.map((reporte) => (
                  <tr key={reporte.id} className="hover:bg-gray-50" style={{ backgroundColor: '#f9f9f9' }}>
                    <td className="border p-3" style={{ borderColor: '#dee2e6' }}>{reporte.id}</td>
                    <td className="border p-3" style={{ borderColor: '#dee2e6' }}>{reporte.nombre}</td>
                    <td className="border p-3" style={{ borderColor: '#dee2e6' }}>{reporte.email}</td>
                    <td className="border p-3" style={{ borderColor: '#dee2e6' }}>
                      <span className="px-3 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: '#dee2e6', color: '#17243D' }}>
                        {reporte.rol}
                      </span>
                    </td>
                    <td className="border p-3" style={{ borderColor: '#dee2e6' }}>{reporte.fecha_creacion}</td>
                    <td className="border p-3" style={{ borderColor: '#dee2e6' }}>
                      <span className="px-3 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: '#dee2e6', color: '#17243D' }}>
                        {reporte.estado}
                      </span>
                    </td>
                    <td className="border p-3" style={{ borderColor: '#dee2e6' }}>{reporte.ultima_actividad}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500">
                    No hay datos para mostrar
                  </td>
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
