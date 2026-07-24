import { enviarMensajeTelegram } from '../telegram/telegram.service.js';
import { TELEGRAM_CHATS } from '../telegram/telegram.config.js';


export const enviarResumenCompras = async (
    solicitudesNuevas,
    solicitudesRetornadas
) => {

    const mensaje = `
🤖 <b>IRIS</b>

<b>Resumen Compras:</b>

📌 Solicitudes nuevas:
${solicitudesNuevas}

📌 Solicitudes retornadas:
${solicitudesRetornadas}
`;

    await enviarMensajeTelegram(
        TELEGRAM_CHATS.COMPRAS,
        mensaje
    );
};



export const enviarResumenContabilidad = async (
    solicitudesNuevas
) => {

    const mensaje = `
🤖 <b>IRIS</b>

<b>Resumen Contabilidad:</b>

📌 Solicitudes nuevas:
${solicitudesNuevas}
`;

    await enviarMensajeTelegram(
        TELEGRAM_CHATS.CONTABILIDAD,
        mensaje
    );
};



export const enviarResumenMaestroDatos = async (
    solicitudesNuevas
) => {

    const mensaje = `
🤖 <b>IRIS</b>

<b>Resumen Maestro de Datos:</b>

📌 Solicitudes nuevas:
${solicitudesNuevas}
`;

    await enviarMensajeTelegram(
        TELEGRAM_CHATS.MAESTRO_DATOS,
        mensaje
    );
};



export const notificarSolicitante = async (
    chatId,
    nombre,
    codigo,
    mensajeEstado
) => {

    const mensaje = `
🤖 <b>IRIS</b>

Hola ${nombre} 👋

${mensajeEstado}

Código:
<b>${codigo}</b>
`;

    await enviarMensajeTelegram(
        chatId,
        mensaje
    );
};