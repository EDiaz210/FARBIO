import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import PublicRoute from "./routes/PublicRoute";
import ProtectedRoute from "./routes/ProtectedRoute";
import PrivateRouteWithRole from "./routes/PrivateRouteWithRole";
import storeAuth from "./context/storeAuth";
import { getAuthClaims } from "./utils/authClaims";

// Layouts
import Dashboard from "./layout/Dashboard";

// Pages
import Login from "./pages/Autenticación/Login";
import TablaCodigos from "./pages/Tabla/TablaCodigos"; 
import CodigosRechazadosCompras from "./pages/Tabla/CodigosRechazadosCompras";
import CodigosRechazadosSolicitante from "./pages/Tabla/CodigosRechazadosSolicitante";
import CodigosFinalizadosMaestro from "./pages/Tabla/CodigosFinalizadosMaestro";
import AdminUsuarios from "./pages/Administrador/AdminUsuarios";
import AdminReportes from "./pages/Reportes/AdminReportes";
import MisSolicitudes from "./pages/Solicitudes/MisSolicitudes";
import CrearUsuarioPage from "./pages/Administrador/CrearUsuarioPage";
import EditarUsuario from "./pages/Administrador/EditarUsuario";

// Componentes por Rol
import SolicitanteCrearCodigo from "./pages/Articulo/SolicitanteCrearCodigo";
import SolicitanteEditarCodigo from "./pages/Articulo/SolicitanteEditarCodigo";
import ComprasEditarCodigo from "./pages/Articulo/ComprasEditarCodigo";
import ContabilidadEditarCodigo from "./pages/Articulo/ContabilidadEditarCodigo";
import MaestroDatosEditarCodigo from "./pages/Articulo/MaestroDatosEditarCodigo";

// 🔹 Componente para manejar el Home inteligente del Dashboard
const DashboardHomeRedirect = () => {
  const token = storeAuth(state => state.token);
  const claims = getAuthClaims(token);
  const userRole = claims?.rol?.toLowerCase() || '';

  // Si es administrador, su principal es la gestión de usuarios
  if (userRole.includes('administrador')) {
    return <Navigate to="admin/usuarios" replace />;
  }
  
  // Para los roles operativos (contabilidad, compras, maestrodedatos, solicitante)
  return <Navigate to="tablas" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 🔹 Redirigir raíz a login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 🔹 Rutas públicas */}
        <Route element={<PublicRoute />}>
          <Route path="login" element={<Login />} />
        </Route>

        {/* 🔹 Rutas protegidas (Dashboard Layout) */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          {/* 🔹 Redirección inteligente cuando entren directo a /dashboard */}
          <Route index element={<DashboardHomeRedirect />} />

          {/* 🔹 Vista común para roles operativos */}
          <Route path="tablas" element={<TablaCodigos />} />

          <Route
            path="compras/rechazados"
            element={
              <PrivateRouteWithRole allowedRoles={["compras"]}>
                <CodigosRechazadosCompras />
              </PrivateRouteWithRole>
            }
          />

          <Route
            path="solicitante/rechazados"
            element={
              <PrivateRouteWithRole allowedRoles={["solicitante"]}>
                <CodigosRechazadosSolicitante />
              </PrivateRouteWithRole>
            }
          />

          <Route
            path="maestro/finalizados"
            element={
              <PrivateRouteWithRole allowedRoles={["maestrodedatos"]}>
                <CodigosFinalizadosMaestro />
              </PrivateRouteWithRole>
            }
          />
          
          {/* 🔹 Rutas de Creación/Edición por Rol */}
          {/* Solicitante: Crear Código */}
          <Route
            path="insumos"
            element={
              <PrivateRouteWithRole allowedRoles={["solicitante"]}>
                <SolicitanteCrearCodigo />
              </PrivateRouteWithRole>
            }
          />

          {/* Solicitante: Editar Código */}
          <Route
            path="insumos/editar/:id"
            element={
              <PrivateRouteWithRole allowedRoles={["solicitante"]}>
                <SolicitanteEditarCodigo />
              </PrivateRouteWithRole>
            }
          />

          {/* Compras: Editar Código */}
          <Route
            path="compras/editar/:id"
            element={
              <PrivateRouteWithRole allowedRoles={["compras"]}>
                <ComprasEditarCodigo />
              </PrivateRouteWithRole>
            }
          />

          {/* Contabilidad: Editar Código */}
          <Route
            path="contabilidad/editar/:id"
            element={
              <PrivateRouteWithRole allowedRoles={["contabilidad"]}>
                <ContabilidadEditarCodigo />
              </PrivateRouteWithRole>
            }
          />

          {/* Maestro de Datos: Editar Código */}
          <Route
            path="maestro/editar/:id"
            element={
              <PrivateRouteWithRole allowedRoles={["maestrodedatos"]}>
                <MaestroDatosEditarCodigo />
              </PrivateRouteWithRole>
            }
          />

          <Route path="mis-solicitudes" element={<MisSolicitudes />} />

          {/* 🔹 Rutas para Administrador */}
          <Route path="admin/usuarios" element={<AdminUsuarios />} />
          <Route path="admin/usuarios/nuevo" element={<CrearUsuarioPage />} />
          <Route path="admin/usuarios/editar/:id" element={<EditarUsuario />} />
          <Route path="admin/reportes" element={<AdminReportes />} />
        </Route>

        {/* 🔹 Manejo de 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;