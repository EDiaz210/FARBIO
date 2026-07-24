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
  codigo = '' // <-- Añadido para identificar el código creado
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
    const titulo = `📢 <b>${evento.toUpperCase()}</b>`;
    let mensaje = '';

    const eventoLower = evento.toLowerCase();

    // 1. Flujo de Finalización (Código Creado)
    if (estadoEtapa === 'Finalizado' || eventoLower.includes('finalizado') || eventoLower.includes('creado')) {
      mensaje = `
${titulo}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 El código <b>${codigo || 'solicitado'}</b> ha sido creado exitosamente.
💬 <b>Comentario:</b> ${comentario || 'Sin observaciones'}
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
${titulo}
💬 <b>Comentario:</b> ${comentario || 'Sin comentario'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ <b>${devueltosSolicitante}</b> código(s) devuelto(s) / rechazado(s)
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
${titulo}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 <b>${pendientes}</b> código(s) pendiente(s) en esta etapa
`.trim();

      if (estadoEtapa === 'Nuevo' || estadoEtapa === 'Solicitante') {
        mensaje += `\n⚠️ <b>${devueltos}</b> código(s) devuelto(s) / rechazado(s)`;
      }
    }

    await bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });

  } catch (error) {
    console.error(` Error al notificar al grupo de ${destinoEtapa}:`, error.message);
  }
};