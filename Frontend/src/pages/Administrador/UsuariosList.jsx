import EliminarUsuario from './EliminarUsuario';

const UsuariosList = ({ usuarios, loading, onEdit, onDelete, token }) => {
  return (
    <div className="bg-[#f8f9fa] p-8 rounded-lg mb-8 border border-gray-200">
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#17243D]">Lista de Usuarios</h2>
          <p className="text-gray-600 mt-1">Revisa los usuarios activos y administra sus permisos.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-600">Cargando usuarios...</div>
      ) : usuarios.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No hay usuarios registrados.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-[#17243D] text-white text-left">
              <tr>
                <th className="p-3 border border-[#dee2e6]">ID</th>
                <th className="p-3 border border-[#dee2e6]">Nombre</th>
                <th className="p-3 border border-[#dee2e6]">Email</th>
                <th className="p-3 border border-[#dee2e6]">Username</th>
                <th className="p-3 border border-[#dee2e6]">Cédula</th>
                <th className="p-3 border border-[#dee2e6]">Rol</th>
                <th className="p-3 border border-[#dee2e6]">Creado</th>
                <th className="p-3 border border-[#dee2e6] text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario, index) => (
                <tr key={usuario.id} className={index % 2 === 0 ? 'bg-[#f8f9fa]' : 'bg-white'}>
                  <td className="p-3 border border-[#dee2e6] text-[#17243D]">{usuario.id}</td>
                  <td className="p-3 border border-[#dee2e6] text-[#17243D] font-medium">{usuario.nombre}</td>
                  <td className="p-3 border border-[#dee2e6] text-[#17243D]">{usuario.email}</td>
                  <td className="p-3 border border-[#dee2e6] text-[#17243D]">{usuario.username || '-'}</td>
                  <td className="p-3 border border-[#dee2e6] text-[#17243D]">{usuario.cedula}</td>
                  <td className="p-3 border border-[#dee2e6]">
                    <span className="px-3 py-1 bg-[#dee2e6] text-[#17243D] rounded-full text-sm font-semibold">
                      {usuario.rol}
                    </span>
                  </td>
                  <td className="p-3 border border-[#dee2e6] text-[#17243D]">
                    {new Date(usuario.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3 border border-[#dee2e6] text-center">
                    <div className="flex flex-wrap gap-2 justify-center">
                      <button
                        onClick={() => onEdit(usuario)}
                        className="bg-[#17243D] hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition text-sm font-semibold"
                      >
                        Editar
                      </button>
                      <EliminarUsuario id={usuario.id} onDeleted={onDelete} token={token} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UsuariosList;
