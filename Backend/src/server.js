import express from "express"; //framework
import cors from "cors"; 
import cloudinary from 'cloudinary'
import http from 'http';
import sapDataRoutes from './routers/SAP_routes.js';
import userRoutes from './routers/User_routes.js';
import codigosRoutes from './routers/Codigos_routes.js';
import solicitanteRoutes from './routers/Solicitante_routes.js';
import comprasRoutes from './routers/Compras_routes.js';
import contabilidadRoutes from './routers/Contabilidad_routes.js';
import maestroRoutes from './routers/Maestro_routes.js';
import reportesRoutes from './routers/Reportes_routes.js';


//Inicializaciones
const app = express();


const corsOptions = {
  origin: [
    process.env.FRONTEND_URL,
  ],
  methods: ["GET", "POST", "PUT", "DELETE",'PATCH', "OPTIONS"],
  credentials: true,
};


app.use(cors(corsOptions));


app.use(express.json()); //guarda la informacion del frontend en un archivo json para procesar el backend
app.use(express.urlencoded({ extended: true }));

//Configuraciones
app.set('port', process.env.PORT || 3000) 

// Rutas 
app.get('/',(req,res)=>{
    res.send("Servidor funcionando correctamente - Backend")
})


// Rutas de datos maestros de SAP
app.use('/api/sap', sapDataRoutes);

// Rutas de Usuarios
app.use('/api/users', userRoutes);

// Rutas de Códigos
app.use('/api/codigos', codigosRoutes);

// Rutas de Solicitante
app.use('/api/solicitante', solicitanteRoutes);

// Rutas de Compras
app.use('/api/compras', comprasRoutes);

// Rutas de Contabilidad
app.use('/api/contabilidad', contabilidadRoutes);

// Rutas de Maestro de datos
app.use('/api/maestro', maestroRoutes);

// Rutas de Reportes
app.use('/api/reportes', reportesRoutes);



const server = http.createServer(app);

// Manejo de una ruta que no sea encontrada
app.use((req,res)=>res.status(404).send("Endpoint no encontrado - 404"))

//Exportar la instancia
export  { app, server }

