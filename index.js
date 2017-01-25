import db from 'sqlite';
import {app} from './server';

(async function init() {
  await db.open(process.env.DATABASE || './db.sqlite');
  await db.migrate();

  process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS || `${__dirname}/credentials.json`;

  const host = process.env.HOST || '127.0.0.1';
  const port = process.env.PORT || 8080;

  app.listen(port, host, () => {
    console.log(`Server started... ${host}:${port}`);
  });
})();