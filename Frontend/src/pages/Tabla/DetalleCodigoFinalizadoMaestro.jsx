import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useFetch from '../../hooks/useFetch';
import storeAuth from '../../context/storeAuth';

const ETIQUETAS = {
  id: 'ID',
  codigo: 'Código SAP',
  status: 'Estado',
  descripcion: 'Descripción del solicitante',
  descripcion_sap: 'Descripción SAP',
  responsable_compras: 'Responsable de Compras',
  r_sap_descomprimido: 'Historial de Maestro de Datos',
  fecha: 'Fecha',
  creador: 'Creador',
};

const obtenerEtiqueta = (campo) =>
  ETIQUETAS[campo] || campo.replace(/_/g, ' ');

const tieneValor = (valor) =>
  valor !== null && valor !== undefined && valor !== '';

function ValorCampo({ valor }) {
  if (!tieneValor(valor)) {
    return <span className="text-slate-400">Sin información</span>;
  }

  if (typeof valor === 'boolean') {
    return <span>{valor ? 'Sí' : 'No'}</span>;
  }

  if (Array.isArray(valor)) {
    if (!valor.length) {
      return <span className="text-slate-400">Sin registros</span>;
    }

    return (
      <div className="space-y-3">
        {valor.map((elemento, index) => (
          <div
            key={index}
            className="rounded-xl border border-slate-200 bg-slate-50 p-3"
          >
            <ValorCampo valor={elemento} />
          </div>
        ))}
      </div>
    );
  }

  if (typeof valor === 'object') {
    return (
      <dl className="space-y-3">
        {Object.entries(valor).map(([campo, contenido]) => (
          <div key={campo} className="min-w-0">
            <dt className="mb-1 text-xs font-semibold uppercase text-slate-500">
              {obtenerEtiqueta(campo)}
            </dt>

            <dd className="min-w-0 whitespace-pre-wrap break-words">
              <ValorCampo valor={contenido} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  const texto = String(valor);

  if (/^https?:\/\/\S+$/i.test(texto)) {
    return (
      <a
        href={texto}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-blue-600 underline hover:text-blue-800"
      >
        {texto}
      </a>
    );
  }

  return <span className="whitespace-pre-wrap break-words">{texto}</span>;
}

function SeccionDatos({ titulo, campos, color = 'bg-slate-200' }) {
  if (!campos.length) return null;

  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <div className={`${color} px-6 py-5`}>
        <h2 className="text-xl font-bold text-slate-900">
          {titulo}
        </h2>
      </div>

      <dl className="grid grid-cols-1 gap-4 p-4 sm:p-6 md:grid-cols-2">
        {campos.map(([campo, valor]) => {
          const amplio =
            typeof valor === 'object' ||
            /descripcion|detalle|observacion|historial|link/i.test(campo);

          return (
            <div
              key={campo}
              className={`min-w-0 rounded-2xl border border-slate-200 p-4 shadow-sm ${
                amplio ? 'md:col-span-2' : ''
              }`}
            >
              <dt className="mb-2 break-words text-xs font-semibold uppercase tracking-wide text-slate-500">
                {obtenerEtiqueta(campo)}
              </dt>

              <dd className="min-w-0 text-sm leading-6 text-slate-800">
                <ValorCampo valor={valor} />
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

const DetalleCodigoFinalizadoMaestro = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = storeAuth();
  const { fetchDataBackend } = useFetch();

  const [codigo, setCodigo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Evita repetir la petición si el hook recrea su función al renderizar.
  const fetchRef = useRef(fetchDataBackend);

  useEffect(() => {
    fetchRef.current = fetchDataBackend;
  }, [fetchDataBackend]);

  useEffect(() => {
    let activo = true;

    const cargarCodigo = async () => {
      setLoading(true);
      setError('');
      setCodigo(null);

      if (!token) {
        setError('No hay una sesión activa.');
        setLoading(false);
        return;
      }

      try {
        // Se reutiliza el endpoint existente.
        const response = await fetchRef.current(
          `${import.meta.env.VITE_BACKEND_URL}/api/maestro/codigos/finalizados`,
          null,
          'GET',
          token,
          false
        );

        const registros = Array.isArray(response)
          ? response
          : Array.isArray(response?.codigos)
            ? response.codigos
            : Array.isArray(response?.items)
              ? response.items
              : null;

        if (!registros) {
          throw new Error('La respuesta no contiene una lista de códigos.');
        }

        const encontrado = registros.find(
          (item) => String(item.id) === String(id)
        );

        if (activo) {
          if (encontrado) {
            setCodigo(encontrado);
          } else {
            setError('No se encontró el código en los registros finalizados.');
          }
        }
      } catch (err) {
        console.error('Error consultando el código finalizado:', err);

        if (activo) {
          setError('No se pudo cargar la información del código.');
        }
      } finally {
        if (activo) setLoading(false);
      }
    };

    cargarCodigo();

    return () => {
      activo = false;
    };
  }, [id, token]);

  const generales = [];
  const compras = [];
  const maestro = [];
  const adicionales = [];

  if (codigo) {
    Object.entries(codigo).forEach(([campo, valor]) => {
      if (['id', 'codigo', 'status', 'descripcion'].includes(campo)) {
        generales.push([campo, valor]);
      } else if (campo === 'responsable_compras') {
        compras.push([campo, valor]);
      } else if (
        ['descripcion_sap', 'r_sap_descomprimido'].includes(campo)
      ) {
        maestro.push([campo, valor]);
      } else {
        adicionales.push([campo, valor]);
      }
    });
  }

  return (
    <div
      className="min-h-full w-full min-w-0 bg-white"
      style={{ fontFamily: 'Gowun Batang, serif' }}
    >
      <header className="bg-blue-100 px-6 py-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-800">
          Maestro de Datos · Códigos finalizados
        </p>

        <h1 className="mt-2 text-3xl font-bold text-black sm:text-4xl">
          Código #{id}
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Información del código y datos registrados en el proceso
        </p>
      </header>

      <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        {loading ? (
          <div role="status" className="p-10 text-center text-slate-500">
            Cargando información del código...
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700"
          >
            {error}
          </div>
        ) : codigo ? (
          <>
            <SeccionDatos
              titulo="Información del código"
              campos={generales}
            />

            <SeccionDatos
              titulo="Información de Compras"
              campos={compras}
              color="bg-green-100"
            />

            <SeccionDatos
              titulo="Información de Maestro de Datos"
              campos={maestro}
              color="bg-blue-100"
            />

            <SeccionDatos
              titulo="Información adicional"
              campos={adicionales}
            />
          </>
        ) : null}

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-4 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          ← Volver
        </button>
      </main>
    </div>
  );
};

export default DetalleCodigoFinalizadoMaestro;