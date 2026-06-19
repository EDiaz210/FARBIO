import axios from 'axios';
import https from 'https';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

const loginToSap = async () => {
  const loginResponse = await axios.post(`${process.env.SAP_URL}/Login`, {
    CompanyDB: process.env.SAP_COMPANYDB,
    UserName: process.env.SAP_USERNAME,
    Password: process.env.SAP_PASSWORD
  }, {
    httpsAgent
  });

  return loginResponse.data.SessionId;
};

const logoutFromSap = async (sessionId) => {
  await axios.post(`${process.env.SAP_URL}/Logout`, {}, {
    httpsAgent,
    headers: {
      'Cookie': `B1SESSION=${sessionId}`
    }
  }).catch(err => console.warn('Error cerrando sesión:', err.message));
};


 // Obtiene todos los grupos de IVA de SAP
  const obtenerVatGroups = async (req, res) => {
  try {
    console.log('Obteniendo VatGroups reales de SAP...');
    
    // 1. Iniciar sesión en SAP
    const loginResponse = await axios.post(`${process.env.SAP_URL}/Login`, {
      CompanyDB: process.env.SAP_COMPANYDB,
      UserName: process.env.SAP_USERNAME,
      Password: process.env.SAP_PASSWORD
    }, { 
      httpsAgent: httpsAgent
    });

    const sessionId = loginResponse.data.SessionId;
    console.log(`Sesión iniciada: ${sessionId}`);

    // 2. Obtener los VatGroups correctos (Filtramos solo lo necesario para el frontend)
    // El $select nos ayuda a traer solo el Código (Code), Nombre (Name) y Tipo (Category)
    const vatGroupsResponse = await axios.get(
      `${process.env.SAP_URL}/SalesTaxAuthorities?$select=Code,Name,Type`,
      {
        httpsAgent: httpsAgent,
        headers: {
          'Cookie': `B1SESSION=${sessionId}`
        }
      }
    );


    // 3. Cerrar sesión
    await axios.post(`${process.env.SAP_URL}/Logout`, {}, { 
      httpsAgent: httpsAgent,
      headers: {
        'Cookie': `B1SESSION=${sessionId}`
      }
    }).catch(err => console.warn('Error cerrando sesión:', err.message));

    // 4. Responder al Frontend
    res.status(200).json({
      success: true,
      message: 'Grupos de IVA obtenidos exitosamente para el maestro de artículos',
      data: vatGroupsResponse.data.value || []
    });

  } catch (error) {
    console.error('Error en obtenerVatGroups:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Error al obtener VatGroups de SAP',
      error: error.response?.data || error.message
    });
  }
};


 //Obtiene todos los grupos de artículos de SAP

 const obtenerItemsGroups = async (req, res) => {
  try {
    console.log('Obteniendo Items Groups de SAP...');
    
    // 1. Iniciar sesión en SAP
    const loginResponse = await axios.post(`${process.env.SAP_URL}/Login`, {
      CompanyDB: process.env.SAP_COMPANYDB,
      UserName: process.env.SAP_USERNAME,
      Password: process.env.SAP_PASSWORD
    }, { 
      httpsAgent: httpsAgent
    });

    const sessionId = loginResponse.data.SessionId;
    console.log(`Sesión iniciada: ${sessionId}`);

    // 2. Obtener Items Groups
    const itemsGroupsResponse = await axios.get(
      `${process.env.SAP_URL}/ItemGroups?$select=Number,GroupName&$filter=Number eq 143 or Number eq 145 or Number eq 144 or Number eq 147 or Number eq 146 or Number eq 148
      or Number eq 149 or Number eq 217 or Number eq 150 or Number eq 139 or Number eq 138 or Number eq 197 or Number eq 211 or Number eq 193 or Number eq 197 or Number eq 187
      or Number eq 186 or Number eq 142 or Number eq 152 or Number eq 178 or Number eq 192 or Number eq 151 or Number eq 174 or Number eq 134 or Number eq 173 or Number eq 137 
      or Number eq 136 or Number eq 135 or Number eq 180 or Number eq 194 or Number eq 208 or Number eq 209 or Number eq 198 or Number eq 133 or Number eq 175 or Number eq 176 
      or Number eq 154 or Number eq 153 or Number eq 155`,
      {
        httpsAgent: httpsAgent,
        headers: {
          'Cookie': `B1SESSION=${sessionId}`,
          'Prefer': 'odata.maxpagesize=0',    // Desactiva paginación para traer TODOS
          'Content-Type': 'application/json'
        }
      }
    );

    // 3. Cerrar sesión
    await axios.post(`${process.env.SAP_URL}/Logout`, {}, { 
      httpsAgent: httpsAgent,
      headers: {
        'Cookie': `B1SESSION=${sessionId}`
      }
    }).catch(err => console.warn('Error cerrando sesión:', err.message));

    res.status(200).json({
      success: true,
      message: 'Items Groups obtenidos exitosamente',
      data: itemsGroupsResponse.data.value
    });

  } catch (error) {
    console.error('Error en obtenerItemsGroups:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Error al obtener Items Groups',
      error: error.response?.data || error.message
    });
  }
};



// Obtiene todos los Items de SAP
const obtenerItems = async (req, res) => {
  try {
    console.log('Obteniendo Items de SAP...');
    
    // 1. Iniciar sesión en SAP
    const sessionId = await loginToSap();
    console.log(`Sesión iniciada: ${sessionId}`);

    // 2. Intentar obtener Orders (nota: endpoint puede variar según versión de SAP)
    let unitsData = [];
    try {
      const unitsResponse = await axios.get(
        `${process.env.SAP_URL}/Items`,
        {
          httpsAgent: httpsAgent,
          headers: {
            'Cookie': `B1SESSION=${sessionId}`
          }
        }
      );
      unitsData = unitsResponse.data.value || [];
    } catch (error) {
      console.warn('Endpoint Items no disponible, intentando alternativas...');
      // El endpoint puede no existir en esta versión de SAP
      unitsData = [];
    }

    // 3. Cerrar sesión
    await logoutFromSap(sessionId);

    res.status(200).json({
      success: true,
      message: 'Items obtenidos',
      data: unitsData
    });

  } catch (error) {
    console.error('Error en obtenerItems:', error.response?.data || error.message);
    res.status(200).json({
      success: true,
      message: 'Items (vacío - endpoint no disponible)',
      data: []
    });
  }
};


// Busca un item específico en SAP por código de item
const buscarItemSAP = async (req, res) => {
  try {
    const itemCode = req.params.itemCode || req.query.itemCode || req.query.code;

    if (!itemCode) {
      return res.status(400).json({
        success: false,
        message: 'Debes enviar el código del item para buscarlo en SAP'
      });
    }

    console.log(`Buscando item en SAP: ${itemCode}`);

    const sessionId = await loginToSap();
    console.log(`Sesión iniciada: ${sessionId}`);

    const itemResponse = await axios.get(
      `${process.env.SAP_URL}/Items('${encodeURIComponent(itemCode)}')`,
      {
        httpsAgent,
        headers: {
          'Cookie': `B1SESSION=${sessionId}`
        }
      }
    );

    await logoutFromSap(sessionId);

    return res.status(200).json({
      success: true,
      message: 'Item encontrado en SAP',
      data: itemResponse.data
    });
  } catch (error) {
    console.error('Error en buscarItemSAP:', error.response?.data || error.message);

    const statusCode = error.response?.status || 500;

    return res.status(statusCode).json({
      success: false,
      message: 'No se pudo obtener el item desde SAP',
      error: error.response?.data || error.message
    });
  }
};


export { obtenerVatGroups, obtenerItemsGroups, obtenerItems, buscarItemSAP };



