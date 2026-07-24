import dotenv from 'dotenv';
import './database.js'; // Conectar a la base de datos al iniciar
import * as telegramService from './telegram/telegramService.js';


dotenv.config();

(async () => {
  const { app } = await import('./server.js');

  app.listen(app.get('port'), () => {
    console.log(`Servidor corriendo en http://localhost:${app.get('port')}`);
  });
})();