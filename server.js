import express from 'express';
import bodyParser from 'body-parser';
import db from 'sqlite';
import os from 'os';

import api from './api';

const app = express();
app.use(bodyParser.json());
app.use('/api', api);

export default app;
