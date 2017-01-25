import db from 'sqlite';
import {app} from './server';

(async function init() {
  await db.open(process.env.DATABASE || './db.sqlite');
  await db.migrate();

  process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS || `${__dirname}/credentials.json`;

  app.listen(process.env.PORT || 8080, process.env.HOST || '127.0.0.1', () => {
    console.log('Server started...');
  });
})();