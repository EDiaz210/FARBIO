import TelegramBot from 'node-telegram-bot-api';

const token = process.env.TELEGRAM_TOKEN;

if (!token) {
  console.warn('⚠️ TELEGRAM_TOKEN no está configurado en las variables de entorno.');
}

const bot = new TelegramBot(token, { polling: true });

// Escuchar mensajes para obtener el Chat ID
bot.on('message', (msg) => {
  console.log("📌 Información del chat Telegram:");
  console.log({
    nombre: msg.chat.title || msg.from?.first_name,
    id: msg.chat.id,
    tipo: msg.chat.type
  });
});

bot.on('polling_error', (error) => {
  console.error('❌ Error en Telegram Polling:', error.code || error.message);
});

console.log("🤖 Bot de Telegram iniciado correctamente");

export default bot;