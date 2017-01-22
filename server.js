import express from 'express';
import bodyParser from 'body-parser';
import db from 'sqlite';
import os from 'os';

import api from './api';

const app = express();
app.use(bodyParser.json());
app.use('/api', api);

(async function init() {
    await db.open(process.env.DATABASE || './db.sqlite');
    await db.migrate({ force: 'last' });

    app.listen(process.env.PORT || 8080, process.env.HOST || '127.0.0.1', () => {
        console.log('Server started...');
    });
})();
