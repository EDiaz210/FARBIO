import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import PublicRoute from "./routes/PublicRoute";
import ProtectedRoute from "./routes/ProtectedRoute";
import storeAuth from "./context/storeAuth";

// Layouts
import Dashboard from "./layout/Dashboard";

// Pages
import Login from "./pages/Autenticación/Login";
import TablaCodigos from "./pages/Tabla/TablaCodigos"; 
import AdminUsuarios from "./pages/Administrador/AdminUsuarios";
import AdminReportes from "./pages/Reportes/AdminReportes";
import Insumos from "./pages/Articulo/ItemForm";
import MisSolicitudes from "./pages/Solicitudes/MisSolicitudes";
import CrearUsuarioPage from "./pages/Administrador/CrearUsuarioPage";

function App() {
  const token = storeAuth(state => state.token);

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
          {/* 🔹 Nueva Ruta para el Menú de Usuario */}
          <Route path="tablas" element={<TablaCodigos />} />
          {/* RUTA PARA CREAR (Formulario vacío) */}
          <Route path="insumos" element={<Insumos />} />

          {/* RUTA PARA EDITAR (Formulario con ID) */}
          <Route path="insumos/:id" element={<Insumos />} />

          <Route path="mis-solicitudes" element={<MisSolicitudes />} />

          {/* 🔹 Rutas para Administrador */}
          <Route path="admin/usuarios" element={<AdminUsuarios />} />
          <Route path="admin/usuarios/nuevo" element={<CrearUsuarioPage />} />
          <Route path="admin/reportes" element={<AdminReportes />} />
        </Route>

        {/* 🔹 Manejo de 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
