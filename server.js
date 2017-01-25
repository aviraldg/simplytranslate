import express from 'express';
import bodyParser from 'body-parser';

// Need this before we import api, it uses this.
import './common';

import api from './api';

export const app = express();
app.use(bodyParser.json())
  .use('/api', api)
  .use(express.static('public'))
  .use(express.static('dist'))
  // Fallback to index.html for any unmatched route. Required for app side routing.
  .use((req, res) => res.sendFile(`${__dirname}/public/index.html`));
