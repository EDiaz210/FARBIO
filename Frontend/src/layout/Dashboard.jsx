import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import storeAuth from "../context/storeAuth";
import useFetch from "../hooks/useFetch";
import { getAuthClaims } from "../utils/authClaims";

// Importación de activos
import userIcon from "../assets/user.png";
import quejasIcon from "../assets/quejas.png";
import QaI from "../assets/asistente-ai.png";
import iaIcon from "../assets/ia.png";
import personasIcon from "../assets/personas.png";
import formulariosIcon from "../assets/formularios.png";
import mensajeroIcon from "../assets/mensajero.png";
import hamburguesaIcon from "../assets/hamburgesa.png";

// Asegúrate de tener estos iconos o cámbialos por los correctos
// import insumosIcon from "../assets/insumos.png"; 
// import tableIcon from "../assets/table.png";

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const urlActual = location.pathname;
  const { logout, token } = storeAuth();
  const { fetchDataBackend } = useFetch();
  const [cargandoUsuario, setCargandoUsuario] = useState(false);
  const [perfilUsuario, setPerfilUsuario] = useState(null);

  const claims = getAuthClaims(token);
  const userRole = claims?.rol;

  // Estado para el sidebar
  const [isCollapsed, setIsCollapsed] = useState(false); // Recomendado empezar expandido en desktop
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const esAdministrador = userRole === "administrador";
  const esSolicitante = userRole.toLowerCase().includes("solicitante");

  // Cargar datos del perfil solo para mostrar nombre/avatar en la UI
  useEffect(() => {
    const cargarDatosUsuario = async () => {
      if (!token) {
        setPerfilUsuario(null);
        return;
      }

      setCargandoUsuario(true);
      try {
        const url = `${import.meta.env.VITE_BACKEND_URL}/api/users/mi-perfil`;
        const response = await fetchDataBackend(url, null, "GET", token, false);
        if (response?.usuario) {
          setPerfilUsuario(response.usuario);
        }
      } catch (error) {
        console.error("Error al cargar perfil de usuario:", error);
      } finally {
        setCargandoUsuario(false);
      }
    };
    cargarDatosUsuario();
  }, [token, fetchDataBackend]);

  // Manejo de Logout
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const handleMenuItemClick = () => setMobileMenuOpen(false);

  function getHDImage(url) {
    if (!url) return url;
    if (url.includes("googleusercontent.com") || url.includes("gstatic.com")) {
      return url.replace(/=s\d+/, "=s1024");
    }
    return url;
  }

  // Carga de fuente externa
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Gowun+Batang&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

    const bgColorsByRole = {
        solicitante: "from-[#B2EBF2] via-slate-100 to-[#B2EBF2]",            // Celeste
        compras: "from-green-50 via-slate-100 to-green-100",              // Verde
        contabilidad: "from-yellow-50 via-slate-50 to-yellow-100",        // Amarillo
        maestrodedatos: "from-blue-300 via-slate-100 to-blue-300",   // Azul
        administrador: "from-slate-50 via-slate-50 to-slate-50",         // Gris claro
        };

    
    const activeColorsByRole = {
      solicitante: "bg-[#B2EBF2] text-black",
      compras: "bg-green-100 text-green-800",
      contabilidad: "bg-yellow-100 text-yellow-800",
      maestrodedatos: "bg-blue-100 text-blue-800",
      administrador: "bg-zinc-200 text-zinc-800",
    };

    const currentBg = bgColorsByRole[userRole] || bgColorsByRole.user;

  return (
    <div className="flex h-screen font-sans flex-col md:flex-row bg-gray-50" style={{ fontFamily: "Gowun Batang, serif" }}>
      
      {/* HEADER MÓVIL */}
      <div className="md:hidden flex items-center justify-between bg-gray-100 border-b border-gray-300 px-4 py-2 flex-shrink-0">
        <img 
          src="/public/logo.png" 
          alt="Farbiopharma" 
          className="h-8 w-auto object-contain" 
        />
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-[#17243D] hover:text-white transition duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* SIDEBAR */}
      <aside
        className={`fixed md:relative z-40 transition-all duration-300 ease-in-out bg-white border-r border-slate-200 flex flex-col h-full
          ${mobileMenuOpen ? "left-0" : "-left-full"} md:left-0 
          ${isCollapsed ? "md:w-20" : "md:w-64"} w-64`}
      >
        <div className="p-4 flex flex-col h-full">
          {/* Botón Colapsar (Desktop) */}
          <button
            onClick={toggleSidebar}
            className="hidden md:flex h-10 w-10 bg-gray-200 rounded-full items-center justify-center hover:bg-gray-300 transition mb-4 self-end"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={`w-5 h-5 transform transition ${isCollapsed ? "rotate-180" : ""}`}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>

          {/* Perfil Usuario */}
          <div className={`flex items-center mb-6 transition-all ${isCollapsed ? "justify-center" : "px-2"}`}>
            <img
              src={getHDImage(perfilUsuario?.avatarUsuario) || "/usuarioSinfoto.jpg"}
              alt="Avatar"
              className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm"
            />
            {!isCollapsed && (
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-bold text-gray-800 truncate">{perfilUsuario?.nombre || "Usuario"}</p>
                <p className="text-xs text-gray-500 capitalize">{userRole || "usuario"}</p>
              </div>
            )}
          </div>

          <hr className="border-slate-200 mb-6" />

          {/* Navegación */}
          <nav className="flex-1 overflow-y-auto">
            <ul className="space-y-2 text-sm">
              
              {/* Menú Usuario Estándar (No Admins) */}
              {!esAdministrador && (
                <>
                  {/* Enlace común para todos (Mis Tablas/Insumos) */}
                  <li>
                    <Link
                        to="/dashboard/tablas"
                        onClick={handleMenuItemClick}
                        className={`flex items-center p-2 rounded-lg transition ${
                          urlActual === "/dashboard/tablas"
                            ? `${activeColorsByRole[userRole]} font-bold`
                            : `hover:${activeColorsByRole[userRole]} bg-transparent`
                        } ${isCollapsed ? "justify-center" : ""}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`w-6 h-6 transition-opacity ${
                            urlActual === "/dashboard/tablas" ? "opacity-100" : "opacity-70"
                          }`}
                        >
                          <path d="M9.615 20h-2.615a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8M14 19l2 2 4-4M9 8h4M9 12h2" />
                        </svg>
                        <span className={isCollapsed ? "hidden" : "ml-3"}>Códigos</span>
                      </Link> 
                  </li>

                  {/* MODULO EXCLUSIVO PARA SOLICITANTE */}
                  {esSolicitante && (
                    <>
                      <li>
                        <Link
                          to="/dashboard/insumos"
                          onClick={handleMenuItemClick}
                          className={`flex items-center p-2 rounded-lg transition ${
                            urlActual === "/dashboard/insumos"
                              ? "bg-[#B2EBF2] text-black font-bold"
                              : "text-black hover:bg-[#B2EBF2]"
                          } ${isCollapsed ? "justify-center" : ""}`}
                        >
                          {/* SVG REEMPLAZANDO A LA IMAGEN ANTERIOR */}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor" /* Cambia de color solo con el texto de Tailwind */
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`w-6 h-6 transition-opacity ${
                                      urlActual === "/dashboard/insumos" ? "opacity-100" : "opacity-70"
                                    }`}     
                          >
                            <path d="M14 10a2 2 0 1 0 4 0 2 2 0 1 0-4 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM12.5 11.5l-4 4 1.5 1.5M12 15l-1.5-1.5" />
                          </svg>
                          {!isCollapsed && <span className="ml-3">Nuevo Insumo</span>}
                        </Link>
                      </li>

                      {/* NUEVA OPCIÓN: Seguimiento de estados basado en image_87469b.png */}
                      <li>
                        <Link
                          to="/dashboard/mis-solicitudes"
                          onClick={handleMenuItemClick}
                          className={`flex items-center p-2 rounded-lg transition ${
                          urlActual === "/dashboard/mis-solicitudes"
                            ? "bg-[#B2EBF2] text-black font-bold"
                            : "text-black hover:bg-[#B2EBF2]"
                        } ${isCollapsed ? "justify-center" : ""}`}
                        >
                          {/* SVG REEMPLAZANDO A LA IMAGEN ANTERIOR */}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor" /* Permite que el color cambie con el texto de Tailwind */
                            strokeWidth="1.5"     /* Ajustado un poco para mejor visibilidad, puedes dejar 1 si prefieres */
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`w-6 h-6 transition-opacity ${
                              urlActual === "/dashboard/insumos" ? "opacity-100" : "opacity-70"
                            }`}
                          >
                            <path d="M13 5h8" />
                            <path d="M13 9h5" />
                            <path d="M13 15h8" />
                            <path d="M13 19h5" />
                            <path d="M3 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" />
                            <path d="M3 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" />
                          </svg>
                          {!isCollapsed && <span className="ml-3">Estado Solicitudes</span>}
                        </Link>
                      </li>
                    </>
                  )}
                </>
              )}

              {/* Menú Administrador */}
              {esAdministrador && (
                <>
                  <p className={`text-[10px] font-bold text-gray-400 uppercase mb-2 mt-4 ${isCollapsed ? "text-center" : "px-2"}`}>Admin</p>
                  {[
                    { path: "/dashboard/admin/usuarios", label: "Usuarios", icon: "user" },
                    { path: "/dashboard/admin/reportes", label: "Reportes", icon: "chart" },
                  ].map((item) => (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={handleMenuItemClick}
                        className={`flex items-center p-2 rounded-lg transition ${
                          urlActual === item.path
                            ? "bg-sky-100 text-sky-700"
                            : "text-slate-600 hover:bg-slate-100"
                        } ${isCollapsed ? "justify-center" : ""}`}
                      >
                        <div className="w-5 h-5 flex items-center justify-center">
                          {item.icon === "user" ? (
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                          ) : (
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2V17zm4 0h-2V7h2V17zm4 0h-2v-4h2V17z" /></svg>
                          )}
                        </div>
                        {!isCollapsed && <span className="ml-3">{item.label}</span>}
                      </Link>
                    </li>
                  ))}
                </>
              )}
            </ul>
          </nav>

          {/* Logout */}
          <div className="mt-auto pt-4">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center p-2 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition ${isCollapsed ? "justify-center" : ""}`}
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
              </svg>
              {!isCollapsed && <span className="ml-3 font-medium">Cerrar Sesión</span>}
            </button>
          </div>
        </div>
      </aside>
      
      {/* CONTENIDO PRINCIPAL */}
      <main className={`flex-1 min-h-screen overflow-y-auto bg-gradient-to-br ${currentBg}`}>
        <div className="p-4 md:p-8 min-h-full">
          <Outlet />
        </div>
      </main>

      {/* Overlay para móvil */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;