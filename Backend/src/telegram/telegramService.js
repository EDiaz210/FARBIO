import bot from './telegram.config.js';
import pool from '../database.js';

const CHAT_IDS = {
  'Solicitante': process.env.TELEGRAM_SOLICITANTES_CHAT_ID,
  'Nuevo': process.env.TELEGRAM_COMPRAS_CHAT_ID,
  'En Contabilidad': process.env.TELEGRAM_CONTABILIDAD_CHAT_ID,
  'Con Maestro de Datos': process.env.TELEGRAM_MAESTRO_DATOS_CHAT_ID
};

export const notificarResumenPorEstado = async (
  estadoEtapa, 
  comentario = '', 
  evento = 'Actualización de Código',
  codigo = '',
  solicitante = '',
  empresa = ''
) => {
  // Si la etapa es Finalizado, la notificación siempre va al grupo de Solicitantes
  const destinoEtapa = (estadoEtapa === 'Finalizado' || evento.toLowerCase().includes('finalizado')) 
    ? 'Solicitante' 
    : estadoEtapa;

  const chatId = CHAT_IDS[destinoEtapa];

  if (!chatId) {
    console.warn(`⚠️ No hay un Chat ID configurado en .env para la etapa: ${destinoEtapa}`);
    return;
  }

  try {
    let mensaje = '';
    const eventoLower = evento.toLowerCase();
    const lineaSolicitante = solicitante ? `👤 <b>Solicitante:</b> ${solicitante}\n` : '';
    const lineaEmpresa = empresa ? `🏢 <b>Empresa:</b> ${empresa}\n` : '';

    // 1. Flujo de Finalización (Código Creado)
    if (estadoEtapa === 'Finalizado' || eventoLower.includes('finalizado') || eventoLower.includes('creado')) {
      mensaje = `
🟢 <b>${evento.toUpperCase()}</b>
➖➖➖➖➖➖➖➖➖➖➖➖
${lineaSolicitante}
${lineaEmpresa}
📦 <b>Código generado:</b> <code>${codigo }</code>
💬 <b>Descripción:</b> <i>"${comentario}"</i>

✨ <i>El código ya se encuentra disponible para su uso.</i>
`.trim();

    // 2. Flujo de Rechazo / Devolución
    } else if (eventoLower.includes('rechazado') || eventoLower.includes('retornado') || eventoLower.includes('devuelto')) {
      const query = `
        SELECT COUNT(*) as devueltos 
        FROM codigos 
        WHERE status = 'RetornoSolicitante'
      `;
      const [filas] = await pool.query(query);
      const devueltosSolicitante = filas[0]?.devueltos || 0;

      mensaje = `
🔴 <b>${evento.toUpperCase()}</b>
➖➖➖➖➖➖➖➖➖➖➖➖
💬 <b>Motivo:</b> <i>"${comentario || 'No se especificó un motivo.'}"</i>

🚨 <b>Atención:</b> Hay <b>${devueltosSolicitante}</b> código(s) en la bandeja de devueltos que requieren revisión.
`.trim();

    // 3. Flujos normales (Pendientes generales)
    } else {
      let query = '';
      let params = [];

      if (estadoEtapa === 'Nuevo' || estadoEtapa === 'Solicitante') {
        query = `
          SELECT status, COUNT(*) as total 
          FROM codigos 
          WHERE status IN ('Nuevo', 'RetornoSolicitante', 'RetornoCompras')
          GROUP BY status
        `;
      } else {
        query = `
          SELECT status, COUNT(*) as total 
          FROM codigos 
          WHERE status = ?
          GROUP BY status
        `;
        params = [estadoEtapa];
      }

      const [filas] = await pool.query(query, params);

      let pendientes = 0;
      let devueltos = 0;

      filas.forEach((f) => {
        if (f.status === 'RetornoSolicitante' || f.status === 'RetornoCompras') {
          devueltos += f.total;
        } else if (f.status === estadoEtapa) {
          pendientes = f.total;
        }
      });

      mensaje = `
🔵 <b>${evento.toUpperCase()}</b>
➖➖➖➖➖➖➖➖➖➖➖➖
🏢 <b>Etapa actual:</b> ${estadoEtapa}
📌 <b>Pendientes de gestión:</b> <b>${pendientes}</b> código(s)
`.trim();

      if (estadoEtapa === 'Nuevo' || estadoEtapa === 'Solicitante') {
        mensaje += `\n⚠️ <b>Requieren corrección:</b> <b>${devueltos}</b> código(s) devuelto(s)`;
      }
      
      // Añadir comentario si existe incluso en etapas pendientes
      if (comentario) {
          mensaje += `\n\n💬 <b>Descripción:</b> <i>"${comentario}"</i>`;
      }
    }

    await bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });

  } catch (error) {
    console.error(`❌ Error al notificar al grupo de ${destinoEtapa}:`, error.message);
  }
};