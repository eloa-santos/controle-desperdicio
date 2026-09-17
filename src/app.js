const express = require('express');
const cors = require('cors');
const turmaRoutes = require('./routes/turmaRoutes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));

app.use(express.json());

app.use('/api/turmas', turmaRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
