import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import PublicRoute from "./routes/PublicRoute";
import ProtectedRoute from "./routes/ProtectedRoute";
import storeAuth from "./context/storeAuth";

// Layouts
import Dashboard from "./layout/Dashboard";

// Pages
import Login from "./pages/Login";
import ItemForm from "./pages/ItemForm";
import TablaCodigos from "./pages/TablaCodigos"; 
import AdminUsuarios from "./pages/AdminUsuarios";
import AdminReportes from "./pages/AdminReportes";
import Insumos from "./pages/ItemForm";
import MisSolicitudes from "./pages/MisSolicitudes";

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
          <Route path="admin/reportes" element={<AdminReportes />} />
        </Route>

        {/* 🔹 Manejo de 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;