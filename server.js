import express from 'express';
import bodyParser from 'body-parser';
import db from 'sqlite';
import os from 'os';

import api from './api';

const app = express();
app.use(bodyParser.json());
app.use('/api', api);
app.use(express.static('public'));
app.use(express.static('dist'));

// Fallback to index.html for any unmatched route. Required for app side routing.
app.use((req, res) => res.sendFile(`${__dirname}/public/index.html`));

export default app;
