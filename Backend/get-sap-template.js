import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.SAP_URL;
const SAP_USERNAME = process.env.SAP_USERNAME;
const SAP_PASSWORD = process.env.SAP_PASSWORD;
const SAP_COMPANYDB = process.env.SAP_COMPANYDB;

// Desactivar verificación SSL (solo para desarrollo)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function authenticateSAP() {
  try {
    console.log('🔐 Autenticando con SAP...\n');
    
    const response = await fetch(`${BASE_URL}/Login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        UserName: SAP_USERNAME,
        Password: SAP_PASSWORD,
        CompanyDB: SAP_COMPANYDB
      })
    });

    if (!response.ok) {
      throw new Error(`SAP Auth failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.SessionId;

  } catch (error) {
    console.error('❌ Error en autenticación SAP:', error.message);
    throw error;
  }
}

async function getItemTemplate(sessionId) {
  try {
    console.log('📦 Obteniendo template de Items...\n');
    
    const response = await fetch(
      `${BASE_URL}/Items?$top=1`,
      {
        headers: {
          Cookie: `B1SESSION=${sessionId}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    console.log('✅ Campos disponibles en Items:\n');
    console.log(Object.keys(data.value[0]));
    
    return Object.keys(data.value[0]);

  } catch (error) {
    console.error('❌ Error obteniendo template:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const sessionId = await authenticateSAP();
    console.log(`✓ SessionId: ${sessionId}\n`);
    
    await getItemTemplate(sessionId);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
