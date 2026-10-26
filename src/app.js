const express = require('express');
const indexRoutes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', indexRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
