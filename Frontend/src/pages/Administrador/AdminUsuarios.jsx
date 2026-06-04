import { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import useFetch from '../../hooks/useFetch';
import storeAuth from '../../context/storeAuth';
import UsuariosList from './UsuariosList';
import CrearUsuario from './CrearUsuario';
import EditarUsuario from './EditarUsuario';

const AdminUsuarios = () => {
  const { fetchDataBackend } = useFetch();
  const { token } = storeAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modo, setModo] = useState('list');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  const obtenerUsuarios = async () => {
    setLoading(true);
    try {
      const url = `${import.meta.env.VITE_BACKEND_URL}/api/users/usuarios`;
      const response = await fetchDataBackend(url, null, 'GET', token);

      if (response?.usuarios) {
        setUsuarios(response.usuarios);
      } else {
        toast.error('No se pudo cargar la lista de usuarios');
      }
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      toast.error('Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      obtenerUsuarios();
    }
  }, [token]);

  const handleCrearUsuario = () => {
    setUsuarioSeleccionado(null);
    setModo('create');
  };

  const handleEditarUsuario = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setModo('edit');
  };

  const handleCancelar = () => {
    setModo('list');
    setUsuarioSeleccionado(null);
  };

  const handleExito = () => {
    obtenerUsuarios();
    setModo('list');
    setUsuarioSeleccionado(null);
  };

  const handleUsuarioEliminado = (id) => {
    setUsuarios((prev) => prev.filter((usuario) => usuario.id !== id));
  };

  return (
    <div className="w-full bg-white p-6 min-h-screen" style={{ fontFamily: 'Gowun Batang, serif' }}>
      <ToastContainer />

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[#17243D] mb-2">Gestión de Usuarios</h1>
            <p className="text-gray-600">Crea, edita y elimina usuarios del sistema</p>
          </div>
          <button
            onClick={modo === 'list' ? handleCrearUsuario : handleCancelar}
            className="bg-[#17243D] hover:bg-[#EF3340] text-white font-bold py-3 px-6 rounded-lg transition"
          >
            {modo === 'list' ? '+ Nuevo Usuario' : 'Volver a la lista'}
          </button>
        </div>

        {modo === 'list' && (
          <UsuariosList
            usuarios={usuarios}
            loading={loading}
            onEdit={handleEditarUsuario}
            onDelete={handleUsuarioEliminado}
            token={token}
          />
        )}

        {modo === 'create' && (
          <CrearUsuario token={token} onSuccess={handleExito} onCancel={handleCancelar} />
        )}

        {modo === 'edit' && usuarioSeleccionado && (
          <EditarUsuario
            token={token}
            usuario={usuarioSeleccionado}
            onSuccess={handleExito}
            onCancel={handleCancelar}
          />
        )}
      </div>
    </div>
  );
};

export default AdminUsuarios;
