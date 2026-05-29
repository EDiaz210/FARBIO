import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import useFetch from '../hooks/useFetch';
import { ToastContainer } from 'react-toastify';
import storeAuth from '../context/storeAuth';


const Login = () => {
    const navigate = useNavigate()
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [showPassword, setShowPassword] = useState(false);
    const [cargando, setCargando] = useState(false);
    const { fetchDataBackend } = useFetch();
    const { setToken, setUser, setRol } = storeAuth();

    const loginUser = async (data) => {
      setCargando(true);
      try {
        const url = `${import.meta.env.VITE_BACKEND_URL}/api/users/login`;
        const response = await fetchDataBackend(url, data, 'POST', null);
        
        if (response?.token && response?.usuario) {
          setToken(response.token);
          setUser(response.usuario);
          setRol(response.usuario.rol);
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error en login:', error);
      } finally {
        setCargando(false);
      }
    };

    useEffect(() => {
        const link = document.createElement("link");
        link.href="https://fonts.googleapis.com/css2?family=Gowun+Batang&display=swap";
        link.rel = "stylesheet";
        document.head.appendChild(link);
        return () => {
        document.head.removeChild(link);
    };
    }, []);

return (
  <div className="flex flex-col sm:flex-row h-screen bg-black overflow-hidden" style={{ fontFamily: 'Gowun Batang, serif' }}>
    <ToastContainer />

    {/* ------------------- Imagen de fondo (fija) ------------------- */}
    <div
      className="hidden sm:block sm:w-8/12 h-screen relative bg-[url('/fondo-login.jpg')] bg-no-repeat bg-cover bg-center"
      style={{ backgroundAttachment: 'fixed' }}
    >
      {/* Capa de mejora visual */}
      <div className="absolute inset-0 bg-black/30 backdrop-brightness-110"></div>

      {/* Textura ligera */}
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/black-linen.png')] mix-blend-overlay"></div>
    </div>

    {/* ------------------- Contenedor del formulario (scrollable) ------------------- */}
    <div className="w-full sm:w-4/12 bg-[#ffff] flex justify-center overflow-y-auto">
      <div className="w-full max-w-[500px] px-4 py-10 flex flex-col items-center min-h-screen">

        {/* Logo */}
        <div className="flex items-center justify-center mb-5">
          <img
            src="/logo.png"
            alt="logo"
            className="w-[200px] h-[200px] object-contain drop-shadow-lg"
          />
        </div>

        {/* Título */}
        <h1 className="text-3xl font-semibold text-center text-[#17243D] mb-5">
          Iniciar sesión
        </h1>

        {/* ------------------- Formulario ------------------- */}
        <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit(loginUser)}>

          {/* Email */}
          <div className="flex flex-col w-full min-w-0">
            <input
              type="email"
              placeholder="Email"
              className="p-3 w-full bg-[#dee2e6] rounded-lg text-[#17243D] max-w-full"
              {...register("email", { 
                required: "El email es obligatorio",
                pattern: {
                  value: /^[^@]+@(farbiopharma\.com|inpel\.com)$/,
                  message: "Debes usar email @farbiopharma.com o @inpel.com"
                }
              })}
            />
            {errors.email && (
              <p className="text-red-800 text-sm mt-1 ml-1">{errors.email.message}</p>
            )}
          </div>

          {/* Contraseña */}
          <div className="flex flex-col w-full min-w-0 relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              className="p-3 pr-10 w-full bg-[#dee2e6] rounded-lg text-[#17243D] max-w-full"
              {...register("password", { 
                required: "La contraseña es obligatoria",
                minLength: {
                  value: 14,
                  message: "La contraseña debe tener mínimo 14 caracteres"
                }
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute top-1/2 right-3 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 flex items-center justify-center"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#000000"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#000000"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.05 10.05 0 0112 20c-6 0-10-8-10-8a18.92 18.92 0 014.05-5.48" />
                  <path d="M1 1l22 22" />
                  <path d="M9.88 9.88a3 3 0 014.24 4.24" />
                </svg>
              )}
            </button>
            {errors.password && (
              <p className="text-red-800 text-sm mt-1 ml-1">
                {errors.password?.message || "La contraseña es obligatoria"}
              </p>
            )}
          </div>

          {/* Botón iniciar sesión */}
          <button
            type="submit"
            disabled={cargando}
            className="flex items-center justify-center gap-2 bg-[#17243D] hover:bg-[#EF3340] text-white px-6 py-2 rounded-md font-medium transition disabled:opacity-50 disabled:cursor-not-allowed mt-2 shrink"
          >
            {cargando ? 'Iniciando...' : 'Iniciar sesión'}
          </button>
        </form>

      </div>
    </div>
  </div>
);

}



export default Login;
